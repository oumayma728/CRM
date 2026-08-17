import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const PORT = 9224;
const USERDIR = 'C:/Users/HPELIT~1/AppData/Local/Temp/opencode/edge-cdp2';
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

  // login
  await nav('http://localhost:5173/login', 3500);
  async function nav(url, ms) { await send('Page.navigate', { url }); await sleep(ms); }
  await evaluate(`(async () => { const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:'admin', password:'admin'}) }); const d = await r.json(); localStorage.setItem('crm_token', d.token); location.href='/admin/messages'; })()`);
  await sleep(8000);

  const chat = await evaluate(`JSON.stringify({
    url: location.pathname,
    listBg: (()=>{ const el=document.querySelector('[data-slot=select-trigger]'); return el? getComputedStyle(el).backgroundColor+'; '+getComputedStyle(el).color : 'none'; })(),
    textarea: (()=>{ const ta=document.querySelector('textarea'); return ta? getComputedStyle(ta).color+' | '+getComputedStyle(ta).backgroundColor : 'no-textarea'; })(),
    sendBtn: (()=>{ const b=[...document.querySelectorAll('button')].find(x=>x.querySelector('svg')); return 'find'); })()
  })`);

  const rows = await evaluate(`JSON.stringify((()=>{ const r=[]; document.querySelectorAll('button').forEach(b=>{ if(b.textContent.trim().length && b.textContent.length<30) r.push({t:b.textContent.trim(),bg:getComputedStyle(b).backgroundImage, cls: b.className.slice(0,80)}); }); return r.slice(4,10); })()`);

  // capture conversation input colors
  const convInput = await evaluate(`(()=>{ const ta=document.querySelector('textarea')||document.querySelector('input'); if(!ta) return 'none'; const cs=getComputedStyle(ta); return JSON.stringify({bg:cs.backgroundColor, col:cs.color, ph:cs.placeholderColor||'n/a'}); })()`);

  console.log('CHAT=' + chat);
  console.log('CONV_INPUT=' + convInput);
  console.log('BTNS=' + rows);

  // quality dashboard
  await evaluate(`location.href = '/qualite/dashboard'`);
  await sleep(7000);
  const qual = await evaluate(`JSON.stringify({ url: location.pathname, bg: getComputedStyle(document.body).backgroundColor, inputs: document.querySelectorAll('input,select,textarea').length, sel: (()=>{ const el=document.querySelector('select,input'); return el? getComputedStyle(el).color : 'none'; })() })`);
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('C:/Users/HPELIT~1/AppData/Local/Temp/opencode/shot3_quality.png', Buffer.from(shot2.data, 'base64'));
  console.log('QUALITY=' + qual);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });