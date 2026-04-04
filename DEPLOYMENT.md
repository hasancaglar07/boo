# Book Generator Deployment

## Production shape
- Cloudflare handles DNS, TLS edge, and proxying.
- Host `nginx` + `certbot` stay on the VPS.
- Docker Compose runs the application services:
  - `book-web`
  - `book-dashboard`
- SQLite, `book_outputs`, and `dashboard_settings.json` remain persistent on the host.

## Server prerequisites
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

## Compose files
- Compose: [docker-compose.yml](/mnt/c/Users/ihsan/Desktop/BOOK/docker-compose.yml)
- Images: [Dockerfile](/mnt/c/Users/ihsan/Desktop/BOOK/Dockerfile)
- Dashboard bootstrap: [dashboard-entrypoint.sh](/mnt/c/Users/ihsan/Desktop/BOOK/docker/dashboard-entrypoint.sh)
- Migration helper: [migrate_to_docker_compose.sh](/mnt/c/Users/ihsan/Desktop/BOOK/scripts/migrate_to_docker_compose.sh)

## Env files
Create `/var/www/book/.env.compose` from [compose.env.example](/mnt/c/Users/ihsan/Desktop/BOOK/deploy/docker/compose.env.example):

```env
BOOK_WEB_ENV_FILE=/etc/book-generator/web.env
BOOK_DASHBOARD_ENV_FILE=/etc/book-generator/dashboard.env

BOOK_WEB_BIND_PORT=3000
BOOK_DASHBOARD_BIND_PORT=8765

BOOK_SQLITE_DIR=/var/www/book/runtime/sqlite
BOOK_OUTPUTS_DIR=/var/www/book/book_outputs
BOOK_LOGS_DIR=/var/www/book/multi_provider_logs
BOOK_SETTINGS_FILE=/var/www/book/dashboard_settings.json
```

Keep secrets in:
- `/etc/book-generator/web.env`
- `/etc/book-generator/dashboard.env`

## First migration from native systemd
```bash
cd /var/www/book
mkdir -p runtime/sqlite book_outputs multi_provider_logs
cp /var/lib/book-generator/prod.db /var/www/book/runtime/sqlite/prod.db
touch /var/www/book/dashboard_settings.json
docker compose --env-file .env.compose build
docker compose --env-file .env.compose --profile ops run --rm web-migrate
sudo systemctl stop book-web book-dashboard
docker compose --env-file .env.compose up -d dashboard web
docker compose --env-file .env.compose ps
```

Or use:
```bash
sudo BOOK_COMPOSE_ENV_FILE=/var/www/book/.env.compose /var/www/book/scripts/migrate_to_docker_compose.sh
```

## Daily operations
```bash
cd /var/www/book
docker compose --env-file .env.compose ps
docker compose --env-file .env.compose logs -f web
docker compose --env-file .env.compose logs -f dashboard
docker compose --env-file .env.compose restart web
docker compose --env-file .env.compose restart dashboard
```

## Deploy update
```bash
cd /var/www/book
sudo BOOK_COMPOSE_ENV_FILE=/var/www/book/.env.compose /var/www/book/scripts/deploy_update.sh
```

If you already updated files manually and want to deploy the current checkout without `git pull`:
```bash
cd /var/www/book
sudo BOOK_COMPOSE_ENV_FILE=/var/www/book/.env.compose /var/www/book/scripts/deploy_update.sh --skip-pull
```

### Asset consistency checks (new)
`deploy_update.sh` now runs two post-deploy checks:
- local container asset integrity (`http://127.0.0.1:${BOOK_WEB_BIND_PORT}`)
- public domain consistency (`https://bookgenerator.net` by default)

When it fails with "Inconsistent HTML asset variants", this means different releases are being served at the same time (commonly multiple active origins behind Cloudflare or an old container still receiving traffic).

Useful toggles:
```bash
# Skip public check temporarily
DEPLOY_SKIP_PUBLIC_ASSET_CHECK=1 sudo BOOK_COMPOSE_ENV_FILE=/var/www/book/.env.compose /var/www/book/scripts/deploy_update.sh

# Override public URL and iterations
DEPLOY_PUBLIC_BASE_URL=https://bookgenerator.net DEPLOY_PUBLIC_ASSET_CHECK_ITERATIONS=8 sudo BOOK_COMPOSE_ENV_FILE=/var/www/book/.env.compose /var/www/book/scripts/deploy_update.sh
```

## GitHub auto deploy
The production workflow is [.github/workflows/deploy-production.yml](/mnt/c/Users/ihsan/Desktop/BOOK/.github/workflows/deploy-production.yml).

It deploys every `push` to `main` and on manual `workflow_dispatch`.

Required GitHub repository secrets:
- `PROD_SSH_HOST`
- `PROD_SSH_USER`
- `PROD_SSH_KEY`

Recommended values for the current server:
- `PROD_SSH_HOST=91.98.22.149`
- `PROD_SSH_USER=root`
- `PROD_SSH_KEY=<the private key paired with the server authorized key>`

Current workflow defaults:
- deploy path: `/var/www/book`
- compose env file: `/var/www/book/.env.compose`
- public smoke check: `https://bookgenerator.net/api/auth/state`

Deploy behavior:
- fetch the exact pushed commit SHA on the server
- reset the server checkout to that SHA
- run `scripts/deploy_update.sh --skip-pull`
- verify public health before marking the workflow successful

## Rollback
```bash
cd /var/www/book
docker compose --env-file .env.compose down
sudo systemctl start book-dashboard book-web
sudo systemctl status book-dashboard book-web
```

## Health checks
```bash
curl http://127.0.0.1:3000/api/auth/state
curl http://127.0.0.1:8765/api/health
curl -I https://bookgenerator.net

# Manual asset consistency check
cd /var/www/book/web
CHECK_BASE_URL=https://bookgenerator.net CHECK_ITERATIONS=6 pnpm check:assets
```
