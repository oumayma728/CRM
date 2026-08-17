import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const PORT = 9230;
const USERDIR = 'C:/Users/HPELIT~1/AppData/Local/Temp/opencode/edge-cdp5';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getTargets() {
  try { return await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch { return []; }
}

async function main() {
  spawn(EDGE, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${USERDIR}`, '--headless=new', '--disable-gpu', '--no-first-run', '--window-size=1440,900', 'about:blank'], { detached: true, stdio: 'ignore' }).unref();
  let targets;
  for (let i = 0; i < 60; i++) { targets = await getTargets(); if (targets.length) break; await sleep(500); }
  if (!targets || !targets.length) { console.log('EDGE: no target'); process.exit(1); }
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise(res => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
  await new Promise(res => ws.onopen = res);
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }))?.result?.value;
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(file, Buffer.from(s.data, 'base64')); };
  const nav = async (url, ms) => { await send('Page.navigate', { url }); await sleep(ms); };
  const waitFor = async (expr, tries = 30) => {
    for (let i = 0; i < tries; i++) {
      const v = await evaluate(expr);
      if (v) return true;
      await sleep(500);
    }
    return false;
  };

  // LOGIN PAGE
  await nav('http://localhost:5173/login', 2000);
  await waitFor(`document.querySelector('form') != null`);
  await sleep(1500);
  const loginInfo = await evaluate(`JSON.stringify({
    url: location.pathname,
    title: document.title,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    hasForm: !!document.querySelector('form'),
    inputs: document.querySelectorAll('input').length,
    rootChildren: document.querySelector('#root') ? document.querySelector('#root').children.length : 0
  })`);
  console.log('LOGIN=' + loginInfo);
  await shot('C:/Users/HPELIT~1/AppData/Local/Temp/opencode/login_final.png');

  // AUTH as admin
  await evaluate(`(async () => { const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:'admin', password:'admin'}) }); const d = await r.json(); localStorage.setItem('crm_token', d.token); })()`);

  for (const [label, path] of [['AGENT', '/agent/audio-analysis'], ['ADMIN', '/admin/analysis'], ['QUALITE', '/qualite/analysis']]) {
    await nav('http://localhost:5173' + path, 2000);
    await waitFor(`location.pathname === '${path}' && (document.querySelector('h1') != null || document.querySelector('input') != null)`);
    await sleep(1500);
    const info = await evaluate(`JSON.stringify({
      url: location.pathname,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      h1: (()=>{ const h=document.querySelector('h1'); return h? h.textContent.trim().slice(0,40) : 'none'; })(),
      dashed: !!document.querySelector('[class*=border-dashed]'),
      darkCardRgbCount: [...document.querySelectorAll('*')].filter(e=>getComputedStyle(e).backgroundColor==='rgb(16, 26, 51)').length,
      rootChildren: document.querySelector('#root') ? document.querySelector('#root').children.length : 0
    })`);
    console.log(label + '=' + info);
    await shot('C:/Users/HPELIT~1/AppData/Local/Temp/opencode/analysis_' + label + '.png');
  }

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });