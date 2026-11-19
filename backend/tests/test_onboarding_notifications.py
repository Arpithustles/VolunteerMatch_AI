def test_incomplete_profile_cannot_apply_and_notifications_are_persisted(client):
    registration = client.post("/auth/register", json={
        "email": "onboarding-test@example.com",
        "full_name": "Onboarding Test",
        "password": "Volunteer@123",
        "role": "volunteer",
    })
    assert registration.status_code == 200
    headers = {"Authorization": f"Bearer {registration.json()['access_token']}"}

    profile = client.get("/profiles/volunteer/me", headers=headers).json()
    assert profile["completion_percentage"] == 0
    assert "Skills" in profile["missing_sections"]

    recommendations = client.get("/matching/recommendations", headers=headers)
    assert recommendations.status_code == 200
    opportunity_id = recommendations.json()["items"][0]["opportunity_id"]
    blocked = client.post("/applications", headers=headers, json={"opportunity_id": opportunity_id})
    assert blocked.status_code == 400

    updated = client.put("/profiles/volunteer/me", headers=headers, json={
        "phone": "9876543210",
        "location": "Ghaziabad, UP",
        "profession": "Teacher",
        "skills": "Mathematics,Teaching,Communication",
        "preferred_categories": "Education and Teaching",
        "availability_days": "Saturday,Sunday",
        "available_time_slots": "Morning",
        "remote_preference": "on-site",
        "description": "I enjoy teaching students.",
    })
    assert updated.status_code == 200
    assert updated.json()["completion_percentage"] == 100

    assert client.get("/matching/recommendations", headers=headers).status_code == 200
    applied = client.post("/applications", headers=headers, json={"opportunity_id": opportunity_id})
    assert applied.status_code == 200

    notices = client.get("/notifications", headers=headers).json()
    assert notices["unread_count"] > 0
    assert any(item["title"] == "Application submitted" for item in notices["items"])

    notice = next(item for item in notices["items"] if not item["is_read"])
    assert client.patch(f"/notifications/{notice['id']}/read", headers=headers).status_code == 200
    assert client.delete(f"/notifications/{notice['id']}", headers=headers).status_code == 200


def test_consent_requires_all_mandatory_declarations(client):
    registration = client.post("/auth/register", json={
        "email": "consent-test@example.com",
        "full_name": "Consent Test",
        "password": "Volunteer@123",
        "role": "volunteer",
    })
    headers = {"Authorization": f"Bearer {registration.json()['access_token']}"}
    payload = {
        "registration_accurate": True,
        "processing_consent": True,
        "terms_accepted": True,
        "privacy_accepted": False,
        "safety_guidelines_accepted": True,
        "organizer_sharing_consent": True,
        "additional_verification_consent": False,
    }
    assert client.post("/profiles/volunteer/consent", headers=headers, json=payload).status_code == 400
    payload["privacy_accepted"] = True
    response = client.post("/profiles/volunteer/consent", headers=headers, json=payload)
    assert response.status_code == 200
    assert response.json()["policy_version"] == "2026-01"
    saved = client.get("/profiles/volunteer/consent", headers=headers)
    assert saved.status_code == 200
    assert saved.json()["organizer_sharing_consent"] is True
