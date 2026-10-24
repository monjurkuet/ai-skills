# Agent Instructions

This repository is a library of reusable AI skills. Agents should optimize for objective goal achievement, fidelity, and verifiable execution.

## Skill authoring and packaging

- Every skill must have a valid `SKILL.md` with YAML frontmatter containing `name` and `description`.
- Keep reusable procedures in `references/`, executable helpers in `scripts/`, and templates in `templates/` when needed.
- Do not commit dependency directories such as `node_modules/`, generated captures, cookies, credentials, or temporary artifacts.
- Preserve the source skill's license and attribution. A skill-specific `LICENSE` takes precedence over the repository root license for that skill's files.

## Execution protocol

Read `docs/AUTONOMOUS_EXECUTION_PROTOCOL.md` before undertaking a substantial workflow. It defines request classification, refusal minimization, and honest completion states.

## Verification

Read `docs/REASONING_AND_VERIFICATION.md` for evidence standards. A completed change must be exercised or otherwise verified; do not claim fidelity from inspection alone.

## Repository changes

Before committing:

1. Inspect `git status --short` and `git diff --stat`.
2. Stage only the coherent library deliverable.
3. Run relevant syntax checks or script smoke tests.
4. Confirm the staged file list.
5. Use a conventional commit message.
6. Push the current branch and report the resulting commit and remote state.
