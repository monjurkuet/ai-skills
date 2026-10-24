# Flagship Case · Glass Marbles (real architecture vs AI hallucination)

Source site https://chiuhans111.github.io/marbles/ · author Hans Chiu · single file, 1067 lines · license **NONE**.
Full line-by-line teardown: `<hub>/marbles-clone/TEARDOWN.md`; this is the distilled version for the skill.

## One-sentence real architecture

A full-screen WebGL fragment shader uses **analytic intersection (quadratic `b*b-c`)** for ray-sphere hits with up to 4 refraction/reflection iterations, encoding the optical result into a **displacement-map PNG** (RG = pixel displacement, B = fresnel value); an SVG `<filter>`'s `feDisplacementMap(scale=200)` then uses that map to warp the **real, live, interactive page DOM** (background color blocks + title text).

> The glass marble you drag is literally a lens; behind the lens is this HTML page. WebGL never touches DOM pixels — the refraction is done by the SVG filter. Physics and audio are hand-written, zero libraries.

## Three pillars (real implementation highlights)

1. **WebGL optics**: analytic sphere intersection (NOT ray-marching); refractive index N=1.3, 4 iterations; fresnel `0.05+0.95*pow(1-cosθ,2.0)` (exponent 2, not Schlick's 5); 2 internal bubbles + paraboloid colored core + Beer-Lambert volumetric absorption; **one shader reused via `u_mode`** (0 refraction / 1 reflection / 2 foreground highlight / 3 shadow); displacement encoding `DISPLACEMENT_SCALE=200` strictly aligned with the SVG side.
2. **SVG filter composition**: 4 canvases (1 main + 3 offscreen), offscreen images fed to `<feImage>` via `toDataURL` each frame. Real chain: shadow `feGaussianBlur(8)` → `feBlend multiply` onto DOM → refraction `feDisplacementMap` → reflection `feDisplacementMap` → `feGaussianBlur(2)` → reflection-map B channel (fresnel) through `feColorMatrix` as alpha mask → two-step `feComposite`. The refracted `SourceGraphic` is `#container` with `filter:url(#marble-filter)`.
3. **Physics**: hand-written, `mass=r³`, gravity 0.8, 3D elastic collisions (restitution 0.8, resolved only on proximity), floor restitution 0.55 + micro-bounce zeroing, quaternion rolling, drag lift targetZ=200; `settleFrames` fully stops rendering at rest.
4. **Audio**: Web Audio procedural synthesis (zero files), base frequency `800+(60-r)*20` + 5 harmonics, volume scaling with collision speed.

## ⚠️ Where the AI analysis document went wrong (anti-patterns to remember)

That `marbles clone analysis.md` had a **mostly correct conceptual skeleton** (8 steps, right pillar directions) but its **bundled "clone code blocks" were almost entirely hallucinated**:

| Hallucination | Truth | Pitfall pattern (general warning) |
|---|---|---|
| ray-marching + SDF + `MAX_STEPS=100` + 6-iteration finite-difference normals | analytic intersection, normal `normalize(rp-center)` | **Never assume refraction demos use ray-marching by intuition** — spheres have closed-form solutions; many demos use analytic intersection, faster and exact |
| `sampler2D uBackground` sampling the DOM as a texture | the shader never reads the background; refraction goes through the displacement map to SVG | **GPU↔DOM hierarchy inverted** — the core architectural idea was lost |
| `feBlend screen` + single displacement + `feComposite over` for shadows | dual displacement + fresnel mask + multiply shadow | **second-hand filter chains are not trustworthy; verify node-by-node against real source** |
| `MARBLE_COUNT=5`, arrays sized 10 | hardcoded 2 | even constants were guessed |
| screen-center NDC coordinates | top-left pixel + Y flip | coordinate conventions entirely made up |

**Lesson**: an AI-written "clone construction plan" = use its conceptual skeleton as a hint, **copy none of its code blocks directly** — verify against real source. This is where this skill's iron rule comes from.
