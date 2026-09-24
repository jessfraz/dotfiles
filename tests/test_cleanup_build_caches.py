"""Exercise cleanup against disposable repositories and real open files."""

import os
import runpy
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "bin" / "cleanup-build-caches"
TAG = "Signature: 8a477f597d28d172789f06886806bc55\n"


@unittest.skipUnless(shutil.which("lsof"), "lsof is required to inspect active caches")
class CleanupTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.home = Path(self.temporary.name).resolve()
        self.env = dict(os.environ, HOME=str(self.home), GIT_CONFIG_GLOBAL="/dev/null")

    def cache(self, relative: str, *, cargo: bool = True) -> Path:
        path = self.home / relative
        path.mkdir(parents=True)
        if cargo:
            (path / "CACHEDIR.TAG").write_text(TAG)
            (path / "debug").mkdir()
        (path / "artifact").write_bytes(b"compiled output" * 1024)
        return path

    def run_cleanup(self, *arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), *arguments],
            cwd=self.home,
            env=self.env,
            capture_output=True,
            text=True,
            timeout=60,
            check=True,
        )

    def test_removes_generated_caches_without_sources_logs_or_git_backups(self) -> None:
        task = self.cache(".cache/task-target")
        worktree = self.cache(".codex/worktrees/job/project/target-cache")
        saved = self.cache(
            ".codex/cleanup/job/preserved-build-artifacts/project/target"
        )
        node = self.cache(
            ".codex/cleanup/job/preserved-build-artifacts/project/dashboard/node_modules",
            cargo=False,
        )
        repo = self.home / "project"
        subprocess.run(["git", "init", "-q", str(repo)], check=True)
        (repo / "Cargo.toml").write_text("[package]\nname='fixture'\n")
        (repo / ".gitignore").write_text("target/\n")
        local = self.cache("project/target")
        source = repo / "source.rs"
        source.write_text("source")
        log = self.home / ".codex/sessions/log.jsonl"
        log.parent.mkdir(parents=True)
        log.write_text("history")
        backup = self.home / ".codex/cleanup/job/borrowed-submodule-objects/objects"
        backup.mkdir(parents=True)
        (backup / "commit").write_text("unique Git object")
        runtime = self.cache(".cache/codex-runtimes/node_modules", cargo=False)
        result = self.run_cleanup()
        for path in (task, worktree, saved, node, local):
            self.assertFalse(path.exists(), result.stdout)
        self.assertEqual(source.read_text(), "source")
        self.assertEqual(log.read_text(), "history")
        self.assertEqual((backup / "commit").read_text(), "unique Git object")
        self.assertTrue(runtime.exists())
        self.assertIn("Removed 5 build caches", result.stdout)

    def test_open_file_skips_busy_cache_and_continues_with_idle_cache(self) -> None:
        busy = self.cache(".cache/busy-target")
        idle = self.cache(".cache/idle-target")
        process = subprocess.Popen(
            [
                sys.executable,
                "-c",
                "import sys; f=open(sys.argv[1]); print('ready', flush=True); sys.stdin.read()",
                str(busy / "artifact"),
            ],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
        )
        try:
            self.assertEqual(process.stdout.readline().strip(), "ready")
            result = self.run_cleanup()
            self.assertTrue(busy.exists(), result.stdout)
            self.assertFalse(idle.exists(), result.stdout)
            self.assertIn("in use by", result.stdout)
            self.assertIn("skipped 1", result.stdout)
        finally:
            process.communicate(timeout=10)

    @unittest.skipUnless(
        sys.platform == "darwin" and os.environ.get("CLEANUP_TEST_LIVE_SCANNER") == "1",
        "opt-in live macOS storage scanner check",
    )
    def test_storage_management_scanner_traversal_does_not_block_cleanup(self) -> None:
        module = runpy.run_path(str(SCRIPT))
        opened = module["OpenFiles"]()
        opened.refresh()
        # Use one captured real process snapshot so a moving scanner does not
        # turn this into a timing test. CI without this service uses the native
        # transcript regression instead.
        for pid, command, descriptor, path in opened.files:
            if command != "StorageManagementService" or descriptor != "cwd":
                continue
            if any(
                owner != pid and (other == path or path in other.parents)
                for owner, _, _, other in opened.files
            ):
                continue
            self.assertIsNone(opened.busy(module["Cache"](path)))
            return
        self.skipTest("no isolated StorageManagementService traversal is active")

    def test_native_scanner_records_preserve_real_read_write_and_execution_use(
        self,
    ) -> None:
        module = runpy.run_path(str(SCRIPT))
        # Captured macOS lsof fields, with PID and scanned paths anonymized.
        # Both a cwd and read-only directory descriptors occur during traversal.
        transcript = (
            b"p22828\0cStorageManagementService\0\n"
            b"fcwd\0a \0tDIR\0n/fixture-cache/debug\0\n"
            b"ftxt\0a \0tREG\0n/System/Library/PrivateFrameworks/StorageManagement.framework/PlugIns/StorageManagementService\0\n"
            b"f3\0ar\0tDIR\0n/fixture-cache/debug\0\n"
        )
        cache = module["Cache"](Path("/fixture-cache"))
        for extra, blocked in [
            (b"", False),
            (b"f4\0ar\0tREG\0n/fixture-cache/input\0\n", True),
            (b"f4\0aw\0tDIR\0n/fixture-cache/debug\0\n", True),
            (b"f4\0au\0tREG\0n/fixture-cache/output\0\n", True),
            (b"ftxt\0a \0tREG\0n/fixture-cache/runtime\0\n", True),
            (b"p12345\0cworker\0fcwd\0a \0tDIR\0n/fixture-cache/debug\0\n", True),
        ]:
            with self.subTest(extra=extra):
                opened = module["OpenFiles"]()
                opened.files, opened.scanner_traversals = module["parse_open_files"](
                    transcript + extra
                )
                opened.checked = time.monotonic()
                self.assertEqual(opened.busy(cache) is not None, blocked)
        impostor = transcript.replace(
            b"/System/Library/PrivateFrameworks/StorageManagement.framework/PlugIns/StorageManagementService",
            b"/usr/local/bin/StorageManagementService",
        )
        opened = module["OpenFiles"]()
        opened.files, opened.scanner_traversals = module["parse_open_files"](impostor)
        opened.checked = time.monotonic()
        self.assertIsNotNone(opened.busy(cache))

    def test_tracked_source_and_symlink_are_skipped_while_idle_cache_is_removed(
        self,
    ) -> None:
        repo = self.home / "project"
        subprocess.run(["git", "init", "-q", str(repo)], check=True)
        (repo / "Cargo.toml").write_text("[package]\nname='fixture'\n")
        (repo / ".gitignore").write_text("target/\n")
        tracked = self.cache("project/target")
        subprocess.run(
            ["git", "-C", str(repo), "add", "-f", "target/artifact"], check=True
        )
        destination = self.cache("elsewhere/target")
        link = self.home / ".codex/worktrees/job/target"
        link.parent.mkdir(parents=True)
        link.symlink_to(destination, target_is_directory=True)
        idle = self.cache(".cache/idle-target")
        result = self.run_cleanup()
        self.assertTrue((tracked / "artifact").exists(), result.stdout)
        self.assertTrue(destination.exists(), result.stdout)
        self.assertTrue(link.is_symlink(), result.stdout)
        self.assertFalse(idle.exists(), result.stdout)
        self.assertIn("contains tracked source", result.stdout)
        self.assertIn("symlink root", result.stdout)

    def test_builder_in_repository_preserves_cache_before_opening_output(self) -> None:
        repo = self.home / "project"
        subprocess.run(["git", "init", "-q", str(repo)], check=True)
        (repo / "Cargo.toml").write_text("[package]\nname='fixture'\n")
        (repo / ".gitignore").write_text("target/\n")
        cache = self.cache("project/target")
        process = subprocess.Popen(
            [
                sys.executable,
                "-c",
                "import sys; print('ready', flush=True); sys.stdin.read()",
            ],
            cwd=repo,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
        )
        try:
            self.assertEqual(process.stdout.readline().strip(), "ready")
            result = self.run_cleanup()
            self.assertTrue(cache.exists(), result.stdout)
            self.assertIn("builder", result.stdout)
        finally:
            process.communicate(timeout=10)

    def test_bare_git_repository_inside_cache_retains_unique_objects(self) -> None:
        cache = self.cache(".cache/task-target")
        bare = cache / "local-history.git"
        subprocess.run(["git", "init", "--bare", "-q", str(bare)], check=True)
        stored = subprocess.run(
            ["git", "--git-dir", str(bare), "hash-object", "-w", "--stdin"],
            input="irreplaceable local history",
            text=True,
            capture_output=True,
            check=True,
        ).stdout.strip()
        subprocess.run(
            ["git", "--git-dir", str(bare), "update-ref", "refs/tags/keep", stored],
            check=True,
        )
        idle = self.cache(".cache/idle-target")
        result = self.run_cleanup()
        self.assertTrue(cache.exists(), result.stdout)
        self.assertFalse(idle.exists(), result.stdout)
        recovered = subprocess.run(
            ["git", "--git-dir", str(bare), "cat-file", "blob", "refs/tags/keep"],
            text=True,
            capture_output=True,
            check=True,
        ).stdout
        self.assertEqual(recovered, "irreplaceable local history")
        self.assertIn("bare Git repository", result.stdout)

    def test_dry_run_preserves_caches_and_skips_following_package_cleanup(self) -> None:
        cache = self.cache(".cache/task-target")
        commands = self.home / "commands"
        commands.mkdir()
        (commands / "cleanup-build-caches").symlink_to(SCRIPT)
        # If the shell function falls through, a real executable records it.
        for name in ("uv", "npm", "yarn", "go", "sudo"):
            command = commands / name
            command.write_text(
                '#!/bin/sh\nprintf called >> "$HOME/package-cleanup-called"\n'
            )
            command.chmod(0o755)
        result = subprocess.run(
            [
                "bash",
                "--noprofile",
                "--norc",
                "-c",
                'source "$1"; cleanup --dry-run',
                "bash",
                str(ROOT / ".functions"),
            ],
            env=dict(self.env, PATH=f"{commands}:{os.environ['PATH']}"),
            cwd=self.home,
            capture_output=True,
            text=True,
            timeout=60,
            check=True,
        )
        self.assertTrue(cache.exists(), result.stdout)
        self.assertFalse((self.home / "package-cleanup-called").exists())
        self.assertIn("WOULD REMOVE", result.stdout)


if __name__ == "__main__":
    unittest.main()
