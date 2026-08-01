## API Documentation & curl Testing Guide

A full curl-based walkthrough covering every endpoint — including the assessment's explicitly-named edge cases (category cycle rejection, last-admin-holding-role guard, self-escalation prevention, refresh-token reuse detection, real MIME validation, and `401`/`403` differentiation against the seeded Catalog Manager account). Requires `jq`. make sure you have installed `jq`

```bash
npm run db:migrate && npm run db:seed   # fresh DB — the script is not safe to re-run against existing data
npm run dev
```

```bash
export API=http://localhost:3500/api/v1
```

---

## 0. Auth — also produces the tokens everything below needs

```bash
# --- Login as super admin ---
LOGIN=$(curl -s -X POST $API/auth/login -H "content-type: application/json" \
  -d '{"email":"admin@trendsbird.test","password":"SuperAdmin!2026"}')
echo $LOGIN | jq
ADMIN_TOKEN=$(echo $LOGIN | jq -r '.data.accessToken')
ADMIN_REFRESH=$(echo $LOGIN | jq -r '.data.refreshToken')
# → 200

# --- Login as catalog user (for 403 checks throughout) ---
CATALOG_LOGIN=$(curl -s -X POST $API/auth/login -H "content-type: application/json" \
  -d '{"email":"catalog@trendsbird.test","password":"CatalogOnly!2026"}')
CATALOG_TOKEN=$(echo $CATALOG_LOGIN | jq -r '.data.accessToken')

# --- Wrong password — generic error, must not reveal which field was wrong ---
curl -s -X POST $API/auth/login -H "content-type: application/json" \
  -d '{"email":"admin@trendsbird.test","password":"wrong"}' | jq
# → 401, same message as wrong-email case below

curl -s -X POST $API/auth/login -H "content-type: application/json" \
  -d '{"email":"nobody@trendsbird.test","password":"wrong"}' | jq
# → 401, identical message text to the one above

# --- Session ---
curl -s $API/auth/session -H "authorization: Bearer $ADMIN_TOKEN" | jq
# → 200, { permissions: [...41 items] }

curl -s -o /dev/null -w "%{http_code}\n" $API/auth/session
# → 401, no header at all

# --- Refresh + rotation ---
REFRESHED=$(curl -s -X POST $API/auth/refresh -H "content-type: application/json" \
  -d "{\"refreshToken\":\"$ADMIN_REFRESH\"}")
echo $REFRESHED | jq
NEW_REFRESH=$(echo $REFRESHED | jq -r '.data.refreshToken')
ADMIN_TOKEN=$(echo $REFRESHED | jq -r '.data.accessToken') # replace with the fresh one
# → 200, new tokens, different from the originals

# --- Reuse the OLD (now-rotated-out) refresh token — should be treated as theft ---
curl -s -X POST $API/auth/refresh -H "content-type: application/json" \
  -d "{\"refreshToken\":\"$ADMIN_REFRESH\"}" | jq
# → 401 "reuse detected" — and it should have just killed ALL of admin's sessions,
#   including the one from NEW_REFRESH above. Confirm:
curl -s -X POST $API/auth/refresh -H "content-type: application/json" \
  -d "{\"refreshToken\":\"$NEW_REFRESH\"}" | jq
# → 401 too — proves the "revoke all user tokens" behavior actually fired

# Log back in clean before continuing, since the above intentionally burned the session
LOGIN=$(curl -s -X POST $API/auth/login -H "content-type: application/json" \
  -d '{"email":"admin@trendsbird.test","password":"SuperAdmin!2026"}')
ADMIN_TOKEN=$(echo $LOGIN | jq -r '.data.accessToken')
ADMIN_REFRESH=$(echo $LOGIN | jq -r '.data.refreshToken')

# --- Logout — works WITHOUT a Bearer header, only the refresh token in the body ---
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/auth/logout -H "content-type: application/json" \
  -d "{\"refreshToken\":\"$ADMIN_REFRESH\"}"
# → 204

curl -s -X POST $API/auth/refresh -H "content-type: application/json" \
  -d "{\"refreshToken\":\"$ADMIN_REFRESH\"}" | jq
# → 401 — the revoked token really is dead now

# Re-login again for everything below
LOGIN=$(curl -s -X POST $API/auth/login -H "content-type: application/json" \
  -d '{"email":"admin@trendsbird.test","password":"SuperAdmin!2026"}')
ADMIN_TOKEN=$(echo $LOGIN | jq -r '.data.accessToken')
```

---

## 1. Permission

```bash
curl -s "$API/permissions/groups?limit=50" -H "authorization: Bearer $ADMIN_TOKEN" | jq
# → 200, all 9 seeded groups

GROUP=$(curl -s -X POST $API/permissions/groups -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"name":"Warehouse","description":"Stock ops","actions":[{"name":"watch"},{"name":"read"}]}')
echo $GROUP | jq
GROUP_ID=$(echo $GROUP | jq -r '.data.id')
# → 201, actions come back as "warehouse:watch", "warehouse:read"

curl -s $API/permissions/groups/$GROUP_ID -H "authorization: Bearer $ADMIN_TOKEN" | jq
# → 200

curl -s -X PATCH $API/permissions/groups/$GROUP_ID -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"description":"Stock and inventory ops"}' | jq
# → 200

CUSTOM_PERM=$(curl -s -X POST $API/permissions/groups/$GROUP_ID/actions -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"name":"Reorder Stock"}')
echo $CUSTOM_PERM | jq
# → 201 — custom action name, normalized to "warehouse:reorder-stock" (lowercase, spaces stripped)
PERM_ID=$(echo $CUSTOM_PERM | jq -r '.data.id')

curl -s -o /dev/null -w "%{http_code}\n" -X DELETE $API/permissions/$PERM_ID -H "authorization: Bearer $ADMIN_TOKEN"
# → 204

curl -s -o /dev/null -w "%{http_code}\n" -X DELETE $API/permissions/groups/$GROUP_ID -H "authorization: Bearer $ADMIN_TOKEN"
# → 204 — cascades the remaining permission's role_permissions rows too, harmless since nothing holds it

# --- 403 as catalog user ---
curl -s -o /dev/null -w "%{http_code}\n" $API/permissions/groups -H "authorization: Bearer $CATALOG_TOKEN"
# → 403
```

---

## 2. Role

```bash
ROLES=$(curl -s "$API/roles?limit=50" -H "authorization: Bearer $ADMIN_TOKEN")
echo $ROLES | jq
SUPER_ADMIN_ROLE_ID=$(echo $ROLES | jq -r '.data[] | select(.name=="Super Admin") | .id')

# Grab a couple of real permission ids to build a role with
PERMS=$(curl -s "$API/permissions/groups?limit=50" -H "authorization: Bearer $ADMIN_TOKEN")
CATEGORY_READ=$(echo $PERMS | jq -r '.data[] | select(.name=="Category") | .actions[] | select(.name=="category:read") | .id')
CATEGORY_WATCH=$(echo $PERMS | jq -r '.data[] | select(.name=="Category") | .actions[] | select(.name=="category:watch") | .id')

NEW_ROLE=$(curl -s -X POST $API/roles -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d "{\"name\":\"Category Viewer\",\"description\":\"read-only\",\"permissionIds\":[\"$CATEGORY_READ\",\"$CATEGORY_WATCH\"]}")
echo $NEW_ROLE | jq
NEW_ROLE_ID=$(echo $NEW_ROLE | jq -r '.data.id')
# → 201, permissions array has exactly 2 entries

curl -s $API/roles/$NEW_ROLE_ID -H "authorization: Bearer $ADMIN_TOKEN" | jq
# → 200, userCount: 0

# --- grant-all shortcut ---
curl -s -X POST $API/roles -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"name":"Second Admin","grantAll":true}' | jq '.data.permissions | length'
# → 41 — every permission in the system

# --- duplicate name rejected ---
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/roles -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"name":"Category Viewer","permissionIds":[]}'
# → 409

# --- the last-admin guard — the single most doc-explicit test in the whole build ---
ROLE_UPDATE_PERM=$(echo $PERMS | jq -r '.data[] | select(.name=="Role") | .actions[] | select(.name=="role:update") | .id')
curl -s -X PATCH $API/roles/$SUPER_ADMIN_ROLE_ID -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d "{\"permissionIds\":[\"$CATEGORY_READ\"]}" | jq
# → 403 "Cannot remove role:update — no other role would be left able to manage roles"
#   (assuming Super Admin is the ONLY role holding role:update at this point in the script —
#   if you created another admin-ish role earlier with grantAll, this will pass instead;
#   run it against a fresh seed to see the actual 403)

# --- delete blocked while users hold it ---
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE $API/roles/$SUPER_ADMIN_ROLE_ID -H "authorization: Bearer $ADMIN_TOKEN"
# → 409

# --- delete a role nobody holds ---
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE $API/roles/$NEW_ROLE_ID -H "authorization: Bearer $ADMIN_TOKEN"
# → 204

curl -s -o /dev/null -w "%{http_code}\n" $API/roles -H "authorization: Bearer $CATALOG_TOKEN"
# → 403
```

---

## 3. User

```bash
curl -s "$API/users?limit=50" -H "authorization: Bearer $ADMIN_TOKEN" | jq
# → 200

CATALOG_ROLE_ID=$(curl -s "$API/roles?limit=50" -H "authorization: Bearer $ADMIN_TOKEN" | jq -r '.data[] | select(.name=="Catalog Manager") | .id')

NEW_USER=$(curl -s -X POST $API/users -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"testuser@trendsbird.test\",\"password\":\"Password!2026\",\"roleId\":\"$CATALOG_ROLE_ID\"}")
echo $NEW_USER | jq
NEW_USER_ID=$(echo $NEW_USER | jq -r '.data.id')
# → 201 — response has NO password field, confirm with:
echo $NEW_USER | jq 'has("password")'  # → false — must be false, if true that's a real bug to fix now

# --- duplicate email ---
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/users -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d "{\"name\":\"Dup\",\"email\":\"testuser@trendsbird.test\",\"password\":\"Password!2026\",\"roleId\":\"$CATALOG_ROLE_ID\"}"
# → 409

# --- missing roleId — required, never defaulted ---
curl -s -X POST $API/users -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"name":"No Role","email":"norole@trendsbird.test","password":"Password!2026"}' | jq
# → 422

# --- deactivate, then confirm login is actually blocked ---
curl -s -X PATCH $API/users/$NEW_USER_ID/status -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"isActive":false}' | jq
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/auth/login -H "content-type: application/json" \
  -d '{"email":"testuser@trendsbird.test","password":"Password!2026"}'
# → 401 — inactive users can't log in even with the right password

curl -s -X PATCH $API/users/$NEW_USER_ID/status -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"isActive":true}' | jq

# --- self-escalation guard — get admin's own id from session, try to change own role ---
ADMIN_ID=$(curl -s $API/auth/session -H "authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.id')
curl -s -X PATCH $API/users/$ADMIN_ID -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d "{\"roleId\":\"$CATALOG_ROLE_ID\"}" | jq
# → 403 "You cannot change your own role"

# --- self-delete blocked ---
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE $API/users/$ADMIN_ID -H "authorization: Bearer $ADMIN_TOKEN"
# → 403

curl -s -o /dev/null -w "%{http_code}\n" -X DELETE $API/users/$NEW_USER_ID -H "authorization: Bearer $ADMIN_TOKEN"
# → 204

curl -s -o /dev/null -w "%{http_code}\n" $API/users -H "authorization: Bearer $CATALOG_TOKEN"
# → 403
```

---

## 4. Media

```bash
curl -o test.jpg -s https://picsum.photos/400  # throwaway real image if you don't have one

UPLOAD=$(curl -s -X POST $API/media -H "authorization: Bearer $ADMIN_TOKEN" -F "files=@./test.jpg")
echo $UPLOAD | jq
MEDIA_ID=$(echo $UPLOAD | jq -r '.data[0].id')
# → 201, thumbnailUrl populated

curl -s "$API/media?type=image&limit=20" -H "authorization: Bearer $ADMIN_TOKEN" | jq
# → 200

curl -s -X PATCH $API/media/$MEDIA_ID -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"altText":"Test image","title":"Test"}' | jq
# → 200

# --- the named MIME-spoofing test ---
echo "not an image" > fake.txt
curl -s -X POST $API/media -H "authorization: Bearer $ADMIN_TOKEN" -F "files=@./fake.txt;type=image/jpeg" | jq
# → 422, real magic-byte check catches the spoofed content-type header

# --- delete while attached (do this AFTER category test 5 below attaches it) ---
curl -s -X DELETE $API/media/$MEDIA_ID -H "authorization: Bearer $ADMIN_TOKEN" | jq
# → 409 "still attached to a category" IF you ran the category block below first with this exact MEDIA_ID;
#   otherwise → 204 since nothing's attached yet

curl -s -o /dev/null -w "%{http_code}\n" $API/media -H "authorization: Bearer $CATALOG_TOKEN"
# → 200 — Catalog Manager DOES have media:read, unlike everything above
```

---

## 5. Category

```bash
ELECTRONICS=$(curl -s -X POST $API/categories -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d "{\"name\":\"Electronics\",\"slug\":\"electronics\",\"imageId\":\"$MEDIA_ID\"}")
echo $ELECTRONICS | jq
ELECTRONICS_ID=$(echo $ELECTRONICS | jq -r '.data.id')
# → 201

PHONES=$(curl -s -X POST $API/categories -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d "{\"name\":\"Phones\",\"slug\":\"phones\",\"parentId\":\"$ELECTRONICS_ID\"}")
PHONES_ID=$(echo $PHONES | jq -r '.data.id')
# → 201

curl -s $API/categories/tree -H "authorization: Bearer $ADMIN_TOKEN" | jq
# → 200, Electronics with Phones nested inside

# --- duplicate slug ---
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/categories -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"name":"Dup","slug":"electronics"}'
# → 409

# --- the named cycle test ---
curl -s -X PATCH $API/categories/$ELECTRONICS_ID -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d "{\"parentId\":\"$PHONES_ID\"}" | jq
# → 422 "would make the category its own ancestor"

# --- delete blocked by child ---
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE $API/categories/$ELECTRONICS_ID -H "authorization: Bearer $ADMIN_TOKEN"
# → 409

curl -s -o /dev/null -w "%{http_code}\n" -X DELETE $API/categories/$PHONES_ID -H "authorization: Bearer $ADMIN_TOKEN"
# → 204 — leaf node, no children, safe to delete

curl -s -o /dev/null -w "%{http_code}\n" $API/categories -H "authorization: Bearer $CATALOG_TOKEN"
# → 200
```

---

## 6. Brand

```bash
BRAND=$(curl -s -X POST $API/brands -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"name":"Acme","slug":"acme"}')
echo $BRAND | jq
BRAND_ID=$(echo $BRAND | jq -r '.data.id')
# → 201

curl -s "$API/brands?status=active&limit=20" -H "authorization: Bearer $ADMIN_TOKEN" | jq
# → 200

curl -s -X PATCH $API/brands/$BRAND_ID -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"status":"inactive"}' | jq
# → 200

curl -s -o /dev/null -w "%{http_code}\n" -X DELETE $API/brands/$BRAND_ID -H "authorization: Bearer $ADMIN_TOKEN"
# → 204 — no product module built, so nothing CAN reference it; this is the one check
#   you can't actually exercise end-to-end given Product was popped out. Say so in the README.

curl -s -o /dev/null -w "%{http_code}\n" $API/brands -H "authorization: Bearer $CATALOG_TOKEN"
# → 200
```

---

## 7. Attribute

```bash
COLOUR=$(curl -s -X POST $API/attributes -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"name":"Colour","slug":"colour","type":"colour_swatch"}')
echo $COLOUR | jq
COLOUR_ID=$(echo $COLOUR | jq -r '.data.id')
# → 201

RED=$(curl -s -X POST $API/attributes/$COLOUR_ID/values -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"value":"Red","slug":"red","hexCode":"#FF0000"}')
echo $RED | jq
RED_ID=$(echo $RED | jq -r '.data.id')
# → 201

# --- duplicate value within the same attribute ---
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/attributes/$COLOUR_ID/values -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"value":"Red","slug":"red-2","hexCode":"#CC0000"}'
# → 409

# --- same value name under a DIFFERENT attribute — must be allowed ---
SIZE=$(curl -s -X POST $API/attributes -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"name":"Finish","slug":"finish","type":"dropdown"}')
SIZE_ID=$(echo $SIZE | jq -r '.data.id')
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/attributes/$SIZE_ID/values -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"value":"Red","slug":"red"}'
# → 201 — "Red" exists under Colour already, but that's a different attribute, so this must succeed

# --- delete attribute blocked while it still has values ---
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE $API/attributes/$COLOUR_ID -H "authorization: Bearer $ADMIN_TOKEN"
# → 409

curl -s -o /dev/null -w "%{http_code}\n" -X DELETE $API/attributes/$COLOUR_ID/values/$RED_ID -H "authorization: Bearer $ADMIN_TOKEN"
# → 204 — value alone, unattached to any variant (no Product module = nothing can reference it)

curl -s -o /dev/null -w "%{http_code}\n" -X DELETE $API/attributes/$COLOUR_ID -H "authorization: Bearer $ADMIN_TOKEN"
# → 204 — now empty, delete succeeds

curl -s -o /dev/null -w "%{http_code}\n" $API/attributes -H "authorization: Bearer $CATALOG_TOKEN"
# → 200
```

---

## 8. Cross-cutting checks, run last

```bash
# Every one of these should be 401 — no header, no module-specific logic needed
for path in permissions/groups roles users media categories brands attributes; do
  code=$(curl -s -o /dev/null -w "%{http_code}" $API/$path)
  echo "$path (no token): $code"
done

# Malformed token — must be 401, not a 500
curl -s -o /dev/null -w "%{http_code}\n" $API/roles -H "authorization: Bearer garbage.not.a.jwt"
# → 401

# Nonexistent id on a real, permitted route — must be 404, not 500
curl -s $API/categories/00000000-0000-0000-0000-000000000000 -H "authorization: Bearer $ADMIN_TOKEN" | jq
# → 404, clean JSON, no stack trace
```

That last block is the one worth not skipping — a malformed UUID hitting a `.where(eq(table.id, req.params.id))` query is exactly the kind of "predictable bad input" the doc says must never produce a 500. If any of these come back 500 instead of 404/401, that's a real bug worth fixing before submission, not a test artifact.

Save the whole thing as `test-api.sh` if you want to rerun it after any change — just re-seed the DB first (`npm run db:migrate && npm run db:seed`) since several of these calls mutate state and aren't idempotent on a second run.
