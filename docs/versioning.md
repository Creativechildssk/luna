# Versioning

LUNA uses semantic versioning and treats API stability as a first-class concern.

## Version format
`MAJOR.MINOR.FIX`

Examples:
- `2.0.0`
- `2.1.0`
- `2.1.3`

## What each part means

### Major
Increment major when the change breaks compatibility.

Examples:
- endpoint removal
- renamed fields in public responses
- incompatible request payload changes
- changed response semantics that break existing clients

### Minor
Increment minor when the change adds capabilities without breaking existing clients.

Examples:
- new endpoints
- additive response fields
- new dashboard features that keep existing contracts stable
- new optional request parameters

### Fix
Increment fix when the change is a backward-compatible correction.

Examples:
- bug fixes
- UI corrections
- documentation fixes
- performance improvements without contract changes

## FastAPI-aligned interpretation
For FastAPI services, versioning should be driven by API compatibility rather than internal implementation details.

Use these rules:
- If an existing API client must change to keep working, bump major.
- If an API client can keep working and optionally use more features, bump minor.
- If the client contract is unchanged and behavior is corrected, bump fix.

## Version bump script
Use the repository script instead of editing version strings by hand.

```bash
python tools/version_bump.py --part major
python tools/version_bump.py --part minor
python tools/version_bump.py --part fix
```

Set an exact version:

```bash
python tools/version_bump.py --set 2.1.3
```

Preview only:

```bash
python tools/version_bump.py --part minor --dry-run
```

## Files updated by the script
- `backend/app/core/config.py`
- `web/package.json`
- `web/package-lock.json`
- `web/src/App.jsx`
- `README.md`
- `backend/README.md`
