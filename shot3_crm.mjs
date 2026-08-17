import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const PORT = 9225;
const USERDIR = 'C:/Users/HPELIT~1/AppData/Local/Temp/opencode/edge-cdp3';
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

  await send('Page.navigate', { url: 'http://localhost:5173/login' });
  await sleep(3500);
  await evaluate(`(async () => { const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:'admin', password:'admin'}) }); const d = await r.json(); localStorage.setItem('crm_token', d.token); location.href='/agent/contacts'; })()`);
  await sleep(8000);

  const pageInfo = await evaluate(`JSON.stringify({
    url: location.pathname,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    cards: document.querySelectorAll('.bg-card').length,
    scrollH: document.body.scrollHeight
  })`);
  console.log('PAGE=' + pageInfo);
  await shot('C:/Users/HPELIT~1/AppData/Local/Temp/opencode/shot_contacts.png');

  // open modal
  await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Nouveau Contact')); if(b) b.click(); })()`);
  await sleep(1200);
  const modalOpen = await evaluate(`JSON.stringify({
    visible: !!document.querySelector('h2'),
    title: (()=>{ const h=[...document.querySelectorAll('h2')].find(x=>x.textContent==='Nouveau Contact'); return h? h.textContent : 'none'; })(),
    bodyOverflow: document.body.style.overflow,
    inputs: document.querySelectorAll('input').length,
    labels: document.querySelectorAll('label').length,
    backdropBg: (()=>{ const els=[...document.querySelectorAll('div')].filter(d=>d.className.includes('bg-black/60')); return els.length? getComputedStyle(els[0]).backgroundColor : 'none'; })()
  })`);
  console.log('MODAL_OPEN=' + modalOpen);
  await shot('C:/Users/HPELIT~1/AppData/Local/Temp/opencode/shot_contact_modal.png');

  // fill form and save
  await evaluate(`(() => { const ins=document.querySelectorAll('input'); if(ins.length>=3){ ins[0].value='Société Test CDP'; ins[0].dispatchEvent(new Event('input',{bubbles:true})); } const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Enregistrer')); if(b) b.click(); })()`);
  await sleep(1200);
  const afterSave = await evaluate(`JSON.stringify({
    modalGone: ![...document.querySelectorAll('h2')].some(h=>h.textContent==='Nouveau Contact'),
    bodyOverflow: document.body.style.overflow
  })`);
  console.log('AFTER_SAVE=' + afterSave);

  // reopen and test Escape
  await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Nouveau Contact')); if(b) b.click(); })()`);
  await sleep(800);
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
  await sleep(600);
  const afterEscape = await evaluate(`JSON.stringify({ modalGone: ![...document.querySelectorAll('h2')].some(h=>h.textContent==='Nouveau Contact'), bodyOverflow: document.body.style.overflow })`);
  console.log('AFTER_ESCAPE=' + afterEscape);

  // reopen and test backdrop click
  await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Nouveau Contact')); if(b) b.click(); })()`);
  await sleep(800);
  await evaluate(`(() => { const overlay=[...document.querySelectorAll('div')].find(d=>d.className.includes('bg-black/60')); if(overlay) overlay.dispatchEvent(new MouseEvent('click',{bubbles:true})); })()`);
  await sleep(600);
  const afterBackdrop = await evaluate(`JSON.stringify({ modalGone: ![...document.querySelectorAll('h2')].some(h=>h.textContent==='Nouveau Contact') })`);
  console.log('AFTER_BACKDROP=' + afterBackdrop);

  await shot('C:/Users/HPELIT~1/AppData/Local/Temp/opencode/shot_contacts_after.png');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
