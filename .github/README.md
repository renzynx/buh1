# buh1

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![CI](https://github.com/renzynx/buh1-nextjs/actions/workflows/ci.yml/badge.svg)
![Docker](https://img.shields.io/badge/Docker-supported-blue.svg)

## Key Features

- Resumable TUS uploads for reliable chunked uploads
- Nested folders with hierarchical structure
- Built-in previews for images, video, audio, PDFs, and code
- Fast search across folders
- Bulk actions including delete and download as ZIP
- Public links and QR codes for easy sharing
- ShareX support with downloadable .sxcu configuration
- API keys for automation and external integrations
- Two-factor authentication (2FA) via TOTP
- Role-Based Access Control (RBAC) with Superadmin, Admin, and User roles
- Admin impersonation for user support
- Per-user storage quotas
- Invite-only registration system

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Bun
- **Database**: SQLite with Drizzle ORM
- **Upload Protocol**: TUS for resumable uploads
- **Authentication**: better-auth
- **API**: tRPC for type-safe communication
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Linting**: Biome

## Getting Started

### Requirements

- Bun v1.3 or higher

### Local Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/renzynx/buh1.git
   cd buh1
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the required variables (see [Environment Variables](#environment-variables)).

4. Run database migrations:

   ```bash
   bun x drizzle-kit push
   ```

5. Start the development server:

   ```bash
   bun run dev
   ```

## Docker Deployment

The application is available as a Docker container.

### Docker CLI

```bash
docker run -d \
  --name buh1 \
  -p 3000:3000 \
  -v ./db:/app/db \
  -v ./storage:/app/storage \
  -e AUTH_SECRET="your-32-char-secret" \
  -e AUTH_BASE_URL="http://localhost:3000" \
  ghcr.io/renzynx/buh1:latest
```

### Docker Compose

```yaml
services:
  buh1:
    image: ghcr.io/renzynx/buh1:latest
    ports:
      - "3000:3000"
    volumes:
      - ./db:/app/db
      - ./storage:/app/storage
    environment:
      - DATABASE_URL=/app/db/data.db
      - AUTH_SECRET=your-32-char-secret
      - AUTH_BASE_URL=http://localhost:3000
    restart: unless-stopped
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| DATABASE_URL | Path to the SQLite database file | ./data.db | No |
| AUTH_SECRET | Secret key for session encryption (min 32 chars) | - | Yes |
| AUTH_BASE_URL | Public URL of the application | - | Yes |
| APP_NAME | Display name of the application | Buh | No |
| PORT | Port the server listens on | 3000 | No |

## Updating

To update the application to the latest version:

1. Pull the latest changes:

   ```bash
   git pull origin main
   ```

2. Update dependencies and rebuild:

   ```bash
   bun install
   bun run build
   ```

If using Docker:

```bash
docker compose pull
docker compose up -d
```

## License

This project is licensed under the MIT License.
