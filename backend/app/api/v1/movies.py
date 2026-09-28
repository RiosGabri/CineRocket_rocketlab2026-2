from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.movies.schemas import (
    MovieCreate,
    MovieDetail,
    MovieReviewCreate,
    MovieReviewOut,
    PaginatedMovies,
    PaginatedReviews,
)
from app.movies.service import (
    MovieConflictError,
    MovieWriteError,
    create_movie,
    create_movie_review,
    delete_movie,
    delete_movie_review,
    get_movie_detail,
    list_movie_reviews,
    list_movies,
    update_movie,
    update_movie_review,
)

router = APIRouter()


@router.post("", response_model=MovieDetail, status_code=status.HTTP_201_CREATED)
async def post_movie(
    payload: MovieCreate,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MovieDetail:
    try:
        movie = await create_movie(db, payload)
    except MovieConflictError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except MovieWriteError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    response.headers["Location"] = f"/api/v1/movies/{movie.sk_movie_id}"
    return movie


@router.get("", response_model=PaginatedMovies)
async def get_movies(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    titulo: Annotated[
        str | None,
        Query(description="Filtro por título (contém, sem diferenciar maiúsculas/minúsculas)"),
    ] = None,
) -> PaginatedMovies:
    return await list_movies(db, page=page, page_size=page_size, titulo=titulo)


@router.post(
    "/{sk_movie_id}/reviews",
    response_model=MovieReviewOut,
    status_code=status.HTTP_201_CREATED,
)
async def post_movie_review(
    sk_movie_id: str,
    payload: MovieReviewCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MovieReviewOut:
    review = await create_movie_review(db, sk_movie_id, payload)
    if review is None:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return review


@router.get("/{sk_movie_id}/reviews", response_model=PaginatedReviews)
async def get_movie_reviews(
    sk_movie_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PaginatedReviews:
    reviews = await list_movie_reviews(db, sk_movie_id, page=page, page_size=page_size)
    if reviews is None:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return reviews


@router.put("/{sk_movie_id}/reviews/{sk_movie_review_id}", response_model=MovieReviewOut)
async def put_movie_review(
    sk_movie_id: str,
    sk_movie_review_id: str,
    payload: MovieReviewCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MovieReviewOut:
    review = await update_movie_review(db, sk_movie_id, sk_movie_review_id, payload)
    if review is None:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    return review


@router.delete(
    "/{sk_movie_id}/reviews/{sk_movie_review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_movie_review_endpoint(
    sk_movie_id: str,
    sk_movie_review_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    deleted = await delete_movie_review(db, sk_movie_id, sk_movie_review_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")


@router.get("/{sk_movie_id}", response_model=MovieDetail)
async def get_movie(
    sk_movie_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MovieDetail:
    movie = await get_movie_detail(db, sk_movie_id)
    if movie is None:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return movie


@router.put("/{sk_movie_id}", response_model=MovieDetail)
async def put_movie(
    sk_movie_id: str,
    payload: MovieCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MovieDetail:
    try:
        movie = await update_movie(db, sk_movie_id, payload)
    except MovieConflictError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except MovieWriteError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    if movie is None:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return movie


@router.delete("/{sk_movie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_movie_endpoint(
    sk_movie_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    deleted = await delete_movie(db, sk_movie_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Filme não encontrado")