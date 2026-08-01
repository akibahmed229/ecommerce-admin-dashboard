# Trends Bird — E-commerce Admin Dashboard API

Backend for the Backend Developer Intern assignment: a REST API and admin dashboard covering role-based access control, a shared media library, and catalog structure (categories, brands, attributes). **Product was deliberately not attempted** — see [Module status](#module-status) for why and what that trades off.

---

## Table of contents

- [Primary requirements](#primary-requirements)
- [Tech stack](#tech-stack)
- [Backend structure](#backend-structure)
- [Access control model](#access-control-model)
- [Getting started](#getting-started)
- [Running the project](#running-the-project)
- [Seeded credentials](#seeded-credentials)
- [Token strategy](#token-strategy)
- [Module status](#module-status)
- [Design decisions](#design-decisions--assumptions)
- [Known issues](#known-issues)
- [API testing](#api-testing)
- [Recommended Reading Stuff](#recommended-reading-stuff)

---

## Primary requirements

This API implements the assessment's core thesis: **access control enforced at the API, not the UI**. Concretely:

- Every route requires a valid JWT by default — public routes (`login`, `refresh`, `logout`) opt out explicitly, rather than every other route opting in.
- A second guard checks the caller's role against a `module:action` permission string declared per route.
- `401` for missing/invalid/expired tokens or an inactive account; `403` for a valid token lacking the right permission; `400`/`422` for bad input; `404` for missing records; `409` for conflicts. No predictable bad input produces a `500`.
- Passwords are hashed (`bcryptjs`), never returned in any response. Refresh tokens are stored hashed, rotated on every use, and revoked server-side on logout — not just cleared client-side.
- Multi-table writes (role + its permission grants, category + image, etc.) run inside transactions.

---

## Tech stack

| Layer            | Choice                                                              |
| ---------------- | ------------------------------------------------------------------- |
| Runtime          | Node.js (LTS)                                                       |
| Framework        | Express                                                             |
| Language         | TypeScript                                                          |
| Database         | PostgreSQL                                                          |
| ORM              | Drizzle                                                             |
| Validation       | Zod                                                                 |
| Auth             | JWT (access) + opaque hashed tokens (refresh)                       |
| File storage     | Cloudinary (see [Design decisions](#design-decisions--assumptions)) |
| Containerization | Docker Compose                                                      |

---

## Backend structure

Here is your backend architecture documentation restructured with a clean, highly legible directory tree, clear component callouts, and well-organized sections.

## 🏗️ Backend Architectural Overview

### Core Architectural Principles

- **Feature-First (Vertical Slices):** Each feature module encapsulates its full stack from routes down to data persistence. There are no monolithic global directories like `controllers/` or `services/`.
- **Clean Layer Separation:**
  - **`presentation/`**: Transport-layer handling (HTTP/Express).
  - **`application/`**: Pure business logic and validation rules.
  - **`infrastructure/`**: Database definitions and persistence details.
  - **`domain/`**: Enterprise entities and contract interfaces (completely decoupled from frameworks).
- **Strict Logic Isolation:** Business rules reside strictly within `application/`. Repositories only construct queries—never evaluate domain conditional logic.

## 📂 Project Directory Structure

```
server/
├── 📁 src/
│   ├── 📁 core/                                   # Cross-cutting concerns & shared utilities
│   │   ├── 📁 config/
│   │   │   ├── env.ts                             # Zod-validated environment setup (fails on boot)
│   │   │   ├── cloudinary.ts
│   │   │   └── corsOptions.ts
│   │   ├── 📁 database/
│   │   │   ├── drizzle-client.ts                  # Singleton DB client instance
│   │   │   ├── seed.ts
│   │   │   └── 📁 schema/
│   │   │       ├── enums.ts
│   │   │       └── index.ts                       # Schema barrel file used by Drizzle Kit
│   │   ├── 📁 errors/
│   │   │   └── AppError.ts                        # Typed custom AppErrors (4xx / 5xx variants)
│   │   ├── 📁 middleware/
│   │   │   ├── authGuard.ts                       # JWT verification & payload attachment
│   │   │   ├── permissionGuard.ts                 # Granular RBAC / permission validation
│   │   │   ├── validate.ts                        # Zod schema validation middleware factory
│   │   │   ├── upload.ts                          # Multer memory storage configuration
│   │   │   └── errorHandler.ts                    # Global error handler (standardized error shape)
│   │   ├── 📁 routes/
│   │   │   └── index.ts                           # Top-level feature router aggregator
│   │   ├── 📁 types/
│   │   │   ├── pagination.ts
│   │   │   └── express.d.ts                       # Express Request type extensions (req.auth)
│   │   └── 📁 utils/
│   │       ├── asyncHandler.ts
│   │       ├── hash.ts
│   │       ├── jwt.ts
│   │       └── response.ts
│   │
│   ├── 📁 features/                               # Vertical feature modules
│   │   └── 📁 [Auth | Permission | Role | User | Media | Category | Brand | Attribute]/
│   │       ├── 📁 domain/                         # Zero dependencies (pure TS interfaces & types)
│   │       │   ├── {module}.entity.ts             # Domain entity type definition
│   │       │   └── {module}.repository.ts         # Abstract repository interface
│   │       ├── 📁 application/                    # Pure business logic
│   │       │   ├── {module}.service.ts            # Core workflows & business rules
│   │       │   └── {module}.validation.ts         # Zod schemas for input validation
│   │       ├── 📁 infrastructure/
│   │       │   └── 📁 persistence/
│   │       │       ├── {module}.schema.ts         # Drizzle table definitions & relations
│   │       │       └── {module}.repository.impl.ts # Concrete repository database queries
│   │       └── 📁 presentation/                   # HTTP handling
│   │           ├── {module}.controller.ts         # Request parsing & response handling
│   │           └── {module}.routes.ts             # Feature-specific route definitions
│   │
│   ├── app.ts                                     # Express application assembly & middleware wiring
│   └── server.ts                                  # Server entrypoint (HTTP listener)
│
├── 📁 drizzle/                                    # Generated auto-migrations (SQL)
├── docker-compose.yaml
├── Dockerfile
└── drizzle.config.ts
```

## 🧩 Layer Responsibilities Breakdown

| **Layer**            | **Responsibility**                                                 | **Dependencies Allowed**       |
| -------------------- | ------------------------------------------------------------------ | ------------------------------ |
| **`domain`**         | Holds pure enterprise entities and repository interfaces.          | _None (Framework Agnostic)_    |
| **`application`**    | Coordinates execution flow, business rules, and input validation.  | Domain interfaces, Zod         |
| **`infrastructure`** | Executes SQL queries and maps DB tables using Drizzle ORM.         | Drizzle ORM, Domain interfaces |
| **`presentation`**   | Extracts HTTP requests, triggers services, formats JSON responses. | Express, Application Layer     |

---

## Access control model

- **`permissions`** — the vocabulary. `module:action`, e.g. `category:create`. Grouped by `permission_groups` (one per module).
- **`roles`** — a named bundle of permissions, via the `role_permissions` join table.
- **`users`** — each holds exactly one role (`roleId`, required, never defaulted).
- **`authGuard`** — verifies the JWT only (no DB hit); attaches `req.auth = { userId, roleId }`.
- **`permissionGuard("product:read")`** — queries the role's current permission set **fresh, on every request** (not cached in the JWT), and rejects with `403` if the required permission isn't present, or `401` if the account has since gone inactive. This single query is also what makes a revoked permission take effect immediately — see [Design decisions](#design-decisions--assumptions).

`watch` permissions gate frontend sidebar visibility only (via the flat permission list on `/auth/session`); `read` permissions gate the actual `GET` endpoints. `Dashboard` is the one exception — it has no `read` permission defined, so `dashboard:watch` gates it directly.

---

## Getting started

### Prerequisites

- Node.js LTS
- Docker + Docker Compose
- A [Cloudinary](https://cloudinary.com) account (free tier is enough) — media storage, see [Design decisions](#design-decisions--assumptions)

### 1. Clone and install

```bash
git clone <repo-url>
cd server
npm install
```

### 2. Environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

| Variable                 | Required | Example                                              | Notes                               |
| ------------------------ | -------- | ---------------------------------------------------- | ----------------------------------- |
| `NODE_ENV`               | no       | `development`                                        | defaults to `development`           |
| `PORT`                   | no       | `3500`                                               | defaults to `4000` if unset         |
| `DATABASE_URL`           | **yes**  | `postgres://akib:akib@localhost:5437/admindashboard` | must match `docker-compose.yaml`    |
| `JWT_ACCESS_SECRET`      | **yes**  | _(generate below)_                                   | min 32 chars, boot fails without it |
| `ACCESS_TOKEN_TTL`       | no       | `15m`                                                |                                     |
| `REFRESH_TOKEN_TTL_DAYS` | no       | `7`                                                  |                                     |
| `CORS_ORIGIN`            | no       | `http://localhost:3000`                              | frontend origin                     |
| `CLOUDINARY_CLOUD_NAME`  | **yes**  | —                                                    | from Cloudinary dashboard           |
| `CLOUDINARY_API_KEY`     | **yes**  | —                                                    | "                                   |
| `CLOUDINARY_API_SECRET`  | **yes**  | —                                                    | "                                   |
| `MEDIA_MAX_IMAGE_MB`     | no       | `10`                                                 |                                     |
| `MEDIA_MAX_VIDEO_MB`     | no       | `100`                                                |                                     |

Generate a real secret rather than typing one by hand:

```bash
openssl rand -hex 32
```

**Docker note:** if running via `docker-compose.yaml`, confirm the service uses `env_file: [.env]` — an `environment:` block with explicit `KEY=${KEY}` interpolation silently drops any new var you add to `.env` unless you also add it there. Pick one pattern; don't mix both.

### 3. Start Postgres

```bash
docker compose up -d postgres
```

### 4. Migrate and seed

```bash
npm run db:migrate
npm run db:seed
```

The seed script is **idempotent-unsafe by design** — it assumes an empty database. Running it twice will fail on unique constraints; that's expected, not a bug. To reset: drop and recreate the database, then re-run both commands.

---

## Running the project

```bash
npm run dev          # tsx watch, hot reload
```

or, fully containerized:

```bash
docker compose up --build
```

Health check:

```bash
curl http://localhost:3500/health
# → { "status": "ok" }
```

### Available scripts

| Command               | Does                                                                |
| --------------------- | ------------------------------------------------------------------- |
| `npm run dev`         | Dev server with hot reload                                          |
| `npm run db:generate` | Diff schema → generate SQL migration (`drizzle-kit generate`)       |
| `npm run db:migrate`  | Apply pending migrations                                            |
| `npm run db:seed`     | Seed permissions, roles, and the two accounts below (empty DB only) |

---

## Seeded credentials

| Account         | Email                     | Password           | Purpose                                                                                                                                            |
| --------------- | ------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Super Admin     | `admin@trendsbird.test`   | `SuperAdmin!2026`  | Holds all 41 seeded permissions                                                                                                                    |
| Catalog Manager | `catalog@trendsbird.test` | `CatalogOnly!2026` | Full access to Category/Brand/Attribute/Media/Dashboard only — **zero** access to Permission/Role/User. Use this account to verify `403` behavior. |

---

## Token strategy

**`Authorization: Bearer` header, not cookies** — chosen specifically because the assessment states reviewers will call endpoints directly with Postman; a header requires no CORS-credentials/CSRF setup and is trivially testable outside a browser.

- Access token: JWT, 15 min default, carries only `{ sub: userId, roleId }` — no permissions embedded, so a permission revoked from a role takes effect on the caller's **very next request** (`permissionGuard` re-queries the DB every time), not at next refresh.
- **Reassigning a user to a different role**, however, only takes effect at that user's **next token refresh** — `roleId` itself is baked into the access token at login. This is the one place "next request vs. next refresh" genuinely differs depending on what changed, and it's worth being able to explain that distinction precisely if asked.
- Refresh token: opaque random string (not a JWT), stored **hashed** (SHA-256) in `refresh_tokens`, never in plaintext. Rotated on every use — presenting an already-rotated token is treated as a compromise signal and revokes every session for that user, not just the one token.
- Logout is a **public route** (no Bearer required) — it works off the refresh token in the request body, deliberately, so a user can still log out with an already-expired access token.

---

## Module status

| Module         | Status            |
| -------------- | ----------------- |
| Authentication | Complete          |
| Permission     | Complete          |
| Role           | Complete          |
| User           | Complete          |
| Media          | Complete          |
| Category       | Complete          |
| Brand          | Complete          |
| Attribute      | Complete          |
| **Product**    | **Not attempted** |

**Why Product was cut:** built last per the assignment's own stated order, and deliberately dropped under the deadline rather than shipped rushed and buggy. Per the assignment's own guidance — _"we would far rather review [modules] built carefully, with access control working properly, than nine built badly... a broken module costs you more than a missing one"_ — the eight modules above are complete, permission-guarded, and tested end-to-end (see `test-api.sh`), rather than having a ninth module with untested edge cases dragging the average down.

**Downstream effect on the eight modules above:** `Category`, `Brand`, and `Attribute` each have a "refuse delete while referenced" rule that includes a check against Product/variant tables (e.g. `countAttachedProducts`, `countVariantsUsingValue`). Those checks are implemented and wired to real queries against the schema — they will correctly return `0` in every case, since nothing can reference a product/variant that doesn't exist. This is a real limitation, not a stub: the _logic_ is complete, but it's untested against actual conflicting data, since none can exist. Same applies to `Media`'s delete guard for `product_media`/`variant_media` attachments.

---

## Design decisions & assumptions

Flagged here per the assignment's own instruction to record judgment calls where the spec leaves the schema/API open.

- **File storage is Cloudinary, not local disk.** Local storage on a free-tier deploy target (Render/Railway) is ephemeral and vanishes on redeploy; Cloudinary also generates thumbnails via URL transform with zero server-side image-processing code, covering "generate a thumbnail for every image" for free.
- **MIME validation reads actual file bytes** (`file-type`), never `req.file.mimetype` or the extension — the assessment explicitly calls out not trusting client-supplied content type.
- **Delete policy is "refuse if referenced," uniformly**, across Category (children/products), Brand (products), Attribute/value (variants), Media (any attachment) — except `Permission → role_permissions`, which cascades on delete, a deliberate documented exception rather than an inconsistency.
- **User delete is a hard delete.** No `deletedAt` column exists on the current schema; stated here rather than left ambiguous, per the assignment's explicit ask to declare hard vs. soft.
- **Category cycle detection** walks the full ancestor chain of the proposed new parent on every reassignment, not just a same-id check — a category can never become its own ancestor, however many levels removed.
- **Variant combination uniqueness** (n/a currently, Product not attempted) was designed as a sorted, joined attribute-value-id string with a DB-level unique index as a backstop behind the service-layer check — documented here for the walkthrough in case the topic comes up despite the module being cut.
- **PKs are UUIDs**, matching the schema actually migrated — chosen for this assessment context over sequential integers to avoid exposing enumerable resource counts, even though this is an internal admin tool where that risk is lower than a public API.
- **`avatar` on User is a plain URL field**, not wired into the shared media library — avoids a circular schema import (`users` ↔ `media`) for a field the assignment doesn't actually require to be library-backed.

---

## Known issues

- Upload via `XMLHttpRequest` in the frontend does not retry on a `401` mid-upload (no refresh-and-retry for that one code path) — acceptable given a 15-minute access token and upload typically happening soon after login, but a real gap if a session is old.
- `low stock threshold` is not implemented — it's a field on Product's Variant table per the spec, and Product was not attempted.
- No automated test suite. Verified manually via `test-api.sh` (curl, end-to-end, covers every endpoint including the named edge cases: cycle rejection, last-admin guard, self-escalation, refresh-token reuse detection, MIME spoofing).

---

## API testing

After the server is running, verify the API using tools such as:

    curl
    Postman
    Insomnia

For complete request examples and endpoint documentation, see:
→ [API Documentation & curl Testing Guide](./doc/Api-Testing.md)

# Recommended Reading Stuff

If this is your first time working with the project, read the documentation in the following order:

1. [Project Requirement](./doc/Requirement.md)
2. [API Documentation & curl Testing Guide](./doc/Api-Testing.md)
3. [Entity-Relationship Diagram (EDD))](./doc/ERD.md)
