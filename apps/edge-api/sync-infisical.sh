#!/bin/bash

# Sync environment variables from Infisical to .dev.vars
# Usage: ./sync-infisical.sh [environment]

ENV=${1:-local}

echo "Syncing secrets from Infisical for environment: $ENV"

# Pull secrets from Infisical
infisical export  --env=$ENV > .dev.vars.tmp

# Add header to the file
cat > .dev.vars << EOF
# Local development environment variables for Cloudflare Workers
# DO NOT commit this file to git - add to .gitignore
# Generated from Infisical on $(date)

EOF

# Append the secrets
cat .dev.vars.tmp >> .dev.vars

# Clean up
rm .dev.vars.tmp

echo "✅ Secrets synced to .dev.vars"