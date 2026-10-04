#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
distribution_root="$(realpath "${1:?Supply the directory containing the wheel and source archive}")"
consumer_root="$(mktemp -d "${TMPDIR:-/tmp}/rake-python-consumers.XXXXXX")"
trap 'rm -rf "$consumer_root"' EXIT

archives=("$distribution_root"/*.whl "$distribution_root"/*.tar.gz)
for archive in "${archives[@]}"; do
  test -f "$archive"
  consumer="$(mktemp -d "$consumer_root/consumer.XXXXXX")"
  python -m venv "$consumer/venv"
  "$consumer/venv/bin/python" -m pip install --no-cache-dir "${archive}[core]"
  cd "$consumer"
  "$consumer/venv/bin/python" -m unittest discover -s "$project_root/bindings/python/tests"
  "$consumer/venv/bin/python" -m pip install --no-cache-dir 'tree-sitter==0.25.2'
  "$consumer/venv/bin/python" -m unittest discover -s "$project_root/bindings/python/tests"
done
