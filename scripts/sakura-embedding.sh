#!/bin/bash
# sakura-embedding.sh - Sakura AI Engine embedding generation
# Usage: ./sakura-embedding.sh "text to embed"
set -euo pipefail

SAKURA_API_URL="${SAKURA_API_URL:-https://api.ai.sakura.ad.jp/v1}"

if [ -z "${SAKURA_API_KEY:-}" ]; then
  echo "ERROR: SAKURA_API_KEY not set" >&2
  exit 1
fi

TEXT="${1:-}"
if [ -z "$TEXT" ]; then
  echo "ERROR: No text provided" >&2
  exit 1
fi

curl -s -X POST "${SAKURA_API_URL}/embeddings" \
  -H "Authorization: Bearer ${SAKURA_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg text "$TEXT" \
    '{
      model: "multilingual-e5-large",
      input: $text
    }')" | jq '.data[0].embedding // .error.message // "ERROR: No response"'
