import httpx, json, sys

BASE = "http://127.0.0.1:8000"

def show(label, r):
    print(f"\n=== {label} [{r.status_code}] ===")
    try:
        data = r.json()
        print(json.dumps(data, indent=2)[:1200])
    except Exception:
        print(r.text[:800])
    return r

def login(email, password):
    r = httpx.post(f"{BASE}/auth/login", json={"email": email, "password": password}, timeout=20)
    show(f"login {email}", r)
    if r.status_code != 200:
        sys.exit(1)
    return r.json()["access_token"]

def h(t):
    return {"Authorization": f"Bearer {t}"}

vol = login("volunteer@volunteermatch.ai", "Volunteer@123")
ngo = login("ngo1@volunteermatch.ai", "Ngo@123")
admin = login("admin@volunteermatch.ai", "Admin@123")

r = httpx.get(f"{BASE}/matching/recommendations", headers=h(vol), timeout=20)
show("volunteer recommendations", r)
recs = r.json().get("items", []) if r.status_code == 200 else []
print("RECOMMENDATION COUNT:", len(recs))
if recs:
    top = recs[0]
    print("TOP:", top["opportunity_title"], top["match_percentage"], top["match_category"])
    assert 0 <= top["match_percentage"] <= 100
    assert top["explanation"]

# pick an opportunity from recs that isn't already applied
apps = show("my applications", httpx.get(f"{BASE}/applications/me", headers=h(vol), timeout=20)).json()
applied_ids = {a["opportunity_id"] for a in apps}
target = None
for rec in recs:
    if rec["opportunity_id"] not in applied_ids:
        target = rec
        break
print("TARGET:", target and (target["opportunity_id"], target["opportunity_title"], target["match_percentage"]))

if target:
    r = show("apply", httpx.post(f"{BASE}/applications", headers=h(vol), json={"opportunity_id": target["opportunity_id"], "message": "Test application from smoke test"}, timeout=20))
    app_id = r.json().get("id") if r.status_code == 200 else None
    print("APP ID:", app_id)
    if app_id:
        ngo_apps = show("ngo applicants", httpx.get(f"{BASE}/applications/ngo", headers=h(ngo), timeout=20)).json()
        # find test app
        test_app = next((a for a in ngo_apps if a["id"] == app_id), None)
        print("NGO SEES TEST APP:", test_app and test_app["status"], test_app and test_app["volunteer_name"])
        if test_app:
            show("approve app", httpx.patch(f"{BASE}/applications/{app_id}", headers=h(ngo), json={"status": "approved"}, timeout=20))
            show("volunteer schedule", httpx.get(f"{BASE}/schedules/me", headers=h(vol), timeout=20))
            # create task
            tr = show("create task", httpx.post(f"{BASE}/tasks", headers=h(ngo), json={"opportunity_id": target["opportunity_id"], "assigned_to_id": test_app["volunteer_id"], "title": "Smoke test task", "description": "Complete this test task", "deadline": None}, timeout=20))
            task_id = tr.json().get("id") if tr.status_code == 200 else None
            print("TASK ID:", task_id)
            if task_id:
                show("volunteer tasks", httpx.get(f"{BASE}/tasks/mine", headers=h(vol), timeout=20))
                show("volunteer completes task", httpx.patch(f"{BASE}/tasks/{task_id}", headers=h(vol), json={"status": "completed"}, timeout=20))
            # record participation
            show("record participation", httpx.post(f"{BASE}/participation", headers=h(ngo), json={"application_id": app_id, "hours": 4.5, "notes": "Smoke test verified hours", "verified": True}, timeout=20))
            show("volunteer history", httpx.get(f"{BASE}/participation/me", headers=h(vol), timeout=20))
            show("volunteer analytics", httpx.get(f"{BASE}/analytics/volunteer", headers=h(vol), timeout=20))
            show("ngo analytics", httpx.get(f"{BASE}/analytics/ngo", headers=h(ngo), timeout=20))
            show("admin analytics", httpx.get(f"{BASE}/analytics/admin", headers=h(admin), timeout=20))

show("assistant chat", httpx.post(f"{BASE}/assistant/chat", headers=h(vol), json={"message": "Find weekend volunteering opportunities"}, timeout=30))
show("duplicate apply protection", httpx.post(f"{BASE}/applications", headers=h(vol), json={"opportunity_id": target["opportunity_id"] if target else 1}, timeout=20))

print("\nSMOKE TEST DONE")
