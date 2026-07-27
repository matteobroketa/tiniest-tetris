#!/usr/bin/env bash
set -euo pipefail

version=${1:?usage: build_legacy_image.sh VERSION}
root=$(cd "$(dirname "$0")/.." && pwd)
archive=$(bash "$root/tools/fetch_cpython.sh" "$version")
tag="tiniest-tetris-python:$version"
docker build \
  --file "$root/docker/legacy-python.Dockerfile" \
  --build-arg "PYTHON_VERSION=$version" \
  --build-arg "ARCHIVE=$archive" \
  --tag "$tag" \
  "$root" >&2
docker image inspect "$tag" --format 'image={{.Id}} created={{.Created}}' >&2
printf '%s\n' "$tag"
