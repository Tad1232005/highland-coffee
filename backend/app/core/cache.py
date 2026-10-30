"""
Simple in-memory TTL cache for read-heavy endpoints.

The cache lives in the process memory, so every worker keeps its own copy.
A multi-worker deployment needs a shared store (Redis) instead.
"""

from functools import wraps
from typing import Any, Callable

import cachetools

# Default TTL: 60 seconds
DEFAULT_TTL = 60

# Every cache created by @cached, so one mutation can drop all cached reads.
_function_caches: list[cachetools.TTLCache] = []


def make_cache_key(*args: Any, **kwargs: Any) -> str:
    """Build a stable cache key from the function arguments."""
    key_parts = [str(arg) for arg in args]
    key_parts.extend(f"{key}={value}" for key, value in sorted(kwargs.items()))
    return ":".join(key_parts)


def cached(ttl: int = DEFAULT_TTL, key_prefix: str = ""):
    """
    Decorator to cache async function results with TTL.

    Args:
        ttl: Time to live in seconds
        key_prefix: Optional prefix for cache keys
    """

    def decorator(func: Callable) -> Callable:
        # Each endpoint gets its own cache with its own TTL.
        func_cache = cachetools.TTLCache(maxsize=1000, ttl=ttl)
        _function_caches.append(func_cache)

        @wraps(func)
        async def wrapper(*args, **kwargs):
            # The session and the admin dependency are request-scoped objects,
            # so they are left out of the key.
            cache_kwargs = {
                key: value
                for key, value in kwargs.items()
                if key not in ("db", "_admin", "current_user")
            }
            cache_key = f"{key_prefix}:{func.__name__}:{make_cache_key(*args, **cache_kwargs)}"

            if cache_key in func_cache:
                return func_cache[cache_key]

            result = await func(*args, **kwargs)
            func_cache[cache_key] = result
            return result

        # Attach cache for manual invalidation
        wrapper.cache = func_cache
        return wrapper

    return decorator


def invalidate_all_caches() -> None:
    """Drop every cached read. Call after any mutation."""
    for cache_obj in _function_caches:
        cache_obj.clear()
