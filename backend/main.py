"""DataLens AI — FastAPI Backend"""

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import upload, eda, predict, story, chat  # noqa: E402

app = FastAPI(title="DataLens AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(upload.router, prefix="/api")
app.include_router(eda.router, prefix="/api")
app.include_router(predict.router, prefix="/api")
app.include_router(story.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ─── Shared state (in-process, single-user) ───
# For a production app, use Redis / DB. For a thesis demo this is fine.
class AppState:
    df = None            # pandas DataFrame
    filename: str = ""
    db_path: str = ""    # SQLite path for chat


state = AppState()


def get_state() -> AppState:
    return state
