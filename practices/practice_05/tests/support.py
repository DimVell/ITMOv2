"""Shared helpers for HTTP and end-to-end checks."""

from __future__ import annotations

import json
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from http.client import HTTPResponse
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from app.server import create_server
from app.store import SubscriberStore


@contextmanager
def running_server(store: SubscriberStore) -> Iterator[str]:
    server = create_server("127.0.0.1", 0, store)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def request_json(
    url: str,
    *,
    method: str = "GET",
    payload: object | None = None,
) -> tuple[int, dict[str, Any]]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = Request(
        url,
        data=body,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    try:
        response: HTTPResponse = urlopen(request, timeout=2)  # noqa: S310 - local test server
    except HTTPError as error:
        with error:
            return error.code, json.loads(error.read())
    with response:
        return response.status, json.loads(response.read())

