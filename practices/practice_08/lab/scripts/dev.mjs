import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const children = [];
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
}
function run(command, args) {
  const child = spawn(command, args, { cwd, stdio: 'inherit', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
  children.push(child);
  child.on('error', error => { console.error(error.message); process.exitCode = 1; stop(); });
  child.on('exit', code => { if (!stopping) { process.exitCode = code || 0; stop(); } });
  return child;
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

const api = run('python3', ['scripts/serve_api.py']);
try {
  let ready = false;
  for (let i = 0; i < 80 && !stopping; i++) {
    if (api.exitCode !== null) throw new Error('API не запущен. Проверьте сообщение выше и свободен ли порт 8000.');
    try { ready = (await fetch('http://127.0.0.1:8000/api/subscribers')).ok; } catch { /* Wait for Python. */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready && !stopping) throw new Error('Не удалось дождаться запуска API.');
  if (!stopping) run(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort']);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
  stop();
}
