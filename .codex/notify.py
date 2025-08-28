#!/usr/bin/env python3

import json
import shutil
import subprocess
import sys


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: notify.py <NOTIFICATION_JSON>")
        return 1

    try:
        notification = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        return 1

    notification_type = notification.get("type")
    if notification_type != "agent-turn-complete":
        return 0

    assistant_message = notification.get("last-assistant-message")
    title = f"Codex: {assistant_message}" if assistant_message else "Codex: Turn Complete!"
    input_messages = notification.get("input_messages", [])
    message = " ".join(input_messages).strip()

    tn = shutil.which("terminal-notifier")
    if not tn:
        return 0

    args = [
        tn,
        "-title",
        title,
        "-message",
        message,
        "-group",
        "codex",
        "-sender",
        "com.mitchellh.ghostty",
        "-activate",
        "com.mitchellh.ghostty",
    ]

    try:
        subprocess.run(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
