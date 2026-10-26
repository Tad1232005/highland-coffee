import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, require_admin
from app.core.cache import cached, invalidate_all_caches
from app.models.category import Category
from app.models.order import OrderItem
from app.models.product import Product
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=ProductListResponse)
@cached(ttl=60, key_prefix="products")
async def list_products(
    q: Optional[str] = Query(
        default=None, description="Search keyword in product name or description"
    ),
    category_id: Optional[int] = Query(default=None, description="Filter by category ID"),
    min_price: Optional[int] = Query(default=None, ge=0, description="Minimum price in VND"),
    max_price: Optional[int] = Query(default=None, ge=0, description="Maximum price in VND"),
    available_only: bool = Query(default=True, description="Filter only available products"),
    page: int = Query(default=1, ge=1, description="Page number"),
    size: int = Query(default=12, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    """List products with searching, category filtering, price range, and pagination."""
    filters = []

    if available_only:
        filters.append(Product.is_available.is_(True))

    if category_id is not None:
        filters.append(Product.category_id == category_id)

    if min_price is not None:
        filters.append(Product.price >= min_price)

    if max_price is not None:
        filters.append(Product.price <= max_price)

    if q and q.strip():
        search_pattern = f"%{q.strip()}%"
        filters.append(
            or_(
                Product.name.ilike(search_pattern),
                Product.description.ilike(search_pattern),
            )
        )

    # Count total matching products
    count_query = select(func.count()).select_from(Product).where(*filters)
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Pagination
    offset = (page - 1) * size
    query = (
        select(Product)
        .options(selectinload(Product.category))
        .where(*filters)
        .order_by(Product.id.desc())
        .offset(offset)
        .limit(size)
    )

    result = await db.execute(query)
    items = result.scalars().all()

    total_pages = math.ceil(total / size)

    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in items],
        total=total,
        page=page,
        size=size,
        total_pages=total_pages,
    )


@router.get("/{product_id}", response_model=ProductResponse)
@cached(ttl=60, key_prefix="products")
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve single product details by ID."""
    result = await db.execute(
        select(Product).options(selectinload(Product.category)).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found",
        )
    # Trả về Pydantic thay vì ORM: giá trị được cache không phụ thuộc session.
    return ProductResponse.model_validate(product)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Create a new product (Admin only)."""
    # Verify category exists
    cat_result = await db.execute(select(Category).where(Category.id == product_in.category_id))
    if not cat_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with ID {product_in.category_id} does not exist",
        )

    # Verify slug uniqueness
    existing_slug = await db.execute(select(Product).where(Product.slug == product_in.slug))
    if existing_slug.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with slug '{product_in.slug}' already exists",
        )

    product = Product(
        category_id=product_in.category_id,
        name=product_in.name,
        slug=product_in.slug,
        description=product_in.description,
        image_url=product_in.image_url,
        price=product_in.price,
        is_available=product_in.is_available,
    )
    db.add(product)
    try:
        await db.commit()
    except IntegrityError as error:
        # The pre-check can be beaten by a concurrent request; the unique
        # constraint on slug is the final arbiter.
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product could not be created: the slug already exists or the category was removed",
        ) from error
    await db.refresh(product)

    # Invalidate product caches
    invalidate_all_caches()

    # Re-fetch with category loaded
    res = await db.execute(
        select(Product).options(selectinload(Product.category)).where(Product.id == product.id)
    )
    return res.scalar_one()


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Update an existing product (Admin only)."""
    result = await db.execute(
        select(Product).options(selectinload(Product.category)).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found",
        )

    # Apply only the fields the client sent. `exclude_unset` keeps the difference
    # between "field omitted" (leave as is) and "field sent as null" (clear it).
    updates = product_in.model_dump(exclude_unset=True)

    category_id = updates.get("category_id")
    if category_id is not None:
        cat_result = await db.execute(select(Category).where(Category.id == category_id))
        if not cat_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with ID {category_id} does not exist",
            )
        product.category_id = category_id

    slug = updates.get("slug")
    if slug is not None:
        existing_slug = await db.execute(
            select(Product).where(Product.slug == slug, Product.id != product_id)
        )
        if existing_slug.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with slug '{slug}' already exists",
            )
        product.slug = slug

    # Required columns ignore an explicit null; optional ones can be cleared.
    for field in ("name", "price", "is_available"):
        if updates.get(field) is not None:
            setattr(product, field, updates[field])
    for field in ("description", "image_url"):
        if field in updates:
            setattr(product, field, updates[field])

    db.add(product)
    try:
        await db.commit()
    except IntegrityError as error:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product could not be updated: the slug already exists or the category was removed",
        ) from error
    await db.refresh(product)

    # Invalidate product caches
    invalidate_all_caches()

    res = await db.execute(
        select(Product).options(selectinload(Product.category)).where(Product.id == product.id)
    )
    return res.scalar_one()


@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Soft delete product by setting is_available = False (Admin only)."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found",
        )

    product.is_available = False
    db.add(product)
    await db.commit()

    # Invalidate product caches
    invalidate_all_caches()

    return {"message": f"Product {product_id} has been marked unavailable", "is_available": False}


@router.delete("/{product_id}/permanent", status_code=status.HTTP_200_OK)
async def permanently_delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Permanently delete a product only when it has no order history."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found",
        )
    if product.is_available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Hide this product before deleting it permanently.",
        )

    history_result = await db.execute(
        select(OrderItem.id).where(OrderItem.product_id == product_id).limit(1)
    )
    if history_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This product has order history. Hide it instead of deleting it permanently.",
        )

    try:
        await db.delete(product)
        await db.commit()
    except IntegrityError as error:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This product is referenced by existing data and cannot be deleted.",
        ) from error

    # Invalidate product caches
    invalidate_all_caches()

    return {"message": f"Product {product_id} has been permanently deleted."}
