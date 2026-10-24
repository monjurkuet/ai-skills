# Complex-Site Cloning Playbooks

For L4-L6 sites. Goal: turn "looks complicated" into an executable path.

## L4 Animated brand sites

1. `recon-site.mjs`: capture 3-viewport screenshots, sections, video/canvas counts.
2. Record scroll-library signals: GSAP / Lenis / ScrollTrigger / Locomotive.
3. Decompose the page into five categories: hero, scroll narrative, video masks, hover states, transitions.
4. Prioritize reproducing rhythm and visual grammar; micro-interactions may be approximated, but differences MUST be flagged in `CLONE_REPORT.md`.
5. Score hero and key scroll positions with `visual-diff.mjs`.

## L5 WebGL / Canvas / Three.js

1. First hunt real source, source maps, public repos; only reverse-engineer the bundle if none found.
2. `recon-site.mjs`: record canvas sizes, counts, framework signals.
3. `sourcemap-hunt.mjs`: try downloading source maps.
4. Split into technical pillars: rendering, shaders, post-processing, physics, interaction, audio, asset loading.
5. Never blind-write complex shaders; build the minimal runnable scene first, then add materials, lighting, post one by one.
6. Interaction verification must use real browser actions or screenshot/video evidence — never "the code looks right."

## L6 SaaS / e-commerce / logged-in systems

By default clone only the presentation layer and demoable flows. Never promise real accounts, payments, orders, or permissions.

1. For logged-in public pages, confirm authorization and privacy boundaries first.
2. `network-capture.mjs`: save XHR/fetch responses as fixtures.
3. Classify APIs: content APIs, search/filter, user state, transactions/writes.
4. Content APIs can be local JSON stand-ins; transaction/write APIs only get mocked success/failure states.
5. Keep empty, loading, error, and insufficient-permission states — not just the happy path.
6. `audit-clone.mjs`: scan for external links, original-brand residue, and tracking scripts.

## Multi-page / CMS / corporate sites

1. Capture sitemap, navigation, footer, and main templates first.
2. Clone only representative templates: home, listing, detail, search/filter, contact.
3. Generate repeated content from data files; don't hand-write every page.
4. CMS admin is not cloned; if editing capability is needed, use local JSON/Markdown instead.

## Success criteria

- Complete original-site evidence: screenshots, recon JSON, network logs, asset manifest.
- Clone runs locally; console/page errors at zero or explicitly explained.
- `CLONE_REPORT.md` scores structure, visuals, interaction, responsive, functional boundaries.
- `CLONE_AUDIT.md` shows no tracking scripts, no original-brand residue, no unexplained foreign-language/external-link risks.
- Explicit boundaries for real backends, proprietary APIs, and copyrighted assets.
