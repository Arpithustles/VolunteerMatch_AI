from datetime import date, timedelta
from types import SimpleNamespace
from app.services.matching_engine import compute_match, WEIGHTS, is_opportunity_recommendable


def make_profile(**overrides):
    base = dict(
        skills="Python,Teaching,Communication",
        interests="Education,Technology,Community Development",
        preferred_categories="Education,Technology",
        availability_days="Saturday,Sunday",
        available_time_slots="Morning,Afternoon",
        location="Ghaziabad, UP",
        remote_preference="any",
        experience="Intermediate experience mentoring students",
    )
    base.update(overrides)
    return SimpleNamespace(**base)


def make_opp(**overrides):
    base = dict(
        id=1,
        title="Weekend Teaching Volunteer",
        description="Teach students",
        category="Education",
        required_skills="Teaching,Communication",
        preferred_skills="Python",
        experience_required="Beginner",
        location="Ghaziabad, UP",
        mode="on-site",
        available_days="Saturday,Sunday",
        working_hours="10:00-13:00",
        volunteers_required=5,
        status=SimpleNamespace(value="open"),
        start_date=date.today() + timedelta(days=7),
        end_date=date.today() + timedelta(days=20),
        application_deadline=date.today() + timedelta(days=5),
        organization=SimpleNamespace(name="Udaan Welfare Foundation"),
    )
    base.update(overrides)
    return SimpleNamespace(**base)


def test_weights_sum_to_100():
    assert round(sum(WEIGHTS.values()), 2) == 100.0
    assert WEIGHTS == {
        "skills": 30.0, "interests": 20.0, "availability": 15.0,
        "location": 10.0, "experience": 10.0, "profession": 10.0,
        "preferences": 5.0,
    }


def test_teacher_in_ghaziabad_is_a_strong_weekend_math_match():
    profile = make_profile(
        skills="Mathematics,Teaching,Communication,Public Speaking",
        interests="Education and Teaching",
        preferred_categories="Education and Teaching",
        availability_days="Saturday,Sunday",
        location="Ghaziabad",
        profession="Teacher",
        education="Mathematics",
    )
    opportunity = make_opp(
        title="Mathematics Teaching Volunteer",
        description="Teach school students mathematics on weekends.",
        category="Education and Teaching",
        required_skills="Mathematics,Teaching,Communication",
        available_days="Saturday,Sunday",
        location="Ghaziabad",
        experience_required=None,
    )
    match = compute_match(profile, opportunity)
    assert match["match_percentage"] >= 85
    assert match["matched_skills"] == ["Mathematics", "Teaching", "Communication"]
    assert match["missing_skills"] == []
    assert match["profession_compatibility"] == 100


def test_match_is_deterministic_and_structured():
    p = make_profile(); o = make_opp()
    a = compute_match(p, o)
    b = compute_match(p, o)
    assert a == b
    assert 0 <= a["match_percentage"] <= 100
    assert a["matched_skills"] == ["Teaching", "Communication"]
    assert a["missing_skills"] == []
    assert a["match_category"] in ("Excellent Match", "Strong Match", "Good Match", "Partial Match")
    assert a["explanation"]


def test_missing_skills_are_reported():
    p = make_profile(skills="Python")
    o = make_opp(required_skills="Teaching,Communication")
    r = compute_match(p, o)
    assert "Teaching" in r["missing_skills"]
    assert "Communication" in r["missing_skills"]
    assert r["matched_skills"] == []


def test_remote_location_is_compatible():
    p = make_profile(location="Remote", remote_preference="remote")
    o = make_opp(mode="remote", location="Remote")
    r = compute_match(p, o)
    assert r["location_compatibility"] >= 90


def test_closed_and_expired_are_not_recommendable():
    open_opp = make_opp()
    assert is_opportunity_recommendable(open_opp, 0) is True
    assert is_opportunity_recommendable(make_opp(status=SimpleNamespace(value="closed")), 0) is False
    assert is_opportunity_recommendable(make_opp(application_deadline=date.today() - timedelta(days=1)), 0) is False
    assert is_opportunity_recommendable(make_opp(end_date=date.today() - timedelta(days=1)), 0) is False
    assert is_opportunity_recommendable(make_opp(volunteers_required=2), 2) is False
