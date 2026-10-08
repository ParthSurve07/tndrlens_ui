from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "employee"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# --- Company Profile Schemas ---
class CompanyProfileBase(BaseModel):
    company_name: str
    turnover: float
    experience_years: int
    similar_projects_completed: int
    max_project_value: float
    certifications: str
    equipment: str
    manpower_count: int

class CompanyProfileCreate(CompanyProfileBase):
    pass

class CompanyProfileResponse(CompanyProfileBase):
    id: int
    
    class Config:
        from_attributes = True

# --- Tender Clauses ---
class TenderClauseResponse(BaseModel):
    id: int
    category: str
    clause_text: str
    required_value: str
    user_value: str
    status: str
    explanation: str
    confidence: float

    class Config:
        from_attributes = True

# --- Amendments ---
class TenderAmendmentResponse(BaseModel):
    id: int
    tender_id: int
    title: str
    changes_summary: str
    file_path: str
    date_uploaded: datetime

    class Config:
        from_attributes = True

# --- Checklist ---
class DocumentChecklistResponse(BaseModel):
    id: int
    tender_id: int
    document_name: str
    required_by_date: str
    status: str
    matching_vault_doc: str

    class Config:
        from_attributes = True

class DocumentChecklistUpdate(BaseModel):
    status: str
    matching_vault_doc: Optional[str] = None

# --- Tender Main ---
class TenderResponse(BaseModel):
    id: int
    title: str
    organization: str
    value: float
    EMD: float
    submission_deadline: str
    summary: str
    file_path: str
    status: str
    overall_risk_score: float
    financial_risk: float
    technical_risk: float
    compliance_risk: float
    documentation_risk: float
    confidence_score: float
    created_at: datetime
    
    # Suitability & Go / No-Go (v3.0)
    suitability_score: float
    profitability_rating: float
    competition_rating: float
    difficulty_rating: float
    distance_rating: float
    bid_readiness_score: float
    go_no_go_verdict: str
    go_no_go_reason: str
    action_plan_json: str
    
    # Contradictions & Pre-Bid questions
    contradictions_json: str
    pre_bid_questions_json: str
    
    # Saved tenders
    is_bookmarked: bool
    
    clauses: List[TenderClauseResponse] = []
    amendments: List[TenderAmendmentResponse] = []
    checklist: List[DocumentChecklistResponse] = []

    class Config:
        from_attributes = True

# --- RAG Chat ---
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str
    references: List[str]
