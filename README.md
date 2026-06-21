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
