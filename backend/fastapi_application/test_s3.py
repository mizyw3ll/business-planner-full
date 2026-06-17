"""Quick S3 connectivity test."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from services.s3 import storage


async def main():
    test_key = "_test/connectivity_check.txt"
    test_data = b"Hello from S3!"
    try:
        await storage.put_object(test_key, test_data, "text/plain")
        print("[OK] put_object")

        data, ct = await storage.get_object(test_key)
        assert data == test_data
        print(f"[OK] get_object ({ct})")

        await storage.delete_object(test_key)
        print("[OK] delete_object")

        print("\nS3 storage works!")
    except Exception as e:
        print(f"\n[FAIL] {e}")
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
