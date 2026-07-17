# Production deployment

This repository builds a static Vite site into a Caddy image and publishes it to
`ghcr.io/lxdll/hedmayner`. Pushes to `main` are verified and published. Deployment
starts automatically after the `DOMAIN` repository variable is configured. The
container joins the existing `luxudong_edge` Docker network; the shared Caddy
container terminates TLS and proxies requests to `hedmayner-web:8080`.

## 1. Prepare GitHub

The repository and its container package are public. Keep all deployment
credentials in **Settings → Secrets and variables → Actions** and create these
production secrets:

- `DEPLOY_HOST`: the ECS public IPv4 address
- `DEPLOY_PORT`: the SSH port, normally `22`
- `DEPLOY_USER`: the dedicated user, normally `deploy`
- `DEPLOY_SSH_KEY`: its dedicated Ed25519 private key
- `DEPLOY_KNOWN_HOSTS`: the complete output of `ssh-keyscan -H <server-ip>` verified
  against the ECS host key

Create the repository variable `DOMAIN` with the apex public hostname, without a
scheme or path. The `www` hostname is redirected permanently to this canonical
hostname. Optionally set `TARGET_PLATFORM` to `linux/arm64`; it defaults to
`linux/amd64`.

Do not set `DOMAIN` until the server bootstrap, DNS, and registry login below are
complete. Without it, Actions still verifies and publishes the image but skips the
deployment job.

## 2. Prepare the ECS server

The existing edge proxy owns public TCP 80 and 443 and UDP 443. Do not publish
ports from the Hedmayner container. Make SSH reachable by GitHub-hosted runners,
but disable SSH password and root login and install a rate limiter such as
Fail2ban.

Create a dedicated Ed25519 key pair for Actions. Copy `deploy/bootstrap-server.sh`
to the server and run it as root:

```sh
DEPLOY_PUBLIC_KEY='ssh-ed25519 AAAA...' bash bootstrap-server.sh
```

This creates the `deploy` user and `/opt/hedmayner`. Membership in the Docker group
is effectively root-level access, so never reuse this key.

Confirm that the deployment user can pull the public image without credentials:

```sh
docker pull ghcr.io/lxdll/hedmayner:latest
```

If the package is made private later, create a dedicated GitHub personal access
token with only `read:packages` and authenticate this deployment user to GHCR.

Confirm that the external Docker network `luxudong_edge` exists. The shared edge
Caddy configuration must proxy `hedmayner.cn` to `hedmayner-web:8080` and redirect
`www.hedmayner.cn` to the apex hostname. Confirm the host architecture with
`uname -m`: use the default `linux/amd64` for `x86_64`, or set the GitHub variable
`TARGET_PLATFORM=linux/arm64` for `aarch64`.

## 3. DNS and first release

Add an A record for the apex `DOMAIN` pointing to the ECS public IPv4 address and
a `www` CNAME pointing to the apex hostname. Confirm that ports 80 and 443 are not
occupied by another service. Once both names resolve globally, set the GitHub
`DOMAIN` variable and run **Verify, publish, and deploy** manually, or push a new
commit to `main`.

The shared edge Caddy obtains and renews the TLS certificate automatically. Its
existing certificate volume survives replacement of the Hedmayner container.

## Rollback and operations

Every release is tagged `sha-<git-commit>`. The deployment script restores the
previous tag automatically if the new container does not become healthy. To roll
back manually, run the workflow from the Actions page and provide an existing
`sha-...` tag in the `image_tag` input.

Useful server checks:

```sh
cd /opt/hedmayner
docker compose ps
docker compose logs --tail=100 hedmayner
cat .previous-image-tag
```

Before public launch, confirm that you have permission to publish the WWD-sourced
collection images included in `public/media/collections`.
