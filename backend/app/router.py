from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session

from .database import get_db
from .models import Bookmark
from .schemas import (
    BookmarkCreate,
    BookmarkPage,
    BookmarkRead,
    BookmarkStats,
    BookmarkUpdate,
    SortField,
    SortOrder,
)


router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])


def get_or_404(bookmark_id: int, db: Session) -> Bookmark:
    bookmark = db.get(Bookmark, bookmark_id)
    if bookmark is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return bookmark


@router.get("/stats", response_model=BookmarkStats)
def get_stats(db: Session = Depends(get_db)) -> BookmarkStats:
    bookmarks = db.scalars(select(Bookmark)).all()
    categories = {item.category for item in bookmarks if item.category}
    tags = {tag for item in bookmarks for tag in (item.tags or [])}
    return BookmarkStats(
        total=len(bookmarks),
        favorites=sum(item.is_favorite for item in bookmarks),
        categories=len(categories),
        tags=len(tags),
    )


@router.get("/facets")
def get_facets(db: Session = Depends(get_db)) -> dict[str, list[str]]:
    bookmarks = db.scalars(select(Bookmark)).all()
    return {
        "categories": sorted({item.category for item in bookmarks if item.category}, key=str.lower),
        "tags": sorted({tag for item in bookmarks for tag in (item.tags or [])}),
    }


@router.get("", response_model=BookmarkPage)
def list_bookmarks(
    search: str | None = Query(default=None, max_length=200),
    category: str | None = Query(default=None, max_length=80),
    tag: str | None = Query(default=None, max_length=40),
    favorite: bool | None = None,
    sort_by: SortField = "created_at",
    order: SortOrder = "desc",
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> BookmarkPage:
    conditions = []
    if search:
        pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                Bookmark.title.ilike(pattern),
                Bookmark.description.ilike(pattern),
                Bookmark.url.ilike(pattern),
                Bookmark.category.ilike(pattern),
            )
        )
    if category:
        conditions.append(func.lower(Bookmark.category) == category.strip().lower())
    if favorite is not None:
        conditions.append(Bookmark.is_favorite.is_(favorite))

    statement = select(Bookmark).where(*conditions)
    count_statement = select(func.count()).select_from(Bookmark).where(*conditions)
    order_column = getattr(Bookmark, sort_by)
    statement = statement.order_by(asc(order_column) if order == "asc" else desc(order_column))

    # JSON membership differs between database engines, so tag filtering is
    # applied in Python. The normal path remains fully paginated in SQL.
    if tag:
        all_matching = db.scalars(statement).all()
        normalized_tag = tag.strip().lower()
        filtered = [item for item in all_matching if normalized_tag in (item.tags or [])]
        return BookmarkPage(
            items=filtered[offset : offset + limit],
            total=len(filtered),
            limit=limit,
            offset=offset,
        )

    total = db.scalar(count_statement) or 0
    items = db.scalars(statement.offset(offset).limit(limit)).all()
    return BookmarkPage(items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=BookmarkRead, status_code=status.HTTP_201_CREATED)
def create_bookmark(payload: BookmarkCreate, db: Session = Depends(get_db)) -> Bookmark:
    bookmark = Bookmark(**payload.model_dump(mode="json"))
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark


@router.get("/{bookmark_id}", response_model=BookmarkRead)
def get_bookmark(bookmark_id: int, db: Session = Depends(get_db)) -> Bookmark:
    return get_or_404(bookmark_id, db)


@router.patch("/{bookmark_id}", response_model=BookmarkRead)
def update_bookmark(
    bookmark_id: int,
    payload: BookmarkUpdate,
    db: Session = Depends(get_db),
) -> Bookmark:
    bookmark = get_or_404(bookmark_id, db)
    for field, value in payload.model_dump(exclude_unset=True, mode="json").items():
        setattr(bookmark, field, value)
    db.commit()
    db.refresh(bookmark)
    return bookmark


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(bookmark_id: int, db: Session = Depends(get_db)) -> Response:
    bookmark = get_or_404(bookmark_id, db)
    db.delete(bookmark)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
