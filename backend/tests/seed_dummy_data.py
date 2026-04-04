#!/usr/bin/env python3
"""
Seed script — wipes all non-admin data from Supabase and inserts 32 diverse
dummy students covering every combination of classification, language, budget,
test profile, and session history.

Usage (run from the backend/ directory):
    python tests/seed_dummy_data.py

All dummy users share the password:  Letuscook@2025
"""

import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ── Bootstrap: resolve paths and env ──────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

from supabase import create_client, Client  # noqa: E402

URL  = os.environ["SUPABASE_URL"]
SKEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
sb: Client = create_client(URL, SKEY)

PASSWORD = "Letuscook@2025"

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def ts(days_ago: int = 0, hours_ago: int = 0) -> str:
    d = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)
    return d.isoformat()


def uid() -> str:
    return str(uuid.uuid4())


def clamp(n: int) -> int:
    return max(0, min(100, n))


def create_session_record(user_id: str, days_ago: int, duration_s: int,
                           lang: str, score: int, classification: str,
                           sentiment: str, session_num: int) -> None:
    """Insert one session + its report into Supabase."""
    sid = uid()
    started = ts(days_ago=days_ago, hours_ago=2)
    ended   = ts(days_ago=days_ago)

    # Determine scores
    breakdown = {
        "intent_seriousness": clamp(score + 5),
        "financial_readiness": clamp(score - 5),
        "timeline_urgency":   clamp(score),
    }
    emotions_map = {
        "positive": ["enthusiastic", "motivated", "curious"],
        "neutral":  ["calm", "analytical", "focused"],
        "negative": ["anxious", "uncertain", "overwhelmed"],
    }
    trajectories = {
        "hot":  "improving",
        "warm": "stable",
        "cold": "declining",
    }
    concerns_map = {
        "hot":  ["visa processing time", "scholarship competition"],
        "warm": ["budget constraints", "test score requirements"],
        "cold": ["career outcome uncertainty", "family concerns", "financial planning"],
    }
    actions_map = {
        "hot":  ["Schedule follow-up call within 48 hours",
                 "Send scholarship deadline reminders",
                 "Provide university shortlist"],
        "warm": ["Send brochure for target universities",
                 "Clarify English test requirements",
                 "Share loan options document"],
        "cold": ["Send general study-abroad guide",
                 "Invite for informational webinar",
                 "Follow up in 2 weeks"],
    }
    summaries_map = {
        "hot":  (f"Student showed strong intent to pursue postgraduate studies. "
                 f"Clear financial plan in place. Target universities discussed with "
                 f"positive engagement throughout session {session_num}."),
        "warm": (f"Moderate interest expressed. Student is still evaluating options. "
                 f"Some clarity needed around budget and test scores. Session {session_num} "
                 f"ended with actionable next steps."),
        "cold": (f"Early exploration stage. Student has not finalised the decision to study abroad. "
                 f"Requires further nurturing and information sharing. Session {session_num}."),
    }

    sb.table("sessions").insert({
        "id":               sid,
        "user_id":          user_id,
        "status":           "ended",
        "language_detected": lang,
        "duration_seconds": duration_s,
        "started_at":       started,
        "ended_at":         ended,
        "created_at":       started,
    }).execute()

    sb.table("session_reports").insert({
        "session_id":          sid,
        "user_id":             user_id,
        "lead_score":          score,
        "lead_score_breakdown": breakdown,
        "lead_classification": classification,
        "classification_reason": (
            f"Lead score of {score}/100 with "
            f"{'strong' if classification == 'hot' else 'moderate' if classification == 'warm' else 'weak'} "
            f"intent signals and "
            f"{'solid' if classification == 'hot' else 'partial' if classification == 'warm' else 'unclear'} "
            f"financial readiness."
        ),
        "sentiment_overall":   sentiment,
        "sentiment_score":     round(0.8 if sentiment == "positive" else 0.5 if sentiment == "neutral" else 0.3, 2),
        "sentiment_trajectory": trajectories.get(classification, "stable"),
        "key_emotions":        emotions_map.get(sentiment, ["calm"]),
        "extracted_data": {
            "intent_signals":     ["wants to pursue Masters", "researching top universities"] if classification != "cold" else ["exploring options"],
            "financial_signals":  ["has education loan approval"] if classification == "hot" else ["considering education loan"] if classification == "warm" else [],
            "timeline_signals":   ["targeting Fall intake"] if classification != "cold" else ["timeline not decided"],
            "universities_mentioned": ["TU Munich", "University of Toronto"] if classification == "hot" else ["any good university"],
            "courses_mentioned":  ["MS Data Science", "MS Computer Science"] if classification != "cold" else ["not sure yet"],
            "concerns_raised":    concerns_map.get(classification, []),
        },
        "recommended_actions": actions_map.get(classification, []),
        "summary":             summaries_map.get(classification, ""),
        "generated_at":        ended,
    }).execute()


def create_pre_analysis(user_id: str, completeness: int, hint: str) -> None:
    """Insert a pre_analyses row for a user."""
    obs_map = {
        "hot": [
            "Strong academic background with competitive GPA",
            "Clear target countries and universities identified",
            "Test scores meet or exceed requirements",
            "Financial plan is concrete and realistic",
        ],
        "warm": [
            "Academic background is adequate for target programs",
            "Target countries identified but universities not shortlisted",
            "Test scores need improvement or not yet taken",
            "Budget is approximate — needs detailed planning",
        ],
        "cold": [
            "Profile is incomplete — multiple required fields missing",
            "No specific target course or country identified",
            "No test scores available yet",
            "Financial readiness not assessed",
        ],
    }
    gaps_map = {
        "hot": [
            "Confirm passport and documentation readiness",
            "Clarify preference between research and coursework Masters",
        ],
        "warm": [
            "Probe exact IELTS/TOEFL target score and preparation timeline",
            "Clarify annual budget ceiling for tuition + living",
            "Understand scholarship eligibility and applications so far",
        ],
        "cold": [
            "Understand motivation for studying abroad vs. staying in India",
            "Identify preferred field of study and career goal",
            "Assess financial situation — self-funded, loan, or family support",
            "Determine realistic intake timeline",
        ],
    }
    focus_map = {
        "hot":  ["University shortlisting", "SOP guidance", "Scholarship applications"],
        "warm": ["Test preparation planning", "Budget optimisation", "Course selection"],
        "cold": ["Career counselling", "Goal clarification", "Financial awareness"],
    }

    sb.table("pre_analyses").insert({
        "user_id":                   user_id,
        "profile_completeness_score": clamp(completeness),
        "initial_lead_hint":         hint,
        "initial_observations":      obs_map.get(hint, obs_map["warm"]),
        "gaps_to_probe":             gaps_map.get(hint, gaps_map["warm"]),
        "suggested_focus_areas":     focus_map.get(hint, focus_map["warm"]),
        "generated_at":              ts(),
    }).execute()


# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — CLEAN
# ─────────────────────────────────────────────────────────────────────────────

print("\n━━━ STEP 1 / 3 — CLEANING DATABASE ━━━")

admins_resp = sb.table("profiles").select("id").eq("role", "admin").execute().data or []
admin_ids   = {r["id"] for r in admins_resp}
print(f"  Preserving {len(admin_ids)} admin account(s): {admin_ids or '(none found)'}")

# Delete non-admin auth users
try:
    all_auth = list(sb.auth.admin.list_users())
except Exception as exc:
    print(f"  Warning: list_users failed ({exc}), will skip auth cleanup")
    all_auth = []

deleted_auth = 0
for u in all_auth:
    uid_val = getattr(u, "id", None)
    if uid_val and uid_val not in admin_ids:
        try:
            sb.auth.admin.delete_user(uid_val)
            deleted_auth += 1
        except Exception as e:
            print(f"  Warning: could not delete auth user {uid_val}: {e}")
print(f"  Deleted {deleted_auth} auth user(s)")

# Wipe dependent tables — admins never have sessions/analyses so neq trick deletes all
GHOST = "00000000-0000-0000-0000-000000000001"   # impossible user_id
for tbl in ("session_reports", "sessions", "pre_analyses"):
    try:
        sb.table(tbl).delete().neq("user_id", GHOST).execute()
        print(f"  Cleared table: {tbl}")
    except Exception as e:
        print(f"  Warning clearing {tbl}: {e}")

# Delete non-admin profiles
non_admin_profiles = [
    p["id"] for p in (sb.table("profiles").select("id").execute().data or [])
    if p["id"] not in admin_ids
]
if non_admin_profiles:
    sb.table("profiles").delete().in_("id", non_admin_profiles).execute()
print(f"  Cleared {len(non_admin_profiles)} non-admin profile(s)")
print("  ✓ Database clean\n")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — USER DEFINITIONS  (32 students)
# ─────────────────────────────────────────────────────────────────────────────
# Schema for each user dict:
#   email, full_name, age, phone, lang (preferred_language),
#   edu: {level, field, institution, gpa, grad_year}
#   countries: [str], course, unis: [str],
#   budget: {tuition, living, source, scholarship}
#   timeline: {intake, months, awareness}
#   scores: {ielts, toefl, gre, gmat, duolingo}   — None means not taken
#   visa_rejection: bool
#   classification: hot | warm | cold
#   completeness: int (for pre_analysis)
#   sessions: list of (days_ago, duration_s, score, sentiment)  — empty = no sessions
#   pre_analysis: bool
# ─────────────────────────────────────────────────────────────────────────────

USERS = [

    # ── HOT LEADS (10) ────────────────────────────────────────────────────────

    {   # 1
        "email": "aisha.khan.abroad@gmail.com",
        "full_name": "Aisha Khan",
        "age": 23, "phone": "+91 9876543201",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Computer Science", "institution": "BITS Pilani", "gpa": 9.1, "grad_year": 2024},
        "countries": ["Germany", "Netherlands"],
        "course": "MS Artificial Intelligence",
        "unis": ["TU Munich", "Eindhoven University", "RWTH Aachen"],
        "budget": {"tuition": 18000, "living": 10000, "source": "education_loan", "scholarship": True},
        "timeline": {"intake": "Winter 2025", "months": 6, "awareness": True},
        "scores": {"ielts": 8.0, "toefl": None, "gre": 328, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "hot", "completeness": 92,
        "sessions": [(14, 820, 88, "positive"), (7, 940, 91, "positive")],
        "pre_analysis": True,
    },
    {   # 2
        "email": "rohan.mehta.ms@gmail.com",
        "full_name": "Rohan Mehta",
        "age": 24, "phone": "+91 9876543202",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Electronics Engineering", "institution": "IIT Bombay", "gpa": 8.8, "grad_year": 2023},
        "countries": ["USA", "Canada"],
        "course": "MS Computer Science",
        "unis": ["Carnegie Mellon", "University of Toronto", "Georgia Tech"],
        "budget": {"tuition": 55000, "living": 18000, "source": "education_loan", "scholarship": True},
        "timeline": {"intake": "Fall 2025", "months": 4, "awareness": True},
        "scores": {"ielts": None, "toefl": 115, "gre": 335, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "hot", "completeness": 95,
        "sessions": [(21, 1020, 93, "positive"), (10, 880, 90, "positive"), (2, 760, 92, "positive")],
        "pre_analysis": True,
    },
    {   # 3
        "email": "priya.sharma.mba@yahoo.com",
        "full_name": "Priya Sharma",
        "age": 27, "phone": "+91 9876543203",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Commerce", "institution": "Delhi University", "gpa": 8.2, "grad_year": 2019},
        "countries": ["UK", "Ireland"],
        "course": "MBA Finance",
        "unis": ["London Business School", "University College Dublin", "Warwick Business School"],
        "budget": {"tuition": 42000, "living": 15000, "source": "self_funded", "scholarship": False},
        "timeline": {"intake": "September 2025", "months": 5, "awareness": True},
        "scores": {"ielts": 7.5, "toefl": None, "gre": None, "gmat": 720, "duolingo": None},
        "visa_rejection": False,
        "classification": "hot", "completeness": 88,
        "sessions": [(18, 900, 85, "positive"), (5, 840, 87, "positive")],
        "pre_analysis": True,
    },
    {   # 4
        "email": "arjun.nair.ds@gmail.com",
        "full_name": "Arjun Nair",
        "age": 22, "phone": "+91 9876543204",
        "lang": "hi",
        "edu": {"level": "Bachelor's", "field": "Statistics", "institution": "Pune University", "gpa": 8.6, "grad_year": 2024},
        "countries": ["Germany", "Canada"],
        "course": "MS Data Science",
        "unis": ["University of Mannheim", "University of Waterloo"],
        "budget": {"tuition": 20000, "living": 11000, "source": "education_loan", "scholarship": True},
        "timeline": {"intake": "Winter 2025", "months": 7, "awareness": True},
        "scores": {"ielts": 7.5, "toefl": None, "gre": 320, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "hot", "completeness": 91,
        "sessions": [(12, 860, 86, "positive"), (4, 780, 89, "positive")],
        "pre_analysis": True,
    },
    {   # 5
        "email": "sneha.patel.bio@gmail.com",
        "full_name": "Sneha Patel",
        "age": 23, "phone": "+91 9876543205",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Biotechnology", "institution": "VIT Vellore", "gpa": 8.9, "grad_year": 2024},
        "countries": ["Netherlands", "Sweden"],
        "course": "MS Biotechnology",
        "unis": ["Wageningen University", "Leiden University", "Uppsala University"],
        "budget": {"tuition": 16000, "living": 12000, "source": "scholarship", "scholarship": True},
        "timeline": {"intake": "September 2025", "months": 5, "awareness": True},
        "scores": {"ielts": 8.5, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "hot", "completeness": 89,
        "sessions": [(9, 920, 84, "positive")],
        "pre_analysis": True,
    },
    {   # 6
        "email": "vikas.gupta.ml@gmail.com",
        "full_name": "Vikas Gupta",
        "age": 25, "phone": "+91 9876543206",
        "lang": "hi",
        "edu": {"level": "Master's", "field": "Computer Science", "institution": "IIT Delhi", "gpa": 9.3, "grad_year": 2023},
        "countries": ["USA"],
        "course": "MS Machine Learning",
        "unis": ["MIT", "Stanford University", "UC Berkeley"],
        "budget": {"tuition": 60000, "living": 20000, "source": "education_loan", "scholarship": True},
        "timeline": {"intake": "Fall 2025", "months": 3, "awareness": True},
        "scores": {"ielts": None, "toefl": 118, "gre": 338, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "hot", "completeness": 97,
        "sessions": [(30, 1100, 95, "positive"), (15, 980, 94, "positive"), (3, 850, 96, "positive")],
        "pre_analysis": True,
    },
    {   # 7
        "email": "tanvi.desai.phd@gmail.com",
        "full_name": "Tanvi Desai",
        "age": 26, "phone": "+91 9876543207",
        "lang": "mr",
        "edu": {"level": "Master's", "field": "Computer Science", "institution": "University of Mumbai", "gpa": 9.0, "grad_year": 2022},
        "countries": ["Germany"],
        "course": "PhD Computer Science",
        "unis": ["Max Planck Institute", "TU Berlin", "Heidelberg University"],
        "budget": {"tuition": 1000, "living": 10000, "source": "scholarship", "scholarship": True},
        "timeline": {"intake": "Winter 2025", "months": 8, "awareness": True},
        "scores": {"ielts": 8.0, "toefl": None, "gre": 332, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "hot", "completeness": 94,
        "sessions": [(20, 1050, 90, "positive"), (6, 960, 93, "positive")],
        "pre_analysis": True,
    },
    {   # 8
        "email": "karan.singh.ee@gmail.com",
        "full_name": "Karan Singh",
        "age": 23, "phone": "+91 9876543208",
        "lang": "hi",
        "edu": {"level": "Bachelor's", "field": "Electrical Engineering", "institution": "NIT Trichy", "gpa": 8.4, "grad_year": 2024},
        "countries": ["USA", "Germany"],
        "course": "MS Electrical Engineering",
        "unis": ["University of Michigan", "Purdue University", "TU Munich"],
        "budget": {"tuition": 45000, "living": 16000, "source": "education_loan", "scholarship": True},
        "timeline": {"intake": "Fall 2025", "months": 4, "awareness": True},
        "scores": {"ielts": None, "toefl": 110, "gre": 322, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "hot", "completeness": 90,
        "sessions": [(16, 870, 82, "positive"), (8, 810, 85, "positive")],
        "pre_analysis": True,
    },
    {   # 9
        "email": "meera.iyer.mph@gmail.com",
        "full_name": "Meera Iyer",
        "age": 24, "phone": "+91 9876543209",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Life Sciences", "institution": "Christ University", "gpa": 8.7, "grad_year": 2023},
        "countries": ["UK", "Ireland"],
        "course": "MS Public Health",
        "unis": ["University of Edinburgh", "Trinity College Dublin", "University of Glasgow"],
        "budget": {"tuition": 28000, "living": 14000, "source": "family_support", "scholarship": False},
        "timeline": {"intake": "September 2025", "months": 6, "awareness": True},
        "scores": {"ielts": 8.0, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "hot", "completeness": 87,
        "sessions": [(11, 800, 83, "positive")],
        "pre_analysis": True,
    },
    {   # 10
        "email": "rahul.verma.rob@gmail.com",
        "full_name": "Rahul Verma",
        "age": 22, "phone": "+91 9876543210",
        "lang": "hi",
        "edu": {"level": "Bachelor's", "field": "Mechanical Engineering", "institution": "IIT Kharagpur", "gpa": 8.9, "grad_year": 2024},
        "countries": ["Germany", "Sweden"],
        "course": "MS Robotics",
        "unis": ["TU Munich", "KTH Royal Institute", "TU Berlin"],
        "budget": {"tuition": 15000, "living": 11000, "source": "education_loan", "scholarship": True},
        "timeline": {"intake": "Winter 2025", "months": 5, "awareness": True},
        "scores": {"ielts": 7.5, "toefl": None, "gre": 318, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "hot", "completeness": 93,
        "sessions": [(25, 950, 87, "positive"), (9, 900, 89, "positive")],
        "pre_analysis": True,
    },

    # ── WARM LEADS (12) ───────────────────────────────────────────────────────

    {   # 11
        "email": "anjali.reddy.mba@gmail.com",
        "full_name": "Anjali Reddy",
        "age": 26, "phone": "+91 9812345001",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Business Administration", "institution": "Osmania University", "gpa": 7.8, "grad_year": 2021},
        "countries": ["UK", "Ireland"],
        "course": "MBA",
        "unis": ["University of Strathclyde", "University College Dublin"],
        "budget": {"tuition": 32000, "living": 14000, "source": "education_loan", "scholarship": False},
        "timeline": {"intake": "September 2025", "months": 9, "awareness": False},
        "scores": {"ielts": 7.0, "toefl": None, "gre": None, "gmat": 640, "duolingo": None},
        "visa_rejection": False,
        "classification": "warm", "completeness": 72,
        "sessions": [(19, 680, 62, "neutral"), (6, 620, 65, "positive")],
        "pre_analysis": True,
    },
    {   # 12
        "email": "saurabh.joshi.msfin@gmail.com",
        "full_name": "Saurabh Joshi",
        "age": 25, "phone": "+91 9812345002",
        "lang": "mr",
        "edu": {"level": "Bachelor's", "field": "Finance", "institution": "Symbiosis College", "gpa": 7.5, "grad_year": 2022},
        "countries": ["Netherlands", "Germany"],
        "course": "MS Finance",
        "unis": ["Erasmus University", "Frankfurt School of Finance"],
        "budget": {"tuition": 22000, "living": 12000, "source": "education_loan", "scholarship": False},
        "timeline": {"intake": "September 2025", "months": 10, "awareness": False},
        "scores": {"ielts": 6.5, "toefl": None, "gre": None, "gmat": 610, "duolingo": None},
        "visa_rejection": False,
        "classification": "warm", "completeness": 68,
        "sessions": [(22, 600, 58, "neutral")],
        "pre_analysis": True,
    },
    {   # 13
        "email": "pooja.mishra.env@gmail.com",
        "full_name": "Pooja Mishra",
        "age": 24, "phone": "+91 9812345003",
        "lang": "hi",
        "edu": {"level": "Bachelor's", "field": "Environmental Science", "institution": "Banaras Hindu University", "gpa": 8.0, "grad_year": 2023},
        "countries": ["Sweden", "Denmark"],
        "course": "MS Environmental Science",
        "unis": ["Lund University", "Chalmers University"],
        "budget": {"tuition": 14000, "living": 13000, "source": "scholarship", "scholarship": True},
        "timeline": {"intake": "Fall 2025", "months": 8, "awareness": True},
        "scores": {"ielts": 7.0, "toefl": None, "gre": None, "gmat": None, "duolingo": 115},
        "visa_rejection": False,
        "classification": "warm", "completeness": 75,
        "sessions": [(14, 640, 60, "neutral")],
        "pre_analysis": True,
    },
    {   # 14
        "email": "vikram.tiwari.meng@gmail.com",
        "full_name": "Vikram Tiwari",
        "age": 23, "phone": "+91 9812345004",
        "lang": "hi",
        "edu": {"level": "Bachelor's", "field": "Mechanical Engineering", "institution": "VIT University", "gpa": 7.2, "grad_year": 2024},
        "countries": ["Germany", "Canada"],
        "course": "MS Mechanical Engineering",
        "unis": ["RWTH Aachen", "University of Waterloo"],
        "budget": {"tuition": 18000, "living": 11000, "source": "family_support", "scholarship": False},
        "timeline": {"intake": "Winter 2025", "months": 11, "awareness": False},
        "scores": {"ielts": 6.5, "toefl": None, "gre": 305, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "warm", "completeness": 65,
        "sessions": [(17, 590, 55, "neutral"), (3, 550, 58, "neutral")],
        "pre_analysis": True,
    },
    {   # 15
        "email": "ritika.agarwal.psych@gmail.com",
        "full_name": "Ritika Agarwal",
        "age": 22, "phone": "+91 9812345005",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Psychology", "institution": "Fergusson College", "gpa": 8.3, "grad_year": 2024},
        "countries": ["UK"],
        "course": "MS Psychology",
        "unis": ["University of Manchester", "King's College London"],
        "budget": {"tuition": 30000, "living": 15000, "source": "family_support", "scholarship": False},
        "timeline": {"intake": "September 2025", "months": 7, "awareness": True},
        "scores": {"ielts": 7.0, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "warm", "completeness": 70,
        "sessions": [(10, 650, 63, "positive")],
        "pre_analysis": True,
    },
    {   # 16
        "email": "nikhil.bose.supply@gmail.com",
        "full_name": "Nikhil Bose",
        "age": 27, "phone": "+91 9812345006",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Industrial Engineering", "institution": "Jadavpur University", "gpa": 7.6, "grad_year": 2019},
        "countries": ["Germany"],
        "course": "MS Supply Chain Management",
        "unis": ["WHU Otto Beisheim", "University of Hamburg"],
        "budget": {"tuition": 20000, "living": 10000, "source": "self_funded", "scholarship": False},
        "timeline": {"intake": "Winter 2025", "months": 12, "awareness": False},
        "scores": {"ielts": 6.5, "toefl": None, "gre": None, "gmat": 600, "duolingo": None},
        "visa_rejection": True,
        "classification": "warm", "completeness": 62,
        "sessions": [(28, 580, 54, "neutral")],
        "pre_analysis": True,
    },
    {   # 17
        "email": "divya.nambiar.arch@gmail.com",
        "full_name": "Divya Nambiar",
        "age": 24, "phone": "+91 9812345007",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Architecture", "institution": "SPA New Delhi", "gpa": 8.1, "grad_year": 2023},
        "countries": ["Netherlands", "France"],
        "course": "MS Architecture",
        "unis": ["TU Delft", "Paris School of Architecture"],
        "budget": {"tuition": 16000, "living": 14000, "source": "family_support", "scholarship": False},
        "timeline": {"intake": "September 2025", "months": 10, "awareness": True},
        "scores": {"ielts": 7.5, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "warm", "completeness": 74,
        "sessions": [(15, 670, 61, "neutral")],
        "pre_analysis": False,
    },
    {   # 18
        "email": "harish.pillai.swe@gmail.com",
        "full_name": "Harish Pillai",
        "age": 25, "phone": "+91 9812345008",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Information Technology", "institution": "Amrita University", "gpa": 7.9, "grad_year": 2022},
        "countries": ["Canada"],
        "course": "MS Software Engineering",
        "unis": ["University of British Columbia", "University of Alberta"],
        "budget": {"tuition": 35000, "living": 16000, "source": "education_loan", "scholarship": False},
        "timeline": {"intake": "Fall 2025", "months": 8, "awareness": False},
        "scores": {"ielts": 7.0, "toefl": None, "gre": 310, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "warm", "completeness": 69,
        "sessions": [(21, 610, 57, "neutral"), (7, 590, 60, "neutral")],
        "pre_analysis": False,
    },
    {   # 19
        "email": "sunita.rao.edtech@gmail.com",
        "full_name": "Sunita Rao",
        "age": 29, "phone": "+91 9812345009",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Education", "institution": "University of Mysore", "gpa": 7.4, "grad_year": 2017},
        "countries": ["Australia"],
        "course": "MS Education Technology",
        "unis": ["University of Melbourne", "Monash University"],
        "budget": {"tuition": 38000, "living": 17000, "source": "self_funded", "scholarship": False},
        "timeline": {"intake": "February 2026", "months": 13, "awareness": False},
        "scores": {"ielts": 7.5, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "warm", "completeness": 67,
        "sessions": [(33, 560, 52, "neutral")],
        "pre_analysis": False,
    },
    {   # 20
        "email": "mohit.saxena.econ@gmail.com",
        "full_name": "Mohit Saxena",
        "age": 23, "phone": "+91 9812345010",
        "lang": "hi",
        "edu": {"level": "Bachelor's", "field": "Economics", "institution": "Allahabad University", "gpa": 7.7, "grad_year": 2024},
        "countries": ["UK"],
        "course": "MS Economics",
        "unis": ["University of Warwick", "University of Bristol"],
        "budget": {"tuition": 29000, "living": 14000, "source": "education_loan", "scholarship": False},
        "timeline": {"intake": "September 2025", "months": 9, "awareness": True},
        "scores": {"ielts": 7.0, "toefl": None, "gre": 308, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "warm", "completeness": 71,
        "sessions": [(13, 620, 59, "positive")],
        "pre_analysis": False,
    },
    {   # 21
        "email": "kavya.reddy.ux@gmail.com",
        "full_name": "Kavya Reddy",
        "age": 22, "phone": "+91 9812345011",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Design", "institution": "MIT Manipal", "gpa": 8.2, "grad_year": 2024},
        "countries": ["Netherlands", "Sweden"],
        "course": "MS UX Design",
        "unis": ["TU Delft", "Linköping University"],
        "budget": {"tuition": 15000, "living": 12000, "source": "family_support", "scholarship": True},
        "timeline": {"intake": "Fall 2025", "months": 7, "awareness": True},
        "scores": {"ielts": None, "toefl": None, "gre": None, "gmat": None, "duolingo": 120},
        "visa_rejection": False,
        "classification": "warm", "completeness": 73,
        "sessions": [(8, 590, 56, "positive")],
        "pre_analysis": False,
    },
    {   # 22
        "email": "ashish.kumar.sec@gmail.com",
        "full_name": "Ashish Kumar",
        "age": 24, "phone": "+91 9812345012",
        "lang": "hi",
        "edu": {"level": "Bachelor's", "field": "Computer Science", "institution": "LPU", "gpa": 7.3, "grad_year": 2023},
        "countries": ["USA", "Canada"],
        "course": "MS Cyber Security",
        "unis": ["Northeastern University", "University of Toronto"],
        "budget": {"tuition": 48000, "living": 17000, "source": "education_loan", "scholarship": False},
        "timeline": {"intake": "Fall 2025", "months": 10, "awareness": False},
        "scores": {"ielts": None, "toefl": 100, "gre": 302, "gmat": None, "duolingo": None},
        "visa_rejection": True,
        "classification": "warm", "completeness": 66,
        "sessions": [(26, 560, 53, "neutral")],
        "pre_analysis": False,
    },

    # ── COLD LEADS (10) ───────────────────────────────────────────────────────

    {   # 23
        "email": "preeti.singh.explore@gmail.com",
        "full_name": "Preeti Singh",
        "age": 21, "phone": "+91 9700000001",
        "lang": "hi",
        "edu": {"level": "Bachelor's", "field": "Commerce", "institution": "DU SOL", "gpa": 6.5, "grad_year": 2024},
        "countries": ["UK", "Canada", "Australia"],
        "course": "MBA",
        "unis": [],
        "budget": {"tuition": None, "living": None, "source": "education_loan", "scholarship": False},
        "timeline": {"intake": "Not decided", "months": None, "awareness": False},
        "scores": {"ielts": None, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "cold", "completeness": 38,
        "sessions": [(40, 340, 28, "negative")],
        "pre_analysis": True,
    },
    {   # 24
        "email": "deepak.pandey.maybe@yahoo.com",
        "full_name": "Deepak Pandey",
        "age": 22, "phone": "+91 9700000002",
        "lang": "hi",
        "edu": {"level": "Bachelor's", "field": "Computer Science", "institution": "AKTU", "gpa": 6.2, "grad_year": 2024},
        "countries": ["Germany"],
        "course": "MS Computer Science",
        "unis": [],
        "budget": {"tuition": None, "living": None, "source": "education_loan", "scholarship": False},
        "timeline": {"intake": "Not sure", "months": None, "awareness": False},
        "scores": {"ielts": None, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "cold", "completeness": 33,
        "sessions": [(45, 280, 22, "negative")],
        "pre_analysis": True,
    },
    {   # 25
        "email": "lavanya.krishnan.unsure@gmail.com",
        "full_name": "Lavanya Krishnan",
        "age": 23, "phone": "+91 9700000003",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Arts", "institution": "Madras University", "gpa": 7.0, "grad_year": 2023},
        "countries": ["UK"],
        "course": "",
        "unis": [],
        "budget": {"tuition": None, "living": None, "source": "family_support", "scholarship": False},
        "timeline": {"intake": "Maybe 2026", "months": None, "awareness": False},
        "scores": {"ielts": None, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "cold", "completeness": 28,
        "sessions": [],
        "pre_analysis": False,
    },
    {   # 26
        "email": "gaurav.malhotra.mba@gmail.com",
        "full_name": "Gaurav Malhotra",
        "age": 28, "phone": "+91 9700000004",
        "lang": "hi",
        "edu": {"level": "Bachelor's", "field": "Engineering", "institution": "Rajasthan Technical University", "gpa": 6.0, "grad_year": 2019},
        "countries": ["USA", "UK"],
        "course": "MBA",
        "unis": [],
        "budget": {"tuition": 40000, "living": None, "source": "self_funded", "scholarship": False},
        "timeline": {"intake": "Not decided", "months": None, "awareness": False},
        "scores": {"ielts": None, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": True,
        "classification": "cold", "completeness": 35,
        "sessions": [(50, 310, 25, "negative")],
        "pre_analysis": False,
    },
    {   # 27
        "email": "swati.bhatia.europe@gmail.com",
        "full_name": "Swati Bhatia",
        "age": 22, "phone": "+91 9700000005",
        "lang": "mr",
        "edu": {"level": "Bachelor's", "field": "Information Technology", "institution": "Savitribai Phule University", "gpa": 6.8, "grad_year": 2024},
        "countries": ["Germany", "France", "Netherlands"],
        "course": "",
        "unis": [],
        "budget": {"tuition": None, "living": None, "source": "education_loan", "scholarship": False},
        "timeline": {"intake": "Anytime", "months": None, "awareness": False},
        "scores": {"ielts": None, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "cold", "completeness": 30,
        "sessions": [],
        "pre_analysis": False,
    },
    {   # 28
        "email": "rakesh.yadav.abroad@gmail.com",
        "full_name": "Rakesh Yadav",
        "age": 24, "phone": "+91 9700000006",
        "lang": "hi",
        "edu": {"level": "Bachelor's", "field": "Mechanical Engineering", "institution": "CSVTU", "gpa": 5.8, "grad_year": 2023},
        "countries": [],
        "course": "",
        "unis": [],
        "budget": {"tuition": None, "living": None, "source": "education_loan", "scholarship": False},
        "timeline": {"intake": "Flexible", "months": None, "awareness": False},
        "scores": {"ielts": None, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "cold", "completeness": 20,
        "sessions": [(60, 260, 18, "negative")],
        "pre_analysis": False,
    },
    {   # 29
        "email": "namrata.jain.deciding@gmail.com",
        "full_name": "Namrata Jain",
        "age": 23, "phone": "+91 9700000007",
        "lang": "en",
        "edu": {"level": "Bachelor's", "field": "Pharmacy", "institution": "JSS University", "gpa": 7.1, "grad_year": 2024},
        "countries": ["UK", "Australia"],
        "course": "MS Pharmaceutical Sciences",
        "unis": [],
        "budget": {"tuition": 25000, "living": None, "source": "family_support", "scholarship": False},
        "timeline": {"intake": "Not decided", "months": None, "awareness": False},
        "scores": {"ielts": 6.0, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "cold", "completeness": 42,
        "sessions": [],
        "pre_analysis": False,
    },
    {   # 30
        "email": "abhimanyu.rawat.fresh@gmail.com",
        "full_name": "Abhimanyu Rawat",
        "age": 21, "phone": "+91 9700000008",
        "lang": "hi",
        "edu": {"level": "Bachelor's", "field": "Commerce", "institution": "HNB Garhwal University", "gpa": 6.9, "grad_year": 2024},
        "countries": [],
        "course": "",
        "unis": [],
        "budget": {"tuition": None, "living": None, "source": "education_loan", "scholarship": False},
        "timeline": {"intake": "Exploring", "months": None, "awareness": False},
        "scores": {"ielts": None, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "cold", "completeness": 18,
        "sessions": [],
        "pre_analysis": False,
    },
    {   # 31
        "email": "pallavi.dubey.budget@gmail.com",
        "full_name": "Pallavi Dubey",
        "age": 25, "phone": "+91 9700000009",
        "lang": "hi",
        "edu": {"level": "Bachelor's", "field": "Computer Applications", "institution": "Lucknow University", "gpa": 6.5, "grad_year": 2022},
        "countries": ["Germany"],
        "course": "MS Computer Science",
        "unis": [],
        "budget": {"tuition": None, "living": None, "source": "education_loan", "scholarship": False},
        "timeline": {"intake": "Winter 2026", "months": 18, "awareness": False},
        "scores": {"ielts": None, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "cold", "completeness": 36,
        "sessions": [(55, 290, 21, "negative")],
        "pre_analysis": False,
    },
    {   # 32
        "email": "chirag.shah.justjoined@gmail.com",
        "full_name": "Chirag Shah",
        "age": 20, "phone": "+91 9700000010",
        "lang": "auto",
        "edu": {"level": "Bachelor's", "field": "", "institution": "", "gpa": None, "grad_year": None},
        "countries": [],
        "course": "",
        "unis": [],
        "budget": {"tuition": None, "living": None, "source": "education_loan", "scholarship": False},
        "timeline": {"intake": "", "months": None, "awareness": False},
        "scores": {"ielts": None, "toefl": None, "gre": None, "gmat": None, "duolingo": None},
        "visa_rejection": False,
        "classification": "cold", "completeness": 5,
        "sessions": [],
        "pre_analysis": False,
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — INSERT
# ─────────────────────────────────────────────────────────────────────────────

print("━━━ STEP 2 / 3 — CREATING AUTH USERS ━━━")

user_id_map: dict[str, str] = {}   # email → supabase user_id

for u in USERS:
    try:
        resp = sb.auth.admin.create_user({
            "email":         u["email"],
            "password":      PASSWORD,
            "email_confirm": True,
        })
        created_uid = getattr(resp, "id", None) or (getattr(resp, "user", None) and getattr(resp.user, "id", None))
        if not created_uid:
            # Try dict-style access
            if hasattr(resp, "__getitem__"):
                created_uid = resp["id"]
            elif hasattr(resp, "user") and hasattr(resp.user, "__getitem__"):
                created_uid = resp.user["id"]
        if not created_uid:
            print(f"  ✗ Could not extract user_id for {u['email']}")
            continue
        user_id_map[u["email"]] = created_uid
        print(f"  ✓ {u['full_name']:30s}  {u['email']}")
    except Exception as e:
        print(f"  ✗ {u['email']}: {e}")

print(f"\n  Created {len(user_id_map)} / {len(USERS)} auth users\n")


print("━━━ STEP 3 / 3 — INSERTING PROFILES + SESSION DATA ━━━\n")

hot_count, warm_count, cold_count = 0, 0, 0

for u in USERS:
    email = u["email"]
    user_id = user_id_map.get(email)
    if not user_id:
        print(f"  Skipping {email} — no auth user created")
        continue

    edu    = u["edu"]
    bud    = u["budget"]
    tl     = u["timeline"]
    sc     = u["scores"]
    cls    = u["classification"]

    # ── Profile ──────────────────────────────────────────────────────────────
    profile = {
        "id":                    user_id,
        "email":                 email,
        "full_name":             u["full_name"],
        "role":                  "student",
        "phone":                 u["phone"],
        "age":                   u["age"],
        "current_education": {
            "level":            edu["level"],
            "field":            edu["field"],
            "institution":      edu["institution"],
            "gpa":              edu["gpa"],
            "graduation_year":  edu["grad_year"],
        },
        "target_countries":      u["countries"],
        "target_course":         u["course"],
        "target_universities":   u["unis"],
        "budget": {
            "annual_tuition_usd":   bud["tuition"],
            "living_expenses_usd":  bud["living"],
            "funding_source":       bud["source"],
            "scholarship_applied":  bud["scholarship"],
        },
        "timeline": {
            "preferred_intake":                 tl["intake"],
            "months_to_start":                  tl["months"],
            "application_deadline_awareness":   tl["awareness"],
        },
        "test_scores": {
            "ielts":    sc["ielts"],
            "toefl":    sc["toefl"],
            "gre":      sc["gre"],
            "gmat":     sc["gmat"],
            "duolingo": sc["duolingo"],
        },
        "previous_visa_rejection": u["visa_rejection"],
        "preferred_language":      u["lang"],
        "updated_at":              ts(),
    }
    sb.table("profiles").upsert(profile).execute()

    # ── Sessions + Reports ───────────────────────────────────────────────────
    for idx, (days_ago, duration_s, score, sentiment) in enumerate(u["sessions"], 1):
        create_session_record(
            user_id=user_id,
            days_ago=days_ago,
            duration_s=duration_s,
            lang=u["lang"] if u["lang"] != "auto" else "en",
            score=score,
            classification=cls,
            sentiment=sentiment,
            session_num=idx,
        )

    # ── Pre-Analysis ─────────────────────────────────────────────────────────
    if u["pre_analysis"]:
        create_pre_analysis(user_id, u["completeness"], cls)

    # Tally
    if cls == "hot":   hot_count += 1
    elif cls == "warm": warm_count += 1
    else:               cold_count += 1

    sessions_label = f"{len(u['sessions'])} session(s)" if u["sessions"] else "no sessions"
    pa_label       = "+ pre-analysis" if u["pre_analysis"] else ""
    print(f"  [{cls.upper():4s}] {u['full_name']:30s}  {sessions_label:15s} {pa_label}")


# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
total = len(user_id_map)
print(f"""
━━━ DONE ━━━
  Total users created : {total}
  Hot  leads          : {hot_count}
  Warm leads          : {warm_count}
  Cold leads          : {cold_count}

  Password for all users: {PASSWORD}

  Admin credentials are preserved unchanged.
""")
