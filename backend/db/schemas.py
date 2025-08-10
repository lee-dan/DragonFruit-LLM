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
