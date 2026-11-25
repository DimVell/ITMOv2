from __future__ import annotations

import unittest
from urllib.request import urlopen

from app.store import SubscriberStore
from tests.support import request_json, running_server


class SubscriberJourneyTest(unittest.TestCase):
    def test_page_to_api_happy_path_and_validation_boundary(self) -> None:
        with running_server(SubscriberStore()) as base_url:
            with urlopen(f"{base_url}/", timeout=2) as response:  # noqa: S310
                page = response.read().decode("utf-8")
            self.assertIn('id="subscriber-form"', page)
            self.assertIn('id="subscriber-list"', page)
            self.assertIn('src="/app.js"', page)

            status, created = request_json(
                f"{base_url}/api/subscribers",
                method="POST",
                payload={"name": "Mira"},
            )
            self.assertEqual((status, created["created"]), (201, True))

            status, listing = request_json(f"{base_url}/api/subscribers")
            self.assertEqual((status, listing["count"]), (200, 1))
            self.assertEqual(listing["subscribers"][0]["name"], "Mira")

            status, boundary = request_json(
                f"{base_url}/api/subscribers",
                method="POST",
                payload={"name": "x" * 41},
            )
            self.assertEqual(status, 400)
            self.assertEqual(boundary["error"]["code"], "invalid_name")


if __name__ == "__main__":
    unittest.main()

