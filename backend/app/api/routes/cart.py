from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.cart import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import (
    CartItemCreate,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
)

router = APIRouter(prefix="/cart", tags=["Cart"])


async def _get_user_cart_response(user_id: int, db: AsyncSession) -> CartResponse:
    """Helper to fetch and format the full cart for a user."""
    result = await db.execute(
        select(CartItem)
        .options(selectinload(CartItem.product).selectinload(Product.category))
        .where(CartItem.user_id == user_id)
        .order_by(CartItem.id.asc())
    )
    items = result.scalars().all()

    total_quantity = sum(item.quantity for item in items)
    total_amount = sum(item.quantity * item.product.price for item in items if item.product)

    return CartResponse(
        items=[CartItemResponse.model_validate(item) for item in items],
        total_quantity=total_quantity,
        total_amount=total_amount,
    )


@router.get("/items", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all items in the current user's shopping cart."""
    return await _get_user_cart_response(current_user.id, db)


@router.post("/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
async def add_item_to_cart(
    item_in: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a product to the cart. If already present, increment the quantity."""
    # Check product existence & availability
    prod_result = await db.execute(select(Product).where(Product.id == item_in.product_id))
    product = prod_result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {item_in.product_id} not found",
        )
    if not product.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product '{product.name}' is currently unavailable",
        )

    # Check if item is already in user's cart
    existing_result = await db.execute(
        select(CartItem).where(
            CartItem.user_id == current_user.id,
            CartItem.product_id == item_in.product_id,
        )
    )
    cart_item = existing_result.scalar_one_or_none()

    if cart_item:
        cart_item.quantity += item_in.quantity
        db.add(cart_item)
    else:
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity,
        )
        db.add(cart_item)

    await db.commit()
    return await _get_user_cart_response(current_user.id, db)


@router.patch("/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: int,
    item_update: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update quantity of a specific cart item."""
    result = await db.execute(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.user_id == current_user.id,
        )
    )
    cart_item = result.scalar_one_or_none()
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart item with ID {item_id} not found in your cart",
        )

    cart_item.quantity = item_update.quantity
    db.add(cart_item)
    await db.commit()
    return await _get_user_cart_response(current_user.id, db)


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a specific item from the cart."""
    result = await db.execute(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.user_id == current_user.id,
        )
    )
    cart_item = result.scalar_one_or_none()
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart item with ID {item_id} not found in your cart",
        )

    await db.delete(cart_item)
    await db.commit()
    return await _get_user_cart_response(current_user.id, db)


@router.delete("/items", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Clear all items in current user's cart."""
    await db.execute(delete(CartItem).where(CartItem.user_id == current_user.id))
    await db.commit()
    return None
