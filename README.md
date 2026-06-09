# EventMedia — Event & Media Management Platform

A full-stack platform for capturing, organizing, and discovering event photos and videos. Built for clubs, communities, and photographers who need a single place to upload media from events, tag people, and let attendees find pictures of themselves — including **AI face search** that surfaces every photo a person appears in from a single selfie.

> **Stack:** Next.js 14 · Express + TypeScript · PostgreSQL (Prisma) · AWS S3 + Rekognition · Socket.IO · Tailwind CSS

---

## 🌐 Live Demo

**[https://your-deployed-url.com](https://event-media-platform-omega.vercel.app/)**

### Demo Accounts

Try the platform instantly with these pre-seeded accounts:

| Role         | Email                      | Password    | Access |
|--------------|----------------------------|-------------|--------|
| **Admin**        | `admin@example.com`        | `admin!111`  | Full access — manage users, roles, analytics |
| **Photographer** | `photographer@example.com` | `photo123`  | Upload media, manage own events & albums |
| **Club Member**  | `club_m@example.com`       | `member123` | View club-only content, like, comment, tag |
| **Viewer**       | `viewer@example.com`       | `viewer123` | Browse public content |

---

## Features

- **Events & Albums** — Create events across categories (photoshoots, workshops, trips, competitions, fests, sports, seminars, and more), each with cover images, locations, dates, and shareable QR codes.
- **Media uploads** — Drag-and-drop image and video uploads with automatic thumbnail generation, image processing via Sharp, and S3-backed storage.
- **AI face search** — Register a selfie once, then search the entire library for every photo you appear in, powered by AWS Rekognition face collections.
- **Auto-tagging** — Uploaded media is automatically labeled with AI-detected tags and confidence scores.
- **People tagging** — Manually tag users in photos and notify them.
- **Social layer** — Likes, threaded comments, favourites, shares, and download tracking.
- **Stories** — Ephemeral, auto-expiring story posts.
- **Real-time notifications** — Live updates for likes, comments, tags, shares, and uploads via Socket.IO.
- **Role-based access control** — Four roles (Admin, Photographer, Club Member, Viewer) with a self-service role-request and approval workflow.
- **Access levels** — Public, Private, and Club-only visibility on events, albums, and individual media.
- **Search** — Full search with autocomplete across events, media, and tags.
- **Analytics dashboard** — Engagement and activity metrics for admins and event owners.
- **Duplicate detection** — Perceptual hashing to flag duplicate uploads.

---

## Architecture

```
event-media-platform/
├── backend/                 # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/     # Route handlers (auth, events, media, face, etc.)
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # S3, Rekognition, image processing, sockets, notifications
│   │   ├── middleware/      # Auth, validation, uploads, error handling
│   │   ├── utils/           # JWT, password hashing, logging, slugify
│   │   ├── app.ts           # Express app + middleware
│   │   └── server.ts        # HTTP + Socket.IO server entry
│   └── prisma/              # Schema, migrations, seed & admin scripts
├── frontend/                # Next.js 14 (App Router) + Tailwind
│   └── src/
│       ├── app/             # Routes: auth, dashboard, gallery, events, search, etc.
│       ├── components/      # UI, layout, media, events, home
│       ├── store/           # Zustand stores (auth, notifications)
│       └── lib/             # API client + socket client
├── prisma/                  # Top-level schema reference
├── docker-compose.yml       # Postgres, Redis, backend, frontend, migrations
└── .env.example
```

The backend exposes a REST API under `/api` and a Socket.IO server for real-time events. The frontend is a Next.js App Router application that talks to the API over Axios and subscribes to live updates over the socket connection. PostgreSQL is accessed through Prisma, media is stored in AWS S3, and face/label intelligence is handled by AWS Rekognition.

---

## Tech Stack

**Frontend**
- Next.js 14 (App Router) + React 18
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Framer Motion (animations)
- Axios, Socket.IO client
- React Dropzone, React Masonry, Headless UI, Lucide icons

**Backend**
- Node.js + Express
- TypeScript
- Prisma ORM + PostgreSQL
- AWS SDK v3 — S3 (storage) & Rekognition (face/label detection)
- Socket.IO (real-time)
- JWT auth (access + refresh tokens), bcrypt
- Sharp (image processing), Multer (uploads), QRCode
- Helmet, CORS, rate limiting, compression
- Pino / Winston logging
- Redis (optional, for sessions/caching)

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or use the bundled Docker setup)
- An AWS account with an S3 bucket and Rekognition access (required for storage and face search)

### 1. Clone and configure

```bash
git clone https://github.com/<your-username>/event-media-platform.git
cd event-media-platform
cp .env.example .env
```

Fill in `.env` — at minimum set `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and your AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `AWS_REKOGNITION_COLLECTION_ID`).

### 2. Run with Docker (recommended)

This spins up PostgreSQL, Redis, the backend, and the frontend:

```bash
docker compose up -d
# run migrations + seed the database
docker compose --profile migrate up prisma_migrate
```

- Frontend → http://localhost:3000
- Backend API → http://localhost:5000/api
- Health check → http://localhost:5000/health

### 3. Run locally without Docker

**Backend**

```bash
cd backend
npm install
npx prisma migrate deploy
npm run prisma:seed        # optional: seed demo users & data
npm run dev                # starts the API on PORT (default 5000)
```

**Frontend**

```bash
cd frontend
npm install
npm run dev                # starts Next.js on http://localhost:3000
```

---

## Creating a Custom Admin

To create a fresh admin account with your own credentials:

```bash
EMAIL=you@example.com PASSWORD=strongpass USERNAME=you npx ts-node prisma/create-admin.ts
```

---

## API Overview

Base URL: `/api`

| Resource        | Endpoints (selection) |
|-----------------|------------------------|
| Auth            | `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Users           | `GET /users`, `GET /users/profile/:username`, `POST /users/avatar`, `POST /users/selfie`, `PATCH /users/:id/role` |
| Events          | `GET /events`, `GET /events/:slug`, `GET /events/:slug/media`, `GET /events/:slug/qr`, `DELETE /events/:id` |
| Albums          | `GET /albums`, `GET /albums/:id`, `PUT /albums/:id`, `POST /albums/:id/collaborators` |
| Media           | `GET /media/gallery`, `GET /media/:id`, `POST /media/:id/like`, `POST /media/:id/favourite`, `POST /media/:id/share`, `GET /media/:id/download` |
| Face search     | `POST /face/search`, `GET /face/my-photos` |
| Stories         | `GET /stories`, `POST /stories`, `PATCH /stories/:id/view` |
| Notifications   | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| Role requests   | `GET /role-requests/my`, `GET /role-requests`, `GET /role-requests/stats` |
| Search          | `GET /search`, `GET /search/autocomplete` |
| Analytics       | `GET /analytics/dashboard`, `GET /analytics/events/:id`, `GET /analytics/me` |

Authenticated routes expect a `Bearer` access token in the `Authorization` header.

---

## Environment Variables

Key variables (see `.env.example` for the full list):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing secrets |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `AWS_S3_BUCKET_NAME` | S3 bucket for media |
| `AWS_REKOGNITION_COLLECTION_ID` | Rekognition face collection |
| `PORT` | Backend port (default `5000`) |
| `CORS_ORIGIN` | Allowed frontend origin |
| `NEXT_PUBLIC_API_URL` | API base URL for the frontend |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO URL for the frontend |
| `REDIS_URL` | Redis connection (optional) |
| `MAX_FILE_SIZE_MB` | Upload size cap |

---

## Useful Scripts

**Backend**

```bash
npm run dev              # dev server with hot reload
npm run build            # compile TypeScript
npm start                # run compiled server
npm run prisma:migrate   # create & apply a migration (dev)
npm run prisma:deploy    # apply migrations (prod)
npm run prisma:seed      # seed demo data
npm run prisma:studio    # open Prisma Studio
```

**Frontend**

```bash
npm run dev              # Next.js dev server
npm run build            # production build
npm start                # serve production build
npm run lint             # lint
```

---

## Author

Sanjana Nallapati 
GitHub: https://github.com/sanjananallapati

---
