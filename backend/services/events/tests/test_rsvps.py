"""Tests for RSVP endpoints and potluck claim auto-release."""

from tests.conftest import TEST_USER_SUB, OTHER_USER_SUB


def _setup(client, set_user):
    """Host creates event, other user joins."""
    set_user(TEST_USER_SUB)
    event = client.post("/events", data={"title": "RSVP Test"}).json()
    token = event["invite_token"]
    set_user(OTHER_USER_SUB)
    client.post(f"/events/join/{token}")
    return event["uuid"]


def test_rsvp_yes(client):
    event_uuid = client.post("/events", data={"title": "E"}).json()["uuid"]
    res = client.put(
        f"/events/{event_uuid}/rsvps", json={"status": "yes", "guest_count": 2}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "yes"
    assert res.json()["guest_count"] == 2


def test_rsvp_update(client):
    event_uuid = client.post("/events", data={"title": "E"}).json()["uuid"]
    client.put(f"/events/{event_uuid}/rsvps", json={"status": "yes"})
    res = client.put(f"/events/{event_uuid}/rsvps", json={"status": "maybe"})
    assert res.json()["status"] == "maybe"


def test_invalid_rsvp_status(client):
    event_uuid = client.post("/events", data={"title": "E"}).json()["uuid"]
    res = client.put(f"/events/{event_uuid}/rsvps", json={"status": "definitely"})
    assert res.status_code == 422


def test_rsvp_no_releases_potluck_claim(client, set_user):
    event_uuid = _setup(client, set_user)

    # Host creates a potluck item
    set_user(TEST_USER_SUB)
    item = client.post(
        f"/events/{event_uuid}/potluck", json={"name": "Chips", "quantity_needed": 2}
    ).json()

    # Other user RSVPs yes and claims the item
    set_user(OTHER_USER_SUB)
    client.put(f"/events/{event_uuid}/rsvps", json={"status": "yes"})
    client.post(f"/events/{event_uuid}/potluck/{item['id']}/claim")

    # Verify claim exists
    items = client.get(f"/events/{event_uuid}/potluck").json()
    assert items[0]["claims_count"] == 1

    # Other user changes RSVP to no — claim should be released
    client.put(f"/events/{event_uuid}/rsvps", json={"status": "no"})
    items = client.get(f"/events/{event_uuid}/potluck").json()
    assert items[0]["claims_count"] == 0


def test_non_member_cannot_rsvp(client, set_user):
    set_user(TEST_USER_SUB)
    event_uuid = client.post("/events", data={"title": "E"}).json()["uuid"]
    set_user(OTHER_USER_SUB)
    res = client.put(f"/events/{event_uuid}/rsvps", json={"status": "yes"})
    assert res.status_code == 403
