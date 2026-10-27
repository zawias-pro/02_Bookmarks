# Self-hosting 02_Bookmarks

The stack runs from prebuilt `linux/amd64` images that are public on the GitHub
Container Registry, so no login, source checkout, or build tooling is needed.
Images are tagged by release, for example `0.1.0`; there are no floating tags.
PocketBase migrations ship inside the image, and the database lives outside the
containers in `BOOKMARKS_DATA_DIR`, so updates do not touch it.

## Requirements

- An x86_64 (`linux/amd64`) Linux server with Podman and a Compose provider.
- A reverse proxy, for example Caddy.
- A domain pointing at the server.
- Backups for the PocketBase data directory.

## Install

```sh
sudo mkdir -p /srv/02-bookmarks/pb_data
cd /srv/02-bookmarks
sudo curl -fsSLO https://raw.githubusercontent.com/zawias-pro/02_Bookmarks/main/installation/compose.yml
```

Create `.env` with the release to run and the data directory:

```sh
sudo tee .env >/dev/null <<'EOF'
BOOKMARKS_VERSION=0.1.0
BOOKMARKS_DATA_DIR=/srv/02-bookmarks/pb_data
EOF
```

`BOOKMARKS_VERSION` is required and pins the deployment to one release; use a
tag from the repository's Tags page.

Start the stack:

```sh
sudo podman-compose -f compose.yml pull
sudo podman-compose -f compose.yml up -d
```

## Reverse proxy

The containers publish no host ports, so the proxy must share their Podman
network. Route `/api/*` and `/_/*` to `02-bookmarks_pocketbase_1:8090` and
everything else to `02-bookmarks_frontend_1:8080`.

Once the proxy is working, open `https://<your-domain>/_/` and create the
PocketBase administrator account. No default credentials exist.

## Updates and rollback

Change `BOOKMARKS_VERSION` in `.env`, then:

```sh
cd /srv/02-bookmarks
sudo podman-compose -f compose.yml pull
sudo podman-compose -f compose.yml up -d --force-recreate
```

To roll back, set the previous version and run the same commands.

## Operations

```sh
cd /srv/02-bookmarks
sudo podman-compose -f compose.yml ps
sudo podman-compose -f compose.yml logs -f
sudo podman-compose -f compose.yml down
```
