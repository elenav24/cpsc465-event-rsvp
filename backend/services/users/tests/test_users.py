"""Tests for user profile endpoints."""


def test_get_me(client):
    res = client.get("/users/me")
    assert res.status_code == 200
    data = res.json()
    assert data["cognito_sub"] == "test-sub"
    assert data["email"] == "test@example.com"
    assert data["sms_opted_in"] is False


def test_update_display_name(client):
    res = client.put("/users/me", json={"display_name": "Mark Garcia"})
    assert res.status_code == 200
    assert res.json()["display_name"] == "Mark Garcia"


def test_update_phone_and_sms_optin(client):
    res = client.put(
        "/users/me",
        json={
            "phone_number": "+15551234567",
            "sms_opted_in": True,
        },
    )
    assert res.status_code == 200
    assert res.json()["phone_number"] == "+15551234567"
    assert res.json()["sms_opted_in"] is True


def test_partial_update(client):
    client.put("/users/me", json={"display_name": "Elena"})
    # Only update phone — display_name should be preserved
    res = client.put("/users/me", json={"phone_number": "+15559876543"})
    assert res.json()["display_name"] == "Elena"
    assert res.json()["phone_number"] == "+15559876543"


def test_get_user_by_id(client):
    me = client.get("/users/me").json()
    res = client.get(f"/users/{me['id']}")
    assert res.status_code == 200
    assert res.json()["id"] == me["id"]


def test_get_nonexistent_user(client):
    res = client.get("/users/99999")
    assert res.status_code == 404
