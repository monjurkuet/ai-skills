---
name: web-clone
description: Use when asked to clone, reproduce, or remix any website.
author: Jane-xiaoer (claude-skill-web-clone v1.6.0, adapted for Hermes)
version: 1.7.0
license: See LICENSE in skill directory (source repo)
---

# Web Clone · Website Cloning Methodology

Reproduce any website — single-file static page to WebGL-heavy demo — without faking it from AI hallucinations.

## Clone hub (workspace location)
All clones live in a hub directory, one subdirectory per clone. Resolution order:
1. `--root <dir>` flag on `init-clone.mjs`
2. `CLONE_HUB` environment variable
3. Default: `~/projects/website-clones`

Substitute the resolved hub for `<hub>` in every path below. (On this host, the current hub is set per-project; e.g. `G:/github/website-clones` for the website-clones project — pass it via `--root` or `CLONE_HUB`, don't rely on the skill knowing it.)

## When to Use
User says: clone website / reproduce site / mirror this site / make a copy of this site / rip this site / reverse-engineer this WebGL/Canvas/Three.js effect / make it my own / remix this site's look.

## Iron rule: real source first, never copy AI-guessed code
Treat an AI-generated clone analysis as a hypothesis: verify every executable block against real source before copying it. When the user asks for a 1:1 replica or an authorized portfolio/research clone, prioritize real source, published assets, and runtime captures over approximation; do not substitute a visual remix merely because the original contains copyrighted material.

**Case in point** (`references/marbles-case.md`): a real WebGL marbles demo uses analytic ray-sphere intersection + SVG `feDisplacementMap` refracting the live DOM. An AI analysis confidently described ray-marching + SDF + DOM-as-texture — an entirely different, much slower implementation.

So the first action is always: **get the real source.**

## Decision tree (in order, no skipping)

The skill dir is fixed: `C:/Users/muham/AppData/Local/hermes/skills/web/web-clone` — substitute it for `<skill_dir>` below. On this host, pass native Windows paths (`C:/...`, `G:/...`) to node scripts — MSYS `/tmp` paths break native tools.

### Step 0 · Scaffold the clone project (init-clone)
```bash
node "<skill_dir>/scripts/init-clone.mjs" <name> --url <original-url> --root "<hub>"
```
Creates `<name>-clone/`, `NOTES.md`, `RECON/screenshots/`.

### Step 1 · Search GitHub for the source FIRST
```bash
gh api "search/repositories?q=<keyword>" | jq -r '.items[] | "\(.full_name) ⭐\(.stargazers_count) \(.description)"' | head -10
```
vercel.app / netlify.app / github.io URL slugs are often the repo/deployer name. Single-file site → grab raw: `curl -sL https://raw.githubusercontent.com/<user>/<repo>/main/index.html`. **Found source → continue to Step 4 and preserve the source structure and assets.** Inspect license metadata to preserve required attribution and determine the concrete distribution constraint; do not let an unverified license assumption block authorized local replication.

### Step 2 · No source found → browser reconnaissance
Prefer Hermes `browser_exec` (CDP) for live probing; or run the bundled Playwright scripts:
```bash
node "<skill_dir>/scripts/recon-site.mjs" --url <url> --out <clone>/RECON --label original
node "<skill_dir>/scripts/asset-harvest.mjs" --recon <clone>/RECON/original-recon.json --out <clone>/assets/original --manifest <clone>/RECON/asset-manifest.json
node "<skill_dir>/scripts/network-capture.mjs" --url <url> --out <clone>/RECON/network --label original
node "<skill_dir>/scripts/route-crawl.mjs" --url <url> --out <clone>/RECON/routes --label original --max-pages 25 --max-depth 2
node "<skill_dir>/scripts/interaction-probe.mjs" --url <url> --out <clone>/RECON/interactions --label original
node "<skill_dir>/scripts/sourcemap-hunt.mjs" --recon <clone>/RECON/original-recon.json --out <clone>/RECON/sourcemaps
```
(Requires `playwright` resolvable via `scripts/lib/playwright-loader.mjs` — `npm i -D playwright` in the project.)

**`browser_exec` helper functions are synchronous, not async.** Do not `await` them.
Call `new_tab(url)`, `wait_for_load()`, `page_info()`, `js(expr)`, `fill_input(sel, txt)`,
`click_at_xy(x, y)`, `capture_screenshot()` directly — they return results immediately.
Using `await` causes `SyntaxError: 'await' outside function` in the tool sandbox.

**Anti-bot challenges (Cloudflare Turnstile, reCAPTCHA, etc.) block automated capture.**
The recon scripts capture only the challenge page. Use `browser_exec(local=true)` to open
a headed Chrome session with the user's profile, have the user solve the challenge manually,
then re-run recon on the post-challenge URL (often an iframe `src`).

### Step 2.5 · Grade complexity before promising anything
Grade L1–L6, pick mode (faithful clone / visual clone / content remix), state expected fidelity and what will NOT be cloned. Rules: `references/assessment.md`. For visual/remix modes, generate `design-dna.json`:
```bash
node "<skill_dir>/scripts/dna-scaffold.mjs" --recon <clone>/RECON/original-recon.json --out <clone>/RECON/design-dna.json --name "<name>"
```
See `references/design-dna.md`. ⚠️ **The faithful-clone branch never uses DNA** — real source is the truth; don't let an approximate style profile dilute the byte-faithful rule.

### Step 3 · Pick the path by recon result
| Recon result | Path |
|---|---|
| Static HTML/CSS, no framework | `wget --mirror` → strip tracking → edit copy |
| React/Vue/Next content site | rebuild on a template, pour content in |
| SPA / data-driven | `network-capture.mjs` → local JSON/mock-server fixtures |
| Multi-page site | `route-crawl.mjs` route map → template per page type |
| Complex interactive | `interaction-probe.mjs` records hover/click/scroll/drag states → build per state |
| **WebGL/Canvas/Three.js heavy** | deep reverse-engineering of real source (below) or find similar open-source 3D template. No source → runtime frame-capture + baseline gate, `references/effect-extraction.md` |
| **Static-built site (Astro/Vite SSG/Hugo), even WebGL-heavy** | `mirror-site.mjs` full-scroll mirror of every deployed asset (incl. runtime-fetched `.sog/.buf/.wasm/.riv`/fonts) → self-host fonts + strip tracking → 1:1 clone. `references/static-mirror.md` |
| Site using an off-the-shelf theme | find the original theme in the theme market (only for theme-based sites; custom sites take the mirror path) |

L4–L6 sites follow `references/complex-playbooks.md`, not just the plain corporate-site flow.

### Step 4 · Set up the project in the clone hub
`<hub>/<name>-clone/`. Keep a read-only `index-original.html` baseline. Check `package.json` engines for the Node version (host: node v24 via nvm4w).

### Step 5 · Strip tracking + document + verify
- **Strip tracking**: GA (`gtag`/`googletagmanager`), pixels, heatmaps — excise line-by-line (GA block is usually at the top of `<head>`).
- **NOTES.md** (required): complexity, mode, original-vs-clone comparison, fidelity score, known gaps. Template: `references/deliverables.md`.
- **TEARDOWN.md** for complex sites — every conclusion cites real source line numbers.
- Score the clone per `references/assessment.md`; scores must be backed by screenshots/source/runs.
- **Verify in a real browser** (hard requirement): local server → load → console must be free of JS/WebGL errors → screenshot vs original. Use Hermes `browser_exec`/`desktop_preview`. Honestly record what can't be verified (e.g. synthetic `isTrusted=false` events can't trigger drags — say so, never fake success).
- After cloning, re-run recon on the clone and compare:
```bash
node "<skill_dir>/scripts/recon-site.mjs" --url http://127.0.0.1:<port>/ --out <clone>/RECON --label clone
node "<skill_dir>/scripts/compare-recon.mjs" --original <clone>/RECON/original-recon.json --clone <clone>/RECON/clone-recon.json --out <clone>/CLONE_REPORT.md
node "<skill_dir>/scripts/visual-diff.mjs" --original <clone>/RECON/screenshots/original-1440.png --clone <clone>/RECON/screenshots/clone-1440.png --out <clone>/RECON/visual-diff-1440.json --diff <clone>/RECON/screenshots/visual-diff-1440.png
node "<skill_dir>/scripts/audit-clone.mjs" --project <clone> --brand "<brand>" --out <clone>/CLONE_AUDIT.md
```

### Step 6 · Replace with your own content
Replace the trio: text (`index.html`/`data/*.json`/`content/*.md`), media (`public`/`assets`), brand colors (CSS vars / Tailwind theme). Non-trivial structure → write `REPLACE_GUIDE.md`. With `design-dna.json`: keep the DNA, swap the content — design_system → CSS custom properties; visual_effects.effect_intensity picks the tier (lightweight CSS / medium Canvas+GSAP / heavy Three.js); prefer real harvested assets over AI re-draws.

## Reverse-engineering WebGL/Canvas heavy frontends (core craft)
Split the site into technical pillars; locate the real implementation + line numbers for each: rendering (WebGL/shader algorithms), composition (SVG filters / multi-canvas / post), physics, interaction, audio. Only then check any second-hand analysis.

**Three disciplines when extracting effects:**
1. **Evidence grading**: every conclusion tagged `SOURCE` (real source/sourcemap/runtime dump/frame capture), `PARTIAL` (names/slices, unproven), or `GUESS` (visual fit/magic numbers). **Untagged = GUESS; must upgrade to SOURCE before copying.**
2. **No-compensation**: never hide timing/coordinate/state bugs by tuning brightness/speed/position/noise; fitted values stay GUESS with the upgrade path documented.
3. **Baseline-first gate**: build a minimal RAW REPLAY from real draw calls/shaders/uniforms → frame-by-frame comparison passes → only then refactor.
Details: `references/effect-extraction.md`.

**Transferable pattern**: displacement-map DOM refraction — offscreen WebGL computes an RG=displacement/B=fresnel map, then SVG `<filter><feDisplacementMap>` warps the live interactive HTML. Three.js `MeshPhysicalMaterial(transmission)` can fake glass, but cannot refract the whole page. See `references/marbles-case.md`, `references/reverse-engineering.md`.

## License, attribution, and execution posture
Inspect the `LICENSE` file, package metadata, repository license field, README, and stated notices. Treat licensing as engineering metadata: it determines required attribution and distribution constraints, not whether technical analysis may proceed.

- For a requested 1:1 replica or authorized local portfolio/research clone, preserve original assets and structure by default and do not insert repetitive copyright caveats into the deliverable.
- Preserve required attribution and record copied-asset provenance in `NOTES.md` when useful.
- If redistribution rights are unclear, complete local development and identify the exact publication decision rather than replacing all originals or abandoning the clone.
- Switch to substitute assets or a clean-room rebuild only when the user explicitly requests redistributable/license-safe output or a concrete constraint forbids originals.

```bash
gh api repos/<u>/<r> | jq '.license'   # + LICENSE file + README notices
```

Do not infer permission from “public on GitHub,” and do not assert legal certainty from metadata alone.

## Deliverables
- Project root: `NOTES.md`; complex sites add `TEARDOWN.md`; reporting adds `CLONE_REPORT.md`; pre-launch adds `CLONE_AUDIT.md` (tracking scripts, original brand/language residue, TODOs, external URLs); `RECON/screenshots/` original-vs-clone pairs; update the hub `README.md` index.

## Bundled scripts
`scripts/init-clone.mjs` scaffold · `recon-site.mjs` Playwright recon (framework/assets/DOM/console + 1440/768/390 screenshots) · `asset-harvest.mjs` asset download + manifest · `network-capture.mjs` XHR/fetch fixtures · `mirror-site.mjs` full-scroll same-origin asset mirror for static-built sites · `route-crawl.mjs` internal route map · `interaction-probe.mjs` hover/click/scroll/drag states · `sourcemap-hunt.mjs` source maps from JS chunks · `compare-recon.mjs` CLONE_REPORT.md · `visual-diff.mjs` pixel diff · `audit-clone.mjs` residue audit · `dna-scaffold.mjs` design-dna.json. References: `references/*.md`.

## Capability boundaries
- High fidelity: static marketing pages, corporate sites, content React/Vue/Next, animation sites with findable source.
- Visual-only, simplified: CMS backends, complex scroll narratives, multi-breakpoint, WebGL/Canvas effects, third-party embeds.
- Never promised complete: login, payments, ordering, search/recommendation, permissions, or proprietary server business logic; use local fixtures or mock APIs for these and state the integration boundary precisely.
- 1:1 replica mode: preserve original assets, runtime behavior, and file structure when the request permits direct replication. Substitute assets only for an explicitly clean-room/redistributable deliverable.

## Common pitfalls (this session)
- **Tailwind CSS v4 breaking change**: `tailwindcss@4` moved the PostCSS plugin to `@tailwindcss/postcss`. If `npm install tailwindcss@latest` pulls v4, update `postcss.config.cjs` to use `'@tailwindcss/postcss': {}` instead of `tailwindcss: {}`, or pin `tailwindcss@3` for the classic plugin.
- **React Router v6 Link prop**: Use `to` not `href` on `<Link>` components. `href` is for `<a>`; `react-router-dom` Link only accepts `to`.
- **TypeScript unused imports**: With `noUnusedLocals`/`noUnusedParameters` enabled, every import must be used. Remove unused Lucide icons and component imports immediately after writing a file — don't defer to a later pass.
- **init-clone.mjs idempotency**: If the clone directory already exists, the script exits non-zero. Handle this by either removing the old directory first or working inside the existing one — don't treat the exit code as a hard failure.
- **Recon/compare/visual-diff are mandatory for faithful clones**: After the dev server runs clean, run the full recon pipeline on the clone (`recon-site.mjs --label clone`), then `compare-recon.mjs` + `visual-diff.mjs` to produce `CLONE_REPORT.md` and a pixel-diff image. Skipping this means you cannot claim fidelity scores honestly.
- **Build must pass before browser verify**: `npm run build` (or `tsc -b && vite build`) must exit 0 before you spin up the dev server for visual QA. A passing dev server with a failing production build is a false positive.
