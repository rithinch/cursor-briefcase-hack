# Pulp Backend

FastAPI + LangGraph autonomous accounts payable API.

## Prerequisites

- Python 3.12+
- A Postgres database (e.g. [Supabase](https://supabase.com) free tier)

## Local Development

**1. Set up environment**

```bash
cp .env.example .env
# fill in DATABASE_URL, ANTHROPIC_API_KEY, JWT_SECRET
```

**2. Install and run**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .

export $(cat .env | grep -v '#' | xargs)
uvicorn api.main:app --reload --port 8000
```

## Docker

**Build:**
```bash
docker build -t pulp-api .
```

**Run:**
```bash
docker run --env-file .env -p 8000:8000 pulp-api
```

API runs at [http://localhost:8000](http://localhost:8000)

- **Scalar UI** → [http://localhost:8000/docs](http://localhost:8000/docs)
- **OpenAPI JSON** → [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string (`postgresql+asyncpg://...`) |
| `ANTHROPIC_API_KEY` | yes | Claude API key |
| `JWT_SECRET` | yes | Secret for approval JWT tokens |
| `RAILS_ENABLED` | no | Payment rails: `mock`, `wise`, `revolut`, `yapily` (default: `mock`) |
| `PULP_SEED_DEV_ACCOUNT` | no | Seed a dev account on startup (default: `false`) |
| `PULP_DEV_API_KEY` | no | API key for the dev account (default: `pk_test_dev`) |
| `LLM_MODEL` | no | Claude model (default: `claude-sonnet-4-6`) |
| `LANGCHAIN_TRACING_V2` | no | Enable LangSmith tracing (default: `false`) |
| `LANGCHAIN_API_KEY` | no | LangSmith API key |

## Project Structure

```
backend/
├── api/      # FastAPI routers + middleware
├── agents/   # LangChain agent functions
├── core/     # Config, logging, security
├── db/       # SQLAlchemy models + async repos
├── graph/    # LangGraph pipeline
└── rails/    # Payment rail implementations (Mock, Wise, Revolut, Yapily)
```
