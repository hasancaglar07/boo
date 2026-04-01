#!/bin/bash

# Source this file to make the local book-generator toolchain available.

BOOK_GENERATOR_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAMBA_ROOT_PREFIX="${MAMBA_ROOT_PREFIX:-$HOME/.local/share/micromamba}"
BOOK_GENERATOR_ENV_NAME="${BOOK_GENERATOR_ENV_NAME:-book-generator}"
BOOK_GENERATOR_ENV_PREFIX="${BOOK_GENERATOR_ENV_PREFIX:-$MAMBA_ROOT_PREFIX/envs/$BOOK_GENERATOR_ENV_NAME}"

for candidate in "$BOOK_GENERATOR_ROOT/.env.codefast.local" "$BOOK_GENERATOR_ROOT/.env.local"; do
    if [ -f "$candidate" ]; then
        set -a
        # shellcheck source=/dev/null
        . "$candidate"
        set +a
    fi
done

if [ ! -d "$BOOK_GENERATOR_ENV_PREFIX" ]; then
    echo "book-generator environment not found at $BOOK_GENERATOR_ENV_PREFIX" >&2
    return 1 2>/dev/null || exit 1
fi

export BOOK_GENERATOR_ROOT
export BOOK_GENERATOR_ENV_PREFIX
export PATH="$BOOK_GENERATOR_ENV_PREFIX/bin:$BOOK_GENERATOR_ROOT/scripts:$PATH"
