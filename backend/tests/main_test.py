import json
import uuid

import requests

BASE_URL = "http://127.0.0.1:8000"
STUDENT_EMAIL = f"student_{uuid.uuid4().hex[:8]}@example.com"
PASSWORD = "SecurePass123!"

# Set these for manual admin user created in Supabase Auth + profiles.role='admin'
ADMIN_EMAIL = "jaiudeshi05@gmail.com"
ADMIN_PASSWORD = "Jai@12345"


def auth_headers(token=None, json_body=True):
    headers = {"Accept": "application/json"}
    if json_body:
        headers["Content-Type"] = "application/json"
    if token:
        normalized = token if token.startswith("Bearer ") else f"Bearer {token}"
        headers["Authorization"] = normalized
    return headers


def pretty(title, resp):
    print(f"\n=== {title} ===")
    print("Status:", resp.status_code)
    try:
        print(json.dumps(resp.json(), indent=2))
    except Exception:
        print(resp.text)


def post(path, data=None, token=None, files=None):
    if files:
        return requests.post(f"{BASE_URL}{path}", headers=auth_headers(token=token, json_body=False), files=files, timeout=20)
    return requests.post(
        f"{BASE_URL}{path}",
        headers=auth_headers(token=token, json_body=True),
        json=data or {},
        timeout=20,
    )


def get(path, token=None, params=None):
    return requests.get(f"{BASE_URL}{path}", headers=auth_headers(token=token, json_body=False), params=params, timeout=20)


def put(path, data=None, token=None):
    return requests.put(
        f"{BASE_URL}{path}",
        headers=auth_headers(token=token, json_body=True),
        json=data or {},
        timeout=20,
    )


def main():
    r = get("/health")
    pretty("GET /health", r)
    if r.status_code != 200:
        return

    student_signup = {
        "email": STUDENT_EMAIL,
        "password": PASSWORD,
        "full_name": "Riya Sharma",
        "role": "student",
    }
    r = post("/auth/signup", student_signup)
    pretty("POST /auth/signup (student)", r)

    student_token = None
    student_refresh = None
    student_user_id = None

    r = post("/auth/login", {"email": STUDENT_EMAIL, "password": PASSWORD})
    pretty("POST /auth/login (student)", r)
    if r.ok:
        student = r.json()
        student_token = student.get("access_token")
        student_refresh = student.get("refresh_token")
        student_user_id = student.get("user_id")
    else:
        print("Student login failed. Stopping.")
        return

    if student_refresh:
        r = post("/auth/refresh", {"refresh_token": student_refresh})
        pretty("POST /auth/refresh", r)

    r = get("/auth/me", token=student_token)
    pretty("GET /auth/me", r)

    profile_body = {
        "full_name": "Riya Sharma",
        "phone": "+919876543210",
        "age": 22,
        "current_education": {"level": "Bachelor's", "field": "Computer Science", "institution": "SPPU", "gpa": 8.4},
        "target_countries": ["Germany", "Canada"],
        "target_course": "MS in Data Science",
        "target_universities": ["TU Munich", "University of Toronto"],
        "budget": {"annual_tuition_usd": 22000, "living_expenses_usd": 12000},
        "timeline": {"preferred_intake": "Fall 2026", "months_to_start": 7},
        "test_scores": {"ielts": 7.5, "gre": 321},
        "previous_visa_rejection": False,
        "preferred_language": "auto",
    }
    r = post("/profile/submit", profile_body, token=student_token)
    pretty("POST /profile/submit", r)

    r = get(f"/profile/{student_user_id}", token=student_token)
    pretty("GET /profile/{user_id}", r)

    r = put(f"/profile/{student_user_id}", {"phone": "+919999999999", "preferred_language": "en"}, token=student_token)
    pretty("PUT /profile/{user_id}", r)

    fake_pdf = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    files = {"file": ("resume.pdf", fake_pdf, "application/pdf")}
    r = post(f"/profile/{student_user_id}/resume/parse", token=student_token, files=files)
    pretty("POST /profile/{user_id}/resume/parse", r)

    r = post(f"/profile/{student_user_id}/resume", token=student_token, files=files)
    pretty("POST /profile/{user_id}/resume", r)

    r = get(f"/profile/{student_user_id}/resume", token=student_token)
    pretty("GET /profile/{user_id}/resume", r)

    r = post(f"/profile/{student_user_id}/analyze", {}, token=student_token)
    pretty("POST /profile/{user_id}/analyze", r)

    r = get(f"/profile/{student_user_id}/pre-analysis", token=student_token)
    pretty("GET /profile/{user_id}/pre-analysis", r)

    r = get(f"/profile/{student_user_id}/score", token=student_token)
    pretty("GET /profile/{user_id}/score", r)

    r = post(f"/profile/{student_user_id}/summary", {}, token=student_token)
    pretty("POST /profile/{user_id}/summary", r)

    session_id = None
    r = post("/session/create", {"user_id": student_user_id, "preferred_language": "auto"}, token=student_token)
    pretty("POST /session/create", r)
    if r.ok:
        session_id = r.json().get("session_id")

    if session_id:
        r = get(f"/session/{session_id}", token=student_token)
        pretty("GET /session/{session_id}", r)
        r = get(f"/session/{session_id}/status", token=student_token)
        pretty("GET /session/{session_id}/status", r)
        r = post(f"/session/{session_id}/end", {}, token=student_token)
        pretty("POST /session/{session_id}/end", r)

    admin_token = None
    r = post("/admin/login", {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    pretty("POST /admin/login", r)
    if r.ok:
        admin_token = r.json().get("access_token")
    else:
        print("Admin login failed. Skipping admin endpoint checks.")

    if admin_token:
        r = get("/auth/me", token=admin_token)
        pretty("GET /auth/me (admin token)", r)

        r = get("/admin/leads", token=admin_token)
        pretty("GET /admin/leads", r)
        r = get(f"/admin/leads/{student_user_id}", token=admin_token)
        pretty("GET /admin/leads/{user_id}", r)
        r = get(f"/admin/leads/{student_user_id}/sessions", token=admin_token)
        pretty("GET /admin/leads/{user_id}/sessions", r)
        r = get("/admin/sessions", token=admin_token)
        pretty("GET /admin/sessions", r)
        if session_id:
            r = get(f"/admin/sessions/{session_id}/report", token=admin_token)
            pretty("GET /admin/sessions/{session_id}/report", r)
        r = get("/admin/analytics", token=admin_token)
        pretty("GET /admin/analytics", r)
        r = post(f"/admin/notify/{student_user_id}", {"message": "Test callback", "priority": "high"}, token=admin_token)
        pretty("POST /admin/notify/{user_id}", r)

        r = post("/auth/logout", {}, token=admin_token)
        pretty("POST /auth/logout (admin token)", r)

    r = post("/auth/logout", {}, token=student_token)
    pretty("POST /auth/logout (student token)", r)

    print("\nDone.")


if __name__ == "__main__":
    main()
