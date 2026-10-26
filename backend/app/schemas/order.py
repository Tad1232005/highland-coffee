from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field

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

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def subtotal(self) -> int:
        """Line total. Derived, never stored, so it cannot drift from the row."""
        return self.unit_price * self.quantity


class OrderResponse(BaseModel):
    id: int
    # Nullable: the account is deleted, the order history is preserved.
    user_id: Optional[int] = None
    status: str  # pending, confirmed, preparing, completed, cancelled
    total_amount: int
    receiver_name: str
    phone: str
    address: str
    note: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    items: List[OrderItemResponse]
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str = Field(description="One of: pending, confirmed, preparing, completed, cancelled")


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    size: int
    total_pages: int


class RevenuePoint(BaseModel):
    date: date
    revenue: int


class RevenueSummary(BaseModel):
    revenue: int
    completed_orders: int
    average_order_value: int
    previous_revenue: int
    previous_completed_orders: int
    revenue_change_percent: Optional[float] = None


class RevenueAnalyticsResponse(BaseModel):
    days: int
    start_date: date
    end_date: date
    items: List[RevenuePoint]
    summary: RevenueSummary
