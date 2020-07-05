#!/usr/bin/osascript

-- Copyright (c) Microsoft. All rights reserved.
-- Licensed under the MIT license. See LICENSE file in the project root for full license information.

on run argv
   set debuggerTitle to (item 1 of argv)
   set executeCommand to (item 2 of argv)
   -- Note: if other tabs are open in the terminal window that is opened by this script, this won't behave properly.
   set command to executeCommand & ¬
                  "/usr/bin/osascript -e 'tell application \"Terminal\" to close (every window whose tty is \"'\"$(tty)\"'\")' & exit"

    tell application "Terminal"
        -- "do script" will open a new Terminal window if no window is specified
        -- If Terminal is not already running, do script will open a window in addition
        -- to the window opened by opening Terminal. Hence, specify the first window if not running
        if it is running then
            activate
            set newTab to do script command
        else
            activate
            set newTab to do script command in window 1
        end if

        set custom title of newTab to debuggerTitle
    end tell
end run
