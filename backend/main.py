"""DataLens AI — FastAPI Backend"""

import asyncio
import os
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import upload, eda, predict, story, chat, samples  # noqa: E402

OLLAMA_MODELS = ["llama3.1:latest", "qwen2.5-coder:latest", "mistral:latest"]
OLLAMA_BASE = "http://localhost:11434"


async def _pull_model(model: str) -> None:
    """Pull an Ollama model if not already available (resumable)."""
    try:
        async with httpx.AsyncClient(timeout=1200) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_BASE}/api/pull",
                json={"name": model, "stream": True},
            ) as resp:
                async for _ in resp.aiter_lines():
                    pass
    except Exception:
        pass


async def _pull_all_models() -> None:
    """Pull all Ollama models sequentially on startup."""
    await asyncio.sleep(3)
    for model in OLLAMA_MODELS:
        await _pull_model(model)


@asynccontextmanager
async def lifespan(application: FastAPI):
    asyncio.create_task(_pull_all_models())
    yield


app = FastAPI(title="DataLens AI", version="1.0.0", lifespan=lifespan)

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5000,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
app.include_router(samples.router, prefix="/api")


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
