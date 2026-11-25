# Отчёт о приёмке ДЗ 5

Дата локальной проверки: 2026-10-29.

## Соответствие критериям

| Критерий | Доказательство | Результат |
|---|---|---|
| Другой SDD-framework | `.kiro/steering`, `.kiro/specs`, `COMPARISON.md` | Kiro применён и сравнен с OpenSpec |
| Две спеки до кода | `specs/before/*`, `specs/agreement.md` | расхождения и решения сохранены |
| Общий контракт | `specs/common-contract.md` | статусы, JSON, ошибки и инварианты согласованы |
| UI и логика | `app/static/*`, `app/store.py`, `app/server.py` | рабочая форма, список, API и JSON persistence |
| Сквозные проверки | `tests/test_e2e.py`, `tests/test_http.py` | happy path, duplicate, invalid name и malformed JSON |
| Рефлексия и демо | `reflection.md`, `DEMO.md`, `scripts/demo.py` | воспроизводимые материалы для защиты |

## Фактические проверки

```text
$ make step5
Ran 9 tests in 2.037s
OK

$ make demo
Новое имя: HTTP 201, created=True
Дубликат: HTTP 200, created=False
Пустое имя: HTTP 400, code=invalid_name
Итог: HTTP 200, subscribers=[{'name': 'Анна'}]

$ node --check practices/practice_05/app/static/app.js
exit 0

$ git diff --check
exit 0
```

`ruff` локально отсутствует (`No module named ruff`), поэтому без запроса не устанавливался.
Python-код фактически импортирован и выполнен девятью тестами; отдельная проверка строк проекта
длиннее 100 символов после форматирования замечаний не нашла.

## Сохранённое старое поведение

- пустое имя отклоняется;
- повтор не создаёт вторую запись;
- demo-файлы `practices/practice_03/lab/demo` не изменены.

