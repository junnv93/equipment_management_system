# Contract: verify-implementation-orphan-skills-registration

## Scope

Close tech-debt item `verify-implementation-orphan-skills-registration`.

## MUST

- `.claude/skills/verify-implementation/SKILL.md` execution target table includes:
  - `verify-bulk-action-bar`
  - `verify-click-feedback`
  - `verify-routing-origin`
- The three listed skill files exist under `.claude/skills/<name>/SKILL.md`.
- Existing warning/document-only rows remain present after renumbering.
- Registry/tracker bookkeeping is updated after PASS.

## SHOULD

- Keep the change scoped to verify-implementation registration and harness bookkeeping.
