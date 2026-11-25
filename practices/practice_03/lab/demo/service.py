"""Simple subscription service with minimal persistence.

Subscribers are stored in-memory and mirrored to a JSON file in the same
directory as this module. This keeps behavior simple while allowing the
list to survive process restarts for the demo.
"""

from pathlib import Path
import json

_DATA_FILE = Path(__file__).with_name("subscribers.json")

def _load() -> set[str]:
    if not _DATA_FILE.exists():
        return set()
    try:
        data = json.loads(_DATA_FILE.read_text(encoding="utf-8"))
        if isinstance(data, list):
            # Ensure only strings and strip whitespace
            return {str(x).strip() for x in data if str(x).strip()}
    except Exception:
        # Corrupt or unreadable file: start fresh for robustness in demo
        return set()
    return set()

def _save(values: set[str]) -> None:
    # Write atomically to reduce risk of partial writes in demos
    tmp = _DATA_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(sorted(values), ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(_DATA_FILE)


subscribers = _load()


def subscribe(name):
    trimmed = name.strip()
    if not trimmed:
        raise ValueError("empty name")
    subscribers.add(trimmed)
    _save(subscribers)
    return {"subscribed": True}
