from sqlalchemy.orm import Session
from db import schemas
import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List

class EvolvedPrompt(BaseModel):
    """A new, more challenging prompt evolved from a failed test case."""
    new_prompt: str = Field(description="The new, evolved prompt.")

def mine_and_evolve_hard_cases(run_id: int, db: Session, mutator_model: str = "gpt-4o"):
    """
    Analyzes a completed test run to find failed test cases and
    uses an LLM to "evolve" them into new, more challenging prompts.
    """
    print(f"Starting hard case mining for run_id: {run_id}")
    
    failed_cases = db.query(schemas.TestCase).filter(
        schemas.TestCase.test_run_id == run_id,
        schemas.TestCase.is_failure == True
    ).all()
    
    if not failed_cases:
        print("No failed cases to evolve.")
        return

    print(f"Found {len(failed_cases)} failed cases to evolve.")
    
    system_prompt = """
    You are an expert in adversarial testing for AI models. Your task is to analyze a failed test case (a prompt and the model's incorrect response) and generate a new, more challenging prompt that targets the same underlying weakness.

    The new prompt should be a creative and logical evolution of the original, not just a simple rephrasing. It should be designed to be more difficult for the AI to answer correctly.

    Analyze the provided failed test case and return your new, evolved prompt in the specified JSON format.
    """
    
    # For hard case mining, we'll use the original ChatOpenAI approach for now
    # since it needs structured output capabilities
    from langchain_openai import ChatOpenAI
    llm = ChatOpenAI(openai_api_key=os.getenv("OPENAI_API_KEY"), model_name=mutator_model)
    structured_llm = llm.with_structured_output(EvolvedPrompt)
    
    for case in failed_cases:
        human_prompt = f"""
        Analyze the following failed test case:
        
        ORIGINAL PROMPT:
        ---
        {case.prompt}
        ---
        
        FAILED RESPONSE:
        ---
        {case.response}
        ---
        """
        
        try:
            prompt_template = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                ("human", human_prompt)
            ])
            
            chain = prompt_template | structured_llm
            evolved = chain.invoke({})
            
            if evolved.new_prompt:
                new_case = schemas.EvolvedTestCase(
                    original_test_case_id=case.id,
                    evolved_prompt=evolved.new_prompt
                )
                db.add(new_case)
                print(f"Evolved new prompt for case {case.id}")

        except Exception as e:
            print(f"Error evolving prompt for case {case.id}: {e}")

    db.commit()
    print(f"Completed hard case mining for run_id: {run_id}")
