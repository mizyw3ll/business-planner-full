"""Shared test fixtures for backend tests."""
import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Add fastapi_application/ to sys.path so internal bare imports (e.g. `from core.config import settings`) resolve
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "fastapi_application"))


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


def _make_mock_user(user_id: int = 1) -> SimpleNamespace:
    return SimpleNamespace(id=user_id, email="test@example.com", is_active=True, is_superuser=False)


def _make_mock_session():
    """Create a mock AsyncSession with configurable query results."""
    session = AsyncMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.get = AsyncMock()
    session.delete = AsyncMock()
    session.add = MagicMock()
    return session


class MockResult:
    """Mock SQLAlchemy result object."""
    def __init__(self, scalars=None, one_rows=None, one_or_none_val=None, all_rows=None, scalar_val=None):
        self._scalars = scalars or []
        self._one_rows = one_rows or []
        self._one_or_none_val = one_or_none_val
        self._all_rows = all_rows if all_rows is not None else one_rows or []
        self._scalar_val = scalar_val

    def scalars(self):
        mock = MagicMock()
        mock.all.return_value = self._scalars
        return mock

    def all(self):
        return self._all_rows

    def scalar(self):
        return self._scalar_val

    def one(self):
        if self._one_rows:
            return self._one_rows[0] if len(self._one_rows) == 1 else self._one_rows
        return SimpleNamespace()

    def one_or_none(self):
        return self._one_or_none_val


@pytest.fixture
def mock_session():
    return _make_mock_session()


@pytest.fixture
def mock_user():
    return _make_mock_user()
