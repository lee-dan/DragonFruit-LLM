from sqlalchemy.orm import Session
from collections import Counter
from db import schemas
from models.models import DeveloperInsight
from typing import List
from sqlalchemy import func

INSIGHT_CATALOG = {
    "hallucination": {
        "title": "High Hallucination Rate",
        "description": "The model is frequently generating factually incorrect or nonsensical information.",
        "recommendation": "Strengthen your RAG pipeline. Ensure context documents are relevant and up-to-date. Consider implementing a fact-checking layer or using a more grounded model.",
        "severity": "High"
    },
    "causal_judgment": {
        "title": "Weakness in Causal Reasoning",
        "description": "The model struggles to understand cause-and-effect relationships.",
        "recommendation": "Fine-tune the model with domain-specific datasets that include causal pairs. Use prompt engineering techniques like Chain-of-Thought or few-shot examples to guide the model's reasoning process.",
        "severity": "Medium"
    },
    "epistemic_reasoning": {
        "title": "Poor Epistemic Awareness",
        "description": "The model is overconfident and fails to recognize the limits of its own knowledge.",
        "recommendation": "Incorporate prompts that test for uncertainty. For example, ask questions where 'I don't know' is the correct answer. This can help calibrate the model's confidence.",
        "severity": "Medium"
    },
    "default": {
        "title": "General Performance Issues",
        "description": "The model is exhibiting a pattern of varied, non-specific failures.",
        "recommendation": "Review the overall quality of your fine-tuning data. Consider a broader range of stress tests to isolate specific weaknesses. A more diverse evaluation set may be needed.",
        "severity": "Low"
    }
}


def generate_developer_insights(db: Session) -> List[DeveloperInsight]:
    insights = []
    print("--- [DEBUG] Starting Insight Generation ---", flush=True)
    
    # Insight 1: Most common failure category for the most used model
    try:
        most_common_model = db.query(schemas.TestRun.model_name, func.count(schemas.TestRun.id).label('model_count')) \
            .group_by(schemas.TestRun.model_name).order_by(func.count(schemas.TestRun.id).desc()).first()

        if most_common_model:
            model_name = most_common_model[0]
            print(f"--- [DEBUG] Most common model: {model_name} ---", flush=True)
            
            failures = db.query(schemas.TestCase).join(schemas.TestRun).filter(
                schemas.TestRun.model_name == model_name,
                schemas.TestCase.is_failure == True
            ).all()
            print(f"--- [DEBUG] Found {len(failures)} failures for this model. ---", flush=True)
            
            if failures:
                category_counts = Counter(f.category for f in failures if f.category)
                print(f"--- [DEBUG] Failure category counts: {category_counts} ---", flush=True)

                if category_counts:
                    most_common_failure_category = category_counts.most_common(1)[0][0]
                    print(f"--- [DEBUG] Most common failure category: {most_common_failure_category} ---", flush=True)
                    
                    insight_key = most_common_failure_category.replace("bigbench:", "")
                    template = INSIGHT_CATALOG.get(insight_key, INSIGHT_CATALOG["default"])
                    
                    insight_data = {
                        "title": f"{template['title']} in {model_name}",
                        "description": template['description'],
                        "recommendation": template['recommendation'],
                        "severity": template['severity']
                    }
                    print(f"--- [DEBUG] Generated Insight 1 data: {insight_data} ---", flush=True)
                    
                    insight = DeveloperInsight(**insight_data)
                    insights.append(insight)
                else:
                    print("--- [DEBUG] No categories to analyze for Insight 1. ---", flush=True)
    except Exception as e:
        print(f"--- [DEBUG] ERROR generating Insight 1: {e} ---", flush=True)

    # Insight 2: High overall hallucination rate
    try:
        hallucination_failures = db.query(schemas.FailureLog).filter(schemas.FailureLog.failure_type == schemas.FailureType.HALLUCINATION).count()
        total_failures = db.query(schemas.FailureLog).count()
        print(f"--- [DEBUG] Hallucination failures: {hallucination_failures}, Total failures: {total_failures} ---", flush=True)

        if total_failures > 0 and (hallucination_failures / total_failures) > 0.3: # Threshold of 30%
            template = INSIGHT_CATALOG["hallucination"]
            insight_data = {
                "title": template['title'],
                "description": template['description'],
                "recommendation": template['recommendation'],
                "severity": template['severity']
            }
            print(f"--- [DEBUG] Generated Insight 2 data: {insight_data} ---", flush=True)
            insight = DeveloperInsight(**insight_data)
            insights.append(insight)
    except Exception as e:
        print(f"--- [DEBUG] ERROR generating Insight 2: {e} ---", flush=True)

    print(f"--- [DEBUG] Finished Insight Generation. Returning {len(insights)} insights. ---", flush=True)
    return insights
