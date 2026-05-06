"""Tests for event CRUD and invite link endpoints."""

from tests.conftest import TEST_USER_SUB, OTHER_USER_SUB


def _create_event(client, title="Test Event"):
    return client.post("/events", data={"title": title})


def test_create_event(client):
    res = _create_event(client)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Test Event"
    assert data["uuid"] is not None
    assert data["invite_token"] is not None
    assert data["invite_active"] is True


def test_get_my_events(client):
    _create_event(client, "Event A")
    _create_event(client, "Event B")
    res = client.get("/events")
    assert res.status_code == 200
    titles = [e["title"] for e in res.json()]
    assert "Event A" in titles
    assert "Event B" in titles


def test_update_event(client):
    event_uuid = _create_event(client).json()["uuid"]
    res = client.put(f"/events/{event_uuid}", json={"title": "Updated Title"})
    assert res.status_code == 200
    assert res.json()["title"] == "Updated Title"


def test_delete_event(client):
    event_uuid = _create_event(client).json()["uuid"]
    res = client.delete(f"/events/{event_uuid}")
    assert res.status_code == 204


def test_non_member_cannot_update(client, set_user):
    event_uuid = _create_event(client).json()["uuid"]
    set_user(OTHER_USER_SUB)
    res = client.put(f"/events/{event_uuid}", json={"title": "Hacked"})
    assert res.status_code == 403


def test_join_via_invite(client, set_user):
    event = _create_event(client).json()
    token = event["invite_token"]
    set_user(OTHER_USER_SUB)
    res = client.post(f"/events/join/{token}")
    assert res.status_code == 201
    assert res.json()["role"] == "attendee"
    assert res.json()["event_uuid"] == event["uuid"]


def test_revoked_invite_cannot_be_used(client, set_user):
    event = _create_event(client).json()
    token = event["invite_token"]
    client.post(f"/events/{event['uuid']}/invite/revoke")
    set_user(OTHER_USER_SUB)
    res = client.post(f"/events/join/{token}")
    assert res.status_code == 404


def test_regenerate_invite(client):
    event = _create_event(client).json()
    old_token = event["invite_token"]
    res = client.post(f"/events/{event['uuid']}/invite/regenerate")
    assert res.status_code == 200
    assert res.json()["invite_token"] != old_token
