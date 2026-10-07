SHELL := /bin/sh

ROOT := $(shell git rev-parse --show-toplevel 2>/dev/null || pwd)
OC_DIR := $(ROOT)/.opencode
P4_DIR := $(ROOT)/practices/practice_04
PROOFS := $(P4_DIR)/proofs

.PHONY: all install verify mcp-success mcp-error mcp-connected skill-run hook-install clean

all: verify

install:
	@echo "[install] Installing Node deps for MCP..."
	@npm --prefix $(OC_DIR) i --silent
	@mkdir -p $(PROOFS)

mcp-connected:
	@echo "[mcp] list servers"
	@mkdir -p $(PROOFS)
	@opencode mcp list > $(PROOFS)/mcp-list.txt

mcp-success:
	@echo "[mcp] mini-echo success (direct handler)"
	@mkdir -p $(PROOFS)
	@node $(P4_DIR)/scripts/test-mini-echo.js success > $(PROOFS)/mini-echo.success.json

mcp-error:
	@echo "[mcp] mini-echo error (expected, direct handler)"
	@mkdir -p $(PROOFS)
	@node $(P4_DIR)/scripts/test-mini-echo.js error > $(PROOFS)/mini-echo.error.txt || true

skill-run:
	@echo "[skill] notify-mini read-only check"
	@mkdir -p $(PROOFS)
	@opencode run --dir $(ROOT)/practices/practice_03/lab/demo \
	  --agent local-guide \
	  --model ollama/itmo-agent \
	  --format json \
	  "Прочитай README.md инструментом read. Назови команду тестирования со ссылкой на файл" \
	  > $(PROOFS)/notify-mini.read-check.jsonl

verify: install mcp-connected mcp-success mcp-error skill-run
	@echo "[verify] Done. Proofs in $(PROOFS)"

hook-install:
	@echo "[hook] Installing pre-commit hook (local)"
	@install -m 0755 $(P4_DIR)/hooks/pre-commit $(ROOT)/.git/hooks/pre-commit

clean:
	@rm -rf $(PROOFS)
	@echo "[clean] Removed proofs"
