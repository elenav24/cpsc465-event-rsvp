"""Tests for poll creation, voting, and access control."""
from tests.conftest import TEST_USER_SUB, OTHER_USER_SUB


def _setup(client, set_user):
    set_user(TEST_USER_SUB)
    event = client.post("/events", data={"title": "Poll Test"}).json()
    set_user(OTHER_USER_SUB)
    client.post(f"/events/join/{event['invite_token']}")
    return event["uuid"]


def _create_poll(client, event_uuid, multi=False, anonymous=False):
    return client.post(f"/events/{event_uuid}/polls", json={
        "question": "What time works?",
        "options": [
            {"text": "6pm", "display_order": 0},
            {"text": "7pm", "display_order": 1},
            {"text": "8pm", "display_order": 2},
        ],
        "allow_multi_select": multi,
        "is_anonymous": anonymous,
    })


def test_create_poll(client, set_user):
    event_uuid = _setup(client, set_user)
    set_user(TEST_USER_SUB)
    res = _create_poll(client, event_uuid)
    assert res.status_code == 201
    assert len(res.json()["options"]) == 3


def test_attendee_cannot_create_poll(client, set_user):
    event_uuid = _setup(client, set_user)
    # other user (OTHER_USER_SUB) is still active after _setup
    res = _create_poll(client, event_uuid)
    assert res.status_code == 403


def test_single_select_vote(client, set_user):
    event_uuid = _setup(client, set_user)
    set_user(TEST_USER_SUB)
    poll = _create_poll(client, event_uuid).json()
    option_id = poll["options"][0]["id"]

    set_user(OTHER_USER_SUB)
    res = client.post(f"/events/{event_uuid}/polls/{poll['id']}/vote",
                      json={"option_ids": [option_id]})
    assert res.status_code == 200
    option = next(o for o in res.json()["options"] if o["id"] == option_id)
    assert option["vote_count"] == 1


def test_single_select_rejects_multiple(client, set_user):
    event_uuid = _setup(client, set_user)
    set_user(TEST_USER_SUB)
    poll = _create_poll(client, event_uuid, multi=False).json()
    ids = [o["id"] for o in poll["options"][:2]]
    set_user(OTHER_USER_SUB)
    res = client.post(f"/events/{event_uuid}/polls/{poll['id']}/vote",
                      json={"option_ids": ids})
    assert res.status_code == 400


def test_multi_select_vote(client, set_user):
    event_uuid = _setup(client, set_user)
    set_user(TEST_USER_SUB)
    poll = _create_poll(client, event_uuid, multi=True).json()
    ids = [o["id"] for o in poll["options"][:2]]
    set_user(OTHER_USER_SUB)
    res = client.post(f"/events/{event_uuid}/polls/{poll['id']}/vote",
                      json={"option_ids": ids})
    assert res.status_code == 200
    total_votes = sum(o["vote_count"] for o in res.json()["options"])
    assert total_votes == 2


def test_anonymous_poll_hides_voters_from_attendee(client, set_user):
    event_uuid = _setup(client, set_user)
    set_user(TEST_USER_SUB)
    poll = _create_poll(client, event_uuid, anonymous=True).json()
    option_id = poll["options"][0]["id"]

    set_user(OTHER_USER_SUB)
    client.post(f"/events/{event_uuid}/polls/{poll['id']}/vote",
                json={"option_ids": [option_id]})

    # Attendee sees votes but voter_id is null
    res = client.get(f"/events/{event_uuid}/polls")
    votes = res.json()[0]["votes"]
    assert all(v["voter_id"] is None for v in votes)


def test_host_sees_voters_on_anonymous_poll(client, set_user):
    event_uuid = _setup(client, set_user)
    set_user(TEST_USER_SUB)
    poll = _create_poll(client, event_uuid, anonymous=True).json()
    option_id = poll["options"][0]["id"]

    set_user(OTHER_USER_SUB)
    client.post(f"/events/{event_uuid}/polls/{poll['id']}/vote",
                json={"option_ids": [option_id]})

    set_user(TEST_USER_SUB)
    res = client.get(f"/events/{event_uuid}/polls")
    votes = res.json()[0]["votes"]
    assert any(v["voter_id"] is not None for v in votes)


def test_close_poll(client, set_user):
    event_uuid = _setup(client, set_user)
    set_user(TEST_USER_SUB)
    poll = _create_poll(client, event_uuid).json()
    client.post(f"/events/{event_uuid}/polls/{poll['id']}/close")

    option_id = poll["options"][0]["id"]
    set_user(OTHER_USER_SUB)
    res = client.post(f"/events/{event_uuid}/polls/{poll['id']}/vote",
                      json={"option_ids": [option_id]})
    assert res.status_code == 400
