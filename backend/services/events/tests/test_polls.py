"""Tests for poll creation, voting, and access control."""


def _setup(client, other_client):
    event = client.post("/events/events", data={"title": "Poll Test"}).json()
    token = event["invite_token"]
    other_client.post(f"/events/events/join/{token}")
    return event["id"]


def _create_poll(client, event_id, multi=False, anonymous=False):
    return client.post(f"/events/events/{event_id}/polls", json={
        "question": "What time works?",
        "options": [
            {"text": "6pm", "display_order": 0},
            {"text": "7pm", "display_order": 1},
            {"text": "8pm", "display_order": 2},
        ],
        "allow_multi_select": multi,
        "is_anonymous": anonymous,
    })


def test_create_poll(client, other_client):
    event_id = _setup(client, other_client)
    res = _create_poll(client, event_id)
    assert res.status_code == 201
    assert len(res.json()["options"]) == 3


def test_attendee_cannot_create_poll(client, other_client):
    event_id = _setup(client, other_client)
    res = _create_poll(other_client, event_id)
    assert res.status_code == 403


def test_single_select_vote(client, other_client):
    event_id = _setup(client, other_client)
    poll = _create_poll(client, event_id).json()
    option_id = poll["options"][0]["id"]

    res = other_client.post(f"/events/events/{event_id}/polls/{poll['id']}/vote",
                            json={"option_ids": [option_id]})
    assert res.status_code == 200
    option = next(o for o in res.json()["options"] if o["id"] == option_id)
    assert option["vote_count"] == 1


def test_single_select_rejects_multiple(client, other_client):
    event_id = _setup(client, other_client)
    poll = _create_poll(client, event_id, multi=False).json()
    ids = [o["id"] for o in poll["options"][:2]]
    res = other_client.post(f"/events/events/{event_id}/polls/{poll['id']}/vote",
                            json={"option_ids": ids})
    assert res.status_code == 400


def test_multi_select_vote(client, other_client):
    event_id = _setup(client, other_client)
    poll = _create_poll(client, event_id, multi=True).json()
    ids = [o["id"] for o in poll["options"][:2]]
    res = other_client.post(f"/events/events/{event_id}/polls/{poll['id']}/vote",
                            json={"option_ids": ids})
    assert res.status_code == 200
    total_votes = sum(o["vote_count"] for o in res.json()["options"])
    assert total_votes == 2


def test_anonymous_poll_hides_voters_from_attendee(client, other_client):
    event_id = _setup(client, other_client)
    poll = _create_poll(client, event_id, anonymous=True).json()
    option_id = poll["options"][0]["id"]
    other_client.post(f"/events/events/{event_id}/polls/{poll['id']}/vote",
                      json={"option_ids": [option_id]})

    # Attendee sees votes but voter_id is null
    res = other_client.get(f"/events/events/{event_id}/polls")
    votes = res.json()[0]["votes"]
    assert all(v["voter_id"] is None for v in votes)


def test_host_sees_voters_on_anonymous_poll(client, other_client):
    event_id = _setup(client, other_client)
    poll = _create_poll(client, event_id, anonymous=True).json()
    option_id = poll["options"][0]["id"]
    other_client.post(f"/events/events/{event_id}/polls/{poll['id']}/vote",
                      json={"option_ids": [option_id]})

    res = client.get(f"/events/events/{event_id}/polls")
    votes = res.json()[0]["votes"]
    assert any(v["voter_id"] is not None for v in votes)


def test_close_poll(client, other_client):
    event_id = _setup(client, other_client)
    poll = _create_poll(client, event_id).json()
    client.post(f"/events/events/{event_id}/polls/{poll['id']}/close")

    option_id = poll["options"][0]["id"]
    res = other_client.post(f"/events/events/{event_id}/polls/{poll['id']}/vote",
                            json={"option_ids": [option_id]})
    assert res.status_code == 400
