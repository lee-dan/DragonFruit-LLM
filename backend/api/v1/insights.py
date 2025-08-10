from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from models.models import DeveloperInsight
from db.database import get_db

router = APIRouter()


@router.get("/", response_model=List[DeveloperInsight])
def get_developer_insights(db: Session = Depends(get_db)):
    """
    Analyzes all test data to generate actionable insights for developers.
    """
    from services.insights_service import generate_developer_insights
    return generate_developer_insights(db)
