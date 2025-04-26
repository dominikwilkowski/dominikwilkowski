SHELL := /bin/bash

.PHONY: clean build deploy

clean:
	rm -rf ./public

build: clean
	hugo

deploy: build
	rsync -avzhe ssh --progress ./public/* deploy@dominik-wilkowski.com:/var/www/html/dominikwilkowski/
