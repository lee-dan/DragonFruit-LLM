import time
import os
import json
import random
from datetime import datetime
from sqlalchemy.orm import Session
from db import schemas
from db.database import SessionLocal
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


def get_llama_model():
    """Get or create the Llama model instance."""
    model_path = "/Users/aneeshvathul/local_models/Llama-3.2-1B-Instruct-Q8_0.gguf"
    
    if not os.path.exists(model_path):
        raise Exception(f"Model file not found: {model_path}")
    
    if Llama is None:
        raise Exception("llama-cpp-python is not installed")
    
    try:
        return Llama(
            model_path=model_path,
            n_ctx=2048,
            n_gpu_layers=0,
            verbose=False,
            logits_all=True,  # needed for logprobs
        )
    except Exception as e:
        raise Exception(f"Failed to load model: {str(e)}")


def load_questions_from_json():
    """Load questions from the questions.json file."""
    questions_file = os.path.join(os.path.dirname(__file__), '..', 'questions.json')
    
    if not os.path.exists(questions_file):
        raise Exception(f"Questions file not found: {questions_file}")
    
    with open(questions_file, 'r') as f:
        questions = json.load(f)
    
    return questions


def get_questions_by_dataset(dataset_name: str, count: int):
    """Get a random sample of questions from a specific dataset."""
    questions = load_questions_from_json()
    
    # Filter questions by dataset
    dataset_questions = [q for q in questions if q.get('dataset') == dataset_name]
    
    if not dataset_questions:
        raise Exception(f"No questions found for dataset: {dataset_name}")
    
    # Randomly sample the requested number of questions
    if count > len(dataset_questions):
        print(f"Warning: Requested {count} questions but only {len(dataset_questions)} available for {dataset_name}")
        count = len(dataset_questions)
    
    return random.sample(dataset_questions, count)


def run_hallucination_test(run_id: int):
    """
    Run hallucination detection tests on the specified datasets.
    """
    db = SessionLocal()
    try:
        print(f"Starting hallucination test for run_id: {run_id}")
        
        test_run = db.query(schemas.HallucinationTestRun).filter(schemas.HallucinationTestRun.id == run_id).first()
        if not test_run:
            print(f"Error: HallucinationTestRun with id {run_id} not found.")
            return

        test_run.status = schemas.TestRunStatus.RUNNING
        db.commit()

        # Setup device and model
        _device = setup_device()
        llama_model = get_llama_model()
        
        # Calculate total questions
        total_questions = sum(test_run.datasets.values())
        test_run.total_questions = total_questions
        db.commit()
        
        print(f"Running hallucination test with {total_questions} total questions")
        print(f"Datasets: {test_run.datasets}")

        completed_questions = 0
        hallucination_count = 0
        total_confidence = 0.0

        # Process each dataset
        for dataset_name, question_count in test_run.datasets.items():
            print(f"Processing dataset: {dataset_name} with {question_count} questions")
            
            try:
                questions = get_questions_by_dataset(dataset_name, question_count)
            except Exception as e:
                print(f"Error loading questions for {dataset_name}: {e}")
                continue

            for question_data in questions:
                # Check for cancellation
                db.refresh(test_run)
                if test_run.status == schemas.TestRunStatus.CANCELLED:
                    print(f"Hallucination test run {run_id} cancelled. Stopping.")
                    return

                question = question_data['question']
                start_time = time.time()
                
                try:
                    # Generate response with entropy calculation
                    result = generate_response_with_entropy(
                        llama_model=llama_model,
                        question=question,
                        max_tokens=256,
                        temperature=0.7,
                        top_p=0.9,
                        top_k_probs=100,
                    )
                    
                    if result is None:
                        print(f"Failed to generate response for question: {question}")
                        continue
                    
                    # Extract entropy sequence for hallucination detection
                    entropy_sequence = result.get("token_entropies", [])
                    finite_entropies = [e for e in entropy_sequence if e is not None and not (isinstance(e, float) and (e != e or e == float('inf') or e == float('-inf')))]
                    
                    # Perform hallucination detection
                    hallucination_result = detect_hallucination_from_entropy_sequence(finite_entropies)
                    
                    latency_ms = (time.time() - start_time) * 1000
                    
                    # Extract results
                    answer = result.get("text", "")
                    is_hallucination = hallucination_result.get("is_hallucination", False)
                    confidence = hallucination_result.get("confidence", 0.0)
                    class_probabilities = hallucination_result.get("class_probabilities", [0.0, 0.0])
                    avg_entropy = result.get("avg_entropy")
                    std_entropy = result.get("std_entropy")
                    
                    # Update counters
                    if is_hallucination:
                        hallucination_count += 1
                    total_confidence += confidence
                    
                    # Create test case record
                    test_case = schemas.HallucinationTestCase(
                        test_run_id=run_id,
                        dataset=dataset_name,
                        question=question,
                        answer=answer,
                        is_hallucination=is_hallucination,
                        confidence=confidence,
                        class_probabilities=class_probabilities,
                        average_entropy=avg_entropy,
                        entropy_std=std_entropy,
                        token_entropies=entropy_sequence,
                        latency_ms=latency_ms,
                    )
                    db.add(test_case)
                    
                    completed_questions += 1
                    test_run.completed_questions = completed_questions
                    test_run.hallucination_count = hallucination_count
                    test_run.total_confidence = total_confidence
                    test_run.average_confidence = total_confidence / completed_questions if completed_questions > 0 else 0.0
                    
                    db.commit()
                    
                    print(f"Processed question {completed_questions}/{total_questions} from {dataset_name} - Hallucination: {is_hallucination}, Confidence: {confidence:.3f}")
                    
                except Exception as e:
                    print(f"Error processing question: {e}")
                    continue

        # Mark test as completed
        if test_run.status != schemas.TestRunStatus.CANCELLED:
            test_run.status = schemas.TestRunStatus.COMPLETED
            test_run.completed_at = datetime.utcnow()
            db.commit()

        print(f"Completed hallucination test for run_id: {run_id}")
        print(f"Results: {hallucination_count}/{total_questions} hallucinations detected ({hallucination_count/total_questions*100:.1f}%)")
        print(f"Average confidence: {test_run.average_confidence:.3f}")

    except Exception as e:
        print(f"Error in hallucination test: {e}")
        if test_run:
            test_run.status = schemas.TestRunStatus.FAILED
            db.commit()
    finally:
        db.close()


def get_hallucination_dashboard_metrics(db: Session, time_range_hours: int = 24):
    """
    Calculate and return metrics for hallucination tests dashboard.
    """
    total_runs = db.query(schemas.HallucinationTestRun).count()
    total_questions = db.query(schemas.HallucinationTestCase).count()
    active_runs = db.query(schemas.HallucinationTestRun).filter(schemas.HallucinationTestRun.status == 'RUNNING').count()

    total_hallucinations = db.query(schemas.HallucinationTestCase).filter(schemas.HallucinationTestCase.is_hallucination == True).count()
    hallucination_rate = (total_hallucinations / total_questions) * 100 if total_questions > 0 else 0

    # Calculate average confidence
    avg_confidence_result = db.query(schemas.HallucinationTestCase.confidence).filter(
        schemas.HallucinationTestCase.confidence.isnot(None)
    ).all()
    avg_confidence = sum([r[0] for r in avg_confidence_result]) / len(avg_confidence_result) if avg_confidence_result else 0

    # Success rate trend for the specified time range
    success_rate_trend = []
    now = datetime.utcnow()
    
    # Determine granularity based on time range
    if time_range_hours <= 1:
        interval_minutes = 5
        intervals = 12
    elif time_range_hours <= 6:
        interval_minutes = 15
        intervals = 24
    elif time_range_hours <= 24:
        interval_minutes = 60
        intervals = 24
    else:  # 168 hours (1 week)
        interval_minutes = 60 * 6  # 6 hours
        intervals = 28

    for i in range(intervals):
        end_time = now - datetime.timedelta(minutes=interval_minutes * i)
        start_time = end_time - datetime.timedelta(minutes=interval_minutes)
        
        # Count questions in this time interval
        interval_questions = db.query(schemas.HallucinationTestCase).filter(
            schemas.HallucinationTestCase.created_at >= start_time,
            schemas.HallucinationTestCase.created_at < end_time
        ).count()
        
        # Count hallucinations in this time interval
        interval_hallucinations = db.query(schemas.HallucinationTestCase).filter(
            schemas.HallucinationTestCase.created_at >= start_time,
            schemas.HallucinationTestCase.created_at < end_time,
            schemas.HallucinationTestCase.is_hallucination == True
        ).count()
        
        success_rate = ((interval_questions - interval_hallucinations) / interval_questions) * 100 if interval_questions > 0 else 0
        
        success_rate_trend.append({
            "timestamp": end_time.isoformat(),
            "success_rate": success_rate,
            "total_questions": interval_questions
        })

    return {
        "total_runs": total_runs,
        "total_questions": total_questions,
        "active_runs": active_runs,
        "hallucination_rate": hallucination_rate,
        "average_confidence": avg_confidence,
        "success_rate_trend": list(reversed(success_rate_trend))  # Reverse to show oldest first
    } 