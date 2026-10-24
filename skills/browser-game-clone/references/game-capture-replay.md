# Game Capture & Replay Architecture

## § Capture — headed Chrome + mitmproxy

1. Launch Chrome detached (a wrapper's exit kills a child chrome) with a FRESH
   user-data-dir, CDP, and the proxy:
   ```
   chrome.exe --remote-debugging-port=9222 --user-data-dir=<fresh>
     --proxy-server=127.0.0.1:9099 --ignore-certificate-errors
     --no-first-run --no-default-browser-check about:blank
   ```
   - The debugger binds `[::1]:9222` only — connect via `http://localhost:9222`, not
     `127.0.0.1`, when `127.0.0.1` refuses.
2. Record everything with mitmproxy's stream file (keeps OPTIONS preflights, request
   bodies, and headers a response-hook addon misses):
   `mitmdump --mode regular@9099 --set confdir=<fresh> --save-stream-file flows.mitm`
   Parse later: `mitmdump -nr flows.mitm -s <dump-addon>.py` writing JSONL.
3. Drive the game via CDP: navigate with the game URL's own query token (each visit
   mints fresh signed asset URLs), wait ~30s for boot, read `canvas`
   getBoundingClientRect() for geometry, dispatch `Input.dispatchMouseEvent` clicks
   at canvas-relative spin coordinates (~4s cadence) for several minutes to exercise
   lazy-loaded scenes/features.
4. Extract assets to disk DECOMPRESSED — sniff gzip magic `\x1f\x8b` in the body,
   not the `content-encoding` header (servers omit it).

### Capture pitfalls
- Repeat runs may hit browser disk cache: requests never traverse the proxy and the
  capture stops growing — that means cache hits, not success. Use a fresh profile.
- On Windows a killed mitmweb can leave its port in bind-refused limbo invisible to
  `netstat`; switching ports is faster than fighting it.

## § Replay — pick by session binding

| API behavior | Architecture |
|---|---|
| No session binding (static/open APIs) | Full offline replay from any capture |
| Client derives tokens from a session-init response (e.g. verifySession) and every
 later response was minted against that token | Replay ONE coherent session slice:
  the session-init call and all subsequent calls from a single game boot. Identify
  boots by counting session-init calls in the capture order |
| Coherent replay still rejected (per-request nonces, encrypted payloads) | Hybrid:
  serve static assets from disk via a mitmproxy addon, pass API through to the live
  server. Hybrid working proves the asset set complete; detaching the API is a
  separate RE task (expect opaque packed-binary, not protobuf) |

### Offline addon rules (mitmproxy `request` hook)
- OPTIONS preflights: echo the request origin verbatim as `access-control-allow-origin`
  plus `access-control-allow-credentials: true` and the captured `allow-headers` list.
  Wildcard origins are rejected when credentials are involved, and a failed preflight
  shows up as endless repeated OPTIONS with the POST never sent.
- Serve replayed subdomain assets with the captured `access-control-allow-origin`:
  page-host → static-host is a cross-origin CORS fetch even when both belong to the
  product; without the header the client silently retries forever.
- Never serve decompressed bytes with a captured `content-encoding` header.
- Keep a `print("MISS:", host, path)` on 404 — a single missing chunk can stall the
  loader in a loop that looks like a rendering bug.

### Verification
- CDP: `Network.setCacheDisabled: true`, re-navigate (patched ES modules are served
  stale from cache otherwise), then `Runtime.consoleAPICalled`/`exceptionThrown`
  capture + `Page.captureScreenshot`.
- Prove function, not pixels: read game state back (balance changed, spin promise
  resolved, N cascade events fired). Instrument the page from CDP — wrap internal
  methods with tracing to find which phase of an async timeline stalls.
