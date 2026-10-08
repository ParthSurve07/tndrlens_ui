# AI Procurement Intelligence Platform (Enhanced Specs v3.0)

We are extending the platform from a document reader into a full-scale **AI Procurement Intelligence Platform** that assists bidders across the entire tender lifecycle. We will add the following capabilities to align directly with the 18 modules and advanced features.

## User Review Required

> [!IMPORTANT]
> To support the expanded scope (including Go/No-Go analytics, pre-bid contradiction flagging, and suitability algorithms), we plan to update both backend logic and frontend components. Please review the proposed changes below and click **Proceed** or let us know if you have any feedback!

---

## Proposed Technical Upgrades

We will expand the existing FastAPI backend and React frontend to implement these specific modules:

### 1. Tender Discovery & Search (Module 1)
- **Backend**: Add mockup discovery dataset (5-10 tenders from PWD, NHAI, Railways, and ISRO) with filters for department, category, value range, and submission deadlines.
- **Frontend**: Add a "Tender Search Portal" tab on the dashboard, permitting user searches, filters, and bookmarking.

### 2. Bid Readiness & AI Action Plan (Advanced Feature)
- **Backend Model**: Add `bid_readiness_score` (computed based on checklists, EMD status, and bank solvency checks). Add `action_plan` endpoint to return sequential steps to reach 100% readiness (e.g. "Step 1: Renew ISO certificate").
- **Frontend**: A progress visualization gauge in the details page detailing eligibility vs. readiness, with an inline, step-by-step checklist action plan.

### 3. Suitability & Go / No-Go (Module 4 & Advanced Feature)
- **Eligibility Engine**: Implement a multi-parameter suitability score (weighted average of Profitability, Competition density, Technical difficulty, and Travel distance).
- **Go/No-Go Verdict**: Generate recommendation strings ("Strong Bid", "Cautious Bid", or "No-Go") with supporting logic bullets (e.g., "Low Experience", "Short Completion Time").

### 4. Contradiction & Pre-Bid Negotiation Assistant (Module 8 & Advanced Feature)
- **Analysis Pipeline**: Scan the tender text for inconsistencies (e.g., Clause A showing 300 days completion and Clause B showing 270 days) and suggest pre-bid questions (e.g. "Please clarify conflicting completion periods under Clause 6.2 and 11.4").
- **Frontend**: A dedicated "Negotiation Assistant" tab inside the tender workspace listing recommended pre-bid clarifications.

### 5. Corrigendum Impact Analyzer (Advanced Feature)
- **Diff Module**: Track specific changes to deadlines, experience limits, or EMD fees, and print an explicit "Impact Summary" (e.g. "Company turnover Rs.100Cr is now sufficient because EMD/experience limits were lowered — ELIGIBILITY STATUS: RESTORED").

---

## File Modifications

### Backend Updates (`/backend`)

#### [MODIFY] [models.py](file:///Users/deepak/Desktop/coding/Tender%20Management/backend/app/models.py)
- Expand `Tender` database table columns to include:
  - `suitability_score`, `profitability_rating`, `competition_rating`, `difficulty_rating`
  - `bid_readiness_score`
  - `go_no_go_verdict`, `go_no_go_reason`
  - `contradictions_json` (serialized list of identified contradictions)

#### [MODIFY] [eligibility.py](file:///Users/deepak/Desktop/coding/Tender%20Management/backend/app/ai/eligibility.py)
- Update algorithms to calculate suitability ratings, Go/No-Go recommendations, and generate the structured step-by-step Action Plan list dynamically based on failed or missing criteria.

#### [MODIFY] [main.py](file:///Users/deepak/Desktop/coding/Tender%20Management/backend/app/main.py)
- Expose search/filter routes for discovery datasets, and save/bookmark toggle endpoints.

---

### Frontend Updates (`/frontend`)

#### [MODIFY] [Dashboard.tsx](file:///Users/deepak/Desktop/coding/Tender%20Management/frontend/src/pages/Dashboard.tsx)
- Integrate the Discovery Search filter portal beside the catalog uploads list.

#### [MODIFY] [TenderDetails.tsx](file:///Users/deepak/Desktop/coding/Tender%20Management/frontend/src/pages/TenderDetails.tsx)
- Add the "AI Suitability" metrics dashboard, "Bid Readiness" progress timeline, and "Pre-Bid Negotiation Suggestions" tab.

---

## Verification Plan

### Automated Tests
- Extend the python test script to assert correct calculations for Suitability ratings, Go/No-Go logic branches, and Action Plan generations.

### Manual Verification
- Upload test tenders with built-in contradictions (e.g. mismatched deadlines) and verify the contradiction panel flags them.
- Check that editing the Company Profile recalculates the Suitability score and updates the step-by-step Action Plan.
