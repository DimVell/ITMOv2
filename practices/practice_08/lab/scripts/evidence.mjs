import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = fileURLToPath(new URL('../../evidence/', import.meta.url));
const url = 'http://127.0.0.1:5179';
const processes = [];
await mkdir(output, { recursive: true });

function start(command, args, env = {}) {
  const process = spawn(command, args, {
    cwd: root, env: { ...globalThis.process.env, ...env }, stdio: 'pipe',
  });
  let logs = '';
  process.stdout.on('data', chunk => { logs += chunk; });
  process.stderr.on('data', chunk => { logs += chunk; });
  processes.push(process);
  return () => { if (process.exitCode !== null) throw new Error(logs); };
}

async function ready(address, check) {
  for (let attempt = 0; attempt < 160; attempt++) {
    check();
    try { if ((await fetch(address)).ok) return; } catch { /* Server is starting. */ }
    await new Promise(resolve => setTimeout(resolve, 125));
  }
  throw new Error(`Server did not become ready: ${address}`);
}

let browser;
try {
  const checkApi = start('python3', ['scripts/serve_api.py', '--port', '8109', '--temporary'], { PYTHONDONTWRITEBYTECODE: '1' });
  await ready('http://127.0.0.1:8109/api/subscribers', checkApi);
  const checkWeb = start(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5179', '--strictPort'], { NOTIFY_API_TARGET: 'http://127.0.0.1:8109' });
  await ready(url, checkWeb);
  browser = await chromium.launch();
  const screenshots = [];

  for (const state of ['empty', 'input', 'loading', 'success', 'error']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'ru-RU', reducedMotion: 'reduce' });
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/api/subscribers', async route => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ json: { subscribers: [], count: 0 } });
      }
      if (state === 'loading') await gate;
      return route.fulfill(state === 'error'
        ? { status: 500, json: { error: { code: 'server_error', message: 'Не удалось сохранить подписчика. Попробуйте ещё раз.' } } }
        : { status: 201, json: { subscriber: { name: 'Анна Иванова' }, created: true } });
    });
    await page.goto(url);
    const field = page.getByRole('textbox', { name: 'Имя подписчика' });
    await page.getByRole('button', { name: 'Добавить подписчика' }).waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.querySelector('button[type=submit]').disabled);
    if (state !== 'empty') await field.fill('Анна Иванова');
    if (['loading', 'success', 'error'].includes(state)) {
      await page.getByRole('button', { name: 'Добавить подписчика' }).click();
      if (state === 'success') await page.getByRole('status').waitFor();
      if (state === 'error') await page.getByRole('alert').waitFor();
      if (state === 'loading') await page.getByRole('button', { name: 'Добавляем…' }).waitFor();
    }
    const name = `${state}.png`;
    await page.screenshot({ path: output + name, fullPage: true, animations: 'disabled' });
    screenshots.push({ file: name, data: 'mock API responses matching the real contract' });
    release();
    await page.close();
  }

  const realPage = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'ru-RU', reducedMotion: 'reduce' });
  await realPage.goto(url);
  for (const name of ['Анна Иванова', 'Дарья Соколова', 'Михаил Петров']) {
    await realPage.getByRole('textbox', { name: 'Имя подписчика' }).fill(name);
    await realPage.getByRole('button', { name: 'Добавить подписчика' }).click();
    await realPage.getByRole('listitem').filter({ hasText: name }).waitFor();
  }
  await realPage.reload();
  await realPage.getByRole('listitem').filter({ hasText: 'Михаил Петров' }).waitFor();
  await realPage.screenshot({ path: output + 'real-api.png', fullPage: true, animations: 'disabled' });
  screenshots.push({ file: 'real-api.png', data: 'real Python API, three POST requests and reload' });
  await realPage.setViewportSize({ width: 375, height: 1000 });
  await realPage.screenshot({ path: output + 'mobile.png', fullPage: true, animations: 'disabled' });
  screenshots.push({ file: 'mobile.png', data: 'real Python API' });
  await realPage.close();

  const prototype = await browser.newPage({ viewport: { width: 1440, height: 1080 }, reducedMotion: 'reduce' });
  await prototype.goto(url + '/design/prototype.html');
  await prototype.screenshot({ path: output + 'prototype.png', fullPage: true, animations: 'disabled' });
  screenshots.push({ file: 'prototype.png', data: 'AI-authored standalone prototype' });
  await prototype.close();

  let tests = null;
  try {
    const report = JSON.parse(await readFile(root + 'test-results/results.json', 'utf8'));
    tests = { passed: report.stats.expected, failed: report.stats.unexpected, skipped: report.stats.skipped, duration_ms: report.stats.duration };
  } catch { /* Screenshots can be regenerated independently of the tests. */ }
  await writeFile(output + 'verification.json', JSON.stringify({
    generated_at: new Date().toISOString(), command: 'npm run evidence',
    tests, real_api: { added: 3, present_after_reload: true }, screenshots,
  }, null, 2) + '\n');
  console.log(`Saved ${screenshots.length} screenshots and verification.json to practices/practice_08/evidence`);
} finally {
  await browser?.close();
  for (const child of processes.reverse()) child.kill('SIGTERM');
}
