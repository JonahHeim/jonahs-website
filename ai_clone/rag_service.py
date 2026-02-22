import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from bs4 import BeautifulSoup
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_PATHS = [
    ROOT_DIR / "index.html",
    ROOT_DIR / "brand_strategy.md.resolved",
    *sorted((ROOT_DIR / "writing").glob("*.html")),
]


@dataclass
class RAGConfig:
    openrouter_api_key: str
    chat_model: str = "openai/gpt-oss-20b:free"
    embedding_provider: str = "local"
    local_embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_model: str = "openai/text-embedding-3-small"
    base_url: str = "https://openrouter.ai/api/v1"
    site_url: str = "https://jonahheim.com"
    site_name: str = "Jonah Heim Portfolio"
    persist_dir: str = str(ROOT_DIR / ".chroma")


def _read_file(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="ignore")
    if path.suffix.lower() == ".html":
        soup = BeautifulSoup(text, "html.parser")

        # Remove UI/script noise so retrieval focuses on substantive content.
        for tag_name in ("script", "style", "noscript", "svg"):
            for node in soup.find_all(tag_name):
                node.decompose()

        return soup.get_text(separator="\n", strip=True)
    return text


def load_source_documents(paths: Iterable[Path] = DEFAULT_SOURCE_PATHS) -> list[Document]:
    docs: list[Document] = []
    for path in paths:
        if not path.exists():
            continue
        text = _read_file(path)
        if not text.strip():
            continue
        docs.append(
            Document(
                page_content=text,
                metadata={"source": str(path.relative_to(ROOT_DIR))},
            )
        )
    return docs


class PortfolioRAG:
    def __init__(self, config: RAGConfig):
        if not config.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY is required")

        self.config = config
        if config.embedding_provider == "openrouter":
            self.embeddings = OpenAIEmbeddings(
                api_key=config.openrouter_api_key,
                model=config.embedding_model,
                base_url=config.base_url,
            )
        else:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=config.local_embedding_model,
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},
            )
        self.vector_store = Chroma(
            collection_name="jonah_portfolio",
            embedding_function=self.embeddings,
            persist_directory=config.persist_dir,
        )
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
        self.llm = ChatOpenAI(
            api_key=config.openrouter_api_key,
            model=config.chat_model,
            base_url=config.base_url,
            temperature=0.15,
            default_headers={
                "HTTP-Referer": config.site_url,
                "X-Title": config.site_name,
            },
        )

    def index_documents(self) -> int:
        documents = load_source_documents()
        if not documents:
            return 0

        splitter = RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=120)
        chunks = splitter.split_documents(documents)

        # Reset collection for deterministic re-indexing.
        self.vector_store.delete_collection()
        self.vector_store = Chroma(
            collection_name="jonah_portfolio",
            embedding_function=self.embeddings,
            persist_directory=self.config.persist_dir,
        )
        self.vector_store.add_documents(chunks)
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
        return len(chunks)

    def ensure_index(self) -> None:
        # Chroma starts empty on first run.
        if self.vector_store._collection.count() == 0:  # type: ignore[attr-defined]
            self.index_documents()

    def ask(self, question: str, chat_history: list[dict] | None = None) -> dict:
        self.ensure_index()

        retrieved = self.retriever.invoke(question)
        context = "\n\n".join(
            f"Source: {d.metadata.get('source', 'unknown')}\n{d.page_content}"
            for d in retrieved
        )

        history_lines: list[str] = []
        for item in chat_history or []:
            role = item.get("role", "user")
            content = item.get("content", "")
            if content:
                history_lines.append(f"{role.upper()}: {content}")
        history_text = "\n".join(history_lines)

        system_prompt = (
            "You are Jonah Heim's portfolio AI. "
            "Only answer with facts from the provided context. "
            "If the answer is not in context, say you don't have that information yet "
            "and suggest contacting Jonah. "
            "Keep answers concise and helpful. "
            "At the end of every answer, add a 'Sources:' line with file paths used."
        )

        user_prompt = (
            f"Conversation so far:\n{history_text or 'No prior history'}\n\n"
            f"Context:\n{context or 'No context found.'}\n\n"
            f"User question: {question}"
        )

        response = self.llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]
        )

        sources = list({doc.metadata.get("source", "unknown") for doc in retrieved})
        return {
            "answer": response.content,
            "sources": sources,
        }


def config_from_env() -> RAGConfig:
    return RAGConfig(
        openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
        chat_model=os.getenv("OPENROUTER_CHAT_MODEL", "openai/gpt-oss-20b:free"),
        embedding_provider=os.getenv("EMBEDDING_PROVIDER", "local"),
        local_embedding_model=os.getenv("LOCAL_EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5"),
        embedding_model=os.getenv("OPENROUTER_EMBEDDING_MODEL", "openai/text-embedding-3-small"),
        base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        site_url=os.getenv("SITE_URL", "https://jonahheim.com"),
        site_name=os.getenv("SITE_NAME", "Jonah Heim Portfolio"),
        persist_dir=os.getenv("VECTOR_STORE_DIR", str(ROOT_DIR / ".chroma")),
    )
