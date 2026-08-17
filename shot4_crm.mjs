import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const PORT = 9226;
const USERDIR = 'C:/Users/HPELIT~1/AppData/Local/Temp/opencode/edge-cdp4';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getTargets() {
  try { return await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch { return []; }
}

async function main() {
  spawn(EDGE, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${USERDIR}`, '--headless=new', '--disable-gpu', '--no-first-run', 'about:blank'], { detached: true, stdio: 'ignore' }).unref();
  let targets;
  for (let i = 0; i < 30; i++) { targets = await getTargets(); if (targets.length) break; await sleep(500); }
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise(res => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
  await new Promise(res => ws.onopen = res);
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }))?.result?.value;
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(file, Buffer.from(s.data, 'base64')); };

  // login page
  await send('Page.navigate', { url: 'http://localhost:5173/login' });
  await sleep(5000);
  const loginInfo = await evaluate(`JSON.stringify({
    bodyBg: getComputedStyle(document.body).backgroundColor,
    hasForm: !!document.querySelector('form'),
    inputs: document.querySelectorAll('input').length,
    ctaText: (()=>{ const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Lancer')); return b? getComputedStyle(b).backgroundImage : 'none'; })()
  })`);
  console.log('LOGIN=' + loginInfo);
  await shot('C:/Users/HPELIT~1/AppData/Local/Temp/opencode/shot_login2.png');

  // login
  await evaluate(`(async () => { const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:'admin', password:'admin'}) }); const d = await r.json(); localStorage.setItem('crm_token', d.token); })()`);

  for (const [label, path] of [['AGENT', '/agent/audio-analysis'], ['ADMIN', '/admin/analysis'], ['QUALITE', '/qualite/analysis']]) {
    await evaluate(`location.href = '${path}'`);
    await sleep(6000);
    const info = await evaluate(`JSON.stringify({
      url: location.pathname,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      cards: (()=>{ const c=document.querySelectorAll('[class*=bg-card]').length; const m=[...document.querySelectorAll('div')].filter(d=>getComputedStyle(d).backgroundColor==='rgb(16, 26, 51)').length; return {tokenBg:c, cardRgb:m}; })(),
      uploadBox: (()=>{ const el=document.querySelector('[class*=border-dashed]'); return el? getComputedStyle(el).borderColor : 'none'; })(),
      formBg: (()=>{ const els=[...document.querySelectorAll('div')].filter(d=>getComputedStyle(d).backgroundColor==='rgb(16, 26, 51)'); return els.length; })()
    })`);
    console.log(label + '=' + info);
    await shot('C:/Users/HPELIT~1/AppData/Local/Temp/opencode/shot_analysis_' + label.toLowerCase() + '.png');
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });