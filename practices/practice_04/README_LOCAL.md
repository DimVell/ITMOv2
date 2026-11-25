# Практика 4: локальный чек‑лист

Что подготовлено в этом репозитории:

- Правила и связки: `AGENTS.md`.
- Skills: `.opencode/skills/` (itmo-practice-03, notify-mini).
- MCP: локальные `git`, `filesystem-demo` и собственный `mini-echo`.
- Рефлексия: `practices/practice_04/reflection.md`.

Как запустить проверки (локально):

1. Убедитесь, что установлены node>=18, python3.
2. Установите зависимости MCP SDK: `npm --prefix .opencode i`.
3. Проверьте MCP соединения: `opencode doctor` (необязательно).
4. Протестируйте `mini-echo`:
   - Успех: `opencode call mini-echo.mini_echo '{"text":"hello"}'`
   - Ошибка: `opencode call mini-echo.mini_echo '{"text":""}'` (ожидаем `empty text`).
5. Проверьте read-only демо (из practice_03/lab):
   - `opencode run --dir practices/practice_03/lab/demo --agent local-guide --model ollama/itmo-agent --format json "Прочитай README.md инструментом read. Назови команду тестирования со ссылкой на файл"`

Примечание: пуш без явного запроса не выполняется.
