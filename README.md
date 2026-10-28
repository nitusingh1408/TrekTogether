# TrekTogether

TrekTogether is a responsive trekking community app built with React/Vite and Express/MongoDB. It includes a public discovery landing page, account-based community workspace, and persistent APIs for the main social and trip flows.

## Features

- Account registration, login/logout, persistent HTTP-only sessions, password changes, and account removal.
- Hiker profiles, follow/unfollow, profile editing, and profile photo uploads.
- Community feed, posts with photos/videos, likes, comments, editing/deleting, saving, and reporting.
- Trek discovery and filtering, trek creation/editing/cancellation, organizer approvals, direct joins, waitlists, participant lists, and saved treks.
- Group directory, creation/editing/deletion, open and approval-based membership, invitations, membership decisions, group discussions, and member management.
- Persistent notifications delivered over authenticated Socket.IO rooms.
- Global search across hikers, posts, treks, and groups.
- Cloudinary uploads with MIME type and file-size checks.
- Demo data seeding guarded to development environments.
- Vercel SPA rewrite and Render service blueprint.

## Run locally

Requirements: Node.js 20+, MongoDB local or Atlas, and (for uploads) a Cloudinary account.

1. In `backend/`, copy `.env.example` to `.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.
2. Install dependencies and start the API:

   ```sh
   cd backend
   npm ci
   npm run dev
   ```

3. In another terminal, start the web app:

   ```sh
   cd frontend
   npm ci
   npm run dev
   ```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:8084`. `GET /health` reports API readiness. The app uses the default local API URL unless you set `VITE_API_BASE_URL` in the frontend environment.

### Environment variables

Backend (keep secrets on the server):

- `MONGODB_URI` (or legacy `dbURL`): MongoDB connection string.
- `JWT_SECRET`: long, random signing secret.
- `CLIENT_ORIGIN`: exact frontend origin; comma-separated exact origins are accepted for local preview plus production.
- `PORT`: optional; defaults to `8084`.
- `NODE_ENV`: set to `production` for secure cross-site cookies.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: enable persistent media uploads.

Frontend:

- `VITE_API_BASE_URL`: API base URL, including `/api`, for example `https://your-api.example.com/api`.

Never commit `.env` files, upload credentials, or database passwords. `backend/.env.example` and `frontend/.env.example` contain placeholders only.

## Demo data

Set `NODE_ENV=development`, `MONGODB_URI`, and a development-only `SEED_PASSWORD` (at least 12 characters), then run from `backend/`:

```sh
npm run seed:demo
```

This creates sample hiking profiles, posts, treks, and groups. It is idempotent and refuses to run unless `NODE_ENV=development`. The demo password is supplied through the environment; no production password is built into the source.

## API verification

Start MongoDB and the API, then run from `backend/`:

```sh
TEST_API_URL=http://localhost:8084 npm run test:api
```

The integration script creates uniquely named test accounts, exercises auth, social, trek, group, notification, search, upload validation, and live Socket.IO flows, then removes its test accounts. Run it only against a non-production database.

## Deployment

- Frontend: deploy `frontend/` to Vercel. The included `frontend/vercel.json` rewrites client-side routes to `index.html`. Set `VITE_API_BASE_URL` in Vercel to the Render API URL ending in `/api`.
- Backend: deploy the included root `render.yaml` blueprint. Set `MONGODB_URI`, `CLIENT_ORIGIN` to the exact Vercel origin, and all Cloudinary variables in Render. Render supplies `PORT`; the server listens on `0.0.0.0`.
- MongoDB Atlas: configure the database user and network access for the Render service.
- Cloudinary: keep credentials in the backend environment only.

Production cookies use `HttpOnly`, `Secure`, and `SameSite=None`; state-changing API calls also check request origins. Socket.IO accepts only authenticated sessions and assigns users to server-controlled private rooms.

## Project structure

```text
backend/       Express API, Mongoose models, auth, uploads, Socket.IO
frontend/      React/Vite pages, Redux auth state, Axios API client
render.yaml    Render service blueprint
```

The app is ready for a local college-project demo and deployment configuration. Run the API integration script before using a real database. Admin moderation screens, verified external safety information, and real route/map integrations are intentionally not represented as live services.
