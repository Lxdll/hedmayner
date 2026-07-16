# Production deployment

This repository builds a static Vite site into a Caddy image and publishes it to
`ghcr.io/lxdll/hedmayner`. Pushes to `main` are verified and published. Deployment
starts automatically after the `DOMAIN` repository variable is configured.

## 1. Prepare GitHub

Keep the repository and its container package private. In **Settings → Secrets and
variables → Actions**, create these production secrets:

- `DEPLOY_HOST`: the ECS public IPv4 address
- `DEPLOY_PORT`: the SSH port, normally `22`
- `DEPLOY_USER`: the dedicated user, normally `deploy`
- `DEPLOY_SSH_KEY`: its dedicated Ed25519 private key
- `DEPLOY_KNOWN_HOSTS`: the complete output of `ssh-keyscan -H <server-ip>` verified
  against the ECS host key

Create the repository variable `DOMAIN` with the public hostname, without a scheme
or path. Optionally set `TARGET_PLATFORM` to `linux/arm64`; it defaults to
`linux/amd64`.

Do not set `DOMAIN` until the server bootstrap, DNS, and registry login below are
complete. Without it, Actions still verifies and publishes the image but skips the
deployment job.

## 2. Prepare the ECS server

In the Alibaba Cloud security group and the host firewall, expose TCP 80 and 443
and UDP 443 publicly. Make SSH reachable by GitHub-hosted runners, but disable SSH
password and root login and install a rate limiter such as Fail2ban.

Create a dedicated Ed25519 key pair for Actions. Copy `deploy/bootstrap-server.sh`
to the server and run it as root:

```sh
DEPLOY_PUBLIC_KEY='ssh-ed25519 AAAA...' bash bootstrap-server.sh
```

This creates the `deploy` user and `/opt/hedmayner`. Membership in the Docker group
is effectively root-level access, so never reuse this key.

Create a GitHub personal access token (classic) with only `read:packages`, then log
the deployment user into GHCR once. Avoid placing the token directly in shell
history:

```sh
read -rsp 'GHCR token: ' CR_PAT
printf '%s' "$CR_PAT" | docker login ghcr.io -u Lxdll --password-stdin
unset CR_PAT
```

Confirm the host architecture with `uname -m`: use the default `linux/amd64` for
`x86_64`, or set the GitHub variable `TARGET_PLATFORM=linux/arm64` for `aarch64`.

## 3. DNS and first release

Add an A record for `DOMAIN` pointing to the ECS public IPv4 address. Confirm that
ports 80 and 443 are not occupied by another service. Once DNS resolves globally,
set the GitHub `DOMAIN` variable and run **Verify, publish, and deploy** manually,
or push a new commit to `main`.

Caddy obtains and renews the TLS certificate automatically. Certificate data is
stored in the named `caddy_data` volume and survives container replacement.

## Rollback and operations

Every release is tagged `sha-<git-commit>`. The deployment script restores the
previous tag automatically if the new container does not become healthy. To roll
back manually, run the workflow from the Actions page and provide an existing
`sha-...` tag in the `image_tag` input.

Useful server checks:

```sh
cd /opt/hedmayner
docker compose ps
docker compose logs --tail=100 web
cat .previous-image-tag
```

Before public launch, confirm that you have permission to publish the WWD-sourced
collection images included in `public/media/collections`.
