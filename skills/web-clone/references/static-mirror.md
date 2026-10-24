# 1:1 Faithful Clone of Static-Built Sites: Full Asset Mirror

> Applies to: **Astro / Vite SSG / Hugo / Eleventy / any site whose client runtime ships as downloadable static assets** — even WebGL/Canvas/gaussian-splat heavy frontends.
> Does NOT apply to: true server-rendered / data-driven SPAs (business data behind an API) → use `network-capture.mjs` for API stand-ins instead.

## Core insight (why this achieves 1:1)
For these sites the "**real source is not on GitHub**", but the **deployed static assets ARE the truth**: HTML + bundled JS + CSS + runtime-fetched binaries (`.sog`/`.buf`/`.wasm`/`.riv`/fonts/images/videos). Mirror them **as-is**, serve from a web root, and you are running **real code + real assets** — not a rebuild. Hence byte-for-byte 1:1, bugs and quirks included.

This extends the "real source first" iron rule to static sites: **for a static site, "getting the real source" = "mirroring the whole deployed bundle"**.

> ⚠️ Decision-tree trap: don't see `astro:true` and route to "find the source theme in a theme market" — that only holds for sites **using an off-the-shelf open-source theme**. **Custom Astro sites (e.g. Lusion's oryzo.ai) have no purchasable theme** — the correct path is this full mirror.

## Why "real browser, full-scroll capture" is required — grep/wget alone won't do
- Binaries like `.buf`/`.sog`/`.riv` are **fetched by JS at runtime based on scroll progress**, with URLs often **assembled dynamically in code** → grepping the bundle misses some, and `wget --mirror` never discovers them (it only follows static HTML links).
- The only reliable way: **real browser load + scroll start to finish**, record every **actual network request**, then mirror from that "actually-requested list".

## One-shot script
```bash
node <skill_dir>/scripts/mirror-site.mjs \
  --url https://<site>/ \
  --out <hub>/<name>-clone
```
Outputs:
- `<out>/site/…`: mirrored **same-origin** assets (paths preserved; directory URLs stored as `index.html`)
- `<out>/own-asset-urls.txt`: same-origin asset list
- `<out>/third-party.json`: third-party hosts + **webfont CSS needing self-hosting** (Typekit/Google) hints
- `<out>/mirror-manifest.json`: all requests + statuses

The script does a real full-scroll browser capture and downloads via the browser network stack (cookies/TUN/proxy consistent with the page).

For large server-rendered sites (WordPress etc.), a sitemap-driven batch downloader is faster than per-page browser captures — enumerate URLs from `sitemap_index.xml`, fetch pages + collect + download same-origin assets concurrently, then rewrite (strip tracking, localize URLs).

## Manual finishing after the mirror (to run 1:1 offline)
The script only moves same-origin assets; it does not rewrite automatically — **handle third parties per `third-party.json`**:

1. **Self-host domain-locked fonts (most common = Adobe Typekit)**
   Typekit kits are domain-locked; a remote `@import` may not render after the domain change → self-host:
   ```bash
   # ① Download the kit CSS (direct connection; typekit is often proxy-blocked → do not go through a proxy)
   curl -sL -A "Mozilla/5.0 …Chrome…" -e "https://<site>/" "https://use.typekit.net/<kit>.css" -o site/typekit/kit.css
   # ② Extract use.typekit.net/af/... font URLs from the kit.css @font-face src, download each into site/typekit/fonts/
   #    Same font, 3 suffixes: /l=woff2  /d=woff  /a=otf (trust the file magic bytes wOF2/wOFF/0x00010000, not filenames)
   # ③ Write local @font-face (relative url + keep format hints), see below
   ```
   Local `@font-face`:
   ```css
   @font-face{ font-family:"<same name>"; src:url("./fonts/x.woff2") format("woff2"),
     url("./fonts/x.woff") format("woff"), url("./fonts/x.otf") format("opentype");
     font-display:swap; font-weight:<original range>; }
   ```
   Then point references at the local copy — **note Typekit is usually the first line `@import"https://use.typekit.net/<kit>.css"` in the main CSS, not an HTML `<link>`**:
   ```bash
   perl -0pi -e 's{\@import"https://use\.typekit\.net/<kit>\.css"}{\@import"/typekit/kit-local.css"}g' site/_astro/<main>.css
   ```

2. **Strip tracking**: cloudflare beacons / GA / pixels — excise `<script>` tags precisely.

3. **Public CDNs (Rive wasm@unpkg / third-party players)**: public CDNs load cross-origin when online; local serving + internet = fine → can stay online (they break offline; note it in NOTES). To go fully offline, mirror them and rewrite the injection points.

4. **Vimeo/YouTube embeds**: iframes play online, break offline → usually non-core, non-hero; note in NOTES.

## Serve + verify
```bash
cd <hub>/<name>-clone/site
python3 -m http.server 8124      # MUST serve from site/ as web root so root-relative paths (/_astro /models …) resolve
```
Then per SKILL.md Step 5: browser with 0 console errors + `visual-diff.mjs` pixel comparison against the original. For heavy WebGL sites, remember to **scroll to each section and screenshot** for comparison (static full-page screenshots miss scroll-triggered GL frames).

## Worked example: oryzo.ai (Lusion, L6)
- 135 same-origin assets (HTML+bundle+CSS + 25×`.buf` geometry/camera animations + 2×`.sog` gaussian splats + sorting wasm + `.riv` + MSDF + fonts + 80+ images)
- Only rewrites: Typekit `@import` → locally self-hosted halyard; removed cloudflare beacon
- Result: `scrollHeight` exactly equal, **0 console errors**, hero pixel diff **36/1.3M (5/5)**
- Kept online: Vimeo gallery videos + unpkg Rive wasm (non-core)

## Webflow mirror pitfalls (verified on inbeat.agency, 463 pages)
- **Runtime webpack chunks**: Webflow's main bundle lazy-loads `inbeat-agency.achunk.<hash>.js` from a chunk-map inside the bundle (`r.u=e=>"…achunk."+({id:"hash",…})`). Grep HTML for these misses them entirely — extract the id→hash map from the downloaded main JS and download every chunk.
- **S3 double-encoding**: WF CDN URLs can contain `%2520` (encoded `%20`). S3 403s the single-decoded form — fetch with the raw URL as found, but decode fully (repeat `unquote` to fixpoint) for the on-disk filename, and unquote once when rewriting HTML.
- **Strip SRI after localization**: `integrity`/`crossorigin` attributes must be removed or every localized script/CSS 404s with "Failed to find a valid digest".
- **GTM strip regex**: the inline loader is `w[l]=w[l]||[]` — escape the double pipe, and also strip the `<!-- GTM (noscript) -->` iframe block. Removing the GTM loader also kills GA4/Ads/LinkedIn/pixel beacons that load through it.
- **Audit false positives**: keyword audits flag blog *prose* mentioning "hotjar"/"gtm plan" as tracking — confirm findings are `<script>` tags before acting.
- **Verification waits**: use `waitUntil:'domcontentloaded'` + fixed sleep, not `networkidle` (Calendly/Vimeo polling never idles). Serve each clone on a FRESH port and check `netstat` first — a previous session's hub server silently answers with the wrong site.
