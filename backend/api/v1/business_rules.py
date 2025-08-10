from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from db.database import get_db
from services import business_rules_service
from pydantic import BaseModel
import datetime

router = APIRouter()

class BusinessRuleCreate(BaseModel):
    name: str
    description: str
    rule_type: str
    constraint_text: str
    severity: str = "MEDIUM"
    model_name: Optional[str] = None
    test_run_id: Optional[int] = None

class BusinessRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rule_type: Optional[str] = None
    constraint_text: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None

class BusinessRuleResponse(BaseModel):
    id: int
    name: str
    description: str
    rule_type: str
    constraint_text: str
    severity: str
    is_active: bool
    model_name: Optional[str] = None
    test_run_id: Optional[int] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime.datetime: lambda v: v.isoformat()
        }

@router.get("/", response_model=List[BusinessRuleResponse])
def get_business_rules(
    rule_type: Optional[str] = None,
    model_name: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    """Get business rules with optional filtering."""
    return business_rules_service.get_business_rules(
        db=db,
        rule_type=rule_type,
        model_name=model_name,
        is_active=is_active
    )

@router.get("/defaults")
def get_default_business_rules():
    """Get default business rules that can be used as templates."""
    return business_rules_service.get_default_business_rules()

@router.post("/check-violation")
def check_policy_violation(
    prompt: str,
    response: str,
    model_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Check if a prompt/response pair violates any active business rules."""
    violations = business_rules_service.check_policy_violation(
        db=db,
        prompt=prompt,
        response=response,
        model_name=model_name
    )
    return {
        "has_violations": len(violations) > 0,
        "violations": violations,
        "total_violations": len(violations)
    }

@router.post("/", response_model=BusinessRuleResponse)
def create_business_rule(
    rule: BusinessRuleCreate,
    db: Session = Depends(get_db)
):
    """Create a new business rule."""
    try:
        business_rule = business_rules_service.create_business_rule(
            db=db,
            name=rule.name,
            description=rule.description,
            rule_type=rule.rule_type,
            constraint_text=rule.constraint_text,
            severity=rule.severity,
            model_name=rule.model_name,
            test_run_id=rule.test_run_id
        )
        return business_rule
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{rule_id}", response_model=BusinessRuleResponse)
def update_business_rule(
    rule_id: int,
    rule_update: BusinessRuleUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing business rule."""
    updated_rule = business_rules_service.update_business_rule(
        db=db,
        rule_id=rule_id,
        **rule_update.dict(exclude_unset=True)
    )
    if not updated_rule:
        raise HTTPException(status_code=404, detail="Business rule not found")
    return updated_rule

@router.delete("/{rule_id}")
def delete_business_rule(
    rule_id: int,
    db: Session = Depends(get_db)
):
    """Soft delete a business rule."""
    success = business_rules_service.delete_business_rule(db=db, rule_id=rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Business rule not found")
    return {"message": "Business rule deleted successfully"}

@router.post("/{rule_id}/activate")
def activate_business_rule(
    rule_id: int,
    db: Session = Depends(get_db)
):
    """Activate a business rule."""
    updated_rule = business_rules_service.update_business_rule(
        db=db,
        rule_id=rule_id,
        is_active=True
    )
    if not updated_rule:
        raise HTTPException(status_code=404, detail="Business rule not found")
    return {"message": "Business rule activated successfully"}

@router.post("/{rule_id}/deactivate")
def deactivate_business_rule(
    rule_id: int,
    db: Session = Depends(get_db)
):
    """Deactivate a business rule."""
    updated_rule = business_rules_service.update_business_rule(
        db=db,
        rule_id=rule_id,
        is_active=False
    )
    if not updated_rule:
        raise HTTPException(status_code=404, detail="Business rule not found")
    return {"message": "Business rule deactivated successfully"}
