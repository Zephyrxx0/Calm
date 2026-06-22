# Calm

A carbon awareness platform and conversational AI coach. 

Calm interviews users about their lifestyle, calculates a real-time carbon footprint estimate, and outputs a personalized "newspaper edition" styled as a vintage broadsheet to help them visualize their environmental impact.

## Features
- **Conversational Interview:** An AI coach powered by Google Gemini that asks targeted questions about your daily routine.
- **Activity & Heatmap Tracking:** Daily GitHub-style contribution graphs to track sustainable choices and carbon impact over time.
- **Receipt Scanning:** Upload receipts for automatic AI-driven footprint analysis.
- **Vintage Broadsheet Edition:** A highly polished, monochrome newspaper layout detailing your personalized footprint.

## Tech Stack
- **Frontend:** Next.js, React, TailwindCSS, Framer Motion
- **Backend:** Python (FastAPI)
- **Database:** PostgreSQL (with Alembic for migrations)
- **AI Integration:** Google Cloud AI (Gemini)

## Setup
### Backend
1. Navigate to the `/backend` directory.
2. Install dependencies (e.g., `pip install -r requirements.txt`).
3. Set up the PostgreSQL database and run migrations: `alembic upgrade head`.
4. Run the FastAPI server.

### Frontend
1. Navigate to the `/frontend` directory.
2. Install dependencies: `npm install`.
3. Run the development server: `npm run dev`.
4. The frontend will automatically proxy `/api` requests to the local backend.

## Deployment
The cleanest production split is:
- Vercel: frontend
- Supabase: PostgreSQL
- Render: FastAPI backend

### 1. Supabase
1. Create a new Supabase project.
2. Copy the Postgres connection string from the Supabase dashboard.
3. Use the direct async URL format in `DATABASE_URL`, for example:
	`postgresql+asyncpg://USER:PASSWORD@HOST:5432/postgres`
4. Run Alembic migrations against that database before or after first deploy.

### 2. Render backend
1. Create a new Render Web Service from the `backend/` folder.
2. Use the included `backend/Dockerfile`.
3. Set env vars:
	- `DATABASE_URL` to the Supabase connection string
	- `GEMINI_API_KEY`
	- `CORS_ORIGINS` to your Vercel app URL, for example `https://your-app.vercel.app`
4. Deploy on port `8000`.

### 3. Vercel frontend
1. Import the repo or the `frontend/` app into Vercel.
2. Set env vars:
	- `DAILY_API_URL` to your Render backend URL, for example `https://your-backend.onrender.com`
	- the `NEXT_PUBLIC_FIREBASE_*` values if you are using Firebase auth or storage
3. Deploy the app.

### 4. Important wiring
- The frontend proxy routes in `frontend/src/app/api/*` and `frontend/next.config.ts` read `DAILY_API_URL`.
- The backend now reads `CORS_ORIGINS`, so you do not need to rebuild code when the Vercel URL changes.
- Supabase is only used for Postgres here; Firebase remains separate if you are using it for auth.
