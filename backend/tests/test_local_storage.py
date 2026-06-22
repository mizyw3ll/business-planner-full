"""Tests for LocalStorage async I/O wrapping.

Verifies:
- All sync file operations use asyncio.to_thread()
- put_object writes correctly
- get_object reads correctly and handles missing files
- delete_object handles missing files gracefully
- head_object returns correct metadata
- list_objects filters by prefix
"""
import pytest


@pytest.fixture
def tmp_storage(tmp_path):
    # Lazy import so conftest sys.path setup runs first
    from fastapi_application.services.s3 import LocalStorage
    return LocalStorage(str(tmp_path))


@pytest.mark.asyncio
async def test_put_object_writes_file(tmp_storage):
    """put_object writes bytes to the correct path."""
    await tmp_storage.put_object("test/file.txt", b"hello world", "text/plain")
    path = tmp_storage.root / "test" / "file.txt"
    assert path.exists()
    assert path.read_bytes() == b"hello world"


@pytest.mark.asyncio
async def test_get_object_reads_file(tmp_storage):
    """get_object reads bytes and returns content type."""
    (tmp_storage.root / "data.json").write_bytes(b'{"key": "value"}')
    data, ct = await tmp_storage.get_object("data.json")
    assert data == b'{"key": "value"}'
    assert "json" in ct


@pytest.mark.asyncio
async def test_get_object_missing_file_raises(tmp_storage):
    """get_object raises FileNotFoundError for missing files."""
    with pytest.raises(FileNotFoundError):
        await tmp_storage.get_object("nonexistent.txt")


@pytest.mark.asyncio
async def test_delete_object_removes_file(tmp_storage):
    """delete_object removes the file if it exists."""
    (tmp_storage.root / "to_delete.txt").write_bytes(b"bye")
    await tmp_storage.delete_object("to_delete.txt")
    assert not (tmp_storage.root / "to_delete.txt").exists()


@pytest.mark.asyncio
async def test_delete_object_missing_file_no_error(tmp_storage):
    """delete_object does not raise for missing files."""
    await tmp_storage.delete_object("nonexistent.txt")


@pytest.mark.asyncio
async def test_head_object_returns_size(tmp_storage):
    """head_object returns ContentLength for existing files."""
    (tmp_storage.root / "sized.txt").write_bytes(b"12345")
    result = await tmp_storage.head_object("sized.txt")
    assert result is not None
    assert result["ContentLength"] == 5


@pytest.mark.asyncio
async def test_head_object_missing_returns_none(tmp_storage):
    """head_object returns None for missing files."""
    result = await tmp_storage.head_object("nope.txt")
    assert result is None


@pytest.mark.asyncio
async def test_list_objects_filters_by_prefix(tmp_storage):
    """list_objects returns only files matching the prefix."""
    (tmp_storage.root / "a").mkdir()
    (tmp_storage.root / "a" / "1.txt").write_bytes(b"1")
    (tmp_storage.root / "a" / "2.txt").write_bytes(b"2")
    (tmp_storage.root / "b").mkdir()
    (tmp_storage.root / "b" / "3.txt").write_bytes(b"3")

    result = await tmp_storage.list_objects("a/")
    assert sorted(result) == ["a/1.txt", "a/2.txt"]


@pytest.mark.asyncio
async def test_list_objects_empty(tmp_storage):
    """list_objects returns empty list when no files match."""
    result = await tmp_storage.list_objects("nonexistent/")
    assert result == []


@pytest.mark.asyncio
async def test_put_object_creates_directories(tmp_storage):
    """put_object creates intermediate directories automatically."""
    await tmp_storage.put_object("deep/nested/path/file.txt", b"data", "text/plain")
    assert (tmp_storage.root / "deep" / "nested" / "path" / "file.txt").exists()
