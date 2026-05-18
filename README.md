# taskhauler

A standalone task tracker. Deployable on its own, usable by humans, drivable by agents as first-class clients via REST, MCP, and packaged skills.

> Status: in-progress build. Source code lives in this monorepo. Design notes below are still being refined as the implementation lands.

**Repository:** https://github.com/antimatter-studios/taskhauler

## Layout

Monorepo with three deployable units:

```
backend/      Go service (gin + GORM + Postgres). REST + MCP under /api/v1.
              JWT auth, service-account tokens, OpenAPI spec generated from source.
frontend/     React app (Vite, Tailwind v4, Radix UI). Kanban board, epics, sub-boards.
              Talks to backend over /api/v1; same-origin in production.
website/      Marketing site (separate Vite + React + Tailwind project). Fully static.
Taskfile.yml  Orchestrator — raw `docker run` for postgres, backend, frontend, website.
              DDT (docker-dev-tools) provides the reverse proxy + .localhost DNS.
```

## Design notes

- [docs/zitadel.md](docs/zitadel.md) — planned migration from local JWT auth to a central ZITADEL-based IdP serving the whole Antimatter Studios ecosystem.

## Quick start (local dev)

Prerequisites: Docker, [task](https://taskfile.dev), [ddt](https://github.com/antimatter-studios/ddt).

```sh
ddt start             # bring up DDT proxy + DNS
task setup            # one-time: create network, pull images
task dev              # start everything in HMR mode
task urls             # show the URLs to open
```

Open:
- App — http://taskhauler.localhost
- Marketing — http://marketing.taskhauler.localhost
- API — http://taskhauler.localhost/api/v1
- OpenAPI spec — http://taskhauler.localhost/api/v1/openapi.json

Default login: `admin@taskhauler.localhost` / `admin` (override via `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

### Importing existing teamagentica data

The original tracker's SQLite DB can be copied in idempotently:

```sh
task import           # reads TA's tasks.db read-only, writes to taskhauler postgres
```

## Production builds

```sh
task prod             # compiled backend + nginx-served frontend/website
```


## Positioning

Taskhauler is a general-purpose task tracker. That's the primary product. It happens to be designed from the start so agent runtimes can use it as easily as humans can — but you don't need agents (or any specific kind of project) to get value from it.

Concretely that means:

- Runs standalone. No dependency on any agent platform to deploy or use.
- **Domain-agnostic.** Track agentic projects, software projects without agents, personal todos, household stuff, research notes — whatever. Vocabulary and data model stay neutral.
- Human UI is a first-class surface, not an afterthought.
- The API has parity with the UI: anything a human can do, an agent (or any external system) can do via API.

It's being extracted from teamagentica, where it currently lives as an in-process component. Embedding it there pulled the design toward "agent task" semantics and made it awkward to use for anything else — splitting frees it from that gravity. Teamagentica will become one consumer among many, not the host.

## Why split it out

The tracker inside teamagentica is good but limited by being embedded in a platform that isn't *about* task tracking. TA has accumulated unrelated components; pulling this one out is good for both sides:

- **For taskhauler:** it can evolve on its own roadmap, deploy independently, and grow features (integrations, automations, UI) without having to justify them inside TA's scope.
- **For teamagentica:** stops overloading the platform with software components that don't belong to its core purpose. TA keeps its existing UI for tasks and pulls data via the taskhauler API instead of owning the storage and logic.
- Clean API contract instead of internal coupling.
- Independent deploy, scaling, auth lifecycle.
- Lets the agent-integration story develop without dragging the tracker product around with it.

Tradeoff: another service to run, another contract to version. And TA now has a network dependency where it previously had an in-process call — needs caching / graceful degradation for the UI to stay snappy.

## UI (v1)

The starting point is a clone of teamagentica's existing tracker UI: a **kanban board** with support for **epics** and **multiple sub-boards** scoped to specific topics. That UI already works in practice — no reason to redesign before extraction.

- Kanban is the primary view (columns = statuses, cards = tasks).
- Epics group related tasks across the board.
- Sub-boards let a single project host multiple focused views instead of one giant board.

Other views (list, calendar, timeline) are out of scope for v1.

## Core model (draft)

- **Project** — top-level container, owned by a user or org.
- **Board** — a kanban surface inside a project. A project can have one or many (the "sub-boards" concept).
- **Epic** — groups related tasks; can span columns and sub-boards within a project.
- **Task** — card on a board. Title, description, status (= column), priority, labels, assignee, external refs, optional epic.
- **Comment / activity** — append-only log on a task.
- **Trigger / automation** — optional rules that fire on events.

Open: are sub-boards just *filtered views* of one underlying board, or genuinely separate boards with their own column sets? TA's behaviour should decide this.

Open: sub-tasks / dependencies in v1? Lean: punt.

## How agents and integrations talk to it

Three parallel surfaces, all backed by the same core operations:

### 1. REST + webhooks

Predictable JSON, stable IDs, idempotent writes, paginated lists, since-cursors, structured error reasons.

- `POST /projects/:id/tasks` — create
- `GET /projects/:id/tasks?status=…&updated_since=…` — list
- `PATCH /tasks/:id` — update
- `POST /tasks/:id/comments` — append activity
- `POST /webhooks/github` — inbound integration
- `POST /webhooks/outbound` — register a sink

Open: GraphQL or REST? Lean REST.

### 2. MCP server

A first-class MCP server exposes the same operations as tools, so any MCP-capable agent (Claude Desktop, Claude Code, other clients) can drive TH without writing HTTP plumbing. Examples of tools to expose:

- `taskhauler.create_task`, `taskhauler.update_task`, `taskhauler.list_tasks`
- `taskhauler.add_comment`, `taskhauler.move_to_column`
- `taskhauler.create_epic`, `taskhauler.link_task_to_epic`

Auth via scoped tokens passed in MCP config. The MCP server is just a thin adapter over the REST API — single source of truth on the server side.

### 3. Skills

Packaged agent skills (Claude Code skills, and equivalents for other runtimes) that wrap the common patterns rather than exposing raw CRUD. The point of skills is workflow ergonomics:

- `record-work` — agent finishes a task and posts a structured result with links, artifacts, and status change.
- `triage-incoming` — given a freeform request, pick project/board/labels and create the task.
- `pick-next` — find the highest-priority `agent-ready` task assigned to me.
- `report-blocked` — add a comment with reason and move card to a blocked column.

Skills compose with the MCP server; they don't bypass it.

### Auth

Scoped API tokens for everyone (humans mint them via UI; agents/integrations/MCP use them directly). Per-token scope at minimum at project granularity, ideally per-board.

## Primary agent use case

Agents do work elsewhere (writing code, researching, drafting, running pipelines) and **record what they did in TH** so the work is tracked. TH is the durable log of agent activity, not the agent runtime.

Reading from TH — agents picking up `agent-ready` tasks via polling or outbound webhook — is supported but secondary to writing to TH. TH never hosts or runs the agent; it just exposes the work.

## Integrations (incremental)

The interesting integrations come on top of a working tracker, not before it:

### GitHub

The headline integration. Flow:

1. **Ingest** — webhook on `issues.opened`, `issues.edited`, `pull_request.opened`. Both issues and PRs are ingested.
2. **Analyze** — LLM reads the title, body, labels, linked code (for PRs: the diff). Produces:
   - Routing decision: `auto-repair` vs `needs-human`
   - Project / board / labels for the resulting task
   - Confidence score
3. **Create task** — backlinked to the GitHub issue/PR. Task carries the routing decision as a label or column placement (`triage`, `agent-ready`, `needs-human`).
4. **Comment back** — issue/PR gets a comment with the TH task URL and the routing decision so it's visible in GitHub too.
5. **Branch:**
   - `auto-repair` → agent runtime picks up the task and attempts a fix (opens a PR). Outcome posted back as task activity.
   - `needs-human` → sits on the board for human triage / assignment.

Below a confidence threshold, default to `needs-human` regardless of the analyzer's preference — false positives on auto-repair are more expensive than false negatives.

Triage is opt-in per project. Without it, the integration is just "GitHub event creates a TH task" — still useful, no LLM in the loop.

Open: do failed auto-repair attempts auto-escalate to `needs-human`, or stay open for retry? Probably escalate after N attempts.

## Where it lives

- **Marketing / product site:** https://www.antimatter-studios.com/taskhauler
- **App (hosted instance):** https://taskhauler.antimatter-studios.com

Published under the Antimatter Studios brand. Self-hosting remains an open question (see below) — the hosted instance is the default path.

## Non-goals

- Replacing Jira / Linear at full scope. Optimize for clarity and API quality over feature breadth.
- Time tracking, burndown, sprint planning (at least initially).
- Hosting agent runtimes. Taskhauler exposes tasks; agents live elsewhere.

## Open questions

1. Single-tenant (just you) vs. multi-tenant from day one? Affects auth + data model heavily.
2. DB — Postgres unless there's a reason not to.
3. Migration from teamagentica's in-process tracker — dual-write window, or hard cutover? TA keeps its UI but switches the data layer to API calls; latency/caching strategy needs deciding.
4. ~~UI scope for v1~~ — answered: clone TA's kanban + epics + sub-boards.
5. Self-hostable as a first-class deployment mode, or hosted-only at first?
