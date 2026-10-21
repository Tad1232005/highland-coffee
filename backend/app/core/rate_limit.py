import threading
import time
from collections import defaultdict, deque


class SlidingWindowRateLimiter:
    """In-process sliding-window rate limiter.

    Tracks failed events per key and blocks a key once it accumulates
    ``max_events`` failures inside ``window_seconds``.

    The state lives in the process memory, so it only protects a single
    worker. A multi-worker or multi-instance deployment needs a shared store
    (Redis) instead.
    """

    def __init__(self, max_events: int, window_seconds: int) -> None:
        self.max_events = max_events
        self.window_seconds = window_seconds
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _prune(self, key: str, now: float) -> deque[float]:
        bucket = self._events[key]
        while bucket and now - bucket[0] >= self.window_seconds:
            bucket.popleft()
        return bucket

    def is_blocked(self, key: str) -> bool:
        """Return True when the key has exhausted its allowance."""
        if self.max_events <= 0:
            return False
        with self._lock:
            bucket = self._prune(key, time.monotonic())
            return len(bucket) >= self.max_events

    def register_failure(self, key: str) -> None:
        """Record one failed event for the key."""
        with self._lock:
            bucket = self._prune(key, time.monotonic())
            bucket.append(time.monotonic())

    def reset(self, key: str) -> None:
        """Clear the failure history for the key (called after a success)."""
        with self._lock:
            self._events.pop(key, None)

    def retry_after(self, key: str) -> int:
        """Seconds until the oldest recorded failure leaves the window."""
        with self._lock:
            bucket = self._prune(key, time.monotonic())
            if not bucket:
                return 0
            return max(1, int(self.window_seconds - (time.monotonic() - bucket[0])))
