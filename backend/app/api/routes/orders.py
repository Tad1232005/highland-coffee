from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, select
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


@router.get("/orders", response_model=List[OrderResponse])
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve orders placed by the current user."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.user))
        .where(Order.id == Order.id, Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    return [_format_order_response(o) for o in orders]


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
@router.get("/admin/orders", response_model=OrderListResponse)
async def admin_list_orders(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """List all store orders (Admin only) with optional status filtering."""
    query = select(Order).options(selectinload(Order.items), selectinload(Order.user))

    if status_filter:
        query = query.where(Order.status == status_filter)

    query = query.order_by(Order.created_at.desc())
    result = await db.execute(query)
    orders = result.scalars().all()

    return OrderListResponse(
        items=[_format_order_response(o) for o in orders],
        total=len(orders),
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
    db.add(order)
    await db.commit()
    await db.refresh(order)

    return _format_order_response(order)
