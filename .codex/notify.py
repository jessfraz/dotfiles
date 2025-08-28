#!/usr/bin/env python3

import json
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

    match notification_type := notification.get("type"):
        case "agent-turn-complete":
            assistant_message = notification.get("last-assistant-message")
            if assistant_message:
                title = f"Codex: {assistant_message}"
            else:
                title = "Codex: Turn Complete!"
            input_messages = notification.get("input_messages", [])
            message = " ".join(input_messages)
            title += message
        case _:
            print(f"not sending a push notification for: {notification_type}")
            return 0

    args = [
        "terminal-notifier",
        "-title",
        title,
        "-message",
        message,
        "-group",
        "codex",
        "-ignoreDnD",
        "-activate",
        "com.mitchellh.ghostty",
    ]

    subprocess.check_output(args)

    return 0


if __name__ == "__main__":
    sys.exit(main())
