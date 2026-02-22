# Portfolio AI Clone (Retrieval-First)

This adds a retrieval-first chatbot for your portfolio using:
- Python
- LangChain + Chroma vector store
- OpenRouter (OpenAI-compatible API)
- Free local embeddings by default
- FastAPI backend + optional Streamlit chat app

## 1) Install

```bash
cd ai_clone
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `OPENROUTER_API_KEY` in `.env`.
Defaults are already set for free local embeddings and `SITE_URL=https://jonahheim.com`.

## 2) Run API (for website integration)

```bash
cd ai_clone
source .venv/bin/activate
set -a && source .env && set +a
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

Endpoints:
- `GET /health`
- `POST /api/reindex`
- `POST /api/chat`

## 3) Run Streamlit (optional)

```bash
cd ai_clone
source .venv/bin/activate
set -a && source .env && set +a
streamlit run streamlit_app.py
```

## 4) Connect Website

The site widget in `index.html` calls `http://localhost:8000/api/chat` by default.
To override, set before `app.js` loads:

```html
<script>
  window.PORTFOLIO_AI_API_URL = "https://your-api-domain.com";
</script>
```

## Retrieval-First Behavior

- Answers are grounded in local portfolio docs (`index.html`, `writing/*.html`, `brand_strategy.md.resolved`).
- If info is missing, the assistant says it does not have that information.
- Responses include source file references.

## Notes

- Some OpenRouter chat models are free; availability changes.
- Embeddings are free by default (`EMBEDDING_PROVIDER=local`, `BAAI/bge-small-en-v1.5`).
- If you switch to `EMBEDDING_PROVIDER=openrouter`, embedding usage is usually paid.
