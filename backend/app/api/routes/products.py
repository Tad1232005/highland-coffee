import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, require_admin
from app.models.category import Category
from app.models.product import Product
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=ProductListResponse)
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
    query = select(Product).options(selectinload(Product.category))

    if available_only:
        query = query.where(Product.is_available.is_(True))

    if category_id is not None:
        query = query.where(Product.category_id == category_id)

    if min_price is not None:
        query = query.where(Product.price >= min_price)

    if max_price is not None:
        query = query.where(Product.price <= max_price)

    if q and q.strip():
        search_pattern = f"%{q.strip()}%"
        query = query.where(
            or_(
                Product.name.ilike(search_pattern),
                Product.description.ilike(search_pattern),
            )
        )

    # Count total matching products
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Pagination
    offset = (page - 1) * size
    query = query.order_by(Product.id.desc()).offset(offset).limit(size)

    result = await db.execute(query)
    items = result.scalars().all()

    total_pages = math.ceil(total / size) if size > 0 else 0

    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in items],
        total=total,
        page=page,
        size=size,
        total_pages=total_pages,
    )


@router.get("/{product_id}", response_model=ProductResponse)
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
    return product


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
    await db.commit()
    await db.refresh(product)

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

    if product_in.category_id is not None:
        cat_result = await db.execute(select(Category).where(Category.id == product_in.category_id))
        if not cat_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with ID {product_in.category_id} does not exist",
            )
        product.category_id = product_in.category_id

    if product_in.slug is not None:
        existing_slug = await db.execute(
            select(Product).where(Product.slug == product_in.slug, Product.id != product_id)
        )
        if existing_slug.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with slug '{product_in.slug}' already exists",
            )
        product.slug = product_in.slug

    if product_in.name is not None:
        product.name = product_in.name
    if product_in.description is not None:
        product.description = product_in.description
    if product_in.image_url is not None:
        product.image_url = product_in.image_url
    if product_in.price is not None:
        product.price = product_in.price
    if product_in.is_available is not None:
        product.is_available = product_in.is_available

    db.add(product)
    await db.commit()
    await db.refresh(product)

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
    return {"message": f"Product {product_id} has been marked unavailable", "is_available": False}
