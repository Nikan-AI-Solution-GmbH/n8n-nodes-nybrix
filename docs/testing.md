# Testing Guide

This guide covers everything needed to run the node locally, execute a test workflow against a real or mock backend, and verify correct behaviour end-to-end.

---

## Prerequisites

- Node.js v22+ (`node --version`)
- npm (`npm --version`)
- The Nikan Anonymization backend running at `http://localhost:8000` (or any reachable URL)

If you do not yet have the backend running, see [Mocking the backend](#mocking-the-backend) below to validate the node with a simple local stub.

---

## Option A — Hot-reload dev server (recommended)

```bash
npm install        # first time only
npm run dev
```

This compiles the TypeScript, starts n8n at **http://localhost:5678**, and watches for source changes. The node rebuilds and n8n reloads automatically on each save — no restart needed.

Open http://localhost:5678 and create a free account (local only, no external sign-up required).

---

## Option B — Docker (isolated n8n instance)

Use this when you want a clean n8n instance without touching your local `~/.n8n` folder, or when testing published builds.

```bash
# 1. Build
npm run build

# 2. Link globally so Docker can mount the package
npm link

# 3. Start n8n with community nodes enabled
docker run -d --name n8n-dev \
  -p 5680:5678 \
  -e N8N_COMMUNITY_PACKAGES_ENABLED=true \
  -v ~/.n8n/custom/node_modules/n8n-nodes-nybrix-anonymisation:/home/node/.n8n/custom/node_modules/n8n-nodes-nybrix-anonymisation \
  n8nio/n8n
```

n8n will be available at **http://localhost:5680**.

After a code change:
```bash
npm run build && docker restart n8n-dev
```

---

## Step 1 — Configure the credential

1. In n8n, go to **Settings → Credentials → New credential**
2. Search for **Nikan Anonymization API**
3. Fill in:
   - **Base URL**: `http://localhost:8000` (or your deployment URL)
   - **API Key**: your `X-API-Key` value
4. Click **Test credential** — you should see a green "Connection successful" message
5. Click **Save**

If the test fails, see [Troubleshooting](#troubleshooting) below.

---

## Step 2 — Create a test workflow

### Minimal anonymize test

1. Create a new workflow
2. Add a **Manual Trigger** node
3. Add a **Nikan Anonymization** node and connect it to the trigger
4. In the Anonymization node:
   - **Operation**: Anonymize
   - **Text**: `Hello, my name is John Doe and I work at Acme Corp in Berlin.`
5. Click **Test step**

**Expected output:**
```json
{
  "requestId": "a3f2c1d4-...",
  "result": "Hello, my name is [PERSON_1] and I work at [ORG_1] in [LOCATION_1].",
  "operation": "anonymize"
}
```

### Round-trip test (anonymize → deanonymize)

Extend the workflow by adding a second Nikan Anonymization node after the first:

- **Operation**: Deanonymize
- **Text**: `{{ $json.result }}`

Execute the full workflow. The second node's `result` should match the original input text exactly.

### Batch test (multiple items)

To test that the node handles multiple items correctly:

1. Add a **Code** node before the Anonymization node
2. Set it to output multiple items:
   ```javascript
   return [
     { json: { text: 'Alice Smith called Bob Jones.' } },
     { json: { text: 'Meeting at 10 Park Lane tomorrow.' } },
   ];
   ```
3. In the Anonymization node, set **Text** to `{{ $json.text }}`
4. Execute — both items should be processed independently

---

## Step 3 — Test error handling

### Invalid API key

1. Create a credential with a wrong API key
2. Create a workflow using that credential
3. Execute — the node should throw: `Authentication failed. Check your API key.`

### Continue on Fail

1. Use a bad credential as above
2. In the Anonymization node settings (gear icon → **On Error**), enable **Continue on Fail**
3. Execute — instead of crashing, the node outputs:
   ```json
   { "error": "Authentication failed. Check your API key." }
   ```

### Timeout

1. In the Anonymization node, expand **Options**
2. Set **Max Retries** to `2` and **Polling Interval** to `100`
3. If the backend takes longer than 200 ms, the node throws:
   `Transformation timed out after 2 attempts (0.2s)`

---

## Mocking the backend

If you do not have the real Nikan backend, you can run a minimal stub server to exercise the node's protocol handling.

Save this as `mock_server.py` and run `python mock_server.py`:

```python
from http.server import BaseHTTPRequestHandler, HTTPServer
import json, uuid, time

STORE = {}

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers['Content-Length'])
        body = json.loads(self.rfile.read(length))
        tool = body['params']['name']
        args = body['params'].get('arguments', {})

        if tool == 'tools/list' or body.get('method') == 'tools/list':
            result = {'tools': [{'name': 'start_transformation'}, {'name': 'retrieve_result'}]}
        elif tool == 'start_transformation':
            rid = str(uuid.uuid4())
            import base64
            text = base64.b64decode(args['text']).decode()
            STORE[rid] = text.replace('John', '[PERSON_1]').replace('Doe', '[PERSON_2]')
            result = rid
        elif tool == 'retrieve_result':
            rid = args['request_id']
            result = STORE.get(rid, 'Request ID not found.')
        else:
            result = 'unknown tool'

        resp = json.dumps({'jsonrpc': '2.0', 'id': body.get('id', 1),
                           'result': {'content': [{'type': 'text', 'text': str(result)}]}})
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(resp.encode())

    def log_message(self, fmt, *args):
        print(fmt % args)

HTTPServer(('', 8000), Handler).serve_forever()
```

Run it:
```bash
python mock_server.py
```

The mock server accepts any `X-API-Key` value (no validation). Use Base URL `http://localhost:8000` in the credential.

---

## What to check after each code change

| Check | Command / Action |
|-------|-----------------|
| TypeScript compiles | `npm run build` exits 0 |
| No lint errors | `npm run lint` exits 0 |
| Node appears in palette | Search "Nikan" in node search |
| Credential test passes | Click **Test** on the credential form |
| Anonymize produces output | Execute the minimal test workflow |
| Round-trip fidelity | Deanonymize the anonymized result |
| Error item shape | Enable Continue on Fail with bad credentials |

---

## Troubleshooting

### "Connection refused" on credential test

The backend is not running or not reachable at the configured Base URL. Start the backend (or the mock server) and verify with:
```bash
curl -X POST http://localhost:8000/mcp \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: any-key' \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

### "Authentication failed" during execution

The `X-API-Key` value in the credential does not match what the server expects. Double-check the key in **Settings → Credentials**.

### Node does not appear in the n8n node palette

- Verify `npm run build` succeeded (check for TypeScript errors)
- Verify the node is listed in `package.json` under `n8n.nodes`
- Restart `npm run dev` or the Docker container

### Timeout errors

Increase **Options → Max Retries** and/or reduce **Options → Polling Interval**. The default is 60 × 1000 ms = 60 s. For slow backends, set Max Retries to 120 (2 minutes).
