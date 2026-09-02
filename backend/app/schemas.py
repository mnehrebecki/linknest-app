from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


def normalize_optional(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


class BookmarkBase(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=200)]
    url: HttpUrl
    description: Annotated[str | None, Field(max_length=2000)] = None
    category: Annotated[str | None, Field(max_length=80)] = None
    tags: Annotated[list[str], Field(max_length=20)] = Field(default_factory=list)
    is_favorite: bool = False

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        return value.strip()

    @field_validator("description", "category")
    @classmethod
    def clean_optional_fields(cls, value: str | None) -> str | None:
        return normalize_optional(value)

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, values: list[str]) -> list[str]:
        unique: list[str] = []
        seen: set[str] = set()
        for value in values:
            tag = value.strip().lower()
            if not tag or tag in seen:
                continue
            if len(tag) > 40:
                raise ValueError("Every tag must contain at most 40 characters")
            seen.add(tag)
            unique.append(tag)
        return unique


class BookmarkCreate(BookmarkBase):
    pass


class BookmarkUpdate(BaseModel):
    title: Annotated[str | None, Field(min_length=1, max_length=200)] = None
    url: HttpUrl | None = None
    description: Annotated[str | None, Field(max_length=2000)] = None
    category: Annotated[str | None, Field(max_length=80)] = None
    tags: Annotated[list[str] | None, Field(max_length=20)] = None
    is_favorite: bool | None = None

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None

    @field_validator("description", "category")
    @classmethod
    def clean_optional_fields(cls, value: str | None) -> str | None:
        return normalize_optional(value)

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, values: list[str] | None) -> list[str] | None:
        return BookmarkBase.clean_tags(values) if values is not None else None


class BookmarkRead(BookmarkBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    created_at: datetime
    updated_at: datetime


class BookmarkPage(BaseModel):
    items: list[BookmarkRead]
    total: int
    limit: int
    offset: int


class BookmarkStats(BaseModel):
    total: int
    favorites: int
    categories: int
    tags: int


SortField = Literal["created_at", "updated_at", "title"]
SortOrder = Literal["asc", "desc"]
