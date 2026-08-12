# Local Meetup RSVP Tracker

A full-stack web application for creating local meetup events, browsing what others have posted, and RSVP-ing (Going / Maybe / Declined) — with server-side enforced ownership and authentication, not just UI-level checks.

Built for the Dexqbit Full Stack Engineer technical assessment.

---

## Quick Start

The entire stack — frontend, backend, and database — boots with a single command. No manual setup, migrations, or seeding required.

```bash
git clone <your-repo-url>
cd <repo-folder>
docker compose up --build
```

Once it's up:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080/api |

The MySQL container automatically creates the schema and seeds sample users and events on first boot.

To reset to a clean state at any time:
```bash
docker compose down -v && docker compose up --build
```

---

## Seeded Users

Registration is intentionally out of scope for this assessment — users are seeded directly. Log in with any of the following. Password for all: `password123`

| Name | Email |
|---|---|
| Alice | alice@example.com |
| Bob | bob@example.com |
| Charlie | charlie@example.com |
| Dave | dave@example.com |

---

## Features

**Core**
- Login with JWT-based authentication (httpOnly, `sameSite=lax` cookie — not accessible to client-side JS, mitigating XSS token theft).
- Browse all events; view full event detail including a list of attendees grouped by RSVP status.
- Create, edit, and delete events — edit/delete restricted to the event's creator, enforced server-side.
- RSVP to any event as Going / Maybe / Declined, with the ability to change your response.

**Bonus enhancements**
- Live search/filter on the events list with typeahead suggestions as you type.
- Skeleton loading states and empty states across the events list, event detail, and attendee list.
- Rate limiting on login (10 attempts / 15 min per IP) to blunt brute-force attempts.
- Database indexes on foreign keys and `event_time` for query performance as data grows.
- Logout that clears the session cookie server-side, not just client-side state.
- Consistent "Back to Events" navigation across sub-pages.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router, TypeScript, Tailwind CSS) | |
| Backend | Node.js + Express | |
| Database access | Plain `mysql2` with parameterized queries — **no ORM** | Every query is explicit and auditable; avoids hidden N+1s and keeps the SQL, the schema, and the constraints directly visible and explainable rather than abstracted behind a query builder. |
| Database | MySQL 8 | |
| Auth | JWT in an httpOnly cookie, bcrypt password hashing | |
| Orchestration | Docker & Docker Compose | |

---

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌───────────┐
│  Next.js    │ HTTP │  Express API │ SQL  │  MySQL 8   │
│  :3000      │─────▶│  :8080       │─────▶│  :3306     │
└─────────────┘      └──────────────┘      └───────────┘
```

- The `db` service mounts `./db` into MySQL's `/docker-entrypoint-initdb.d/`, so schema and seed SQL run automatically on first boot of a fresh volume — no manual migration step, ever.
- `backend` waits on `db`'s healthcheck (`depends_on: condition: service_healthy`) and retries its own connection with backoff, so a slow-starting database doesn't crash it.
- `frontend` receives `NEXT_PUBLIC_API_URL` as a Docker **build arg** (not just a runtime env var), since Next.js inlines `NEXT_PUBLIC_*` variables at build time.

---

## Schema Design

```
users (1) ──< (many) events (1) ──< (many) rsvps >── (many) users
```

```sql
users   (id, name, email UNIQUE, password_hash, created_at)
events  (id, title, description, location, event_time,
         created_by → users.id, created_at, updated_at)
rsvps   (id, event_id → events.id, user_id → users.id,
         status ENUM('going','maybe','declined'),
         UNIQUE(event_id, user_id), created_at, updated_at)
```

**Key design decisions:**
- `ON DELETE CASCADE` on every foreign key — deleting a user or event never leaves an orphaned event or RSVP behind.
- `UNIQUE(event_id, user_id)` on `rsvps` — a user can only ever have one RSVP per event. Changing your response is an upsert (`INSERT ... ON DUPLICATE KEY UPDATE`) on the existing row, not a new row, which is what makes duplicate/conflicting RSVPs structurally impossible rather than just app-level-checked.
- `status` is an `ENUM`, not free text — the database itself rejects an invalid RSVP value, independent of whatever the API layer does.
- Indexes on `events.created_by`, `events.event_time`, `rsvps.event_id`, and `rsvps.user_id` for the lookups the app actually performs (an owner's events, upcoming events sorted by time, an event's attendees, a user's RSVPs).

---

## Security & Access Control

- **Passwords**: hashed with bcrypt, never stored or logged in plaintext.
- **Auth**: JWT issued on login, verified on every protected route via middleware, delivered as an httpOnly cookie so it's inaccessible to JavaScript (mitigates XSS-based token theft) rather than stored in localStorage.
- **Ownership enforcement**: `PUT` and `DELETE /events/:id` run through a dedicated ownership middleware that fetches the event and compares `created_by` against the authenticated `req.user.id`, returning `403` on mismatch. This is enforced **server-side** — hiding the Edit/Delete buttons in the UI for non-owners is a UX convenience, not the actual security boundary. Hitting the API directly with another user's token is blocked the same way.
- **SQL injection**: every query uses parameterized statements via `mysql2`; no string concatenation of user input into SQL, anywhere.
- **Brute-force mitigation**: login is rate-limited (5 attempts / 15 minutes per IP), returning `429` once exceeded.

---

## API Overview

All routes are prefixed `/api`. Protected routes require a valid session cookie.

| Method | Route | Protected | Ownership check |
|---|---|:---:|:---:|
| POST | `/auth/login` | – | – |
| POST | `/auth/logout` | ✓ | – |
| GET | `/events` | ✓ | – |
| GET | `/events?search=` | ✓ | – |
| GET | `/events/:id` | ✓ | – |
| POST | `/events` | ✓ | – |
| PUT | `/events/:id` | ✓ | ✓ |
| DELETE | `/events/:id` | ✓ | ✓ |
| GET | `/events/:id/rsvps` | ✓ | – |
| PUT | `/events/:id/rsvp` | ✓ | – |

Errors return a consistent `{ "error": "message" }` shape with the appropriate status code (`400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `429` rate-limited).

---

## Project Structure

```
├── docker-compose.yml
├── README.md
├── db/
│   ├── 001_schema.sql
│   ├── 002_seed.sql
│   └── 003_indexes.sql
├── backend/
│   └── src/
│       ├── server.js
│       ├── db.js
│       ├── middleware/     # auth.js, ownership.js, rateLimiter.js
│       ├── routes/
│       └── controllers/
└── frontend/
    └── app/
        ├── login/
        ├── events/
        │   ├── page.tsx        # list + search
        │   ├── new/page.tsx    # create
        │   └── [id]/page.tsx   # detail + RSVP + attendees
```

---

## Known Limitations / What I'd Add With More Time

- **Pagination** on the events list — not yet needed at seed-data scale, but the next thing I'd add as the dataset grows.
- **Automated tests** (Jest + Supertest) covering login and the ownership 403 path in particular, since those are the two behaviors most worth guaranteeing don't regress.
- **Token revocation** — logout currently clears the cookie, which is sufficient for this scope, but a captured token would remain valid until natural expiry. A production version would add short-lived access tokens with refresh tokens, or a server-side revocation list.
- **Event date validation** to prevent creating events in the past.

---

