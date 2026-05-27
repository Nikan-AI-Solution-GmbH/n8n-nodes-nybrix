# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`n8n-nodes-nikan-anonymization` — an n8n community node that wraps the Nikan Anonymization API. The backend is a FastMCP server exposing three tools over MCP StreamableHttp (JSON-RPC 2.0 over `POST /mcp`):

- `start_transformation(text: base64, mode: "1"|"2")` → `request_id` (or `"Unauthorized"`)
- `retrieve_result(request_id)` → result text | `"Still processing."` | `"Request ID not found."`
- `status_requests()` → queue status (informational, not used by the node)

Authentication is via an `X-API-Key` header. The base URL is configurable per credential.

## Commands

```bash
npm install          # install dependencies (includes @n8n/node-cli + local n8n)
npm run dev          # build + start n8n with hot reload at http://localhost:5678
npm run build        # compile TypeScript → dist/
npm run lint         # check code
npm run lint:fix     # auto-fix lint issues
npm run release      # bump version, update changelog, tag, push (triggers npm publish)
```

No test runner is configured — validate interactively via `npm run dev`.

## Architecture

TypeScript package compiled to `dist/`, loaded by n8n as a community node. Every node and credential must be registered in `package.json` under `n8n.nodes` / `n8n.credentials` (as `dist/` paths).

Key source files:

| File | Role |
|------|------|
| `credentials/NikanAnonymizationApi.credentials.ts` | Credential type: apiUrl + apiKey, X-API-Key injection, tools/list test ping |
| `nodes/Anonymization/Anonymization.node.ts` | Programmatic node: execute(), start→poll loop, continueOnFail |
| `nodes/Anonymization/transport.ts` | MCP JSON-RPC helper: wraps `POST /mcp` calls, extracts `result.content[0].text` |

The node uses **programmatic style** (implements `execute()`) because the API requires a start→poll loop that cannot be expressed declaratively.

## n8n Cloud import/global restrictions

Enforced by `@n8n/eslint-plugin-community-nodes` (run `npm run lint` to check):

- **Allowed imports only**: `n8n-workflow`, `lodash`, `moment`, `luxon`, `zod`, `crypto`, `node:crypto`, and relative paths. `node:timers/promises` and all other Node.js builtins are blocked.
- **Restricted globals**: `setTimeout`, `setInterval`, `setImmediate`, `clearTimeout`, `clearInterval`, `clearImmediate`, `global`, `globalThis`, `process`, `__dirname`, `__filename`.
- **Delay workaround**: `import { delay as lodashDelay } from 'lodash'` → `const sleep = (ms: number): Promise<void> => new Promise((resolve) => lodashDelay(resolve, ms));`

## Credential pattern

`credentials/NikanAnonymizationApi.credentials.ts`:
- `authenticate` block injects `X-API-Key` header automatically — transport.ts does not set it manually
- `test` block pings `POST /mcp` with a `tools/list` call to validate connectivity
- `baseURL` in the test request uses expression syntax `={{$credentials?.apiUrl}}`

## Transport pattern

`nodes/Anonymization/transport.ts`:
- Accepts `this` as `IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions` (TypeScript explicit `this` parameter)
- Calls `this.helpers.httpRequestWithAuthentication('nikanAnonymizationApi', options)` — credential injection is automatic
- Returns `response.result?.content?.[0]?.text ?? ''`
