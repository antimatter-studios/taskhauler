# ZITADEL migration plan

> Status: planned, not yet implemented. TaskHauler is currently on local JWT auth (email + bcrypt password + service-account tokens). This doc captures the eventual move to a central ZITADEL-based IdP serving the whole Antimatter Studios ecosystem.

## Why ZITADEL

The wider goal is a federated identity layer across multiple personal/product sites — TaskHauler, Team Agentica, EYED, Antimatter Studios, chris-alex-thomas.com, Decentrali.se — so a single account works across all of them with proper SSO.

Requirements that drove the choice:

- Self-hosted, open source
- Speaks OIDC downstream so apps stay vendor-neutral
- Can broker upstream providers (Google, X/Twitter) so users get familiar login options
- Lighter than Keycloak (no JVM, no multi-GB memory floor)
- Not Python (rules out Authentik)
- Active project with bus factor > 1 (rules out solo-maintained options)

Shortlist evaluated: Keycloak (too heavy), Authentik (Python), Pocket ID (no upstream brokering), Logto (TypeScript), Ory stack (too modular for one operator), Kanidm (Rust, smaller community). **ZITADEL fits all the criteria** — Go, Apache 2.0, single binary + Postgres, built-in brokering, native passkey support, multi-org, decent admin UI.

The OIDC abstraction means this decision is reversible — apps federate to whatever IdP speaks OIDC. ZITADEL today, something else later, no app code changes.

## The architecture

```
                ┌───────────────────────────┐
                │  id.decentrali.se         │
                │  (ZITADEL — central IdP)  │
                │                            │
                │  ↑ upstream connectors:   │
                │    Google, X, future DID  │
                └─────────────┬──────────────┘
                              │ OIDC
        ┌───────┬─────────────┼─────────────┬─────────────┐
        ▼       ▼             ▼             ▼             ▼
       TA      TH            EYED      AS site / c-a-t.com  Decentrali.se
   (all relying parties — each gets audience-scoped tokens)
```

Key properties:

- **One identity per human, used across all products.** Sign up once, account works everywhere you're granted access.
- **Audience-scoped tokens.** A TaskHauler token cannot be presented to EYED — the `aud` claim binds it.
- **Silent re-authentication across products.** Existing ZITADEL session means no password prompt when bouncing between products.
- **Per-product access control.** Identity ≠ access. Each product decides who's allowed via ZITADEL project grants + its own `users` table.
- **ZITADEL is invisible to end users.** Custom branding, custom domain (`id.decentrali.se`), no ZITADEL chrome, no ZITADEL signup forms. Each product has its own branded signup that calls ZITADEL's API behind the scenes.

## Identity vs. authorization (the important split)

These are two separate concerns and the architecture treats them separately:

| Layer | Owned by | Stores | Example |
|---|---|---|---|
| Identity | ZITADEL | email, password/passkey, MFA factors, sessions | "alice@example.com is a real human, here's her zitadel_id" |
| Product user | Each product's own DB | display_name, preferences, role, billing, ... | TaskHauler knows alice has 3 boards, is_admin=false |

Every product has its own `users` table with a `zitadel_id` foreign key. The columns split:

```
ZITADEL (identity layer)
  Alice → zitadel_id 12345, email, password/passkey, MFA, sessions

TaskHauler.users (product layer)
  id 1, zitadel_id 12345, display_name "Alice", default_board, preferences

TA.users (product layer)
  id 1, zitadel_id 12345, display_name "Alice", agent_quota, billing_plan

EYED.users (product layer — degenerate, single-tenant)
  id 1, zitadel_id <yours>
```

This is what enables firm lines between products: each product owns its own user list and access policy.

## Per-product policies

| Product | ZITADEL Project Grant | Onboarding flow | User table |
|---|---|---|---|
| EYED | Only Chris's zitadel_id | None (no signups) | One row, hardcoded |
| TaskHauler | Open / per-user (TBD) | Display name only | JIT-create on first login |
| TA | Curated (invite or paid) | Terms + use-case + payment | Admin-provisioned |
| Decentrali.se | Open public signup | Handle + bio + avatar | JIT-create |
| Antimatter Studios marketing | n/a | n/a (no auth) | n/a |
| chris-alex-thomas.com | n/a | n/a (no auth) | n/a |

## What happens when an authenticated user with no access visits a product

Example: Bob (Decentrali.se user) clicks an EYED link someone shared.

```
EYED says "auth required" → redirects to id.decentrali.se
ZITADEL checks: does Bob have a Project Grant for EYED?
  No → ZITADEL shows "you don't have access to this application"
       Bob never gets a token. EYED is never reached.
```

Defense in depth: even if a token somehow arrives at EYED with the wrong subject, EYED's code checks `users WHERE zitadel_id = ?` and 403s if not found.

## Interim state (where TaskHauler is today)

TaskHauler ships with local auth:

- `users` table with email, bcrypt `password_hash`, display_name, is_admin, is_service_account
- `POST /api/v1/auth/login` → email+password → JWT (HS256, signed with `JWT_SECRET`)
- Service-account tokens (`tha_<hex>`) for non-interactive callers — these stay unchanged after the ZITADEL migration

The schema is already migration-friendly because the canonical user reference is an opaque auto-increment `id`, not `email`. All FK references (`cards.assignee_id`, `comments.author_id`, etc.) point at `users.id` and will keep working through the migration without rewrites.

### Three prep steps to do soon (not yet implemented)

1. **Add nullable `external_id` column to `users`**
   ```sql
   ALTER TABLE users ADD COLUMN external_id TEXT;
   CREATE INDEX idx_users_external_id ON users (external_id)
     WHERE external_id IS NOT NULL;
   ```
   Stays NULL for everyone until migration; afterwards holds the ZITADEL user ID.

2. **Introduce an `AuthProvider` interface in the auth package**
   ```go
   type AuthProvider interface {
       Authenticate(c *gin.Context) (userID uint, isAdmin bool, err error)
   }
   ```
   Today's only implementation: `LocalAuthProvider` (bcrypt + JWT). Future: `OIDCAuthProvider` validates ZITADEL tokens and looks up users by `external_id`. The login handler routes through this interface; nothing else in the app knows what kind of auth is in use.

3. **Enforce that no non-auth code references `email`**
   Audit pass: every `WHERE email = $1` becomes `WHERE id = $1`. Email migrates out to ZITADEL; `id` stays. If we keep the rest of the codebase email-free, the migration is painless.

These three steps are cheap (~half a day total) and let the migration itself be a config flip plus a one-off script.

## Migration plan (run when ZITADEL is up)

1. **Stand up ZITADEL.**
   - Deploy to `id.decentrali.se` (or wherever you've decided)
   - Postgres backing store
   - Custom domain + TLS
   - Disable self-registration on the IdP-hosted UI
   - Apply branding (logo, colors, "Sign in to Decentrali.se" text)
   - Configure SMTP for verification / reset emails to come from your domain
   - Create a Project per product (EYED, TaskHauler, TA, Decentrali.se)
   - Issue a service-user API token for each product to call ZITADEL on behalf of its signup forms

2. **Provision identities for existing TaskHauler users.**
   Write a one-off Go script in `backend/cmd/zitadel-migrate/`:
   ```
   for each row in users where external_id is null:
       call ZITADEL ImportHumanUser API
         - email = users.email
         - password_hash = users.password_hash  (ZITADEL imports bcrypt)
         - is_admin → ZITADEL role
       receive: zitadel_user_id
       update users set external_id = zitadel_user_id where id = row.id
   ```
   Idempotent — re-running it skips already-migrated rows.

3. **Add `OIDCAuthProvider` implementation.**
   - Validates incoming token against ZITADEL's JWKS at `id.decentrali.se/.well-known/jwks.json`
   - Extracts `sub` claim (the ZITADEL user ID)
   - Looks up local `users WHERE external_id = $sub`
   - Sets `c.Set("user_id", ...)` same as `LocalAuthProvider` does today

4. **Flip the config flag.**
   `AUTH_PROVIDER=oidc` (was `local`). Frontend's login route changes from "show password form" to "redirect to id.decentrali.se/oauth/authorize?client_id=taskhauler&...". Login flow becomes OIDC. Service-account tokens unchanged.

5. **Drop legacy columns (eventually).**
   After confirming everyone uses OIDC: drop `users.password_hash`, drop `users.email` (read from token claims when needed). Keep `display_name`, `is_admin`, `is_service_account`, `created_at`.

Estimated migration day effort: 4 hours focused, assuming the prep steps were done and the auth code wasn't touched in unusual ways in the interim.

## Decisions still pending

- **Domain for the IdP** — `id.decentrali.se`, `id.antimatter-studios.com`, or `auth.antimatter-studios.com`. Currently leaning `id.decentrali.se` but it ties identity to one product's brand. Worth re-deciding before launch.
- **Tension with Decentrali.se being "decentralized"** — central ZITADEL undercuts the decentralized pitch if taken literally. Three honest paths: (a) pragmatic, ZITADEL handles "the platform side" while DIDs handle the social-network content layer; (b) interim, ZITADEL now, DID-based later; (c) re-scope the "decentralized" branding. Not deciding now; flagging for later.
- **Strict shadowing vs local-only allowed** — should TaskHauler ever have local users with `zitadel_id = NULL`? Recommendation: **start strict** (NOT NULL FK after migration). Easier to relax later than to clean up NULL rows.
- **Self-service ZITADEL project grants** — when TaskHauler is open-signup, does signing up auto-grant the project? Or does ZITADEL have an "auto-grant on first authn" rule? Need to check ZITADEL's project-grant mechanics in detail before migration.
- **Sequencing** — do we migrate TaskHauler first as the proving ground, or build TA from scratch as OIDC-native and use it to validate the ZITADEL setup? Probably TaskHauler first (more existing data to migrate, higher value to de-risk).

## When NOT to migrate

The local auth in TaskHauler is fine. There's no urgency to migrate to ZITADEL until at least one of these is true:

- A second product exists that needs the same users (TA, Decentrali.se, etc.)
- An external integration needs auth (e.g. a Slack bot acting on behalf of TaskHauler users)
- The product gets a real userbase (Google login becomes a real UX win)

For solo use with a handful of test accounts: the current local auth is genuinely simpler and works fine.

## Cross-references

- [README.md](../README.md) — project overview, current local auth setup
- [backend/internal/auth/](../backend/internal/auth/) — current auth implementation that the migration replaces
- [ZITADEL docs](https://zitadel.com/docs) — upstream documentation
- [ZITADEL on GitHub](https://github.com/zitadel/zitadel) — Apache 2.0, Go
