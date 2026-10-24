# Complexity Grading and Clone Scoring

Used for the pre-clone assessment, post-clone acceptance, and explaining to the user "how far this site can be cloned."

## Clone modes

| Mode | Goal | When to use |
|---|---|---|
| Faithful clone | Preserve original source / layout / interactions as much as possible | Legal source found, single-file sites, learning advanced front-end techniques |
| Visual clone | Looks close to the original; internal implementation may be replaced | No source, corporate sites, content sites, componentized rebuild |
| Content remix | Keep the original rhythm and visual grammar, swap in your own business content | Turning a reference site into your own site, brand pages, product intros |
| Technical teardown | Don't rebuild yet — first confirm the real implementation | WebGL/Canvas/complex interactions, conflicting AI analyses |

## Complexity L1-L6

| Level | Type | Typical signals | Typical recoverable fidelity | Default boundary |
|---|---|---|---|---|
| L1 | Static HTML/CSS | Little JS, no framework, few pages | 90-98% | Near pixel-perfect; asset copyright is a separate matter |
| L2 | CMS / corporate content site | Many pages, CMS-generated, forms/news/local pages | 70-90% | Front-end reproducible; CMS admin not cloned |
| L3 | React/Vue/Next content front-end | Hydration, chunks, router, API-driven content | 65-90% | Data/APIs can be replaced with local JSON stand-ins |
| L4 | Animation-heavy brand site | GSAP, Lenis, complex scrolling, video masks | 50-80% | Hero reproducible; micro-interactions often approximated |
| L5 | WebGL/Canvas/Three.js | Shaders, physics, post-processing, GPU assets | 30-95% | High if source available; without source, teardown first |
| L6 | SaaS / e-commerce / logged-in systems | Accounts, payments, orders, permissions, search | Presentation layer only | Server business logic is never cloned by default |

## Pre-clone assessment template

```markdown
## Pre-clone assessment
- Complexity level:
- Recommended mode: faithful clone / visual clone / content remix / technical teardown
- Parts achievable at high fidelity:
- Parts needing approximation or substitution:
- Parts NOT cloned:
- Main risks: license / assets / login state / API / performance / WebGL / responsive
```

## Post-clone scoring

Each dimension 0-5. Only award scores backed by source code, screenshots, or browser run results.

| Dimension | 5 | 3 | 1 |
|---|---|---|---|
| Source evidence | Real source or full static assets found; key conclusions cite file/line | Runtime recon and asset capture available | Mostly eyeballing and inference |
| Structure fidelity | IA, section order, breakpoints all match | Main sections match, details merged/trimmed | Only the general vibe survives |
| Visual fidelity | Fonts, spacing, colors, image ratios closely match | Main visuals close, some ratios off | Clearly a different design |
| Motion/interaction | Scroll, hover, video, Canvas/WebGL behavior close | Only core interactions kept | Essentially static |
| Responsive | Desktop/tablet/mobile verified, no breakage | Verified at 1-2 widths | Clearly broken on mobile |
| Functional completeness | Nav, forms, media, external links, local run all work | Main browsing paths work | Many dead links or errors |
| Content replacement | Fully replaced with your content, clear replacement map | Partially reworked, some original residue | Lots of original copy/branding left |
| Legal/deploy risk | License clear, tracking removed, asset boundaries explicit | Risks logged but not fully resolved | Risks unclear |

Suggested output:

```markdown
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
```

## Original vs clone comparison table

```markdown
| Module | Original behavior | Clone implementation | Difference / tradeoff | Evidence |
|---|---|---|---|---|
| Hero |  |  |  | screenshot / file:line |
| Navigation |  |  |  |  |
| Core motion |  |  |  |  |
| Content sections |  |  |  |  |
| Mobile |  |  |  |  |
```
