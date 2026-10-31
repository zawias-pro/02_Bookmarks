# 02_Bookmarks

## Self-hosting

Prebuilt `linux/amd64` images are published to the GitHub Container Registry, so
a site only needs a Compose file and a data directory.
See [`installation/README.md`](installation/README.md) for the Podman, Compose,
and reverse proxy deployment instructions.

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

## Known issues

- Public signup is open by default and still has to be closed properly. PocketBase
  ships the `users` collection with an empty `createRule`, so an unauthenticated
  `POST /api/collections/users/records` registers an account, and no migration owns
  that rule. Until it is handled, work around it by setting the rule in
  Collections > users > API rules to a filter that never matches, such as `1 = 2`,
  which makes an anonymous create answer `400`.
