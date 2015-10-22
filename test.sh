#!/bin/bash
set -e

(
# find all executables and run `shellcheck`
for f in $(find . -type f -executable); do
	shellcheck $f && echo -e "---\nSucessfully linted $f\n---"
done
) || true
