.PHONY: all default install

default: install

all: install

install: 
	# add aliases for dotfiles
	for file in $(shell find $(CURDIR) -name ".*" -not -name ".gitignore" -not -name ".git"); do \
		f=$$(basename $$file); \
		echo "Creating symlink for $$file to $(HOME)/$$f"; \
    	ln -sfn $$file $(HOME)/$$f; \
	done
	# add aliases for things in bin	
	for file in $(shell find $(CURDIR)/bin -type f -not -name "*-backlight"); do \
		f=$$(basename $$file); \
		echo "Creating symlink for $$file to /usr/local/bin/$$f"; \
    	sudo ln -sf $$file /usr/local/bin/$$f; \
	done
	# add aliases for init scripts
	for file in $(shell find $(CURDIR)/init -type f); do \
		f=$$(basename $$file); \
		echo "Creating symlink for $$file to /lib/systemd/system/$$f"; \
    	sudo ln -sf $$file /lib/systemd/system/$$f; \
	done
