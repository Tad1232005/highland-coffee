import math
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db, require_admin
from app.models.cart import CartItem
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import (
    OrderCreate,
    OrderItemResponse,
    OrderListResponse,
    OrderResponse,
    OrderStatusUpdate,
)

router = APIRouter(tags=["Orders"])

VALID_ORDER_STATUSES = ["pending", "confirmed", "preparing", "completed", "cancelled"]

# Allowed transitions from current status to next status
ORDER_TRANSITION_RULES = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["preparing", "cancelled"],
    "preparing": ["completed", "cancelled"],
    "completed": [],  # Terminal state
    "cancelled": [],  # Terminal state
}

BUSINESS_TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")


def _format_order_response(order: Order) -> OrderResponse:
    """Format SQLAlchemy Order model to Pydantic OrderResponse schema."""
    item_responses = []
    for it in order.items:
        subtotal = it.unit_price * it.quantity
        item_responses.append(
            OrderItemResponse(
                id=it.id,
                product_id=it.product_id,
                product_name=it.product_name,
                unit_price=it.unit_price,
                quantity=it.quantity,
                subtotal=subtotal,
            )
        )
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        total_amount=order.total_amount,
        receiver_name=order.receiver_name,
        phone=order.phone,
        address=order.address,
        note=order.note,
        created_at=order.created_at,
        completed_at=order.completed_at,
        items=item_responses,
        user=order.user,
    )


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order_from_cart(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create an order from the user's cart in a single atomic transaction:
    - Snapshot product names and unit prices
    - Calculate total
    - Clear the user's cart items
    """
    # 1. Fetch current user's cart items with products
    result = await db.execute(
        select(CartItem)
        .options(selectinload(CartItem.product))
        .where(CartItem.user_id == current_user.id)
    )
    cart_items = result.scalars().all()

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot place order: your shopping cart is empty",
        )

    # 2. Validate product availability and calculate total
    total_amount = 0
    order_items_to_create = []

    for ci in cart_items:
        prod = ci.product
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with ID {ci.product_id} no longer exists",
            )
        if not prod.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{prod.name}' is out of stock / unavailable",
            )

        unit_price = prod.price
        total_amount += unit_price * ci.quantity

        order_items_to_create.append(
            OrderItem(
                product_id=prod.id,
                product_name=prod.name,
                unit_price=unit_price,
                quantity=ci.quantity,
            )
        )

    # 3. Create Order
    order = Order(
        user_id=current_user.id,
        status="pending",
        total_amount=total_amount,
        receiver_name=order_in.receiver_name,
        phone=order_in.phone,
        address=order_in.address,
        note=order_in.note,
    )
    db.add(order)
    await db.flush()  # assign order.id

    # 4. Attach OrderItems
    for oi in order_items_to_create:
        oi.order_id = order.id
        db.add(oi)

    # 5. Delete Cart Items of this user (atomic transaction)
    await db.execute(delete(CartItem).where(CartItem.user_id == current_user.id))

    # Commit the entire transaction
    await db.commit()

    # Re-fetch order with items and user eagerly loaded
    refetch = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.user))
        .where(Order.id == order.id)
    )
    saved_order = refetch.scalar_one()
    return _format_order_response(saved_order)


@router.get("/orders", response_model=OrderListResponse)
async def get_my_orders(
    page: int = Query(default=1, ge=1, description="Page number"),
    size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve orders placed by the current user (paginated, newest first)."""
    count_query = select(func.count()).select_from(Order).where(Order.user_id == current_user.id)
    total = (await db.execute(count_query)).scalar_one()

    offset = (page - 1) * size
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.user))
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .offset(offset)
        .limit(size)
    )
    orders = result.scalars().all()

    return OrderListResponse(
        items=[_format_order_response(o) for o in orders],
        total=total,
        page=page,
        size=size,
        total_pages=math.ceil(total / size) if size else 0,
    )


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order_by_id(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve single order details. Customer can view own order, admin can view any."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.user))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order #{order_id} not found",
        )

    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this order",
        )

    return _format_order_response(order)


# Admin Endpoints
@router.get("/admin/analytics/revenue")
async def admin_revenue_analytics(
    days: int = Query(
        default=7,
        ge=1,
        le=30,
        description="Number of local calendar days",
    ),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Return completed-order revenue by completion date in the Vietnam timezone."""
    today = datetime.now(BUSINESS_TIMEZONE).date()
    if (start_date is None) != (end_date is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date and end_date must be provided together.",
        )
    if start_date is None:
        end_date = today
        start_date = end_date - timedelta(days=days - 1)
    elif end_date is None or start_date > end_date or end_date > today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Date range must be valid and cannot end in the future.",
        )

    days = (end_date - start_date).days + 1
    if days > 366:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Date range cannot exceed 366 days.",
        )

    previous_start_date = start_date - timedelta(days=days)
    start_local = datetime.combine(start_date, time.min, tzinfo=BUSINESS_TIMEZONE)
    end_local = datetime.combine(
        end_date + timedelta(days=1),
        time.min,
        tzinfo=BUSINESS_TIMEZONE,
    )
    previous_start_local = datetime.combine(
        previous_start_date,
        time.min,
        tzinfo=BUSINESS_TIMEZONE,
    )
    start_utc = start_local.astimezone(timezone.utc)
    end_utc = end_local.astimezone(timezone.utc)
    previous_start_utc = previous_start_local.astimezone(timezone.utc)
    local_completion_date = func.date(func.timezone("Asia/Ho_Chi_Minh", Order.completed_at))

    result = await db.execute(
        select(
            local_completion_date.label("completion_date"),
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("order_count"),
        )
        .where(
            Order.status == "completed",
            Order.completed_at >= start_utc,
            Order.completed_at < end_utc,
        )
        .group_by(local_completion_date)
        .order_by(local_completion_date)
    )
    current_rows = list(result)
    revenue_by_date = {
        row.completion_date.isoformat(): int(row.revenue or 0) for row in current_rows
    }
    total_revenue = sum(int(row.revenue or 0) for row in current_rows)
    completed_orders = sum(int(row.order_count) for row in current_rows)

    previous_result = await db.execute(
        select(
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
            func.count(Order.id).label("order_count"),
        ).where(
            Order.status == "completed",
            Order.completed_at >= previous_start_utc,
            Order.completed_at < start_utc,
        )
    )
    previous_row = previous_result.one()
    previous_revenue = int(previous_row.revenue or 0)
    previous_orders = int(previous_row.order_count)
    revenue_change_percent = (
        round((total_revenue - previous_revenue) / previous_revenue * 100, 1)
        if previous_revenue
        else None
    )
    items = [
        {
            "date": (start_date + timedelta(days=offset)).isoformat(),
            "revenue": revenue_by_date.get(
                (start_date + timedelta(days=offset)).isoformat(),
                0,
            ),
        }
        for offset in range(days)
    ]
    return {
        "days": days,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "items": items,
        "summary": {
            "revenue": total_revenue,
            "completed_orders": completed_orders,
            "average_order_value": (
                round(total_revenue / completed_orders) if completed_orders else 0
            ),
            "previous_revenue": previous_revenue,
            "previous_completed_orders": previous_orders,
            "revenue_change_percent": revenue_change_percent,
        },
    }


@router.get("/admin/orders", response_model=OrderListResponse)
async def admin_list_orders(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1, description="Page number"),
    size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """List all store orders (Admin only) with optional status filtering."""
    filters = []
    if status_filter:
        if status_filter not in VALID_ORDER_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid status '{status_filter}'. "
                    f"Must be one of: {', '.join(VALID_ORDER_STATUSES)}"
                ),
            )
        filters.append(Order.status == status_filter)

    count_query = select(func.count()).select_from(Order).where(*filters)
    total = (await db.execute(count_query)).scalar_one()

    offset = (page - 1) * size
    query = select(Order).options(selectinload(Order.items), selectinload(Order.user))
    if filters:
        query = query.where(*filters)
    query = query.order_by(Order.created_at.desc(), Order.id.desc()).offset(offset).limit(size)

    result = await db.execute(query)
    orders = result.scalars().all()

    return OrderListResponse(
        items=[_format_order_response(o) for o in orders],
        total=total,
        page=page,
        size=size,
        total_pages=math.ceil(total / size) if size else 0,
    )


@router.patch("/admin/orders/{order_id}/status", response_model=OrderResponse)
async def admin_update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Update order processing status (Admin only)."""
    if status_update.status not in VALID_ORDER_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{status_update.status}'. Must be one of: {', '.join(VALID_ORDER_STATUSES)}",
        )

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.user))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order #{order_id} not found",
        )

    # Check if target status is allowed from current status
    allowed_transitions = ORDER_TRANSITION_RULES.get(order.status, [])
    if status_update.status not in allowed_transitions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot transition order status from '{order.status}' to '{status_update.status}'. "
                f"Allowed transitions from '{order.status}' are: {allowed_transitions or 'None (terminal state)'}"
            ),
        )

    order.status = status_update.status
    if status_update.status == "completed":
        order.completed_at = datetime.now(timezone.utc)
    db.add(order)
    await db.commit()
    await db.refresh(order)

    return _format_order_response(order)
