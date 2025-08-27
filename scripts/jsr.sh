#!/usr/bin/env bash
set -ex
rm dist --recursive --force
mkdir dist --parents
JSR=1 ./rolldown.config.js
scripts/emit-dts.sh
cp LICENSE dist
scripts/prepend-readme.js src/readme.md dist/default.d.ts
scripts/emit-jsr-json.ts
