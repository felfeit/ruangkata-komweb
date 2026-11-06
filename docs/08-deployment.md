# 08 — Development Guide

## 1. Prerequisites

- Node.js (use the version agreed by the team; local development currently uses Node.js 24).
- npm.
- Git.
- Supabase project with PostgreSQL and Storage.
- Postman or equivalent API client.

## 2. Environment variables

Backend `.env` is local-only and must not be committed. Keep `.env.example` with placeholder values.

Typical variables:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

JWT_ACCESS_SECRET="replace_with_random_secret"
JWT_REFRESH_SECRET="replace_with_a_different_random_secret"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=14d
```

Storage variables should be added when the upload service is implemented. Keep service-role credentials exclusively on the backend.

Generate independent JWT secrets locally, for example:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run the command twice to create separate access and refresh secrets. Never paste real secrets into GitHub, chat, screenshots, or frontend environment files.

## 3. Backend setup

From the backend directory:

```bash
npm install
npx prisma validate
npx prisma generate
```

For a new local/database environment, run migrations using the configured direct connection:

```bash
npx prisma migrate dev
```

Start the server using the project script if defined, otherwise:

```bash
node src/server.js
```

Expected local API base URL:

```text
http://localhost:5000/api/v1
```

## 4. Frontend setup

From the frontend directory:

```bash
npm install
npm run dev
```

Configure the frontend API base URL for local development. If frontend and backend run on different origins, configure Express CORS to allow the frontend origin and credentials. Do not use wildcard origin with credentialed cookies.

## 5. Auth smoke test

Use Postman:

1. Register with a new email and username.
2. Login and verify access token response and refresh cookie.
3. Call refresh and verify the cookie rotates.
4. Call refresh again using the latest cookie.
5. Reuse a previously revoked refresh token and verify it is rejected.
6. Logout and verify the active refresh token is revoked and cookie cleared.

The rotation and reuse-detection scenarios have been reported as passing in the current development environment. Repeat them after changes to auth code.

## 6. Git workflow

Suggested workflow:

```bash
git status
git add README.md docs/
git commit -m "docs: add project documentation"
git push origin main
```

If the team uses feature branches, create a documentation branch and open a pull request instead. Confirm that `.env` and other secrets are not staged before committing:

```bash
git status
git diff --cached
```

## 7. Team workflow

- Frontend: implement UI against the agreed API contract.
- Backend: implement API and update the API reference when behavior changes.
- Both sides: discuss breaking changes before changing request/response shapes.
- Database changes: backend creates and commits Prisma migrations; update database documentation.
- Test: record reproducible steps and expected outcomes for each completed feature.

## 8. Pre-push checklist

- [ ] README and docs accurately distinguish implemented vs planned features.
- [ ] No `.env` or credentials are staged.
- [ ] Prisma schema and migration files are committed if relevant.
- [ ] API paths in frontend match the current API reference.
- [ ] Any changed endpoint contract is documented.
- [ ] `git diff --cached` has been reviewed.

## 9. Deployment notes

Target deployment is a single Render Web Service serving the built frontend and Express API from one origin. Confirm the actual build and start commands, static file serving, SPA fallback, environment variables, and health check before deployment. Use production environment variables in Render, not committed files.

For production database changes, apply committed migrations using the deployment migration workflow (for Prisma, typically `prisma migrate deploy`). Do not run development migration commands against production.
