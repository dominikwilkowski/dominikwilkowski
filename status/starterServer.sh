#!/bin/sh

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
cd /var/www/html/dominikwilkowski/status/
forever start -l statusServer.log --append -o statusServerOut.log -e statusServerError.log server.js >> /var/www/html/dominikwilkowski/status/status-server.log 2>&1