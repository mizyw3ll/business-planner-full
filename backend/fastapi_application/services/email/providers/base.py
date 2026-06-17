from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class EmailPayload:
    to: str
    subject: str
    html_body: str
    text_body: str | None = None
    from_email: str | None = None
    from_name: str | None = None
    reply_to: str | None = None


class EmailProvider(ABC):
    """Abstract base class for email providers."""

    @abstractmethod
    async def send(self, payload: EmailPayload) -> str:
        """
        Send an email.
        Returns message_id on success.
        """
        pass

    async def close(self):
        """Cleanup resources if needed."""
        pass
