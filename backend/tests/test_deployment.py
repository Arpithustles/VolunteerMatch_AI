from app.db.session import normalize_database_url


def test_render_postgres_urls_use_psycopg_driver():
    assert normalize_database_url("postgres://user:pass@host/db") == "postgresql+psycopg://user:pass@host/db"
    assert normalize_database_url("postgresql://user:pass@host/db") == "postgresql+psycopg://user:pass@host/db"
    assert normalize_database_url("sqlite:///./dev.db") == "sqlite:///./dev.db"


def test_root_and_spa_routes_serve_frontend_without_catching_api_404s(client):
    root = client.get("/")
    assert root.status_code == 200
    assert "text/html" in root.headers["content-type"]
    assert '<div id="root"></div>' in root.text

    refreshed_route = client.get("/volunteer/recommendations")
    assert refreshed_route.status_code == 200
    assert '<div id="root"></div>' in refreshed_route.text

    missing_api = client.get("/auth/not-a-real-endpoint")
    assert missing_api.status_code == 404
    assert missing_api.headers["content-type"].startswith("application/json")
    assert missing_api.json() == {"detail": "Not Found"}

    missing_api_prefix = client.get("/api/not-a-real-endpoint")
    assert missing_api_prefix.status_code == 404
    assert missing_api_prefix.headers["content-type"].startswith("application/json")

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "running"
