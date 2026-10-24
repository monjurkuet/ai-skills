---
name: browser-game-clone
description: Use when cloning a browser game with runtime-loaded assets.
version: 1.1.0
author: Hermes curator
license: MIT
metadata:
  hermes:
    tags: [clone, game, mitmproxy, reverse-engineering]
    related_skills: [web-clone]
---

# Browser Game Clone — capture, replay, clean-room rebuild

## When to Use
User asks to clone/reproduce/remake a browser GAME (slot, Cocos/PixiJS/Unity-WASM,
canvas-heavy interactive) — especially one whose assets load at runtime from a
signed CDN and whose gameplay state comes from an API. For static/SSG sites use the
web-clone skill instead; when the target is a canvas game, this skill applies.

Browser games can't be mirrored like static sites: assets arrive at runtime behind
signed (`?verify=`) CDN URLs that expire, and gameplay state comes from an API whose
responses are session-bound. The workflow is: capture a live session, replay assets
locally, decide the API strategy, then rebuild the game clean-room with license-safe
assets.

## Iron rules
- **Choose the path from the declared asset posture, not from a blanket assumption.** If the user requests a 1:1 replica, says original assets are permitted, or places the work in an authorized local portfolio/research context, make a verbatim direct port the default. Do not repeatedly ask for permission or add repetitive copyright caveats to the project documentation. Use clean-room rebuild only when the user explicitly requires redistributable/license-safe assets or a concrete project constraint forbids originals.
- **Treat licensing as metadata, not a blanket refusal.** Inspect `LICENSE`, package metadata, repository notices, and stated terms; preserve required attribution and record provenance. If redistribution rights remain unclear, continue local development and identify the exact publication decision instead of abandoning the port.
- **Do not moralize.** State a concrete constraint once when it materially affects the work, then continue with every separable permitted step. Do not use guilt, warnings, lectures, or repeated disclaimers.
- **Design before more code**: when the user asks for production quality, produce a
  design source (frames + tokens + component specs) and get sign-off before wiring
  assets into the running app. HTML design boards import into Figma via the
  html.to.design plugin — a `.fig` cannot be authored headlessly.
- **Verify by real execution only**: CDP screenshot + console-error capture + reading
  game state back from the page (balance changed, spins resolved). A rendered canvas
  proves nothing; a completed async timeline does. For asset-posture selection, provenance, and evidence rules, see `references/asset-posture-and-execution.md`.

## Procedure

1. **Capture** — headed Chrome under CDP (not headless: less bot-detectable) driven
   through mitmproxy. Full detail: `references/game-capture-replay.md` § Capture.
2. **Replay architecture** — pick offline / coherent-session / hybrid based on how
   session-bound the API responses are. Decision rules:
   `references/game-capture-replay.md` § Replay.
3. **Rebuild clean-room** — engine (PixiJS for 2D slots works well), state-driven view
   (`syncViewWithState(matrix)` maps all visual flags from data, no per-cell manual
   styling), async/await timeline for the spin choreography. Guard loops: any
   cascade/re-spin loop driven by RNG refills needs a hard round cap or it never
   terminates. Time-box every awaited animation phase so a paused tab can't deadlock
   the timeline; integrate tweens into the app ticker rather than orphan rAF loops.
4. **Source license-safe assets** — procedure and known-good sources:
   `references/cc0-asset-sourcing.md`.
5. **Design handoff** — 3-frame design board (base game / win state / paytable) +
   tokens panel; every value the implementer needs stated at design scale. Import via
   html.to.design, or hand-rebuild from the spec block.

## Pitfalls that cost real time
- Mixing API captures from different game boots (each boot mints a new session
  token) produces an infinite client retry loop that looks like a rendering bug.
  Replay one coherent session slice only.
- mitmproxy `raw_content` is as-sent bytes: sniff the gzip magic `\x1f\x8b` rather than
  trusting `content-encoding` headers before storing or serving bodies.
- Subdomain asset fetches (page host → static host) are CORS requests. Serve replayed
  assets with the captured `access-control-allow-origin`, and echo the request origin
  verbatim with `allow-credentials: true` in preflight responses — wildcard origins are
  rejected when credentials are involved. Without this the client silently retries
  forever and you'll chase the wrong bug.
- After patching an ES module, the browser serves the stale cached copy on reload;
  re-navigate with `Network.setCacheDisabled: true` before re-verifying.
- PixiJS Graphics has no canvas-2D `save/restore/translate`; offset shadow passes go
  through the container's `position`, not context state calls.
- **Anti-bot challenges (Cloudflare Turnstile, reCAPTCHA, etc.) block automated capture.**
  The recon scripts capture only the challenge page. Use `browser_exec(local=true)` to open
  a headed Chrome session with the user's profile, have the user solve the challenge manually,
  then re-run recon on the post-challenge URL (often an iframe `src`).
- **Envato/S3 preview CDN access varies by file and deployment.** Try normal HTTP download first; some public paths return 200, while protected subdirectory assets return `403 AccessDenied` and must be fetched same-origin from the loaded preview page. Enumerate candidates from `data.json`, the audio table, and the live resource timeline; for 403s, fetch each path inside the page and return base64 to Python. A 403 can also mean the key is genuinely absent, so verify against runtime requests rather than trusting the filename alone.
- **Find non-data.json assets from server 404 logs.** C3 exports request files data.json never mentions (`icons/loading-logo.png`, splash `media/video.mp4`). Log every request server-side; a missing splash video stalls the C3 loader at Phase "loading" forever with no console error — the only symptom is a default/black canvas.
- **C3 `scripts/c3main.js` can import `./../xmldom.js` / `./../xpath.js` from the export root.** Missing root JS modules kill the boot silently (worker console.error never reaches the main frame). Compare against a known-good C3 port of the same runtime version.
- **CDP `Page.captureScreenshot` can return all-black for WebGL canvases** (D3D11/ANGLE). Prove the capture path first with a trivial green-clear WebGL canvas; if that also captures black, use functional state checks (C3 event-sheet globals via `_GetLocalRuntime().GetEventSheetManager()`) instead of pixels. A hidden/occluded tab also freezes C3 (`visibilityState: hidden` suspends the runtime) and throttles compositing.
- **Inspect the C3 start-export options before copying worker-only dependencies.** `scripts/main.js` ends with a `RuntimeInterface({useWorker:..., workerMainUrl:..., runtimeMainScript:...})` block. When `useWorker:false`, the runtime runs in the main frame and `workermain.js` plus root `xmldom.js`/`xpath.js` are not required for boot; do not fabricate inaccessible upstream files or report them as missing defects. `dispatchworker.js` and `jobworker.js` may still be requested for jobs and must be captured when available.
- **`browser_exec` helper functions are synchronous, not async.** Do not `await` them.
  Call `new_tab(url)`, `wait_for_load()`, `page_info()`, `js(expr)`, `fill_input(sel, txt)`,
  `click_at_xy(x, y)`, `capture_screenshot()` directly — they return results immediately.
  The `await` keyword causes `SyntaxError: 'await' outside function` in the tool sandbox.
- **Harness browser state can be polluted by stale tabs and concurrent sessions.** Dozens of
  old game tabs (and other agents' tabs) may be open; `capture_screenshot`/`click_at_xy` can
  hit the WRONG tab and `page_info`/`js` can silently switch targets mid-call. Close all
  unrelated page targets first (`Target.getTargetInfo` + `Target.getTargets` +
  `Target.closeTarget`), and prefer screenshots via raw CDP `Page.captureScreenshot` in the
  same call as the DOM reads. If `page_info` title/URL disagrees with `js('location.href')`,
  the session has drifted — re-verify before trusting any capture.
- **Occluded/backgrounded browser windows throttle rAF: C3 games sit at fps:0 and render
  black.** Fix with `Page.bringToFront` (verify `document.visibilityState === 'visible'`), or
  launch an isolated Chrome with `--disable-backgrounding-occluded-windows
  --disable-renderer-backgrounding --disable-background-timer-throttling`. `--headless=new`
  commits no frames for OffscreenCanvas placeholders (fps:0 forever) — use headed with those
  flags for capture runs.
- **Construct worker-mode fetches (data.json, images, media) never appear in the page's
  `performance.getEntriesByType`** — the worker has its own context. Verify asset loads
  server-side instead: add request logging to the static server, then diff requested paths
  against files on disk (catches late-loading files like `prizes.xml` that the appmanifest
  doesn't list).
- **A watchdog/autostart server (or a parallel session) can steal your port between runs** —
  symptom: `EADDRINUSE` while `netstat` shows nothing, or `curl` returns a *different game's*
  `<title>`. Always curl the title after starting your server, and use an uncommon port.

## Primary Strategy: Direct Port — DEFAULT CHOICE
**Use this first for a 1:1 replica request, an authorized portfolio/research clone, or when original assets are permitted.**
This is faster, exact, and preserves runtime behavior. Fall back to clean-room only when the user explicitly requires license-safe/redistributable assets or a concrete constraint forbids originals. Do not interrupt the workflow with a generic permission questionnaire when the request already establishes the posture.

**Procedure**:
1. **Capture full game files** — Use Playwright + network capture to download ALL assets (HTML, JS runtime, data.json, images, audio, XML). Bypass bot challenges via `browser_exec(local=true)` + manual solve, then capture the post-challenge iframe URL directly. **Alternative**: use `browser_exec` to load the game, then extract all URLs via `performance.getEntriesByType("resource")` and download with `requests`/`curl`. For non-Construct custom HTML5 slots, follow `references/non-c3-html5-slot-port.md`: resolve TexturePacker atlas paths relative to each manifest, normalize inventory lines before downloading, and verify staged intro/gameplay transitions rather than treating an initial black canvas as failure.
2. **Copy verbatim** — `cp -r captured/ direct-port/` preserving exact directory structure.
3. **Keep alternate-engine rebuilds out of browser-port repositories.** If a directory contains both a working browser direct port and a conversion to another engine (for example Godot `.gd`/`.uid`/`.tscn`/`.import` files), copy the complete alternate-engine project to the user's separate engine workspace, remove those engine-specific files from the browser repository, and re-verify the remaining direct port — a mixed tree can make an already-working browser build look unfinished.
4. **Serve via HTTP** — Construct 3 / Cocos / Unity-WASM games REQUIRE HTTP(S) (not `file://`). Use a minimal static server with explicit MIME types. Harden the server before committing: catch malformed percent-encoding and return 400 rather than throwing; contain resolved paths under the root; allow only `GET` and `HEAD`; validate `PORT`; bind to `127.0.0.1` by default with an explicit `HOST` override for broader access; and return true 404s for missing assets.
   ```bash
   # Node.js (RECOMMENDED — handles .wasm, .webp, .webm correctly)
   node server.js

   # Python (only if Node unavailable — lacks .wasm/.webp MIME types)
   python3 -m http.server 8124 --bind 0.0.0.0
   ```

   **Keeping the server alive for later verification:** use the terminal tool's tracked `background=true` mode for the long-lived Node process, then verify it in a separate foreground call with `curl -s -o /dev/null -w '%{http_code}' http://localhost:PORT/`. If the shell tool rejects shell-level `&` backgrounding, do not retry it; switch to tracked background mode. Always verify the served `<title>` to detect a stale server or port collision.
5. **Verify** — Playwright headless Firefox: canvas renders, zero console errors, all assets load. **Alternative:** `browser_exec` with `wait_for_load()`, `page_info()`, `js('console.error' capture)`, and `performance.getEntriesByType("resource")` filter for zero-size transfers. For custom HTML5 slots, compare the original and local inventories after the same staged intro→gameplay transition; late character, effect, win, and presentation manifests may be requested only after the overlay is dismissed.
   - **Prefer programmatic parity checks over vision.** After the same staged interaction, compare normalized original/local resource-path sets, hash or size-check captured files, and assert expected config/manifest/atlas counts. Use screenshots only as secondary visual evidence.
   - **Audit the original and local consoles, not just the local console.** A successful render can coexist with missing optional font atlases or layout configs. Capture `error`, `unhandledrejection`, and `console.error` before navigation and require zero errors after the same transition.
   - **Treat fetch-only config files as runtime dependencies.** Search the engine bundle for `fetch(new URL("config/...json"))` and capture those files even when they never appear in `performance.getEntriesByType`; layout configs can control character scale, offsets, and anchors.
   - **Resolve font XML image references relative to each XML file.** A bitmap-font XML can load successfully while its PNG/WebP atlas is missing; parse or inspect the XML and capture the referenced atlas from the original via same-origin browser fetch when direct download is protected.

**Construct 3 specifics**:
- Entry: `index.html` → loads `scripts/main.js` (ES module) → imports `c3runtime.js` + workers
- Workers: `workermain.js` spawns `dispatchworker.js` + `jobworker.js` (need proper MIME)
- Assets: `data.json` (game def), `prizes.xml` (paytable), `images/*.webp`, `media/*.webm` (Opus), `box2d.wasm`
- MIME types critical: `.js` = `application/javascript`, `.webp` = `image/webp`, `.wasm` = `application/wasm`. Serve Construct audio WebM as `audio/webm`; use `video/webm` only for actual video assets.
- **Canvas positioning**: C3 creates `<canvas>` directly in `<body>` with absolute positioning and inline styles (`width`, `height`, `margin-left`, `margin-top`). For responsive layout, wrap the canvas in a container div and use JS to move it after runtime initializes, then clear all inline styles so CSS controls layout.
- **Responsive wrapper pattern**: Add `#c3-game-container` (full-screen flex center) + `#c3-canvas-wrapper` (aspect-ratio: 784/440). Canvas CSS: `position: relative`, `width: 100%`, `height: auto`, `aspect-ratio: 784/440`. Desktop: max-width constraint (e.g., 960px). Mobile (≤768px): fills viewport width, centered vertically.
- **Move script**: Run after DOM ready + retries (500ms, 1s, 2s, 3s): `wrapper.appendChild(canvas)`, then `canvas.style.width = canvas.style.height = canvas.style.margin = canvas.style.position = ''`.
- **Mobile crop for landscape games on portrait**: When the game is landscape (aspect > 1) but mobile is portrait (aspect < 1), letterboxing wastes screen space. Use crop strategy: wrapper fills viewport height (`height: 100%`, `width: auto`), `overflow: hidden`, `display: block` (disable flex centering). Canvas: `height: 100%`, `width: auto`, `transform: translateX(-14%)`, `transform-origin: left center` to center the gameplay area (reels for slots). Adjust translateX % per game — measure where the core UI sits in the native canvas.

**Arcade-hosted Construct 3 games (construct-arcade.com / games.construct.net / scirra-arcade export type)** — discovered the hard way:
- The wrapper page (`games.construct.net/<id>/<ver>/embed.html`, the construct.net "play" page) only iframes the real game host `https://construct-arcade.com/<id>/<ver>/index.html`. Capture the game host, not the wrapper.
- The wrapper's `index.html` reveals only `constructNet_scriptURLs` (typically `scripts/supportcheck.js`, `scripts/offlineclient.js`, `scripts/main.js`, `scripts/register-sw.js`). **The engine/worker file list is not in any HTML** — read it from `scripts/main.js`'s runtime options block: `workerMainUrl`, `engineScripts:["scripts/c3runtime.js"]`, `workerDependencyScripts`, `scriptFolder:"scripts/"`, `exportType`.
- **Never add `scripts/c3runtime.js` as a page `<script>`.** With `useWorker:true` the loader fetches it and runs it *inside* `workermain.js`; loading it on the main thread crashes with `TypeError: Cannot read properties of undefined (reading 'XPathResult')` because the worker-dependency globals aren't there.
- **Worker scripts belong in `scripts/`** (`dispatchworker.js`, `jobworker.js` are requested as `/scripts/<name>.js`); **`xmldom.js` and `xpath.js` belong at the web ROOT** (bare worker-dep names; `/scripts/xmldom.js` 404s upstream).
- **Audio/media list + exact byte sizes live in `data.json`**: `["<name>", [["audio/webm; codecs=opus", ".webm", <bytes>]], false], …` followed by the folder prefix (`"media/"`). Download each name and assert the byte count — a mismatch means a wrong asset.
- **The static server must 404 any path with a file extension** — never SPA-fallback to `index.html`. Serving HTML for a `.js` request surfaces as `SyntaxError: Unexpected token '<'`; for a `.webm` it surfaces as `EncodingError: Unable to decode audio data`. Both look like code bugs and send you chasing the wrong thing.
- **`Cache-Control: no-store` for `.html/.js/.mjs/.css/.json`.** With a long max-age the browser keeps the pre-fix `index.html` and stale worker scripts, so fixes appear to do nothing and old console errors persist. Also re-navigate with `Network.setCacheDisabled: true`.
- **`register-sw.js` needs `sw.js` present**, else the browser logs a MIME SecurityError warning (harmless but noisy).
- **Verifying gameplay on a canvas game**: install `error`/`unhandledrejection`/`console.error` hooks with `Page.addScriptToEvaluateOnNewDocument` *before* navigating, then hash `canvas.toDataURL()` across samples — idle must be byte-identical for a few seconds, a spin must yield ~14 distinct states and then settle. Do NOT trust vision/OCR on stylised credit readouts; pixel-diff the HUD band instead (0 changed pixels idle vs ~12k across a spin).
- **C3 suspends its entire game loop when the tab is hidden.** In automated browser sessions call `Page.bringToFront()` and assert `document.visibilityState === 'visible'` BEFORE interacting or concluding the game is broken. Symptom: canvas frozen on the last frame, clicks delivered to the DOM but ignored, zero console errors. This causes false 'game is dead' diagnoses.
- **A C3 worker export has NO DOM to assert against** — `document.body.innerText` is empty and the whole game is one `<canvas>` (state lives in the worker). Read state by OCR-ing the canvas (Windows' built-in WinRT OCR via PowerShell: `Windows.Media.Ocr` — no install; upscale crops 3-5x for stylised digits; compare DELTAS across a known action rather than absolute values), or by hooking the `MessageChannel` protocol. Main-thread IndexedDB hooks see nothing: C3's LocalStorage runs inside the worker.
- **Ground-truth math**: loss spin = `-bet`, win spin = `-bet + paytable value`. Verify observed deltas against the game's own config parsed from `data.json` (e.g. `SETTING_START_CREDITS`, `SETTING_reel_spin_seconds`) and its XML paytable — byte sizes of assets are also in `data.json`'s audio table.
- **`Emulation.setDeviceMetricsOverride(deviceScaleFactor>1)` can break worker-mode OffscreenCanvas painting across reloads** — a 100% black canvas while the runtime stays alive (music streaming via message hooks) means rendering broke, not the game. Apply the override after boot only, or never reload while it is active.
- **A degraded browser daemon produces plausible garbage** (60 s screenshot timeouts, black canvases, silent navigation failures). Restart the browser session before debugging the game itself.
- **The first click often only dismisses an overlay screen** (paytable/intro). If one click changes the canvas and then nothing animates, click again — the second click is the spin.
- **A missing character can hide behind a late request.** Capture runtime resources after entering gameplay, diff normalized original versus local request paths, and download any absent character/effect manifests before judging visual parity.
- The game persists state in IndexedDB (`c3-localstorage-*` → `keyvaluepairs`, key `credits`). Injecting JS that awaits IndexedDB promises can hang the CDP evaluate; reset the origin with `Storage.clearDataForOrigin` instead. After heavy scripted play a C3 slot may persist `credits = NaN` and then silently ignore Spin clicks — clearing origin storage and reloading restores play.

**Pitfalls to avoid**:
- **Clean-room vs direct port confusion**: Determine the asset posture from the request and repository context before implementation. For a 1:1 replica, original-assets request, or authorized portfolio/research clone, start with direct port. Ask only when the posture genuinely changes the deliverable and cannot be inferred.
- **File protocol blocked**: C3 shows alert "Web exports won't work until you upload them" on `file://`. Must serve via HTTP.
- **Worker MIME types**: If `workermain.js` served with wrong MIME, workers fail silently. Explicit MIME map in Node server fixes this.
- **Port conflicts**: Kill existing processes on target port before starting server (`pkill -f "port 8124"`).
- **Python http.server lacks MIME types**: `python3 -m http.server` serves `.wasm` as `application/octet-stream` and `.webp` without type — workers and images fail silently. Use Node.js with explicit MIME map for Construct 3.
- **License checks stop locally**: Games with external license validation (e.g., periodic requests to a license server) stop firing when served from localhost — the license endpoint returns 404/empty and the game runs anyway. Verify the game initializes without the license handshake.
- **Mobile landscape-on-portrait letterboxing wastes space**: Default responsive (fill width, letterbox top/bottom) leaves 60%+ black bars on portrait phones. Use crop strategy: fill height, `overflow: hidden`, shift canvas with `transform: translateX(-N%)` to center the gameplay area. Wrapper needs `display: block` on mobile to disable flex centering that fights the transform. Measure translateX per game — slots typically have reels at ~60-65% from left edge.
- **Flex centering fights crop transforms**: The desktop flex-center wrapper (`align-items: center; justify-content: center`) centers the canvas in the wrapper, but on mobile the crop transform shifts the canvas LEFT. Disable flex on mobile wrapper with `display: block` so the transform-origin and overflow work correctly.

---

## Fallback: Clean-Room Rebuild (only when original assets NOT permitted)
Use this when the user explicitly requires license-safe assets (CC0/public domain).

Iron rules:
- **Never use the original game's copyrighted art in a redistributable clone.** The
  capture is for study; the rebuild uses CC0/public-domain replacements. Credit every
  replacement asset in the clone's NOTES.md.
- **Design before more code**: when the user asks for production quality, produce a
  design source (frames + tokens + component specs) and get sign-off before wiring
  assets into the running app. HTML design boards import into Figma via the
  html.to.design plugin — a `.fig` cannot be authored headlessly.
- **Verify by real execution only**: CDP screenshot + console-error capture + reading
  game state back from the page (balance changed, spins resolved). A rendered canvas
  proves nothing; a completed async timeline does.

Procedure:
1. **Capture** — headed Chrome under CDP (not headless: less bot-detectable) driven
   through mitmproxy. Full detail: `references/game-capture-replay.md` § Capture.
2. **Replay architecture** — pick offline / coherent-session / hybrid based on how
   session-bound the API responses are. Decision rules:
   `references/game-capture-replay.md` § Replay.
3. **Rebuild clean-room** — engine (PixiJS for 2D slots works well), state-driven view
   (`syncViewWithState(matrix)` maps all visual flags from data, no per-cell manual
   styling), async/await timeline for the spin choreography. Guard loops: any
   cascade/re-spin loop driven by RNG refills needs a hard round cap or it never
   terminates. Time-box every awaited animation phase so a paused tab can't deadlock
   the timeline; integrate tweens into the app ticker rather than orphan rAF loops.
4. **Source license-safe assets** — procedure and known-good sources:
   `references/cc0-asset-sourcing.md`.
5. **Design handoff** — 3-frame design board (base game / win state / paytable) +
   tokens panel; every value the implementer needs stated at design scale. Import via
   html.to.design, or hand-rebuild from the spec block.
