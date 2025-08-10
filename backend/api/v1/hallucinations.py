from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict
import sys
import os
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Load environment variables from .env file
from dotenv import load_dotenv

load_dotenv()

# Add the backend directory to the path so we can import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from services.llama_inference import (
    generate_response_with_entropy, 
    detect_hallucination_from_entropy_sequence,
    setup_device
)
from services.hallucination_test_service import run_hallucination_test, get_hallucination_dashboard_metrics
from models.models import HallucinationTestRunCreate, HallucinationTestRunInDB, HallucinationTestCaseInDB
from db import schemas
from db.database import get_db

try:
    from llama_cpp import Llama
except ImportError:
    print("Error: llama-cpp-python is not installed.")
    Llama = None

router = APIRouter()


class HallucinationRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = 256
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.9


class HallucinationResponse(BaseModel):
    answer: str
    is_hallucination: bool
    confidence: float
    class_probabilities: List[float]
    average_entropy: Optional[float]
    entropy_std: Optional[float]
    token_entropies: List[float]
    entropy_sequence: List[float]  # Clean entropy sequence for charting
    error: Optional[str] = None


def get_llama_model():
    """Get or create the Llama model instance."""
    model_path = os.getenv("LLAMA_MODEL_PATH")

    if not model_path:
        raise HTTPException(
            status_code=500, 
            detail="LLAMA_MODEL_PATH environment variable not set"
        )
    
    if not os.path.exists(model_path):
        raise HTTPException(
            status_code=500, 
            detail=f"Model file not found: {model_path}"
        )
    
    if Llama is None:
        raise HTTPException(
            status_code=500, 
            detail="llama-cpp-python is not installed"
        )
    
    try:
        return Llama(
            model_path=model_path,
            n_ctx=2048,
            n_gpu_layers=0,
            verbose=False,
            logits_all=True,  # needed for logprobs
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to load model: {str(e)}"
        )


@router.post("/detect", response_model=HallucinationResponse)
async def detect_hallucination(request: HallucinationRequest):
    """
    Detect hallucination in a model response to a given prompt.
    
    Returns the generated answer along with hallucination detection results.
    """
    try:
        # Setup device
        _device = setup_device()
        
        # Get the Llama model
        llama_model = get_llama_model()
        
        # Generate response with entropy calculation
        result = generate_response_with_entropy(
            llama_model=llama_model,
            question=request.prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
            top_k_probs=100,
        )
        
        if result is None:
            raise HTTPException(
                status_code=500, 
                detail="Failed to generate response"
            )
        
        # Extract entropy sequence for hallucination detection
        entropy_sequence = result.get("token_entropies", [])
        finite_entropies = [e for e in entropy_sequence if e is not None and not (isinstance(e, float) and (e != e or e == float('inf') or e == float('-inf')))]
        
        # Perform hallucination detection
        hallucination_result = detect_hallucination_from_entropy_sequence(finite_entropies)
        
        return HallucinationResponse(
            answer=result.get("text", ""),
            is_hallucination=hallucination_result.get("is_hallucination", False),
            confidence=hallucination_result.get("confidence", 0.0),
            class_probabilities=hallucination_result.get("class_probabilities", [0.0, 0.0]),
            average_entropy=result.get("avg_entropy"),
            entropy_std=result.get("std_entropy"),
            token_entropies=entropy_sequence,
            entropy_sequence=finite_entropies,  # Clean sequence for charting
            error=hallucination_result.get("error")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/test-runs", response_model=HallucinationTestRunInDB)
async def create_hallucination_test_run(
    test_run: HallucinationTestRunCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Create a new hallucination test run.
    """
    db_test_run = schemas.HallucinationTestRun(**test_run.dict())
    db.add(db_test_run)
    db.commit()
    db.refresh(db_test_run)

    background_tasks.add_task(run_hallucination_test, db_test_run.id)

    return db_test_run


@router.get("/test-runs/{run_id}", response_model=HallucinationTestRunInDB)
async def read_hallucination_test_run(run_id: int, db: Session = Depends(get_db)):
    """
    Get a specific hallucination test run by ID.
    """
    db_test_run = db.query(schemas.HallucinationTestRun).filter(schemas.HallucinationTestRun.id == run_id).first()
    if db_test_run is None:
        raise HTTPException(status_code=404, detail="HallucinationTestRun not found")
    return db_test_run


@router.get("/test-runs", response_model=List[HallucinationTestRunInDB])
async def read_hallucination_test_runs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Get all hallucination test runs.
    """
    test_runs = db.query(schemas.HallucinationTestRun).offset(skip).limit(limit).all()
    return test_runs


@router.delete("/test-runs/{run_id}", status_code=204)
async def delete_hallucination_test_run(run_id: int, db: Session = Depends(get_db)):
    """
    Delete a hallucination test run.
    """
    db_test_run = db.query(schemas.HallucinationTestRun).filter(schemas.HallucinationTestRun.id == run_id).first()
    if db_test_run is None:
        raise HTTPException(status_code=404, detail="HallucinationTestRun not found")
    db.delete(db_test_run)
    db.commit()
    return


@router.post("/test-runs/{run_id}/cancel", response_model=HallucinationTestRunInDB)
async def cancel_hallucination_test_run(run_id: int, db: Session = Depends(get_db)):
    """
    Cancel a running hallucination test run.
    """
    db_test_run = db.query(schemas.HallucinationTestRun).filter(schemas.HallucinationTestRun.id == run_id).first()
    if db_test_run is None:
        raise HTTPException(status_code=404, detail="HallucinationTestRun not found")

    if db_test_run.status != schemas.TestRunStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Test run is not in a running state.")

    db_test_run.status = schemas.TestRunStatus.CANCELLED
    db.commit()
    db.refresh(db_test_run)
    return db_test_run


@router.get("/test-runs/{run_id}/test-cases", response_model=List[HallucinationTestCaseInDB])
async def get_hallucination_test_cases(run_id: int, db: Session = Depends(get_db)):
    """
    Get all test cases for a specific hallucination test run.
    """
    test_cases = db.query(schemas.HallucinationTestCase).filter(
        schemas.HallucinationTestCase.test_run_id == run_id
    ).all()
    return test_cases


@router.get("/dashboard-metrics")
async def get_hallucination_dashboard_metrics(
    time_range_hours: int = 24,
    db: Session = Depends(get_db)
):
    """
    Get dashboard metrics for hallucination tests.
    """
    return get_hallucination_dashboard_metrics(db, time_range_hours)


@router.get("/health")
async def hallucination_health_check():
    """
    Health check for hallucination detection service.
    """
    try:
        # Check if model file exists
        model_path = os.getenv("LLAMA_MODEL_PATH")
        model_exists = model_path and os.path.exists(model_path)
        
        # Check if ShedHD model path is set
        shedhd_path = os.getenv("SHEDHD_MODEL_PATH")
        shedhd_available = shedhd_path and os.path.exists(shedhd_path)
        
        return {
            "status": "ok",
            "llama_model_available": model_exists,
            "shedhd_model_available": shedhd_available,
            "llama_cpp_available": Llama is not None
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        } 