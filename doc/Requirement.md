## 1. Assessment Executive Summary

**Overall objective**
Build the backend (+ a thin frontend) for an e-commerce **admin dashboard only** — no storefront, no cart, no customer accounts. The single thing being graded above all else: does your role/permission system _actually_ block unauthorized requests at the API, not just hide buttons in the UI. They say this outright — they'll take a low-privilege token and hit your endpoints directly with Postman.

**Expected deliverables**

- REST API covering 9 modules: Auth, Permission, Role, User, Media, Category, Brand, Attribute, Product
- A dashboard frontend that exercises every module (design doesn't matter, completeness does)
- Migrations + a seed script (empty DB → working DB in one command sequence)
- Postman/Insomnia/Thunder/Swagger collection
- Public GitHub repo with real incremental commit history
- Live deployed link with working credentials

**Functional requirements** (the short version — full detail in Section 2)

- JWT access + refresh auth, with rotation and real server-side revocation
- Global auth guard + per-route permission guard, `module:action` naming
- Nested category tree, brand, attribute/value system, shared media library
- Product with two shapes (simple vs. variable) and generated variants

**Non-functional requirements**

- Every input validated; no predictable bad input may ever 500
- One consistent success shape, one consistent error shape, produced centrally
- Multi-table writes wrapped in transactions
- No password hash or refresh token ever returned in a response
- Code structured so "which file holds this behavior" is guessable — routing, business logic, and data access separated

**Constraints**

- PostgreSQL and Node.js are fixed. Everything else (NestJS/Express, TS/JS, Prisma/Drizzle/etc.) is your choice — you've already chosen Express + TS + Drizzle, all fine.
- No public sign-up — accounts only via the User module.
- **Deadline is Aug 1, 11:59 PM, firm.** Partial, well-built submissions are explicitly preferred over complete, broken ones.

**Submission requirements**
Public repo + README, migrations + seed script with exact run commands, API collection, live link + credentials — submitted **only** through their form (not email).

**Assumptions**
I made a number of judgment calls where the doc deliberately leaves the schema/API design to you. All of them are flagged inline as I go, and the full list is consolidated in **Section 12**.

---

## 2. Requirement Breakdown

Kept high-level here — exact columns/types live in Section 7, exact routes in Section 9. This section is "what and why," not "how."

### Module 1 — Authentication

**Purpose:** Prove identity, keep sessions alive safely, and make logout actually mean something.

- **Features:** login, access+refresh issuance, refresh rotation, real server-side logout, session introspection, inactive-user lockout.
- **APIs:** `POST /login`, `POST /refresh`, `POST /logout`, `GET /session`.
- **DB entities:** `users` (shared with Module 4), `refresh_tokens`.
- **Relationships:** one user → many refresh tokens (historical/rotated chain).
- **Business rules:** same generic error for wrong email vs. wrong password; refresh rotates the token (old one dies); inactive user can't log in _or_ refresh; logout revokes server-side, not just a client-side clear.
- **Edge cases:** reusing an already-rotated (dead) refresh token should be treated as a compromise signal, not silently ignored (this is the named bonus: reuse detection).

### Module 2 — Permission

**Purpose:** The vocabulary everything else is built on. Build first.

- **Features:** group (=module) + action → permission name; standard action set (create/read/update/delete/watch/upload/write/approve/status) plus arbitrary custom actions; grouped list with search/pagination.
- **APIs:** CRUD on permission groups, list/search permissions, delete permission.
- **DB entities:** `permission_groups`, `permissions`.
- **Relationships:** group 1→N permissions; permission N→N roles via `role_permissions`.
- **Business rules:** name is `module:action`, globally unique, normalized to lowercase/no-spaces (reject or normalize, but be consistent) on write.
- **Edge cases:** deleting a permission that roles still hold — I'm cascading the join rows (documented choice, see Section 7).

### Module 3 — Role

**Purpose:** Named bundle of permissions, handed to users.

- **Features:** create+grant in one step, full read for edit-screen pre-tick, add/remove individual permissions, grant-all shortcut, search/pagination with user counts.
- **APIs:** CRUD on roles, permission attach/detach.
- **DB entities:** `roles`, `role_permissions` (junction).
- **Relationships:** role 1→N users; role N→N permissions.
- **Business rules:** refuse delete while any user holds the role (409); refuse a permission update that would leave **zero** roles in the whole system holding `role:update` (the "don't lock yourself out" guard).
- **Edge cases:** this last-admin guard is a global check across all roles, not just the one being edited — easy to implement too narrowly.

### Module 4 — User

**Purpose:** The people who can sign in, each with exactly one role.

- **Features:** create with explicit (never defaulted) role, list with role/status filters, update including role reassignment, activate/deactivate, delete.
- **APIs:** CRUD, dedicated status toggle.
- **DB entities:** `users`.
- **Relationships:** user N→1 role.
- **Business rules:** self-escalation blocked — a user editing their own record can't change their own role; deactivated user is fully locked out (login + refresh).
- **Edge cases:** you must explicitly state (README) whether a role change is felt on the _next request_ or the _next token refresh_ — my recommendation and why is in Section 7.

### Module 5 — Media

**Purpose:** One shared upload library everything else attaches from, so nobody re-uploads the same image five times.

- **Features:** single + batch upload, real server-side MIME validation (not the client's word for it), auto-thumbnail, metadata edit, library browse with type filter.
- **APIs:** upload, list, patch metadata, delete.
- **DB entities:** `media`.
- **Relationships:** referenced (not owned) by category, brand, attribute value, product, product variant.
- **Business rules:** never trust `req.file.mimetype` alone — verify actual file bytes; deleting an attached asset must not leave a dangling reference anywhere.
- **Edge cases:** decide detach-vs-refuse on delete-while-attached (I'm going with refuse — see Section 7 for the consistent policy across modules).

### Module 6 — Category

**Purpose:** Unlimited-depth nested tree a product files under.

- **Features:** full CRUD, tree endpoint (not just flat list), DB-enforced unique slug, cycle rejection, parent picker.
- **APIs:** CRUD + `/tree`.
- **DB entities:** `categories` (self-referential).
- **Relationships:** category 1→N child categories (self-join); category N→N products.
- **Business rules:** a category can never become its own ancestor — walk the chain on every parent reassignment, they explicitly test this.
- **Edge cases:** delete while it has children or attached products — refusing is the simplest correct answer under time pressure (Section 7).

### Module 7 — Brand

**Purpose:** Simplest module in the doc. No excuse for gaps here.

- **Features:** full CRUD, search/pagination/status filter.
- **APIs:** CRUD.
- **DB entities:** `brands`.
- **Relationships:** brand 1→N products.
- **Business rules:** refuse delete while any product references it.
- **Edge cases:** none of note — this is the easiest 5% you'll bank.

### Module 8 — Attribute

**Purpose:** The dimensions a product varies along (Size, Colour…) and their values. Determines how hard Product will be.

- **Features:** attribute CRUD, value CRUD nested under it, per-attribute value uniqueness, colour/image swatch types.
- **APIs:** attribute CRUD, value CRUD nested under attribute.
- **DB entities:** `attributes`, `attribute_values`.
- **Relationships:** attribute 1→N values; value N→N product variants (via junction).
- **Business rules:** value unique _within its attribute_ (Red can exist under Colour and separately under something else); refuse deleting an attribute/value already used by a variant.
- **Edge cases:** "reference value" means different things per type (hex vs. media) — I'm splitting this into two typed columns rather than one loose field (Section 7).

### Module 9 — Product

**Purpose:** The centerpiece — pulls category, brand, media, and attributes together.

- **Features:** simple vs. variable products (mutually exclusive field sets), variant combination generation, media attach with single-thumbnail enforcement + gallery ordering, category/brand linking, full list/detail/update/delete.
- **APIs:** product CRUD, variant sub-resource CRUD, variant auto-generation, media attach/detach.
- **DB entities:** `products`, `product_variants`, plus four junctions (categories, attribute-values-per-variant, product media, variant media).
- **Relationships:** product N→N categories, product N→1 brand, product 1→N variants, variant N→N attribute values.
- **Business rules:** reject price on a variable product, reject variant-less state on a simple one; reject duplicate slug/SKU/variant-SKU; reject sale price > price; reject negative price/stock; reject two variants with an identical attribute combination; at most one thumbnail per product _and_ per variant; **creation is transactional** — a bad variant must not leave a half-built product behind.
- **Edge cases:** this module has the highest bug surface in the whole assignment — see Section 3's "easy to lose points" list.

**Optional / bonus / nice-to-have (per the doc's own scoring note):**
TypeScript (you already have this — free points), refresh-token reuse detection, login rate limiting, an audit log, tests (specifically around the permission guard), Docker Compose (also already your stack). **Not required, and I'd de-prioritize the audit log entirely given the timeline** — it's a real feature with its own table and write-path integration, low ROI for 4 days.

---

## 3. Evaluation Criteria Analysis

| Criterion                      | Weight | Why It Matters                                                                            | Priority                              | How to Maximize Score                                                                                                                          |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Access control                 | 25%    | This is the actual thesis of the assignment — everything else is a vehicle for testing it | **#1**                                | Global auth guard, per-route permission guard, correct 401 vs. 403 split, test with the seeded limited user via Postman _before_ you submit    |
| Product module                 | 20%    | Hardest data model, most business rules, most places to silently fail                     | **#2**                                | Get simple products airtight first; variant generation and media attach can be simpler than "friendly" if time is short — correctness > polish |
| Authentication                 | 15%    | Wrong here breaks _everything_ downstream — untestable API if login is broken             | **#3 (build order, not just weight)** | Rotation + real revocation, generic login error, inactive-user lockout                                                                         |
| Permission/Role/User           | 15%    | Infrastructure the other 85% depends on                                                   | **#3** (tied)                         | Last-admin guard and self-escalation guard are cheap to build and explicitly named — don't skip them                                           |
| Category/Brand/Attribute/Media | 15%    | Product literally cannot exist without these                                              | **#4**                                | Brand is free points; Category's cycle check and Media's real MIME check are the traps                                                         |
| Code quality                   | 7%     | Reviewed directly, not just inferred from behavior                                        | **#5**                                | Consistent error/success envelope, transactions on multi-table writes, layered file structure                                                  |
| UI/README                      | 3%     | Genuinely the least important line item                                                   | **#6**                                | Enough UI to demo every endpoint; README is more about the walkthrough than the score                                                          |

**Ranked, highest to lowest:** Access control → Product → (Auth, Permission/Role/User) → Category/Brand/Attribute/Media → Code quality → UI/README.

**What they're actually testing:** not whether you can build CRUD (everyone can), but whether you _think about consequences_ — the last-admin guard, self-escalation guard, and cycle rejection are all small, cheap checks that exist purely to see if you thought past the happy path. They say this almost verbatim about the role guard.

**Where mistakes actually lose points** (doc-sourced, not generic advice):

- Any route reachable without the right permission — **especially** file uploads (multipart bypasses guards more often than JSON routes do), nested routes (attribute values, variants, role-permission assignment), and the routes that create permissions/roles/users themselves
- `/logout` requiring a valid _access_ token — it shouldn't. Read literally, it's a public route that works off the refresh token in the body (you need to be able to log out even with an expired session)
- Permission or category cycle checks that "mostly" work — they explicitly say "we will test this"
- A 500 on any predictable bad input (duplicate slug, bad FK, negative stock) instead of a clean 4xx
- Variant generation without a transaction — a failed variant validation leaving a half-created product
- Presenting an unfinished module as finished instead of declaring it partial in the README — treated **more seriously** than an honest gap

---

## 4. Recommended Development Order

This is sequence, not schedule — day-by-day timing is in Section 10.

1. **Scaffold + Auth + Permission + Role + User + seed** — nothing else can be tested until this exists; it's also 40% of the grade on its own.
2. **Media** — Category, Brand, and Product all attach from it; build it before them, per the doc's own build order.
3. **Category → Brand → Attribute** — in that order by complexity, not weight; Brand is trivial, do it as a break between the two harder ones.
4. **Product** — deliberately last; it depends on nearly everything above and is the single largest module.
5. **Frontend** — build against the finished API, not in parallel with it; building UI against an unstable API wastes time re-wiring calls.
6. **Docker/deploy/docs** — last, but not an afterthought — budget real time for it (see the deployment landmine in Section 10).

---

## 5. System Architecture

**Why MVC, adapted:** `controllers/`, `models/`, `routes/` top-level split falls apart once you have 9 domain modules living in the same three folders.So chosing **feature-first modules, each internally MVC-layered** (route → controller → service → repository → schema). This is the same pattern, just organized by _what it does_ instead of _what layer it's in_.

**Where business logic belongs:** in the **service** layer, never in controllers or route files. Controllers do exactly three things — parse the request, call one service method, shape the response. All the interesting rules (last-admin guard, cycle detection, self-escalation check, variant-combination uniqueness, transactional product creation) live in services, where they're testable without spinning up Express.

**Layer responsibilities:**

- **Route:** wiring only — method, path, middleware chain (guard → permission → validate → controller)
- **Controller:** HTTP translation — `req` in, service call, `res.json()` out. No `if` statements about business rules.
- **Service:** the actual logic. Owns transactions. Throws typed errors (`AppError` subclasses), never touches `req`/`res`.
- **Repository:** Drizzle queries only. No business logic, no validation. If you find yourself writing an `if` here, it belongs one layer up.
- **Schema (Drizzle):** the source of truth for the shape of your data — see Section 8.

**Dependency flow:** strictly one-directional, top to bottom. A repository never calls a service; a service never imports Express types.
