---
name: itmo-practice-03
description: Use ONLY when the user asks to run Practice 03 (локальные модели) under practices/practice_03. Sets up Ollama/Qwen, runs lab experiments (baseline/system/temperature), creates itmo-local/itmo-agent, updates REPORT.md, and verifies read-only local-guide via opencode run.
---

# Practice 03 Skill (Local Models)

Use when: the user says to perform Practice 03 tasks in `practices/practice_03`, asks to prepare/local-run Qwen via Ollama, run experiments in `lab/`, or update `REPORT.md` with factual results.

Do not commit or push unless explicitly asked. Show diffs before writing. Do not modify input files in `lab/demo/` during comparisons.

## Checklist

- Verify environment and versions: Ollama, OpenCode, Python.
- Ensure Ollama server is running locally with `OLLAMA_NO_CLOUD=1`.
- Confirm model weights (default `qwen3.5:4b`) are available.
- Run `make install` and `make test` from `practices/practice_03/lab/`.
- Build `itmo-local` and run a sanity prompt.
- Run experiments via `experiment.py` and save results into `lab/results/`.
- Build `itmo-agent` (64k) and verify via `ollama show/run/ps`.
- Run a read-only OpenCode check against `lab/demo/`.
- Update `practices/practice_03/REPORT.md` with only factual results and your chat conclusions.

## Directories

- Lab working dir: `practices/practice_03/lab`
- Demo (read-only during comparisons): `practices/practice_03/lab/demo`

## Commands (baseline)

Run from `practices/practice_03/lab`:

```
make install
make test

mkdir -p results
ollama create itmo-local -f Modelfile
ollama run itmo-local "Объясни разницу между моделью и сервером двумя предложениями"
curl --fail http://localhost:11434/api/tags
python3 experiment.py --mode baseline --output results/baseline.json
python3 experiment.py --mode system --output results/system.json
```

Temperature comparison (system mode, seeds 42/43/44):

```
python3 experiment.py --mode system --temperature 0.8 --seed 42 --output results/hot42.json
python3 experiment.py --mode system --temperature 0.8 --seed 43 --output results/hot43.json
python3 experiment.py --mode system --temperature 0.8 --seed 44 --output results/hot44.json
python3 experiment.py --mode system --temperature 0.2 --seed 42 --output results/cold42.json
python3 experiment.py --mode system --temperature 0.2 --seed 43 --output results/cold43.json
python3 experiment.py --mode system --temperature 0.2 --seed 44 --output results/cold44.json
```

## 64k Agent (OpenCode)

```
ollama create itmo-agent -f Modelfile.agent
ollama show itmo-agent
ollama run itmo-agent "Ответь: READY"
ollama ps
```

Read-only check (from `practices/practice_03/lab`):

```
opencode run --dir demo --agent local-guide --model ollama/itmo-agent --format json \
  "Прочитай README.md инструментом read. Назови команду тестирования со ссылкой на файл" \
  > results/read-check.jsonl
```

Confirm that `read-check.jsonl` contains a factual answer and explicit `read` tool invocation record. If it hangs, re-run with `OPENCODE_LOG_LEVEL=debug` and log the outcome.

## REPORT.md

- Record hardware, versions, model ID/quant, context lengths, and the reasons for the chosen configuration.
- Include actual outputs and metrics from result files: `wall_seconds`, `load_seconds`, `total_seconds`, `decode_tokens_per_second`.
- For temperature runs, perform three warmed repetitions per configuration and report the median if time allows.
- For OpenCode read-only validation, include the text answer and the tool call evidence; do not include internal model reasoning.

## Safety and Constraints

- Never modify `lab/demo/` during model comparisons.
- Do not pass gold answers or REPORT.md to the tested model.
- Use local endpoints (Ollama) and disable cloud features during the exercise.
- Avoid committing unless explicitly requested by the user.

## Troubleshooting

- Ollama API: `curl --fail http://localhost:11434/api/tags`; `ollama list`; `ollama show itmo-agent`; `ollama ps`.
- If `opencode run` hangs: increase timeout, enable debug logs, verify provider baseURL/local endpoint, and disable external MCP/plugins in the test environment.
