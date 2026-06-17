"""In-memory pub/sub for notification SSE broadcasting."""

import asyncio
import json
from collections import defaultdict
from typing import Any


class NotificationBroadcaster:
    """Broadcasts notifications to connected SSE clients per user."""

    def __init__(self) -> None:
        self._queues: dict[int, list[asyncio.Queue[str]]] = defaultdict(list)

    def subscribe(self, user_id: int) -> asyncio.Queue[str]:
        queue: asyncio.Queue[str] = asyncio.Queue()
        self._queues[user_id].append(queue)
        return queue

    def unsubscribe(self, user_id: int, queue: asyncio.Queue[str]) -> None:
        if queue in self._queues[user_id]:
            self._queues[user_id].remove(queue)
        if not self._queues[user_id]:
            del self._queues[user_id]

    def broadcast(self, user_id: int, notification: dict[str, Any]) -> None:
        payload = json.dumps(notification, default=str)
        for queue in self._queues.get(user_id, []):
            queue.put_nowait(payload)


broadcaster = NotificationBroadcaster()
