#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR="${APP_DIR:-/opt/hedmayner}"
readonly COMPOSE_FILE="${APP_DIR}/compose.yaml"
readonly ENV_FILE="${APP_DIR}/.env"
readonly LOCK_FILE="${APP_DIR}/deploy.lock"
readonly NEW_TAG="${1:-}"
readonly DOMAIN_NAME="${2:-}"

if [[ ! "${NEW_TAG}" =~ ^sha-[0-9a-f]{7,40}$ ]]; then
  echo "Invalid image tag: expected sha- followed by 7-40 lowercase hex characters" >&2
  exit 2
fi

if [[ ! "${DOMAIN_NAME}" =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$ ]] || [[ "${DOMAIN_NAME}" != *.* ]]; then
  echo "Invalid public domain name" >&2
  exit 2
fi

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Missing ${COMPOSE_FILE}" >&2
  exit 2
fi

exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  echo "Another deployment is already running" >&2
  exit 3
fi

current_tag=""
if [[ -f "${ENV_FILE}" ]]; then
  current_tag="$(sed -n 's/^IMAGE_TAG=//p' "${ENV_FILE}" | tail -n 1)"
fi

write_env() {
  local tag="$1"
  local temp_file
  temp_file="$(mktemp "${APP_DIR}/.env.XXXXXX")"
  printf 'DOMAIN=%s\nIMAGE_TAG=%s\n' "${DOMAIN_NAME}" "${tag}" >"${temp_file}"
  chmod 600 "${temp_file}"
  mv "${temp_file}" "${ENV_FILE}"
}

wait_until_healthy() {
  local attempt status
  for attempt in $(seq 1 36); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' hedmayner-web 2>/dev/null || true)"
    if [[ "${status}" == "healthy" ]]; then
      return 0
    fi
    if [[ "${status}" == "unhealthy" || "${status}" == "exited" || "${status}" == "dead" ]]; then
      return 1
    fi
    sleep 5
  done
  return 1
}

rollback() {
  if [[ "${current_tag}" =~ ^sha-[0-9a-f]{7,40}$ ]]; then
    echo "Deployment failed; rolling back to ${current_tag}" >&2
    write_env "${current_tag}"
    docker compose --project-directory "${APP_DIR}" --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" pull web
    docker compose --project-directory "${APP_DIR}" --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --remove-orphans
    if ! wait_until_healthy; then
      echo "Rollback also failed; manual intervention is required" >&2
    fi
  else
    echo "Deployment failed and no previous image tag is available" >&2
  fi
}

echo "Deploying ghcr.io/lxdll/hedmayner:${NEW_TAG}"
write_env "${NEW_TAG}"

if ! docker compose --project-directory "${APP_DIR}" --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" config --quiet; then
  rollback
  exit 1
fi

if ! docker compose --project-directory "${APP_DIR}" --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" pull web; then
  rollback
  exit 1
fi

if ! docker compose --project-directory "${APP_DIR}" --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --remove-orphans; then
  rollback
  exit 1
fi

if ! wait_until_healthy; then
  docker compose --project-directory "${APP_DIR}" --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" logs --tail=100 web >&2 || true
  rollback
  exit 1
fi

if [[ -n "${current_tag}" && "${current_tag}" != "${NEW_TAG}" ]]; then
  printf '%s\n' "${current_tag}" >"${APP_DIR}/.previous-image-tag"
fi

echo "Deployment completed successfully: ${NEW_TAG}"
