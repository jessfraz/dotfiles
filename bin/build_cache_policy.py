"""Recognize regenerable project output shared by cache and worktree cleanup."""

from pathlib import Path

MANIFEST_OUTPUTS = {
    "Cargo.toml": ("target", "target-cache"),
    "package.json": (
        "node_modules",
        "dist",
        ".next",
        ".vite",
        "playwright-report",
        "test-results",
    ),
    "pyproject.toml": (".venv", ".pytest_cache", ".ruff_cache", ".mypy_cache"),
}
CACHE_NAMES = frozenset(name for names in MANIFEST_OUTPUTS.values() for name in names)
CACHE_TAG = b"Signature: 8a477f597d28d172789f06886806bc55"


def cargo_cache(path: Path) -> bool:
    try:
        with (path / "CACHEDIR.TAG").open("rb") as tag:
            tagged = tag.read(len(CACHE_TAG)) == CACHE_TAG
        return tagged and (
            (path / ".rustc_info.json").is_file()
            or (path / "debug").is_dir()
            or (path / "release").is_dir()
        )
    except OSError:
        return False


def generated(path: Path, *, preserved: bool = False) -> bool:
    if path.name not in CACHE_NAMES:
        return False
    if preserved:
        return True
    if path.name in MANIFEST_OUTPUTS["Cargo.toml"]:
        return (path.parent / "Cargo.toml").is_file() or cargo_cache(path)
    if path.name == ".venv":
        return (path / "pyvenv.cfg").is_file()
    return any(
        path.name in names and (path.parent / manifest).is_file()
        for manifest, names in MANIFEST_OUTPUTS.items()
    )
