import time
import os
import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session
from db import schemas
from db.database import SessionLocal
from services import (
    input_generator, 
    failure_analysis_service, 
    dataset_service,
    hard_case_mining_service,
    prompt_utils
)
from services.model_service import model_service
from fastapi import BackgroundTasks
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
                # Wrap the prompt with markdown formatting directive if enabled
                # For now, we'll always enable it, but this could be made configurable
                use_markdown_wrapper = True  # Could be made configurable via test_run settings
                
                if use_markdown_wrapper:
                    wrapped_prompt = prompt_utils.markdown_prompt_wrapper(prompt)
                else:
                    wrapped_prompt = prompt
                
                # We need to get logprobs for ShED-HD
                response = model_service.invoke_with_logprobs(
                    test_run.model_name, 
                    wrapped_prompt
                )
                response_text = response["content"]
                # Handle both possible logprobs structures
                response_metadata = response.get("response_metadata", {})
                if isinstance(response_metadata, dict):
                    logprobs = response_metadata.get("logprobs", {}).get("content", [])
                else:
                    logprobs = []
            except Exception as e:
                response_text = f"Error calling LLM: {e}"
                logprobs = []

            latency_ms = (time.time() - start_time) * 1000

            is_hallucination = False
            hallucination_likelihood = None
            if test_run.detect_hallucinations:
                # Use the ShedHD function to get both detection and likelihood
                try:
                    from .llama_inference import detect_hallucination_from_entropy_sequence
                    from .llama_inference import entropy_from_top_logprobs
                    
                    # Calculate entropy sequence from logprobs
                    entropy_sequence = []
                    for logprob_dict in logprobs:
                        if logprob_dict and isinstance(logprob_dict, dict):
                            entropy = entropy_from_top_logprobs(logprob_dict)
                            if np.isfinite(entropy):
                                entropy_sequence.append(entropy)
                    
                    if entropy_sequence:
                        shedhd_result = detect_hallucination_from_entropy_sequence(entropy_sequence)
                        if 'error' not in shedhd_result:
                            is_hallucination = shedhd_result['is_hallucination']
                            # Convert confidence to percentage (0-100)
                            hallucination_likelihood = shedhd_result['confidence'] * 100
                        else:
                            print(f"Warning: ShedHD error: {shedhd_result['error']}")
                            # Fallback to old method
                            is_hallucination = failure_analysis_service.detect_hallucination(logprobs)
                except Exception as e:
                    print(f"Warning: ShedHD detection failed, falling back to old method: {e}")
                    is_hallucination = failure_analysis_service.detect_hallucination(logprobs)
            
            llm_failures = []
            if test_run.detect_failures_llm:
                llm_failures = failure_analysis_service.detect_failures_with_llm(prompt, response_text)

            # Only count LLM-detected failures as actual failures, not hallucinations
            is_failure = len(llm_failures) > 0

            test_case = schemas.TestCase(
                test_run_id=run_id,
                source_type=source_type,
                category=category,
                prompt=prompt,
                response=response_text,
                latency_ms=latency_ms,
                is_failure=is_failure,
                hallucination_likelihood=hallucination_likelihood,
            )
            db.add(test_case)
            db.flush() # Use flush to get the test_case.id before committing

            # Don't log hallucinations as failures - they're just scored
            
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
    }
