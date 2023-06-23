#!/usr/bin/env bash

rm *.pem
cat ../../.env | \
  grep HOST | \
  cut -d'=' -f2 | \
  xargs -I{} mkcert {}
