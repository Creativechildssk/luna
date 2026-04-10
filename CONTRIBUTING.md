# Contributing to LUNA

Thanks for contributing. This guide explains how we work in this repo so changes stay clean, reviewable, and safe to release.

## Ground rules
- Keep changes focused.
- Fix the root issue when practical.
- Treat API compatibility as important.
- Update docs whenever behavior, setup, or API shape changes.

## Typical workflow
1. Create a feature branch from `main`.
2. Make the smallest coherent change that solves the problem.
3. Verify locally.
4. Update documentation if the change affects users or developers.
5. Open a pull request with a clear summary and testing notes.

## Backend expectations
- Preserve FastAPI route behavior unless the break is intentional and documented.
- Keep business logic in `backend/app/services`, not route handlers.
- Validate request payloads and query params clearly.

## Frontend expectations
- Preserve the existing LUNA visual language.
- Prefer focused component edits over copy-paste UI logic.
- Keep both desktop and mobile usable.

## Documentation expectations
Update docs when you change:
- setup steps
- API surface
- versioning or release process
- user-facing behavior

## Versioning
Use semantic versioning:
- `major`: breaking contract changes
- `minor`: backward-compatible feature additions
- `fix`: backward-compatible bug fixes

Use the shared script:
```bash
python tools/version_bump.py --part fix
```

## Verification checklist
- Backend starts successfully.
- Frontend builds successfully.
- New or changed routes are reflected in docs when needed.
- No unrelated files are committed accidentally.

## Pull request guidance
In each PR, include:
- what changed
- why it changed
- how it was verified
- any migration or compatibility notes
