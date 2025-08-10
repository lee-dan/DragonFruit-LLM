import enum
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
    Enum,
    Boolean,
    JSON,
)
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()


class TestRunStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class FailureType(str, enum.Enum):
    HALLUCINATION = "HALLUCINATION"
    SCHEMA = "SCHEMA"
    POLICY = "POLICY"
    REFUSAL = "REFUSAL"
    CRASH = "CRASH"
    INCORRECT_OUTPUT = "INCORRECT_OUTPUT"


class HallucinationTestRun(Base):
    __tablename__ = "hallucination_test_runs"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(Enum(TestRunStatus), default=TestRunStatus.PENDING)
    datasets = Column(JSON)  # {"TriviaQA": 10, "Jeopardy": 5, "Biology": 15}
    total_questions = Column(Integer, default=0)
    completed_questions = Column(Integer, default=0)
    hallucination_count = Column(Integer, default=0)
    total_confidence = Column(Float, default=0.0)
    average_confidence = Column(Float, default=0.0)
    
    test_cases = relationship("HallucinationTestCase", back_populates="test_run", cascade="all, delete-orphan")


class HallucinationTestCase(Base):
    __tablename__ = "hallucination_test_cases"
    id = Column(Integer, primary_key=True, index=True)
    test_run_id = Column(Integer, ForeignKey("hallucination_test_runs.id"))
    dataset = Column(String)  # e.g., 'TriviaQA', 'Jeopardy', 'Biology'
    question = Column(Text)
    answer = Column(Text)
    is_hallucination = Column(Boolean, default=False, index=True)
    confidence = Column(Float)
    class_probabilities = Column(JSON)  # [non_hallucination_prob, hallucination_prob]
    average_entropy = Column(Float)
    entropy_std = Column(Float)
    token_entropies = Column(JSON)
    latency_ms = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    test_run = relationship("HallucinationTestRun", back_populates="test_cases")


class TestRun(Base):
    __tablename__ = "test_runs"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(Enum(TestRunStatus), default=TestRunStatus.PENDING)
    detect_hallucinations = Column(Boolean, default=False)
    detect_failures_llm = Column(Boolean, default=False)
    mutators = Column(JSON)
    datasets = Column(JSON)
    use_evolved_cases = Column(Boolean, default=False)
    total_cases = Column(Integer, default=0)
    completed_cases = Column(Integer, default=0)
    
    test_cases = relationship("TestCase", back_populates="test_run", cascade="all, delete-orphan")


class TestCase(Base):
    __tablename__ = "test_cases"
    id = Column(Integer, primary_key=True, index=True)
    test_run_id = Column(Integer, ForeignKey("test_runs.id"))
    source_type = Column(String)  # e.g., 'mutator', 'dataset', 'evolved'
    category = Column(String)     # e.g., 'malformed_json', 'causal_judgment'
    prompt = Column(Text)
    response = Column(Text)
    latency_ms = Column(Float)
    is_failure = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    test_run = relationship("TestRun", back_populates="test_cases")
    failure_logs = relationship("FailureLog", back_populates="test_case", cascade="all, delete-orphan")


class FailureLog(Base):
    __tablename__ = "failure_logs"
    id = Column(Integer, primary_key=True, index=True)
    test_case_id = Column(Integer, ForeignKey("test_cases.id"))
    failure_type = Column(Enum(FailureType), index=True)
    log_message = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    test_case = relationship("TestCase", back_populates="failure_logs")

class EvolvedTestCase(Base):
    __tablename__ = "evolved_test_cases"
    id = Column(Integer, primary_key=True, index=True)
    original_test_case_id = Column(Integer, ForeignKey("test_cases.id"))
    evolved_prompt = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    original_test_case = relationship("TestCase")


class BusinessRule(Base):
    __tablename__ = "business_rules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    rule_type = Column(String, nullable=False)  # 'safety', 'business', 'compliance', etc.
    constraint_text = Column(Text, nullable=False)  # The actual rule/constraint
    severity = Column(String, default="MEDIUM")  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Optional: link to specific test runs or models
    model_name = Column(String, nullable=True)  # If rule is model-specific
    test_run_id = Column(Integer, ForeignKey("test_runs.id"), nullable=True)
