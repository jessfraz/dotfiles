#!/bin/sh
#
## ~/.xsessionrc
#
## Executed by startx (run your window manager from here)

if [ -d /etc/X11/xinit/xinitrc.d ]; then
	for f in /etc/X11/xinit/xinitrc.d/*; do
		if [ -x "$f" ]; then
			# shellcheck source=/dev/null
			. "$f"
		fi
	done
	unset f
fi

# run Xprofile
if [ -f ~/.Xprofile ]; then
	# shellcheck source=/dev/null
	. ~/.Xprofile
fi

# run Xmodmap
[ -f ~/.Xmodmap ] && xmodmap ~/.Xmodmap

# run local xhost
xhost local:root

# uncomment this if not using a login manager
# so i3 will start correctly
exec i3 -V >> ~/.i3/logfile 2>&1
