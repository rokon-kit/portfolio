#!/usr/bin/env node
/**
 * Scene audit — drives the Strata sculpture at /lab/system in a real (headless) Chrome with real
 * mouse, touch and keyboard input, and asserts behaviour. Writes screenshots and
 * scene-audit-results.json into --out and exits non-zero if any check fails.
 *
 *   ENABLE_SCENE_LAB=true npm run build && npm run start -- -p 3100     # or `npm run dev`
 *   npm i --no-save axe-core                                            # optional, adds axe checks
 *   node scripts/qa/scene-audit.mjs --base http://localhost:3100 --out docs/qa/m4/audit
 *
 * Notes
 *  - Headless Chrome renders WebGL in software (SwiftShader). Draw calls, triangles, geometry and
 *    memory counts are exact; frame *rates* are not representative of a real GPU.
 *  - Use `localhost`, not `127.0.0.1` (Next 16 dev blocks cross-origin dev resources).
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at !== -1 && argv[at + 1] ? argv[at + 1] : fallback;
};
const BASE = flag('base', 'http://localhost:3000');
const OUT = flag('out', 'qa-output/scene');
mkdirSync(OUT, { recursive: true });
const TMP = mkdtempSync(join(tmpdir(), 'scene-audit-'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let axeSource = null;
try {
  const require = createRequire(import.meta.url);
  const { readFileSync } = await import('node:fs');
  axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
} catch {
  console.log('(axe-core not installed — skipping axe checks; run `npm i --no-save axe-core` to enable)');
}

/* ------------------------------------------------------------------ */
/* Results                                                              */
/* ------------------------------------------------------------------ */

const checks = [];
const notes = {};
function check(name, ok, detail = '') {
  checks.push({ name, ok: Boolean(ok), detail: String(detail) });
  console.log(`${ok ? '  ✔' : '  ✖'} ${name}${detail ? `  — ${detail}` : ''}`);
}

/* ------------------------------------------------------------------ */
/* Chrome / CDP                                                         */
/* ------------------------------------------------------------------ */

const ENV_NOISE = [/GPU stall due to ReadPixels/i, /GL Driver Message/i, /Automatic fallback to software WebGL/i];
const GPU_FLAGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

async function launch(flags, port) {
  const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', `--remote-debugging-port=${port}`, `--user-data-dir=${join(TMP, `profile-${port}`)}`, ...flags, 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 80; i++) {
    try {
      await fetch(`http://127.0.0.1:${port}/json/version`);
      break;
    } catch {
      await sleep(200);
    }
  }
  return {
    kill: () => chrome.kill(),
    async page({ width, height, mobile = false, dsf = 1, reducedMotion = false }) {
      const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      await new Promise((r) => (ws.onopen = r));
      let id = 0;
      const pending = new Map();
      const log = { console: [], noise: [], exceptions: [], failed: [] };
      ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.id && pending.has(m.id)) {
          pending.get(m.id)(m);
          pending.delete(m.id);
          return;
        }
        const push = (text) => (ENV_NOISE.some((re) => re.test(text)) ? log.noise : log.console).push(text.slice(0, 300));
        if (m.method === 'Runtime.exceptionThrown') log.exceptions.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300));
        else if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) push(`${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description).join(' ')}`);
        else if (m.method === 'Log.entryAdded' && ['error', 'warning'].includes(m.params.entry.level)) push(`log ${m.params.entry.level}: ${m.params.entry.text}`);
        else if (m.method === 'Network.loadingFailed') log.failed.push(m.params.errorText || 'failed');
      };
      const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
      for (const d of ['Runtime', 'Log', 'Network', 'Page', 'Performance', 'HeapProfiler']) await send(`${d}.enable`);
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dsf, mobile });
      if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      if (reducedMotion) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

      const ev = async (expr) => {
        const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        if (r.result?.exceptionDetails) return { __error: (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text).slice(0, 200) };
        return r.result?.result?.value;
      };
      const api = {
        send, ev, log,
        close: () => ws.close(),
        goto: async (path) => { await send('Page.navigate', { url: `${BASE}${path}` }); await sleep(1200); },
        waitFor: async (expr, timeout = 40000, step = 250) => {
          const t0 = Date.now();
          while (Date.now() - t0 < timeout) {
            const v = await ev(expr);
            if (v && !v.__error) return v;
            await sleep(step);
          }
          return false;
        },
        setViewport: (w, h, m = false) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile: m }),
        mouse: (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 }),
        touch: (type, x, y) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] }),
        key: async (key, code, vk, text) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk, ...(text && type === 'keyDown' ? { text } : {}) }); },
        /** Screenshot of an element (clip uses page coordinates, so add the scroll offset). */
        shotOf: async (selector, name) => {
          const r = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height}})()`);
          if (!r) return;
          const shot = await send('Page.captureScreenshot', { format: 'png', clip: { ...r, scale: 1 } });
          writeFileSync(join(OUT, `${name}.png`), Buffer.from(shot.result.data, 'base64'));
        },
        shot: async (name) => {
          const shot = await send('Page.captureScreenshot', { format: 'png' });
          writeFileSync(join(OUT, `${name}.png`), Buffer.from(shot.result.data, 'base64'));
        },
        heap: async () => { await send('HeapProfiler.collectGarbage'); return (await send('Runtime.getHeapUsage')).result?.usedSize ?? 0; },
        metrics: async () => Object.fromEntries((await send('Performance.getMetrics')).result.metrics.map((m) => [m.name, m.value])),
      };
      return api;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Page helpers                                                         */
/* ------------------------------------------------------------------ */

const SCENE = 'window.__SYSTEM_SCENE__';
const view = (p) => p.ev(`document.querySelector('.system-experience')?.dataset.sceneView`);
const renderer = (p) => p.ev(`document.querySelector('.system-experience')?.dataset.sceneRenderer`);
const state = (p) => p.ev(`${SCENE}?.getState()`);
const info = (p) => p.ev(`${SCENE}?.info()`);
const cam = (p) => p.ev(`${SCENE}?.camera()`);
const IDS = ['frontend', 'auth', 'services', 'database', 'cache', 'search', 'messaging'];

async function loadLab(p) {
  const t0 = Date.now();
  await p.goto('/lab/system');
  const ok = await p.waitFor(`document.querySelector('.system-experience')?.dataset.sceneRenderer === 'ready'`, 60000);
  await p.ev(`document.querySelector('.system-stage')?.scrollIntoView({block:'center',behavior:'instant'})`);
  await sleep(700);
  return { ready: Boolean(ok), ms: Date.now() - t0 };
}

async function settle(p, ms = 3200) { await sleep(ms); }

async function pointOf(p, id) { return p.ev(`${SCENE}?.screenPositionOf('${id}')`); }

async function tap(p, x, y, touch) {
  if (touch) { await p.touch('touchStart', x, y); await sleep(40); await p.touch('touchEnd', x, y); }
  else { await p.mouse('mouseMoved', x, y); await p.mouse('mousePressed', x, y); await sleep(30); await p.mouse('mouseReleased', x, y); }
}

const clickButtonText = (p, text) => p.ev(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===${JSON.stringify(text)});if(!b)return false;b.scrollIntoView({block:'center',behavior:'instant'});b.click();return true})()`);

/* ------------------------------------------------------------------ */
/* Main browser                                                         */
/* ------------------------------------------------------------------ */

console.log(`\nScene audit against ${BASE}\n`);
const main = await launch(GPU_FLAGS, 9921);

for (const cfg of [
  { label: 'desktop-1440', width: 1440, height: 900, mobile: false, quality: 'high' },
  { label: 'tablet-768', width: 768, height: 1024, mobile: false, quality: 'high' },
  { label: 'mobile-390', width: 390, height: 844, mobile: true, quality: 'low' },
]) {
  console.log(`\n[${cfg.label}]`);
  const p = await main.page(cfg);
  const touch = cfg.mobile;
  const { ready, ms } = await loadLab(p);
  check(`${cfg.label}: scene reaches "ready"`, ready, `${ms} ms incl. page load`);
  if (!ready) { p.close(); continue; }

  const quality = await p.ev(`document.querySelector('.system-experience').dataset.sceneQuality`);
  check(`${cfg.label}: quality tier is ${cfg.quality}`, quality === cfg.quality, quality);

  const gl = await info(p);
  notes[cfg.label] = { gl, readyMs: ms };
  check(`${cfg.label}: draw calls ≤ 30`, gl.calls <= 30, `${gl.calls}`);
  check(`${cfg.label}: triangles ≤ 20,000`, gl.triangles <= 20000, `${gl.triangles}`);
  check(`${cfg.label}: no textures allocated`, gl.textures <= 1, `${gl.textures}`);

  const dims = await p.ev(`(()=>{const s=document.querySelector('.system-stage').getBoundingClientRect();const c=document.querySelector('.system-stage canvas').getBoundingClientRect();return {sw:s.width,sh:s.height,cw:c.width,ch:c.height,canvases:document.querySelectorAll('canvas').length,overflow:document.documentElement.scrollWidth-innerWidth}})()`);
  check(`${cfg.label}: canvas fills its stage`, Math.abs(dims.sw - dims.cw) < 1.5 && Math.abs(dims.sh - dims.ch) < 1.5, `${Math.round(dims.cw)}×${Math.round(dims.ch)}`);
  check(`${cfg.label}: exactly one canvas`, dims.canvases === 1, dims.canvases);
  check(`${cfg.label}: no horizontal overflow`, dims.overflow <= 0, dims.overflow);

  // Whole sculpture inside the frame.
  const inside = await p.ev(`(()=>{const r=document.querySelector('.system-stage').getBoundingClientRect();return ${JSON.stringify(IDS)}.map(id=>{const q=${SCENE}.screenPositionOf(id);return {id,ok:q&&q.x>r.left&&q.x<r.right&&q.y>r.top&&q.y<r.bottom}})})()`);
  check(`${cfg.label}: every component centre is inside the frame`, inside.every((x) => x.ok), inside.filter((x) => !x.ok).map((x) => x.id).join(',') || 'all 7');

  await p.shotOf('.system-stage', `${cfg.label}-1-overview`);
  const baseCam = await cam(p);

  // Idle motion: subtle, never spinning.
  const yaws = [];
  for (let i = 0; i < 16; i++) { yaws.push((await cam(p)).yaw); await sleep(250); }
  const range = Math.max(...yaws) - Math.min(...yaws);
  check(`${cfg.label}: idle motion is subtle (yaw range ${range.toFixed(2)}°)`, range > 0.02 && range < 3.5, `${range.toFixed(2)}°`);

  /* Hover (mouse only) */
  if (!touch) {
    const pos = await pointOf(p, 'services');
    await p.mouse('mouseMoved', pos.x, pos.y);
    await sleep(900);
    const st = await state(p);
    const labels = await p.ev(`document.querySelectorAll('.system-label[data-visible=true]').length`);
    const cursor = await p.ev(`getComputedStyle(document.querySelector('.system-stage canvas')).cursor`);
    check(`${cfg.label}: hovering highlights the component`, st.hovered === 'services', st.hovered);
    check(`${cfg.label}: hover shows exactly one label`, labels === 1, labels);
    check(`${cfg.label}: hover cursor is a pointer`, cursor === 'pointer', cursor);
    await p.shotOf('.system-stage', `${cfg.label}-2-hover`);
    await p.mouse('mouseMoved', 5, 5);
    await sleep(400);
    check(`${cfg.label}: leaving clears hover`, (await state(p)).hovered === null);
  }

  /* Picking with real pointer / touch input */
  const picks = {};
  // The pick map answers "what would a click here select?" for a grid over the stage. From it we
  // find, per component, the largest square of pixels that selects it — a real tap target — and
  // require that to meet WCAG 2.2 SC 2.5.8 (24×24 CSS px). Real input is then sent to that spot.
  // The map is taken immediately before each tap because the idle camera drifts slightly.
  const largestSquare = (map, id) => {
    const dp = new Array(map.cols * map.rows).fill(0);
    let best = { size: 0, r: 0, c: 0 };
    for (let r = 0; r < map.rows; r++) {
      for (let c = 0; c < map.cols; c++) {
        const i = r * map.cols + c;
        if (map.ids[i] !== id) continue;
        dp[i] = 1 + (r > 0 && c > 0 ? Math.min(dp[i - map.cols], dp[i - 1], dp[i - map.cols - 1]) : 0);
        if (dp[i] > best.size) best = { size: dp[i], r, c };
      }
    }
    const half = best.size / 2;
    return {
      sizePx: best.size * map.step,
      x: map.left + (best.c - half + 1) * map.step + half * map.step,
      y: map.top + (best.r - half + 1) * map.step + half * map.step,
    };
  };
  const targets = {};
  for (const id of IDS) {
    await p.ev(`${SCENE}.reset()`);
    await settle(p, 2600);
    targets[id] = largestSquare(await p.ev(`${SCENE}.pickMap(4)`), id);
    if (!touch) {
      // A mouse pointer nudges the camera (parallax): park it on the target, let the camera settle, re-measure.
      await p.mouse('mouseMoved', targets[id].x, targets[id].y);
      await sleep(800);
      targets[id] = largestSquare(await p.ev(`${SCENE}.pickMap(4)`), id);
    }
    await tap(p, targets[id].x, targets[id].y, touch);
    await sleep(500);
    picks[id] = (await state(p)).selected;
  }
  notes[cfg.label].targetSizePx = Object.fromEntries(IDS.map((id) => [id, targets[id].sizePx]));
  const small = IDS.filter((id) => targets[id].sizePx < 24);
  check(
    `${cfg.label}: every component has a tap target of at least 24×24 px (WCAG 2.5.8)`,
    small.length === 0,
    small.length ? `too small: ${small.map((id) => `${id} ${targets[id].sizePx}px`).join(', ')}` : `smallest ${Math.min(...IDS.map((id) => targets[id].sizePx))}px, largest ${Math.max(...IDS.map((id) => targets[id].sizePx))}px`,
  );
  notes[cfg.label].picks = picks;
  const misses = IDS.filter((id) => picks[id] !== id);
  check(`${cfg.label}: every component is reachable by clicking it`, misses.length === 0, misses.length ? `missed: ${misses.map((m) => `${m}→${picks[m]}`).join(', ')}` : 'all 7 selected by real input');

  /* Selected + camera transition */
  await p.ev(`${SCENE}.reset()`);
  await settle(p, 2600);
  const overviewCam = await cam(p);
  await p.ev(`${SCENE}.select('database')`);
  await settle(p);
  const selCam = await cam(p);
  check(`${cfg.label}: selecting moves the camera closer`, selCam.radius < overviewCam.radius - 1, `${overviewCam.radius.toFixed(1)} → ${selCam.radius.toFixed(1)}`);
  check(`${cfg.label}: view is "selected"`, (await view(p)) === 'selected');
  await p.shotOf('.system-stage', `${cfg.label}-3-selected-database`);
  const panelText = await p.ev(`document.querySelector('.system-detail .readout-id')?.textContent`);
  check(`${cfg.label}: DOM panel names the selection`, /DATABASE/.test(panelText || ''), panelText);

  /* Architecture view via real button click */
  await p.ev(`${SCENE}.reset()`);
  await settle(p, 2600);
  await clickButtonText(p, 'ARCHITECTURE VIEW');
  await settle(p, 3800);
  check(`${cfg.label}: architecture view engages`, (await view(p)) === 'architecture');
  check(`${cfg.label}: exploded fully`, (await p.ev(`${SCENE}.explode()`)) > 0.97);
  const archLabels = await p.ev(`document.querySelectorAll('.system-label[data-visible=true]').length`);
  check(`${cfg.label}: all 7 labels shown in architecture view`, archLabels === 7, archLabels);
  await p.shotOf('.system-stage', `${cfg.label}-4-architecture`);
  await p.ev(`${SCENE}.select('auth')`);
  await settle(p, 3200);
  check(`${cfg.label}: architecture + selection`, (await view(p)) === 'architecture-selected');
  await p.shotOf('.system-stage', `${cfg.label}-5-architecture-selected-auth`);

  /* Return to the original composition */
  await clickButtonText(p, 'RETURN TO OVERVIEW');
  await settle(p, 4200);
  const back = await cam(p);
  const backExplode = await p.ev(`${SCENE}.explode()`);
  check(`${cfg.label}: RETURN restores overview`, (await view(p)) === 'overview' && backExplode < 0.02);
  check(`${cfg.label}: camera returns to the original composition`, Math.abs(back.radius - baseCam.radius) < 0.6 && Math.abs(back.yaw - baseCam.yaw) < 3, `Δradius ${(back.radius - baseCam.radius).toFixed(2)}, Δyaw ${(back.yaw - baseCam.yaw).toFixed(2)}°`);
  await p.shotOf('.system-stage', `${cfg.label}-6-returned`);

  /* Escape key returns too */
  await p.ev(`${SCENE}.select('search'); ${SCENE}.setMode('architecture');`);
  await settle(p, 1500);
  await p.ev(`document.querySelector('.system-experience .interactive-node')?.focus()`);
  await p.key('Escape', 'Escape', 27);
  await sleep(500);
  const afterEsc = await state(p);
  check(`${cfg.label}: Escape returns to overview`, afterEsc.mode === 'overview' && afterEsc.selected === null);

  /* Drag to orbit */
  await p.ev(`${SCENE}.reset()`);
  await settle(p, 2600);
  const stage = await p.ev(`(()=>{const r=document.querySelector('.system-stage').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height*0.5}})()`);
  const yaw0 = (await cam(p)).yaw;
  const scrollBefore = await p.ev('scrollY');
  if (touch) {
    await p.touch('touchStart', stage.x, stage.y);
    for (let i = 1; i <= 12; i++) { await p.touch('touchMove', stage.x + i * 10, stage.y); await sleep(30); }
    await p.touch('touchEnd', stage.x, stage.y);
  } else {
    await p.mouse('mouseMoved', stage.x, stage.y);
    await p.mouse('mousePressed', stage.x, stage.y);
    for (let i = 1; i <= 12; i++) { await p.mouse('mouseMoved', stage.x + i * 10, stage.y); await sleep(30); }
    await p.mouse('mouseReleased', stage.x + 120, stage.y);
  }
  await settle(p, 2500);
  const yaw1 = (await cam(p)).yaw;
  check(`${cfg.label}: dragging orbits the camera`, Math.abs(yaw1 - yaw0) > 4, `Δyaw ${(yaw1 - yaw0).toFixed(1)}°`);
  check(`${cfg.label}: a drag does not select anything`, (await state(p)).selected === null);
  if (touch) check(`${cfg.label}: horizontal touch drag does not scroll the page`, (await p.ev('scrollY')) === scrollBefore);
  await p.shotOf('.system-stage', `${cfg.label}-7-orbited`);
  await p.ev(`${SCENE}.reset()`);
  await settle(p, 3000);
  check(`${cfg.label}: reset clears the manual orbit`, Math.abs((await cam(p)).yaw - yaw0) < 3, `${((await cam(p)).yaw - yaw0).toFixed(2)}°`);

  /* Frame cost */
  const stats = await p.ev(`(()=>{const rows=Object.fromEntries([...document.querySelectorAll('.lab-stat')].map(e=>[e.querySelector('dt').textContent,e.querySelector('dd').textContent]));return rows})()`);
  notes[cfg.label].stats = stats;
  // Median of several samples: a single wall-clock reading can include OS preemption.
  const cpuSamples = [];
  for (let i = 0; i < 9; i++) { cpuSamples.push(await p.ev(`${SCENE}.cpuMs()`)); await sleep(300); }
  cpuSamples.sort((a, b) => a - b);
  const cpu = cpuSamples[Math.floor(cpuSamples.length / 2)];
  notes[cfg.label].cpuMs = { median: cpu, min: cpuSamples[0], max: cpuSamples[cpuSamples.length - 1] };
  check(`${cfg.label}: scene CPU per frame is small (median ${cpu.toFixed(2)} ms)`, cpu < 4, `${cpu.toFixed(2)} ms (min ${cpuSamples[0].toFixed(2)}, max ${cpuSamples[cpuSamples.length - 1].toFixed(2)})`);

  /* Accessibility of the surrounding page */
  if (axeSource) {
    await p.ev(axeSource);
    await p.ev(`${SCENE}.select('services')`);
    await sleep(600);
    const axe = await p.ev(`axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}).then(r=>r.violations.map(v=>({id:v.id,nodes:v.nodes.length,sample:v.nodes.slice(0,2).map(n=>n.target.join(' '))})))`);
    check(`${cfg.label}: axe finds no violations (component selected)`, Array.isArray(axe) && axe.length === 0, Array.isArray(axe) ? JSON.stringify(axe).slice(0, 300) : JSON.stringify(axe));
  }
  if (cfg.width <= 768) {
    const small = await p.ev(`(()=>{const out=[];document.querySelectorAll('.system-experience button,.system-experience a,.lab button').forEach(el=>{const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')return;const b=el.getBoundingClientRect();if(b.width===0)return;if(b.height<43.5||b.width<43.5)out.push(el.textContent.trim().slice(0,24)+' '+Math.round(b.width)+'x'+Math.round(b.height))});return out.slice(0,8)})()`);
    check(`${cfg.label}: interactive controls are ≥ 44px`, small.length === 0, small.join('; '));
  }

  check(`${cfg.label}: no console errors, warnings or exceptions`, p.log.console.length === 0 && p.log.exceptions.length === 0, [...p.log.console, ...p.log.exceptions].slice(0, 3).join(' | '));
  check(`${cfg.label}: no failed network requests`, p.log.failed.length === 0, p.log.failed.slice(0, 3).join(','));
  notes[cfg.label].envNoise = [...new Set(p.log.noise)].length;
  p.close();
}

/* ------------------------------------------------------------------ */
/* Desktop-only behaviours                                              */
/* ------------------------------------------------------------------ */

console.log('\n[desktop behaviours]');
{
  const p = await main.page({ width: 1440, height: 900 });
  const { ready } = await loadLab(p);
  if (ready) {
    /* Keyboard-only exploration of the DOM interface */
    await p.ev(`document.querySelectorAll('.system-panel .interactive-node')[0].focus()`);
    await p.key('Tab', 'Tab', 9);
    const focused = await p.ev(`document.activeElement?.dataset?.component`);
    check('keyboard: Tab moves through the component list', focused === 'auth', focused);
    await p.key('Enter', 'Enter', 13, '\r');
    await sleep(600);
    check('keyboard: Enter selects the focused component', (await state(p)).selected === 'auth');
    check('keyboard: selection is announced to assistive technology', /Authentication selected/.test(await p.ev(`document.querySelector('.system-experience [role=status].sr-only')?.textContent`) || ''));
    await p.key('Escape', 'Escape', 27);
    await sleep(600);
    check('keyboard: Escape returns to the overview', (await state(p)).selected === null && (await view(p)) === 'overview');

    /* Every component can be explored from the DOM list alone */
    const all = [];
    for (const id of IDS) {
      await p.ev(`document.querySelector('.system-panel [data-component=${id}]').click()`);
      await sleep(250);
      const t = await p.ev(`({name:document.querySelector('.system-detail .readout-id').textContent,role:document.querySelector('.system-role')?.textContent?.length||0,pressed:document.querySelector('.system-panel [data-component=${id}]').getAttribute('aria-pressed')})`);
      all.push(t.pressed === 'true' && t.role > 60);
    }
    check('DOM interface: all 7 components are selectable and explained', all.every(Boolean), all.map(Number).join(''));

    /* Honest claims: no project usage claimed for cache / search / messaging */
    const notes3 = await p.ev(`(()=>{const out={};for(const id of ['cache','search','messaging']){document.querySelector('.system-panel [data-component='+id+']').click();out[id]=document.querySelector('.system-detail .system-note')?.textContent||''}return out})()`);
    await sleep(300);
    check('honesty: cache / search / messaging are marked as reference concepts', Object.values(notes3).every((t) => /Reference concept/.test(t)), JSON.stringify(notes3).slice(0, 120));
    check('honesty: the conceptual-system disclaimer is visible', /not the architecture of any employer/i.test(await p.ev(`document.querySelector('.system-disclaimer')?.textContent`) || ''));

    /* Gallery: one screenshot per component, for the record */
    for (const id of IDS) {
      await p.ev(`${SCENE}.reset()`);
      await sleep(600);
      await p.ev(`${SCENE}.select('${id}')`);
      await sleep(3600);
      await p.shotOf('.system-stage', `gallery-selected-${id}`);
    }
    await p.ev(`${SCENE}.reset()`);
    await sleep(3000);
    await p.shotOf('.system-experience', 'gallery-full-interface');

    /* Stats for the record */
    notes.desktopMetrics = await p.metrics();
  }
  p.close();
}

/* Reduced motion: no idle animation, camera snaps -------------------- */
console.log('\n[reduced motion]');
{
  const p = await main.page({ width: 1440, height: 900, reducedMotion: true });
  const { ready } = await loadLab(p);
  check('reduced motion: scene reaches "ready"', ready);
  if (ready) {
    check('reduced motion: motion mode is "reduced"', (await p.ev(`document.querySelector('.system-experience').dataset.sceneMotion`)) === 'reduced');
    await sleep(1500);
    const f0 = (await info(p)).frame;
    await sleep(3000);
    const f1 = (await info(p)).frame;
    check('reduced motion: no frames are rendered while idle', f1 - f0 <= 2, `${f1 - f0} frames in 3 s`);
    const overviewRadius = (await cam(p)).radius;
    await p.ev(`${SCENE}.select('search')`);
    await sleep(700);
    const c1 = await cam(p);
    await sleep(900);
    const c2 = await cam(p);
    check('reduced motion: camera snaps to the selection (no easing)', Math.abs(c1.radius - c2.radius) < 0.05 && Math.abs(c1.yaw - c2.yaw) < 0.2 && c1.radius < overviewRadius - 5, `radius ${overviewRadius.toFixed(1)} → ${c1.radius.toFixed(1)}`);
    const f2 = (await info(p)).frame;
    await sleep(2000);
    check('reduced motion: rendering stops again after the transition', (await info(p)).frame - f2 <= 2);
    await p.shotOf('.system-stage', 'reduced-motion-selected-search');
    await p.ev(`${SCENE}.reset()`);
    await sleep(800);
    check('reduced motion: return is immediate', (await view(p)) === 'overview');
    check('reduced motion: no console errors', p.log.console.length === 0 && p.log.exceptions.length === 0, p.log.console.slice(0, 2).join('|'));
  }
  p.close();
}

/* Off-screen pausing ------------------------------------------------- */
console.log('\n[render gating]');
{
  const p = await main.page({ width: 1440, height: 900 });
  const { ready } = await loadLab(p);
  if (ready) {
    await sleep(1500);
    const a0 = (await info(p)).frame;
    await sleep(2500);
    const a1 = (await info(p)).frame;
    check('gating: frames advance while the stage is visible', a1 - a0 >= 4, `${a1 - a0} frames / 2.5 s`);
    await p.ev(`window.scrollTo(0, document.documentElement.scrollHeight)`);
    await sleep(1200);
    const b0 = (await info(p)).frame;
    await sleep(2500);
    const b1 = (await info(p)).frame;
    check('gating: rendering stops while the stage is scrolled off-screen', b1 - b0 <= 2, `${b1 - b0} frames / 2.5 s`);
    await p.ev(`document.querySelector('.system-stage').scrollIntoView({block:'center',behavior:'instant'})`);
    await sleep(1000);
    const c0 = (await info(p)).frame;
    await sleep(2500);
    const c1 = (await info(p)).frame;
    check('gating: rendering resumes when the stage returns', c1 - c0 >= 4, `${c1 - c0} frames`);
    await clickButtonText(p, 'PAUSE RENDERING');
    await sleep(800);
    const d0 = (await info(p)).frame;
    await sleep(2000);
    check('gating: the lab pause switch stops rendering', (await info(p)).frame - d0 <= 2);
  }
  p.close();
}

/* Resize + tier switching ------------------------------------------- */
console.log('\n[resize]');
{
  const p = await main.page({ width: 1440, height: 900 });
  const { ready } = await loadLab(p);
  if (ready) {
    for (const [w, h, mobile] of [[1024, 768, false], [1440, 900, false], [900, 700, false]]) {
      await p.setViewport(w, h, mobile);
      await sleep(1800);
      const d = await p.ev(`(()=>{const s=document.querySelector('.system-stage').getBoundingClientRect();const c=document.querySelector('.system-stage canvas')?.getBoundingClientRect();const r=document.querySelector('.system-stage').getBoundingClientRect();const inside=${JSON.stringify(IDS)}.every(id=>{const q=${SCENE}.screenPositionOf(id);return q&&q.x>r.left&&q.x<r.right&&q.y>r.top&&q.y<r.bottom});return {match:c&&Math.abs(s.width-c.width)<1.5&&Math.abs(s.height-c.height)<1.5,inside,overflow:document.documentElement.scrollWidth-innerWidth}})()`);
      check(`resize ${w}×${h}: canvas follows the stage, sculpture stays in frame, no overflow`, d.match && d.inside && d.overflow <= 0, JSON.stringify(d));
    }
    // Crossing the mobile breakpoint swaps to the simplified tier and back.
    await p.setViewport(390, 844, true);
    await p.waitFor(`document.querySelector('.system-experience').dataset.sceneQuality === 'low' && document.querySelector('.system-experience').dataset.sceneRenderer === 'ready'`, 30000);
    const low = await info(p);
    check('resize: narrow viewport switches to the simplified tier', (await p.ev(`document.querySelector('.system-experience').dataset.sceneQuality`)) === 'low', `${low.triangles} triangles`);
    await p.setViewport(1440, 900, false);
    await p.waitFor(`document.querySelector('.system-experience').dataset.sceneQuality === 'high' && document.querySelector('.system-experience').dataset.sceneRenderer === 'ready'`, 30000);
    const high = await info(p);
    check('resize: returning to desktop restores the full tier', high.triangles > low.triangles, `${low.triangles} → ${high.triangles} triangles`);
    check('resize: geometry count is clean after tier switches', high.geometries <= 30, `${high.geometries}`);
    check('resize: no console errors', p.log.console.length === 0 && p.log.exceptions.length === 0, p.log.console.slice(0, 2).join('|'));
  }
  p.close();
}

/* Cleanup across remounts ------------------------------------------- */
console.log('\n[cleanup]');
{
  const p = await main.page({ width: 1440, height: 900 });
  const { ready } = await loadLab(p);
  if (ready) {
    await sleep(1500);
    const base = await info(p);
    const heap0 = await p.heap();
    const samples = [];
    for (let i = 0; i < 6; i++) {
      await clickButtonText(p, 'REMOUNT SCENE');
      await sleep(900);
      await p.waitFor(`document.querySelector('.system-experience')?.dataset.sceneRenderer === 'ready'`, 30000);
      await sleep(700);
      samples.push(await info(p));
    }
    const last = samples[samples.length - 1];
    check('cleanup: geometries return to baseline after 6 remounts', last.geometries === base.geometries, `${base.geometries} → ${last.geometries}`);
    check('cleanup: no texture leak', last.textures <= base.textures, `${base.textures} → ${last.textures}`);
    check('cleanup: shader programs do not accumulate', last.programs <= base.programs + 1, `${base.programs} → ${last.programs}`);
    check('cleanup: still exactly one canvas', (await p.ev(`document.querySelectorAll('canvas').length`)) === 1);
    const heap1 = await p.heap();
    check('cleanup: JS heap does not grow materially', heap1 < heap0 * 1.35, `${(heap0 / 1e6).toFixed(1)} → ${(heap1 / 1e6).toFixed(1)} MB`);
    check('cleanup: no console errors across remounts', p.log.console.length === 0 && p.log.exceptions.length === 0, p.log.console.slice(0, 2).join('|'));

    /* Context loss and recovery */
    await p.ev(`${SCENE}.loseContext()`);
    const lost = await p.waitFor(`document.querySelector('.system-experience').dataset.sceneRenderer === 'lost'`, 10000);
    check('context loss: the interface reports it and falls back to the drawing', Boolean(lost));
    await sleep(1200);
    const poster = await p.ev(`getComputedStyle(document.querySelector('.system-poster')).opacity`);
    check('context loss: the static drawing is visible', Number(poster) > 0.9, poster);
    await p.shotOf('.system-stage', 'context-lost');
    await p.ev(`${SCENE}.restoreContext()`);
    const restored = await p.waitFor(`document.querySelector('.system-experience').dataset.sceneRenderer === 'ready'`, 15000);
    check('context loss: the scene recovers when the context is restored', Boolean(restored));
    if (restored) {
      // The remount buttons scroll the stage off-screen, where rendering is (correctly) gated.
      await p.ev(`document.querySelector('.system-stage')?.scrollIntoView({block:'center',behavior:'instant'})`);
      await sleep(1500); // the renderer's frame counter resets on restore; let it settle
      const f0 = (await info(p)).frame;
      await sleep(2000);
      check('context loss: rendering resumes after restore', (await info(p)).frame - f0 >= 2);
    }
  }
  p.close();
}

/* Adaptive resolution ------------------------------------------------ */
console.log('\n[adaptive resolution]');
{
  const p = await main.page({ width: 1440, height: 900, dsf: 2 });
  const { ready } = await loadLab(p);
  if (ready) {
    const dpr0 = (await info(p)).dpr;
    await sleep(9000);
    const dpr1 = (await info(p)).dpr;
    check('adaptive DPR: starts at the device pixel ratio (2)', dpr0 <= 2 && dpr0 >= 1.5, dpr0);
    check('adaptive DPR: steps down when frames are being missed (software rendering)', dpr1 < dpr0, `${dpr0} → ${dpr1}`);
    notes.adaptiveDpr = { start: dpr0, after: dpr1 };
  }
  p.close();
}

/* Simulated fallback ------------------------------------------------- */
console.log('\n[fallback: simulated]');
{
  const p = await main.page({ width: 1440, height: 900 });
  const { ready } = await loadLab(p);
  if (ready) {
    await clickButtonText(p, 'SIMULATE NO WEBGL');
    await sleep(1500);
    check('fallback: renderer switches to "fallback"', (await renderer(p)) === 'fallback');
    check('fallback: the WebGL canvas is removed', (await p.ev(`document.querySelectorAll('.system-stage canvas').length`)) === 0);
    check('fallback: the static drawing is shown with a notice', (await p.ev(`!!document.querySelector('.system-fallback-note') && getComputedStyle(document.querySelector('.system-poster')).opacity==='1'`)) === true);
    await p.ev(`document.querySelector('.system-panel [data-component=database]').click()`);
    await sleep(600);
    const dim = await p.ev(`(()=>{const o=id=>Number(document.querySelector('.system-poster g[data-id='+id+']').getAttribute('opacity'));return {db:o('database'),fe:o('frontend')}})()`);
    check('fallback: selection still works and is reflected in the drawing', dim.db === 1 && dim.fe < 0.5, JSON.stringify(dim));
    await p.shotOf('.system-stage', 'fallback-simulated-selected');
    await clickButtonText(p, 'SIMULATE NO WEBGL');
    const back = await p.waitFor(`document.querySelector('.system-experience').dataset.sceneRenderer === 'ready'`, 30000);
    check('fallback: turning the simulation off restores the 3D scene', Boolean(back));
    check('fallback: no console errors', p.log.console.length === 0 && p.log.exceptions.length === 0, p.log.console.slice(0, 2).join('|'));
  }
  p.close();
}
main.kill();

/* Genuinely WebGL-less browser --------------------------------------- */
console.log('\n[fallback: real — Chrome started with --disable-3d-apis]');
{
  const nogl = await launch(['--disable-3d-apis', '--disable-gpu'], 9922);
  for (const [label, w, h, mobile] of [['desktop', 1440, 900, false], ['mobile', 390, 844, true]]) {
    const p = await nogl.page({ width: w, height: h, mobile });
    await p.goto('/lab/system');
    const fell = await p.waitFor(`document.querySelector('.system-experience')?.dataset.sceneRenderer === 'fallback'`, 20000);
    check(`no WebGL (${label}): falls back gracefully`, Boolean(fell), await renderer(p));
    await p.ev(`document.querySelector('.system-panel [data-component=messaging]').click()`);
    await sleep(500);
    check(`no WebGL (${label}): the DOM interface is complete and usable`, (await p.ev(`document.querySelector('.system-detail .readout-id').textContent.includes('MESSAGING') && document.querySelectorAll('.system-panel [data-component]').length===7`)) === true);
    check(`no WebGL (${label}): notice is shown`, (await p.ev(`!!document.querySelector('.system-fallback-note')`)) === true);
    check(`no WebGL (${label}): no console errors or exceptions`, p.log.console.length === 0 && p.log.exceptions.length === 0, [...p.log.console, ...p.log.exceptions].slice(0, 2).join('|'));
    await p.ev(`document.querySelector('.system-stage').scrollIntoView({block:'center',behavior:'instant'})`);
    await sleep(500);
    await p.shotOf('.system-experience', `fallback-real-${label}`);
    p.close();
  }
  nogl.kill();
}

/* ------------------------------------------------------------------ */
/* Summary                                                              */
/* ------------------------------------------------------------------ */

const failed = checks.filter((c) => !c.ok);
writeFileSync(join(OUT, 'scene-audit-results.json'), JSON.stringify({ base: BASE, total: checks.length, failed: failed.length, notes, checks }, null, 2));
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed${failed.length ? ` — ${failed.length} FAILED` : ''}`);
for (const f of failed) console.log(`  ✖ ${f.name}  — ${f.detail}`);
process.exit(failed.length ? 1 : 0);
