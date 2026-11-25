# Воспроизводимые доказательства

## До исправлений

```bash
git show HEAD:practices/practice_06/lab/service.py
cd practices/practice_06/lab
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v test_security.py
```

Зафиксированный результат исходной версии: 11 тестов, 17 failures и 2 errors. Полные эффекты
и исходные строки перечислены в `../REPORT_01.md`.

## После исправлений

```bash
make step6
```

Зафиксированный результат: 29 тестов, `OK`. Сопоставление атак и controls находится в
`../REPORT_02.md`.

## LLM

Подготовлены точные normal/injected/after inputs. VseLLM вернул HTTP `402`
(`planner-run-error.json`), поэтому использован уже установленный локальный fallback.

Три реальных запуска `shop-planner` выполнены через `opencode 1.18.34` и
`ollama/itmo-agent`; фактические ответы, token counts и результат executor сохранены в
`planner-local-results.json`. Poisoned review получил `refuse`, а post-fix context — точный
`read_file(files/alice/receipt.txt)` и Alice receipt. Отдельно опасные решения принудительно
проверены в `test_executor_rejects_dangerous_or_cross_account_decisions`.

