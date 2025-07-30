#!/usr/bin/env bash
set -ex
rm dist --recursive --force
mkdir dist --parents
cp src/*.ts LICENSE dist
scripts/prepend-readme.js src/readme.md dist/default.ts
scripts/emit-jsr-json.js
