"""通用分页响应模型，供公开浏览类端点（Discover）复用。"""

from typing import Generic, List, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    skip: int = 0
    limit: int = 20
