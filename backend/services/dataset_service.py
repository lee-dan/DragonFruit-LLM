import os
import json
from datasets import load_dataset
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
    Downloads a dataset from Hugging Face or BIG-bench and returns a list of prompts.
    """
    if dataset_name.startswith("bigbench:"):
        task_name = dataset_name.split(":")[1]
        return get_prompts_from_bigbench_task(task_name, num_prompts)
        
    try:
        # We might need to specify splits and column names for different datasets
        dataset = load_dataset(dataset_name, split="train")
        
        # This assumes the dataset has a "text" or "inputs" column.
        # This will need to be made more robust to handle different dataset structures.
        prompt_column = "inputs" if "inputs" in dataset.column_names else "text"
        
        if prompt_column not in dataset.column_names:
            print(f"Warning: Could not find a suitable prompt column in {dataset_name}.")
            return []
            
        prompts = dataset.shuffle().select(range(num_prompts))[prompt_column]
        return prompts
        
    except Exception as e:
        print(f"Error loading dataset {dataset_name}: {e}")
        return []



