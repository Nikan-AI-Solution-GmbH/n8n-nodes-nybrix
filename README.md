# n8n-nodes-nikan-anonymization

This is an n8n community node. It lets you use the **Nikan Anonymization API** in your n8n workflows.

The Nikan Anonymization service detects and replaces sensitive entities (names, addresses, organisations, dates, etc.) in text with consistent pseudonyms. The same service can reverse the process — restoring original text from an anonymized version — so anonymization is fully lossless within a session.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In short: open your n8n instance → **Settings → Community Nodes → Install** → enter `n8n-nodes-nikan-anonymization` → Install.

For local development, see [docs/setup.md](docs/setup.md).

---

## Operations

The **Nikan Anonymization** node exposes a single resource (text) with two operations:

| Operation | Description |
|-----------|-------------|
| **Anonymize** | Scans the input text, detects sensitive entities, and replaces them with consistent pseudonyms (e.g. `John Doe` → `[PERSON_1]`). Returns the anonymized text and a `requestId` that can be used to deanonymize later. |
| **Deanonymize** | Takes a previously anonymized text and restores the original sensitive entities using the server-side mapping stored under the original `requestId`. |

**Parameters:**

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| Operation | Yes | Anonymize | Which operation to perform |
| Text | Yes | — | The text to process. Supports n8n expressions (e.g. `{{ $json.body }}`) |
| Options → Max Retries | No | 60 | Maximum number of status polls before the node times out |
| Options → Polling Interval (Ms) | No | 1000 | Milliseconds between status polls |

**Output JSON shape:**

```json
{
  "requestId": "a3f2c1d4-5678-...",
  "result": "Hello, my name is [PERSON_1] and I live at [ADDRESS_1].",
  "operation": "anonymize"
}
```

---

## Credentials

The node authenticates with the Nikan Anonymization API using an **API key** credential.

**Required information:**

| Field | Description |
|-------|-------------|
| Base URL | The URL of your Nikan Anonymization MCP server (default: `http://localhost:8000`) |
| API Key | Your `X-API-Key` value, provided by your Nikan organisation administrator |

**To configure:**

1. In n8n, go to **Credentials → New credential**
2. Search for **Nikan Anonymization API**
3. Enter the Base URL of your deployment and your API Key
4. Click **Test** — n8n will ping the server's tool list endpoint to verify the connection
5. Click **Save**

If you are running the server locally for development, the default base URL (`http://localhost:8000`) requires no change. For production deployments, replace it with your organisation's URL (e.g. `https://api.your-org.example.com`).

---

## Compatibility

- **Minimum n8n version:** 1.0.0
- **Tested against:** n8n 1.x
- **Node.js:** v22 or higher (for local development)

The node targets n8n Nodes API version 1 (`n8nNodesApiVersion: 1`) and is compatible with n8n Cloud, self-hosted, and the local development server (`npm run dev`).

---

## Usage

### Basic anonymize → deanonymize workflow

1. Add a **Manual Trigger** node
2. Add a **Nikan Anonymization** node:
   - Operation: `Anonymize`
   - Text: your input text (or `{{ $json.text }}` from an upstream node)
3. Add a second **Nikan Anonymization** node:
   - Operation: `Deanonymize`
   - Text: `{{ $json.result }}` (the output of the first node)
4. Execute — the second node's `result` will match the original input

### Using as an AI tool

The node has `usableAsTool: true`, which means it can be attached to an **AI Agent** node as a tool. The agent can invoke anonymization on arbitrary text before passing it to an LLM, ensuring sensitive data never leaves your infrastructure.

### Error handling

Enable **Continue on Fail** in the node settings (the node gear icon) to prevent a single failed item from stopping the entire workflow. Failed items will carry an `error` field instead of a `result`.

### Timeout configuration

For long documents or high server load, increase **Max Retries** and/or **Polling Interval** in the Options section. The default timeout is 60 retries × 1000 ms = 60 seconds.

---

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Project documentation](docs/)
  - [Setup guide](docs/setup.md)
  - [Testing guide](docs/testing.md)
  - [API reference](docs/api-reference.md)
  - [Architecture](docs/architecture.md)
  - [Internals deep-dive](docs/internals.md)
  - [Certification checklist](docs/certification.md)

---

## Version history

### 0.1.0

Initial release. Supports Anonymize and Deanonymize operations over the Nikan Anonymization MCP API (JSON-RPC 2.0 / StreamableHttp transport).
