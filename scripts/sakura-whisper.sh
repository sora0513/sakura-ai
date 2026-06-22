#!/bin/bash
# sakura-whisper.sh - Sakura AI Engine Whisper transcription
# Usage: ./sakura-whisper.sh <audio_file>
set -euo pipefail

SAKURA_API_URL="${SAKURA_API_URL:-https://api.ai.sakura.ad.jp/v1}"

if [ -z "${SAKURA_API_KEY:-}" ]; then
  echo "ERROR: SAKURA_API_KEY not set" >&2
  exit 1
fi

AUDIO_FILE="${1:-}"
if [ -z "$AUDIO_FILE" ] || [ ! -f "$AUDIO_FILE" ]; then
  echo "ERROR: Audio file not found: $AUDIO_FILE" >&2
  exit 1
fi

curl -s -X POST "${SAKURA_API_URL}/audio/transcriptions" \
  -H "Authorization: Bearer ${SAKURA_API_KEY}" \
  -F "file=@${AUDIO_FILE}" \
  -F "model=whisper-large-v3-turbo" | jq -r '.text // .error.message // "ERROR: No response"'
