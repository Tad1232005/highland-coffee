from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserResponse


class OrderCreate(BaseModel):
    receiver_name: str = Field(min_length=1, max_length=200)
    phone: str = Field(min_length=8, max_length=50)
    address: str = Field(min_length=3)
    note: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    unit_price: int
    quantity: int
    subtotal: int

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    user_id: int
    status: str  # pending, confirmed, preparing, completed, cancelled
    total_amount: int
    receiver_name: str
    phone: str
    address: str
    note: Optional[str] = None
    created_at: datetime
    items: List[OrderItemResponse]
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str = Field(description="One of: pending, confirmed, preparing, completed, cancelled")


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
