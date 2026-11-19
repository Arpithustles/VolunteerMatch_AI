import httpx, json

BASE = "http://127.0.0.1:8000"

def show(label, r):
    print(f"\n=== {label} [{r.status_code}] ===")
    try:
        print(json.dumps(r.json(), indent=2)[:1000])
    except Exception:
        print(r.text[:600])
    return r

def login(email, password):
    r = httpx.post(f"{BASE}/auth/login", json={"email": email, "password": password}, timeout=20)
    if r.status_code != 200:
        print("LOGIN FAILED", email, r.text); raise SystemExit(1)
    return r.json()["access_token"]

def h(t): return {"Authorization": f"Bearer {t}"}

vol = login("volunteer@volunteermatch.ai", "Volunteer@123")
ngo4 = login("ngo4@volunteermatch.ai", "Ngo@123")

apps = show("ngo4 applicants", httpx.get(f"{BASE}/applications/ngo", headers=h(ngo4), timeout=20)).json()
pending = [a for a in apps if a["status"] == "pending"]
print("PENDING COUNT:", len(pending))
if pending:
    app = pending[0]
    print("APPROVING:", app["id"], app["volunteer_name"], app["opportunity_title"])
    show("approve", httpx.patch(f"{BASE}/applications/{app['id']}", headers=h(ngo4), json={"status": "approved"}, timeout=20))
    show("volunteer schedules", httpx.get(f"{BASE}/schedules/me", headers=h(vol), timeout=20))
    # create task
    tr = show("create task", httpx.post(f"{BASE}/tasks", headers=h(ngo4), json={"opportunity_id": app["opportunity_id"], "assigned_to_id": app["volunteer_id"], "title": "Test task: prepare session notes", "description": "Prepare and upload session notes before the activity.", "deadline": None}, timeout=20))
    if tr.status_code == 200:
        tid = tr.json()["id"]
        show("volunteer tasks", httpx.get(f"{BASE}/tasks/mine", headers=h(vol), timeout=20))
        show("volunteer marks in progress", httpx.patch(f"{BASE}/tasks/{tid}", headers=h(vol), json={"status": "in_progress"}, timeout=20))
        show("volunteer marks completed", httpx.patch(f"{BASE}/tasks/{tid}", headers=h(vol), json={"status": "completed"}, timeout=20))
    show("record participation", httpx.post(f"{BASE}/participation", headers=h(ngo4), json={"application_id": app["id"], "hours": 3.0, "notes": "Verified by NGO in smoke test", "verified": True}, timeout=20))
    show("volunteer participation", httpx.get(f"{BASE}/participation/me", headers=h(vol), timeout=20))
    show("volunteer analytics", httpx.get(f"{BASE}/analytics/volunteer", headers=h(vol), timeout=20))
    show("ngo4 analytics", httpx.get(f"{BASE}/analytics/ngo", headers=h(ngo4), timeout=20))
    show("volunteer schedule conflict check", httpx.get(f"{BASE}/schedules/me", headers=h(vol), timeout=20))
    show("volunteer feedback", httpx.post(f"{BASE}/feedback", headers=h(vol), json={"application_id": app["id"], "rating": 5, "comment": "Great experience in smoke test"}, timeout=20))
print("\nCONTINUATION DONE")
