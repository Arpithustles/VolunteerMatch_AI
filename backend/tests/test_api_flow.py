from datetime import date, timedelta
from tests.conftest import auth_headers


def test_volunteer_full_workflow(client):
    vol = auth_headers(client, "volunteer@volunteermatch.ai", "Volunteer@123")

    recs = client.get("/matching/recommendations", headers=vol)
    assert recs.status_code == 200
    data = recs.json()
    assert data["total"] > 0
    top = data["items"][0]
    assert 0 <= top["match_percentage"] <= 100
    assert top["match_category"]
    assert top["explanation"]
    assert "opportunity_id" in top

    # find a target owned by Udaan (ngo1) not already applied to
    apps = client.get("/applications/me", headers=vol).json()
    applied = {a["opportunity_id"] for a in apps}
    target = next((r for r in data["items"] if r["opportunity_id"] not in applied and r["organization_name"] == "Udaan Welfare Foundation"), None)
    if target is None:
        # fallback: any unapplied target; use its organization's NGO account mapping
        target = next((r for r in data["items"] if r["opportunity_id"] not in applied), None)
    assert target is not None

    ngo_map = {
        "Udaan Welfare Foundation": ("ngo1@volunteermatch.ai", "Ngo@123"),
        "GreenEarth NCR Initiative": ("ngo2@volunteermatch.ai", "Ngo@123"),
        "Sanjeevani Care Trust": ("ngo3@volunteermatch.ai", "Ngo@123"),
        "HopeBridge Learning": ("ngo4@volunteermatch.ai", "Ngo@123"),
    }
    ngo_email, ngo_pw = ngo_map[target["organization_name"]]
    ngo = auth_headers(client, ngo_email, ngo_pw)

    apply_r = client.post("/applications", headers=vol, json={"opportunity_id": target["opportunity_id"], "message": "Automated test application"})
    assert apply_r.status_code == 200, apply_r.text
    app_id = apply_r.json()["id"]

    # duplicate prevention
    dup = client.post("/applications", headers=vol, json={"opportunity_id": target["opportunity_id"]})
    assert dup.status_code == 400

    applicants = client.get("/applications/ngo", headers=ngo)
    assert applicants.status_code == 200
    mine = next((a for a in applicants.json() if a["id"] == app_id), None)
    assert mine is not None and mine["status"] == "pending"
    assert client.get(f"/profiles/volunteer/{mine['volunteer_id']}", headers=ngo).status_code == 403

    consent = client.post("/profiles/volunteer/consent", headers=vol, json={
        "registration_accurate": True,
        "processing_consent": True,
        "terms_accepted": True,
        "privacy_accepted": True,
        "safety_guidelines_accepted": True,
        "organizer_sharing_consent": True,
        "additional_verification_consent": False,
    })
    assert consent.status_code == 200

    approve = client.patch(f"/applications/{app_id}", headers=ngo, json={"status": "approved"})
    assert approve.status_code == 200, approve.text
    assert approve.json()["status"] == "approved"
    shared_profile = client.get(f"/profiles/volunteer/{mine['volunteer_id']}", headers=ngo)
    assert shared_profile.status_code == 200
    assert shared_profile.json()["email"] is not None
    assert shared_profile.json()["address"] is None

    sched = client.get("/schedules/me", headers=vol)
    assert sched.status_code == 200
    assert any(s["application_id"] == app_id for s in sched.json())

    task = client.post("/tasks", headers=ngo, json={
        "opportunity_id": target["opportunity_id"],
        "assigned_to_id": mine["volunteer_id"],
        "title": "Automated test task",
        "description": "Do the test task",
    })
    assert task.status_code == 200, task.text
    task_id = task.json()["id"]

    upd = client.patch(f"/tasks/{task_id}", headers=vol, json={"status": "completed"})
    assert upd.status_code == 200
    assert upd.json()["status"] == "completed"

    part = client.post("/participation", headers=ngo, json={"application_id": app_id, "hours": 4.0, "notes": "test verified", "verified": True})
    assert part.status_code == 200, part.text
    assert part.json()["verified"] is True

    dup_part = client.post("/participation", headers=ngo, json={"application_id": app_id, "hours": 2.0})
    assert dup_part.status_code == 400

    hist = client.get("/participation/me", headers=vol)
    assert hist.status_code == 200
    assert any(p["application_id"] == app_id for p in hist.json())

    fb = client.post("/feedback", headers=vol, json={"application_id": app_id, "rating": 5, "comment": "Great test"})
    assert fb.status_code == 200
    assert fb.json()["rating"] == 5

    va = client.get("/analytics/volunteer", headers=vol)
    assert va.status_code == 200
    assert va.json()["volunteering_hours"] >= 4.0


def test_authorization_boundaries(client):
    vol = auth_headers(client, "volunteer@volunteermatch.ai", "Volunteer@123")
    ngo = auth_headers(client, "ngo1@volunteermatch.ai", "Ngo@123")
    admin = auth_headers(client, "admin@volunteermatch.ai", "Admin@123")

    assert client.get("/users", headers=vol).status_code == 403
    assert client.get("/users", headers=ngo).status_code == 403
    assert client.get("/users", headers=admin).status_code == 200
    assert client.get("/analytics/admin", headers=vol).status_code == 403

    # volunteer cannot create an opportunity
    r = client.post("/opportunities", headers=vol, json={"title": "Hack", "description": "x", "category": "Education"})
    assert r.status_code == 403

    # NGO cannot access volunteer-only endpoints
    assert client.get("/matching/recommendations", headers=ngo).status_code == 403
    assert client.get("/applications/me", headers=ngo).status_code == 403

    # Admin can list NGOs
    assert client.get("/users/ngos", headers=admin).status_code == 200


def test_invalid_login_and_registration(client):
    bad = client.post("/auth/login", json={"email": "nope@example.com", "password": "wrong"})
    assert bad.status_code == 401

    # duplicate registration
    payload = {"email": "volunteer@volunteermatch.ai", "full_name": "Duplicate", "password": "secret123", "role": "volunteer"}
    assert client.post("/auth/register", json=payload).status_code == 400

    # admin self-registration blocked
    admin_payload = {"email": "newadmin@example.com", "full_name": "Bad Admin", "password": "secret123", "role": "admin"}
    assert client.post("/auth/register", json=admin_payload).status_code == 403


def test_profile_update(client):
    vol = auth_headers(client, "archita@volunteermatch.ai", "Volunteer@123")
    old = client.get("/profiles/volunteer/me", headers=vol)
    assert old.status_code == 200
    r = client.put("/profiles/volunteer/me", headers=vol, json={"skills": "Teaching,Python,Communication", "availability_days": "Saturday,Sunday", "location": "Ghaziabad, UP"})
    assert r.status_code == 200
    assert "Python" in (r.json()["skills"] or "")


def test_opportunity_crud_and_search(client):
    ngo = auth_headers(client, "ngo2@volunteermatch.ai", "Ngo@123")
    payload = {
        "title": "Automated CRUD Test Opportunity",
        "description": "Created by tests",
        "category": "Environment",
        "required_skills": "Event Management",
        "location": "Noida, UP",
        "mode": "on-site",
        "volunteers_required": 2,
        "start_date": (date.today() + timedelta(days=10)).isoformat(),
        "end_date": (date.today() + timedelta(days=11)).isoformat(),
        "application_deadline": (date.today() + timedelta(days=8)).isoformat(),
        "status": "open",
    }
    created = client.post("/opportunities", headers=ngo, json=payload)
    assert created.status_code == 200, created.text
    oid = created.json()["id"]

    listing = client.get("/opportunities?q=Automated CRUD Test")
    assert listing.status_code == 200
    assert any(o["id"] == oid for o in listing.json()["items"])

    updated = client.put(f"/opportunities/{oid}", headers=ngo, json={"title": "Automated CRUD Test Updated"})
    assert updated.status_code == 200
    assert updated.json()["title"].endswith("Updated")

    # another NGO cannot edit
    other = auth_headers(client, "ngo3@volunteermatch.ai", "Ngo@123")
    assert client.put(f"/opportunities/{oid}", headers=other, json={"title": "Hijack"}).status_code == 403

    deleted = client.delete(f"/opportunities/{oid}", headers=ngo)
    assert deleted.status_code == 200
