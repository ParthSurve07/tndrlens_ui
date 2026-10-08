from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
import shutil
import hashlib
import secrets
import datetime
import json

from app.config import settings
from app.database import engine, Base, get_db
from app.models import User, CompanyProfile, CompanyTenderDetails, Tender, TenderClause, TenderAmendment, DocumentChecklist, TeamInvitation
from app.schemas import (
    UserCreate, UserResponse, Token, UserLogin, UserProfileUpdate,
    TeamInvitationCreate, TeamInvitationAccept, TeamInvitationResponse, TeamInvitationCreated,
    CompanyProfileCreate, CompanyProfileResponse,
    CompanyTenderDetailsUpdate,
    TenderResponse, DocumentChecklistUpdate, ChatRequest, ChatResponse
)
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.utils.pdf_parser import extract_text_from_pdf
from app.ai.extractor import analyze_tender_text
from app.ai.eligibility import evaluate_eligibility, calculate_decision_support
from app.ai.vector_db import vector_index
from app.ai.diff_tracker import generate_amendment_diff
from app.ai.chatbot import ask_tender_chatbot

app = FastAPI(title="Tndrlens API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify front-end domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB and Seed Data on Startup
@app.on_event("startup")
def startup_db_setup():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    
    # Check if we need to seed users
    if db.query(User).count() == 0:
        print("Seeding default users...")
        admin_user = User(
            username="admin",
            email="admin@buildcorp.com",
            password_hash=get_password_hash("admin123"),
            role="admin"
        )
        company_user = User(
            username="company",
            email="manager@buildcorp.com",
            password_hash=get_password_hash("company123"),
            role="company"
        )
        db.add(admin_user)
        db.add(company_user)
        db.commit()

    # Check if we need to seed company profile
    if db.query(CompanyProfile).count() == 0:
        print("Seeding default company profile...")
        profile = CompanyProfile(
            company_name="BuildCorp Infrastructure Ltd.",
            turnover=165.0, # 165 Cr
            experience_years=12,
            similar_projects_completed=8,
            max_project_value=220.0, # 220 Cr project completed
            certifications="ISO 9001, ISO 14001, ISO 45001, Class-A Contractor License, GST Registration, PAN",
            equipment="1 segment launcher, 3 batching plants (60 cum/hr), 2 road rollers, 3 dumpers, 2 concrete mixers, 1 concrete pump",
            manpower_count=180
        )
        db.add(profile)
        db.commit()
    db.close()

# --- AUTH ENDPOINTS ---

@app.post("/api/auth/register", response_model=UserResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_email = db.query(User).filter(User.email == user_in.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_in.password)
    user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed_password,
        role=user_in.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/auth/login", response_model=Token)
def login_for_access_token(form_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role
    }

@app.get("/api/auth/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/api/auth/me")
def update_users_me(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    username = profile_in.username.strip()
    if not username:
        raise HTTPException(status_code=422, detail="Username cannot be empty")

    existing_user = db.query(User).filter(
        User.username == username,
        User.id != current_user.id,
    ).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Username is already in use")

    email = str(profile_in.email).strip().lower()
    existing_email = db.query(User).filter(
        User.email == email,
        User.id != current_user.id,
    ).first()
    if existing_email:
        raise HTTPException(status_code=409, detail="Email is already in use")

    current_user.username = username
    current_user.email = email
    db.commit()
    db.refresh(current_user)

    # The access token identifies its owner by username, so issue a fresh token
    # when the username changes to keep the current session valid.
    access_token = create_access_token(data={"sub": current_user.username, "role": current_user.role})
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "access_token": access_token,
    }

@app.post("/api/team/invitations", response_model=TeamInvitationCreated)
def create_team_invitation(
    invitation_in: TeamInvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    email = str(invitation_in.email).lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account already exists for this email")

    pending = db.query(TeamInvitation).filter(
        TeamInvitation.invited_by_id == current_user.id,
        TeamInvitation.email == email,
        TeamInvitation.accepted_at.is_(None),
    ).first()
    if pending:
        db.delete(pending)

    token = secrets.token_urlsafe(32)
    now = datetime.datetime.utcnow()
    invitation = TeamInvitation(
        email=email,
        role="employee",
        token_hash=hashlib.sha256(token.encode()).hexdigest(),
        invited_by_id=current_user.id,
        created_at=now,
        expires_at=now + datetime.timedelta(days=7),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return {
        "id": invitation.id,
        "email": invitation.email,
        "role": invitation.role,
        "status": "pending",
        "created_at": invitation.created_at,
        "expires_at": invitation.expires_at,
        "accepted_at": invitation.accepted_at,
        "token": token,
    }

@app.get("/api/team/invitations", response_model=List[TeamInvitationResponse])
def list_team_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.datetime.utcnow()
    invitations = db.query(TeamInvitation).filter(
        TeamInvitation.invited_by_id == current_user.id
    ).order_by(TeamInvitation.created_at.desc()).all()
    return [
        {
            "id": invitation.id,
            "email": invitation.email,
            "role": invitation.role,
            "status": "accepted" if invitation.accepted_at else "expired" if invitation.expires_at <= now else "pending",
            "created_at": invitation.created_at,
            "expires_at": invitation.expires_at,
            "accepted_at": invitation.accepted_at,
        }
        for invitation in invitations
    ]

@app.get("/api/team/invitations/lookup", response_model=TeamInvitationResponse)
def lookup_team_invitation(token: str, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    invitation = db.query(TeamInvitation).filter(TeamInvitation.token_hash == token_hash).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    now = datetime.datetime.utcnow()
    invitation_status = "accepted" if invitation.accepted_at else "expired" if invitation.expires_at <= now else "pending"
    return {
        "id": invitation.id,
        "email": invitation.email,
        "role": invitation.role,
        "status": invitation_status,
        "created_at": invitation.created_at,
        "expires_at": invitation.expires_at,
        "accepted_at": invitation.accepted_at,
    }

@app.post("/api/team/invitations/accept", response_model=UserResponse)
def accept_team_invitation(invite_in: TeamInvitationAccept, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(invite_in.token.encode()).hexdigest()
    invitation = db.query(TeamInvitation).filter(TeamInvitation.token_hash == token_hash).first()
    if not invitation or invitation.accepted_at or invitation.expires_at <= datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="This invitation is invalid, expired, or already used")
    if db.query(User).filter(User.username == invite_in.username).first():
        raise HTTPException(status_code=409, detail="Username already registered")
    if db.query(User).filter(User.email == invitation.email).first():
        raise HTTPException(status_code=409, detail="An account already exists for this email")
    if len(invite_in.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = User(
        username=invite_in.username,
        email=invitation.email,
        password_hash=get_password_hash(invite_in.password),
        role=invitation.role,
    )
    db.add(user)
    db.flush()
    invitation.accepted_user_id = user.id
    invitation.accepted_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user

# --- COMPANY PROFILE ENDPOINTS ---

@app.get("/api/profile", response_model=CompanyProfileResponse)
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(CompanyProfile).first()
    if not profile:
        # Fallback to seed or blank profile if deleted
        profile = CompanyProfile(company_name="BuildCorp Systems", turnover=0.0)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@app.put("/api/profile", response_model=CompanyProfileResponse)
def update_profile(profile_in: CompanyProfileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(CompanyProfile).first()
    if not profile:
        profile = CompanyProfile(company_name=profile_in.company_name)
        db.add(profile)
        
    for field, val in profile_in.model_dump().items():
        setattr(profile, field, val)
        
    db.commit()
    db.refresh(profile)
    
    # Recalculate eligibility scores for all analyzed tenders with new company profile values
    tenders = db.query(Tender).filter(Tender.status == "analyzed").all()
    for tender in tenders:
        try:
            score, evaluated_clauses = evaluate_eligibility(profile, tender.clauses)
            tender.overall_risk_score = 100.0 - score  # Basic inverse mapping: higher eligibility = lower risk
            # Update clause evaluations in DB
            for ec in evaluated_clauses:
                clause_db = db.query(TenderClause).filter(TenderClause.id == ec["id"]).first()
                if clause_db:
                    clause_db.user_value = ec["user_value"]
                    clause_db.status = ec["status"]
                    clause_db.explanation = ec["explanation"]
            
            db.commit()
            
            # Automatically cross-check documents with Vault profile certs
            profile_certs_lower = profile.certifications.lower()
            for item in tender.checklist:
                doc_name_lower = item.document_name.lower()
                for cert_kw in ["iso 9001", "iso 14001", "iso 45001", "class-a", "class a", "pan", "gst"]:
                    if cert_kw in doc_name_lower:
                        if cert_kw in profile_certs_lower:
                            item.status = "vault_matched"
                            item.matching_vault_doc = cert_kw.upper()
                        elif item.status == "vault_matched":
                            item.status = "missing"
                            item.matching_vault_doc = ""
            
            db.commit()
            
            # Recalculate Suitability metrics!
            metrics = calculate_decision_support(profile, tender.clauses, tender.checklist, tender.value, tender.organization)
            tender.bid_readiness_score = metrics["bid_readiness_score"]
            tender.suitability_score = metrics["suitability_score"]
            tender.profitability_rating = metrics["profitability_rating"]
            tender.competition_rating = metrics["competition_rating"]
            tender.difficulty_rating = metrics["difficulty_rating"]
            tender.distance_rating = metrics["distance_rating"]
            tender.go_no_go_verdict = metrics["go_no_go_verdict"]
            tender.go_no_go_reason = metrics["go_no_go_reason"]
            tender.action_plan_json = metrics["action_plan_json"]
            
            db.commit()
        except Exception as e:
            print(f"Error recalculating tender {tender.id} eligibility: {e}")
            
    return profile

@app.get("/api/profile/tender-details")
def get_company_tender_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(CompanyProfile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found")
    details = db.query(CompanyTenderDetails).filter(CompanyTenderDetails.profile_id == profile.id).first()
    return json.loads(details.details_json) if details else {}

@app.put("/api/profile/tender-details")
def update_company_tender_details(
    details_in: CompanyTenderDetailsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(CompanyProfile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found")
    details_json = json.dumps(details_in.details)
    if len(details_json) > 100_000:
        raise HTTPException(status_code=413, detail="Company tender details are too large")
    details = db.query(CompanyTenderDetails).filter(CompanyTenderDetails.profile_id == profile.id).first()
    if not details:
        details = CompanyTenderDetails(profile_id=profile.id)
        db.add(details)
    details.details_json = details_json
    details.updated_at = datetime.datetime.utcnow()
    db.commit()
    return details_in.details

# --- TENDER ENDPOINTS ---

@app.get("/api/tenders", response_model=List[TenderResponse])
def list_tenders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Tender).order_by(Tender.created_at.desc()).all()

@app.post("/api/tenders/upload", response_model=TenderResponse)
def upload_tender(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Save file
    file_name = file.filename.replace(" ", "_")
    file_path = os.path.join(settings.UPLOAD_DIR, file_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Extract text from PDF
    try:
        tender_text = extract_text_from_pdf(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")
        
    # Analyze text with AI (Extract details & clauses)
    analysis = analyze_tender_text(tender_text)
    
    # Create Tender object in database
    import json
    db_tender = Tender(
        title=analysis["title"],
        organization=analysis["organization"],
        value=analysis["value_cr"],
        EMD=analysis["emd_lakhs"],
        submission_deadline=analysis["submission_deadline"],
        summary=analysis["summary"],
        file_path=file_path,
        status="analyzed",
        overall_risk_score=analysis["risk_profile"]["overall_risk_score"],
        financial_risk=analysis["risk_profile"]["financial_risk"],
        technical_risk=analysis["risk_profile"]["technical_risk"],
        compliance_risk=analysis["risk_profile"]["compliance_risk"],
        documentation_risk=analysis["risk_profile"]["documentation_risk"],
        confidence_score=analysis["confidence_score"],
        contradictions_json=json.dumps(analysis.get("contradictions", [])),
        pre_bid_questions_json=json.dumps(analysis.get("pre_bid_questions", []))
    )
    db.add(db_tender)
    db.commit()
    db.refresh(db_tender)
    
    # Save Clauses in DB
    clauses_list = []
    for c in analysis["clauses"]:
        clause_obj = TenderClause(
            tender_id=db_tender.id,
            category=c["category"],
            clause_text=c["clause_text"],
            required_value=c["required_value"],
            confidence=c["confidence"]
        )
        db.add(clause_obj)
        clauses_list.append(clause_obj)
    db.commit()
    
    # Save Checklist Items in DB
    for doc in analysis["checklist"]:
        chk = DocumentChecklist(
            tender_id=db_tender.id,
            document_name=doc["document_name"],
            required_by_date=doc["required_by_date"],
            status="missing"
        )
        db.add(chk)
    db.commit()
    
    # Load profile to perform immediate eligibility assessment
    profile = db.query(CompanyProfile).first()
    if profile:
        score, evaluated_clauses = evaluate_eligibility(profile, clauses_list)
        # Update clauses with user values and evaluation states
        for ec in evaluated_clauses:
            clause_db = db.query(TenderClause).filter(
                TenderClause.tender_id == db_tender.id,
                TenderClause.clause_text == ec["clause_text"]
            ).first()
            if clause_db:
                clause_db.user_value = ec["user_value"]
                clause_db.status = ec["status"]
                clause_db.explanation = ec["explanation"]
                
        # Automatically cross-check documents with Vault profile certs
        checklist_items = db.query(DocumentChecklist).filter(DocumentChecklist.tender_id == db_tender.id).all()
        profile_certs_lower = profile.certifications.lower()
        for item in checklist_items:
            doc_name_lower = item.document_name.lower()
            # If standard document or license is mentioned in company profile certs
            for cert_kw in ["iso 9001", "iso 14001", "iso 45001", "class-a", "class a", "pan", "gst"]:
                if cert_kw in doc_name_lower and cert_kw in profile_certs_lower:
                    item.status = "vault_matched"
                    item.matching_vault_doc = cert_kw.upper()
                    break
        
        db.commit()
        
        # Calculate suitability, bid readiness, Go/No-Go metrics and action plans!
        metrics = calculate_decision_support(profile, clauses_list, checklist_items, db_tender.value, db_tender.organization)
        db_tender.bid_readiness_score = metrics["bid_readiness_score"]
        db_tender.suitability_score = metrics["suitability_score"]
        db_tender.profitability_rating = metrics["profitability_rating"]
        db_tender.competition_rating = metrics["competition_rating"]
        db_tender.difficulty_rating = metrics["difficulty_rating"]
        db_tender.distance_rating = metrics["distance_rating"]
        db_tender.go_no_go_verdict = metrics["go_no_go_verdict"]
        db_tender.go_no_go_reason = metrics["go_no_go_reason"]
        db_tender.action_plan_json = metrics["action_plan_json"]
        
        db.commit()
        
    # Refresh to include relationships
    db.refresh(db_tender)
    
    # Add to Semantic Vector Index
    try:
        vector_index.add_tender(
            tender_id=db_tender.id,
            title=db_tender.title,
            summary=db_tender.summary,
            full_text=tender_text
        )
    except Exception as e:
        print(f"Error adding tender to vector index: {e}")
        
    return db_tender

# --- DISCOVERY & BOOKMARK ENDPOINTS ---

@app.get("/api/tenders/discovery")
def get_discovery_tenders(
    q: str = "",
    dept: str = "",
    min_val: float = 0.0,
    max_val: float = 10000.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Mock database list of open tenders from govt portals
    discovery_pool = [
        {
            "id": 901,
            "title": "Design & Commissioning of Satellite Launch Pad-3 at Sriharikota",
            "organization": "Indian Space Research Organisation (ISRO)",
            "value": 680.0,
            "EMD": 120.0,
            "submission_deadline": "2026-10-15",
            "summary": "Full-scale construction contract for advanced rocket launch pad infrastructures, tracking stations, and cryogenic gas piping systems.",
            "category": "Space / Infrastructure",
            "status": "discovery",
            "is_bookmarked": False
        },
        {
            "id": 902,
            "title": "Track Renewal and High-Speed Signalling Systems, Mumbai-Pune Sector",
            "organization": "Ministry of Railways (Indian Railways)",
            "value": 145.0,
            "EMD": 25.0,
            "submission_deadline": "2026-09-22",
            "summary": "Standard signal layout renewals, station upgrades, high-speed fiber lines installation and ballast cleaning in the western section.",
            "category": "Railways",
            "status": "discovery",
            "is_bookmarked": False
        },
        {
            "id": 903,
            "title": "6-Lane Elevated Highway & Flyovers Package-2 on NH-48",
            "organization": "National Highways Authority of India (NHAI)",
            "value": 310.0,
            "EMD": 62.0,
            "submission_deadline": "2026-11-05",
            "summary": "Civil execution of 12 km elevated corridor with structural foundations, precast box girder launching and expressway connectivity routes.",
            "category": "Highways / Roads",
            "status": "discovery",
            "is_bookmarked": False
        },
        {
            "id": 904,
            "title": "Renovation and Structural Retrofitting of High Court Annex in Nagpur",
            "organization": "Public Works Department (PWD)",
            "value": 18.5,
            "EMD": 3.7,
            "submission_deadline": "2026-08-25",
            "summary": "Structural reinforcing, heritage heritage elevation restoration, electrical substations refitting, and HVAC installations for Nagpur HC building.",
            "category": "Buildings",
            "status": "discovery",
            "is_bookmarked": False
        }
    ]
    
    # Filter pool
    filtered = []
    for item in discovery_pool:
        # Title/Summary check
        if q and q.lower() not in item["title"].lower() and q.lower() not in item["summary"].lower():
            continue
        # Department check
        if dept and dept.lower() not in item["organization"].lower():
            continue
        # Value check
        if item["value"] < min_val or item["value"] > max_val:
            continue
            
        # Cross check if bookmarked in real DB
        db_exists = db.query(Tender).filter(Tender.title == item["title"]).first()
        if db_exists:
            item["is_bookmarked"] = db_exists.is_bookmarked
            item["id"] = db_exists.id # map actual DB id
            item["status"] = db_exists.status
            
        filtered.append(item)
        
    return filtered

@app.get("/api/tenders/saved")
def get_saved_tenders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Tender).filter(Tender.is_bookmarked == True).all()

@app.get("/api/tenders/{tender_id}", response_model=TenderResponse)
def get_tender_by_id(tender_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    return tender

@app.get("/api/tenders/{tender_id}/document")
def get_tender_document(tender_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    if not tender.file_path:
        raise HTTPException(status_code=404, detail="No PDF is attached to this tender")

    upload_root = os.path.realpath(settings.UPLOAD_DIR)
    document_path = os.path.realpath(tender.file_path)
    if os.path.commonpath([upload_root, document_path]) != upload_root or not os.path.isfile(document_path):
        raise HTTPException(status_code=404, detail="Tender PDF is unavailable")

    return FileResponse(document_path, media_type="application/pdf", filename=os.path.basename(document_path))

@app.delete("/api/tenders/{tender_id}")
def delete_tender(tender_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    # Delete PDF file
    if tender.file_path and os.path.exists(tender.file_path):
        try:
            os.remove(tender.file_path)
        except Exception:
            pass
            
    db.delete(tender)
    db.commit()
    
    # Remove from Vector Index if present
    if tender_id in vector_index.tenders:
        del vector_index.tenders[tender_id]
        vector_index.save()
        
    return {"message": "Tender deleted successfully"}

@app.put("/api/tenders/{tender_id}/bookmark")
def toggle_bookmark_tender(
    tender_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    
    # If the tender is not in our analyzed catalog yet (e.g. from discovery pool), we import it as a placeholder first!
    if not tender:
        mock_data = {
            901: ("Design & Commissioning of Satellite Launch Pad-3 at Sriharikota", "Indian Space Research Organisation (ISRO)", 680.0, 120.0, "2026-10-15", "Space / Infrastructure"),
            902: ("Track Renewal and High-Speed Signalling Systems, Mumbai-Pune Sector", "Ministry of Railways (Indian Railways)", 145.0, 25.0, "2026-09-22", "Railways"),
            903: ("6-Lane Elevated Highway & Flyovers Package-2 on NH-48", "National Highways Authority of India (NHAI)", 310.0, 62.0, "2026-11-05", "Highways / Roads"),
            904: ("Renovation and Structural Retrofitting of High Court Annex in Nagpur", "Public Works Department (PWD)", 18.5, 3.7, "2026-08-25", "Buildings")
        }
        
        if tender_id in mock_data:
            title, org, val, emd, deadline, cat = mock_data[tender_id]
            tender = Tender(
                title=title,
                organization=org,
                value=val,
                EMD=emd,
                submission_deadline=deadline,
                summary=f"Open government tender. Category: {cat}.",
                status="discovery_bookmarked",
                is_bookmarked=True
            )
            db.add(tender)
            db.commit()
            db.refresh(tender)
            return {"is_bookmarked": True, "id": tender.id}
        else:
            raise HTTPException(status_code=404, detail="Tender specification template not found")
            
    tender.is_bookmarked = not tender.is_bookmarked
    db.commit()
    return {"is_bookmarked": tender.is_bookmarked, "id": tender.id}


# --- RAG CHATBOT ENDPOINT ---

@app.post("/api/tenders/{tender_id}/chat", response_model=ChatResponse)
def chat_with_tender(
    tender_id: int,
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    # Read text from stored file or default summary if missing
    tender_text = ""
    if tender.file_path and os.path.exists(tender.file_path):
        try:
            tender_text = extract_text_from_pdf(tender.file_path)
        except Exception:
            pass
            
    if not tender_text:
        tender_text = f"{tender.title} issued by {tender.organization}. Value: Rs. {tender.value} Cr. EMD: Rs. {tender.EMD} L. Summary: {tender.summary}"
        for clause in tender.clauses:
            tender_text += f"\nRequirement: {clause.clause_text}. Value required: {clause.required_value}"
            
    response = ask_tender_chatbot(tender_text, request.message)
    return response

# --- AMENDMENT / CORRIGENDUM ENDPOINTS ---

@app.post("/api/tenders/{tender_id}/amendment")
def upload_amendment(
    tender_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    # Save amendment PDF
    file_name = f"amendment_{tender_id}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(settings.UPLOAD_DIR, file_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Read original text from file
    base_text = ""
    if tender.file_path and os.path.exists(tender.file_path):
        try:
            base_text = extract_text_from_pdf(tender.file_path)
        except Exception:
            pass
            
    if not base_text:
        base_text = tender.summary
        
    # Run amendment diff engine
    changes_summary = generate_amendment_diff(base_text, file_path)
    
    # Save amendment record
    amendment = TenderAmendment(
        tender_id=tender_id,
        title=file.filename,
        file_path=file_path,
        changes_summary=changes_summary
    )
    db.add(amendment)
    db.commit()
    
    # Apply changes to tender if dates/values are updated in summary
    # We parse the changes_summary for dates or values to dynamically update deadline/EMD in DB for display
    # Example parsing: "deadline has been extended to 2026-09-15"
    date_match = re.search(r"extended\s+to\s+\**(\d{1,2}[thrdnd]*\s+[A-Za-z]+,?\s+\d{4}|\d{2}[-/]\d{2}[-/]\d{4}|\d{4}-\d{2}-\d{2})\**", changes_summary, re.IGNORECASE)
    if date_match:
        tender.submission_deadline = date_match.group(1).replace("*", "").strip()
        
    emd_match = re.search(r"EMD\s+revised\s+to\s+\**(?:Rs\.?\s*)?([\d\.]+)\s*(?:Lakh|L)\**", changes_summary, re.IGNORECASE)
    if emd_match:
        try:
            tender.EMD = float(emd_match.group(1))
        except ValueError:
            pass
            
    db.commit()
    
    # Recalculate suitability and bid readiness using new values
    profile = db.query(CompanyProfile).first()
    if profile:
        score, evaluated_clauses = evaluate_eligibility(profile, tender.clauses)
        for ec in evaluated_clauses:
            clause_db = db.query(TenderClause).filter(
                TenderClause.tender_id == tender.id,
                TenderClause.id == ec["id"]
            ).first()
            if clause_db:
                clause_db.user_value = ec["user_value"]
                clause_db.status = ec["status"]
                clause_db.explanation = ec["explanation"]
        db.commit()
        
        metrics = calculate_decision_support(profile, tender.clauses, tender.checklist, tender.value, tender.organization)
        tender.bid_readiness_score = metrics["bid_readiness_score"]
        tender.suitability_score = metrics["suitability_score"]
        tender.profitability_rating = metrics["profitability_rating"]
        tender.competition_rating = metrics["competition_rating"]
        tender.difficulty_rating = metrics["difficulty_rating"]
        tender.distance_rating = metrics["distance_rating"]
        tender.go_no_go_verdict = metrics["go_no_go_verdict"]
        tender.go_no_go_reason = metrics["go_no_go_reason"]
        tender.action_plan_json = metrics["action_plan_json"]
        db.commit()
        
    return {"message": "Amendment processed successfully", "summary": changes_summary}

# --- DOCUMENT CHECKLIST ENDPOINTS ---

@app.put("/api/tenders/{tender_id}/checklist/{item_id}")
def update_checklist_item(
    tender_id: int,
    item_id: int,
    update: DocumentChecklistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(DocumentChecklist).filter(
        DocumentChecklist.id == item_id,
        DocumentChecklist.tender_id == tender_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
        
    item.status = update.status
    if update.matching_vault_doc:
        item.matching_vault_doc = update.matching_vault_doc
        
    db.commit()
    
    # Recalculate suitability and bid readiness using updated checklist status
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    profile = db.query(CompanyProfile).first()
    if tender and profile:
        metrics = calculate_decision_support(profile, tender.clauses, tender.checklist, tender.value, tender.organization)
        tender.bid_readiness_score = metrics["bid_readiness_score"]
        tender.action_plan_json = metrics["action_plan_json"]
        db.commit()
        db.refresh(item)
        
    return item

# --- SEMANTIC SEARCH ENDPOINT ---

@app.get("/api/tenders/{tender_id}/similar")
def get_similar_tenders_endpoint(
    tender_id: int,
    limit: int = 3,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure vector index has all database tenders
    tenders = db.query(Tender).all()
    for t in tenders:
        if t.id not in vector_index.tenders:
            try:
                # Get text snippet
                text = ""
                if t.file_path and os.path.exists(t.file_path):
                    text = extract_text_from_pdf(t.file_path)
                if not text:
                    text = t.summary
                vector_index.add_tender(t.id, t.title, t.summary, text)
            except Exception:
                pass
                
    similar = vector_index.get_similar_tenders(tender_id, limit=limit)
    return similar
