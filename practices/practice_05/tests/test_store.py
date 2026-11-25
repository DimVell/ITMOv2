from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from app.store import InvalidNameError, SubscriberStore, normalize_name


class NormalizeNameTest(unittest.TestCase):
    def test_collapses_whitespace(self) -> None:
        self.assertEqual(normalize_name("  Anna   Maria  "), "Anna Maria")

    def test_rejects_empty_and_too_long_values(self) -> None:
        for value in ("  ", "x" * 41, None):
            with self.subTest(value=value), self.assertRaises(InvalidNameError):
                normalize_name(value)


class SubscriberStoreTest(unittest.TestCase):
    def test_adds_and_sorts_names(self) -> None:
        store = SubscriberStore()
        self.assertEqual(store.add("zoe"), ("zoe", True))
        self.assertEqual(store.add("Anna"), ("Anna", True))
        self.assertEqual(store.list_names(), ["Anna", "zoe"])

    def test_duplicate_is_case_insensitive_and_keeps_original_name(self) -> None:
        store = SubscriberStore()
        self.assertEqual(store.add("Анна"), ("Анна", True))
        self.assertEqual(store.add("  АННА  "), ("Анна", False))
        self.assertEqual(store.list_names(), ["Анна"])

    def test_persists_names_between_instances(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            data_file = Path(directory) / "subscribers.json"
            SubscriberStore(data_file).add("Lin")
            self.assertEqual(SubscriberStore(data_file).list_names(), ["Lin"])


if __name__ == "__main__":
    unittest.main()

