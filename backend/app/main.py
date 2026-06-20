from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import edition, interview, ledger, snapshot
from app.api.daily import router as daily_router

app = FastAPI(title="Calm API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router, prefix="/api")
app.include_router(edition.router, prefix="/api")
app.include_router(ledger.router, prefix="/api")
app.include_router(snapshot.router, prefix="/api")
app.include_router(daily_router)
