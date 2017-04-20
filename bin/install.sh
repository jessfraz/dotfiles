#!/bin/bash
set -e

# install.sh
#	This script installs my basic setup for a debian laptop

# get the user that is not root
# TODO: makes a pretty bad assumption that there is only one other user
USERNAME=$(find /home/* -maxdepth 0 -printf "%f" -type d || echo "$USER")
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
	apt-get update
	apt-get install -y \
		apt-transport-https \
		ca-certificates \
		curl \
		dirmngr \
		--no-install-recommends

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
	deb http://ppa.launchpad.net/git-core/ppa/ubuntu wily main
	deb-src http://ppa.launchpad.net/git-core/ppa/ubuntu wily main

	# neovim
	deb http://ppa.launchpad.net/neovim-ppa/unstable/ubuntu wily main
	deb-src http://ppa.launchpad.net/neovim-ppa/unstable/ubuntu wily main

	# yubico
	deb http://ppa.launchpad.net/yubico/stable/ubuntu wily main
	deb-src http://ppa.launchpad.net/yubico/stable/ubuntu wily main

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

	# Add the Cloud SDK distribution URI as a package source
	echo "deb https://packages.cloud.google.com/apt cloud-sdk-sid main" > /etc/apt/sources.list.d/google-cloud-sdk.list

	# Import the Google Cloud Platform public key
	curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -

	# Add the Google Chrome distribution URI as a package source
	echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

	# Import the Google Chrome public key
	curl https://dl.google.com/linux/linux_signing_key.pub | apt-key add -

	# add docker gpg key
	apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D

	# add the git-core ppa gpg key
	apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys E1DD270288B4E6030699E45FA1715D88E1DF1F24

	# add the neovim ppa gpg key
	apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 9DBB0BE9366964F134855E2255F96FCF8231B6DD

	# add the yubico ppa gpg key
	apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 3653E21064B19D134466702E43D5C49532CBA1A9

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
		automake \
		bash-completion \
		bc \
		bridge-utils \
		bzip2 \
		ca-certificates \
		cgroupfs-mount \
		coreutils \
		curl \
		dnsutils \
		file \
		findutils \
		gcc \
		git \
		gnupg \
		gnupg2 \
		gnupg-agent \
		google-cloud-sdk \
		grep \
		gzip \
		hostname \
		indent \
		iptables \
		jq \
		less \
		libapparmor-dev \
		libc6-dev \
		libltdl-dev \
		libseccomp-dev \
		locales \
		lsof \
		make \
		mount \
		net-tools \
		network-manager \
		openvpn \
		pinentry-curses \
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
		echo -e "${USERNAME} ALL=NOPASSWD: /sbin/ifconfig, /sbin/ifup, /sbin/ifdown, /sbin/ifquery"; \
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


	curl -sSL https://get.docker.com/builds/Linux/x86_64/docker-latest.tgz | tar -xvz \
		-C /usr/local/bin --strip-components 1
	chmod +x /usr/local/bin/docker*

	curl -sSL https://raw.githubusercontent.com/jessfraz/dotfiles/master/etc/systemd/system/docker.service > /etc/systemd/system/docker.service
	curl -sSL https://raw.githubusercontent.com/jessfraz/dotfiles/master/etc/systemd/system/docker.socket > /etc/systemd/system/docker.socket

	systemctl daemon-reload
	systemctl enable docker

	# update grub with docker configs and power-saving items
	sed -i.bak 's/GRUB_CMDLINE_LINUX=""/GRUB_CMDLINE_LINUX="cgroup_enable=memory swapaccount=1 pcie_aspm=force apparmor=1 security=apparmor"/g' /etc/default/grub
	echo "Docker has been installed. If you want memory management & swap"
	echo "run update-grub & reboot"
}

# install/update golang from source
install_golang() {
	export GO_VERSION=1.8.1
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

	# subshell
	(
	curl -sSL "https://storage.googleapis.com/golang/go${GO_VERSION}.linux-amd64.tar.gz" | sudo tar -v -C /usr/local -xz
	local user="$USER"
	# rebuild stdlib for faster builds
	sudo chown -R "${user}" /usr/local/go/pkg
	CGO_ENABLED=0 go install -a -installsuffix cgo std
	)

	# get commandline tools
	(
	set -x
	set +e
	go get github.com/golang/lint/golint
	go get golang.org/x/tools/cmd/cover
	go get golang.org/x/review/git-codereview
	go get golang.org/x/tools/cmd/goimports
	go get golang.org/x/tools/cmd/gorename
	go get golang.org/x/tools/cmd/guru

	go get github.com/jessfraz/apk-file
	go get github.com/jessfraz/audit
	go get github.com/jessfraz/bane
	go get github.com/jessfraz/battery
	go get github.com/jessfraz/certok
	go get github.com/jessfraz/cliaoke
	go get github.com/jessfraz/ghb0t
	go get github.com/jessfraz/magneto
	go get github.com/jessfraz/netns
	go get github.com/jessfraz/netscan
	go get github.com/jessfraz/onion
	go get github.com/jessfraz/pastebinit
	go get github.com/jessfraz/pepper
	go get github.com/jessfraz/pony
	go get github.com/jessfraz/reg
	go get github.com/jessfraz/riddler
	go get github.com/jessfraz/udict
	go get github.com/jessfraz/weather

	go get github.com/axw/gocov/gocov
	go get github.com/brianredbeard/gpget
	go get github.com/crosbymichael/gistit
	go get github.com/crosbymichael/ip-addr
	go get github.com/davecheney/httpstat
	go get github.com/google/gops
	go get github.com/jstemmer/gotags
	go get github.com/nsf/gocode
	go get github.com/rogpeppe/godef
	go get github.com/shurcooL/markdownfmt
	go get github.com/Soulou/curl-unix-socket

	aliases=( cloudflare/cfssl docker/docker golang/dep letsencrypt/boulder opencontainers/runc jessfraz/binctr jessfraz/contained.af )
	for project in "${aliases[@]}"; do
		owner=$(dirname "$project")
		repo=$(basename "$project")
		if [[ -d "${HOME}/${repo}" ]]; then
			rm -rf "${HOME:?}/${repo}"
		fi

		mkdir -p "${GOPATH}/src/github.com/${owner}"

		if [[ ! -d "${GOPATH}/src/github.com/${project}" ]]; then
			(
			# clone the repo
			cd "${GOPATH}/src/github.com/${owner}"
			git clone "https://github.com/${project}.git"
			# fix the remote path, since our gitconfig will make it git@
			cd "${GOPATH}/src/github.com/${project}"
			git remote set-url origin "https://github.com/${project}.git"
			)
		else
			echo "found ${project} already in gopath"
		fi

		# make sure we create the right git remotes
		if [[ "$owner" != "jessfraz" ]]; then
			(
			cd "${GOPATH}/src/github.com/${project}"
			git remote set-url --push origin no_push
			git remote add jessfraz "https://github.com/jessfraz/${repo}.git"
			)
		fi
	done

	# do special things for k8s GOPATH
	mkdir -p "${GOPATH}/src/k8s.io"
	kubes_repos=( community kubernetes release test-infra )
	for krepo in "${kubes_repos[@]}"; do
		git clone "https://github.com/kubernetes/${krepo}.git" "${GOPATH}/src/k8s.io/${krepo}"
		cd "${GOPATH}/src/k8s.io/${krepo}"
		git remote set-url --push origin no_push
		git remote add jessfraz "https://github.com/jessfraz/${krepo}.git"
	done
	)
}

# install graphics drivers
install_graphics() {
	local system=$1

	if [[ -z "$system" ]]; then
		echo "You need to specify whether it's dell, mac or lenovo"
		exit 1
	fi

	local pkgs=( nvidia-kernel-dkms bumblebee-nvidia primus )

	if [[ $system == "mac" ]] || [[ $system == "dell" ]]; then
		pkgs=( xorg xserver-xorg xserver-xorg-video-intel )
	fi

	apt-get install -y "${pkgs[@]}" --no-install-recommends
}

# install custom scripts/binaries
install_scripts() {
	# install acsciinema
	curl -sSL https://asciinema.org/install | sh

	# install speedtest
	curl -sSL https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py  > /usr/local/bin/speedtest
	chmod +x /usr/local/bin/speedtest

	# install icdiff
	curl -sSL https://raw.githubusercontent.com/jeffkaufman/icdiff/master/icdiff > /usr/local/bin/icdiff
	curl -sSL https://raw.githubusercontent.com/jeffkaufman/icdiff/master/git-icdiff > /usr/local/bin/git-icdiff
	chmod +x /usr/local/bin/icdiff
	chmod +x /usr/local/bin/git-icdiff

	# install lolcat
	curl -sSL https://raw.githubusercontent.com/tehmaze/lolcat/master/lolcat > /usr/local/bin/lolcat
	chmod +x /usr/local/bin/lolcat


	local scripts=( go-md2man have light )

	for script in "${scripts[@]}"; do
		curl -sSL "https://misc.j3ss.co/binaries/$script" > "/usr/local/bin/${script}"
		chmod +x "/usr/local/bin/${script}"
	done
}

# install syncthing
install_syncthing() {
	# download syncthing binary
	if [[ ! -f /usr/local/bin/syncthing ]]; then
		curl -sSL https://misc.j3ss.co/binaries/syncthing > /usr/local/bin/syncthing
		chmod +x /usr/local/bin/syncthing
	fi

	syncthing -upgrade

	curl -sSL https://raw.githubusercontent.com/jessfraz/dotfiles/master/etc/systemd/system/syncthing@.service > /etc/systemd/system/syncthing@.service

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
	local pkgs=( feh i3 i3lock i3status neovim scrot slim suckless-tools )

	apt-get install -y "${pkgs[@]}" --no-install-recommends

	# update clickpad settings
	mkdir -p /etc/X11/xorg.conf.d/
	curl -sSL https://raw.githubusercontent.com/jessfraz/dotfiles/master/etc/X11/xorg.conf.d/50-synaptics-clickpad.conf > /etc/X11/xorg.conf.d/50-synaptics-clickpad.conf

	# add xorg conf
	curl -sSL https://raw.githubusercontent.com/jessfraz/dotfiles/master/etc/X11/xorg.conf > /etc/X11/xorg.conf

	# get correct sound cards on boot
	curl -sSL https://raw.githubusercontent.com/jessfraz/dotfiles/master/etc/modprobe.d/intel.conf > /etc/modprobe.d/intel.conf

	# pretty fonts
	curl -sSL https://raw.githubusercontent.com/jessfraz/dotfiles/master/etc/fonts/local.conf > /etc/fonts/local.conf

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
	cd "$HOME"

	# install dotfiles from repo
	git clone git@github.com:jessfraz/dotfiles.git "${HOME}/dotfiles"
	cd "${HOME}/dotfiles"

	# installs all the things
	make

	# enable dbus for the user session
	# systemctl --user enable dbus.socket

	sudo systemctl enable "i3lock@${USERNAME}"
	sudo systemctl enable suspend-sedation.service

	cd "$HOME"
	mkdir -p ~/Pictures
	mkdir -p ~/Torrents
	)

	install_vim;
}

install_vim() {
	# create subshell
	(
	cd "$HOME"

	# install .vim files
	git clone --recursive git@github.com:jessfraz/.vim.git "${HOME}/.vim"
	ln -snf "${HOME}/.vim/vimrc" "${HOME}/.vimrc"
	sudo ln -snf "${HOME}/.vim" /root/.vim
	sudo ln -snf "${HOME}/.vimrc" /root/.vimrc

	# alias vim dotfiles to neovim
	mkdir -p "${XDG_CONFIG_HOME:=$HOME/.config}"
	ln -snf "${HOME}/.vim" "${XDG_CONFIG_HOME}/nvim"
	ln -snf "${HOME}/.vimrc" "${XDG_CONFIG_HOME}/nvim/init.vim"
	# do the same for root
	sudo mkdir -p /root/.config
	sudo ln -snf "${HOME}/.vim" /root/.config/nvim
	sudo ln -snf "${HOME}/.vimrc" /root/.config/nvim/init.vim

	# update alternatives to neovim
	sudo update-alternatives --install /usr/bin/vi vi "$(which nvim)" 60
	sudo update-alternatives --config vi
	sudo update-alternatives --install /usr/bin/vim vim "$(which nvim)" 60
	sudo update-alternatives --config vim
	sudo update-alternatives --install /usr/bin/editor editor "$(which nvim)" 60
	sudo update-alternatives --config editor

	# install things needed for deoplete for vim
	sudo apt-get update

	sudo apt-get install -y \
		python3-pip \
		--no-install-recommends

	pip3 install -U \
		setuptools \
		wheel \
		neovim
	)
}

install_virtualbox() {
	# check if we need to install libvpx1
	PKG_OK=$(dpkg-query -W --showformat='${Status}\n' libvpx1 | grep "install ok installed")
	echo "Checking for libvpx1: $PKG_OK"
	if [ "" == "$PKG_OK" ]; then
		echo "No libvpx1. Installing libvpx1."
		jessie_sources=/etc/apt/sources.list.d/jessie.list
		echo "deb http://httpredir.debian.org/debian jessie main contrib non-free" > "$jessie_sources"

		apt-get update
		apt-get install -y -t jessie libvpx1 \
			--no-install-recommends

		# cleanup the file that we used to install things from jessie
		rm "$jessie_sources"
	fi

	echo "deb http://download.virtualbox.org/virtualbox/debian vivid contrib" >> /etc/apt/sources.list.d/virtualbox.list

	curl -sSL https://www.virtualbox.org/download/oracle_vbox.asc | apt-key add -

	apt-get update
	apt-get install -y \
		virtualbox-5.0
	--no-install-recommends
}

install_vagrant() {
	VAGRANT_VERSION=1.8.1

	# if we are passing the version
	if [[ ! -z "$1" ]]; then
		export VAGRANT_VERSION=$1
	fi

	# check if we need to install virtualbox
	PKG_OK=$(dpkg-query -W --showformat='${Status}\n' virtualbox | grep "install ok installed")
	echo "Checking for virtualbox: $PKG_OK"
	if [ "" == "$PKG_OK" ]; then
		echo "No virtualbox. Installing virtualbox."
		install_virtualbox
	fi

	tmpdir=$(mktemp -d)
	(
	cd "$tmpdir"
	curl -sSL -o vagrant.deb "https://releases.hashicorp.com/vagrant/${VAGRANT_VERSION}/vagrant_${VAGRANT_VERSION}_x86_64.deb"
	dpkg -i vagrant.deb
	)

	rm -rf "$tmpdir"

	# install plugins
	vagrant plugin install vagrant-vbguest
}


usage() {
	echo -e "install.sh\n\tThis script installs my basic setup for a debian laptop\n"
	echo "Usage:"
	echo "  sources                     - setup sources & install base pkgs"
	echo "  wifi {broadcom,intel}       - install wifi drivers"
	echo "  graphics {dell,mac,lenovo}  - install graphics drivers"
	echo "  wm                          - install window manager/desktop pkgs"
	echo "  dotfiles                    - get dotfiles"
	echo "  vim                         - install vim specific dotfiles"
	echo "  golang                      - install golang and packages"
	echo "  scripts                     - install scripts"
	echo "  syncthing                   - install syncthing"
	echo "  vagrant                     - install vagrant and virtualbox"
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
	elif [[ $cmd == "vim" ]]; then
		install_vim
	elif [[ $cmd == "golang" ]]; then
		install_golang "$2"
	elif [[ $cmd == "scripts" ]]; then
		install_scripts
	elif [[ $cmd == "syncthing" ]]; then
		install_syncthing
	elif [[ $cmd == "vagrant" ]]; then
		install_vagrant "$2"
	else
		usage
	fi
}

main "$@"
