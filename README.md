# Pokémon Platform

Full-stack web application for exploring Pokémon data, managing personal collections, tracking completion goals, and planning Pokémon acquisition across multiple games.

Instead of consuming PokéAPI directly from the frontend, the platform retrieves, transforms, normalizes, and stores external data in its own PostgreSQL database. A NestJS REST API exposes the application's domain model to a React frontend.

> **Status:** Functional MVP in final production-readiness and deployment stage.

---

## Features

### Pokémon data

* Browse Pokémon stored in the local database.
* Search by name.
* Filter by type and generation.
* Persist Pokédex filters and pagination in the URL.
* View Pokémon details and variants.
* Explore evolution chains and evolution requirements.
* View acquisition methods and encounter information by game version.

### Authentication

* User registration and login.
* JWT-based authentication.
* Authentication stored in `HttpOnly` cookies.
* Protected user endpoints.
* Logout and current-user session validation.

### Collection profiles

Users can create multiple independent collection profiles.

Each profile supports its own:

* collection;
* favorites;
* collection objective;
* generation or Pokédex-range constraints;
* game configuration;
* completion progress.

Supported objective modes include:

* complete Pokédex;
* selected generations;
* custom Pokémon number range.

### Collection tracking

* Mark Pokémon as captured.
* Remove Pokémon from the collection.
* Mark Pokémon as favorites.
* Profile-specific collections and favorites.
* Filter collection and favorites by generation.
* Track completion progress for the active profile.

### Game recommendations

Each profile can configure ordered:

* primary games;
* auxiliary games.

The recommendation system determines which configured game should be used to obtain each Pokémon in the profile objective.

Coverage considers:

* direct acquisition;
* evolution from obtainable Pokémon;
* configured game order;
* profile objective;
* already captured Pokémon.

If configured games do not cover all remaining Pokémon, the application can suggest additional games.

Extra-game selection uses an exact set-cover optimization strategy that prioritizes:

1. maximum species coverage;
2. minimum number of additional games;
3. deterministic ordering.

The Pokédex can also be ordered by recommendation plan, grouping Pokémon according to the configured game where they should be obtained.

Recommended games are integrated into Pokémon detail encounter views while still allowing manual game selection.

---

## Architecture

```text
PokéAPI
   │
   ▼
Synchronization / transformation layer
   │
   ▼
PostgreSQL
   │
   ▼
NestJS REST API
   │
   ▼
React frontend
```

PokéAPI is used as an external data source, but the application maintains its own relational domain model instead of reconstructing relationships from remote responses at request time.

This provides:

* predictable queries;
* normalized relationships;
* local filtering;
* persistent acquisition data;
* evolution graph traversal;
* collection progress calculations;
* game-coverage analysis;
* recommendation algorithms.

The project is organized as a pnpm workspace monorepo:

```text
pokemon-platform/
├── apps/
│   └── web/               # React frontend
├── services/
│   └── api/               # NestJS backend
├── docker-compose.yml     # Local PostgreSQL
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

---

## Tech Stack

### Frontend

* React 19
* TypeScript
* Vite
* React Router
* Tailwind CSS

### Backend

* Node.js 22
* NestJS 11
* TypeScript
* REST API
* Prisma ORM

### Database

* PostgreSQL 17
* Prisma 7

### Tooling

* Docker / Docker Compose
* pnpm workspaces
* Jest
* ESLint
* Prettier
* GitHub Actions
* Git / GitHub

---

## Data Synchronization

Pokémon data is synchronized through the backend.

```http
POST /pokemon/sync
```

Example:

```json
{
  "startId": 1,
  "endId": 151
}
```

The synchronization pipeline:

1. retrieves species data from PokéAPI;
2. transforms external data into the internal domain model;
3. resolves and persists related entities;
4. caches reference data during the current synchronization run;
5. persists acquisition and encounter information;
6. synchronizes evolution chains in a second phase;
7. records the synchronization result.

Synchronization runs are persisted with statuses such as:

```text
running
completed
failed
```

Failures also persist diagnostic information.

Species are currently processed sequentially to reduce load on PokéAPI and simplify error handling.

### Synchronization protection

The synchronization endpoint is protected by a dedicated API key.

Requests must provide:

```http
X-Sync-Key: <key>
```

Only one synchronization may be active at a time.

A database-backed synchronization lock prevents concurrent runs from starting simultaneously.

The synchronization service is not executed automatically when the API starts.

This allows synchronization to be triggered manually or later through an external scheduler without coupling data ingestion to application startup.

---

## Authentication

Passwords are hashed using **bcrypt**.

Successful login generates a signed **JWT** stored in an `HttpOnly` cookie.

Protected endpoints use a NestJS authentication guard to validate the token and identify the current user.

Authentication cookies use:

* `HttpOnly`;
* `SameSite=Lax`;
* `Secure` in production;
* 24-hour expiration.

Cookie and CORS configuration can adapt between development and production environments.

---

## REST API

The backend exposes endpoints for:

* Pokémon listing and filtering;
* Pokémon details and variants;
* encounters and acquisition information;
* authentication;
* collection profiles;
* collections;
* favorites;
* profile games;
* recommendation plans;
* recommendation-based Pokédex ordering;
* synchronization;
* application health.

Examples:

```text
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me

GET    /pokemon
GET    /pokemon/types
GET    /pokemon/generations
GET    /pokemon/:id
GET    /pokemon/:id/encounters
GET    /pokemon/:id/variants/:variantId
GET    /pokemon/:id/variants/:variantId/encounters

POST   /pokemon/sync

GET    /users/me/profiles
POST   /users/me/profiles
GET    /users/me/profiles/:profileId
PATCH  /users/me/profiles/:profileId
DELETE /users/me/profiles/:profileId

GET    /users/me/profiles/:profileId/collection
POST   /users/me/profiles/:profileId/collection/:pokemonId
DELETE /users/me/profiles/:profileId/collection/:pokemonId

GET    /users/me/profiles/:profileId/favorites
POST   /users/me/profiles/:profileId/favorites/:pokemonId
DELETE /users/me/profiles/:profileId/favorites/:pokemonId

GET    /users/me/profiles/:profileId/games
PUT    /users/me/profiles/:profileId/games

GET    /recommendations/profiles/:profileId/plan
GET    /recommendations/profiles/:profileId/pokedex

GET    /health
```

---

## Health Check

The API exposes:

```http
GET /health
```

The health check validates both:

* NestJS availability;
* PostgreSQL connectivity.

Example response:

```json
{
  "status": "ok",
  "database": "ok"
}
```

This endpoint can be used by deployment platforms for application health monitoring.

---

## Testing and CI

Backend tests are implemented with **Jest**.

The test suite covers major application areas including:

* Pokémon synchronization;
* Pokémon queries;
* encounters;
* evolution logic;
* authentication;
* users;
* profiles;
* favorites;
* profile games;
* health checks;
* recommendation coverage;
* recommendation planning;
* extra-game optimization.

GitHub Actions runs quality checks on every push and pull request:

* dependency installation;
* Prisma schema validation;
* Prisma Client generation;
* API tests;
* API lint;
* API build;
* web lint;
* web build.

---

## Local Development

### Requirements

* Node.js 22
* pnpm
* Docker
* Docker Compose

### Install dependencies

```bash
pnpm install
```

### Start PostgreSQL

```bash
docker compose up -d
```

Docker Compose provides the local PostgreSQL development database.

Credentials defined in `docker-compose.yml` are intended only for local development.

---

## Environment Variables

### Frontend

Create:

```text
apps/web/.env
```

Example:

```env
VITE_API_URL=http://localhost:3000
```

A versioned example is available at:

```text
apps/web/.env.example
```

### Backend

Create:

```text
services/api/.env
```

Example:

```env
NODE_ENV=development
PORT=3000

FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://pokemon:pokemon_dev@localhost:5432/pokemon_platform

JWT_SECRET=<secret>
SYNC_API_KEY=<secret>
```

A versioned example is available at:

```text
services/api/.env.example
```

Real secrets must never be committed to the repository.

---

## Prisma

### Generate Prisma Client

```bash
pnpm --filter api exec prisma generate
```

or:

```bash
pnpm --filter api prisma:generate
```

### Development migrations

```bash
pnpm --filter api exec prisma migrate dev
```

### Production migrations

```bash
pnpm --filter api prisma:migrate:deploy
```

Production environments should use `prisma migrate deploy` rather than development migration commands.

---

## Run the Application

### Backend

```bash
pnpm --filter api start:dev
```

### Frontend

```bash
pnpm --filter web dev
```

The default local configuration uses:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3000
```

---

## Production Build

### Backend

```bash
pnpm --filter api build
pnpm --filter api start:prod
```

### Frontend

```bash
pnpm --filter web build
```

Production deployment should provide environment-specific values for:

```text
DATABASE_URL
JWT_SECRET
SYNC_API_KEY
FRONTEND_URL
VITE_API_URL
NODE_ENV
PORT
```

---

## Development Workflow

Development follows a branch-based Git workflow.

Features, refactors, and maintenance work are developed in dedicated branches and integrated through pull requests rather than committing directly to `main`.

Typical branch prefixes include:

```text
feat/
fix/
refactor/
chore/
```

Before integration, the project is validated with automated tests, linting, builds, and CI checks.

The project also uses AI-assisted development tools as complementary support during implementation, debugging, testing, technical discussion, and documentation.

Architectural decisions, validation, and final integration remain part of the development workflow.

---

## Roadmap

### Implemented

* [x] PokéAPI synchronization
* [x] PostgreSQL relational model
* [x] Pokémon browsing
* [x] Search
* [x] Type and generation filters
* [x] URL-based Pokédex state persistence
* [x] Pokémon detail pages
* [x] Variants
* [x] Evolution chains
* [x] Evolution requirements
* [x] Acquisition and encounter data
* [x] Authentication
* [x] Multiple collection profiles
* [x] Profile-specific collections
* [x] Profile-specific favorites
* [x] Collection objectives
* [x] Completion tracking
* [x] Primary and auxiliary game configuration
* [x] Game coverage analysis
* [x] Recommendation plans
* [x] Extra-game optimization
* [x] Recommendation-based Pokédex ordering
* [x] Recommendation integration in Pokémon details
* [x] Synchronization protection
* [x] Concurrent synchronization prevention
* [x] Health checks
* [x] Automated backend testing
* [x] CI quality checks
* [x] Production environment configuration

### Remaining

* [ ] Production deployment
* [ ] Scheduled synchronization
* [ ] Final production smoke testing
* [ ] Additional UI/UX polish

---

## Engineering Focus

This project demonstrates practical experience with:

* full-stack TypeScript development;
* React application architecture;
* NestJS backend development;
* REST API design;
* relational database modeling;
* Prisma ORM;
* PostgreSQL;
* external API integration;
* ETL-style data synchronization;
* domain modeling;
* authentication and authorization;
* profile-scoped user data;
* graph traversal for evolution coverage;
* exact optimization algorithms;
* automated testing;
* CI workflows;
* environment-based configuration;
* production readiness;
* containerized local development;
* Git-based collaborative workflows.

---

## Disclaimer

Pokémon and all related names and properties belong to their respective owners.

This is an independent, non-commercial software engineering project created for educational and portfolio purposes and is not affiliated with Nintendo, Game Freak, Creatures Inc., or The Pokémon Company.
