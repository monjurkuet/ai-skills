# License-Safe Asset Sourcing for Game Clones

Goal: replacement art/audio for a clean-room clone. Never ship the original game's
copyrighted assets in a redistributable clone; the capture is study material only.

## Sources that worked (no login, direct files, clear license)

| Source | License | Access pattern |
|---|---|---|
| kenney.nl asset packs | CC0 | Asset page HTML contains the direct zip URL in a `media/pages/assets/<pack>/<hash>/kenney_<pack>.zip` pattern; grep the page for `\.zip`. Card packs provide suit/rank art usable as low-pay slot symbols |
| freesvg.org (OpenClipart mirror) | Public Domain / CC0 | `curl -sL -e <page-url> https://freesvg.org/download/<id>` — the REFERER header is required, without it you get a 0-byte 200. Find ids by scraping `search/?q=<term>` result slugs, then the slug page for `/download/(\d+)` |
| opengameart.org | CC0 (verify per item) | Direct `/sites/default/files/<file>` links on the content page |
| Pixabay music/sfx | Content License (royalty-free, no attribution) | JS-walled; a headless fetch gets nothing. Drive a real browser, or pick another source for audio |

## Rendering SVG → PNG without native deps

If no rsvg-convert/inkscape and cairosvg lacks the cairo DLL on Windows, render in the
CDP Chrome instead: load the SVG as a base64 data-URL into an `Image`, draw fit-contained
onto a 256px canvas, return `toDataURL('image/png')` via `Runtime.evaluate`, and save the
base64 from the driver script. Zero new dependencies.

## Slot-symbol substitution map (western/cowboy theme)

High-pay character art and thematics come from public-domain clipart; low-pay card
ranks (A/K/Q/J) come from a CC0 playing-cards pack. Typical mapping: sheriff badge,
revolver, gold star (wild), wanted poster (scatter/bonus), dynamite, horseshoe, cowboy
hat, ace. Record every asset's source URL and license in the clone's NOTES.md credits
section.

## Audio

Prefer procedural WebAudio synthesis (oscillators + filtered noise bursts for spins,
  stops, wins) when a source is JS-walled: it is unambiguously license-safe and needs
  zero downloads. For real music, source from Pixabay via an interactive browser
  session, or use CC0 music packs from OpenGameArt.
