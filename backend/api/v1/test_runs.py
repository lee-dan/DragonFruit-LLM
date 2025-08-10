from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from models.models import TestRunInDB, TestRunCreate, DashboardMetrics, EvolvedTestCaseInDB, DeveloperInsight
from db import schemas
from db.database import get_db
from services import test_runner_service, failure_analysis_service, hard_case_mining_service

router = APIRouter()


@router.get("/dashboard-metrics/", response_model=DashboardMetrics)
def get_dashboard_metrics_endpoint(
    time_range_hours: int = 24,
    db: Session = Depends(get_db)
):
    """
    Returns the metrics for the dashboard.
    
    Args:
        time_range_hours: Time range in hours for the trend data (default: 24)
                         Supported values: 1, 6, 24, 168 (1 week)
    """
    # Validate time range
    allowed_ranges = [1, 6, 24, 168]
    if time_range_hours not in allowed_ranges:
        time_range_hours = 24
    
    return test_runner_service.get_dashboard_metrics(db, time_range_hours)


@router.post("/", response_model=TestRunInDB)
def create_test_run(
    test_run: TestRunCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    db_test_run = schemas.TestRun(**test_run.dict())
    db.add(db_test_run)
    db.commit()
    db.refresh(db_test_run)

    background_tasks.add_task(test_runner_service.run_stress_test, db_test_run.id)

    return db_test_run


@router.get("/{run_id}", response_model=TestRunInDB)
def read_test_run(run_id: int, db: Session = Depends(get_db)):
    db_test_run = db.query(schemas.TestRun).filter(schemas.TestRun.id == run_id).first()
    if db_test_run is None:
        raise HTTPException(status_code=404, detail="TestRun not found")
    return db_test_run


@router.get("/", response_model=List[TestRunInDB])
def read_test_runs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    test_runs = db.query(schemas.TestRun).offset(skip).limit(limit).all()
    return test_runs


@router.delete("/{run_id}", status_code=204)
def delete_test_run(run_id: int, db: Session = Depends(get_db)):
    db_test_run = db.query(schemas.TestRun).filter(schemas.TestRun.id == run_id).first()
    if db_test_run is None:
        raise HTTPException(status_code=404, detail="TestRun not found")
    db.delete(db_test_run)
    db.commit()
    return

@router.post("/{run_id}/cancel", response_model=TestRunInDB)
def cancel_test_run(run_id: int, db: Session = Depends(get_db)):
    """
    Cancels a running test run.
    """
    db_test_run = db.query(schemas.TestRun).filter(schemas.TestRun.id == run_id).first()
    if db_test_run is None:
        raise HTTPException(status_code=404, detail="TestRun not found")

    if db_test_run.status != schemas.TestRunStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Test run is not in a running state.")

    db_test_run.status = schemas.TestRunStatus.CANCELLED
    db.commit()
    db.refresh(db_test_run)
    return db_test_run

@router.get("/{run_id}/evolved-cases", response_model=List[EvolvedTestCaseInDB])
def get_evolved_cases_for_run(run_id: int, db: Session = Depends(get_db)):
    """
    Retrieves all evolved test cases generated from a specific test run.
    """
    from sqlalchemy import select
    
    failed_case_ids = select(schemas.TestCase.id).where(
        schemas.TestCase.test_run_id == run_id,
        schemas.TestCase.is_failure == True
    )

    evolved_cases = db.query(schemas.EvolvedTestCase).filter(
        schemas.EvolvedTestCase.original_test_case_id.in_(failed_case_ids)
    ).all()

    return evolved_cases
