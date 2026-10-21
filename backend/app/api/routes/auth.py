from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.rate_limit import SlidingWindowRateLimiter
from app.core.security import (
    create_access_token,
    get_dummy_hash,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.schemas.user import Token, UserLogin, UserRegister, UserResponse, UserUpdate

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-process sliding window: blocks a client IP + email combination after too
# many failed logins. See SlidingWindowRateLimiter for the multi-worker caveat.
login_limiter = SlidingWindowRateLimiter(
    max_events=settings.LOGIN_MAX_ATTEMPTS,
    window_seconds=settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS,
)


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new customer account."""
    existing_user = await db.execute(select(User).where(User.email == user_in.email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists",
        )

    user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone=user_in.phone,
        role="customer",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate user with email and password, returning JWT access token."""
    email = credentials.email.lower()
    limiter_key = f"{_client_ip(request)}:{email}"

    if login_limiter.is_blocked(limiter_key):
        retry_after = login_limiter.retry_after(limiter_key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(f"Too many failed login attempts. Please try again in {retry_after} seconds."),
            headers={"Retry-After": str(retry_after)},
        )

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # Always run a bcrypt verification, even for unknown emails, so the
    # response time does not reveal which accounts exist.
    password_ok = verify_password(
        credentials.password, user.password_hash if user else get_dummy_hash()
    )

    if not user or not password_ok:
        login_limiter.register_failure(limiter_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        login_limiter.register_failure(limiter_key)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    login_limiter.reset(limiter_key)

    access_token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update profile information of the currently authenticated user."""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.phone is not None:
        current_user.phone = user_update.phone

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user
