# Non-Construct HTML5 Slot Direct Ports

Use this recipe when a CodeCanyon/Envato preview is a custom JavaScript canvas slot rather than a Construct 3 export.

## Capture

1. Load the live preview in headed Chrome and record `performance.getEntriesByType('resource')` after the title scene and after entering the game.
2. Normalize inventories before scripting downloads: strip `\\r` and whitespace, reject empty lines, remove URL query strings only when deriving the local relative path, and preserve the original URL for the fetch.
3. Download the HTML, external scripts, CSS, configuration, math, sprite manifests, atlases, fonts, audio, and videos while preserving their directory layout.
4. Treat TexturePacker/Cocos-style manifests as an asset graph: each `meta.image` value is relative to the manifest directory, not the site root. Parse every manifest recursively and resolve atlas paths against its own location.
5. Build the inventory in stages: capture the boot resource set, then advance through the title/continue overlay into the actual game and capture again. Runtime manifests and sprite sheets may be requested only after the transition, so an initial-load inventory is not sufficient for completeness.
6. Reconcile the original and local inventories after the same staged interaction. Compare normalized request paths and download every original runtime request that is absent locally; include late character, effect, win, and presentation assets. A visually missing mascot can be caused by one omitted late manifest even when the main screen otherwise renders.
7. A `403` from a manifest-derived filename does not prove the asset is absent: the filename may be a frame label rather than a separate file, or the object key may require same-origin access. Compare the request against the live resource timeline before concluding it is missing.

## Local server

Serve over HTTP with explicit MIME types for JavaScript, JSON, SVG, WebP, PNG, MP4, OGG, and fonts. Return a real 404 for missing files and send `Cache-Control: no-store` for HTML, JavaScript, CSS, and JSON.

Reject a decoded NUL byte (`%00`) with HTTP 400 **before** calling `fs.stat()`. On Windows, Node throws synchronously for NUL-containing paths, and an uncaught throw inside the request handler kills the whole static server. Also wrap `decodeURIComponent()` in try/catch, and validate environment ports with a decimal regex such as `/^\d+$/`; `Number('0x10')` otherwise silently listens on port 16.

Harden the static server before committing it:

- catch `decodeURIComponent()` failures and return HTTP 400, because one malformed percent-encoded URL otherwise crashes the request handler;
- bind to `127.0.0.1` by default and require an explicit `HOST` opt-in for broader exposure;
- validate `PORT` before listening and fail with a clear error;
- allow only `GET` and `HEAD`, returning HTTP 405 for other methods;
- resolve the requested path beneath a canonical root and reject traversal using `path.relative()` plus an absolute-path check;
- handle `createReadStream()` errors so a file removed between `stat()` and open does not become an unhandled stream error.

Exercise these cases against a running instance: root `200`, malformed encoding `400`, missing asset `404`, traversal `403`, unsupported method `405`, `HEAD` `200`, representative asset MIME type, and invalid-port startup rejection.

## Verification

1. Install `error`, `unhandledrejection`, and `console.error` hooks before navigation.
2. Verify the served title and HTTP status; a matching title prevents confusing another port occupant with the target game.
3. Wait for the game’s staged loading sequence. A black canvas during the title/boot phase is not a failed port.
4. Advance intro overlays deliberately, then verify the actual game screen. Use canvas pixel output or a hash/length change as functional evidence that rendering changed, plus a screenshot for visual inspection.
5. Exercise one gameplay action and read state back when exposed. If the page reports `visibilityState: hidden`, bring it to the front before judging animation, frozen reels, or click handling.
6. Check that every runtime request resolves locally and that no local resource has zero bytes or an HTML error body.
7. Compare the original and local runtime inventories after entering gameplay, not only after boot. Download missing late-stage files, reload with caching disabled, and verify the specific character/effect is visible in the final frame.
8. Run the same programmatic audit against both builds: normalized request-path sets, expected manifest/config/atlas counts, console errors, unhandled rejections, canvas dimensions, visibility state, and rendered canvas payload. Prefer this evidence over subjective visual comparison; screenshots remain a secondary check.
9. Search the JavaScript bundle for runtime `fetch` targets under `config/`. Capture fetch-only files because they may control layout but never appear in the Resource Timing API. For character art specifically, verify the configuration contains scale and offset/anchor fields and compare those values with the original.
10. Parse bitmap-font XML files and resolve each referenced image relative to the XML directory. Fetch missing PNG/WebP atlases through the loaded original page when direct downloads return 403; then require the local console to report zero font-loader 404s.

### Deterministic audit shape

Use one audit function for original and local pages after an equivalent transition. Report at least:

- canvas intrinsic width/height and CSS width/height;
- `document.visibilityState`;
- uncaught errors, unhandled rejections, and captured `console.error` messages;
- normalized resource paths missing on either side;
- expected counts for critical manifests (for example, all numbered character animation manifests);
- presence of fetch-only layout configs;
- canvas `toDataURL()` length or another deterministic payload check proving non-empty rendering.

Do not treat matching screenshots or a visible mascot as sufficient parity: a missing optional layout config can silently change scale/position, and a missing font atlas can leave the main scene readable while runtime errors remain.

## Common failure signatures

- **Manifest JSON loads but the scene stays black:** the referenced atlas was not downloaded or was resolved from the wrong directory.
- **A character or mascot is missing while the slot screen still renders:** capture the original inventory after entering gameplay, diff it against the local inventory, and inspect late-requested character manifests/sheets; the omitted file may be a staged animation manifest rather than the main atlas.
- **First screenshot is black, later screenshot is complete:** the engine staged asynchronous loads; wait and sample again before diagnosing the port.
- **Only the intro appears:** dismiss the intro/continue overlay and sample the next screen.
- **Runtime requests show only JSON manifests:** confirm the atlas images were copied and that the server returns `image/webp` or `image/png`, not generic `application/octet-stream`.
- **Download script reports malformed URLs:** the inventory contains carriage returns or trailing whitespace; normalize each line before extracting the URL.
- **Direct CDN downloads return 403 for font atlases:** fetch each referenced image from the loaded original page with same-origin `fetch()`, convert the returned bytes to base64 in the page, and write them locally. Then rerun the console audit; the bitmap-font loader must report zero 404s.
