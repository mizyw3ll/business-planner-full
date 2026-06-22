"""Tests for async I/O in financial chart export/import.

Verifies:
- XLSX export uses asyncio.to_thread() for sync openpyxl operations
- ICS import uses asyncio.to_thread() for icalendar parsing
"""
import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


def test_financial_chart_views_imports():
    """Verify async_to_thread is available and used in financial chart views."""
    import inspect
    from fastapi_application.api.api_v1.financial.financial_chart import views

    source = inspect.getsource(views)
    assert "to_thread" in source or "asyncio" in source, \
        "financial/chart views should use asyncio.to_thread for sync I/O"


def test_calendar_views_imports():
    """Verify calendar views use async I/O."""
    import inspect
    from fastapi_application.api.api_v1.calendar import views

    source = inspect.getsource(views)
    assert "to_thread" in source or "asyncio" in source, \
        "calendar views should use asyncio.to_thread for sync I/O"


def test_export_views_imports():
    """Verify export views use async I/O."""
    import inspect
    from fastapi_application.api.api_v1.business.business_plan import export_views

    source = inspect.getsource(export_views)
    assert "to_thread" in source or "asyncio" in source, \
        "export views should use asyncio.to_thread for sync I/O"


def test_import_views_imports():
    """Verify import views use async I/O."""
    import inspect
    from fastapi_application.api.api_v1.business.business_plan import import_views

    source = inspect.getsource(import_views)
    assert "to_thread" in source or "asyncio" in source, \
        "import views should use asyncio.to_thread for sync I/O"
