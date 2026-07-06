# n8n Community Node Certification Checklist

To submit `n8n-nodes-nybrix-anonymisation` for verification on the n8n Creator Portal, all items below must be complete.

Reference: [Submit community nodes](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/)

---

## Technical requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| Package name starts with `n8n-nodes-` | ✅ | `n8n-nodes-nybrix-anonymisation` |
| `n8n-community-node-package` keyword in `package.json` | ✅ | Already present |
| MIT license | ✅ | `LICENSE.md` included |
| No runtime dependencies | ✅ | All deps are `devDependencies` or `peerDependencies` |
| `n8nNodesApiVersion: 1` in `package.json` `n8n` section | ✅ | Set |
| `usableAsTool: true` on node description | ✅ | Set in `Anonymization.node.ts` |
| TypeScript compiles without errors (`npm run build`) | ⬜ | Run before publishing |
| All lint rules pass (`npm run lint`) | ⬜ | Run before publishing |
| Light and dark icon SVGs present | ✅ | `anonymization.svg` / `anonymization.dark.svg` |
| Credential test endpoint configured | ✅ | MCP `initialize` call in credential test |
| `continueOnFail` handled in `execute()` | ✅ | Implemented |
| `NodeOperationError` used for all thrown errors | ✅ | Implemented |

---

## Publishing requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| Package published to npm | ⬜ | Run `npm run release` |
| Published via GitHub Actions with provenance attestation | ⬜ | **Required from May 1, 2026** — see `.github/workflows/publish.yml` |
| npm Trusted Publisher configured | ⬜ | Add GitHub Actions as trusted publisher on npmjs.com |

### One-time npm setup

1. Log in to [npmjs.com](https://npmjs.com)
2. Open package settings → **Publish access → Trusted Publishers**
3. Add publisher:
   - Repository owner: your GitHub org/username
   - Repository name: `n8n-nodes-nybrix-anonymisation`
   - Workflow name: `publish.yml`

### Releasing a new version

```bash
npm run release
```

This lints, builds, prompts for a version bump, updates `CHANGELOG.md`, commits, tags, and pushes — which triggers the GitHub Actions workflow to publish to npm with provenance.

---

## Documentation requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| README describes what the node does | ✅ | `README.md` complete |
| README documents credential setup | ✅ | Inline in `README.md` credentials section |
| `package.json` has non-empty `description`, `author`, `homepage` | ⬜ | Fill in before publishing |
| `package.json` `repository.url` is set | ⬜ | Set to the GitHub repo URL |

---

## Submission

Once all items above are complete:

1. Publish the package to npm (`npm run release`)
2. Go to the [n8n Creator Portal](https://creators.n8n.io/nodes)
3. Submit the npm package name for review

Verification grants:
- Discovery in the n8n node panel (no manual install required)
- A verified badge
- Eligibility for n8n Cloud
