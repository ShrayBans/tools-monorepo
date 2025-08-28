#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting production deployment for Cloudflare Workers..."

# Check if bundle analyzer script exists
if [ ! -f "scripts/bundle-analyzer.js" ]; then
    echo "⚠️  Bundle analyzer not found, skipping bundle size check"
    SKIP_BUNDLE_CHECK=true
else
    SKIP_BUNDLE_CHECK=false
fi

# Run bundle size analysis (unless skipped)
if [ "$SKIP_BUNDLE_CHECK" = false ]; then
    echo "🔍 Analyzing bundle size before deployment..."
    if ! node scripts/bundle-analyzer.js; then
        echo "❌ Bundle analysis failed or found critical issues"
        echo "   Fix the issues above or use 'npm run deploy:force' to skip checks"
        exit 1
    fi
    echo "✅ Bundle analysis passed"
fi

# Path to development variables file
DEV_VARS=".dev.vars"

if [ ! -f "$DEV_VARS" ]; then
    echo "Error: $DEV_VARS not found"
    exit 1
fi

# Optional: export variables into the environment (not strictly needed for secret put)
set -o allexport
# shellcheck disable=SC1091
source "$DEV_VARS"
set +o allexport

echo "📤 Uploading secrets to Cloudflare Workers environment 'production'..."
while IFS='' read -r line; do
    # Skip empty or comment lines
    [[ -z "$line" || "${line:0:1}" == "#" ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    printf 'Uploading secret %s…\n' "$key"
    # Pipe the value into Wrangler secret put
    printf '%s' "$value" | npx wrangler secret put "$key" --env production
done < "$DEV_VARS"

echo "🚀 Deploying to Cloudflare Workers production..."
npx wrangler deploy --env production

echo "✅ Production deployment completed successfully!"
