.PHONY: all bin default dotfiles etc init install

all: bin dotfiles etc init

default: install

install: all 

bin:
	# add aliases for things in bin	
	for file in $(shell find $(CURDIR)/bin -type f -not -name "*-backlight"); do \
		f=$$(basename $$file); \
		sudo ln -sf $$file /usr/local/bin/$$f; \
	done

dotfiles:
	# add aliases for dotfiles
	for file in $(shell find $(CURDIR) -name ".*" -not -name ".gitignore" -not -name ".git" -not -name ".*.swp"); do \
		f=$$(basename $$file); \
		ln -sfn $$file $(HOME)/$$f; \
	done

etc:
	for file in $(shell find $(CURDIR)/etc -type f); do \
		f=$$(echo $$file | sed -e 's|$(CURDIR)||'); \
		sudo install -p -m 644 $$file $$f; \
	done
	systemctl --user daemon-reload

init:
	# install init scripts
	# of course systemd hates aliases or some bullshit
	for file in $(shell find $(CURDIR)/init -type f); do \
		f=$$(basename $$file); \
		sudo install -p -m 644 $$file /lib/systemd/system/$$f; \
	done
	sudo systemctl daemon-reload
