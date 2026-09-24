#!/usr/bin/env node
/**
 * Prototype-parity diff — compares computed styles and geometry of ~140 shared selectors
 * between the approved Milestone 2 prototype and the running application.
 *
 * Expect differences for *deliberate* changes (see docs/DESIGN_DECISIONS.md ADR-010, ADR-011,
 * ADR-015). Unexpected drift in typography, colour, spacing or borders is a regression.
 *
 * Usage:
 *   python3 -m http.server 4173 --bind 127.0.0.1        # serves prototype/ (run from repo root)
 *   npm run build && npm run start -- -p 3100
 *   node scripts/qa/prototype-parity.mjs --width 1440 --out docs/qa/m3-review
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at !== -1 && argv[at + 1] ? argv[at + 1] : fallback;
};
const W = flag('width', '1440');
const OUT = flag('out', 'qa-output');
const PROTO = flag('proto', 'http://127.0.0.1:4173/prototype/index.html');
const APP = flag('app', 'http://localhost:3100/');
const SP = mkdtempSync(join(tmpdir(), 'portfolio-parity-'));
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const width = Number(W);

const SELECTORS = `.precision-rail .rail-container .brand-anchor .brand-glyph .brand-name .brand-title .rail-telemetry .coord-label .nav-item .nav-num .status-indicator .status-dot .status-text .blueprint-ribbon .ribbon-tag .ribbon-coords
.hero-section .hero-split-grid .hero-eyebrow .hero-headline .headline-italic .headline-highlight .hero-summary .hero-summary\ strong .human-ethos-box .ethos-header .ethos-quote .ethos-footer .hero-cta-group .btn-primary .btn-secondary .btn-ghost
.blueprint-viewport-frame .viewport-hud-header .hud-title .hud-badge .viewport-canvas-container .callout-badge .callout-node .viewport-hud-footer .hud-label .layer-pills .layer-btn .hero-telemetry-grid .telemetry-metric-tile .tile-number .tile-label
.blueprint-section .section-container .section-header-block .section-index-badge .section-headline .section-intro
.dossiers-stack .system-dossier-card .dossier-grid .dossier-header-meta .sys-code .sys-status .dossier-title .tech-stack-pills .tech-pill .challenge-solution-grid .cs-box .cs-label .cs-text .impact-metrics-row .impact-key .impact-val .dossier-actions .btn-dossier-repo .btn-dossier-subrepo
.schematic-plate .plate-hud .plate-title .plate-tag .schematic-canvas-box .schematic-svg .plate-footer
.topology-console-deck .console-controls-bar .console-heading .console-dot .console-tabs .console-tab .topology-display-stage .telemetry-screen .node-tree-panel .panel-tag .interactive-node .node-header .node-indicator .node-title .node-desc .node-readout-panel .readout-header .readout-label .readout-id .readout-content .readout-stat-row .stat-name .stat-val .readout-footer
.contact-dossier-card .contact-split-grid .channels-header .channel-code .channel-loc .channels-list .channel-item .channel-icon-box .channel-title .channel-value .channel-arrow .resume-download-plate .plate-info .plate-desc .btn-resume-download .form-header .form-code .blueprint-form .form-row .form-group .form-label .req .form-input .form-select .form-textarea .form-actions .btn-submit-transmission .form-disclaimer
.blueprint-footer .footer-container .footer-top-row .footer-brand .footer-name .footer-tagline .footer-nav .footer-nav\ a .footer-hairline .footer-bottom-row .footer-copy .footer-telemetry`.split(/\s+(?=\.)/).map((s) => s.trim()).filter(Boolean);

const PROPS = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textTransform', 'textAlign', 'color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopLeftRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom', 'display', 'flexDirection', 'justifyContent', 'alignItems', 'gap', 'gridTemplateColumns', 'opacity', 'boxShadow', 'position', 'overflow', 'whiteSpace', 'cursor'];

const collector = `(()=>{const SEL=${JSON.stringify(SELECTORS)};const PROPS=${JSON.stringify(PROPS)};const out={};
  const vis=(e)=>{const cs=getComputedStyle(e);if(cs.display==='none')return false;let p=e;while(p){if(getComputedStyle(p).display==='none')return false;p=p.parentElement}return true};
  for(const s of SEL){const all=[...document.querySelectorAll(s)].filter(vis);const e=all[0];if(!e){out[s]=null;continue}
    const cs=getComputedStyle(e);const r=e.getBoundingClientRect();const o={count:all.length,rect:{x:Math.round(r.left),w:Math.round(r.width),h:Math.round(r.height)},text:(e.textContent||'').trim().replace(/\\s+/g,' ').slice(0,40)};
    for(const p of PROPS)o[p]=cs[p];
    o.fontFamily=(o.fontFamily||'').split(',')[0].replace(/["']/g,'').replace(/^__/,'').replace(/_[a-z0-9]{6,}(_Fallback)?$/i,'').trim();
    out[s]=o}
  return out})()`;

async function grab(url) {
  const t = await (await fetch('http://127.0.0.1:9777/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map(); ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 1024 });
  await send('Page.navigate', { url }); await sleep(3500);
  const r = await send('Runtime.evaluate', { expression: collector, returnByValue: true });
  ws.close(); return r.result.result.value;
}

const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=9777', `--user-data-dir=${SP}`, 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { await fetch('http://127.0.0.1:9777/json/version'); break; } catch { await sleep(200); } }
const proto = await grab(PROTO); const app = await grab(APP);
chrome.kill();

const diffs = []; const missingInApp = []; const missingInProto = [];
for (const s of SELECTORS) {
  const a = proto[s], b = app[s];
  if (a && !b) { missingInApp.push(s); continue; }
  if (!a && b) { missingInProto.push(s); continue; }
  if (!a && !b) continue;
  const d = {};
  for (const p of PROPS) if (a[p] !== b[p]) d[p] = [a[p], b[p]];
  for (const k of ['x', 'w', 'h']) if (Math.abs(a.rect[k] - b.rect[k]) > 2) d['rect.' + k] = [a.rect[k], b.rect[k]];
  if (Object.keys(d).length) diffs.push({ selector: s, protoText: a.text, appText: b.text, diff: d });
}
writeFileSync(`${OUT}/parity-${width}.json`, JSON.stringify({ width, missingInApp, missingInProto, diffs }, null, 1));
console.log(`${width}px: ${SELECTORS.length} selectors | ${diffs.length} differ | missing in app: ${missingInApp.length} | missing in prototype: ${missingInProto.length}`);
