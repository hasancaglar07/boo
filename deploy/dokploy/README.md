# Dokploy Migration

This setup is the Dokploy target for the Book Generator production stack.

## Why this file differs from the current server compose

- No host `ports` bindings. Dokploy/Traefik owns ingress.
- Persistent data uses Dokploy's recommended `../files` bind mounts instead of absolute host paths.
- The Dokploy environment editor writes variables to `.env`, so every service loads `.env` with `env_file`.
- `web-migrate` is kept as a one-shot service so Prisma can create/update the SQLite schema before the Next.js app starts.

## Dokploy service type

Create this as a `Docker Compose` service, not a `Stack`.

Reason:
- Dokploy documents that `build` is supported in `Docker Compose`.
- Dokploy documents that `build` is not available in `Stack`.

## Required files in Dokploy

Use:
- Compose path: `deploy/dokploy/docker-compose.yml`
- Environment file contents: copy `deploy/dokploy/.env.example` into Dokploy's Environment tab and replace secrets

## Persistent data layout

Dokploy will keep these paths adjacent to the compose file:

- `../files/sqlite`
- `../files/book_outputs`
- `../files/multi_provider_logs`
- `../files/dashboard_settings.json`

On first migration from the current server, copy these into the Dokploy files area before the first production cutover:

- current SQLite DB: `/var/www/book/runtime/sqlite/prod.db`
- current outputs: `/var/www/book/book_outputs`
- current logs: `/var/www/book/multi_provider_logs`
- current settings: `/var/www/book/dashboard_settings.json`

## Suggested Dokploy domain setup

- Public app: `bookgenerator.net`
- Optional `www`: redirect to `bookgenerator.net`
- Optional Dokploy panel subdomain: `dokploy.bookgenerator.net`

Expose only the `web` service publicly. Keep `dashboard` internal and let `web` call it on `http://dashboard:8765`.

## Cutover notes

Dokploy requires ports `80`, `443`, and `3000` to be free during installation.

That means the migration window must:
1. Stop host `nginx`
2. Stop/remove the current `book-web`, `book-dashboard`, and `portainer` containers
3. Install Dokploy
4. Import this compose service
5. Restore the persistent files
6. Deploy and attach `bookgenerator.net` to the `web` service
