from pydantic import BaseModel
from typing import List, Optional
import datetime
from db.schemas import TestRunStatus, FailureType


class DashboardMetrics(BaseModel):
    total_runs: int
    total_test_cases: int
    active_runs: int
    failure_rate: float
    hallucination_rate: float
    failure_breakdown: dict[str, int]


class TestCaseBase(BaseModel):
    prompt: str
    response: str
    latency_ms: float
    is_failure: bool


class TestCaseCreate(TestCaseBase):
    pass


class FailureLogBase(BaseModel):
    failure_type: FailureType
    log_message: str


class FailureLogCreate(FailureLogBase):
    pass


class FailureLogInDB(FailureLogBase):
    id: int
    test_case_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class TestCaseInDB(TestCaseBase):
    id: int
    test_run_id: int
    source_type: str
    category: str
    failure_logs: List[FailureLogInDB] = []

    class Config:
        from_attributes = True


class TestRunBase(BaseModel):
    model_name: str


class TestRunCreate(TestRunBase):
    mutators: List[str]
    datasets: List[str]
    use_evolved_cases: bool
    detect_hallucinations: bool
    detect_failures_llm: bool


class TestRunInDB(TestRunBase):
    id: int
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime]
    status: TestRunStatus
    test_cases: List[TestCaseInDB] = []
    mutators: List[str]
    datasets: List[str]
    use_evolved_cases: bool
    total_cases: int
    completed_cases: int

    class Config:
        from_attributes = True
