# Releases and Versioning

LUNA uses semantic versioning.

## Rules
- major: breaking API changes
- minor: backward-compatible features
- fix: backward-compatible bug fixes

## Version script
```bash
python tools/version_bump.py --part major
python tools/version_bump.py --part minor
python tools/version_bump.py --part fix
```

## Release flow
1. Verify backend and frontend.
2. Run the version bump script.
3. Commit the release.
4. Push a Git tag.

## Current baseline release
### v2.0.0
- Dashboard refresh with better visual hierarchy.
- Improved moon phase presentation and viewing score card.
- Live Identify quick tool and stronger AR workflow support.
- Professionalized documentation, wiki, and release process.
- Semantic versioning automation with `tools/version_bump.py`.

Detailed release notes: [docs/releases/v2.0.0.md](../docs/releases/v2.0.0.md)

Detailed references:
- [docs/versioning.md](../docs/versioning.md)
- [docs/release-process.md](../docs/release-process.md)
