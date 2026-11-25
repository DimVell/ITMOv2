---
name: notify-mini
description: Use ONLY when the user asks questions about the Notify Mini subscription service under practices/practice_03/lab/demo. Reads code/tests/README and answers with file:line evidence; never edits demo during comparisons.
---

# Notify Mini Skill

Use when: the user asks about behavior of the demo subscription service (subscribe, duplicates, empty names, persistence, tests, CI) in `practices/practice_03/lab/demo`.

Constraints:
- Read-only: do not modify files under `lab/demo` during checks.
- Answers must cite `file:line` from the repository.
- If info is missing, respond: «В предоставленных материалах нет ответа».

Key references:
- `service.py` lines 1–8: `subscribers` set; `subscribe(name)` trims, raises on empty, adds to set, returns `{ "subscribed": True }`.
- `test_service.py`: `SubscribeTest` verifies empty raises, duplicates not added, success case.
- `README.md`: test command `make test`.

Expected Q&A patterns:
- Empty name behavior → ValueError("empty name") (service.py:5–6).
- Duplicate subscribe → no duplicates due to set semantics (service.py:1,7; test_service.py).
- Persistence across restarts → not persisted; in-memory (README.md:2).
- How to run tests → `make test` (README.md:6).
