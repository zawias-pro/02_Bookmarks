# Self-hosting 02_Bookmarks

This setup uses Podman, `podman-compose`, and an existing Caddy installation.
The application containers serve the frontend and PocketBase on the shared
Podman network; Caddy provides the public HTTPS endpoint and proxies both
services.

## Requirements

- A Linux server with a public IPv4 address.
- Podman and its Compose provider are installed.
- Caddy is installed and running on the host.
- A domain or subdomain points to the server with an `A` record.
- Ports `80` and `443` are open in the server and VPS firewall.
- Server snapshots or backups cover `pb_data`.

## Install

Clone the repository on the server and enter the installation directory. The
commands below assume a root-owned production checkout, as used on `vps-02-ovh`:

```sh
git clone <repository-url> 02-bookmarks
cd 02-bookmarks/installation
```

Start the production stack. On `vps-02-ovh`, include the infrastructure override
so both services join the existing `infra_proxy` network:

```sh
sudo podman-compose \
  --podman-build-args=--network=host \
  -f compose.yml \
  -f compose.override.yml \
  up -d --build --force-recreate
```

Create the PocketBase administrator once. There are no default admin
credentials: choose the admin email and password when prompted. The password
is entered interactively and is not stored in the Compose configuration:

```sh
read -r -p "Admin email: " PB_ADMIN_EMAIL
read -r -s -p "Admin password: " PB_ADMIN_PASSWORD
printf '\n'
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

## Operations

```sh
sudo podman-compose -f compose.yml -f compose.override.yml ps
sudo podman-compose -f compose.yml -f compose.override.yml logs -f
sudo podman-compose -f compose.yml -f compose.override.yml down
```

To update a source checkout:

```sh
cd /srv/02-bookmarks
git pull
sudo podman-compose \
  -f installation/compose.yml \
  -f installation/compose.override.yml \
  up -d --build --force-recreate
```

The `../pb_data` directory contains the PocketBase database and is mounted
outside the containers, so rebuilding them does not remove application data.
