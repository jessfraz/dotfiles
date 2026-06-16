#!/usr/bin/env python3

import json
import os
import shutil
import subprocess
import sys
from typing import Optional

CODEX_APP_BUNDLE_ID = "com.openai.codex"
GHOSTTY_BUNDLE_ID = "com.mitchellh.ghostty"
TERMINAL_CLIENTS = {
    "codex-tui",
    "codex_exec",
}
CODEX_APP_CLIENT_HINTS = (
    "codex-app",
    "codex_app",
    "codex-desktop",
    "codex_desktop",
    "codex desktop",
)


def current_bundle_identifier() -> Optional[str]:
    return os.environ.get("__CFBundleIdentifier")


def is_ghostty() -> bool:
    return (
        os.environ.get("TERM_PROGRAM") == "ghostty"
        or current_bundle_identifier() == GHOSTTY_BUNDLE_ID
        or os.environ.get("TERM") == "xterm-ghostty"
    )


def notification_client(notification: dict[str, object]) -> Optional[str]:
    client = notification.get("client")
    if isinstance(client, str) and client:
        return client
    return None


def is_terminal_client(client: Optional[str]) -> bool:
    return client is not None and client.lower() in TERMINAL_CLIENTS


def is_codex_app_client(client: Optional[str]) -> bool:
    if client is None:
        return False

    normalized = client.lower()
    if normalized in TERMINAL_CLIENTS:
        return False

    return normalized == "codex" or any(hint in normalized for hint in CODEX_APP_CLIENT_HINTS)


def activation_bundle(notification: dict[str, object]) -> str:
    override = os.environ.get("CODEX_NOTIFY_ACTIVATE_BUNDLE")
    if override:
        return override

    # The Computer Use turn-ended helper is the carrier, not the origin. Codex's
    # notify payload includes the app-server client name, so use that first.
    client = notification_client(notification)
    if is_terminal_client(client):
        return GHOSTTY_BUNDLE_ID
    if is_codex_app_client(client):
        return CODEX_APP_BUNDLE_ID

    bundle = current_bundle_identifier()
    if bundle and bundle.startswith(CODEX_APP_BUNDLE_ID):
        return CODEX_APP_BUNDLE_ID

    return GHOSTTY_BUNDLE_ID


def should_use_terminal_notifier() -> bool:
    if os.environ.get("CODEX_NOTIFY_FORCE_TERMINAL_NOTIFIER") == "1":
        return True
    if is_ghostty():
        return False
    return True


def terminal_notifier_args(
    terminal_notifier: str, title: str, message: str, notification: dict[str, object]
) -> list[str]:
    return [
        terminal_notifier,
        "-title",
        title,
        "-message",
        message,
        "-group",
        "codex",
        "-activate",
        activation_bundle(notification),
    ]


def notify(title: str, message: str, notification: dict[str, object]) -> None:
    """Send a notification using terminal-notifier only.

    Minimal, non-blocking and predictable: runs
      terminal-notifier -title <title> -message <message> -group codex
    and ignores failures.
    """
    if not should_use_terminal_notifier():
        return
    tn = shutil.which("terminal-notifier")
    if not tn:
        return
    args = terminal_notifier_args(tn, title, message, notification)
    try:
        subprocess.run(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=3)
    except Exception:
        pass


def input_messages(notification: dict[str, object]) -> list[str]:
    raw_messages = notification.get("input-messages")
    if raw_messages is None:
        raw_messages = notification.get("input_messages", [])
    if not isinstance(raw_messages, list):
        return []
    return [message for message in raw_messages if isinstance(message, str)]


def main() -> int:

    raw: Optional[str] = None
    if len(sys.argv) == 2:
        raw = sys.argv[1]
    else:
        # Fallback: try reading JSON from stdin if piped
        if not sys.stdin.isatty():
            raw = sys.stdin.read().strip() or None

    if not raw:
        print("Usage: notify.py <NOTIFICATION_JSON>")
        return 1

    try:
        notification = json.loads(raw)
    except json.JSONDecodeError:
        # Don't crash the agent pipeline on local format issues
        return 1

    if notification.get("type") != "agent-turn-complete":
        return 0

    assistant_message: Optional[str] = notification.get("last-assistant-message")
    title = f"Codex: {assistant_message}" if assistant_message else "Codex: Turn Complete!"
    message = " ".join(input_messages(notification)).strip()

    notify(title, message, notification)
    return 0


if __name__ == "__main__":
    sys.exit(main())
