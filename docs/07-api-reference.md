# 07 — API Reference

## 1. Conventions

- Base path: `/api/v1`
- Request/response format: JSON unless an endpoint handles multipart upload.
- Authentication: `Authorization: Bearer <accessToken>`.
- Refresh token is sent by the browser as an HttpOnly cookie.
- Endpoint availability must be checked against the current backend implementation. Planned endpoints below are not yet guaranteed to exist.

## 2. Authentication endpoints

### POST `/auth/register`

Register a new user.

Request:

```json
{
  "name": "Example User",
  "username": "example",
  "email": "example@example.com",
  "password": "password123"
}
```

Expected success: `201 Created`.

Response shape (illustrative):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Example User",
      "username": "example",
      "email": "example@example.com"
    },
    "accessToken": "..."
  }
}
```

Refresh token is set in an HttpOnly cookie, not returned as a JSON field.

Possible errors: `400` invalid input, `409` duplicate email/username.

### POST `/auth/login`

Login with email or username.

Request:

```json
{
  "identifier": "example",
  "password": "password123"
}
```

Expected success: `200 OK`. Response contains user data and access token; refresh token is set as an HttpOnly cookie.

Possible error: `401` invalid credentials.

### POST `/auth/refresh`

Obtain a new access token using the refresh cookie.

- No JSON body required.
- Browser must send credentials/cookies.
- On success, old refresh token is revoked and a new refresh token is set.
- Expected success: `200 OK`.
- Invalid, expired, or revoked token: `401 Unauthorized`.

### POST `/auth/logout`

Revoke the refresh token associated with the cookie and clear the cookie.

- No JSON body required.
- Expected success: `200 OK`.
- Logout should be safe to call when no refresh cookie is present.

## 3. Authentication header example

```http
Authorization: Bearer <access_token>
```

Do not send refresh token in the Authorization header for normal API requests.

## 4. Planned article endpoints

These are proposed resource routes and must be confirmed in implementation before frontend integration.

| Method | Path                    | Access        | Purpose                 |
| ------ | ----------------------- | ------------- | ----------------------- |
| GET    | `/articles`             | Public        | List published articles |
| GET    | `/articles/:slug`       | Public        | Article detail          |
| POST   | `/articles`             | Authenticated | Create article/draft    |
| PATCH  | `/articles/:id`         | Owner         | Update article          |
| DELETE | `/articles/:id`         | Owner         | Delete article          |
| POST   | `/articles/:id/publish` | Owner         | Publish article         |

## 5. Planned interaction endpoints

| Method | Path                     | Access        | Purpose            |
| ------ | ------------------------ | ------------- | ------------------ |
| GET    | `/articles/:id/comments` | Public        | List comments      |
| POST   | `/articles/:id/comments` | Authenticated | Add comment        |
| DELETE | `/comments/:id`          | Owner         | Delete own comment |
| PUT    | `/articles/:id/like`     | Authenticated | Like article       |
| DELETE | `/articles/:id/like`     | Authenticated | Unlike article     |
| PUT    | `/articles/:id/bookmark` | Authenticated | Bookmark article   |
| DELETE | `/articles/:id/bookmark` | Authenticated | Remove bookmark    |

Final paths, pagination, sorting, response envelopes, and validation errors must be agreed by frontend/backend before implementation.

## 6. Error response convention

Recommended consistent shape:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

Do not expose stack traces, SQL details, secrets, or internal exception messages in production.
