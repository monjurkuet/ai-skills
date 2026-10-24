# Effect-Extraction Evidence Discipline + Baseline Gate (WebGL/Canvas reverse-engineering branch)

`reverse-engineering.md` covers "how to read the rendering architecture"; this document covers **how not to fool yourself while reverse-engineering effects**, plus the fallback path when no real source exists. Three disciplines: **evidence grading → no-compensation → baseline-first gate**.

> The discipline pattern is inspired by [lixiaolin94/skills · web-shader-extractor](https://github.com/lixiaolin94/skills) (that repo has no LICENSE and is all-rights-reserved by default — only the method concept is borrowed; everything here is rewritten in this skill's own words; no code or original text copied).
> It shares the soul of web-clone's iron rule "real source first", upgrading "cite line numbers" into a systematic evidence regime.

## 1. Evidence grading (tag every conclusion)

When writing the TEARDOWN, tag every key fact about the rendering pipeline with a level. **Untagged counts as the lowest level:**

| Tag | Meaning | Examples |
|---|---|---|
| `SOURCE` | Direct, target-bound hard evidence | Public real source lines, source-map-restored modules, runtime object dumps, captured shader/WGSL text, frame captures, hashed network response bodies |
| `PARTIAL` | A handle for the next probe; not yet conclusive | Class/function/field names, minified bundle slices, framework objects, shader in hand but missing uniforms/passes/input state |
| `GUESS` | Reconstructed values with no direct evidence | Visual fitting, name-based inference, default values, hand-tuned magic numbers, any "looks right" behavior reconstruction |

- **Untagged = GUESS.** Never let unevidenced facts slip into "known".
- This institutionalizes the marbles lesson ("the AI hallucinated analytic intersection as ray-marching"): **any GUESS-level implementation must be upgraded to SOURCE before copying.**

## 2. No-compensation (never hide ignorance behind tuning)

> **Strictly forbidden:** tweaking brightness / speed / position / noise values to make the image "look right" in order to hide real errors in timing, colors, FBOs, assets, coordinate systems, or the state model.

- A fitted constant that improves the output → **it is still GUESS**; document what evidence would upgrade it.
- Wiring-level facts (pass order, coordinate transforms, time units, input coupling) **do not become true just because the picture looks right** — trace each to independent evidence.
- This mirrors web-clone's old rule: record what cannot be verified honestly; **never fake "drag works"**.

## 3. Baseline-first gate (reproduce before refactoring)

The **most common mistake** in effect reverse-engineering is extracting, rewriting, and beautifying simultaneously — ending up with something that neither matches the original nor can be debugged. Split into gated stages instead:

```
Locate the render surface → capture minimal truth → RAW REPLAY (minimal as-is reproduction) → ✅ BASELINE frame-by-frame comparison passes
                                                              ↓ only after passing
                                                        PROJECTIZE (refactor into an editable project) → PACKAGE
```

- **RAW REPLAY**: using the captured real draw calls / shaders / uniforms / vertex data, build the **smallest, most literal** runnable reproduction — no optimization, no framework swap, no parameter changes.
- **BASELINE gate**: the RAW REPLAY must be visually identical to the original frame-by-frame (or on sampled frames) to pass. **Without passing this gate, no refactoring is allowed.**
- After the gate: PROJECTIZE into a maintainable implementation (raw WebGL / Three.js TSL / Babylon etc.), keeping evidence tags on everything.
- Close out with one of three states, honestly labeled: `DONE_BASELINE_VERIFIED` (reproduced and verified) / `DONE_PROJECTIZED` (refactored into a project) / `DONE_BASELINE_WITH_GAPS` (reproduced but with documented gaps).

## 4. No real source found — runtime capture fallback

Web-clone's first move is always "find real source on GitHub / via source maps". But **effect sites are often source-less and minified to the bone**.
Then do not fall back to "write what looks similar" (that is GUESS) — instead **capture runtime truth at the rendering boundary**:

- Intercept the WebGL/WebGPU context: actual draw calls, bound programs, compiled shader sources, uniform values, FBO/texture sizes, blend/depth state.
- Tool directions: spector.js-style frame capture, patching `WebGLRenderingContext` prototypes to log calls, `getShaderSource` for compiled shaders, preload scripts injecting hooks before page scripts.
- Captured data counts as `SOURCE` — it IS the new "real source", feeding the baseline-first process.

## 5. When to delegate to web-shader-extractor

If you have `web-shader-extractor` installed, **delegate the effect portion to it when**:

- The site is WebGL/WebGPU/heavy-Canvas effects, and neither GitHub nor source maps yield real source;
- You need runtime frame capture, frame-by-frame comparison, shader/uniform-level extraction;
- You want the full gated flow of "baseline reproduction first, then independent projectization".

After receiving the delegated output (minimal reproducible baseline + evidence pack), **merge it into `<hub>/<name>-clone/`**,
fill in NOTES/TEARDOWN per web-clone's deliverable specs, and continue with Step 5 verification + Step 6 content replacement.

Not having it installed is fine: the four disciplines above are executable by hand — web-shader-extractor just packages section 4's capture machinery into a ready tool.

## Hookup with existing deliverables

- TEARDOWN.md's "A. Real technical teardown": add an evidence tag (`SOURCE`/`PARTIAL`/`GUESS`) to every entry.
- "B. Second-hand analysis check table" already exists to catch GUESS posing as SOURCE — same discipline.
- Keep baseline reproductions in `<name>-clone/RECON/baseline/`, alongside original screenshots as verified hard evidence.
