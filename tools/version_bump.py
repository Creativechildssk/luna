#!/usr/bin/env python3
"""Bump LUNA semantic version across backend and web.

Usage:
  python tools/version_bump.py --part major
  python tools/version_bump.py --part minor
  python tools/version_bump.py --part fix
  python tools/version_bump.py --set 2.1.3
  python tools/version_bump.py --part minor --dry-run

Rules:
- major: X+1.0.0
- minor: X.Y+1.0
- fix:   X.Y.Z+1
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FILES = {
    "backend_config": ROOT / "backend" / "app" / "core" / "config.py",
    "web_package": ROOT / "web" / "package.json",
    "web_lock": ROOT / "web" / "package-lock.json",
    "web_app": ROOT / "web" / "src" / "App.jsx",
    "root_readme": ROOT / "README.md",
    "backend_readme": ROOT / "backend" / "README.md",
}

SEMVER_RE = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")


def parse_semver(value: str) -> tuple[int, int, int]:
    m = SEMVER_RE.match(value)
    if not m:
        raise ValueError(f"Invalid semantic version '{value}'. Expected X.Y.Z")
    return int(m.group(1)), int(m.group(2)), int(m.group(3))


def next_version(current: str, part: str) -> str:
    major, minor, patch = parse_semver(current)
    if part == "major":
        return f"{major + 1}.0.0"
    if part == "minor":
        return f"{major}.{minor + 1}.0"
    if part in {"fix", "patch"}:
        return f"{major}.{minor}.{patch + 1}"
    raise ValueError(f"Unsupported part '{part}'")


def read_current_version() -> str:
    cfg = FILES["backend_config"].read_text(encoding="utf-8")
    m = re.search(r'VERSION\s*=\s*"(\d+\.\d+\.\d+)"', cfg)
    if not m:
        raise RuntimeError("Could not find VERSION in backend/app/core/config.py")
    return m.group(1)


def replace_regex(path: Path, pattern: str, replacement: str) -> None:
    content = path.read_text(encoding="utf-8")
    new_content, count = re.subn(pattern, replacement, content, flags=re.MULTILINE)
    if count == 0:
        raise RuntimeError(f"Pattern not found in {path}")
    path.write_text(new_content, encoding="utf-8")


def update_json_version(path: Path, new_version: str) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    data["version"] = new_version
    if isinstance(data.get("packages"), dict) and "" in data["packages"]:
        data["packages"][""]["version"] = new_version
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def apply_updates(old_version: str, new_version: str) -> None:
    replace_regex(
        FILES["backend_config"],
        r'VERSION\s*=\s*"\d+\.\d+\.\d+"',
        f'VERSION = "{new_version}"',
    )

    update_json_version(FILES["web_package"], new_version)
    update_json_version(FILES["web_lock"], new_version)

    replace_regex(
        FILES["web_app"],
        r"LUNA v\d+\.\d+\.\d+",
        f"LUNA v{new_version}",
    )

    replace_regex(
        FILES["root_readme"],
        r"Current version:\s*v\d+\.\d+\.\d+",
        f"Current version: v{new_version}",
    )

    replace_regex(
        FILES["backend_readme"],
        r"\(v\d+\.\d+\.\d+\)",
        f"(v{new_version})",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Bump semantic version for LUNA")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--part", choices=["major", "minor", "fix", "patch"], help="Version part to bump")
    group.add_argument("--set", dest="set_version", help="Set an exact version (X.Y.Z)")
    parser.add_argument("--dry-run", action="store_true", help="Print result without writing files")
    args = parser.parse_args()

    current = read_current_version()
    target = args.set_version if args.set_version else next_version(current, args.part)
    parse_semver(target)

    print(f"Current: {current}")
    print(f"Target:  {target}")

    if args.dry_run:
        print("Dry run enabled, no files changed.")
        return 0

    apply_updates(current, target)
    print("Updated files:")
    for name, path in FILES.items():
        print(f"- {name}: {path.relative_to(ROOT)}")
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
