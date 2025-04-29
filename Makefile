SHELL := /bin/bash

.PHONY: clean build deploy

clean:
	@printf '\033[43m\033[37m → removing public folder \033[0m\n'
	rm -rf ./public

build: clean
	@printf '\033[43m\033[37m → building hugo page \033[0m\n'
	hugo --gc --ignoreCache

convert: build
	@printf '\033[43m\033[37m → converting SVGs to PNGs in public/... \033[0m\n'
	@for svg in ./public/og-image-svg*.svg; do \
		if [[ -f "$$svg" ]]; then \
			png="$${svg%.svg}.png"; \
			printf '\033[43m\033[37m    • $$svg → $$png \033[0m\n'; \
			if rsvg-convert -a -w 1200 -h 630 "$$svg" -o "$$png" \
				 && optipng -o2 "$$png" >/dev/null; then \
				printf '\033[43m\033[37m    ✔ conversion succeeded, deleting $$svg \033[0m\n'; \
				rm "$$svg"; \
			else \
				printf '\033[43m\033[37m    ✗ conversion failed for $$svg \033[0m\n' >&2; \
			fi \
		fi \
	done

deploy: build
	@printf '\033[43m\033[37m → sync with server \033[0m\n'
	rsync -avzhe ssh --progress ./public/* deploy@dominik-wilkowski.com:/var/www/html/dominikwilkowski/
