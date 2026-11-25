"""Reproducible short demo for the Practice 5 acceptance."""

from __future__ import annotations

import tempfile
from pathlib import Path

from app.store import SubscriberStore
from tests.support import request_json, running_server


def main() -> None:
    with tempfile.TemporaryDirectory() as directory:
        store = SubscriberStore(Path(directory) / "subscribers.json")
        with running_server(store) as base_url:
            print(f"1. UI: {base_url}/")

            status, payload = request_json(
                f"{base_url}/api/subscribers",
                method="POST",
                payload={"name": "  Анна  "},
            )
            print(f"2. Новое имя: HTTP {status}, created={payload['created']}")

            status, payload = request_json(
                f"{base_url}/api/subscribers",
                method="POST",
                payload={"name": "анна"},
            )
            print(f"3. Дубликат: HTTP {status}, created={payload['created']}")

            status, payload = request_json(
                f"{base_url}/api/subscribers",
                method="POST",
                payload={"name": " "},
            )
            print(f"4. Пустое имя: HTTP {status}, code={payload['error']['code']}")

            status, payload = request_json(f"{base_url}/api/subscribers")
            print(f"5. Итог: HTTP {status}, subscribers={payload['subscribers']}")


if __name__ == "__main__":
    main()

