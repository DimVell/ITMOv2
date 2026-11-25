from __future__ import annotations

import json
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from app.store import SubscriberStore
from tests.support import request_json, running_server


class SubscriberApiTest(unittest.TestCase):
    def setUp(self) -> None:
        self.server_context = running_server(SubscriberStore())
        self.base_url = self.server_context.__enter__()

    def tearDown(self) -> None:
        self.server_context.__exit__(None, None, None)

    def test_create_duplicate_and_list(self) -> None:
        status, created = request_json(
            f"{self.base_url}/api/subscribers",
            method="POST",
            payload={"name": "  Ann  "},
        )
        self.assertEqual(status, 201)
        self.assertEqual(created, {"subscriber": {"name": "Ann"}, "created": True})

        status, duplicate = request_json(
            f"{self.base_url}/api/subscribers",
            method="POST",
            payload={"name": "ann"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(duplicate, {"subscriber": {"name": "Ann"}, "created": False})

        status, listing = request_json(f"{self.base_url}/api/subscribers")
        self.assertEqual(status, 200)
        self.assertEqual(listing, {"subscribers": [{"name": "Ann"}], "count": 1})

    def test_rejects_empty_name_with_contract_error(self) -> None:
        status, payload = request_json(
            f"{self.base_url}/api/subscribers",
            method="POST",
            payload={"name": " "},
        )
        self.assertEqual(status, 400)
        self.assertEqual(payload["error"]["code"], "invalid_name")

    def test_rejects_malformed_json(self) -> None:
        request = Request(
            f"{self.base_url}/api/subscribers",
            data=b"{broken",
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with self.assertRaises(HTTPError) as captured:
            urlopen(request, timeout=2)  # noqa: S310 - local test server
        error = captured.exception
        with error:
            self.assertEqual(error.code, 400)
            self.assertEqual(json.loads(error.read())["error"]["code"], "invalid_json")


if __name__ == "__main__":
    unittest.main()

