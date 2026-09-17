# Pokémon Platform

Full-stack web application for exploring Pokémon data, tracking personal collections, and planning Pokémon acquisition across multiple games.

Instead of consuming PokéAPI directly from the frontend, the platform retrieves, transforms, normalizes, and stores external data in its own PostgreSQL database, then exposes it through a NestJS REST API consumed by a React frontend.

> **Status:** Functional MVP under active development.
> The project currently runs locally. Multi-profile collection management is being integrated, followed by collection goals, progress tracking, game recommendations, production deployment, and final UI improvements.

---

## Features

### Pokémon data

* Browse Pokémon stored in the local database.
* Search by name.
* Filter by type and generation.
* View detailed Pokémon information and variants.
* Explore evolution chains and evolution requirements.
* View acquisition and encounter information for supported game versions.

### User features

* User registration and login.
* JWT-based authentication using HttpOnly cookies.
* Mark Pokémon as captured.
* Mark Pokémon as favorites.
* Dedicated collection and favorites pages.
* Filter user collections by generation.

### Collection profiles — in progress

The user model is being extended from one collection per user to multiple independent collection profiles.

Each profile will support its own:

* captured Pokémon;
* favorites;
* target Pokémon;
* completion progress;
* game preferences.

### Game recommendations — planned

The recommendation system will use:

* target Pokémon;
* available games;
* preferred primary games;
* auxiliary games.

Its goal is to recommend where each Pokémon should be obtained while prioritizing the primary games and minimizing unnecessary use of auxiliary games.

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

PokéAPI is used as an external data source, but the application maintains its own relational model instead of rebuilding domain relationships from remote API responses at request time.

The project is organized as a pnpm workspace monorepo:

```text
pokemon-platform/
├── apps/
│   └── web/          # React frontend
├── services/
│   └── api/          # NestJS backend
├── packages/         # Shared workspaces
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
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

* Node.js
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

Pokémon data is synchronized manually through the backend:

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

1. retrieves species from PokéAPI;
2. transforms external data into the application's internal domain model;
3. resolves and persists related entities;
4. caches already synchronized reference data during the current run;
5. synchronizes evolution chains in a second phase;
6. records the synchronization result in the database.

Synchronization runs are persisted with statuses such as `running`, `completed`, and `failed`, including error information when applicable.

Species are currently processed sequentially to reduce load on PokéAPI and simplify error handling and debugging.

---

## Authentication

Authentication is implemented in the NestJS backend.

Passwords are hashed with **bcrypt**, while successful logins generate a signed **JWT** stored in an `HttpOnly` cookie.

Protected endpoints use a NestJS guard to verify the token and derive the current user from the authenticated request.

Authentication cookies are configured with:

* `HttpOnly`
* `SameSite=Lax`
* `Secure` in production
* 24-hour expiration

Examples of protected user resources include collections, favorites, and collection profiles.

---

## REST API

The backend exposes endpoints for:

* Pokémon listing, search and filtering;
* Pokémon details and variants;
* encounters and acquisition data;
* authentication;
* user collections;
* favorites;
* collection profiles;
* PokéAPI synchronization.

Examples:

```text
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me

GET    /pokemon
GET    /pokemon/:id
GET    /pokemon/:id/encounters
POST   /pokemon/sync

GET    /users/me/collection
POST   /users/me/collection/:pokemonId
DELETE /users/me/collection/:pokemonId

GET    /users/me/favorites
POST   /users/me/favorites/:pokemonId
DELETE /users/me/favorites/:pokemonId

GET    /users/me/profiles
POST   /users/me/profiles
```

---

## Testing and CI

Backend tests are implemented with **Jest** using `.spec.ts` test suites for major application areas such as Pokémon, evolutions, users, and core services.

GitHub Actions runs automated quality checks on every push and pull request:

* API tests
* API lint
* API build
* Web lint
* Web build
* Prisma Client generation

This helps prevent changes that break either application from being merged unnoticed.

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

Docker currently provides the local PostgreSQL development database.

The credentials defined in `docker-compose.yml` are **local development credentials only** and are not production credentials.

### Environment variables

The API requires:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

Real secrets should be provided through local or deployment environment configuration and must not be committed to the repository.

### Generate Prisma Client

```bash
pnpm --filter api exec prisma generate
```

### Start backend

```bash
pnpm --filter api start:dev
```

### Start frontend

```bash
pnpm --filter web dev
```

The application currently runs locally. Production deployment is part of the remaining MVP work.

---

## Development Workflow

Development follows a branch-based Git workflow.

Features and maintenance work are developed in dedicated branches and integrated through pull requests rather than working directly on `main`.

The project also uses AI-assisted development tools as complementary support during implementation, testing, debugging, technical discussion, and documentation. Architectural decisions, validation, and final integration remain part of the development workflow.

---

## Roadmap

### Implemented

* [x] PokéAPI synchronization
* [x] PostgreSQL relational model
* [x] Pokémon browsing
* [x] Search
* [x] Type and generation filters
* [x] Pokémon detail pages
* [x] Variants
* [x] Evolution chains and requirements
* [x] Acquisition and encounter data
* [x] Authentication
* [x] Collections
* [x] Favorites
* [x] Automated backend testing
* [x] CI quality checks

### In progress

* [ ] Multiple collection profiles
* [ ] Profile-specific collections and favorites
* [ ] Target Pokémon selection
* [ ] Completion tracking

### Planned

* [ ] Game recommendation engine
* [ ] Production deployment
* [ ] Final UI/UX improvements

---

## Engineering Focus

This project is also intended to demonstrate practical experience with:

* full-stack TypeScript development;
* REST API design;
* relational database modeling;
* external API integration;
* data transformation and synchronization;
* authentication and authorization;
* automated testing;
* CI workflows;
* containerized local development;
* Git-based collaborative workflows.

---

## Disclaimer

Pokémon and all related names and properties belong to their respective owners.

This is an independent, non-commercial software engineering project created for educational and portfolio purposes and is not affiliated with Nintendo, Game Freak, Creatures Inc., or The Pokémon Company.
