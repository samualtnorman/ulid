#!/bin/sh
set -ex
rm -rf dist
./rolldown.config.js
scripts/emit-dts.sh
scripts/emit-package-json.js
cp LICENSE readme.md dist
