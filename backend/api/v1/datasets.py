from fastapi import APIRouter
from typing import List, Dict, Any
from services import dataset_service

router = APIRouter()

@router.get("/datasets/bigbench", response_model=List[Dict[str, Any]])
def list_bigbench_tasks():
    """
    Returns a list of available BIG-bench tasks.
    """
    return dataset_service.get_bigbench_tasks()
