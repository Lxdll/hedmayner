#!/usr/bin/env bash
set -Eeuo pipefail

readonly DEPLOY_USER="${DEPLOY_USER:-deploy}"
readonly DEPLOY_PUBLIC_KEY="${DEPLOY_PUBLIC_KEY:-}"
readonly APP_DIR="/opt/hedmayner"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root on the ECS server" >&2
  exit 1
fi

if [[ -z "${DEPLOY_PUBLIC_KEY}" ]] || [[ "${DEPLOY_PUBLIC_KEY}" != ssh-* ]]; then
  echo "Set DEPLOY_PUBLIC_KEY to the dedicated GitHub Actions SSH public key" >&2
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed" >&2
  exit 2
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "The Docker Compose plugin is not installed" >&2
  exit 2
fi

if ! getent group docker >/dev/null; then
  groupadd docker
fi

if ! id "${DEPLOY_USER}" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "${DEPLOY_USER}"
fi

usermod --append --groups docker "${DEPLOY_USER}"
install -d -m 700 -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"
printf '%s\n' "${DEPLOY_PUBLIC_KEY}" >"/home/${DEPLOY_USER}/.ssh/authorized_keys"
chown "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh/authorized_keys"
chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"

install -d -m 750 -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" "${APP_DIR}"

echo "Server bootstrap complete for ${DEPLOY_USER}."
echo "Next: log in as this user, authenticate Docker to ghcr.io, and configure GitHub secrets."
