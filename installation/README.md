# Self-hosting 02_Bookmarks

This setup uses Podman, `podman-compose`, and an existing Caddy installation.
The application images are published to the GitHub Container Registry, so a
site only needs the Compose file and a data directory — no source checkout and
no build tooling. Caddy provides the public HTTPS endpoint and proxies both
services.

## Requirements

- A Linux server with a public IPv4 address.
- An x86_64 (`linux/amd64`) host; no ARM images are published.
- Podman and its Compose provider are installed.
- Caddy is installed and running on the host.
- A domain or subdomain points to the server with an `A` record.
- Ports `80` and `443` are open in the server and VPS firewall.
- Server snapshots or backups cover the PocketBase data directory.

## Images

Both images are built by `.github/workflows/publish.yml` for `linux/amd64` and
pushed to:

```text
ghcr.io/zawias-pro/02-bookmarks-frontend
ghcr.io/zawias-pro/02-bookmarks-pocketbase
```

Images are published only when a semantic version tag is pushed, for example
`1.2.3` (with no `v` prefix). Each image is tagged with exactly that version:

```text
ghcr.io/zawias-pro/02-bookmarks-frontend:1.2.3
ghcr.io/zawias-pro/02-bookmarks-pocketbase:1.2.3
```

There are no floating tags: no `latest`, no branch names, and no commit hashes.
Every deployment pins a release, and updating means choosing a new release tag.
Available versions are listed on the repository's Tags page.

PocketBase migrations are baked into the PocketBase image. The database itself
lives outside the containers in `BOOKMARKS_DATA_DIR`, so updating images never
touches application data.

If the packages are public, pulling needs no credentials. Otherwise, make the
packages public in the repository's package settings, or authenticate once with
a GitHub token that has the `read:packages` scope:

```sh
echo "$GITHUB_TOKEN" | sudo podman login ghcr.io -u <github-user> --password-stdin
```

## Install

Create the install directory and fetch the production Compose file:

```sh
sudo mkdir -p /srv/02-bookmarks/pb_data
cd /srv/02-bookmarks
sudo curl -fsSLO https://raw.githubusercontent.com/zawias-pro/02_Bookmarks/main/installation/compose.yml
```

Create `.env` with the image version and the host path that stores PocketBase
data:

```sh
sudo tee .env >/dev/null <<'EOF'
BOOKMARKS_VERSION=1.2.3
BOOKMARKS_DATA_DIR=/srv/02-bookmarks/pb_data
EOF
```

Replace `1.2.3` with the release tag to deploy. `BOOKMARKS_VERSION` is required:
without it, Compose stops with an error instead of guessing a version.

On `vps-02-ovh`, both services must join the existing `infra_proxy` network so
Caddy can reach them. Create the site-specific override:

```sh
sudo tee compose.override.yml >/dev/null <<'EOF'
networks:
  default:
    name: infra_proxy
    external: true
EOF
```

The project name is fixed to `02-bookmarks` in `compose.yml`, so container names
such as `02-bookmarks_pocketbase_1` do not depend on the directory name. The
commands below include `-f compose.override.yml`; omit it on hosts that do not
join `infra_proxy`.

Start the stack:

```sh
cd /srv/02-bookmarks
sudo podman-compose -f compose.yml -f compose.override.yml pull
sudo podman-compose -f compose.yml -f compose.override.yml up -d
```

Create the PocketBase administrator once. There are no default admin
credentials: choose the admin email and password when prompted. The password
is entered interactively and is not stored in the Compose configuration:

```sh
read -r -p "Admin email: " PB_ADMIN_EMAIL
read -r -s -p "Admin password: " PB_ADMIN_PASSWORD
printf '\n'
cd /srv/02-bookmarks
sudo podman-compose \
  -f compose.yml \
  -f compose.override.yml \
  exec -T pocketbase \
  /pb/pocketbase superuser create "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" \
  --dir=/pb/pb_data
```

Configure Caddy for the domain that points to this server:

```caddyfile
bookmarks.example.com {
    handle /api/* {
        reverse_proxy 02-bookmarks_pocketbase_1:8090
    }

    handle /_/* {
        reverse_proxy 02-bookmarks_pocketbase_1:8090
    }

    handle {
        reverse_proxy 02-bookmarks_frontend_1:8080
    }
}
```

Reload Caddy, then open `https://bookmarks.example.com`. The PocketBase
administrator interface is available at `https://bookmarks.example.com/_/`.

The containers do not publish host ports. Caddy must be connected to the same
Podman network as the application and is the only public entry point.

## Updates

Set `BOOKMARKS_VERSION` in `.env` to the new release tag, then pull the images
and recreate the containers:

```sh
cd /srv/02-bookmarks
sudo podman-compose -f compose.yml -f compose.override.yml pull
sudo podman-compose -f compose.yml -f compose.override.yml up -d --force-recreate
```

Pulling alone does not change a running deployment: the tag in `.env` decides
which release runs. Rollback uses the same procedure with the previous tag.

An existing checkout-based installation needs no data migration: run
`git pull`, add `BOOKMARKS_VERSION` to `installation/.env`, then use the pull and
recreate commands. The default data path (`../pb_data`) and project name are
unchanged.

## Operations

```sh
cd /srv/02-bookmarks
sudo podman-compose -f compose.yml -f compose.override.yml ps
sudo podman-compose -f compose.yml -f compose.override.yml logs -f
sudo podman-compose -f compose.yml -f compose.override.yml down
```

The `pb_data` directory contains the PocketBase database and is mounted
outside the containers, so recreating or rolling back images does not remove
application data.

## Building images locally

To test image changes without waiting for the workflow, use the build override.
It builds the same image tags locally from the repository checkout:

```sh
cd installation
BOOKMARKS_VERSION=dev sudo podman-compose -f compose.yml -f compose.build.yml up -d --build --force-recreate
```
