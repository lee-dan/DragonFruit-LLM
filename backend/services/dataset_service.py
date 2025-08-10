import os
import json
from typing import List, Dict, Any

BIGBENCH_BASE_PATH = "data/bigbench"

def get_bigbench_tasks() -> List[Dict[str, Any]]:
    """
    Scans the processed BIG-bench directory to get a list of available tasks.
    """
    tasks = []
    if not os.path.exists(BIGBENCH_BASE_PATH):
        return []
        
    for filename in os.listdir(BIGBENCH_BASE_PATH):
        if filename.endswith(".json"):
            task_name = filename[:-5]
            
            # Try to read the description from the file
            description = "No description available."
            try:
                with open(os.path.join(BIGBENCH_BASE_PATH, filename), 'r') as f:
                    data = json.load(f)
                    description = data.get("description", description)
            except (IOError, json.JSONDecodeError):
                pass # Ignore errors, use default description
            
            tasks.append({
                "id": f"bigbench:{task_name}",
                "name": task_name.replace("_", " ").title(),
                "description": description
            })
    return tasks


def get_prompts_from_bigbench_task(task_name: str, num_prompts: int = 100) -> List[str]:
    """
    Loads prompts from a specific processed BIG-bench task JSON file.
    """
    task_path = os.path.join(BIGBENCH_BASE_PATH, f"{task_name}.json")
    try:
        with open(task_path, 'r') as f:
            task_data = json.load(f)
        
        prompts = task_data.get("prompts", [])
        
        if len(prompts) > num_prompts:
            import random
            return random.sample(prompts, num_prompts)
        return prompts
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading BIG-bench task {task_name}: {e}")
        return []

def get_prompts_from_dataset(dataset_name: str, num_prompts: int = 10):
    """
    Loads prompts from a BIG-bench dataset file.
    """
    if dataset_name.startswith("bigbench:"):
        task_name = dataset_name.split(":")[1]
        return get_prompts_from_bigbench_task(task_name, num_prompts)
        
    # For now, only support BIG-bench datasets
    print(f"Dataset {dataset_name} not supported. Only BIG-bench datasets are currently supported.")
    return []



