# Changelog

All notable changes to `n8n-nodes-nybrix-anonymisation` will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] — 2026-06-19

### Added

- **Anonymise** operation: detects PII in free-text input (names, addresses, financial identifiers, digital IDs) and replaces each entity with a consistent synthetic substitute. Returns `requestId` + `result`.
- **Deanonymise** operation: restores original values from a pseudonymised document using the encrypted server-side mapping table. Deterministic DB lookup — no AI involved.
- **nybrix Anonymisation API** credential type: configurable Base URL + API Key (`X-API-Key` header injection).
- Async start → poll execution model with configurable **Max Retries** (default 60) and **Polling Interval** (default 1,000 ms).
- `continueOnFail` support — failed items carry an `error` field instead of halting the workflow.
- `usableAsTool: true` — the node can be attached to an n8n AI Agent as a callable tool.
- Named error handling for authentication failures, quota exhaustion, expired request IDs, and timeouts.
