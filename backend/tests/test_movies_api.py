from sqlalchemy.exc import IntegrityError

from app.movies.models import DimGenre


async def test_get_movie_not_found(client):
    assert (await client.get("/api/v1/movies/nao-existe")).status_code == 404

async def test_catalog_stats_aggregate_all_movies_and_recent_reviews(client, db_session):
    drama = await _create_genre(db_session, "Drama")
    comedy = await _create_genre(db_session, "Comédia")
    first = await client.post(
        "/api/v1/movies",
        json={"titulo": "Filme A", "ano_lancamento": 2020, "generos": [drama.sk_genre_id]},
    )
    second = await client.post(
        "/api/v1/movies",
        json={
            "titulo": "Filme B",
            "ano_lancamento": 2021,
            "generos": [drama.sk_genre_id, comedy.sk_genre_id],
        },
    )
    await client.post(
        f"/api/v1/movies/{first.json()['sk_movie_id']}/reviews",
        json={"nome": "A", "nota": 8, "comentario": "Boa"},
    )
    await client.post(
        f"/api/v1/movies/{second.json()['sk_movie_id']}/reviews",
        json={"nome": "B", "nota": 6, "comentario": "Boa"},
    )

    response = await client.get("/api/v1/movies/stats")

    assert response.status_code == 200
    body = response.json()
    assert body["total_filmes"] == 2
    assert body["total_generos"] == 2
    assert body["filmes_avaliados"] == 2
    assert body["nota_media"] == 7.0
    assert body["generos_populares"] == [
        {"nome_genero": "Drama", "qtd_filmes": 2},
        {"nome_genero": "Comédia", "qtd_filmes": 1},
    ]
    assert [movie["titulo"] for movie in body["ranking_semanal"]] == [
        "Filme A",
        "Filme B",
    ]


async def test_post_review_movie_not_found(client):
    response = await client.post(
        "/api/v1/movies/nao-existe/reviews",
        json={"nome": "Fulano", "nota": 8, "comentario": "Bom"},
    )
    assert response.status_code == 404


async def test_list_reviews_movie_not_found(client):
    assert (await client.get("/api/v1/movies/nao-existe/reviews")).status_code == 404

async def _create_genre(db_session, nome: str = "Drama") -> DimGenre:
    genre = DimGenre(nome_genero=nome)
    db_session.add(genre)
    await db_session.commit()
    await db_session.refresh(genre)
    return genre

async def test_post_movie_success(client, db_session):
    genre = await _create_genre(db_session)
    payload = {
        "titulo": "Filme API",
        "ano_lancamento": 2021,
        "generos": [genre.sk_genre_id],
        "diretor": "Ana Diretora",
    }
    response = await client.post("/api/v1/movies", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert response.headers["location"] == f"/api/v1/movies/{body['sk_movie_id']}"
    assert body["titulo"] == "Filme API"
    assert body["diretores"] == ["Ana Diretora"]
    assert body["generos"] == ["Drama"]


async def test_post_movie_invalid_genre_returns_422(client):
    payload = {"titulo": "X", "ano_lancamento": 2021, "generos": ["nao-existe"]}
    response = await client.post("/api/v1/movies", json=payload)
    assert response.status_code == 422


async def test_post_movie_conflict_returns_409(client, db_session, monkeypatch):
    from app.movies import service

    genre = await _create_genre(db_session)
    payload = {"titulo": "Primeiro", "ano_lancamento": 2020, "generos": [genre.sk_genre_id]}
    first = await client.post("/api/v1/movies", json=payload)
    assert first.status_code == 201
    first_id_filme = first.json()["id_filme"]

    async def fake_unique_id(_db: object) -> str:
        return first_id_filme  # reaproveita um id já usado, pulando a checagem real

    monkeypatch.setattr(service, "_generate_unique_id_filme", fake_unique_id)

    payload2 = {"titulo": "Segundo", "ano_lancamento": 2020, "generos": [genre.sk_genre_id]}
    second = await client.post("/api/v1/movies", json=payload2)
    assert second.status_code == 409


async def test_put_movie_success(client, db_session):
    genre = await _create_genre(db_session)
    created = await client.post(
        "/api/v1/movies",
        json={
            "titulo": "Original",
            "ano_lancamento": 2020,
            "generos": [genre.sk_genre_id],
            "diretor": "Ana",
        },
    )
    sk_movie_id = created.json()["sk_movie_id"]

    response = await client.put(
        f"/api/v1/movies/{sk_movie_id}",
        json={
            "titulo": "Atualizado",
            "ano_lancamento": 2021,
            "generos": [genre.sk_genre_id],
            "diretor": "Bruno",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["titulo"] == "Atualizado"
    assert body["diretores"] == ["Bruno"]


async def test_put_movie_not_found_returns_404(client):
    payload = {"titulo": "X", "ano_lancamento": 2020, "generos": ["qualquer"]}
    response = await client.put("/api/v1/movies/nao-existe", json=payload)
    assert response.status_code == 404


async def test_put_movie_conflict_returns_409(client, db_session, monkeypatch):
    genre = await _create_genre(db_session)
    created = await client.post(
        "/api/v1/movies",
        json={"titulo": "Original", "ano_lancamento": 2020, "generos": [genre.sk_genre_id]},
    )
    sk_movie_id = created.json()["sk_movie_id"]

    async def broken_commit() -> None:
        raise IntegrityError("stmt", {}, Exception("dup"))

    monkeypatch.setattr(db_session, "commit", broken_commit)

    response = await client.put(
        f"/api/v1/movies/{sk_movie_id}",
        json={"titulo": "Novo", "ano_lancamento": 2020, "generos": [genre.sk_genre_id]},
    )
    assert response.status_code == 409


async def test_delete_movie_success(client, db_session):
    genre = await _create_genre(db_session)
    created = await client.post(
        "/api/v1/movies",
        json={"titulo": "Para apagar", "ano_lancamento": 2020, "generos": [genre.sk_genre_id]},
    )
    sk_movie_id = created.json()["sk_movie_id"]

    response = await client.delete(f"/api/v1/movies/{sk_movie_id}")
    assert response.status_code == 204

    follow_up = await client.get(f"/api/v1/movies/{sk_movie_id}")
    assert follow_up.status_code == 404


async def test_delete_movie_not_found_returns_404(client):
    response = await client.delete("/api/v1/movies/nao-existe")
    assert response.status_code == 404



async def test_post_movie_review_success(client, db_session):
    genre = await _create_genre(db_session)
    created = await client.post(
        "/api/v1/movies",
        json={"titulo": "Filme Avaliado", "ano_lancamento": 2020, "generos": [genre.sk_genre_id]},
    )
    sk_movie_id = created.json()["sk_movie_id"]

    response = await client.post(
        f"/api/v1/movies/{sk_movie_id}/reviews",
        json={"nome": "Fulano", "nota": 8, "comentario": "Muito bom"},
    )
    assert response.status_code == 201
    assert response.json()["nota"] == 8

    detail = (await client.get(f"/api/v1/movies/{sk_movie_id}")).json()
    assert detail["nota_media_usuarios"] == 8.0
    assert detail["qtd_avaliacoes_usuarios"] == 1

async def _create_movie_and_review(client, genre_id: str, titulo: str, nota: float = 8):
    created = await client.post(
        "/api/v1/movies",
        json={"titulo": titulo, "ano_lancamento": 2020, "generos": [genre_id]},
    )
    sk_movie_id = created.json()["sk_movie_id"]
    review = await client.post(
        f"/api/v1/movies/{sk_movie_id}/reviews",
        json={"nome": "Fulano", "nota": nota, "comentario": "Bom"},
    )
    return sk_movie_id, review.json()["sk_movie_review_id"]


async def test_put_movie_review_success(client, db_session):
    genre = await _create_genre(db_session)
    sk_movie_id, review_id = await _create_movie_and_review(client, genre.sk_genre_id, "A")

    response = await client.put(
        f"/api/v1/movies/{sk_movie_id}/reviews/{review_id}",
        json={"nome": "Beltrano", "nota": 4, "comentario": "Mudei de ideia"},
    )

    assert response.status_code == 200
    assert response.json()["nome"] == "Beltrano"
    assert response.json()["nota"] == 4
    detail = (await client.get(f"/api/v1/movies/{sk_movie_id}")).json()
    assert detail["nota_media_usuarios"] == 4.0
    assert detail["qtd_avaliacoes_usuarios"] == 1


async def test_put_movie_review_not_found_returns_404(client, db_session):
    genre = await _create_genre(db_session)
    sk_movie_id, _ = await _create_movie_and_review(client, genre.sk_genre_id, "A")

    response = await client.put(
        f"/api/v1/movies/{sk_movie_id}/reviews/nao-existe",
        json={"nome": "X", "nota": 5, "comentario": "Y"},
    )
    assert response.status_code == 404


async def test_put_movie_review_wrong_movie_returns_404(client, db_session):
    genre = await _create_genre(db_session)
    _, review_id_a = await _create_movie_and_review(client, genre.sk_genre_id, "A")
    movie_b, _ = await _create_movie_and_review(client, genre.sk_genre_id, "B")

    response = await client.put(
        f"/api/v1/movies/{movie_b}/reviews/{review_id_a}",
        json={"nome": "X", "nota": 5, "comentario": "Y"},
    )
    assert response.status_code == 404


async def test_delete_movie_review_success(client, db_session):
    genre = await _create_genre(db_session)
    sk_movie_id, review_id = await _create_movie_and_review(client, genre.sk_genre_id, "A")

    response = await client.delete(f"/api/v1/movies/{sk_movie_id}/reviews/{review_id}")
    assert response.status_code == 204

    detail = (await client.get(f"/api/v1/movies/{sk_movie_id}")).json()
    assert detail["nota_media_usuarios"] is None
    assert detail["qtd_avaliacoes_usuarios"] == 0


async def test_delete_movie_review_not_found_returns_404(client, db_session):
    genre = await _create_genre(db_session)
    sk_movie_id, _ = await _create_movie_and_review(client, genre.sk_genre_id, "A")

    response = await client.delete(f"/api/v1/movies/{sk_movie_id}/reviews/nao-existe")
    assert response.status_code == 404