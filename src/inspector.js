// ═══════════════════════════════════════════════════════════════════════════
// src/inspector.js — عارض الفحص ثلاثي الأبعاد المتقدم (Inspect Viewer)
// تحكم حر 360° مع قصور ذاتي، فتح الحجرة، كشف الفيشة، وإشارات توضيحية 3D
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { createDevice3D } from './devices/factory.js';
import { DEVICE_MAP } from './config.js';
import { speak, playDeviceSynthSound } from './shared/audio.js';

export function createInspectorViewer({ renderer, materials, host, onExit }) {
  let activeDeviceId = null;
  let isOpen = false;
  let animFrame = null;
  let isCoverOpen = false;
  let isRunning = false;

  // مشهد وكاميرا فحص معزولان تماماً
  const inspectScene = new THREE.Scene();
  const inspectCamera = new THREE.PerspectiveCamera(45, host.clientWidth / host.clientHeight, 0.1, 100);
  inspectCamera.position.set(0, 1.8, 4.2);

  // إضاءة استوديو ثلاثية احترافية
  const ambient = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.5);
  inspectScene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(3, 5, 4);
  inspectScene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
  fillLight.position.set(-4, 2, -2);
  inspectScene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffb703, 1.5);
  rimLight.position.set(0, 4, -4);
  inspectScene.add(rimLight);

  // منصة العرض الدائرية الاستوديو في الفحص
  const studioPlinth = new THREE.Group();
  const plinthBase = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.18, 40), materials.plinthBase);
  const plinthRim = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.03, 16, 40), materials.plinthRim);
  plinthRim.rotation.x = Math.PI / 2;
  plinthRim.position.y = 0.09;
  studioPlinth.add(plinthBase, plinthRim);
  inspectScene.add(studioPlinth);

  // حلقة توهج ناعمة تحت الجهاز
  const glowRing = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 1.35, 32),
    new THREE.MeshBasicMaterial({ color: 0x2ec4b6, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
  );
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = 0.1;
  studioPlinth.add(glowRing);

  let currentMesh = null;
  let currentFx = null;
  let currentParts = null;

  // حالة التحكم بالمدار 360° مع القصور الذاتي (Damping)
  let rotX = 0, rotY = 0;
  let targetRotX = 0, targetRotY = 0;
  let cameraDist = 4.2;
  let targetCameraDist = 4.2;
  let isDragging = false;
  let lastTouchX = 0, lastTouchY = 0;
  let lastPinchDist = 0;
  let autoRotate = true;

  // ─── واجهة الأزرار العلوية والسفلية للفحص (HTML Overlay) ───
  let overlayEl = null;

  function createOverlayUI() {
    if (overlayEl) return;
    overlayEl = document.createElement('div');
    overlayEl.className = 'inspect-fullscreen-overlay';
    overlayEl.innerHTML = `
      <div class="inspect-top-header">
        <div class="inspect-dev-meta">
          <span class="inspect-tag-badge" id="inspect-tag-badge">🔋 بطارية جافة</span>
          <h2 class="inspect-dev-title" id="inspect-ui-title">فحص الجهاز</h2>
        </div>
        <button type="button" class="inspect-close-btn" id="inspect-close-btn" aria-label="إغلاق الفحص">
          ✕ <span>العودة للطاولة</span>
        </button>
      </div>

      <!-- إشارات توضيحية 3D (Callouts) -->
      <div class="inspect-callouts-layer" id="inspect-callouts-layer"></div>

      <div class="inspect-bottom-controls">
        <button type="button" class="inspect-action-btn primary" id="inspect-toggle-bay-btn">
          🔋 <span>افتح حجرة البطارية</span>
        </button>
        <button type="button" class="inspect-action-btn secondary" id="inspect-run-test-btn">
          ▶️ <span>تشغيل واختبار الجهاز</span>
        </button>
        <button type="button" class="inspect-action-btn tertiary" id="inspect-spin-btn">
          🔄 <span>تدوير 360°</span>
        </button>
      </div>
    `;
    host.appendChild(overlayEl);

    overlayEl.querySelector('#inspect-close-btn')?.addEventListener('click', close);
    overlayEl.querySelector('#inspect-toggle-bay-btn')?.addEventListener('click', toggleBay);
    overlayEl.querySelector('#inspect-run-test-btn')?.addEventListener('click', toggleRunDevice);
    overlayEl.querySelector('#inspect-spin-btn')?.addEventListener('click', () => { targetRotY += Math.PI / 2; });

    // تفاعلات اللمس والماوس على العارض
    overlayEl.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      isDragging = true;
      autoRotate = false;
      lastTouchX = e.clientX;
      lastTouchY = e.clientY;
      try { overlayEl.setPointerCapture(e.pointerId); } catch {}
    });

    overlayEl.addEventListener('pointermove', e => {
      if (!isDragging) return;
      const dx = e.clientX - lastTouchX;
      const dy = e.clientY - lastTouchY;
      lastTouchX = e.clientX;
      lastTouchY = e.clientY;

      targetRotY += dx * 0.012;
      targetRotX = Math.max(-0.6, Math.min(0.8, targetRotX + dy * 0.01));
    });

    const onPointerUp = e => {
      if (!isDragging) return;
      isDragging = false;
      try { overlayEl.releasePointerCapture(e.pointerId); } catch {}
    };
    overlayEl.addEventListener('pointerup', onPointerUp);
    overlayEl.addEventListener('pointercancel', () => { isDragging = false; });

    overlayEl.addEventListener('wheel', e => {
      e.preventDefault();
      targetCameraDist = Math.max(2.4, Math.min(6.5, targetCameraDist + e.deltaY * 0.005));
    }, { passive: false });

    // دعم Pinch-to-zoom باللمس بإصبعين
    overlayEl.addEventListener('touchmove', e => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastPinchDist > 0) {
          const diff = lastPinchDist - dist;
          targetCameraDist = Math.max(2.4, Math.min(6.5, targetCameraDist + diff * 0.01));
        }
        lastPinchDist = dist;
      }
    }, { passive: false });

    overlayEl.addEventListener('touchend', () => { lastPinchDist = 0; });
  }

  function toggleBay() {
    if (!currentParts) return;
    const meta = DEVICE_MAP[activeDeviceId] || {};
    const btn = overlayEl?.querySelector('#inspect-toggle-bay-btn');

    if (meta.type === 'battery' && currentParts.batteryBay) {
      isCoverOpen = !isCoverOpen;
      const cover = currentParts.batteryBay.cover;
      if (cover) {
        cover.position.y = isCoverOpen ? 0.45 : 0;
        cover.position.z = isCoverOpen ? 0.35 : 0.13;
        cover.rotation.x = isCoverOpen ? -Math.PI / 4 : 0;
      }
      if (btn) btn.innerHTML = isCoverOpen ? '🔒 <span>إغلاق حجرة البطارية</span>' : '🔋 <span>افتح حجرة البطارية</span>';
      if (isCoverOpen) speak('لاحظ القطب الموجب والسالب والنابض المعدني لتثبيت البطارية.');
    } else if (currentParts.mainsPlug) {
      isCoverOpen = !isCoverOpen;
      const plugHead = currentParts.mainsPlug.plugHead;
      if (plugHead) {
        plugHead.position.z = isCoverOpen ? 1.2 : 0.65;
        plugHead.rotation.y = isCoverOpen ? Math.PI / 4 : 0;
      }
      if (btn) btn.innerHTML = isCoverOpen ? '🔌 <span>إرجاع السلك والمقبس</span>' : '🔌 <span>اكشف السلك والفيشة 220V</span>';
      if (isCoverOpen) speak('انظر لمسماري الفيشة المعدنيين المصممين لتوصيل كهرباء المنزل 220 فولت.');
    }
  }

  function toggleRunDevice() {
    isRunning = !isRunning;
    const btn = overlayEl?.querySelector('#inspect-run-test-btn');
    if (btn) btn.innerHTML = isRunning ? '⏸️ <span>إيقاف التشغيل</span>' : '▶️ <span>تشغيل واختبار الجهاز</span>';
    if (isRunning) {
      playDeviceSynthSound(activeDeviceId);
      speak(`يعمل الآن! ${DEVICE_MAP[activeDeviceId]?.reason || ''}`);
    }
  }

  function updateCallouts() {
    const layer = overlayEl?.querySelector('#inspect-callouts-layer');
    if (!layer || !isOpen) return;

    const meta = DEVICE_MAP[activeDeviceId] || {};
    let items = [];

    if (meta.type === 'battery') {
      items = [
        { label: 'حجرة البطاريات الجافة', tip: meta.voltage || '1.5V AA' },
        { label: 'القطب الموجب (+)', tip: 'رأس بارز' },
        { label: 'القطب السالب (−)', tip: 'نابض معدني' }
      ];
    } else {
      items = [
        { label: 'سلك توصيل معزول', tip: 'مطاط آمن' },
        { label: 'فيشة كهرباء ثنائية', tip: 'مسماران معدنيان' },
        { label: 'مواصفة الطاقة', tip: '220V / 50Hz' }
      ];
    }

    layer.innerHTML = items.map((it, idx) => `
      <div class="inspect-callout-pill" style="animation-delay:${idx * 0.1}s">
        <span class="callout-dot"></span>
        <strong>${it.label}</strong>
        <small>${it.tip}</small>
      </div>
    `).join('');
  }

  function open(deviceId) {
    activeDeviceId = deviceId;
    isOpen = true;
    isCoverOpen = false;
    isRunning = false;
    autoRotate = true;
    rotX = 0.2; rotY = 0;
    targetRotX = 0.2; targetRotY = 0;
    targetCameraDist = 4.2;

    createOverlayUI();
    if (overlayEl) overlayEl.style.display = 'flex';

    // تنظيف المجسم السابق
    if (currentMesh) {
      inspectScene.remove(currentMesh);
      currentMesh.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      currentMesh = null;
    }

    // بناء مجسم الجهاز الجديد للفحص
    currentMesh = createDevice3D(deviceId, materials);
    currentMesh.position.set(0, 0.1, 0);
    currentMesh.scale.setScalar(1.45);
    inspectScene.add(currentMesh);

    currentFx = currentMesh.userData.effects || {};
    currentParts = currentMesh.userData.interactiveParts || {};

    const meta = DEVICE_MAP[deviceId] || {};
    const titleEl = overlayEl?.querySelector('#inspect-ui-title');
    const tagEl = overlayEl?.querySelector('#inspect-tag-badge');
    const bayBtn = overlayEl?.querySelector('#inspect-toggle-bay-btn');

    if (titleEl) titleEl.textContent = `فحص: ${meta.name || deviceId}`;
    if (tagEl) {
      tagEl.textContent = meta.type === 'battery' ? '🔋 بطارية جافة' : '🔌 كهرباء المنزل 220V';
      tagEl.className = `inspect-tag-badge ${meta.type === 'battery' ? 'tag-battery' : 'tag-mains'}`;
    }
    if (bayBtn) {
      bayBtn.innerHTML = meta.type === 'battery' ? '🔋 <span>افتح حجرة البطارية</span>' : '🔌 <span>اكشف السلك والفيشة 220V</span>';
    }

    updateCallouts();
    speak(`تفحص ${meta.name || ''} جيداً، اسحب بإصبعك لتدويره 360 درجة واكتشاف مصدر طاقته.`);

    tick();
  }

  function close() {
    isOpen = false;
    cancelAnimationFrame(animFrame);
    if (overlayEl) overlayEl.style.display = 'none';
    if (currentMesh) {
      inspectScene.remove(currentMesh);
      currentMesh.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      currentMesh = null;
    }
    if (onExit) onExit();
  }

  function tick() {
    if (!isOpen) return;
    animFrame = requestAnimationFrame(tick);

    const now = performance.now() * 0.001;

    // تدوير تلقائي بطيء
    if (autoRotate && !isDragging) {
      targetRotY += 0.004;
    }

    // تجانس القصور الذاتي (Damping)
    rotX += (targetRotX - rotX) * 0.1;
    rotY += (targetRotY - rotY) * 0.1;
    cameraDist += (targetCameraDist - cameraDist) * 0.1;

    if (currentMesh) {
      currentMesh.rotation.y = rotY;
      currentMesh.rotation.x = rotX;
    }

    // تحديث مؤثرات التشغيل إن كان يعمل داخل الفحص
    if (isRunning && currentFx) {
      if (currentFx.wheels) currentFx.wheels.forEach(w => { w.rotation.x += 0.35; });
      if (currentFx.drum) currentFx.drum.rotation.z += 0.4;
      if (currentFx.plate) currentFx.plate.rotation.y += 0.2;
      if (currentFx.blades) currentFx.blades.rotation.y += 0.7;
      if (currentFx.handM) currentFx.handM.rotation.z -= 0.2;
      if (currentFx.laserBeam) currentFx.laserBeam.visible = true;
      if (currentFx.laserDot) currentFx.laserDot.visible = true;
      if (currentFx.spotlight) currentFx.spotlight.visible = true;
      if (currentFx.juice) currentFx.juice.visible = true;
    }

    inspectCamera.aspect = host.clientWidth / host.clientHeight;
    inspectCamera.updateProjectionMatrix();

    inspectCamera.position.x = Math.sin(rotY * 0.2) * 0.8;
    inspectCamera.position.y = 1.6 + rotX * 1.5;
    inspectCamera.position.z = cameraDist;
    inspectCamera.lookAt(0, 0.6, 0);

    renderer.render(inspectScene, inspectCamera);
  }

  return {
    open,
    close,
    isOpen: () => isOpen,
    dispose() {
      close();
      overlayEl?.remove();
    }
  };
}
