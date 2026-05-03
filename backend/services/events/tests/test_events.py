"""Tests for event CRUD and invite link endpoints."""
import pytest


def _create_event(client, title="Test Event"):
    return client.post("/events/events", data={
        "title": title,
        "description": "A test event",
        "location": "123 Main St",
        "viewable_by_link": "false",
    })


def test_create_event(client):
    res = _create_event(client)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Test Event"
    assert data["invite_token"] is not None
    assert data["invite_active"] is True


def test_get_my_events(client):
    _create_event(client, "Event A")
    _create_event(client, "Event B")
    res = client.get("/events/events")
    assert res.status_code == 200
    titles = [e["title"] for e in res.json()]
    assert "Event A" in titles
    assert "Event B" in titles


def test_update_event(client):
    event_id = _create_event(client).json()["id"]
    res = client.put(f"/events/events/{event_id}", json={"title": "Updated Title"})
    assert res.status_code == 200
    assert res.json()["title"] == "Updated Title"


def test_delete_event(client):
    event_id = _create_event(client).json()["id"]
    res = client.delete(f"/events/events/{event_id}")
    assert res.status_code == 204


def test_non_member_cannot_update(client, other_client):
    event_id = _create_event(client).json()["id"]
    res = other_client.put(f"/events/events/{event_id}", json={"title": "Hacked"})
    assert res.status_code == 403


def test_join_via_invite(client, other_client):
    event = _create_event(client).json()
    token = event["invite_token"]
    res = other_client.post(f"/events/events/join/{token}")
    assert res.status_code == 201
    assert res.json()["role"] == "attendee"


def test_revoked_invite_cannot_be_used(client, other_client):
    event = _create_event(client).json()
    token = event["invite_token"]
    client.post(f"/events/events/{event['id']}/invite/revoke")
    res = other_client.post(f"/events/events/join/{token}")
    assert res.status_code == 404


def test_regenerate_invite(client):
    event = _create_event(client).json()
    old_token = event["invite_token"]
    res = client.post(f"/events/events/{event['id']}/invite/regenerate")
    assert res.status_code == 200
    assert res.json()["invite_token"] != old_token
