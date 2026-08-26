from fastapi.testclient import TestClient

from app.main import app


def test_protected_endpoint_requires_bearer_token() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/users/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "authentication_error"
