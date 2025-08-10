from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import sys
import os

# Add the backend directory to the path so we can import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from services.llama_inference import (
    generate_response_with_entropy, 
    detect_hallucination_from_entropy_sequence,
    setup_device
)

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
    model_path = "/Users/aneeshvathul/local_models/Llama-3.2-1B-Instruct-Q8_0.gguf"
    
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


@router.get("/health")
async def hallucination_health_check():
    """
    Health check for hallucination detection service.
    """
    try:
        # Check if model file exists
        model_path = "/Users/aneeshvathul/local_models/Llama-3.2-1B-Instruct-Q8_0.gguf"
        model_exists = os.path.exists(model_path)
        
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