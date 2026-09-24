// =========================================================
// THE LIVING BLUEPRINT — VISUAL PROTOTYPE CONTROLLER
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  initIsometricCanvas();
  initTopologyMatrix();
  initMobileNavigation();
  initClock();
});

// =========================================================
// 1. ISOMETRIC 3D BLUEPRINT CANVAS SIMULATOR
// =========================================================
function initIsometricCanvas() {
  const canvas = document.getElementById('isometricBlueprintCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let activeLayer = 'all';
  let angle = 0;
  let targetAngle = 0;
  let isDragging = false;
  let startX = 0;

  // Responsive Canvas Sizing
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Mouse / Touch Interaction
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) {
      // Subtle tilt towards cursor
      const rect = canvas.getBoundingClientRect();
      const normX = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
      targetAngle = normX * 0.4;
      return;
    }
    const deltaX = e.clientX - startX;
    angle += deltaX * 0.008;
    startX = e.clientX;
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  // Touch Support for Mobile
  canvas.addEventListener('touchstart', (e) => {
    isDragging = true;
    startX = e.touches[0].clientX;
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startX;
    angle += deltaX * 0.01;
    startX = e.touches[0].clientX;
  }, { passive: true });

  window.addEventListener('touchend', () => { isDragging = false; });

  // Layer Filter Buttons
  const layerBtns = document.querySelectorAll('.layer-btn');
  const layerTag = document.getElementById('activeLayerTag');
  layerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      layerBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLayer = btn.dataset.layer;
      if (layerTag) layerTag.textContent = `LAYER: ${activeLayer.toUpperCase()}`;
    });
  });

  // Isometric Drawing Helpers
  function toIso(x, y, z, rotation) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;

    // Standard Isometric projection
    const isoX = (rx - ry) * Math.cos(Math.PI / 6);
    const isoY = (rx + ry) * Math.sin(Math.PI / 6) - z;
    return { x: isoX, y: isoY };
  }

  function drawIsoBox(cx, cy, w, d, h, zOffset, rotation, strokeColor, fillColor, drawNodes = true) {
    const hw = w / 2;
    const hd = d / 2;

    const b1 = toIso(-hw, -hd, zOffset, rotation);
    const b2 = toIso(hw, -hd, zOffset, rotation);
    const b3 = toIso(hw, hd, zOffset, rotation);
    const b4 = toIso(-hw, hd, zOffset, rotation);

    const t1 = toIso(-hw, -hd, zOffset + h, rotation);
    const t2 = toIso(hw, -hd, zOffset + h, rotation);
    const t3 = toIso(hw, hd, zOffset + h, rotation);
    const t4 = toIso(-hw, hd, zOffset + h, rotation);

    // Draw Bottom Face
    ctx.beginPath();
    ctx.moveTo(cx + b1.x, cy + b1.y);
    ctx.lineTo(cx + b2.x, cy + b2.y);
    ctx.lineTo(cx + b3.x, cy + b3.y);
    ctx.lineTo(cx + b4.x, cy + b4.y);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Draw Left Face
    ctx.beginPath();
    ctx.moveTo(cx + b4.x, cy + b4.y);
    ctx.lineTo(cx + b3.x, cy + b3.y);
    ctx.lineTo(cx + t3.x, cy + t3.y);
    ctx.lineTo(cx + t4.x, cy + t4.y);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Draw Right Face
    ctx.beginPath();
    ctx.moveTo(cx + b3.x, cy + b3.y);
    ctx.lineTo(cx + b2.x, cy + b2.y);
    ctx.lineTo(cx + t2.x, cy + t2.y);
    ctx.lineTo(cx + t3.x, cy + t3.y);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.stroke();

    // Draw Top Face
    ctx.beginPath();
    ctx.moveTo(cx + t1.x, cy + t1.y);
    ctx.lineTo(cx + t2.x, cy + t2.y);
    ctx.lineTo(cx + t3.x, cy + t3.y);
    ctx.lineTo(cx + t4.x, cy + t4.y);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.stroke();

    if (drawNodes) {
      // Glow nodes at top corners
      [t1, t2, t3, t4].forEach(pt => {
        ctx.beginPath();
        ctx.arc(cx + pt.x, cy + pt.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.fill();
      });
    }
  }

  // Animation Loop
  let time = 0;
  function render() {
    time += 0.015;
    if (!isDragging) {
      angle += (targetAngle - angle) * 0.05;
      angle += Math.sin(time) * 0.001; // gentle ambient breathing
    }

    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2 + 30;

    ctx.clearRect(0, 0, rect.width, rect.height);

    // Coordinate grid circle on floor
    ctx.beginPath();
    ctx.arc(cx, cy + 80, 140, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Floor Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - 160, cy + 80);
    ctx.lineTo(cx + 160, cy + 80);
    ctx.moveTo(cx, cy - 80);
    ctx.lineTo(cx, cy + 240);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.stroke();

    // 1. LAYER: DATABASE / PERSISTENCE (L1)
    if (activeLayer === 'all' || activeLayer === 'database') {
      const dbColor = '#F59E0B';
      const dbFill = 'rgba(245, 158, 11, 0.08)';
      // Primary Data Slab
      drawIsoBox(cx, cy, 180, 180, 16, -60, angle, 'rgba(245, 158, 11, 0.5)', dbFill, true);
      // Secondary Storage Nodes
      drawIsoBox(cx - 45, cy, 50, 50, 24, -38, angle, dbColor, 'rgba(245, 158, 11, 0.15)', false);
      drawIsoBox(cx + 45, cy, 50, 50, 24, -38, angle, dbColor, 'rgba(245, 158, 11, 0.15)', false);
    }

    // 2. LAYER: BACKEND SERVICES & APIS (L2)
    if (activeLayer === 'all' || activeLayer === 'backend') {
      const beColor = '#2563EB';
      const beFill = 'rgba(37, 99, 235, 0.12)';
      // Central Spring Boot Core Pillar
      drawIsoBox(cx, cy, 120, 120, 45, 0, angle, '#38BDF8', beFill, true);
      // Server Towers
      drawIsoBox(cx - 35, cy, 30, 30, 60, 45, angle, beColor, 'rgba(37, 99, 235, 0.2)', true);
      drawIsoBox(cx + 35, cy, 30, 30, 60, 45, angle, beColor, 'rgba(37, 99, 235, 0.2)', true);
    }

    // 3. LAYER: CLIENT INTERFACE (L3)
    if (activeLayer === 'all' || activeLayer === 'frontend') {
      const feColor = '#38BDF8';
      const feFill = 'rgba(56, 189, 248, 0.16)';
      // Top Architectural Canopy / Glass Interface
      drawIsoBox(cx, cy, 150, 150, 18, 120, angle, feColor, feFill, true);
      
      // Floating UI Wireframe Pane
      const floatOffset = Math.sin(time * 2) * 6;
      drawIsoBox(cx, cy, 90, 90, 8, 150 + floatOffset, angle, '#F1F5F9', 'rgba(241, 245, 249, 0.15)', true);
    }

    requestAnimationFrame(render);
  }
  render();
}

// =========================================================
// 2. INTERACTIVE SYSTEMS TOPOLOGY MATRIX
// =========================================================
function initTopologyMatrix() {
  const nodes = document.querySelectorAll('.interactive-node');
  const inspectId = document.getElementById('inspectNodeId');
  const inspectContent = document.getElementById('inspectContent');
  const consoleTabs = document.querySelectorAll('.console-tab');

  if (!nodes.length || !inspectId || !inspectContent) return;

  const nodeSpecs = {
    client: {
      id: 'NODE: CLIENT (REACT / NEXT.JS)',
      runtime: 'V8 / Modern Browser Runtime',
      typing: 'TypeScript 5.x Strict Mode (Zero "any")',
      state: 'React Context + Hooks + Immutability',
      performance: '60 FPS Hardware Acceleration',
      code: `// Type-Safe Client Node Contract\ninterface ClientViewProps {\n  readonly state: HydratedState;\n  onAction: (event: TelemetryEvent) => void;\n}`
    },
    api: {
      id: 'NODE: API GATEWAY & CONTROLLERS',
      runtime: 'Spring MVC / Express Dispatcher',
      typing: 'Java 17 Records / DTO Validation',
      state: 'Stateless Request / Response Lifecycle',
      performance: '<45ms Latency (P99)',
      code: `@RestController\n@RequestMapping("/api/v1/telemetry")\npublic class SystemController {\n  @GetMapping public ResponseEntity<Dossier> get();\n}`
    },
    security: {
      id: 'NODE: SPRING SECURITY & JWT FILTER',
      runtime: 'Spring Security 6.x + JWT Web Tokens',
      typing: 'Strict Claims Verification & BCrypt (12 rounds)',
      state: 'Stateless ThreadLocal SecurityContext',
      performance: 'Zero-Session Server Scalability',
      code: `// Role-Based Authorization Enforcement\nhttp.authorizeHttpRequests(auth -> auth\n  .requestMatchers("/api/admin/**").hasRole("CHAIRMAN")\n  .anyRequest().authenticated());`
    },
    storage: {
      id: 'NODE: DATABASE & PERSISTENCE TIER',
      runtime: 'PostgreSQL 16 / MySQL InnoDB Engine',
      typing: 'Normalized Relational Schema (3NF) + FK Constraints',
      state: 'ACID Transactional Isolation (REPEATABLE READ)',
      performance: 'B-Tree Indexed Queries (<8ms)',
      code: `-- Verified Schema Definition\nCREATE TABLE registrations (\n  id UUID PRIMARY KEY,\n  user_id UUID REFERENCES users(id),\n  event_id UUID REFERENCES events(id)\n);`
    }
  };

  nodes.forEach(node => {
    node.addEventListener('click', () => {
      nodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');
      const key = node.dataset.node;
      const spec = nodeSpecs[key];
      if (spec) updateInspector(spec);
    });
  });

  consoleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      consoleTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const view = tab.dataset.view;
      if (view === 'security') {
        const securityNode = document.querySelector('[data-node="security"]');
        if (securityNode) securityNode.click();
      } else if (view === 'performance') {
        const storageNode = document.querySelector('[data-node="storage"]');
        if (storageNode) storageNode.click();
      } else {
        const clientNode = document.querySelector('[data-node="client"]');
        if (clientNode) clientNode.click();
      }
    });
  });

  function updateInspector(spec) {
    inspectId.textContent = spec.id;
    inspectContent.innerHTML = `
      <div class="readout-stat-row">
        <span class="stat-name">RUNTIME ENGINE:</span>
        <span class="stat-val highlight-cyan">${spec.runtime}</span>
      </div>
      <div class="readout-stat-row">
        <span class="stat-name">TYPE RIGOR:</span>
        <span class="stat-val">${spec.typing}</span>
      </div>
      <div class="readout-stat-row">
        <span class="stat-name">STATE MANAGEMENT:</span>
        <span class="stat-val">${spec.state}</span>
      </div>
      <div class="readout-stat-row">
        <span class="stat-name">PERFORMANCE TARGET:</span>
        <span class="stat-val highlight-green">${spec.performance}</span>
      </div>
      <div class="readout-code-block">
        <span class="code-comment">// Verified Architecture Contract</span>
        <code>${escapeHtml(spec.code)}</code>
      </div>
    `;
  }

  function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>&nbsp;&nbsp;');
  }
}

// =========================================================
// 3. MOBILE NAVIGATION TOGGLE
// =========================================================
function initMobileNavigation() {
  const btn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileDrawer');
  const closeBtn = document.getElementById('drawerCloseBtn');
  const links = document.querySelectorAll('.drawer-item');

  if (!btn || !drawer) return;

  btn.addEventListener('click', () => {
    drawer.classList.add('open');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      drawer.classList.remove('open');
    });
  }

  links.forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
    });
  });
}

// =========================================================
// 4. REAL-TIME CLOCK FOR ARCHITECTURAL TELEMETRY
// =========================================================
function initClock() {
  const timeEl = document.getElementById('liveTimestamp');
  if (!timeEl) return;
  function update() {
    const now = new Date();
    timeEl.textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  }
  update();
  setInterval(update, 1000);
}
