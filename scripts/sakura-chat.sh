#!/bin/bash
# sakura-chat.sh - Sakura AI Engine chat completion wrapper
# Usage: ./sakura-chat.sh [model] "prompt"
# Models: kimi, coder, coder-light, gpt-oss, llm-jp, whisper
set -euo pipefail

SAKURA_API_URL="${SAKURA_API_URL:-https://api.ai.sakura.ad.jp/v1}"

if [ -z "${SAKURA_API_KEY:-}" ]; then
  echo "ERROR: SAKURA_API_KEY not set" >&2
  exit 1
fi

MODEL_ALIAS="${1:-gpt-oss}"
PROMPT="${2:-}"

if [ -z "$PROMPT" ]; then
  PROMPT="$MODEL_ALIAS"
  MODEL_ALIAS="gpt-oss"
fi

case "$MODEL_ALIAS" in
  kimi)       MODEL="preview/Kimi-K2.6" ;;
  coder)      MODEL="Qwen3-Coder-480B-A35B-Instruct-FP8" ;;
  coder-light) MODEL="Qwen3-Coder-30B-A3B-Instruct" ;;
  gpt-oss)    MODEL="gpt-oss-120b" ;;
  llm-jp)     MODEL="llm-jp-3.1-8x13b-instruct4" ;;
  *)          MODEL="$MODEL_ALIAS" ;;
esac

SYSTEM="${SAKURA_SYSTEM_PROMPT:-You are a helpful assistant.}"

curl -s -X POST "${SAKURA_API_URL}/chat/completions" \
  -H "Authorization: Bearer ${SAKURA_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg model "$MODEL" \
    --arg system "$SYSTEM" \
    --arg prompt "$PROMPT" \
    '{
      model: $model,
      messages: [
        { role: "system", content: $system },
        { role: "user", content: $prompt }
      ],
      temperature: 0.3
    }')" | jq -r '.choices[0].message.content // .error.message // "ERROR: No response"'
