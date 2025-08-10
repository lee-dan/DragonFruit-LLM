from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from db.database import create_tables
from api.v1 import test_runs, datasets, insights, business_rules, models


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    create_tables()
    print("Tables created.")
    yield
    print("Shutting down...")


app = FastAPI(
    title="FailProof API",
    description="API for LLM stress testing and failure detection.",
    version="0.1.0",
    lifespan=lifespan,
)

# Set up CORS
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(test_runs.router, prefix="/api/v1/test-runs", tags=["Test Runs"])
app.include_router(insights.router, prefix="/api/v1/insights", tags=["Insights"])
app.include_router(datasets.router, prefix="/api/v1", tags=["Datasets"])
app.include_router(business_rules.router, prefix="/api/v1/business-rules", tags=["Business Rules"])
app.include_router(models.router, prefix="/api/v1/models", tags=["Models"])

@app.get("/health", tags=["Status"])
async def health_check():
    """
    Health check endpoint to ensure the API is running.
    """
    return {"status": "ok"}
