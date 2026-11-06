# 06 — Database

## 1. Database

Database: PostgreSQL on Supabase. Prisma is used as the ORM and migration tool.

## 2. Tables

The initial application schema contains six core tables, with `refresh_tokens` added for session management.

| Table            | Purpose                                           |
| ---------------- | ------------------------------------------------- |
| `users`          | User account and profile                          |
| `categories`     | Article categories                                |
| `articles`       | Article content and publishing state              |
| `comments`       | Comments attached to articles                     |
| `likes`          | User likes on articles                            |
| `bookmarks`      | User bookmarks                                    |
| `refresh_tokens` | Hashed refresh-token records and revocation state |

## 3. Main relationships

```text
users 1 ─── * articles
users 1 ─── * comments
users 1 ─── * likes
users 1 ─── * bookmarks
users 1 ─── * refresh_tokens

categories 1 ─── * articles (article category is optional)

articles 1 ─── * comments
articles 1 ─── * likes
articles 1 ─── * bookmarks
```

## 4. Important constraints

- `users.email` unique.
- `users.username` unique.
- `categories.name` and `categories.slug` unique.
- `articles.slug` unique.
- `likes` unique on `(user_id, article_id)`.
- `bookmarks` unique on `(user_id, article_id)`.
- `refresh_tokens.token_hash` unique.
- Foreign keys use UUID identifiers.
- Deleting a user cascades to their dependent records.
- Deleting a category sets an article's category reference to null.

Refer to `prisma/schema.prisma` as the source of truth for exact field definitions and database mappings.

## 5. Article fields and content

Article content is stored in `content_markdown` as text. Article status uses:

- `DRAFT`
- `PUBLISHED`

`published_at` is nullable and records the publication time when an article is published. Cover image data is stored as a Storage path, not binary data.

## 6. Refresh token storage

The `refresh_tokens` table stores:

- UUID record ID.
- User foreign key.
- SHA-256 hash of the refresh token.
- Expiration timestamp.
- Optional revocation timestamp.
- Creation timestamp.

Never store the raw refresh token in PostgreSQL.

## 7. Prisma and Supabase connection URLs

Environment variables:

- `DATABASE_URL`: runtime connection string; transaction pooler may use port 6543.
- `DIRECT_URL`: direct/session connection for migration operations; use a connection compatible with Prisma migrations, commonly port 5432.

In the current Prisma 6 setup, check both `prisma.config.ts` and `schema.prisma` so migration commands use the intended direct URL. Do not commit actual connection strings.

## 8. Row Level Security

RLS is enabled for application tables and direct `anon`/`authenticated` table privileges are revoked as configured in Supabase.

The backend uses a privileged database connection. This may bypass RLS. Therefore:

- Never expose privileged DB credentials to frontend.
- Enforce authentication and ownership in Express.
- Apply the same RLS/revoke policy to newly created tables where appropriate.
- Review default privileges when adding tables or sequences.

## 9. Migration policy

- Every schema change should have a named migration.
- Commit migration files with the code change.
- Do not edit an already-applied migration in a shared environment; create a new migration.
- Review generated SQL before applying sensitive schema changes.
- Keep this document aligned with `schema.prisma` and migration history.
