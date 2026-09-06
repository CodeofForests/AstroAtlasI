#!/usr/bin/env bash
# Bundle the multi-file mvpI prototype into ONE self-contained HTML file.
# Purpose: a single file that can be published as a Claude Artifact (or dropped
# on any static host) to get a shareable link for user testing. Every tester
# gets their own browser-local storage — no backend, nothing shared.
#
# Usage:  bash mvpI/build-preview.sh  [output-path]
# Default output: mvpI/preview.html
#
# The output has NO <!doctype>/<html>/<head>/<body> wrapper on purpose — the
# Claude Artifact publisher adds that skeleton. To host it elsewhere, wrap it.

set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
out="${1:-$here/preview.html}"

# Script load order — must match index.html.
scripts=(
  "vendor/astronomy.browser.js"
  "js/tz.js"
  "js/places.js"
  "js/astro-engine.js"
  "js/chart.js"
  "js/chart-wheel.js"
  "js/content.js"
  "js/storage.js"
  "js/ui.js"
  "data.js"
  "app.js"
)

{
  echo '<title>AstroAtlasI Prototype</title>'
  echo '<style>'
  cat "$here/styles.css"
  echo '</style>'
  echo

  # Body markup from index.html: everything between <body> and the first
  # <script>, with the stylesheet <link> removed (CSS is inlined above).
  sed -n '/<body>/,/<script /p' "$here/index.html" \
    | sed '1d;$d' \
    | grep -v '<link rel="stylesheet"'
  echo

  for f in "${scripts[@]}"; do
    echo "<script>"
    echo "/* ==== $f ==== */"
    cat "$here/$f"
    echo
    echo "</script>"
  done
} > "$out"

bytes=$(wc -c < "$out")
echo "wrote $out ($bytes bytes)"
