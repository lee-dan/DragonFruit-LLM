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
    hard_case_mining_service,
    business_rules_service
)
from services.vercel_ai_bridge import get_vercel_bridge, is_vercel_model
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

        # Determine which LLM interface to use
        if is_vercel_model(test_run.model_name):
            # Use Vercel AI Bridge for Vercel SDK models
            print(f"Using Vercel AI Bridge for model: {test_run.model_name}")
            bridge = get_vercel_bridge()
            llm = None  # We'll use bridge.generate_text() directly
        else:
            # Use traditional LangChain for existing models
            print(f"Using LangChain for model: {test_run.model_name}")
            llm = ChatOpenAI(openai_api_key=os.getenv("OPENAI_API_KEY"), model_name=test_run.model_name)
            bridge = None
        
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
                if bridge:
                    # Use Vercel AI Bridge
                    response = bridge.generate_text(
                        model_name=test_run.model_name,
                        prompt=prompt,
                        max_tokens=1000,
                        temperature=0.7
                    )
                    response_text = response.get('content', '')
                    logprobs = []  # Vercel AI SDK doesn't provide logprobs yet
                else:
                    # Use traditional LangChain
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
                # Get active business rules for this model
                business_rules = business_rules_service.get_business_rules(
                    db, 
                    model_name=test_run.model_name
                )
                business_rules_dict = [
                    {
                        "name": rule.name,
                        "constraint_text": rule.constraint_text,
                        "severity": rule.severity
                    }
                    for rule in business_rules
                ]
                
                llm_failures = failure_analysis_service.detect_failures_with_llm(
                    prompt, 
                    response_text, 
                    business_rules=business_rules_dict
                )

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
                # Map POLICY_VIOLATION to POLICY to match the schema enum
                failure_type = failure["failure_type"]
                if failure_type == "POLICY_VIOLATION":
                    failure_type = "POLICY"
                
                failure_log = schemas.FailureLog(
                    test_case_id=test_case.id,
                    failure_type=schemas.FailureType[failure_type],
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

def get_dashboard_metrics(db: Session, time_range_hours: int = 24):
    """
    Calculates and returns the metrics for the dashboard.
    
    Args:
        time_range_hours: Time range in hours for the trend data
    """
    total_runs = db.query(schemas.TestRun).count()
    total_test_cases = db.query(schemas.TestCase).count()
    active_runs = db.query(schemas.TestRun).filter(schemas.TestRun.status == 'RUNNING').count()

    total_failures = db.query(schemas.TestCase).filter(schemas.TestCase.is_failure == True).count()
    success_rate = ((total_test_cases - total_failures) / total_test_cases) * 100 if total_test_cases > 0 else 0
    
    hallucination_failures = db.query(schemas.FailureLog).filter(schemas.FailureLog.failure_type == 'HALLUCINATION').count()
    hallucination_rate = (hallucination_failures / total_test_cases) * 100 if total_test_cases > 0 else 0

    # Success rate trend for the specified time range
    success_rate_trend = []
    now = datetime.utcnow()
    
    # Determine granularity based on time range
    if time_range_hours <= 1:
        # For 1 hour: 10-minute intervals
        intervals = 6
        interval_minutes = 10
        time_format = "%H:%M"
    elif time_range_hours <= 6:
        # For 6 hours: 30-minute intervals
        intervals = 12
        interval_minutes = 30
        time_format = "%H:%M"
    elif time_range_hours <= 24:
        # For 24 hours: 1-hour intervals
        intervals = time_range_hours
        interval_minutes = 60
        time_format = "%H:00"
    else:
        # For 1 week: 6-hour intervals
        intervals = 28
        interval_minutes = 360
        time_format = "%m/%d %H:00"
    
    for i in range(intervals):
        if time_range_hours <= 1:
            interval_start = now - timedelta(minutes=(i + 1) * interval_minutes)
            interval_end = now - timedelta(minutes=i * interval_minutes)
        else:
            interval_start = now - timedelta(minutes=(i + 1) * interval_minutes)
            interval_end = now - timedelta(minutes=i * interval_minutes)

        cases_in_interval = db.query(schemas.TestCase).filter(
            schemas.TestCase.created_at.between(interval_start, interval_end)
        ).count()

        failures_in_interval = db.query(schemas.TestCase).filter(
            schemas.TestCase.is_failure == True,
            schemas.TestCase.created_at.between(interval_start, interval_end)
        ).count()

        if cases_in_interval > 0:
            interval_success_rate = ((cases_in_interval - failures_in_interval) / cases_in_interval) * 100
        else:
            # For intervals with no data, use null instead of 0 to avoid misleading flat lines
            interval_success_rate = None
        
        success_rate_trend.append({
            "date": interval_start.strftime(time_format), 
            "rate": interval_success_rate,
            "cases": cases_in_interval  # Add case count for debugging
        })
    
    success_rate_trend.reverse()
    
    # Add metadata about data quality
    total_intervals_with_data = sum(1 for item in success_rate_trend if item['rate'] is not None)
    data_quality = {
        "total_intervals": len(success_rate_trend),
        "intervals_with_data": total_intervals_with_data,
        "data_coverage_percent": (total_intervals_with_data / len(success_rate_trend)) * 100 if success_rate_trend else 0
    }

    # Failure types breakdown
    failure_types = db.query(schemas.FailureLog.failure_type, func.count(schemas.FailureLog.id)).group_by(schemas.FailureLog.failure_type).all()
    
    failure_breakdown = {ftype.name: count for ftype, count in failure_types}

    return {
        "total_runs": total_runs,
        "total_test_cases": total_test_cases,
        "active_runs": active_runs,
        "success_rate": success_rate,
        "hallucination_rate": hallucination_rate,
        "failure_breakdown": failure_breakdown,
        "success_rate_trend": success_rate_trend,
        "data_quality": data_quality,
    }
