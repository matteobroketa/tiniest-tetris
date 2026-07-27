#!/usr/bin/env bash
set -euo pipefail

version=${1:?usage: fetch_cpython.sh VERSION}
root=$(cd "$(dirname "$0")/.." && pwd)
dest="$root/docker/dist"
mkdir -p "$dest"

case "$version" in
  1.6)
    archive=Python-1.6.tar.gz
    url=https://www.python.org/ftp/python/src/$archive
    algorithm=md5
    checksum=9d72ef93d7698769d9d3be7c17d5ad92
    size=4114315
    ;;
  2.7.18)
    archive=Python-2.7.18.tar.xz
    url=https://www.python.org/ftp/python/2.7.18/$archive
    algorithm=sha256
    checksum=b62c0e7937551d0cc02b8fd5cb0f544f9405bafc9a54d3808ed4594812edef43
    size=12854736
    ;;
  *)
    echo "unsupported CPython version: $version" >&2
    exit 2
    ;;
esac

path="$dest/$archive"
if [[ ! -f "$path" ]]; then
  curl --fail --location --retry 5 --retry-all-errors --output "$path" "$url"
fi
actual_size=$(wc -c < "$path")
[[ "$actual_size" == "$size" ]] || { echo "size mismatch: $actual_size != $size" >&2; exit 1; }
case "$algorithm" in
  md5) printf '%s  %s\n' "$checksum" "$path" | md5sum --check --status ;;
  sha256) printf '%s  %s\n' "$checksum" "$path" | sha256sum --check --status ;;
esac
sha256sum "$path" >&2
printf '%s\n' "$archive"
