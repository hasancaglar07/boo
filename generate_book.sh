#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./book-generator-env.sh
source "$ROOT_DIR/book-generator-env.sh"

# Backward-compatible entrypoint for older docs/tests.
exec "$ROOT_DIR/scripts/compile_book.sh" "$@"
