"""Small HTTP server exposing the subscriber UI and JSON API."""

from __future__ import annotations

import argparse
import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from app.store import InvalidNameError, SubscriberStore

STATIC_DIR = Path(__file__).with_name("static")
MAX_BODY_BYTES = 4096


class NotifyServer(ThreadingHTTPServer):
    """HTTP server carrying its injected subscriber store."""

    store: SubscriberStore


class NotifyHandler(BaseHTTPRequestHandler):
    """Serve the static UI and the agreed subscriber contract."""

    server: NotifyServer

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        path = urlsplit(self.path).path
        if path == "/api/subscribers":
            names = self.server.store.list_names()
            self._send_json(
                HTTPStatus.OK,
                {"subscribers": [{"name": name} for name in names], "count": len(names)},
            )
            return

        static_files = {
            "/": ("index.html", "text/html; charset=utf-8"),
            "/app.js": ("app.js", "text/javascript; charset=utf-8"),
            "/styles.css": ("styles.css", "text/css; charset=utf-8"),
        }
        static_file = static_files.get(path)
        if static_file is None:
            self._send_error(HTTPStatus.NOT_FOUND, "not_found", "Ресурс не найден.")
            return

        filename, content_type = static_file
        body = (STATIC_DIR / filename).read_bytes()
        self._send(HTTPStatus.OK, body, content_type)

    def do_POST(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        if urlsplit(self.path).path != "/api/subscribers":
            self._send_error(HTTPStatus.NOT_FOUND, "not_found", "Ресурс не найден.")
            return

        raw_length = self.headers.get("Content-Length")
        try:
            length = int(raw_length or "0")
        except ValueError:
            self._send_error(
                HTTPStatus.BAD_REQUEST,
                "invalid_body",
                "Некорректная длина тела.",
            )
            return
        if length > MAX_BODY_BYTES:
            self._send_error(
                HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                "payload_too_large",
                "Тело запроса слишком большое.",
            )
            return

        try:
            payload = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_error(
                HTTPStatus.BAD_REQUEST,
                "invalid_json",
                "Ожидается JSON-объект.",
            )
            return
        if not isinstance(payload, dict):
            self._send_error(
                HTTPStatus.BAD_REQUEST,
                "invalid_json",
                "Ожидается JSON-объект.",
            )
            return

        try:
            name, created = self.server.store.add(payload.get("name"))
        except InvalidNameError as error:
            self._send_error(HTTPStatus.BAD_REQUEST, "invalid_name", str(error))
            return

        status = HTTPStatus.CREATED if created else HTTPStatus.OK
        self._send_json(status, {"subscriber": {"name": name}, "created": created})

    def _send_error(self, status: HTTPStatus, code: str, message: str) -> None:
        self._send_json(status, {"error": {"code": code, "message": message}})

    def _send_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self._send(status, body, "application/json; charset=utf-8")

    def _send(self, status: HTTPStatus, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        """Keep automated checks quiet; the demo prints its own useful steps."""


def create_server(host: str, port: int, store: SubscriberStore) -> NotifyServer:
    server = NotifyServer((host, port), NotifyHandler)
    server.store = store
    return server


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Notify Mini Practice 5 server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8000, type=int)
    parser.add_argument("--data", default=".data/subscribers.json", type=Path)
    args = parser.parse_args()

    server = create_server(args.host, args.port, SubscriberStore(args.data))
    print(f"Notify Mini: http://{args.host}:{server.server_port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

