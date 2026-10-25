"""
Simple in-memory TTL cache for read-heavy endpoints.
For production, consider Redis (aioredis/redis-py) instead.
"""

from functools import wraps
from typing import Callable

import cachetools

# Default TTL: 60 seconds
DEFAULT_TTL = 60

# In-memory cache with TTL (max 1000 entries)
_cache = cachetools.TTLCache(maxsize=1000, ttl=DEFAULT_TTL)


def make_cache_key(*args, **kwargs) -> str:
    """Generate a cache key from function arguments."""
    key_parts = [str(arg) for arg in args]
    key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
    return ":".join(key_parts)


def cached(ttl: int = DEFAULT_TTL, key_prefix: str = ""):
    """
    Decorator to cache async function results with TTL.

    Args:
        ttl: Time to live in seconds
        key_prefix: Optional prefix for cache keys
    """

    def decorator(func: Callable) -> Callable:
        # Create a separate cache for this function with its own TTL
        func_cache = cachetools.TTLCache(maxsize=1000, ttl=ttl)

        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Remove 'db' from kwargs if present (not hashable, not part of cache key)
            cache_kwargs = {k: v for k, v in kwargs.items() if k != "db" and k != "_admin"}
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


def invalidate_cache(prefix: str):
    """Invalidate all cache entries with given prefix."""
    # This is a simple approach - in reality you'd want a more sophisticated
    # invalidation strategy (e.g., using Redis with pattern matching)
    pass


# Convenience function to clear all caches
def clear_all_caches():
    """Clear all function caches. Call after data mutations."""
    # This will be populated by the decorator
    pass


# Registry of all function caches for bulk invalidation
_function_caches: list = []


def register_cache(cache_obj):
    """Register a function cache for bulk invalidation."""
    _function_caches.append(cache_obj)


def invalidate_all_caches():
    """Clear all registered function caches."""
    for cache_obj in _function_caches:
        cache_obj.clear()
