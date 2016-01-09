#!/bin/bash
set -e

# install.sh
#	This script installs my basic setup for a debian laptop

# get the user that is not root
# TODO: makes a pretty bad assumption that there is only one other user
USERNAME=$(find /home/* -maxdepth 0 -printf "%f" -type d)
export DEBIAN_FRONTEND=noninteractive

check_is_sudo() {
	if [ "$EUID" -ne 0 ]; then
		echo "Please run as root."
		exit
	fi
}

# sets up apt sources
# assumes you are going to use debian stretch
setup_sources() {
	cat <<-EOF > /etc/apt/sources.list
	deb http://httpredir.debian.org/debian stretch main contrib non-free
	deb-src http://httpredir.debian.org/debian/ stretch main contrib non-free

	deb http://httpredir.debian.org/debian/ stretch-updates main contrib non-free
	deb-src http://httpredir.debian.org/debian/ stretch-updates main contrib non-free

	deb http://security.debian.org/ stretch/updates main contrib non-free
	deb-src http://security.debian.org/ stretch/updates main contrib non-free

	#deb http://httpredir.debian.org/debian/ jessie-backports main contrib non-free
	#deb-src http://httpredir.debian.org/debian/ jessie-backports main contrib non-free

	deb http://httpredir.debian.org/debian experimental main contrib non-free
	deb-src http://httpredir.debian.org/debian experimental main contrib non-free

	# hack for latest git (don't judge)
	deb http://ppa.launchpad.net/git-core/ppa/ubuntu vivid main
	deb-src http://ppa.launchpad.net/git-core/ppa/ubuntu vivid main

	# neovim
	deb http://ppa.launchpad.net/neovim-ppa/unstable/ubuntu vivid main
	deb-src http://ppa.launchpad.net/neovim-ppa/unstable/ubuntu vivid main

	# tlp: Advanced Linux Power Management
	# http://linrunner.de/en/tlp/docs/tlp-linux-advanced-power-management.html
	deb http://repo.linrunner.de/debian sid main
	EOF

	# add docker apt repo
	cat <<-EOF > /etc/apt/sources.list.d/docker.list
	deb https://apt.dockerproject.org/repo debian-stretch main
	deb https://apt.dockerproject.org/repo debian-stretch testing
	deb https://apt.dockerproject.org/repo debian-stretch experimental
	EOF

	# add docker gpg key
	apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D

	# add the git-core ppa gpg key
	apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys E1DD270288B4E6030699E45FA1715D88E1DF1F24

	# add the neovim ppa gpg key
	apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 9DBB0BE9366964F134855E2255F96FCF8231B6DD

	# add the tlp apt-repo gpg key
	apt-key adv --keyserver pool.sks-keyservers.net --recv-keys CD4E8809

	# turn off translations, speed up apt-get update
	mkdir -p /etc/apt/apt.conf.d
	echo 'Acquire::Languages "none";' > /etc/apt/apt.conf.d/99translations
}

# installs base packages
# the utter bare minimal shit
base() {
	apt-get update
	apt-get -y upgrade

	apt-get install -y \
		adduser \
		alsa-utils \
		apparmor \
		apt-transport-https \
		automake \
		bash-completion \
		bc \
		bridge-utils \
		bzip2 \
		ca-certificates \
		cgroupfs-mount \
		cmake \
		coreutils \
		curl \
		dnsutils \
		file \
		findutils \
		fortune-mod \
		fortunes-off \
		gcc \
		git \
		gnupg \
		gnupg-agent \
		gnupg-curl \
		grep \
		gzip \
		hostname \
		indent \
		iptables \
		jq \
		less \
		libc6-dev \
		libltdl-dev \
		locales \
		lsof \
		make \
		mount \
		net-tools \
		nfs-common \
		network-manager \
		openvpn \
		rxvt-unicode-256color \
		s3cmd \
		scdaemon \
		silversearcher-ag \
		ssh \
		strace \
		sudo \
		tar \
		tree \
		tzdata \
		unzip \
		xclip \
		xcompmgr \
		xz-utils \
		zip \
		--no-install-recommends

	# install tlp with recommends
	apt-get install -y tlp tlp-rdw

	setup_sudo

	apt-get autoremove
	apt-get autoclean
	apt-get clean

	install_docker
	install_syncthing
	install_scripts
}

# setup sudo for a user
# because fuck typing that shit all the time
# just have a decent password
# and lock your computer when you aren't using it
# if they have your password they can sudo anyways
# so its pointless
# i know what the fuck im doing ;)
setup_sudo() {
	# add user to sudoers
	adduser "$USERNAME" sudo

	# add user to systemd groups
	# then you wont need sudo to view logs and shit
	gpasswd -a "$USERNAME" systemd-journal
	gpasswd -a "$USERNAME" systemd-network

	# add go path to secure path
	{ \
		echo -e 'Defaults	secure_path="/usr/local/go/bin:/home/jessie/.go/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"'; \
		echo -e 'Defaults	env_keep += "ftp_proxy http_proxy https_proxy no_proxy GOPATH EDITOR"'; \
		echo -e "${USERNAME} ALL=(ALL) NOPASSWD:ALL"; \
		echo -e "${USERNAME} ALL=NOPASSWD: /bin/mount, /sbin/mount.nfs, /bin/umount, /sbin/umount.nfs, /sbin/ifconfig, /sbin/ifup, /sbin/ifdown, /sbin/ifquery"; \
	} >> /etc/sudoers

	# setup downloads folder as tmpfs
	# that way things are removed on reboot
	# i like things clean but you may not want this
	mkdir -p "/home/$USERNAME/Downloads"
	echo -e "\n# tmpfs for downloads\ntmpfs\t/home/${USERNAME}/Downloads\ttmpfs\tnodev,nosuid,size=2G\t0\t0" >> /etc/fstab
}

# installs docker master
# and adds necessary items to boot params
install_docker() {
	# create docker group
	sudo groupadd docker
	sudo gpasswd -a "$USERNAME" docker

	curl -sSL https://master.dockerproject.org/linux/amd64/docker > /usr/bin/docker
	chmod +x /usr/bin/docker

	curl -sSL https://raw.githubusercontent.com/jfrazelle/dotfiles/master/etc/systemd/system/docker.service > /etc/systemd/system/docker.service
	curl -sSL https://raw.githubusercontent.com/jfrazelle/dotfiles/master/etc/systemd/system/docker.socket > /etc/systemd/system/docker.socket

	systemctl daemon-reload
	systemctl enable docker

	# update grub with docker configs and power-saving items
	sed -i.bak 's/GRUB_CMDLINE_LINUX=""/GRUB_CMDLINE_LINUX="cgroup_enable=memory swapaccount=1 i915.enable_psr=0 pcie_asm=force i915.i915_enable_fbc=1 i915.i915_enable_rc6=7 i915.lvds_downclock=1 apparmor=1 security=apparmor"/g' /etc/default/grub
	echo "Docker has been installed. If you want memory management & swap"
	echo "run update-grub & reboot"
}

# installs git from source
# no longer used but nice to have
install_git() {
	local GIT_VERSION=2.3.0
	local GIT_SRC=/usr/src/git

	# if we are passing the version
	if [[ ! -z "$1" ]]; then
		local GIT_VERSION=$1
	fi

	# install dependencies
	apt-get install -y \
		gettext \
		gcc \
		libcurl4-gnutls-dev \
		libexpat1-dev \
		libssl-dev \
		libz-dev \
		make \
		--no-install-recommends

	# purge old src
	if [[ -d "$GIT_SRC" ]]; then
		rm -rf "$GIT_SRC"
	fi

	# get the new src
	mkdir -p /usr/src/git
	curl -sSl "https://www.kernel.org/pub/software/scm/git/git-${GIT_VERSION}.tar.gz" | tar -v -C $GIT_SRC -xz --strip-components=1 && \
		cd "$GIT_SRC" && \
		make prefix=/usr/local all && \
		make prefix=/usr/local install

	# copy the bash completions
	cp /usr/src/git/contrib/completion/git-completion.bash /etc/bash_completion.d/git

	# get the new man pages
	curl -sSl "https://www.kernel.org/pub/software/scm/git/git-manpages-${GIT_VERSION}.tar.gz" | tar -v -C /usr/local/share/man -xz

	# cleanup
	rm -rf "$GIT_SRC"

	echo "Git version $GIT_VERSION has been installed"
}

# install/update golang from source
install_golang() {
	export GO_VERSION=1.5.1
	export GO_SRC=/usr/local/go

	# if we are passing the version
	if [[ ! -z "$1" ]]; then
		export GO_VERSION=$1
	fi

	# purge old src
	if [[ -d "$GO_SRC" ]]; then
		sudo rm -rf "$GO_SRC"
		sudo rm -rf "$GOPATH"
	fi

	# subshell because we `cd`
	(
	curl -sSL "https://storage.googleapis.com/golang/go${GO_VERSION}.linux-amd64.tar.gz" | sudo tar -v -C /usr/local -xz
	)

	# get commandline tools
	(
	set -x
	set +e
	go get github.com/golang/lint/golint
	go get golang.org/x/tools/cmd/cover
	go get golang.org/x/tools/cmd/vet
	go get golang.org/x/tools/cmd/goimports

	go get github.com/jfrazelle/bane
	go get github.com/jfrazelle/battery
	go get github.com/jfrazelle/budf
	go get github.com/jfrazelle/cliaoke
	go get github.com/jfrazelle/netscan
	go get github.com/jfrazelle/onion
	go get github.com/jfrazelle/pastebinit
	go get github.com/jfrazelle/pony
	go get github.com/jfrazelle/udict
	go get github.com/jfrazelle/weather

	go get github.com/cloudflare/cfssl/cmd/cfssl
	go get github.com/cloudflare/cfssl/cmd/cfssljson
	go get github.com/crosbymichael/gistit
	go get github.com/crosbymichael/ip-addr
	go get github.com/digitalocean/doctl
	go get github.com/docker/gordon/pulls
	go get github.com/cbednarski/hostess/cmd/hostess
	)
}

# install graphics drivers
install_graphics() {
	local system=$1

	if [[ -z "$system" ]]; then
		echo "You need to specify whether it's dell, mac or lenovo"
		exit 1
	fi

	local pkgs="nvidia-kernel-dkms bumblebee-nvidia primus"

	if [[ $system == "mac" ]] || [[ $system == "dell" ]]; then
		local pkgs="xorg xserver-xorg xserver-xorg-video-intel"
	fi

	apt-get install -y "$pkgs" --no-install-recommends
}

# install custom scripts/binaries
install_scripts() {
	local scripts=( asciinema curl-unix-socket gist git-icdiff go-md2man have htotheizzo icdiff light lolcat speedtest todo )

	for script in "${scripts[@]}"; do
		curl -sSL "http://jesss.s3.amazonaws.com/binaries/$script" > /usr/local/bin/$script
		chmod +x /usr/local/bin/$script
	done

	curl -sSL http://jesss.s3.amazonaws.com/binaries/todo_completions > /etc/bash_completion.d/todo
}

# install syncthing
install_syncthing() {
	# download binary
	curl -sSL https://jesss.s3.amazonaws.com/binaries/syncthing > /usr/local/bin/syncthing
	chmod +x /usr/local/bin/syncthing

	curl -sSL https://raw.githubusercontent.com/jfrazelle/dotfiles/master/etc/systemd/system/syncthing@.service > /etc/systemd/system/syncthing@.service

	syncthing -upgrade

	systemctl daemon-reload
	systemctl enable "syncthing@${USERNAME}"
}

# install wifi drivers
install_wifi() {
	local system=$1

	if [[ -z "$system" ]]; then
		echo "You need to specify whether it's broadcom or intel"
		exit 1
	fi

	if [[ $system == "broadcom" ]]; then
		local pkg="broadcom-sta-dkms"

		apt-get install -y "$pkg" --no-install-recommends
	else
		update-iwlwifi
	fi
}

# install stuff for i3 window manager
install_wmapps() {
	local pkgs="feh i3 i3lock i3status scrot slim neovim"

	apt-get install -y "$pkgs" --no-install-recommends

	# update clickpad settings
	mkdir -p /etc/X11/xorg.conf.d/
	curl -sSL https://raw.githubusercontent.com/jfrazelle/dotfiles/master/etc/X11/xorg.conf.d/50-synaptics-clickpad.conf > /etc/X11/xorg.conf.d/50-synaptics-clickpad.conf

	# add xorg conf
	curl -sSL https://raw.githubusercontent.com/jfrazelle/dotfiles/master/etc/X11/xorg.conf > /etc/X11/xorg.conf

	# get correct sound cards on boot
	curl -sSL https://raw.githubusercontent.com/jfrazelle/dotfiles/master/etc/modprobe.d/intel.conf > /etc/modprobe.d/intel.conf

	# pretty fonts
	curl -sSL https://raw.githubusercontent.com/jfrazelle/dotfiles/master/etc/fonts/local.conf > /etc/fonts/local.conf

	echo "Fonts file setup successfully now run:"
	echo "	dpkg-reconfigure fontconfig-config"
	echo "with settings: "
	echo "	Autohinter, Automatic, No."
	echo "Run: "
	echo "	dpkg-reconfigure fontconfig"
}

get_dotfiles() {
	# create subshell
	(
	cd "/home/$USERNAME"

	# install dotfiles from repo
	git clone git@github.com:jfrazelle/dotfiles.git "/home/$USERNAME/dotfiles"
	cd "/home/$USERNAME/dotfiles"

	# installs all the things
	make

	# enable dbus for the user session
	systemctl --user enable dbus.socket

	sudo systemctl enable i3lock
	sudo systemctl enable suspend-sedation.service

	cd "/home/$USERNAME"

	# install .vim files
	git clone --recursive git@github.com:jfrazelle/.vim.git "/home/$USERNAME/.vim"
	ln -snf "/home/$USERNAME/.vim/vimrc" "/home/$USERNAME/.vimrc"
	sudo ln -snf "/home/$USERNAME/.vim" /root/.vim
	sudo ln -snf "/home/$USERNAME/.vimrc" /root/.vimrc

	mkdir -p ~/Pictures
	mkdir -p ~/Torrents
	)
}


usage() {
	echo -e "install.sh\n\tThis script installs my basic setup for a debian laptop\n"
	echo "Usage:"
	echo "  sources                     - setup sources & install base pkgs"
	echo "  wifi {broadcom,intel}       - install wifi drivers"
	echo "  graphics {dell,mac,lenovo}  - install graphics drivers"
	echo "  wm                          - install window manager/desktop pkgs"
	echo "  dotfiles                    - get dotfiles"
	echo "  golang                      - install golang and packages"
	echo "  syncthing                   - install syncthing"
}

main() {
	local cmd=$1

	if [[ -z "$cmd" ]]; then
		usage
		exit 1
	fi

	if [[ $cmd == "sources" ]]; then
		check_is_sudo

		# setup /etc/apt/sources.list
		setup_sources

		base
	elif [[ $cmd == "wifi" ]]; then
		install_wifi "$2"
	elif [[ $cmd == "graphics" ]]; then
		check_is_sudo

		install_graphics "$2"
	elif [[ $cmd == "wm" ]]; then
		check_is_sudo

		install_wmapps
	elif [[ $cmd == "dotfiles" ]]; then
		get_dotfiles
	elif [[ $cmd == "golang" ]]; then
		install_golang "$2"
	elif [[ $cmd == "git" ]]; then
		install_git "$2"
	elif [[ $cmd == "syncthing" ]]; then
		install_syncthing
	else
		usage
	fi
}

main "$@"
