# save as: test_all_endpoints.py
# run: python test_all_endpoints.py

import json
import uuid

import requests

BASE_URL = "http://127.0.0.1:8000"
STUDENT_EMAIL = f"student_{uuid.uuid4().hex[:8]}@example.com"
ADMIN_EMAIL = f"admin_{uuid.uuid4().hex[:8]}@example.com"
PASSWORD = "SecurePass123!"

# Change this if you already have an admin user and want to skip admin signup/login
CREATE_ADMIN = True


def pretty(title, resp):
    print(f"\n=== {title} ===")
    print("Status:", resp.status_code)
    try:
        print(json.dumps(resp.json(), indent=2))
    except Exception:
        print(resp.text)


def pretty_error(title, err):
    print(f"\n=== {title} ===")
    print("Request failed:", str(err))


def post(path, data=None, token=None, files=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if files:
        return requests.post(f"{BASE_URL}{path}", headers=headers, files=files, timeout=20)
    return requests.post(
        f"{BASE_URL}{path}",
        headers={**headers, "Content-Type": "application/json"},
        json=data or {},
        timeout=20,
    )


def get(path, token=None, params=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return requests.get(f"{BASE_URL}{path}", headers=headers, params=params, timeout=20)


def put(path, data=None, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return requests.put(
        f"{BASE_URL}{path}",
        headers={**headers, "Content-Type": "application/json"},
        json=data or {},
        timeout=20,
    )


def main():
    # Health
    try:
        r = get("/health")
        pretty("GET /health", r)
        if r.status_code != 200:
            print("Health check failed. Stop and verify backend server first.")
            return
    except requests.RequestException as err:
        pretty_error("GET /health", err)
        return

    # Signup student
    student_signup = {
        "email": STUDENT_EMAIL,
        "password": PASSWORD,
        "full_name": "Riya Sharma",
        "role": "student",
    }
    try:
        r = post("/auth/signup", student_signup)
        pretty("POST /auth/signup (student)", r)
    except requests.RequestException as err:
        pretty_error("POST /auth/signup (student)", err)

    # Login student
    student_token = None
    student_refresh = None
    student_user_id = None
    try:
        r = post("/auth/login", {"email": STUDENT_EMAIL, "password": PASSWORD})
        pretty("POST /auth/login (student)", r)
        if r.ok:
            student = r.json()
            student_token = student.get("access_token")
            student_refresh = student.get("refresh_token")
            student_user_id = student.get("user_id")
        else:
            print("Student login failed. Skipping student-protected endpoints.")
    except requests.RequestException as err:
        pretty_error("POST /auth/login (student)", err)
        print("Skipping student-protected endpoints.")

    # Refresh token
    if student_token and student_refresh:
        try:
            r = post("/auth/refresh", {"refresh_token": student_refresh})
            pretty("POST /auth/refresh", r)
        except requests.RequestException as err:
            pretty_error("POST /auth/refresh", err)

    # Auth me
    if student_token:
        try:
            r = get("/auth/me", token=student_token)
            pretty("GET /auth/me", r)
        except requests.RequestException as err:
            pretty_error("GET /auth/me", err)

    # Profile submit
    profile_body = {
        "full_name": "Riya Sharma",
        "phone": "+919876543210",
        "age": 22,
        "current_education": {
            "level": "Bachelor's",
            "field": "Computer Science",
            "institution": "SPPU",
            "gpa": 8.4,
            "graduation_year": 2024
        },
        "target_countries": ["Germany", "Canada"],
        "target_course": "MS in Data Science",
        "target_universities": ["TU Munich", "University of Toronto"],
        "budget": {
            "annual_tuition_usd": 22000,
            "living_expenses_usd": 12000,
            "funding_source": "education_loan",
            "scholarship_applied": True
        },
        "timeline": {
            "preferred_intake": "Fall 2026",
            "application_deadline_awareness": True,
            "months_to_start": 7
        },
        "test_scores": {
            "ielts": 7.5,
            "toefl": None,
            "gre": 321,
            "gmat": None,
            "duolingo": None
        },
        "previous_visa_rejection": False,
        "preferred_language": "auto",
    }
    if student_token:
        try:
            r = post("/profile/submit", profile_body, token=student_token)
            pretty("POST /profile/submit", r)
        except requests.RequestException as err:
            pretty_error("POST /profile/submit", err)

    # Get profile
    if student_token and student_user_id:
        try:
            r = get(f"/profile/{student_user_id}", token=student_token)
            pretty("GET /profile/{user_id}", r)
        except requests.RequestException as err:
            pretty_error("GET /profile/{user_id}", err)

    # Update profile
    if student_token and student_user_id:
        try:
            r = put(
                f"/profile/{student_user_id}",
                {"phone": "+919999999999", "preferred_language": "en"},
                token=student_token,
            )
            pretty("PUT /profile/{user_id}", r)
        except requests.RequestException as err:
            pretty_error("PUT /profile/{user_id}", err)

    # Upload resume (fake minimal PDF bytes)
    fake_pdf = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    files = {"file": ("resume.pdf", fake_pdf, "application/pdf")}
    if student_token and student_user_id:
        try:
            r = post(f"/profile/{student_user_id}/resume", token=student_token, files=files)
            pretty("POST /profile/{user_id}/resume", r)
        except requests.RequestException as err:
            pretty_error("POST /profile/{user_id}/resume", err)

    # Get resume signed url
    if student_token and student_user_id:
        try:
            r = get(f"/profile/{student_user_id}/resume", token=student_token)
            pretty("GET /profile/{user_id}/resume", r)
        except requests.RequestException as err:
            pretty_error("GET /profile/{user_id}/resume", err)

    # Analyze profile
    if student_token and student_user_id:
        try:
            r = post(f"/profile/{student_user_id}/analyze", {}, token=student_token)
            pretty("POST /profile/{user_id}/analyze", r)
        except requests.RequestException as err:
            pretty_error("POST /profile/{user_id}/analyze", err)

    # Get pre-analysis
    if student_token and student_user_id:
        try:
            r = get(f"/profile/{student_user_id}/pre-analysis", token=student_token)
            pretty("GET /profile/{user_id}/pre-analysis", r)
        except requests.RequestException as err:
            pretty_error("GET /profile/{user_id}/pre-analysis", err)

    # Session create
    session_id = None
    if student_token and student_user_id:
        try:
            r = post("/session/create", {"user_id": student_user_id, "preferred_language": "auto"}, token=student_token)
            pretty("POST /session/create", r)
            if r.ok:
                session_id = r.json().get("session_id")
        except requests.RequestException as err:
            pretty_error("POST /session/create", err)

    if session_id:
        try:
            r = get(f"/session/{session_id}", token=student_token)
            pretty("GET /session/{session_id}", r)
        except requests.RequestException as err:
            pretty_error("GET /session/{session_id}", err)

        try:
            r = get(f"/session/{session_id}/status", token=student_token)
            pretty("GET /session/{session_id}/status", r)
        except requests.RequestException as err:
            pretty_error("GET /session/{session_id}/status", err)

        try:
            r = post(f"/session/{session_id}/end", {}, token=student_token)
            pretty("POST /session/{session_id}/end", r)
        except requests.RequestException as err:
            pretty_error("POST /session/{session_id}/end", err)

    # Optional admin flow
    admin_token = None
    admin_user_id = None

    if CREATE_ADMIN:
        try:
            r = post("/auth/signup", {
                "email": ADMIN_EMAIL,
                "password": PASSWORD,
                "full_name": "Aman Admin",
                "role": "admin",
            })
            pretty("POST /auth/signup (admin)", r)
        except requests.RequestException as err:
            pretty_error("POST /auth/signup (admin)", err)

        try:
            r = post("/auth/login", {"email": ADMIN_EMAIL, "password": PASSWORD})
            pretty("POST /auth/login (admin)", r)
            if r.ok:
                admin = r.json()
                admin_token = admin.get("access_token")
                admin_user_id = admin.get("user_id")
            else:
                print("Admin login failed. Skipping admin endpoints.")
        except requests.RequestException as err:
            pretty_error("POST /auth/login (admin)", err)
            print("Skipping admin endpoints.")

    if admin_token:
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

    print("\nDone.")


if __name__ == "__main__":
    main()
