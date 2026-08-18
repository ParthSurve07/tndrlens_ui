"""
Updated eligibility module — works with plain dicts (not SQLAlchemy models)
so it can be called from the standalone AI microservice.
"""
import re
from typing import List, Dict, Any, Tuple


def extract_numeric_value(text: str) -> float:
    """Extract the first numeric value from a requirement string."""
    match = re.search(r"(\d+(?:\.\d+)?)", str(text))
    return float(match.group(1)) if match else 0.0


def evaluate_eligibility_from_dict(
    profile: Dict[str, Any],
    clauses: List[Dict[str, Any]]
) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Evaluate eligibility using plain dicts (API-friendly).
    Works with the NestJS → AI service bridge.
    """
    weights = {
        "financial": 0.35,
        "experience": 0.30,
        "documentation": 0.20,
        "technical": 0.15
    }

    category_stats = {
        "financial": {"passed": 0, "total": 0},
        "experience": {"passed": 0, "total": 0},
        "documentation": {"passed": 0, "total": 0},
        "technical": {"passed": 0, "total": 0}
    }

    evaluation_results = []

    for clause in clauses:
        category = clause.get("category", "technical").lower()
        if category not in category_stats:
            category = "technical"

        req_text = clause.get("clause_text", "")
        req_val = clause.get("required_value", "")

        status = "PASS"
        user_val_str = ""
        explanation = ""

        if category == "financial":
            if "turnover" in req_text.lower():
                required = extract_numeric_value(req_val)
                user_turnover = float(profile.get("turnover", 0))
                user_val_str = f"Rs. {user_turnover:.1f} Cr average"
                if user_turnover >= required:
                    status = "PASS"
                    explanation = f"Required: Rs. {required:.1f} Cr. Company: Rs. {user_turnover:.1f} Cr. ✓"
                else:
                    status = "FAIL"
                    explanation = f"Required: Rs. {required:.1f} Cr. Company: Rs. {user_turnover:.1f} Cr. ✗"
            elif "liquid" in req_text.lower() or "asset" in req_text.lower():
                required = extract_numeric_value(req_val)
                user_liquid = float(profile.get("turnover", 0)) * 0.25
                user_val_str = f"Rs. {user_liquid:.1f} Cr estimated"
                if user_liquid >= required:
                    status = "PASS"
                    explanation = f"Estimated liquid assets: Rs. {user_liquid:.1f} Cr ≥ required Rs. {required:.1f} Cr. ✓"
                else:
                    status = "FAIL"
                    explanation = f"Estimated liquid assets: Rs. {user_liquid:.1f} Cr < required Rs. {required:.1f} Cr. ✗"
            else:
                status = "PASS"
                user_val_str = "Met"
                explanation = "Financial requirement verified."

        elif category == "experience":
            if "similar" in req_text.lower() or "completion" in req_text.lower() or "value" in req_text.lower():
                required = extract_numeric_value(req_val)
                user_exp = float(profile.get("max_project_value", 0))
                user_val_str = f"Rs. {user_exp:.1f} Cr max project"
                if user_exp >= required:
                    status = "PASS"
                    explanation = f"Required: Rs. {required:.1f} Cr experience. Company max project: Rs. {user_exp:.1f} Cr. ✓"
                else:
                    status = "FAIL"
                    explanation = f"Required: Rs. {required:.1f} Cr. Company max project: Rs. {user_exp:.1f} Cr. ✗"
            elif "year" in req_text.lower():
                required_years = extract_numeric_value(req_val)
                user_years = float(profile.get("experience_years", 0))
                user_val_str = f"{user_years:.0f} years"
                if user_years >= required_years:
                    status = "PASS"
                    explanation = f"Required: {required_years:.0f} years. Company: {user_years:.0f} years. ✓"
                else:
                    status = "FAIL"
                    explanation = f"Required: {required_years:.0f} years. Company: {user_years:.0f} years. ✗"
            else:
                status = "PASS"
                user_val_str = "Met"
                explanation = "Experience requirement verified."

        elif category == "documentation":
            user_certs = profile.get("certifications", "").lower()
            cert_keywords = {
                "iso 9001": "iso 9001",
                "iso 14001": "iso 14001",
                "iso 45001": "iso 45001",
                "class-a": "class-a",
                "pan": "pan",
                "gst": "gst"
            }
            found_certs = []
            missing_certs = []
            for kw in cert_keywords:
                if kw in req_text.lower():
                    if kw in user_certs:
                        found_certs.append(kw.upper())
                    else:
                        missing_certs.append(kw.upper())

            if missing_certs:
                status = "FAIL"
                user_val_str = f"Missing: {', '.join(missing_certs)}"
                explanation = f"Required certs: {', '.join(missing_certs)} not found in company vault."
            elif found_certs:
                status = "PASS"
                user_val_str = f"Has: {', '.join(found_certs)}"
                explanation = f"All required certifications present: {', '.join(found_certs)}. ✓"
            else:
                status = "WARN"
                user_val_str = "Manual verification needed"
                explanation = "Documentation requirement requires manual review."

        elif category == "technical":
            user_equip = profile.get("equipment", "").lower()
            user_manpower = int(profile.get("manpower_count", 0))

            if "manpower" in req_text.lower() or "worker" in req_text.lower():
                required_workers = extract_numeric_value(req_val)
                user_val_str = f"{user_manpower} workers"
                if user_manpower >= required_workers:
                    status = "PASS"
                    explanation = f"Required: {required_workers:.0f} workers. Company: {user_manpower}. ✓"
                else:
                    status = "FAIL"
                    explanation = f"Required: {required_workers:.0f} workers. Company: {user_manpower}. ✗"
            else:
                # Equipment check
                equip_map = {
                    "segment launcher": ("launcher", 1),
                    "batching plant": ("batching plant", 3),
                    "road roller": ("road roller", 2),
                    "concrete mixer": ("concrete mixer", 2),
                    "concrete pump": ("concrete pump", 1),
                    "piling rig": ("piling rig", 2),
                    "paver finisher": ("paver finisher", 1),
                    "dumper": ("dumper", 3),
                }
                missing = []
                for kw, (equip_key, default_req) in equip_map.items():
                    if kw in req_text.lower():
                        required_count = extract_numeric_value(req_val) or default_req
                        # Count occurrences in user equipment string
                        user_count = user_equip.count(equip_key.split()[0])
                        if user_count == 0:
                            missing.append(kw)

                if missing:
                    status = "FAIL"
                    user_val_str = f"Missing: {', '.join(missing)}"
                    explanation = f"Required equipment not in company inventory: {', '.join(missing)}. ✗"
                else:
                    status = "PASS"
                    user_val_str = "Equipment available"
                    explanation = "Required machinery verified in company equipment list. ✓"

        # Accumulate category stats
        category_stats[category]["total"] += 1
        if status == "PASS":
            category_stats[category]["passed"] += 1

        evaluation_results.append({
            "id": clause.get("id"),
            "category": category,
            "clause_text": req_text,
            "required_value": req_val,
            "user_value": user_val_str,
            "status": status,
            "explanation": explanation,
            "confidence": clause.get("confidence", 1.0)
        })

    # Weighted score calculation
    total_score = 0.0
    for cat, weight in weights.items():
        stats = category_stats[cat]
        if stats["total"] > 0:
            cat_score = (stats["passed"] / stats["total"]) * 100.0
        else:
            cat_score = 100.0  # No clauses in this category = full score
        total_score += cat_score * weight

    return round(total_score, 1), evaluation_results


def calculate_decision_support_from_dict(
    profile: Dict[str, Any],
    clauses: List[Dict[str, Any]],
    checklist: List[Dict[str, Any]],
    tender_value: float,
    organization: str
) -> Dict[str, Any]:
    """
    Calculate suitability, bid readiness, Go/No-Go and action plan.
    """
    # Eligibility score
    eligibility_score, evaluated = evaluate_eligibility_from_dict(profile, clauses)

    # Suitability score (financial + experience criteria only)
    fin_exp_clauses = [c for c in evaluated if c["category"] in ("financial", "experience")]
    fin_exp_pass = sum(1 for c in fin_exp_clauses if c["status"] == "PASS")
    suitability = (fin_exp_pass / len(fin_exp_clauses) * 100) if fin_exp_clauses else eligibility_score

    # Bid readiness based on checklist completion
    total_docs = len(checklist)
    ready_docs = sum(1 for d in checklist if d.get("status") in ("uploaded", "vault_matched"))
    bid_readiness = (ready_docs / total_docs * 100) if total_docs > 0 else 0.0

    # Profitability: tender value vs company capacity
    user_turnover = float(profile.get("turnover", 0))
    if user_turnover > 0:
        ratio = tender_value / user_turnover
        profitability_rating = max(0, min(100, 100 - abs(ratio - 0.5) * 100))
    else:
        profitability_rating = 30.0

    # Competition: estimate based on org type
    org_lower = organization.lower()
    if any(k in org_lower for k in ["isro", "drdo", "defence"]):
        competition_rating = 20.0
    elif any(k in org_lower for k in ["nhai", "dmrc", "railways"]):
        competition_rating = 45.0
    elif any(k in org_lower for k in ["pwd", "municipal"]):
        competition_rating = 70.0
    else:
        competition_rating = 55.0

    # Difficulty: based on value and experience gap
    user_max = float(profile.get("max_project_value", 0))
    if user_max > 0 and tender_value > user_max:
        difficulty_rating = min(100, (tender_value / user_max) * 40 + 40)
    else:
        difficulty_rating = 30.0

    distance_rating = 60.0  # Placeholder (requires geo lookup)

    # Go/No-Go verdict
    failed_clauses = [c for c in evaluated if c["status"] == "FAIL"]
    fail_categories = set(c["category"] for c in failed_clauses)

    if "financial" in fail_categories or eligibility_score < 40:
        verdict = "No-Go"
        reason = f"Critical financial or eligibility criteria not met. Score: {eligibility_score:.0f}%."
    elif eligibility_score >= 75 and bid_readiness >= 60:
        verdict = "Go"
        reason = f"Company meets key eligibility criteria (score: {eligibility_score:.0f}%) with sufficient bid readiness ({bid_readiness:.0f}%)."
    else:
        verdict = "Cautious"
        reason = f"Partially eligible (score: {eligibility_score:.0f}%). Address gaps before bidding."

    # Action plan
    action_plan = []
    for c in evaluated:
        if c["status"] == "FAIL":
            action_plan.append({
                "priority": "high",
                "category": c["category"],
                "action": f"Resolve gap: {c['explanation']}"
            })
    for doc in checklist:
        if doc.get("status") == "missing":
            action_plan.append({
                "priority": "medium",
                "category": "documentation",
                "action": f"Obtain document: {doc.get('document_name', '')}"
            })

    import json
    return {
        "eligibility_score": eligibility_score,
        "suitability_score": round(suitability, 1),
        "bid_readiness_score": round(bid_readiness, 1),
        "profitability_rating": round(profitability_rating, 1),
        "competition_rating": round(competition_rating, 1),
        "difficulty_rating": round(difficulty_rating, 1),
        "distance_rating": round(distance_rating, 1),
        "go_no_go_verdict": verdict,
        "go_no_go_reason": reason,
        "action_plan_json": json.dumps(action_plan)
    }
