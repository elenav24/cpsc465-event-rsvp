"""Tests for task creation, assignment, and completion."""
from tests.conftest import OTHER_USER_SUB


def _setup(client, other_client):
    event = client.post("/events/events", data={"title": "Task Test"}).json()
    other_client.post(f"/events/events/join/{event['invite_token']}")
    return event["id"]


def test_host_creates_task(client, other_client):
    event_id = _setup(client, other_client)
    res = client.post(f"/events/events/{event_id}/tasks", json={"title": "Book venue"})
    assert res.status_code == 201
    assert res.json()["title"] == "Book venue"
    assert res.json()["is_completed"] is False


def test_attendee_cannot_create_task(client, other_client):
    event_id = _setup(client, other_client)
    res = other_client.post(f"/events/events/{event_id}/tasks", json={"title": "Sneaky task"})
    assert res.status_code == 403


def test_attendee_can_volunteer(client, other_client):
    event_id = _setup(client, other_client)
    task = client.post(f"/events/events/{event_id}/tasks", json={"title": "Bring ice"}).json()
    res = other_client.put(f"/events/events/{event_id}/tasks/{task['id']}",
                           json={"assigned_to": OTHER_USER_SUB})
    assert res.status_code == 200
    assert res.json()["assigned_to"] == OTHER_USER_SUB


def test_assigned_member_can_complete(client, other_client):
    event_id = _setup(client, other_client)
    task = client.post(f"/events/events/{event_id}/tasks", json={
        "title": "Get cups",
        "assigned_to": OTHER_USER_SUB,
    }).json()
    res = other_client.put(f"/events/events/{event_id}/tasks/{task['id']}",
                           json={"is_completed": True})
    assert res.status_code == 200
    assert res.json()["is_completed"] is True


def test_unassigned_member_cannot_complete(client, other_client):
    event_id = _setup(client, other_client)
    task = client.post(f"/events/events/{event_id}/tasks", json={"title": "Unassigned"}).json()
    res = other_client.put(f"/events/events/{event_id}/tasks/{task['id']}",
                           json={"is_completed": True})
    assert res.status_code == 403
