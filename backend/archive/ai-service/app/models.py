from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="employee")  # admin, company, manager, employee

class CompanyProfile(Base):
    __tablename__ = "company_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, unique=True, index=True, nullable=False)
    turnover = Column(Float, default=0.0)  # in Crores (Cr)
    experience_years = Column(Integer, default=0)
    similar_projects_completed = Column(Integer, default=0)
    max_project_value = Column(Float, default=0.0)  # in Crores (Cr)
    certifications = Column(Text, default="")  # Comma-separated or JSON
    equipment = Column(Text, default="")  # Comma-separated or JSON
    manpower_count = Column(Integer, default=0)

class Tender(Base):
    __tablename__ = "tenders"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    organization = Column(String, default="")
    value = Column(Float, default=0.0)  # in Crores (Cr)
    EMD = Column(Float, default=0.0)  # in Lakhs
    submission_deadline = Column(String, default="")
    summary = Column(Text, default="")
    file_path = Column(String, default="")
    status = Column(String, default="pending")  # pending, analyzed, error
    
    # Risk Profile (0.0 to 100.0)
    overall_risk_score = Column(Float, default=0.0)
    financial_risk = Column(Float, default=0.0)
    technical_risk = Column(Float, default=0.0)
    compliance_risk = Column(Float, default=0.0)
    documentation_risk = Column(Float, default=0.0)
    
    # AI confidence
    confidence_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Suitability & Go / No-Go (v3.0)
    suitability_score = Column(Float, default=0.0)
    profitability_rating = Column(Float, default=0.0)
    competition_rating = Column(Float, default=0.0)
    difficulty_rating = Column(Float, default=0.0)
    distance_rating = Column(Float, default=0.0)
    bid_readiness_score = Column(Float, default=0.0)
    go_no_go_verdict = Column(String, default="Go")  # Go / No-Go / Cautious
    go_no_go_reason = Column(Text, default="")
    action_plan_json = Column(Text, default="[]")
    
    # Contradictions & Negotiation Assistant
    contradictions_json = Column(Text, default="[]")
    pre_bid_questions_json = Column(Text, default="[]")
    
    # Discovery saved/bookmarked tenders
    is_bookmarked = Column(Boolean, default=False)
    
    clauses = relationship("TenderClause", back_populates="tender", cascade="all, delete-orphan")
    amendments = relationship("TenderAmendment", back_populates="tender", cascade="all, delete-orphan")
    checklist = relationship("DocumentChecklist", back_populates="tender", cascade="all, delete-orphan")

class TenderClause(Base):
    __tablename__ = "tender_clauses"
    
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    category = Column(String, nullable=False)  # financial, experience, technical, documentation
    clause_text = Column(Text, nullable=False)
    required_value = Column(String, default="")
    user_value = Column(String, default="")
    status = Column(String, default="WARN")  # PASS, FAIL, WARN
    explanation = Column(Text, default="")
    confidence = Column(Float, default=1.0)
    
    tender = relationship("Tender", back_populates="clauses")

class TenderAmendment(Base):
    __tablename__ = "tender_amendments"
    
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    title = Column(String, nullable=False)
    file_path = Column(String, default="")
    changes_summary = Column(Text, default="")
    date_uploaded = Column(DateTime, default=datetime.datetime.utcnow)
    
    tender = relationship("Tender", back_populates="amendments")

class DocumentChecklist(Base):
    __tablename__ = "document_checklists"
    
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    document_name = Column(String, nullable=False)
    required_by_date = Column(String, default="")
    status = Column(String, default="missing")  # missing, uploaded, vault_matched
    matching_vault_doc = Column(String, default="")
    
    tender = relationship("Tender", back_populates="checklist")
