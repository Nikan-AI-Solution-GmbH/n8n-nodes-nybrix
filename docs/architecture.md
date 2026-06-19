# Project Architecture

## What this is

`n8n-nodes-nybrix-anonymisation` is a **TypeScript package** that extends n8n with a custom node for text anonymization and deanonymization. When installed in an n8n instance, the node appears in the node panel and can be used in any workflow.

n8n loads community nodes by reading the `n8n` section of the package's `package.json`, then importing the compiled `.js` files from the `dist/` directory at runtime.

---

## Source layout

```
n8nnode-app/
│
├── credentials/
│   └── NikanAnonymizationApi.credentials.ts   ← credential type (apiUrl + apiKey)
│
├── nodes/
│   └── Anonymization/
│       ├── Anonymization.node.ts               ← node class (INodeType, programmatic)
│       ├── Anonymization.node.json             ← codex / metadata
│       ├── transport.ts                        ← MCP JSON-RPC helper
│       ├── anonymization.svg                   ← light-mode icon
│       └── anonymization.dark.svg              ← dark-mode icon
│
├── docs/                                       ← this documentation
│   ├── architecture.md                         ← you are here
│   ├── internals.md                            ← logic deep-dive
│   ├── setup.md                                ← prerequisites & install
│   ├── testing.md                              ← local test guide
│   ├── api-reference.md                        ← MCP protocol reference
│   └── certification.md                        ← n8n Cloud verification checklist
│
├── dist/                                       ← compiled output (git-ignored)
│   ├── credentials/
│   └── nodes/
│
├── client.py           ← Python reference implementation (the API contract)
├── package.json        ← npm manifest + n8n registration
├── tsconfig.json       ← TypeScript config (target: es2019, outDir: dist/)
├── eslint.config.mjs   ← delegates to @n8n/node-cli shared config
├── .prettierrc.js      ← tabs, single quotes, print width 100
└── CLAUDE.md           ← guidance for Claude Code
```

---

## How n8n discovers the node

The `n8n` section in `package.json` is the registration manifest:

```json
"n8n": {
  "n8nNodesApiVersion": 1,
  "strict": true,
  "credentials": [
    "dist/credentials/NikanAnonymizationApi.credentials.js"
  ],
  "nodes": [
    "dist/nodes/Anonymization/Anonymization.node.js"
  ]
}
```

n8n reads these paths at startup, `require()`s each file, and registers the exported classes. **Every new node or credential must be listed here before it will appear in n8n.**

---

## Build pipeline

```
TypeScript sources  →  tsc (via n8n-node build)  →  dist/
```

- `npm run build` — one-shot compile to `dist/`
- `npm run dev` — compile + start local n8n + watch for changes
- `npm run build:watch` — compile + watch only (no n8n server)

The `@n8n/node-cli` tool (`n8n-node`) handles TypeScript compilation, SVG/JSON asset copying, and starting the embedded n8n instance. It is a `devDependency` and does not need to be installed globally.

Icon SVGs and `.node.json` files are copied verbatim from source to `dist/` during the build.

---

## Node authoring style

This node uses the **programmatic style**: it implements `async execute(this: IExecuteFunctions)` and writes its own HTTP logic, execution flow, and error handling explicitly.

The alternative is the declarative style, where `routing:` blocks in property definitions let n8n construct and send HTTP requests automatically. That style works well for simple CRUD APIs but cannot express the **start → poll** loop this backend requires, so programmatic is the right choice here.

---

## Data flow through the Anonymization node

```
n8n workflow item
       │
       ▼
Anonymization.execute()
       │
       ├─ read parameters (operation, text, options)
       │
       ├─ base64-encode text
       │
       ├─ mcpToolCall('start_transformation', {text, mode})
       │      │
       │      └─ POST /mcp  ←──  NikanAnonymizationApi credential (X-API-Key injected)
       │              │
       │              └─ returns: request_id
       │
       ├─ polling loop (up to maxRetries × pollingInterval ms)
       │      │
       │      └─ mcpToolCall('retrieve_result', {request_id})
       │              │
       │              └─ returns: result text | "Still processing." | "Request ID not found."
       │
       └─ push {requestId, result, operation} to output
```

---

## Credential flow

```
NikanAnonymizationApi credential
       │
       ├─ properties: apiUrl, apiKey
       │
       ├─ authenticate block: injects 'X-API-Key': apiKey into every request header
       │
       └─ test: POST /mcp with tools/list call → validates connectivity
```

The `authenticate` block is applied automatically by `this.helpers.httpRequestWithAuthentication`. The transport helper does not manually set the `X-API-Key` header; n8n injects it from the credential.

---

## n8n Cloud compatibility constraints

The `@n8n/eslint-plugin-community-nodes` enforces rules required for n8n Cloud verification:

- **Allowed imports**: only `n8n-workflow`, `lodash`, `moment`, `luxon`, `zod`, `crypto`, `node:crypto`, and relative paths
- **Restricted globals**: `setTimeout`, `setInterval`, `setImmediate`, `global`, `globalThis`, `process`, `__dirname`, `__filename`, and the clear-variants
- **Workaround for delays**: `lodash.delay` wraps `setTimeout` internally; importing it from `lodash` bypasses the global restriction

Run `npm run lint` at any time to check compliance.
