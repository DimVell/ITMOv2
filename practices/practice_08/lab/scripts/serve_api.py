"""Run the existing Practice 5 API with separate Practice 8 data."""

from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

PRACTICE_05 = Path(__file__).resolve().parents[3] / "practice_05"
sys.path.insert(0, str(PRACTICE_05))

from app.server import create_server  # noqa: E402
from app.store import SubscriberStore  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--data", type=Path, default=Path(".data/subscribers.json"))
    parser.add_argument("--temporary", action="store_true")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="notify-mini-tests-") as temporary:
        data_file = Path(temporary) / "subscribers.json" if args.temporary else args.data
        server = create_server("127.0.0.1", args.port, SubscriberStore(data_file))
        print(f"Notify Mini API: http://127.0.0.1:{args.port}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()


if __name__ == "__main__":
    main()
