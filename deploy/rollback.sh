#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR="${APP_DIR:-/opt/hedmayner}"
readonly DOMAIN_NAME="${1:-}"
readonly PREVIOUS_TAG_FILE="${APP_DIR}/.previous-image-tag"

if [[ ! -f "${PREVIOUS_TAG_FILE}" ]]; then
  echo "No previous image tag is available for rollback" >&2
  exit 1
fi

previous_tag="$(tr -d '[:space:]' <"${PREVIOUS_TAG_FILE}")"
if [[ ! "${previous_tag}" =~ ^sha-[0-9a-f]{7,40}$ ]]; then
  echo "Stored previous image tag is invalid" >&2
  exit 1
fi

exec "${APP_DIR}/deploy.sh" "${previous_tag}" "${DOMAIN_NAME}"
