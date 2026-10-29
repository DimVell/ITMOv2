"""Subscriber domain logic and JSON persistence."""

from __future__ import annotations

import json
import threading
from pathlib import Path

MAX_NAME_LENGTH = 40


class InvalidNameError(ValueError):
    """Raised when a subscriber name violates the public contract."""


def normalize_name(value: object) -> str:
    """Normalize a subscriber name or raise a contract-level validation error."""
    if not isinstance(value, str):
        raise InvalidNameError("Имя должно быть строкой.")

    normalized = " ".join(value.split())
    if not normalized:
        raise InvalidNameError("Введите имя подписчика.")
    if len(normalized) > MAX_NAME_LENGTH:
        message = f"Имя должно быть не длиннее {MAX_NAME_LENGTH} символов."
        raise InvalidNameError(message)
    return normalized


class SubscriberStore:
    """Thread-safe subscriber collection with optional JSON persistence."""

    def __init__(self, data_file: Path | None = None) -> None:
        self._data_file = data_file
        self._lock = threading.RLock()
        self._subscribers: dict[str, str] = {}
        self._load()

    def _load(self) -> None:
        if self._data_file is None or not self._data_file.exists():
            return

        try:
            values = json.loads(self._data_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return

        if not isinstance(values, list):
            return
        for value in values:
            try:
                name = normalize_name(value)
            except InvalidNameError:
                continue
            self._subscribers.setdefault(name.casefold(), name)

    def _save(self) -> None:
        if self._data_file is None:
            return

        self._data_file.parent.mkdir(parents=True, exist_ok=True)
        temporary = self._data_file.with_suffix(f"{self._data_file.suffix}.tmp")
        temporary.write_text(
            json.dumps(self.list_names(), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        temporary.replace(self._data_file)

    def add(self, value: object) -> tuple[str, bool]:
        """Add a normalized name and return ``(stored_name, created)``."""
        name = normalize_name(value)
        key = name.casefold()
        with self._lock:
            existing = self._subscribers.get(key)
            if existing is not None:
                return existing, False
            self._subscribers[key] = name
            self._save()
            return name, True

    def list_names(self) -> list[str]:
        """Return names in deterministic, case-insensitive order."""
        with self._lock:
            return sorted(self._subscribers.values(), key=str.casefold)

