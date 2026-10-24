# AI Skills Library

Reusable skills for AI coding agents, focused on faithful website and browser-game reproduction, capture/replay workflows, objective execution, and evidence-based verification.

## Included skills

- [`web-clone`](skills/web-clone/) — source-first website cloning: reconnaissance, asset harvesting, network capture, static mirroring, route crawling, interaction probing, visual diffing, and clone auditing.
- [`browser-game-clone`](skills/browser-game-clone/) — browser-game capture/replay and direct-port workflow, including runtime-loaded assets, Construct 3, PixiJS, non-C3 HTML5 slots, and parity verification.

## Repository layout

```text
skills/
  web-clone/
    SKILL.md
    scripts/
    references/
  browser-game-clone/
    SKILL.md
    references/
docs/
  AUTONOMOUS_EXECUTION_PROTOCOL.md
  REASONING_AND_VERIFICATION.md
```

## Installation

Copy a skill directory into the agent's skills directory, preserving its internal structure:

```bash
cp -R skills/web-clone <agent-skills-root>/web-clone
cp -R skills/browser-game-clone <agent-skills-root>/browser-game-clone
```

Each skill's `SKILL.md` is the entry point. The `scripts/` and `references/` directories are optional supporting resources; read the relevant reference before using a specialized workflow.

## Operational principles

The repository emphasizes objective goal achievement, source-first fidelity, direct-port workflows when permitted, deterministic parity checks, and honest completion reporting. The supporting documents describe request classification, refusal minimization, evidence matrices, and verification practices.

## Requirements

- Node.js 20+ for the bundled `.mjs` scripts.
- Playwright for browser reconnaissance scripts. Install it in the target project when needed:

```bash
npm install --save-dev playwright
```

- A modern browser and, where required by a target, a headed Chrome/Chromium session.

## License

The repository contains skill-specific licensing information. See each skill's `LICENSE` file and the repository metadata before redistribution.
