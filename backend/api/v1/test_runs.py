from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from models.models import TestRunInDB, TestRunCreate, DashboardMetrics
from db import schemas
from db.database import get_db
from services import test_runner_service

router = APIRouter()


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


@router.get("/dashboard-metrics/", response_model=DashboardMetrics)
def get_dashboard_metrics_endpoint(db: Session = Depends(get_db)):
    """
    Returns the metrics for the dashboard.
    """
    return test_runner_service.get_dashboard_metrics(db)

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
