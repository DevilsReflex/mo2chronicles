#!/usr/bin/env bash
# Build a clean dist/ of just the public site, then publish it to Cloudflare Pages.
#
# Deploy dist/ — never the repo root. `wrangler pages deploy .` uploads every
# tracked file, which puts README.md, .gitignore and .claude/ on the live site.
set -euo pipefail

cd "$(dirname "$0")"

PUBLIC_FILES=(index.html favicon.svg favicon.ico robots.txt sitemap.xml site.webmanifest)
PUBLIC_DIRS=(css js assets)

rm -rf dist
mkdir -p dist
cp "${PUBLIC_FILES[@]}" dist/
cp -r "${PUBLIC_DIRS[@]}" dist/

echo "dist/ built with $(find dist -type f | wc -l) files:"
find dist -type f | sort | sed 's/^/  /'

if [[ "${1:-}" == "--dry-run" ]]; then
  echo "dry run — not deploying"
  exit 0
fi

npx wrangler pages deploy dist --project-name=mo2chronicles --commit-dirty=true

cat <<'EOF'

Deployed. All three domains serve this same project:
  https://mo2chronicles.pages.dev
  https://mo2chronicles.com
  https://www.mo2chronicles.com

Note: unmatched paths return the index page with HTTP 200 (Pages' catch-all),
so a 200 on /README.md does not mean the file is published — check the
Content-Type, or that the body isn't index.html, before concluding it leaked.
EOF
