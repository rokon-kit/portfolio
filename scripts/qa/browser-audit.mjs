#!/usr/bin/env node
/**
 * Browser audit — real mouse/keyboard input driven through the Chrome DevTools Protocol.
 *
 * Checks, per viewport: hydration, horizontal overflow, header fit, hit-target sizes,
 * axe-core (WCAG 2 A/AA + best practice), computed text contrast, skip link, navigation and
 * scroll-spy, mobile drawer (focus trap, Escape, scroll lock), hero layer filter, architecture
 * inspector, contact-form validation, link integrity, reduced-motion, no-JS render, console
 * and network cleanliness; plus case-study and 404 pages. Writes screenshots and
 * audit-results.json into --out.
 *
 * Usage (against a production build, which has no dev-server HMR noise):
 *   npm run build && npm run start -- -p 3100
 *   npm i --no-save axe-core                      # does not modify package.json
 *   node scripts/qa/browser-audit.mjs --base http://localhost:3100 --out docs/qa/m3
 *
 * Use `localhost`, not `127.0.0.1`: Next 16's dev server blocks cross-origin dev resources,
 * which stops React hydrating. Requires Google Chrome (headless). The contact form's valid
 * submit is deliberately not exercised — it would launch the local mail client.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at !== -1 && argv[at + 1] ? argv[at + 1] : fallback;
};

const BASE = flag('base', 'http://localhost:3000');
const OUT = flag('out', 'qa-output');
const WIDTHS = flag('widths', '320,390,768,1024,1440').split(',').map(Number);
const SP = mkdtempSync(join(tmpdir(), 'portfolio-audit-'));
mkdirSync(OUT, { recursive: true });

const require = createRequire(import.meta.url);
let axeSource;
try {
  axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
} catch {
  console.error('axe-core is not installed. Run: npm i --no-save axe-core');
  process.exit(1);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=9444', `--user-data-dir=${SP}`, '--disable-features=ExternalProtocolDialog', 'about:blank'], { stdio: 'ignore' });
let ver;
for (let i = 0; i < 60; i++) { try { ver = await (await fetch('http://127.0.0.1:9444/json/version')).json(); break; } catch { await sleep(200); } }
if (!ver) { console.log('chrome failed to start'); chrome.kill(); process.exit(1); }

async function openPage(width, height, mobile) {
  const tgt = await (await fetch('http://127.0.0.1:9444/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(tgt.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map();
  const log = { console: [], exceptions: [], failed: [], bad: [], requests: 0 }; const reqUrl = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') log.exceptions.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    else if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) log.console.push(`${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description).join(' ')}`);
    else if (m.method === 'Log.entryAdded' && ['error', 'warning'].includes(m.params.entry.level)) log.console.push(`log ${m.params.entry.level}: ${m.params.entry.text} ${m.params.entry.url || ''}`);
    else if (m.method === 'Network.requestWillBeSent') reqUrl.set(m.params.requestId, m.params.request.url);
    else if (m.method === 'Network.loadingFailed') log.failed.push(`${m.params.type} ${m.params.errorText || '(no error text)'} ${m.params.canceled ? '(canceled)' : ''} ${reqUrl.get(m.params.requestId) || ''}`);
    else if (m.method === 'Network.responseReceived') { log.requests++; if (m.params.response.status >= 400) log.bad.push(`${m.params.response.status} ${m.params.response.url}`); }
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) return { __error: r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text }; return r.result?.result?.value; };
  for (const d of ['Runtime', 'Log', 'Network', 'Page']) await send(`${d}.enable`);
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  const rect = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}})()`);
  const clickAt = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  };
  const click = async (sel) => {
    await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(e&&getComputedStyle(e).position!=='fixed'&&!e.closest('.precision-rail,.mobile-drawer'))e.scrollIntoView({block:'center',behavior:'instant'})})()`);
    await sleep(120);
    const r = await rect(sel); if (!r || r.w === 0) return false;
    const x = r.x + r.w / 2, y = r.y + r.h / 2;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    return true;
  };
  const mouse = (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 });
  const key = async (k, mods = 0) => {
    const map = { Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }, Escape: { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }, Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 } }[k];
    await send('Input.dispatchKeyEvent', { type: 'keyDown', modifiers: mods, ...map });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', modifiers: mods, ...map });
  };
  const type = async (text) => { for (const ch of text) { await send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch, key: ch }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); } };
  const goto = async (path, wait = 2200) => { await send('Page.navigate', { url: BASE + path }); await sleep(wait); };
  const shot = async (name, full = false) => { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, fromSurface: true }); writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, 'base64')); };
  return { send, ev, rect, click, clickAt, mouse, key, type, goto, shot, log, close: () => ws.close() };
}

const report = {};

for (const width of WIDTHS) {
  const height = width >= 1024 ? 900 : 812;
  const p = await openPage(width, height, width < 1024);
  const R = (report[width] = {});
  await p.goto('/');
  R.hydrated = await p.ev(`(()=>{const el=document.querySelector('.mobile-toggle');return !!el && Object.keys(el).some(k=>k.startsWith('__reactProps'))})()`);

  // ---- computed text contrast (axe reports color-contrast as 'incomplete' on translucent backgrounds)
  R.contrast = await p.ev(`(()=>{
    const parse=(c)=>{const m=c.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number);return {r:p[0],g:p[1],b:p[2],a:p[3]===undefined?1:p[3]}};
    const over=(f,b)=>({r:f.r*f.a+b.r*(1-f.a),g:f.g*f.a+b.g*(1-f.a),b:f.b*f.a+b.b*(1-f.a),a:1});
    const lum=(c)=>{const l=[c.r,c.g,c.b].map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*l[0]+0.7152*l[1]+0.0722*l[2]};
    const ratio=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+0.05)/(y+0.05)};
    const canvas={r:11,g:14,b:20,a:1};
    const bgOf=(el)=>{const stack=[];for(let e=el;e;e=e.parentElement){const bg=parse(getComputedStyle(e).backgroundColor);if(bg&&bg.a>0){stack.push(bg);if(bg.a===1)break}}let acc=canvas;for(let i=stack.length-1;i>=0;i--)acc=over(stack[i],acc);return acc};
    const opacityOf=(el)=>{let o=1;for(let e=el;e;e=e.parentElement)o*=parseFloat(getComputedStyle(e).opacity);return o};
    const fails=[];let checked=0;const seen=new Set();
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){const n=walker.currentNode;const t=n.textContent.trim();if(!t)continue;const el=n.parentElement;if(!el||el.closest('.sr-only,[inert],.mobile-drawer,script,style'))continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;const b=el.getBoundingClientRect();if(b.width===0||b.height===0)continue;if(opacityOf(el)<0.9)continue;
      const isSvg=el instanceof SVGElement;const fg=parse(isSvg?cs.fill:cs.color);if(!fg)continue;const bg=bgOf(isSvg?el.closest('figure,div')||el:el);const eff=over(fg,bg);const r=ratio(eff,bg);
      const px=parseFloat(cs.fontSize);const weight=parseInt(cs.fontWeight)||400;const large=px>=24||(px>=18.66&&weight>=700);const need=large?3:4.5;checked++;
      if(r<need){const key=(el.className?.baseVal??el.className)+'|'+r.toFixed(2);if(seen.has(key))continue;seen.add(key);fails.push({text:t.slice(0,36),ratio:+r.toFixed(2),need,px,cls:String(el.className?.baseVal??el.className).split(' ')[0]||el.tagName})}}
    return {checked,fails:fails.slice(0,20),failCount:fails.length}})()`);

  // ---- layout / overflow
  R.scroll = await p.ev(`({inner:innerWidth, doc:document.documentElement.scrollWidth, body:document.body.scrollWidth, height:document.documentElement.scrollHeight})`);
  R.offenders = await p.ev(`(()=>{const W=innerWidth;const out=[];
    const clipped=(el)=>{for(let a=el.parentElement;a&&a!==document.body;a=a.parentElement){const o=getComputedStyle(a);if(/(auto|scroll|hidden|clip)/.test(o.overflowX)){const b=a.getBoundingClientRect();if(b.right<=W+1)return true;}}return false;};
    document.querySelectorAll('body *').forEach(el=>{if(el.closest('.mobile-drawer,.drawer-scrim'))return;const cs=getComputedStyle(el);if(cs.position==='fixed'||cs.display==='none')return;const b=el.getBoundingClientRect();if(b.width>0&&(b.right>W+1||b.left<-1)&&!clipped(el)){out.push((el.tagName+'.'+String(el.className?.baseVal??el.className).split(' ')[0])+' L='+Math.round(b.left)+' R='+Math.round(b.right))}});return out.slice(0,15)})()`);
  R.headerFits = await p.ev(`(()=>{const c=document.querySelector('.rail-container');const kids=[...c.querySelectorAll('.brand-anchor,.rail-telemetry,.desktop-nav,.status-indicator,.mobile-toggle')].filter(e=>getComputedStyle(e).display!=='none');const cb=c.getBoundingClientRect();return {containerRight:Math.round(cb.right),items:kids.map(e=>{const b=e.getBoundingClientRect();return e.className.split(' ')[0]+':'+Math.round(b.left)+'-'+Math.round(b.right)}), brandWraps: document.querySelector('.brand-name').getBoundingClientRect().height<20}})()`);
  R.h1 = await p.ev(`[...document.querySelectorAll('h1')].map(h=>h.textContent.trim().slice(0,50))`);
  R.headings = await p.ev(`[...document.querySelectorAll('h1,h2,h3')].map(h=>h.tagName+' '+h.textContent.trim().slice(0,40))`);
  R.landmarks = await p.ev(`['header','nav','main','footer'].map(t=>t+':'+document.querySelectorAll(t).length).join(' ')`);
  R.fonts = await p.ev(`[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family.replace(/^__/,'').replace(/_[a-z0-9]+(_Fallback)?$/i,'')+' '+f.style)`);
  R.fontVars = await p.ev(`(()=>{const cs=getComputedStyle(document.body);const h=getComputedStyle(document.querySelector('.hero-headline'));return {headlineFamily:h.fontFamily.slice(0,60),bodyFamily:cs.fontFamily.slice(0,60)}})()`);

  // ---- hit targets
  R.targets = await p.ev(`(()=>{const min=innerWidth<1024?44:32;const out=[];
    document.querySelectorAll('a,button,input,select,textarea,summary').forEach(el=>{if(el.closest('[inert]')||el.closest('.mobile-drawer'))return;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')return;if(el.classList.contains('skip-link'))return;const b=el.getBoundingClientRect();if(b.width===0)return;if(b.height<min-0.5||b.width<min-0.5)out.push(String(el.className||el.tagName).split(' ')[0]+' '+Math.round(b.width)+'x'+Math.round(b.height))});
    return {min,count:out.length,sample:[...new Set(out)].slice(0,12)}})()`);

  // ---- axe
  await p.ev(axeSource);
  R.axe = await p.ev(`axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}).then(r=>({violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length,help:v.help,sample:v.nodes.slice(0,3).map(n=>n.target.join(' ')+' :: '+(n.any[0]?.message||n.all[0]?.message||'').slice(0,140))})),passes:r.passes.length,incomplete:r.incomplete.map(i=>i.id+' ('+i.nodes.length+')')}))`);

  await p.shot(`home-${width}-top`);
  await p.shot(`home-${width}-full`, true);

  // ---- keyboard: skip link
  await p.ev('window.scrollTo(0,0);document.activeElement.blur()');
  await p.key('Tab'); await sleep(150);
  R.skipLink = await p.ev(`(()=>{const a=document.activeElement;const b=a.getBoundingClientRect();return {isSkip:a.classList.contains('skip-link'),visibleTop:Math.round(b.top),text:a.textContent.trim()}})()`);
  await p.key('Enter'); await sleep(250);
  R.skipLinkActivated = await p.ev(`({active:document.activeElement.id||document.activeElement.tagName, hash:location.hash})`);
  await p.goto('/', 1500);

  // ---- navigation behaviour
  if (width >= 1100) {
    await p.click('.desktop-nav a[href="/#selected-works"]'); await sleep(1300);
    R.navWorks = await p.ev(`(()=>{const s=document.getElementById('selected-works').getBoundingClientRect().top;return {sectionTop:Math.round(s),railH:document.querySelector('.precision-rail').offsetHeight,current:[...document.querySelectorAll('.desktop-nav [aria-current]')].map(a=>a.textContent.trim()),hash:location.hash}})()`);
    await p.ev(`window.scrollTo(0,document.documentElement.scrollHeight)`); await sleep(500);
    R.navAtBottom = await p.ev(`[...document.querySelectorAll('.desktop-nav [aria-current]')].map(a=>a.textContent.trim())`);
    await p.ev('window.scrollTo(0,0)'); await sleep(400);
    R.navAtTop = await p.ev(`[...document.querySelectorAll('.desktop-nav [aria-current]')].map(a=>a.textContent.trim())`);
    R.drawerHiddenOnDesktop = await p.ev(`(()=>{const d=document.getElementById('site-drawer');const t=document.querySelector('.mobile-toggle');return {toggleDisplay:getComputedStyle(t).display,drawerInert:d.hasAttribute('inert'),drawerVisibility:getComputedStyle(d).visibility}})()`);
  } else {
    R.toggle = await p.rect('.mobile-toggle');
    await p.click('.mobile-toggle'); await sleep(600);
    R.drawerOpen = await p.ev(`(()=>{const d=document.getElementById('site-drawer');const b=d.getBoundingClientRect();const t=document.querySelector('.mobile-toggle');return {open:d.dataset.open,inert:d.hasAttribute('inert'),left:Math.round(b.left),right:Math.round(b.right),vw:innerWidth,expanded:t.getAttribute('aria-expanded'),focusIn:d.contains(document.activeElement),focused:document.activeElement.className,bodyOverflow:document.body.style.overflow}})()`);
    const trail = [];
    for (let i = 0; i < 9; i++) { await p.key('Tab'); trail.push(await p.ev(`document.getElementById('site-drawer').contains(document.activeElement)`)); }
    for (let i = 0; i < 3; i++) { await p.key('Tab', 8); trail.push(await p.ev(`document.getElementById('site-drawer').contains(document.activeElement)`)); }
    R.focusTrap = { steps: trail.length, allInside: trail.every(Boolean) };
    await p.shot(`home-${width}-drawer`);
    await p.key('Escape'); await sleep(500);
    R.escape = await p.ev(`(()=>{const d=document.getElementById('site-drawer');return {open:d.dataset.open,inert:d.hasAttribute('inert'),visibility:getComputedStyle(d).visibility,focusOnToggle:document.activeElement.classList.contains('mobile-toggle'),bodyOverflow:document.body.style.overflow||'(restored)',expanded:document.querySelector('.mobile-toggle').getAttribute('aria-expanded')}})()`);
    await p.click('.mobile-toggle'); await sleep(500);
    await p.click('.drawer-item[href="/#contact-dossier"]'); await sleep(1400);
    R.drawerLink = await p.ev(`(()=>{const d=document.getElementById('site-drawer');return {closed:d.dataset.open==='false',contactTop:Math.round(document.getElementById('contact-dossier').getBoundingClientRect().top),railH:document.querySelector('.precision-rail').offsetHeight,hash:location.hash,bodyOverflow:document.body.style.overflow||'(restored)'}})()`);
    await p.click('.mobile-toggle'); await sleep(400);
    await p.clickAt(6, 300); await sleep(500);
    R.scrimClose = await p.ev(`document.getElementById('site-drawer').dataset.open`);
    // resize to desktop while open closes drawer
    await p.click('.mobile-toggle'); await sleep(400);
  }
  await p.goto('/', 1500);

  // ---- hero layer filter + inspector (real clicks)
  await p.ev(`document.getElementById('hero').scrollIntoView()`);
  await p.click('.layer-btn:nth-child(3)'); await sleep(500);
  R.layerFilter = await p.ev(`({badge:document.querySelector('.hud-badge').textContent.trim(),pressed:[...document.querySelectorAll('.layer-btn')].map(b=>b.getAttribute('aria-pressed')).join(','),hidden:[...document.querySelectorAll('.scene-layer')].map(g=>g.dataset.hidden).join(',')})`);
  // ---- regression guards for defects found in the Milestone 3 prototype-parity review
  R.headerGlass = await p.ev(`(()=>{const b=getComputedStyle(document.querySelector('.precision-rail'),'::before');return {backdropFilter:b.backdropFilter,background:b.backgroundColor}})()`);
  await p.ev(`document.querySelector('.viewport-canvas-container').scrollIntoView({block:'center',behavior:'instant'})`); await sleep(300);
  const stage = await p.rect('.viewport-canvas-container');
  const sig = () => p.ev(`[...document.querySelectorAll('.scene-svg polygon')].slice(0,8).map(x=>x.getAttribute('points')).join('|')`);
  const cx = stage.x + stage.w / 2, cy = stage.y + stage.h / 2;
  const sigRest = await sig();
  await p.mouse('mouseMoved', cx, cy); await p.mouse('mousePressed', cx, cy);
  for (let i = 1; i <= 8; i++) { await p.mouse('mouseMoved', cx + i * 10, cy); await sleep(30); }
  const sigDragging = await sig();
  await p.mouse('mouseReleased', cx + 80, cy); await sleep(300);
  R.heroDrag = { rotatedWhileDragging: sigDragging !== sigRest, cursorGrab: await p.ev(`getComputedStyle(document.querySelector('.viewport-canvas-container')).cursor`), touchAction: await p.ev(`getComputedStyle(document.querySelector('.viewport-canvas-container')).touchAction`) };
  if (width >= 1024) {
    await p.mouse('mouseMoved', stage.x + stage.w * 0.1, cy); await sleep(1200); const sigLeft = await sig();
    await p.mouse('mouseMoved', stage.x + stage.w * 0.9, cy); await sleep(1200); const sigRight = await sig();
    R.heroTilt = { tiltsWithCursor: sigLeft !== sigRight };
  }
  await p.ev(`document.getElementById('systems-topology').scrollIntoView()`); await sleep(300);
  R.inspectorExtras = await p.ev(`(()=>{const t1=document.querySelector('.live-clock')?.textContent||'';const c1=document.querySelector('.readout-code-block code')?.textContent||'';return {clock:t1,codeLines:c1.split('\\n').length,caption:document.querySelector('.code-comment')?.textContent}})()`);
  await sleep(1300);
  R.inspectorExtras.clockAfter1s = await p.ev(`document.querySelector('.live-clock')?.textContent||''`);
  R.inspectorExtras.clockTicks = R.inspectorExtras.clock !== R.inspectorExtras.clockAfter1s;
  R.inspectorExtras.clockFormatOk = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC\+6$/.test(R.inspectorExtras.clockAfter1s);
  await p.click('.interactive-node:nth-of-type(3)'); await sleep(300);
  R.inspector = await p.ev(`({id:document.querySelector('.readout-id').textContent,pressedNodes:[...document.querySelectorAll('.interactive-node')].map(b=>b.getAttribute('aria-pressed')).join(','),pressedViews:[...document.querySelectorAll('.console-tab')].map(b=>b.getAttribute('aria-pressed')).join(','),footer:document.querySelector('.readout-footer').textContent.trim(),usedIn:[...document.querySelectorAll('.used-in-link')].map(a=>a.textContent.trim())})`);
  await p.click('.console-tab:nth-child(3)'); await sleep(300);
  R.inspectorExtras.codePresentAfterSelect = await p.ev(`document.querySelector('.readout-code-block code')?.textContent`) !== '';
  R.inspectorView3 = await p.ev(`({id:document.querySelector('.readout-id').textContent,pressedViews:[...document.querySelectorAll('.console-tab')].map(b=>b.getAttribute('aria-pressed')).join(',')})`);

  // ---- contact form: real input, invalid then keyboard focus
  await p.ev(`document.getElementById('contact-dossier').scrollIntoView()`); await sleep(300);
  await p.click('.btn-submit-transmission'); await sleep(300);
  R.formEmpty = await p.ev(`(()=>{const f=document.querySelector('.blueprint-form');return {errors:[...f.querySelectorAll('.form-error')].map(e=>e.textContent),invalid:[...f.querySelectorAll('[aria-invalid=true]')].map(e=>e.name),focused:document.activeElement.name,describedBy:document.activeElement.getAttribute('aria-describedby')?.length>0}})()`);
  await p.type('Jane'); await p.key('Tab'); await p.type('not-an-email'); await p.key('Tab'); await p.key('Tab'); await p.type('short');
  await p.click('.btn-submit-transmission'); await sleep(300);
  R.formPartial = await p.ev(`(()=>{const f=document.querySelector('.blueprint-form');return {errors:[...f.querySelectorAll('.form-error')].map(e=>e.textContent),focused:document.activeElement.name,nameValue:f.querySelector('[name=name]').value}})()`);
  await p.shot(`home-${width}-form-errors`);

  await p.goto('/', 1500);
  await p.click('.used-in-link'); await sleep(1500);
  R.usedInNav = await p.ev(`({path:location.pathname,h1:document.querySelector('h1')?.textContent.slice(0,40)})`);
  await p.goto('/', 1500);

  // ---- anchors: every in-page link target exists; every internal link resolves
  R.links = await p.ev(`(async()=>{const anchors=[...document.querySelectorAll('a[href]')];const hrefs=[...new Set(anchors.map(a=>a.getAttribute('href')))];const missing=[];const internal=[];const external=[];for(const h of hrefs){if(h.startsWith('/')){const [path,hash]=h.split('#');internal.push(h);if(hash&&(path===''||path==='/')&&!document.getElementById(hash))missing.push(h)}else if(h.startsWith('#')){if(!document.getElementById(h.slice(1)))missing.push(h)}else external.push(h)}
    const statuses={};for(const h of internal){const path=h.split('#')[0]||'/';if(statuses[path]!==undefined)continue;statuses[path]=(await fetch(path)).status}
    return {total:hrefs.length,internal:internal.length,external,missingAnchors:missing,internalStatuses:statuses,targetBlankWithoutRel:anchors.filter(a=>a.target==='_blank'&&!/noopener/.test(a.rel)).length}})()`);

  // ---- reduced motion
  await p.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await p.goto('/', 1200);
  R.reducedMotion = await p.ev(`({smooth:getComputedStyle(document.documentElement).scrollBehavior,dotDuration:getComputedStyle(document.querySelector('.status-dot')||document.body).animationDuration,floatDuration:getComputedStyle(document.querySelector('.scene-float')).animationDuration})`);
  await p.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await p.goto('/', 1200);
  R.motionDefault = await p.ev(`({smooth:getComputedStyle(document.documentElement).scrollBehavior,floatDuration:getComputedStyle(document.querySelector('.scene-float')).animationDuration})`);

  R.consoleBeforeNoJs = { console: [...new Set(p.log.console)], exceptions: [...new Set(p.log.exceptions)], failedRequests: [...new Set(p.log.failed)], badStatus: [...new Set(p.log.bad)], requests: p.log.requests };

  // ---- JS-disabled render (SSR content present)
  await p.send('Emulation.setScriptExecutionDisabled', { value: true });
  await p.goto('/', 1500);
  R.noJs = await p.ev(`({h1:!!document.querySelector('h1')?.textContent.includes('resilient'),dossiers:document.querySelectorAll('.system-dossier-card').length,sceneSvg:!!document.querySelector('.scene-svg'),layersVisible:[...document.querySelectorAll('.scene-layer')].every(g=>g.dataset.hidden==='false'||g.getAttribute('data-hidden')==='false')})`);
  await p.send('Emulation.setScriptExecutionDisabled', { value: false });

  R.consoleAll = { console: [...new Set(p.log.console)], exceptions: [...new Set(p.log.exceptions)], failedRequests: [...new Set(p.log.failed)], badStatus: [...new Set(p.log.bad)], requests: p.log.requests };
  p.close();
}

// ---- case-study + 404 pages at 390 and 1440
for (const width of [390, 1440]) {
  const p = await openPage(width, 900, width < 1024);
  const R = (report[`work-${width}`] = {});
  await p.goto('/work/courseflow');
  R.page = await p.ev(`({title:document.title,h1:document.querySelector('h1')?.textContent,h2s:[...document.querySelectorAll('h2')].map(h=>h.textContent),figure:!!document.querySelector('.schematic-svg'),repoLinks:[...document.querySelectorAll('.dossier-actions a')].map(a=>a.href),pager:[...document.querySelectorAll('.case-pager a')].map(a=>a.getAttribute('href')),docW:document.documentElement.scrollWidth,vw:innerWidth,canonical:document.querySelector('link[rel=canonical]')?.href,ogTitle:document.querySelector('meta[property="og:title"]')?.content,desc:document.querySelector('meta[name=description]')?.content?.slice(0,60)})`);
  await p.ev(axeSource);
  R.axe = await p.ev(`axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}).then(r=>r.violations.map(v=>({id:v.id,nodes:v.nodes.length,sample:v.nodes.slice(0,2).map(n=>n.target.join(' '))})))`);
  await p.shot(`work-${width}-top`); await p.shot(`work-${width}-full`, true);
  await p.click('.case-pager-link.next'); await sleep(1500);
  R.pagerNav = await p.ev(`({path:location.pathname,h1:document.querySelector('h1')?.textContent.slice(0,50)})`);
  await p.goto('/definitely-not-a-page', 1500);
  R.notFound = await p.ev(`({title:document.title,h1:document.querySelector('h1')?.textContent,hasHeader:!!document.querySelector('.precision-rail'),robots:document.querySelector('meta[name=robots]')?.content,docW:document.documentElement.scrollWidth})`);
  await p.shot(`notfound-${width}`);
  R.consoleAll = { console: [...new Set(p.log.console)], exceptions: [...new Set(p.log.exceptions)], badStatus: [...new Set(p.log.bad)] };
  p.close();
}

chrome.kill();
writeFileSync(`${OUT}/audit-results.json`, JSON.stringify(report, null, 2));
console.log(`audit written: ${OUT}/audit-results.json`);
