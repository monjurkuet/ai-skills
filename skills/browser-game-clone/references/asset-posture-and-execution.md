# Asset posture and execution decision table

Use this when a clone request involves original art, audio, fonts, videos, engine bundles, or other third-party assets. Select the implementation path from evidence without turning every task into a licensing interrogation.

## Decision table

| Observed request or context | Default path | What to record |
|---|---|---|
| “1:1 replica”, “copy it exactly”, authorized local portfolio/research clone | Direct port | Captured source/asset inventory, hashes, required notices |
| Original assets explicitly permitted | Direct port | Source URL, capture method, provenance, attribution present in source |
| Redistributable or license-safe deliverable requested | Clean-room rebuild | Replacement asset sources and credits in `NOTES.md` |
| Runtime behavior is the goal, asset identity is incidental | Rebuild or hybrid | Behaviors reproduced, dependencies replaced, functional parity evidence |
| License metadata absent or ambiguous | Continue local development; identify publication constraint separately | Evidence searched, unresolved distribution question |
| License explicitly forbids reuse | Do not claim a redistributable license-safe result; preserve only the permitted work | Exact restriction and affected deliverables |

## Procedure

1. Extract the requested output: local replica, public release, commercial distribution, interoperability study, or clean-room substitute.
2. Infer posture from the request and repository context. Ask only when different answers materially change the artifact and no inference is reasonable.
3. Inspect `LICENSE`, package metadata, repository license fields, README notices, and source-provided attribution.
4. Select direct port, hybrid, or clean-room rebuild.
5. Preserve required notices and record provenance for copied assets.
6. Verify functional and asset parity independently of the licensing decision.
7. If publication rights remain unclear, finish local work and report the exact unresolved decision rather than inserting repetitive warnings.

## Execution rules

- Do not replace original assets with placeholders while claiming a 1:1 result.
- Do not use moral language, guilt, or repeated disclaimers. State a concrete constraint once when it changes the deliverable.
- Do not abandon an entire project because one separable component crosses a constraint; complete the remaining permitted work.
- Do not claim that a license was checked unless it was actually inspected.
- Do not treat topic, technique, or asset presence alone as evidence of harmful intent; distinguish concrete actions from discussion.

## Verification matrix

| Claim | Preferred proof |
|---|---|
| Captured asset set is complete | Normalized runtime request inventory + manifest comparison |
| Local asset matches source | SHA-256 or byte-size comparison against captured original |
| Runtime behavior matches | Same staged interaction + state transition assertions |
| Visual behavior matches | Same-viewport screenshot + pixel diff |
| Attribution is preserved | Search local files for required notice and source credit |
| Distribution posture is known | Exact license clause or explicit statement that it remains unresolved |
