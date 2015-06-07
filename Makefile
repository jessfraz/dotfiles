.PHONY: all bin default dotfiles init install

all: dotfiles bin init

default: install

install: all 
	
dotfiles:
	# add aliases for dotfiles
	for file in $(shell find $(CURDIR) -name ".*" -not -name ".gitignore" -not -name ".git"); do \
		f=$$(basename $$file); \
		echo "Creating symlink for $$file to $(HOME)/$$f"; \
		ln -sfn $$file $(HOME)/$$f; \
	done

bin:
	# add aliases for things in bin	
	for file in $(shell find $(CURDIR)/bin -type f -not -name "*-backlight"); do \
		f=$$(basename $$file); \
		echo "Creating symlink for $$file to /usr/local/bin/$$f"; \
		sudo ln -sf $$file /usr/local/bin/$$f; \
	done

init:
	# install init scripts
	# of course systemd hates aliases or some bullshit
	for file in $(shell find $(CURDIR)/init -type f); do \
		f=$$(basename $$file); \
		echo "Installing $$file to /lib/systemd/system/$$f"; \
		sudo install -p -m 644 $$file /lib/systemd/system/$$f; \
	done
	sudo systemctl daemon-reload
