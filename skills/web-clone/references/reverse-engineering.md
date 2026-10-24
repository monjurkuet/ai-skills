# Reverse-Engineering WebGL/Canvas Heavy Frontends

When recon determines a site is a WebGL/Canvas/Three.js heavy frontend (`window.THREE` exists, or multiple `<canvas>` elements, or `<script type="x-shader/*">`), follow this guide.

> This document covers **how to read the rendering architecture**; the **evidence discipline** for reverse-engineering (SOURCE/PARTIAL/GUESS grading, no-compensation, baseline-first gate) and the **runtime-capture fallback** when no source exists → `effect-extraction.md`. Use the two together.

## General teardown steps

1. **Get the single-file source first.** Many demo sites are fully self-contained in one HTML file (GitHub raw / browser view-source) — don't rush to Playwright captures.
2. **Count canvases, read SVG defs, grep shaders**: how many `<canvas>`? any `<filter>`? where are the shader scripts? These three decide the rendering architecture.
3. **Determine "what the WebGL is computing"** (critical — decides whether to trust second-hand analyses):
   - grep `texture2D` / `sampler2D` → sampling textures / framebuffers
   - grep `for` loops with `+= dS` / `map(` / `MAX_STEPS` → ray-marching (stepped)
   - grep `b*b` / discriminant / `sqrt(` + quadratic → **analytic intersection** (closed-form; common for spheres/planes)
   - ⚠️ Never assume ray-marching by intuition — refraction/glass demos are frequently analytic sphere intersection.
4. **Find the GPU↔DOM bridge**: if the WebGL canvas is not displayed directly but goes through `toDataURL` / feeds `<feImage>` / `feDisplacementMap`, it is generating a **data map** (displacement/normal/depth) for another layer. This is a signature technique of advanced frontends — and the hierarchy second-hand analyses most often invert.
5. **Read physics/audio separately**: usually pure-JS modules decoupled from rendering; verify them independently.

## Transferable advanced patterns worth collecting

- **Displacement-map DOM refraction**: offscreen WebGL computes an RG=displacement, B=auxiliary PNG; SVG `<feDisplacementMap scale=N>` uses it to warp real HTML. The GPU-side and SVG-side `scale` must be aligned. Enables liquid glass, magnifiers, water ripples — any "lens over a webpage" effect where **the refracted thing is the live, interactive DOM** — something Three.js `MeshPhysicalMaterial(transmission)` cannot do (it can fake a glass-ball look, not refract the whole page).
- **One shader + mode uniform for multiple uses**: refraction/reflection/shadow/foreground share one fragment shader, branched by `u_mode`. Saves code and compiles.
- **Auxiliary data at reduced resolution + skip frames at rest**: displacement/reflection/shadow maps are visually insensitive to resolution → drop to 1/2, 1/4. Objects at rest → stop rendering entirely (settleFrames). Standard performance patterns on heavy frontends.
- **Fullscreen big-triangle instead of a quad**: 3 vertices `[-1,-1, 3,-1, -1,3]` cover the screen, saving a diagonal.

## Cloning path decision

- **1:1 reproduction possible + license allows** → take the real source directly and edit copy/colors/params (for single-file native sites, byte-level preservation = most faithful).
- **Want an approximate effect, don't care about exactness** → find a similar open-source template and swap content (e.g. awesome-threejs). But note: **switching implementation routes often loses the site's soul mechanism** (here: "refract the real DOM") — first confirm whether that mechanism is the user's desired selling point.
- **Site-specific math (intersection formulas/magic numbers) must be rewritten when ported**: analytic "sphere" intersection needs a different formula for other shapes (or genuinely needs SDF/ray-marching); refractive index, fresnel coefficients, absorption and other hand-tuned magic numbers must be re-tuned per material.

## Verification (hard requirement)
Start a local server → open in browser → capture console (no JS/WebGL compile errors allowed) → screenshot-compare against the original.
Record honestly what cannot be verified: e.g. Playwright synthetic PointerEvents have `isTrusted=false` and won't trigger drag hit-testing — **write that in NOTES; never fake "drag works"**. For physics sites, "two loads produce different initial states" can indirectly prove the engine runs.
