# Release Process

This document defines the recommended release workflow for LUNA.

## Release checklist
1. Verify backend changes locally.
2. Verify frontend changes locally.
3. Ensure documentation is updated.
4. Bump the version.
5. Commit the release.
6. Push the branch and tag the release.

## Recommended verification

### Backend
Run the API locally and verify key endpoints:
- `/health/`
- `/moon/window`
- `/planet/window`
- `/satellite/window`
- `/mission`

### Frontend
Run:
```bash
cd web
npm run build
```

## Bump the version
Use the shared script:

```bash
python tools/version_bump.py --part minor
```

Common release examples:
- `major`: breaking API release
- `minor`: feature release
- `fix`: maintenance release

## Commit and tag
Example:

```bash
git add .
git commit -m "release: v2.1.0"
git push

git tag v2.1.0
git push origin v2.1.0
```

## Release notes guidance
A release note should include:
- summary of user-visible changes
- backend/API changes
- frontend/UI changes
- migration or compatibility notes
- deployment notes if relevant

## GitHub Wiki sync
If wiki content changed, update the pages under `wiki/` and publish the same content to GitHub Wiki.

## AWS deployment note
If builds rely on custom package mirrors, ensure these are configured in the release environment before rebuilding backend images:
- `PIP_INDEX_URL`
- `PIP_EXTRA_INDEX_URL`
- `PIP_TRUSTED_HOST`
