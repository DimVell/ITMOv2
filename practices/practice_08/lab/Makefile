.PHONY: install api dev build test report

install:
	npm ci
	npx playwright install chromium

api:
	PYTHONDONTWRITEBYTECODE=1 python3 scripts/serve_api.py

dev:
	npm run dev

build:
	npm run build

test:
	npm test

report:
	npm run test:report
