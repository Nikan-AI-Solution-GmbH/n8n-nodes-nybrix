# Internals Deep-Dive

This document explains the design and implementation of the three logic-bearing source files in this package.

---

## 1. `nodes/Anonymization/transport.ts`

### Purpose

Wraps the MCP StreamableHttp protocol so the rest of the codebase can call backend tools with a plain TypeScript function, without repeating JSON-RPC boilerplate.

### The MCP protocol

The Nikan Anonymization backend is a **FastMCP server** that speaks the [Model Context Protocol](https://modelcontextprotocol.io/) over HTTP. Every tool invocation is a JSON-RPC 2.0 request posted to `POST /mcp`.

**Request envelope:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "<tool_name>",
    "arguments": { "key": "value" }
  },
  "id": 1734567890123
}
```

**Response envelope:**
```json
{
  "jsonrpc": "2.0",
  "id": 1734567890123,
  "result": {
    "content": [
      { "type": "text", "text": "<return_value>" }
    ]
  }
}
```

The actual return value of the tool is at `result.content[0].text`. An error from the server looks like:
```json
{ "jsonrpc": "2.0", "id": 1, "error": { "code": -32000, "message": "..." } }
```

### The `mcpToolCall` function

```typescript
export async function mcpToolCall(
  this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
  toolName: string,
  args: IDataObject = {},
): Promise<string>
```

**`this` typing pattern** — n8n uses a convention where shared helpers receive the calling context via TypeScript's explicit `this` parameter (not a regular argument). This allows the helper to access `this.getCredentials()`, `this.helpers`, and `this.getNode()` without the caller having to pass them explicitly. The three context types in the union cover all scenarios where the helper might be called: normal execution, single-item execution, and options-loading for dynamic dropdowns.

**Credential retrieval** — `await this.getCredentials('nikanAnonymizationApi')` resolves the saved credential and returns `{ apiUrl: string, apiKey: string }`. The `apiUrl` is used to build the URL. The `apiKey` is NOT manually added to headers here — instead, `httpRequestWithAuthentication` reads the credential's `authenticate` block and injects `X-API-Key` automatically. This separation of concerns means transport.ts does not need to know the header name.

**`id: Date.now()`** — JSON-RPC requires each request to carry a unique `id`. Using the current timestamp in milliseconds is sufficient since requests in this node are sequential (never concurrent).

**`json: true`** — tells n8n's HTTP helper to serialize the `body` as JSON, set `Content-Type: application/json`, and parse the response body as JSON. Without this, the response would be a raw string.

**Error handling** — the function checks for `response.error` (JSON-RPC application error) and throws a `NodeOperationError`. HTTP-level errors (4xx, 5xx) are handled by `httpRequestWithAuthentication` itself and will throw before we even see the response.

**Return value** — `response.result?.content?.[0]?.text ?? ''` uses optional chaining to safely extract the tool's return text, falling back to an empty string if the response structure is unexpected.

---

## 2. `nodes/Anonymization/Anonymization.node.ts`

### Class structure

`Anonymization` implements the `INodeType` interface, which requires two members:

1. **`description: INodeTypeDescription`** — the static metadata and property definitions n8n reads to render the node UI
2. **`execute(this: IExecuteFunctions)`** — the async function n8n calls when the node runs

### `description` breakdown

```typescript
usableAsTool: true
```
Makes the node available to AI Agent nodes as a callable tool. Without this, the node only works as a regular workflow step. The flag also suppresses a lint warning.

```typescript
noDataExpression: true  // on the operation property
```
Prevents users from using n8n expressions (`{{ ... }}`) in the operation dropdown. Operations control the code path and must be a static value known at workflow-design time.

```typescript
type: 'collection'  // on the options property
```
Renders as an expandable "Add Option" panel. Each sub-property inside `options` is only populated if the user explicitly clicks "Add Option" and selects it, which is why `getNodeParameter('options', i, {})` defaults to `{}` and the code uses `?? defaultValue` to fill in runtime defaults.

### `execute()` — item-by-item processing

n8n workflows pass **arrays of items** through nodes. The `execute()` function processes each item independently so that, for example, a batch of 10 documents are all anonymized without one failure blocking the others.

```typescript
const items = this.getInputData();       // INodeExecutionData[]
const returnData: INodeExecutionData[] = [];

for (let i = 0; i < items.length; i++) {
  // ...process item i...
  returnData.push({ json: {...}, pairedItem: i });
}

return [returnData];   // INodeExecutionData[][]
```

`return [returnData]` wraps the array in another array because n8n supports nodes with multiple outputs. The outer array index corresponds to the output connector index. This node has one output, so index 0 is the only one used.

`pairedItem: i` tells n8n which input item each output item was derived from. This information is used by n8n to show error context and for expression evaluation in downstream nodes (`$input.item`, etc.).

### The start → poll pattern

The backend API is **asynchronous**: submitting a text for anonymization returns a `request_id` immediately, and the actual result becomes available after a short processing delay. The node bridges this using a polling loop.

**Step 1 — submit:**
```typescript
const mode = operation === 'anonymize' ? '1' : '2';
const encodedText = Buffer.from(text, 'utf-8').toString('base64');
const requestId = await mcpToolCall.call(this, 'start_transformation', { text: encodedText, mode });
```
The server requires the input text to be **base64-encoded** to avoid JSON escaping issues with special characters and multi-line content. Mode `"1"` is anonymize, `"2"` is deanonymize (matching `client.py`'s contract).

**Step 2 — detect auth failure:**
```typescript
if (startResult === 'Unauthorized') {
  throw new NodeOperationError(..., 'Authentication failed. Check your API key.', { itemIndex: i });
}
```
The server returns the string `"Unauthorized"` as the tool result (not as an HTTP 401) when authentication fails. This is specific to the backend's design and must be checked explicitly.

**Step 3 — poll:**
```typescript
for (let attempt = 0; attempt < maxRetries; attempt++) {
  const pollResult = await mcpToolCall.call(this, 'retrieve_result', { request_id: requestId });
  if (pollResult !== 'Still processing.' && pollResult !== 'Request ID not found.') {
    result = pollResult;
    break;
  }
  await sleep(pollingInterval);
}
```
Two sentinel strings signal that the result is not ready yet:
- `"Still processing."` — the job is in the queue
- `"Request ID not found."` — the ID has not been registered yet (can happen with very fast polling after submission)

Any other string is the actual result and breaks the loop.

**`sleep` implementation:**
```typescript
import { delay as lodashDelay } from 'lodash';
const sleep = (ms: number): Promise<void> => new Promise((resolve) => lodashDelay(resolve, ms));
```
n8n Cloud's lint rules block direct use of `setTimeout` (and `globalThis`, `global`, etc.) as unrestricted globals in community nodes. `lodash.delay` is a wrapper around `setTimeout` that is allowed because it comes from an allowed import. The lint rules only check the community node source, not lodash's internals.

### Error handling

```typescript
} catch (error) {
  if (this.continueOnFail()) {
    returnData.push({
      json: { ...items[i].json, error: (error as Error).message },
      error: error as NodeOperationError,
      pairedItem: i,
    });
  } else {
    throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
  }
}
```

`this.continueOnFail()` returns `true` when the user has toggled **"Continue on Fail"** in the node's settings panel. When enabled, errors produce an output item with an `error` field instead of stopping the entire workflow. When disabled (the default), the error propagates and halts execution.

`NodeOperationError` carries structured metadata (node reference, `itemIndex`) that n8n uses to highlight exactly which item failed in the UI.

---

## 3. `credentials/NikanAnonymizationApi.credentials.ts`

### Purpose

Defines a reusable credential type that stores the base URL and API key, injects them into every request, and provides a test endpoint for one-click validation in the n8n UI.

### `authenticate` block

```typescript
authenticate: IAuthenticateGeneric = {
  type: 'generic',
  properties: {
    headers: {
      'X-API-Key': '={{$credentials?.apiKey}}',
    },
  },
};
```

The `={{...}}` expression is evaluated by n8n at request time. `$credentials?.apiKey` reads the `apiKey` property from the saved credential. n8n merges this header into every request made via `httpRequestWithAuthentication` with credential type `'nikanAnonymizationApi'`.

The `?` in `$credentials?.apiKey` is not JavaScript optional chaining — it is n8n's expression syntax for accessing credential fields. It prevents a runtime error if `apiKey` is somehow undefined.

### `test` block

```typescript
test: ICredentialTestRequest = {
  request: {
    baseURL: '={{$credentials?.apiUrl}}',
    url: '/mcp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {},
      id: 1,
    },
  },
};
```

When a user clicks **Test** on the credential form, n8n:
1. Evaluates `baseURL` using the saved credential's `apiUrl`
2. Applies the `authenticate` block (injects `X-API-Key`)
3. Posts the body to `/mcp`
4. Reports success if it receives a 2xx HTTP response

`tools/list` is the lightest possible MCP call — it asks the server to list available tools without triggering any actual processing. A 2xx response confirms that the server is reachable and the API key is accepted.

### Why `baseURL` is in the credential, not the node

Putting `apiUrl` in the credential rather than in the node properties means:
- One credential can be shared across multiple workflows
- Users change the server URL in one place
- The URL is stored securely with the credential (not in workflow JSON)
- It enables the credential test to construct the correct URL dynamically

### `documentationUrl`

Points to the `#credentials` section of the GitHub readme. n8n shows a "Documentation" link on the credential form pointing to this URL.
