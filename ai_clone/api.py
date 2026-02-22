from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from rag_service import PortfolioRAG, config_from_env

load_dotenv()


app = FastAPI(title="Jonah Portfolio AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1200)
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


try:
    rag = PortfolioRAG(config_from_env())
except ValueError:
    rag = None


@app.get("/health")
def health() -> dict:
    if rag is None:
        return {"ok": False, "error": "OPENROUTER_API_KEY is missing"}
    return {"ok": True}


@app.post("/api/reindex")
def reindex() -> dict:
    if rag is None:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is missing")
    chunks = rag.index_documents()
    return {"ok": True, "chunks": chunks}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    if rag is None:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is missing")

    result = rag.ask(
        question=request.question,
        chat_history=[msg.model_dump() for msg in request.history],
    )
    return ChatResponse(answer=str(result["answer"]), sources=list(result["sources"]))
