.PHONY: all default install

default: install

all: install

install: 
	for file in $(shell find $(CURDIR) -name ".*" -not -name ".gitignore" -not -name ".git"); do \
		f=$$(basename $$file); \
		echo "Creating symlink for $$file to $(HOME)/$$f"; \
    	ln -sfn $$file $(HOME)/$$f; \
	done
	
	for file in $(shell find $(CURDIR)/bin -type f -not -name "*-backlight"); do \
		f=$$(basename $$file); \
		echo "Creating symlink for $$file to /usr/local/bin/$$f"; \
    	sudo ln -sf $$file /usr/local/bin/$$f; \
	done
