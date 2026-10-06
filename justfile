# Studio standard interface: up / dev / check / test.
# Recipe names are identical in every repo; bodies delegate to this repo's
# native scripts.

default:
    @just --list

up:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ "$(curl -k -s -o /dev/null -w '%{http_code}' -m 3 https://localhost:4200/)" = "000" ]; then
      echo "starting portless proxy..."
      pnpm exec portless proxy start -p 4200 --tld lvh.me
    else
      echo "proxy already up on :4200"
    fi
    echo "earth: https://earth.lvh.me:4200"

dev:
    pnpm dev

check:
    pnpm typecheck

test:
    pnpm test
