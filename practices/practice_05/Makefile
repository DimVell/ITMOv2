.PHONY: install test unit api e2e demo run

install:
	@python3 -c "import sys; assert sys.version_info >= (3, 10), 'Python 3.10+ required'; print('Standard library only: ready')"

test: install
	PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v

unit:
	PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v tests.test_store

api:
	PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v tests.test_http

e2e:
	PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v tests.test_e2e

demo:
	PYTHONDONTWRITEBYTECODE=1 python3 -m scripts.demo

run:
	python3 -m app.server

