# Setup Guide

There are two ways to run the node locally. Pick the one that matches how you are running n8n.

---

## Option 1 — `npm run dev` (built-in n8n, zero config)

`@n8n/node-cli` bundles its own n8n instance. `npm run dev` builds the TypeScript, creates the required symlink automatically, and starts n8n — no manual linking needed.

```bash
npm install      # first time only
npm run dev
```

Open **http://localhost:5678**. The Nikan Anonymization node is available in the node palette immediately. File changes rebuild automatically.

**When to use this:** local development, iterating on the node code.

---

## Option 2 — Link into an existing n8n instance

Use this when you have a separate n8n running: globally installed, Docker, or a self-hosted server.

### Step 1 — Build the package

```bash
cd /path/to/n8nnode-app
npm install
npm run build
```

### Step 2 — Register the package globally with npm link

```bash
npm link
```

This creates a global symlink: `{npm-global}/lib/node_modules/n8n-nodes-nybrix-anonymisation → /path/to/n8nnode-app`

### Step 3 — Set up n8n's custom nodes folder

n8n loads community nodes from `~/.n8n/custom/node_modules/`. Create that folder and link the package into it:

```bash
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom

# Create package.json if it doesn't exist yet
[ -f package.json ] || npm init -y

# Pull in the global link
npm link n8n-nodes-nybrix-anonymisation
```

After this, `~/.n8n/custom/node_modules/n8n-nodes-nybrix-anonymisation` is a symlink to your project's build output.

### Step 4 — Start (or restart) n8n

```bash
# Globally installed n8n:
n8n start

# Or via npx:
npx n8n start
```

If n8n was already running, restart it so it picks up the new node.

For **Docker**, see the volume-mount approach in [testing.md](testing.md#option-b--docker-isolated-n8n-instance) instead — `npm link` does not work across a Docker boundary.

### Step 5 — Verify the node loads

Open your n8n instance, create a new workflow, and search for **Nikan Anonymization** in the node palette. If it does not appear:

- Confirm `npm run build` succeeded (no TypeScript errors)
- Confirm `~/.n8n/custom/node_modules/n8n-nodes-nybrix-anonymisation` exists and is a symlink to the correct directory
- Restart n8n

### Updating after code changes

```bash
npm run build    # recompile
# No need to re-link — the symlink already points to the dist/ folder
# Restart n8n if it does not hot-reload
```

---

## Configure credentials

Once the node appears in n8n (either option above):

1. Go to **Settings → Credentials → New credential**
2. Search for **Nikan Anonymization API**
3. Fill in:
   - **Base URL**: `http://localhost:8000` (or your deployment URL)
   - **API Key**: your `X-API-Key` value
4. Click **Test credential** — a green message confirms the server is reachable
5. Click **Save**

---

## Backend requirements

The node connects to a FastMCP server at `{baseURL}/mcp` that exposes these MCP tools:

| Tool | Purpose |
|------|---------|
| `start_transformation` | Submits text for processing, returns a `request_id` |
| `retrieve_result` | Fetches the result by `request_id` |
| `status_requests` | Returns queue status (informational) |

If you do not have the backend running yet, see the [mock server](testing.md#mocking-the-backend) in the testing guide.
