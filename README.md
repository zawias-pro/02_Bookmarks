# 02_Bookmarks

## Self-hosting

See [`installation/README.md`](installation/README.md) for the Podman, Compose, and
host Caddy deployment instructions.

## Development

```
podman compose up
```

Frontend will be running at:
- http://localhost:5177

Backend will be running at:
- API: http://127.0.0.1:8090/api
- Admin dashboard: http://127.0.0.1:8090/_/

Create the local development PocketBase admin account with the dummy
credentials below:

```sh
podman compose exec pocketbase \
  /pb/pocketbase superuser create admin@admin.com admin123 \
  --dir=/pb/pb_data
```

Sign in at http://127.0.0.1:8090/_/ with:

```text
Email:    admin@admin.com
Password: admin123
```
