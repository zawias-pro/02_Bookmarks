# Self-hosting 02_Bookmarks

This setup uses Podman, `podman compose`, and an existing Caddy installation.
The application containers serve the frontend and PocketBase on loopback ports;
Caddy provides the public HTTPS endpoint and proxies both services.

## Requirements

- A Linux server with a public IPv4 address.
- Podman and its Compose provider are installed.
- Caddy is installed and running on the host.
- A domain or subdomain points to the server with an `A` record.
- Ports `80` and `443` are open in the server and VPS firewall.
- Server snapshots or backups cover `pb_data`.

## Install

Clone the repository on the server and enter the installation directory:

```sh
git clone <repository-url> 02-bookmarks
cd 02-bookmarks/installation
```

Start the production stack:

```sh
podman compose up -d --build
```

Create the PocketBase administrator once. The password is entered interactively
and is not stored in the Compose configuration:

```sh
read -r -p "Admin email: " PB_ADMIN_EMAIL
read -r -s -p "Admin password: " PB_ADMIN_PASSWORD
printf '\n'
podman compose exec -T pocketbase \
  /pb/pocketbase superuser create "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" \
  --dir=/pb/pb_data
```

Configure Caddy for the domain that points to this server:

```caddyfile
bookmarks.example.com {
    handle /api/* {
        reverse_proxy 127.0.0.1:8090
    }

    handle /_/* {
        reverse_proxy 127.0.0.1:8090
    }

    handle {
        reverse_proxy 127.0.0.1:8080
    }
}
```

Reload Caddy, then open `https://bookmarks.example.com`. The PocketBase
administrator interface is available at `https://bookmarks.example.com/_/`.

The containers bind only to `127.0.0.1` on the unprivileged ports `8080` and
`8090`, so Caddy is the only public entry point. If either host port is already
in use, change the port on the left side of the mapping in `compose.yml` and
update the matching Caddy upstream.

## Operations

```sh
podman compose ps
podman compose logs -f
podman compose down
```

To update a source checkout:

```sh
git pull
podman compose up -d --build
```

The `../pb_data` directory contains the PocketBase database and is mounted
outside the containers, so rebuilding them does not remove application data.
