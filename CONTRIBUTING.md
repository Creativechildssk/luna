# Contributing to LUNA

Thank you for contributing. This guide defines the expected workflow for code, documentation, and release work in this repository.

## Contribution principles
- Prefer focused changes over broad refactors.
- Fix root causes when practical.
- Keep backend API contracts stable unless a breaking change is intentional.
- Update docs when behavior, setup, or public API changes.

## Development workflow
1. Create a feature branch from `main`.
2. Make the smallest coherent change that solves the problem.
3. Verify locally.
4. Update documentation if the change affects users or developers.
5. Open a pull request with a clear summary and testing notes.

## Backend expectations
- Preserve FastAPI route behavior unless the change is intentionally breaking.
- Keep business logic in `backend/app/services`, not in route handlers.
- Use clear validation on request payloads and query parameters.

## Frontend expectations
- Preserve the established LUNA visual language.
- Prefer focused component changes over duplicating UI logic.
- Ensure desktop and mobile behavior remain usable.

## Documentation expectations
Documentation updates are required when you change:
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
Include:
- what changed
- why it changed
- how it was verified
- any migration or compatibility notes
