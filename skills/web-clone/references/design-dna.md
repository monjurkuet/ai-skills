# Design DNA · Structured Design Identity (for visual clone / content remix modes)

Turns "make it feel like that site" from a vague feeling into a **versionable, reusable, comparable JSON spec**.
Used in the two "visual clone" and "content remix" modes — after recon, before building — as an extra `design-dna.json`
output that anchors Step 6 "replace with your own content": **keep the DNA, swap the content**.

> Method and schema adapted from [zanwei/design-dna](https://github.com/zanwei/design-dna) (MIT), trimmed for web-clone's scope.

## ⚠️ Scope boundary (read first)

Design DNA's generation philosophy is **"approximate style"** — it produces a "stylistically consistent new site", not a byte-for-byte copy.
That is the **opposite direction** from web-clone's iron rule of "real source first / byte-faithful." So:

| Mode | Use DNA? |
|---|---|
| Faithful clone (real source available / single-file native site / WebGL byte-level reproduction) | **No.** Real source is the truth; don't let DNA dilute it into an approximation |
| Visual clone (reproduce the look, simplify the implementation) | **Yes.** DNA is the primary output of this path |
| Content remix (keep IA + rhythm + visual grammar, swap in your content) | **Yes.** DNA defines "what to keep"; content is freely swappable |

In one sentence: **DNA is for "build my own site", not for "copy theirs exactly".**

## Three-layer structure

The DNA JSON has three layers, mapping to "measurable / perceivable / special rendering":

1. **`design_system`** — measurable tokens: color / typography / spacing / layout / shape / elevation / iconography / motion / components
2. **`design_style`** — subjective perception: aesthetic (mood/genre/era) / visual_language / composition / imagery / interaction_feel / brand_voice_in_ui
3. **`visual_effects`** — rendering beyond plain CSS: background / particles / 3d / shader / scroll / text / cursor / image / glass-neu / canvas / svg

`design_system` maps directly to CSS variables; `design_style` guides subjective choices; `visual_effects` decides whether to reach for Canvas/WebGL/GSAP, and links to this skill's "WebGL reverse-engineering branch".

## Three-step workflow

1. **Structure** — review the schema (below + the scaffold from `dna-scaffold.mjs`), decide which dimensions apply; cut the irrelevant ones.
2. **Analyze** — extract from recon artifacts:
   - Colors: `cssVariables` from `<label>-recon.json` (`--` color values) + `sections[].style.backgroundColor` / `color`; pick primary by area, accent by CTA.
   - Fonts: `fonts` array + `sections[].style.fontFamily`; split into heading / body / mono.
   - Spacing/layout: screenshots + `sections[].rect` to measure rhythm and max width.
   - Effects: `frameworks.three/gsap/lenis` + `canvases` + `counts.canvas` → fill `visual_effects.overview.primary_technology` and enabled flags.
   - Style/perception: look at the three viewport screenshots (1440/768/390) and judge mood, genre, composition, whitespace manually.
   - **Fill every field with real values — no empty strings**; where evidence is missing, mark `TODO` and state what evidence is needed.
3. **Generate** — parse the DNA → emit CSS custom properties → make subjective decisions per `design_style` → pick the implementation tier per `effect_intensity` (lightweight = CSS/SVG/vanilla; medium = Canvas2D/GSAP/Lottie; heavy = Three.js/GLSL/Pixi) → output pages → pour in your own content. **Prefer real harvested assets from the original site (`asset-harvest.mjs`) over AI re-draws.**

## Scaffold

```bash
node <skill_dir>/scripts/dna-scaffold.mjs \
  --recon <hub>/<name>-clone/RECON/original-recon.json \
  --out   <hub>/<name>-clone/RECON/design-dna.json
```

The script emits the full DNA skeleton and **best-effort pre-fills** the recon-detected fonts, CSS color variables, and framework/effect signals;
other fields are left `""` (to be completed manually in the Analyze step). It also runs without `--recon`, producing an empty skeleton.

## Full DNA JSON schema (adapted from design-dna, MIT)

```json
{
  "meta": { "name": "", "description": "", "source_references": "", "created_at": "" },

  "design_system": {
    "color": {
      "palette_type": "monochromatic | complementary | analogous | triadic | split-complementary",
      "primary":   { "hex": "", "role": "" },
      "secondary": { "hex": "", "role": "" },
      "accent":    { "hex": "", "role": "" },
      "neutral":   { "scale": "", "usage": "" },
      "semantic":  { "success": "", "warning": "", "error": "", "info": "" },
      "surface":   { "background": "", "card": "", "elevated": "" },
      "contrast_strategy": "high contrast | subtle layers | dark-on-light dominant"
    },
    "typography": {
      "type_scale": {
        "display":    { "size": "", "weight": "", "line_height": "", "tracking": "" },
        "heading_1":  { "size": "", "weight": "", "line_height": "", "tracking": "" },
        "heading_2":  { "size": "", "weight": "", "line_height": "", "tracking": "" },
        "heading_3":  { "size": "", "weight": "", "line_height": "", "tracking": "" },
        "body":       { "size": "", "weight": "", "line_height": "", "tracking": "" },
        "body_small": { "size": "", "weight": "", "line_height": "", "tracking": "" },
        "caption":    { "size": "", "weight": "", "line_height": "", "tracking": "" },
        "overline":   { "size": "", "weight": "", "line_height": "", "tracking": "" }
      },
      "font_families": { "heading": "", "body": "", "mono": "" },
      "font_style_notes": ""
    },
    "spacing": { "base_unit": "", "scale": "", "content_density": "compact | comfortable | spacious", "section_rhythm": "" },
    "layout":  { "grid_system": "", "max_content_width": "", "columns": "", "gutter": "", "breakpoints": "", "alignment_tendency": "strict grid | centered | asymmetric | mixed" },
    "shape":   { "border_radius": { "small": "", "medium": "", "large": "", "pill": "" }, "border_usage": "none | subtle 1px | bold borders | only on inputs", "divider_style": "" },
    "elevation": { "shadow_style": "none | soft diffused | hard drop | layered", "levels": { "low": "", "medium": "", "high": "" }, "depth_cues": "shadows | overlapping layers | blur/glass | color intensity" },
    "iconography": { "style": "", "stroke_weight": "", "size_scale": "", "preferred_set": "" },
    "motion": { "easing": "", "duration_scale": { "micro": "", "normal": "", "macro": "" }, "entrance_pattern": "", "exit_pattern": "", "philosophy": "minimal functional | playful bouncy | cinematic | none" },
    "components": { "button_style": "", "input_style": "", "card_style": "", "navigation_pattern": "", "modal_style": "", "list_style": "", "component_notes": "" }
  },

  "design_style": {
    "aesthetic": { "mood": [], "visual_metaphor": "", "era_influence": "", "genre": "", "personality_traits": [], "adjectives": [] },
    "visual_language": { "complexity": "minimal | moderate | rich | maximal", "ornamentation": "none | subtle accents | decorative | heavily ornamented", "whitespace_usage": "", "visual_weight_distribution": "", "focal_strategy": "single hero element | distributed interest | progressive reveal", "contrast_level": "", "texture_usage": "" },
    "composition": { "hierarchy_method": "scale contrast | color weight | spatial isolation | typographic hierarchy", "balance_type": "symmetric | asymmetric | radial | mosaic", "flow_direction": "", "grouping_strategy": "", "negative_space_role": "" },
    "imagery": { "photo_treatment": "", "illustration_style": "", "graphic_elements": "", "pattern_usage": "", "image_shape": "" },
    "interaction_feel": { "feedback_style": "", "hover_behavior": "", "transition_personality": "snappy | smooth glide | bouncy elastic | fade-subtle", "loading_style": "", "microinteraction_density": "" },
    "brand_voice_in_ui": { "tone": "", "formality": "", "cta_style": "direct imperative | friendly invitation | urgent scarcity | subtle suggestion", "empty_state_approach": "", "error_tone": "" }
  },

  "visual_effects": {
    "overview": { "effect_intensity": "none | subtle-accent | moderate | heavy-immersive", "performance_tier": "lightweight | medium | heavy", "fallback_strategy": "", "primary_technology": "CSS only | Canvas 2D | WebGL/Three.js | GSAP | Lottie | SVG SMIL | Pixi.js" },
    "background_effects": { "type": "gradient-animation | noise-field | mesh-gradient | video-bg | generative-art | none", "description": "", "technology": "", "params": { "color_palette": "", "speed": "", "density": "", "opacity": "", "blend_mode": "" } },
    "particle_systems": { "enabled": false, "type": "floating-dots | confetti | snow | fireflies | connected-nodes | custom", "description": "", "technology": "", "params": { "count": "", "shape": "", "size_range": "", "movement_pattern": "", "color_behavior": "", "interaction": "mouse-repel | mouse-attract | click-burst | none", "spawn_area": "" } },
    "3d_elements": { "enabled": false, "type": "hero-model | product-viewer | scene-bg | text-extrusion | abstract-geometry", "description": "", "technology": "", "params": { "renderer": "", "lighting": "", "camera": "", "materials": "", "geometry": "", "post_processing": [], "interaction_model": "" } },
    "shader_effects": { "enabled": false, "type": "noise-distortion | wave | morph | color-shift | custom-GLSL", "description": "", "technology": "", "params": { "uniforms": "", "vertex_manipulation": "", "fragment_output": "", "noise_type": "perlin | simplex | worley | fbm", "distortion": "" } },
    "scroll_effects": { "parallax": { "enabled": false, "layers": "", "depth_range": "", "speed_curve": "" }, "scroll_triggered_animations": { "enabled": false, "trigger_points": "", "animation_type": "fade-up | scale-in | clip-reveal | counter | draw-SVG", "scrub_behavior": "" }, "scroll_morphing": { "enabled": false, "description": "" } },
    "text_effects": { "type": "split-letter-animate | typewriter | glitch | gradient-fill | 3d-extrude | none", "description": "", "technology": "", "params": { "split_strategy": "by-char | by-word | by-line", "animation_per_unit": "", "stagger": "", "effect_style": "" } },
    "cursor_effects": { "enabled": false, "type": "custom-cursor | magnetic-buttons | spotlight | trail | none", "description": "", "params": { "shape": "", "size": "", "blend_mode": "", "trail": "", "interaction_zone": "" } },
    "image_effects": { "type": "hover-distortion | reveal-clip | parallax-tilt | rgb-shift | none", "description": "", "technology": "", "params": { "filter_pipeline": "", "hover_transform": "", "reveal_animation": "", "distortion_type": "barrel | wave | liquid | glitch" } },
    "glassmorphism_neumorphism": { "enabled": false, "style": "glass | neumorphic-light | neumorphic-dark | frosted-layers | none", "params": { "blur_radius": "", "transparency": "", "border_treatment": "", "shadow_type": "", "light_source_angle": "" } },
    "canvas_drawings": { "enabled": false, "type": "generative-lines | interactive-blobs | data-visualization | pattern-fill | none", "description": "", "technology": "", "params": { "draw_method": "", "animation_loop": "", "color_scheme": "", "responsiveness": "", "interaction": "" } },
    "svg_animations": { "enabled": false, "type": "path-draw | morph-shapes | logo-reveal | decorative-loop | none", "description": "", "params": { "animation_method": "", "path_morphing": "", "stroke_animation": "", "filter_effects": "" } },
    "composite_notes": ""
  }
}
```

## Division of labor with the WebGL reverse-engineering branch

- For sites where `visual_effects` flags `heavy-immersive` / `WebGL/Three.js` / `shader_effects.enabled=true`, **do not use DNA to "approximate" the effect** — that is the job of `effect-extraction.md` + `reverse-engineering.md`: reverse-engineer the real implementation.
- For such sites DNA covers only the design layer **around** the effect (colors/typography/layout/ordinary motion); the effect itself goes through reverse-engineering or is delegated to web-shader-extractor.
