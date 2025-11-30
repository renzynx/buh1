# Buh 🚀

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) [![GHCR Image](https://img.shields.io/badge/ghcr-available-blue.svg)](https://github.com/renzynx/buh1/pkgs/container/buh1) [![Docker Image](https://img.shields.io/badge/docker-ready-blue.svg)](https://github.com/renzynx/buh1/pkgs/container/buh1) [![CI Status](https://img.shields.io/github/actions/workflow/status/renzynx/buh1/ci.yml?branch=master)](https://github.com/renzynx/buh1/actions)

Buh is a modern, self-hosted file storage solution focused on privacy, speed, and data ownership. It functions as a personal cloud with an admin dashboard, role-based access control (RBAC), and ShareX integration — all runnable on your infrastructure.

## Key Features ✨

- **Resumable uploads** (TUS protocol) for reliable chunked uploads that resume after connection drops.
- **Nested folders** with a hierarchical structure similar to desktop file explorers.
- **Built-in previews** for images, video, audio, PDFs, and code in the browser.
- **Fast search** across all folders by name or type.
- **Bulk actions** (delete, download as ZIP).
- **Public links & QR codes** for easy sharing.
- **ShareX support** with a pre-configured `.sxcu` file for Windows screenshots.
- **API keys** for automation and integrations.

## Security & Administration 🔒

- Secure authentication using Better Auth with HTTP-only cookies.
- Optional 2FA via TOTP (Google Authenticator, Authy).
- RBAC with three roles: `Superadmin`, `Admin`, and `User`.
- Admin impersonation for safe troubleshooting.
- Analytics dashboard for storage usage and activity.
- System settings for upload limits, chunk sizes, and blocked extensions.
- Per-user or global quotas and invite-only registration.

## Tech Stack 🧰

- Frontend: Vike (Vite + SSR) & React
- Backend: Hono & Node.js
- Database: SQLite (better-sqlite3) & Drizzle ORM
- State & API: TanStack Query, Zustand, & tRPC
- Styling: Tailwind CSS v4 & Shadcn UI

## Getting Started 🏁

### Requirements

- Node.js v20+
- pnpm

### Local setup

Clone and install dependencies:

```bash
git clone https://github.com/renzynx/buh.git
cd buh
pnpm install
```

Create a `.env` file (example):

```env
PORT=3000
AUTH_BASE_URL=http://localhost:3000
APP_NAME=Buh
DATABASE_URL=sqlite.db
AUTH_SECRET=your_super_secret_string_min_32_chars
```

Initialize the database:

```bash
pnpm run drizzle:push
```

Run in development:

```bash
pnpm run dev
```

Open http://localhost:3000 — the first registered user becomes `Superadmin`.

### Production

Build and start the optimized server:

```bash
pnpm run build
pnpm run start
```

Run in development:

```bash
pnpm run dev
```

Open http://localhost:3000 — the first registered user becomes `Superadmin`.

### Production

Build and start the optimized server:

```bash
pnpm run build
pnpm run start
```

## Docker deployment 🐳

### Using docker compose (recommended)

Create a `.env` file:

```env
AUTH_SECRET=your_super_secret_string_min_32_chars_change_me
AUTH_BASE_URL=http://localhost:3000
APP_NAME=Buh
```

Use the included `docker compose.yml`:

```bash
docker compose up -d
```

Or create your own `docker compose.yml`:

```yaml
services:
  buh:
    image: ghcr.io/renzynx/buh1:latest
    container_name: buh
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=/app/db/sqlite.db
      - AUTH_SECRET=${AUTH_SECRET}
      - AUTH_BASE_URL=${AUTH_BASE_URL:-http://localhost:3000}
      - APP_NAME=${APP_NAME:-Buh}
      - PORT=3000
    volumes:
      - storage_data:/app/storage
      - db_data:/app/db

volumes:
  storage_data:
  db_data:
```

### Using Docker CLI

Shell / macOS / Linux:

```bash
docker pull ghcr.io/renzynx/buh1:latest
docker run -d \
 	-p 3000:3000 \
 	-v "$(pwd)/storage:/app/storage" \
 	-v "$(pwd)/db:/app/db" \
 	-e DATABASE_URL=/app/db/sqlite.db \
 	-e AUTH_SECRET=your_generated_secret \
 	-e AUTH_BASE_URL=https://your-domain.com \
 	ghcr.io/renzynx/buh1:latest
```

PowerShell (Windows):

```powershell
docker pull ghcr.io/renzynx/buh1:latest
docker run -d `
 	-p 3000:3000 `
 	-v "${PWD}\storage:/app/storage" `
 	-v "${PWD}\db:/app/db" `
 	-e DATABASE_URL=/app/db/sqlite.db `
 	-e AUTH_SECRET=your_generated_secret `
 	-e AUTH_BASE_URL=https://your-domain.com `
 	ghcr.io/renzynx/buh1:latest
```

**Important notes:**

- `DATABASE_URL` must be set to `/app/db/sqlite.db` (inside the container)
- Mount both `./storage` and `./db` directories to persist data
- The database file will be created automatically on first run

## Updating ⚙️

Keep a current backup of your database and storage before updating. The steps below show typical update flows for a source/manual (self-hosted) install and for Docker deployments.

### Manual / Source install

1. Stop the running service or server (systemd, pm2, or however you run the app).
2. Backup your database and storage directories (example paths in repo root):

- PowerShell:

  ```powershell
  Stop-Process -Name node -ErrorAction SilentlyContinue
  Copy-Item -Path .\db\sqlite.db -Destination .\db\sqlite.db.bak -Force
  Copy-Item -Path .\storage -Destination .\storage.bak -Recurse -Force
  ```

- Bash / sh:

  ```bash
  # stop your process (systemd, pm2, etc.) before copying
  cp db/sqlite.db db/sqlite.db.bak
  cp -a storage storage.bak
  ```

3. Pull the latest code and install dependencies:

```bash
git pull origin master
pnpm install
```

4. Apply any database migrations (same command used for initial setup):

```bash
pnpm run drizzle:push
```

5. Build and restart the app:

```bash
pnpm run build
# restart your process manager, or run:
pnpm run start
```

6. Verify the app and check logs for errors.

### Docker (docker compose)

1. Backup your `db` and `storage` directories on the host (stop compose first):

```bash
docker compose down
cp db/sqlite.db db/sqlite.db.bak
cp -a storage storage.bak
```

2. Pull the new image and restart the service (recommended):

```bash
docker compose pull
docker compose up -d --force-recreate --remove-orphans
```

3. Migrations: New migrations are applied automatically when the container starts. Because the production container doesn't install development dependencies, do not attempt to run `pnpm run drizzle:push` inside the running container. To apply migrations, recreate the container so the startup process can perform them against the mounted database.

4. Confirm the service is running and review logs:

```bash
docker compose ps
docker compose logs -f
```

### Docker CLI (single container)

1. Stop and remove the existing container, pull the new image, then recreate the container. PowerShell example:

```powershell
docker pull ghcr.io/renzynx/buh1:latest
docker stop buh; docker rm buh
docker run -d \
  -p 3000:3000 \
  -v "${PWD}\storage:/app/storage" \
  -v "${PWD}\db:/app/db" \
  -e DATABASE_URL=/app/db/sqlite.db \
  -e AUTH_SECRET=your_generated_secret \
  -e AUTH_BASE_URL=https://your-domain.com \
  --name buh \
  ghcr.io/renzynx/buh1:latest
```

2. Verify logs and that the app responds on your configured URL/port.

### Notes & recommendations

- Always backup your `db` file and `storage` directory before updating.
- Test upgrades in a staging environment when possible.
- If you use a process manager (systemd, pm2), use its standard commands to restart and check status.

## Environment variables ⚙️

| Variable        |                                    Description | Required / Default      |
| --------------- | ---------------------------------------------: | ----------------------- |
| `DATABASE_URL`  | Database connection string (SQLite file path). | Required                |
| `AUTH_SECRET`   |         Session encryption key (min 32 chars). | Required                |
| `AUTH_BASE_URL` |                                Public app URL. | `http://localhost:3000` |
| `APP_NAME`      |                              App display name. | `Buh`                   |
| `PORT`          |                         Server listening port. | `3000`                  |

## License 📄

Open-source under the MIT License.
