"""Exercise private account rendering and native Switchboard validation."""

import json
import shutil
import stat
import subprocess
import sys
import tempfile
import tomllib
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "bin" / "render-switchboard-config"
SWITCHBOARD = shutil.which("switchboard")
TEMPLATE = """
[auth.google_personal]
provider = "google"
kind = "google_cli"
account = "@google.personal@"
[auth.google_work]
provider = "google"
kind = "google_cli"
account = "@google.work@"
[namespace.google.personal]
provider = "google"
account = "@google.personal@"
auth = "google_personal"
[namespace.google.work]
provider = "google"
account = "@google.work@"
auth = "google_work"
"""
BINDINGS = """
[google]
personal = "private-person@example.invalid"
work = "private-work@example.invalid"
"""


class SwitchboardConfigTests(unittest.TestCase):
    def setUp(self) -> None:
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.template = self.root / "template.toml"
        self.template.write_text(TEMPLATE)
        self.accounts = self.root / "accounts.toml"
        self.accounts.write_text(BINDINGS)
        self.accounts.chmod(0o600)
        self.destination = self.root / "config.toml"
        self.destination.write_text("existing configuration\n")
        self.original = self.destination.read_bytes()
        self.inode = self.destination.stat().st_ino

    def render(self, validator: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--template", str(self.template),
             "--accounts", str(self.accounts), "--destination", str(self.destination),
             "--switchboard", validator],
            capture_output=True, text=True, timeout=40, check=False,
        )

    def assert_retained(self, result: subprocess.CompletedProcess[str]) -> None:
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.destination.read_bytes(), self.original)
        self.assertEqual(self.destination.stat().st_ino, self.inode)
        self.assertEqual(list(self.root.glob(".switchboard-*.toml")), [])
        self.assertNotIn("private-person@example.invalid", result.stdout + result.stderr)
        self.assertNotIn("private-work@example.invalid", result.stdout + result.stderr)

    def test_missing_or_invalid_private_bindings_preserve_the_destination(self) -> None:
        self.accounts.unlink()
        result = self.render("/unavailable-validator")
        self.assert_retained(result)
        self.assertIn("Missing private accounts.toml", result.stderr)
        for contents in [
            "[google",
            '[google]\npersonal="private-person@example.invalid"',
            '[google]\npersonal="personal"\nwork="private-work@example.invalid"',
            BINDINGS.replace("private-work", "private-person"),
        ]:
            self.accounts.write_text(contents)
            self.accounts.chmod(0o600)
            self.assert_retained(self.render("/unavailable-validator"))

    def test_public_or_symlinked_binding_files_are_rejected(self) -> None:
        self.accounts.chmod(0o644)
        self.assert_retained(self.render("/unavailable-validator"))
        private = self.root / "private.toml"
        self.accounts.rename(private)
        private.chmod(0o600)
        self.accounts.symlink_to(private)
        self.assert_retained(self.render("/unavailable-validator"))

    def test_unavailable_or_failed_validator_preserves_the_destination(self) -> None:
        self.assert_retained(self.render("/unavailable-validator"))
        # The actual Python CLI rejects Switchboard's argv with a nonzero exit.
        self.assert_retained(self.render(sys.executable))

    @unittest.skipUnless(SWITCHBOARD, "native Switchboard is required")
    def test_actual_toml_with_private_identities_passes_native_validation_and_installs_privately(self) -> None:
        result = self.render(SWITCHBOARD)
        self.assertEqual(result.returncode, 0, result.stderr)
        parsed = tomllib.loads(self.destination.read_text())
        for role, value in tomllib.loads(BINDINGS)["google"].items():
            self.assertEqual(parsed["auth"][f"google_{role}"]["account"], value)
            self.assertEqual(parsed["namespace"]["google"][role]["account"], value)
        self.assertEqual(stat.S_IMODE(self.destination.stat().st_mode), 0o600)
        self.assertEqual(list(self.root.glob(".switchboard-*.toml")), [])
        self.assertEqual(result.stdout, "")

    @unittest.skipUnless(SWITCHBOARD, "native Switchboard is required")
    def test_native_config_rejection_preserves_the_destination(self) -> None:
        self.template.write_text(TEMPLATE.replace('provider = "google"', 'provider = "invalid"', 1))
        self.assert_retained(self.render(SWITCHBOARD))

    def configured_delegation(self) -> dict[str, str]:
        personal_dir = str(self.root / "personal")
        template = TEMPLATE.replace('auth = "google_personal"', 'auth = "google_personal"\nstate_dir = ' + json.dumps(personal_dir))
        self.template.write_text(template)
        contents = template
        for role, account in tomllib.loads(BINDINGS)["google"].items():
            contents = contents.replace(json.dumps(f"@google.{role}@"), json.dumps(account))
        contents = contents.replace('auth = "google_personal"', 'auth = "google_personal_gmail_settings"')
        delegation = {
            "project": "example-project",
            "service_account": "settings@example-project.iam.gserviceaccount.com",
            "domain": "example.invalid",
            "subject": "private-person@example.invalid",
            "signer_account": "private-person@example.invalid",
            "signer_state_dir": personal_dir,
        }
        contents += '\n[auth.google_personal_gmail_settings]\nprovider = "google"\nkind = "google_delegated"\naccount = "private-person@example.invalid"\n'
        contents += "[auth.google_personal_gmail_settings.delegation]\n"
        contents += "".join(f"{name} = {json.dumps(value)}\n" for name, value in delegation.items())
        self.destination.write_text(contents)
        self.original = self.destination.read_bytes()
        self.inode = self.destination.stat().st_ino
        return delegation

    @unittest.skipUnless(SWITCHBOARD, "native Switchboard is required")
    def test_rebuild_keeps_completed_delegation_and_normal_oauth_separate(self) -> None:
        delegation = self.configured_delegation()
        result = self.render(SWITCHBOARD)
        self.assertEqual(result.returncode, 0, result.stderr)
        native = subprocess.run([SWITCHBOARD, "--config", str(self.destination), "ns", "list", "--json"],
                                capture_output=True, text=True, timeout=30, check=True)
        namespaces = {item["id"]: item for item in json.loads(native.stdout)["namespaces"]}
        self.assertEqual(namespaces["google.personal"]["auth_kind"], "google_delegated")
        self.assertEqual(namespaces["google.work"]["auth_kind"], "google_cli")
        parsed = tomllib.loads(self.destination.read_text())
        self.assertEqual(parsed["auth"]["google_personal_gmail_settings"]["delegation"], delegation)
        self.assertEqual(parsed["auth"]["google_personal"]["kind"], "google_cli")
        installed = self.destination.read_bytes()
        self.assertEqual(self.render(SWITCHBOARD).returncode, 0)
        self.assertEqual(self.destination.read_bytes(), installed)

    @unittest.skipUnless(SWITCHBOARD, "native Switchboard is required")
    def test_changed_binding_cannot_reassign_an_existing_delegation(self) -> None:
        self.configured_delegation()
        self.accounts.write_text(BINDINGS.replace("private-person", "different-person"))
        self.assert_retained(self.render(SWITCHBOARD))


if __name__ == "__main__":
    unittest.main()
