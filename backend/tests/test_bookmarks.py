def bookmark_payload(**overrides):
    payload = {
        "title": "Kubernetes Docs",
        "url": "https://kubernetes.io/docs/",
        "description": "Official documentation",
        "category": "DevOps",
        "tags": ["Kubernetes", "learning"],
        "is_favorite": False,
    }
    payload.update(overrides)
    return payload


def test_health_and_readiness(client):
    assert client.get("/health").status_code == 200
    assert client.get("/ready").json() == {"status": "ready"}


def test_create_and_get_bookmark(client):
    created = client.post("/api/bookmarks", json=bookmark_payload())
    assert created.status_code == 201
    data = created.json()
    assert data["title"] == "Kubernetes Docs"
    assert data["tags"] == ["kubernetes", "learning"]

    fetched = client.get(f"/api/bookmarks/{data['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["url"] == "https://kubernetes.io/docs/"


def test_search_filter_sort_and_pagination(client):
    client.post("/api/bookmarks", json=bookmark_payload())
    client.post(
        "/api/bookmarks",
        json=bookmark_payload(
            title="AWS Documentation",
            url="https://docs.aws.amazon.com/",
            category="Cloud",
            tags=["aws"],
            is_favorite=True,
        ),
    )

    result = client.get("/api/bookmarks", params={"search": "AWS", "favorite": True}).json()
    assert result["total"] == 1
    assert result["items"][0]["title"] == "AWS Documentation"

    tagged = client.get("/api/bookmarks", params={"tag": "kubernetes"}).json()
    assert tagged["total"] == 1


def test_update_delete_and_stats(client):
    bookmark_id = client.post("/api/bookmarks", json=bookmark_payload()).json()["id"]

    updated = client.patch(
        f"/api/bookmarks/{bookmark_id}", json={"title": "Updated", "is_favorite": True}
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated"
    assert updated.json()["is_favorite"] is True

    stats = client.get("/api/bookmarks/stats").json()
    assert stats == {"total": 1, "favorites": 1, "categories": 1, "tags": 2}

    assert client.delete(f"/api/bookmarks/{bookmark_id}").status_code == 204
    assert client.get(f"/api/bookmarks/{bookmark_id}").status_code == 404


def test_rejects_invalid_url(client):
    response = client.post("/api/bookmarks", json=bookmark_payload(url="not-a-url"))
    assert response.status_code == 422
