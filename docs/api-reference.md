# API Reference

The Nikan Anonymization backend is a **FastMCP server** that communicates via the **MCP StreamableHttp transport** — JSON-RPC 2.0 messages sent as HTTP POST requests.

## Endpoint

```
POST {baseURL}/mcp
```

## Authentication

Every request must include the API key in the `X-API-Key` header:

```
X-API-Key: <your-api-key>
```

## Protocol

All requests use the [JSON-RPC 2.0](https://www.jsonrpc.org/specification) format.

### Tool call request

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "<tool_name>",
    "arguments": { ... }
  },
  "id": 1
}
```

### Successful response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      { "type": "text", "text": "<result_value>" }
    ]
  }
}
```

The n8n node reads `result.content[0].text` as the return value.

### Error response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "Error description"
  }
}
```

---

## Tools

### `start_transformation`

Submits text for anonymization or deanonymization. Returns a `request_id` to poll for the result.

**Arguments:**

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | **Base64-encoded** UTF-8 text to process |
| `mode` | string | `"1"` = anonymize, `"2"` = deanonymize |

**Returns:** a UUID string (`request_id`), or `"Unauthorized"` if authentication fails.

**Example request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "start_transformation",
    "arguments": {
      "text": "SGVsbG8sIG15IG5hbWUgaXMgSm9obiBEb2Uu",
      "mode": "1"
    }
  },
  "id": 1
}
```

**Example response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{ "type": "text", "text": "a3f2c1d4-5678-..." }]
  }
}
```

---

### `retrieve_result`

Fetches the processed result for a given `request_id`. Poll this until the result is available.

**Arguments:**

| Field | Type | Description |
|-------|------|-------------|
| `request_id` | string | The UUID returned by `start_transformation` |

**Returns:** the processed text, `"Still processing."`, or `"Request ID not found."`.

**Example request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "retrieve_result",
    "arguments": { "request_id": "a3f2c1d4-5678-..." }
  },
  "id": 2
}
```

**Example response (ready):**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [{ "type": "text", "text": "Hello, my name is [PERSON_1]." }]
  }
}
```

---

### `status_requests`

Returns current queue status (informational — not used in the n8n node flow).

**Arguments:** none

---

## Credential test

The n8n credential test calls `tools/list` (not `tools/call`) to verify connectivity without side effects:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "params": {},
  "id": 1
}
```

A 2xx HTTP response indicates the credential is valid.

---

## Notes

- Input text **must be base64-encoded** before sending (the n8n node handles this automatically).
- The result text encoding should be verified against your backend version — if the server returns base64-encoded output, decode it with `Buffer.from(result, 'base64').toString('utf-8')` before displaying.
- The default polling loop checks every 1000 ms for up to 60 attempts (60 s timeout). Both values are configurable per-node in n8n.
