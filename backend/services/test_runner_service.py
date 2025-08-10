import time
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db import schemas
from db.database import SessionLocal
from services import (
    input_generator, 
    failure_analysis_service, 
    dataset_service,
    hard_case_mining_service
)
from fastapi import BackgroundTasks
from langchain_openai import ChatOpenAI
from sqlalchemy import func

def run_stress_test(run_id: int):
    """
    This function contains the core logic for the stress test.
    """
    db = SessionLocal()
    try:
        print(f"Starting stress test for run_id: {run_id}")
        
        test_run = db.query(schemas.TestRun).filter(schemas.TestRun.id == run_id).first()
        if not test_run:
            print(f"Error: TestRun with id {run_id} not found.")
            return

        test_run.status = schemas.TestRunStatus.RUNNING
        db.commit()

        llm = ChatOpenAI(openai_api_key=os.getenv("OPENAI_API_KEY"), model_name=test_run.model_name)
        
        mutators = test_run.mutators
        datasets = test_run.datasets
        print(f"Running with mutators: {mutators} and datasets: {datasets}")

        all_prompts = []
        for mutator in mutators:
            prompts = input_generator.get_adversarial_inputs([mutator])
            all_prompts.extend([("mutator", mutator, p) for p in prompts])

        for dataset_name in datasets:
            prompts = dataset_service.get_prompts_from_dataset(dataset_name)
            all_prompts.extend([("dataset", dataset_name, p) for p in prompts])
            
        if test_run.use_evolved_cases:
            evolved_cases = db.query(schemas.EvolvedTestCase).all()
            prompts = [case.evolved_prompt for case in evolved_cases]
            all_prompts.extend([("evolved", "Evolved Hard Cases", p) for p in prompts])

        test_run.total_cases = len(all_prompts)
        db.commit()

        for i, (source_type, category, prompt) in enumerate(all_prompts):
            # Check for cancellation
            db.refresh(test_run)
            if test_run.status == schemas.TestRunStatus.CANCELLED:
                print(f"Test run {run_id} cancelled. Stopping.")
                break

            start_time = time.time()
            
            try:
                # We need to get logprobs for ShED-HD
                response = llm.invoke(prompt, logprobs=True)
                response_text = response.content
                logprobs = response.response_metadata.get("logprobs", {}).get("content", [])
            except Exception as e:
                response_text = f"Error calling LLM: {e}"
                logprobs = []

            latency_ms = (time.time() - start_time) * 1000

            is_hallucination = False
            if test_run.detect_hallucinations:
                is_hallucination = failure_analysis_service.detect_hallucination(logprobs)
            
            llm_failures = []
            if test_run.detect_failures_llm:
                llm_failures = failure_analysis_service.detect_failures_with_llm(prompt, response_text)

            is_failure = is_hallucination or len(llm_failures) > 0

            test_case = schemas.TestCase(
                test_run_id=run_id,
                source_type=source_type,
                category=category,
                prompt=prompt,
                response=response_text,
                latency_ms=latency_ms,
                is_failure=is_failure,
            )
            db.add(test_case)
            db.flush() # Use flush to get the test_case.id before committing

            if is_hallucination:
                failure_log = schemas.FailureLog(
                    test_case_id=test_case.id,
                    failure_type=schemas.FailureType.HALLUCINATION,
                    log_message="Detected by ShED-HD"
                )
                db.add(failure_log)
            
            for failure in llm_failures:
                failure_log = schemas.FailureLog(
                    test_case_id=test_case.id,
                    failure_type=schemas.FailureType[failure["failure_type"]],
                    log_message=failure["explanation"]
                )
                db.add(failure_log)

            test_run.completed_cases = i + 1
            db.commit() # Commit after each test case
        
        if test_run.status != schemas.TestRunStatus.CANCELLED:
            test_run.status = schemas.TestRunStatus.COMPLETED
        
        test_run.completed_at = datetime.utcnow()
        db.commit()

        print(f"Completed stress test for run_id: {run_id}")
        
        # Trigger hard case mining in the background
        # We need a way to pass BackgroundTasks here, or run it differently
        # For now, let's just call it directly for simplicity
        hard_case_mining_service.mine_and_evolve_hard_cases(run_id, db)

    finally:
        db.close()

def get_dashboard_metrics(db: Session):
    """
    Calculates and returns the metrics for the dashboard.
    """
    total_runs = db.query(schemas.TestRun).count()
    total_test_cases = db.query(schemas.TestCase).count()
    active_runs = db.query(schemas.TestRun).filter(schemas.TestRun.status == 'RUNNING').count()

    total_failures = db.query(schemas.TestCase).filter(schemas.TestCase.is_failure == True).count()
    failure_rate = (total_failures / total_test_cases) * 100 if total_test_cases > 0 else 0
    
    hallucination_failures = db.query(schemas.FailureLog).filter(schemas.FailureLog.failure_type == 'HALLUCINATION').count()
    hallucination_rate = (hallucination_failures / total_test_cases) * 100 if total_test_cases > 0 else 0

    # Failure rate trend for the last 24 hours
    failure_rate_trend = []
    now = datetime.utcnow()
    for i in range(24):
        hour_start = now - timedelta(hours=i + 1)
        hour_end = now - timedelta(hours=i)

        cases_in_hour = db.query(schemas.TestCase).filter(
            schemas.TestCase.created_at.between(hour_start, hour_end)
        ).count()

        failures_in_hour = db.query(schemas.TestCase).filter(
            schemas.TestCase.is_failure == True,
            schemas.TestCase.created_at.between(hour_start, hour_end)
        ).count()

        hourly_failure_rate = (failures_in_hour / cases_in_hour) * 100 if cases_in_hour > 0 else 0
        failure_rate_trend.append({"date": hour_start.strftime("%H:00"), "rate": hourly_failure_rate})
    
    failure_rate_trend.reverse()

    # Failure types breakdown
    failure_types = db.query(schemas.FailureLog.failure_type, func.count(schemas.FailureLog.id)).group_by(schemas.FailureLog.failure_type).all()
    
    failure_breakdown = {ftype.name: count for ftype, count in failure_types}

    return {
        "total_runs": total_runs,
        "total_test_cases": total_test_cases,
        "active_runs": active_runs,
        "failure_rate": failure_rate,
        "hallucination_rate": hallucination_rate,
        "failure_breakdown": failure_breakdown,
        "failure_rate_trend": failure_rate_trend,
    }
