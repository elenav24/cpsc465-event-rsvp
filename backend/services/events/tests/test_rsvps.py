"""Tests for RSVP endpoints and potluck claim auto-release."""
import pytest
from tests.conftest import TEST_USER_SUB, OTHER_USER_SUB


def _create_event_and_join(client, other_client):
    event = client.post("/events/events", data={"title": "RSVP Test"}).json()
    token = event["invite_token"]
    other_client.post(f"/events/events/join/{token}")
    return event["id"]


def test_rsvp_yes(client):
    event_id = client.post("/events/events", data={"title": "E"}).json()["id"]
    res = client.put(f"/events/events/{event_id}/rsvps", json={"status": "yes", "guest_count": 2})
    assert res.status_code == 200
    assert res.json()["status"] == "yes"
    assert res.json()["guest_count"] == 2


def test_rsvp_update(client):
    event_id = client.post("/events/events", data={"title": "E"}).json()["id"]
    client.put(f"/events/events/{event_id}/rsvps", json={"status": "yes"})
    res = client.put(f"/events/events/{event_id}/rsvps", json={"status": "maybe"})
    assert res.json()["status"] == "maybe"


def test_invalid_rsvp_status(client):
    event_id = client.post("/events/events", data={"title": "E"}).json()["id"]
    res = client.put(f"/events/events/{event_id}/rsvps", json={"status": "definitely"})
    assert res.status_code == 422


def test_rsvp_no_releases_potluck_claim(client, other_client):
    event_id = _create_event_and_join(client, other_client)

    # Host creates a potluck item
    item = client.post(f"/events/events/{event_id}/potluck", json={
        "name": "Chips", "quantity_needed": 2
    }).json()

    # Other user RSVPs yes and claims the item
    other_client.put(f"/events/events/{event_id}/rsvps", json={"status": "yes"})
    other_client.post(f"/events/events/{event_id}/potluck/{item['id']}/claim")

    # Verify claim exists
    items = other_client.get(f"/events/events/{event_id}/potluck").json()
    assert items[0]["claims_count"] == 1

    # Other user changes RSVP to no — claim should be released
    other_client.put(f"/events/events/{event_id}/rsvps", json={"status": "no"})
    items = other_client.get(f"/events/events/{event_id}/potluck").json()
    assert items[0]["claims_count"] == 0


def test_non_member_cannot_rsvp(other_client):
    # other_client is not a member of any event here
    res = other_client.put("/events/events/99999/rsvps", json={"status": "yes"})
    assert res.status_code == 403
