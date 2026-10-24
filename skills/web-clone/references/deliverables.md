# Deliverable Specs and Templates

Standard deliverables for each clone subproject (`<hub>/<name>-clone/`).

## NOTES.md (required)

```markdown
# <name> · Clone notes

## Source info
- Original URL:
- Source repo: (if any)
- Original author:
- License: MIT / Apache / NONE / proprietary  ← must be verified; see the license table in SKILL.md
- Attribution requirements:

## Tech stack
- Framework / key libraries / Node version:

## Pre-clone assessment
- Complexity level: L1 / L2 / L3 / L4 / L5 / L6 (see the web-clone skill's references/assessment.md)
- Recommended mode: faithful clone / visual clone / content remix / technical teardown
- Parts achievable at high fidelity:
- Parts needing approximation or substitution:
- Parts NOT cloned:
- Main risks:

## Run it
` ` `bash
cd <hub>/<name>-clone
# Single-file static site: python3 -m http.server 8123
# Framework site: nvm use <ver> && npm install && npm run dev
` ` `

## What was changed (vs original)
- Removed tracking scripts: ... (GA/gtag line numbers)
- ...

## Original vs clone
| Module | Original behavior | Clone implementation | Difference / tradeoff | Evidence |
|---|---|---|---|---|
| Hero |  |  |  | screenshot / file:line |
| Navigation |  |  |  |  |
| Core motion |  |  |  |  |
| Content sections |  |  |  |  |
| Mobile |  |  |  |  |

## Clone scores
- Source evidence: /5
- Structure fidelity: /5
- Visual fidelity: /5
- Motion/interaction: /5
- Responsive: /5
- Functional completeness: /5
- Content replacement: /5
- Legal/deploy risk: /5
- Overall:

## Replacement map (what to change, where)
- Text → file, line
- Images/media → directory
- Colors → CSS variables / theme
- 3D models / fonts → ...

## Verification
- [ ] Runs locally, console 0 errors
- [ ] Screenshots compared against the original (RECON/screenshots/)
- [ ] `route-crawl.mjs` route maps for original/clone (required for multi-page sites)
- [ ] `interaction-probe.mjs` hover/click/scroll/canvas state evidence (required for interactive sites)
- [ ] `visual-diff.mjs` screenshot diff report (when possible)
- [ ] `audit-clone.mjs` residue audit report
- Points that could NOT be verified (record honestly, never fake): ...
```

## TEARDOWN.md (for complex interactive sites)

Technical teardown document. **Every conclusion cites real source line numbers.** Structure:
- **0. One-sentence essence**
- **A. Real technical teardown** (by pillar: rendering/composition/physics/interaction/audio; each entry cites line numbers **+ evidence grade `SOURCE`/`PARTIAL`/`GUESS`**, see `effect-extraction.md`)
- **B. Second-hand analysis check table** (if an AI analysis document exists: `claim | real source | accuracy ✅/⚠️/❌ | notes`; focus on substantive errors)
- **C. Transferable methodology** (general patterns / site-specific details / cloning path)

## RECON/ (recon artifacts)
- `screenshots/original-{1440,768,390}.png` — original at three viewports
- `screenshots/clone-1440.png` — clone screenshot (for comparison)
- `screenshots/visual-diff-1440.png` — screenshot diff image (when possible)
- `original-recon.json` — recon probe output (framework/canvas/scroll libs/fonts etc.)
- `routes/original-route-map.json` / `.md` — original internal route map + per-route screenshots
- `routes-clone/clone-route-map.json` / `.md` — clone internal route map + per-route screenshots
- `interactions/original-interactions.json` / `.md` — original interaction states, network, console, screenshot evidence
- `interactions-clone/clone-interactions.json` / `.md` — clone interaction states, network, console, screenshot evidence
- `asset-manifest.json` — original asset manifest + download status (when possible)
- `network/original-network.json` — API/XHR capture list (required for SPA/SaaS)
- `network/fixtures/` — saved JSON/text responses
- `sourcemaps/sourcemap-manifest.json` — source map hunt results (prioritize for complex frontends)
- `visual-diff-1440.json` — pixel diff metrics
- `design-dna.json` — structured design identity (output of visual-clone/content-remix modes; scaffolded by `dna-scaffold.mjs`, completed manually; schema in `design-dna.md`)
- `baseline/` — "minimal raw replay" artifacts + evidence pack for WebGL/effect reverse-engineering (see the baseline-first gate in `effect-extraction.md`)

## CLONE_REPORT.md (when reporting externally or evaluating the skill)

```markdown
# <name> · Original vs Clone Evaluation Report

## Conclusions
- Complexity level:
- Clone mode:
- Overall fidelity:
- Best used for: local learning / further remixing / deployable demo / technical teardown only

## Comparison
| Dimension | Original | Clone | Verdict |
|---|---|---|---|
| Information architecture |  |  |  |
| Visual language |  |  |  |
| Motion & interaction |  |  |  |
| Responsive |  |  |  |
| Content replacement |  |  |  |
| Functional boundaries |  |  |  |

## Scores
Scored on the 8 dimensions from the web-clone skill's `references/assessment.md`.

## Known gaps
-

## Suggested next upgrades
-
```

## CLONE_AUDIT.md (before going live)

Generated by `scripts/audit-clone.mjs`. Focus on:
- Tracking scripts / analytics pixels removed?
- Original brand names, leftover foreign text, TODOs still present?
- External URLs still pointing at the original site or uncontrolled third parties?
- Asset and license risks recorded?

## Wrap-up
- Update the hub `<hub>/README.md` index row (status emoji: 🟡 recon / 🟢 runs / 🔵 reworked / ✅ live / 🔴 stuck / 🗂️ archived)
- Keep the original source as a read-only `index-original.html` baseline — never edit it
- Shut down the local server when done
