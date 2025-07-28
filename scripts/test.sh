#!/bin/sh
set -e
export PATH=$PWD/node_modules/.bin:$PATH
set -x
tsc
tsc --project src
