---
name: taskhauler
description: Drive the Taskhauler API (boards, columns, epics, cards, comments, service accounts). Use whenever the user asks to create, list, update, move, comment on, or delete Taskhauler boards/cards/etc., or wants to automate interaction with the Task Hauler board itself. Knows the auth flow, the endpoint shapes, the mock-card-N bridge, and the URL conventions (taskhauler-v2.localhost/<PREFIX>/<num>).
---

# Taskhauler skill

Drive the Taskhauler REST API to create / read / update / delete the product's domain entities. This is the canonical reference for any agent that wants to act on a board.

## When to use

- User says "create a board", "add a task", "list cards", "move TH-45 to Done", "comment on TH-100", "delete that comment".
- User says "open TH-45" or "share a link to that card" → produce the URL (see [URL conventions](#url-conventions)).
- User wants to seed test data, migrate cards between boards, or run bulk operations.
- Building higher-level skills on top (triage, sprint planning, agent dispatch).

## Don't use when

- The user is just asking a question about the codebase — no API call needed.
- The user wants to *modify* the API itself (handler code, schema, etc.) — that's a code change task, not a skill invocation.
- You're running tests — use `task` commands or `vitest`/`go test` directly.

## Auth quickstart

The API is at `http://taskhauler.localhost/api/v1` (or `https://taskhauler.antimatter-studios.com/api/v1` in prod). Every endpoint except `/health`, `/auth/login`, `/auth/refresh`, and `/openapi.json` requires a Bearer token.

### Login as a user

```bash
TOKEN="$(curl -sf -X POST \
  -H 'Content-Type: application/json' \
  -d '{"email":"chris@teamagentica.localhost","password":"<password>"}' \
  http://taskhauler.localhost/api/v1/auth/login \
  | jq -r .access_token)"
```

Access tokens expire in 1h. Use `/auth/refresh` with a refresh token to get a new access token. The frontend's `apiClient` does this automatically; in scripts, just re-login if needed — it's fast.

### Use a service-account token

Service-account tokens are long-lived bearer strings prefixed `tha_`. Pass them in the same `Authorization: Bearer` header. They route to a different validation path on the backend but the calling convention is identical.

### Test the token

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://taskhauler.localhost/api/v1/auth/me | jq
# → {"id":3,"email":"chris@teamagentica.localhost","display_name":"Chris","is_admin":true,...}
```

## Request convention

Set these once at the top of any script:

```bash
API="${API:-http://taskhauler.localhost/api/v1}"
H=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")
```

Then every call looks like:

```bash
curl -sf -X GET    "${H[@]}" "$API/boards"
curl -sf -X POST   "${H[@]}" -d '{"name":"Foo"}' "$API/boards"
curl -sf -X PUT    "${H[@]}" -d '{"name":"Bar"}' "$API/boards/$ID"
curl -sf -X DELETE "${H[@]}" "$API/boards/$ID"
```

**Use Python or `--rawfile` for any body that spans multiple lines** — bash heredoc + jq inline can choke on control characters inside the body (newlines especially). See [Robust multi-line bodies](#robust-multi-line-bodies-for-descriptions--comments) below.

## Entity reference

### Boards

```
GET    /boards                       → Board[]
POST   /boards                       body: { name, prefix?, description? }   → Board
GET    /boards/{id}                  → Board
PUT    /boards/{id}                  body: { name?, prefix?, description? }  → Board
DELETE /boards/{id}                  → 204
```

**Prefix auto-derivation.** If you POST a board with `name` but no `prefix`, the backend derives one from the name (multi-word: word initials; single-word: first 4 chars; stop words "the/a/an/of/for/and" dropped). If the derived prefix already exists, a counter is appended (`INFR`, `INFR2`, `INFR3`). To override, pass an explicit `prefix`.

**Board shape:**
```ts
{ id: string, name: string, prefix: string, description: string,
  created_at: number (millis), updated_at: number, deleted_at: null|number }
```

### Columns (nested under board)

```
GET    /boards/{id}/columns
POST   /boards/{id}/columns          body: { name, position }
PUT    /boards/{id}/columns/{cid}    body: { name?, position? }
DELETE /boards/{id}/columns/{cid}    → 204
```

Position is a `float` so you can splice columns without renumbering. Convention: positions 0/1/2/3 for new boards; subsequent inserts use midpoints (see `lib/positions.ts` in the frontend for the algorithm).

### Epics (nested under board)

```
GET    /boards/{id}/epics
POST   /boards/{id}/epics            body: { name, description?, color, position }
PUT    /boards/{id}/epics/{eid}      body: { name?, description?, color?, position? }
DELETE /boards/{id}/epics/{eid}      → 204  (cards keep their epic_id pointer, just dangle)
```

`color` is a hex string (e.g. `#5b5bd6`). Used for the EpicChip dot + swimlane left-stripe.

### Cards (nested under board, but per-card endpoints use /cards/{cid})

```
GET    /boards/{id}/cards            → Card[] (with assignee_name + status_name enriched)
GET    /boards/{id}/cards/search?q=  → Card[] (server-side LIKE on title/description/labels)
POST   /boards/{id}/cards            body: { column_id, epic_id?, title, description?, ... }
GET    /cards/{cid}                  → Card
GET    /boards/{id}/cards/number/{num}  → Card    (lookup by card.number)
PUT    /boards/{id}/cards/{cid}      body: any subset of fields
DELETE /boards/{id}/cards/{cid}      → 204
```

**Card shape (full):**
```ts
{ id: string, number: int, board_id, column_id, epic_id, title, description,
  card_type: "task"|"bug"|"", priority: "low"|"medium"|"high"|"urgent"|"",
  assignee_id: int (0=none), assignee_agent: string ("" = none),
  assignee_name: string (server-enriched, never accept on POST),
  status_name: string (server-enriched, column.name),
  labels: string (comma-separated), due_date: int|null (millis),
  position: float, created_at, updated_at, deleted_at }
```

**Move a card** = PUT with the new `column_id` (and optionally `position`).
**Reassign** = PUT with new `assignee_id` OR `assignee_agent`.
**Reschedule** = PUT with new `due_date`.

### Comments (nested under card)

```
GET    /cards/{cid}/comments              → Comment[] (with author_name enriched)
POST   /cards/{cid}/comments              body: { body }   → Comment
DELETE /cards/{cid}/comments/{cmid}       → 204
```

**Comment shape:**
```ts
{ id: string, card_id, author_id: int, author_name: string,
  body: string, created_at: number, deleted_at: null|number }
```

The author is taken from the auth token (no need to send `author_id`).

### MCP tool endpoints

The same operations are exposed under `/mcp/*` with the MCP convention (one POST per tool, request body matches the tool schema). Useful when an MCP client (Claude Code, Claude Desktop) is driving. See `GET /api/v1/mcp` for the full tool registry; 15 tools cover boards/epics/tasks/comments.

### Service accounts (admin-only)

```
GET    /service-accounts                              → User[] (is_service_account=true)
POST   /service-accounts                              body: { name, display_name } → { user, token: "tha_..." }
POST   /service-accounts/{id}/tokens                  → { token } (issue another)
DELETE /service-accounts/tokens/{token_id}            → 204 (revoke)
```

The token is shown **once** at issuance and is unrecoverable — store it immediately.

## URL conventions

The v2 frontend uses path-based routing. URLs are shareable:

- `http://taskhauler-v2.localhost/` → root, shows first board
- `http://taskhauler-v2.localhost/<PREFIX>` → board with that prefix
- `http://taskhauler-v2.localhost/<PREFIX>/<num>` → board, card #num selected

Examples:
- `http://taskhauler-v2.localhost/TH/100` → opens the Task Hauler board, selects TH-100
- `http://taskhauler-v2.localhost/V2/45` → opens the V2 board, selects V2-45

The trailing segment is parsed loosely — `/TH/100` and `/TH/TH-100` both work (regex extracts the digits).

When the user asks to "open" or "share" a specific card, produce the URL using the board's `prefix` field + the card's `number` field.

## Common patterns

### Find a card by its ref (e.g. "TH-100")

1. Parse the ref: split on `-` → prefix, number.
2. List boards: `GET /boards`.
3. Find the board with matching prefix (case-insensitive).
4. `GET /boards/{boardId}/cards/number/{number}` → the card directly.

```python
import json, urllib.request

def find_card(ref, api, token):
    prefix, num = ref.split("-", 1); num = int(num)
    h = {"Authorization": f"Bearer {token}"}
    boards = json.load(urllib.request.urlopen(urllib.request.Request(f"{api}/boards", headers=h)))
    board = next((b for b in boards if (b["prefix"] or "").upper() == prefix.upper()), None)
    if not board: return None
    return json.load(urllib.request.urlopen(urllib.request.Request(f"{api}/boards/{board['id']}/cards/number/{num}", headers=h)))
```

### Move a card between columns

```bash
# 1. Get the column id (cache this if you'll move many cards)
COL_DONE=$(curl -sf "${H[@]}" "$API/boards/$BOARD/columns" | jq -r '.[] | select(.name == "Done") | .id')

# 2. PUT the card
curl -sf -X PUT "${H[@]}" -d "{\"column_id\": \"$COL_DONE\"}" "$API/boards/$BOARD/cards/$CARD"
```

### Add a comment with read-back verification

This is the recommended pattern when the comment content matters (e.g. recording validation findings on a card). It writes the comment, reads it back, and asserts byte-equal so you know the body landed exactly as sent.

```python
import json, urllib.request, os

api    = os.environ["API"]
token  = os.environ["TOKEN"]
card_id = "..."
body    = """Multi-line comment body
with special chars (`backticks`, $dollar signs, etc.)"""

H = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# POST
data = json.dumps({"body": body}).encode("utf-8")
req  = urllib.request.Request(f"{api}/cards/{card_id}/comments", data=data, headers=H, method="POST")
posted = json.load(urllib.request.urlopen(req))
pid = posted["id"]

# Read back
comments = json.load(urllib.request.urlopen(urllib.request.Request(f"{api}/cards/{card_id}/comments", headers=H)))
actual = next((c["body"] for c in comments if c["id"] == pid), None)
assert actual == body, f"comment body mismatch on {pid}"
print(f"✓ comment {pid[:8]} on {card_id[:8]}")
```

**Always use Python (or `jq --rawfile`) for multi-line bodies.** Bash heredoc + inline `jq -n --arg b "$BODY"` will choke on the raw newlines in the body before the JSON is even constructed.

### Bulk-create cards

```python
import json, urllib.request, os
api = os.environ["API"]; token = os.environ["TOKEN"]; board_id = os.environ["BOARD"]; col_id = os.environ["COL"]
H = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

cards_to_create = [
    {"title": "Card 1", "description": "...", "priority": "high"},
    {"title": "Card 2", "description": "...", "priority": "low"},
    # ...
]
created = []
for c in cards_to_create:
    body = {**c, "column_id": col_id, "card_type": "task"}
    req = urllib.request.Request(f"{api}/boards/{board_id}/cards", data=json.dumps(body).encode(), headers=H, method="POST")
    created.append(json.load(urllib.request.urlopen(req)))

print(f"created {len(created)} cards")
```

### Move card to In Progress / Done with comment

```python
def transition(card_id, target_column_id, why):
    # Move
    req = urllib.request.Request(f"{api}/boards/{board}/cards/{card_id}",
        data=json.dumps({"column_id": target_column_id}).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, method="PUT")
    urllib.request.urlopen(req)
    # Comment
    req = urllib.request.Request(f"{api}/cards/{card_id}/comments",
        data=json.dumps({"body": why}).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, method="POST")
    urllib.request.urlopen(req)
```

### Search cards across a board

```bash
curl -sf "${H[@]}" "$API/boards/$BOARD/cards/search?q=oauth" | jq '.[] | {number, title, priority}'
```

Server-side LIKE on title + description + labels. Case-insensitive when running against Postgres (the production stack); case-sensitive when running against SQLite (the dev/test stack — note for test isolation).

## Mock-card-N bridge (frontend-specific)

The v2 frontend's `src/mock/` files reference cards by placeholder strings like `mock-card-1`, `mock-card-2`, etc. These are resolved at render time to the Nth real card sorted by `number`. If you're writing skill code that touches the mock-data layer, use the resolver in `frontend-v2/src/components/board/rail/CardDetailPanel.tsx` (or copy it).

When the corresponding real API endpoints exist (TH-76 activity feed, TH-80 suggestions, etc.), this bridge gets removed and consumers read real `card_id`s.

## Robust multi-line bodies for descriptions / comments

When the body contains newlines, special chars, or shell metacharacters, prefer this Python idiom over bash heredoc + jq:

```python
import json, urllib.request

body = """Line 1
Line 2 with `backticks` and $dollars and "quotes" and 'apostrophes'"""

req = urllib.request.Request(
    f"{api}/cards/{cid}/comments",
    data=json.dumps({"body": body}).encode("utf-8"),
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    method="POST",
)
urllib.request.urlopen(req)
```

If you must use bash, write the body to a file first and `jq --rawfile`:

```bash
cat > /tmp/body.txt <<'EOF'
Multi-line body with `backticks` and $vars preserved
because the heredoc is quoted ('EOF' not EOF).
EOF
curl -sf -X POST "${H[@]}" \
  -d "$(jq -n --rawfile b /tmp/body.txt '{body: $b}')" \
  "$API/cards/$cid/comments"
```

## Error handling

Every endpoint returns a JSON error body on 4xx/5xx:

```json
{ "error": "human-readable message" }
```

The most common errors:

- **401** — token expired or missing. Re-run login.
- **403** — endpoint requires admin (service-accounts/*).
- **404** — entity not found (wrong id, soft-deleted, etc.).
- **400** — request body validation failed; the `error` message names the field.
- **500** — server error; usually a constraint violation. Common one: trying to create a second board with an empty/duplicate prefix → that's [TH-20](http://taskhauler-v2.localhost/TH/20) but only on legacy schema.

`curl -sf` exits non-zero on 4xx/5xx — use that for error handling. For more detail, drop the `-f` and inspect the body.

## Don't

- **Don't write the token to disk or commit it.** Re-login is fast; tokens are short-lived for a reason.
- **Don't `INSERT` into the database directly.** Use the API so events (TH-17) fire and triggers run. If you absolutely must (e.g. migration), use `task psql` and document why in a comment.
- **Don't bypass the prefix derivation when bulk-creating boards** — let the backend pick. Only override with `prefix` when you specifically need a non-default value, and remember the unique-after-trim-uppercase rule.
- **Don't construct JSON by string concatenation in bash.** Use `jq -n --arg` (single-line) or Python (multi-line) — escaping bugs are silent and hard to debug.
- **Don't assume a column named "Done" exists.** Always list columns and either match by name (case-insensitive) or by an explicit `done_column_id` configured elsewhere.

## Anchors

- Backend source: `backend-v1/internal/handlers/handlers.go`, `internal/auth/`, `internal/storage/`
- OpenAPI spec: `backend-v1/openapi.json` (37 paths, 95 schemas)
- Frontend API client: `frontend-v2/src/api/client.ts` (TypeScript reference impl)
- Task Hauler board id: `aa4c87b6-bde7-4394-9db5-f59325e3aca0` (prefix `TH`)
- Repo: https://github.com/antimatter-studios/taskhauler
