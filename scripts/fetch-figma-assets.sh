#!/usr/bin/env bash
# Downloads the Figma-exported images/icons listed in figma-assets.txt into ../assets.
# Figma MCP asset URLs are temporary (about 7 days); regenerate the manifest from Figma if they expire.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
dest="$here/../assets"
mkdir -p "$dest"

failed=0
while read -r name id; do
  [ -z "$name" ] && continue
  if curl -fsSL -o "$dest/$name" "https://www.figma.com/api/mcp/asset/$id"; then
    echo "ok   $name"
  else
    echo "FAIL $name" >&2
    failed=1
  fi
done < "$here/figma-assets.txt"

exit "$failed"
