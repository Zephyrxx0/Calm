import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import edition, interview, ledger, snapshot
from app.api.daily import router as daily_router

app = FastAPI(title="Calm API", version="0.1.0")


def _get_cors_origins() -> list[str]:
    origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router)
app.include_router(edition.router)
app.include_router(ledger.router)
app.include_router(snapshot.router)
app.include_router(daily_router)
