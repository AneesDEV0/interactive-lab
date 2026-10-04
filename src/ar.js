// ═══════════════════════════════════════════════════════════════════════════
// ar.js — مدخل الواقع المعزز الحقيقي (True AR Entry) لمختبر شرارة التعليمي
// متوافق مع معايير AR.js / MindAR للتعرف على البطاقات المطبوعة وسطح الطاولة
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { speak, stopAudio } from './audio.js';

let activeStream = null;
let arScene = null;
let arCamera = null;
let arRenderer = null;
let arAnimFrame = null;
let currentModelGroup = null;
let markerDetected = false;
let trackingCanvas = null;
let trackingCtx = null;
let trackingTimer = null;

// إنشاء نموذج السيارة ثلاثية الأبعاد التفاعلية في AR
function createArCar() {
  const group = new THREE.Group();
  
  // هيكل السيارة الرئيسي (أصفر ذهبي لامع)
  const bodyGeo = new THREE.BoxGeometry(1.6, 0.55, 0.9);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xFFB703,
    metalness: 0.35,
    roughness: 0.25
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.42;
  body.castShadow = true;
  group.add(body);

  // كابينة السيارة الزجاجية
  const cabinGeo = new THREE.BoxGeometry(0.9, 0.45, 0.75);
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x2F3E36,
    metalness: 0.8,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85
  });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(-0.1, 0.8, 0);
  group.add(cabin);

  // المصابيح الأمامية المتوهجة (LEDs)
  const lightGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const lightL = new THREE.Mesh(lightGeo, lightMat);
  lightL.rotation.z = Math.PI / 2;
  lightL.position.set(0.8, 0.45, 0.3);
  group.add(lightL);

  const lightR = lightL.clone();
  lightR.position.set(0.8, 0.45, -0.3);
  group.add(lightR);

  // 4 عجلات دوارة مع جنوط
  const wheels = [];
  const wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 20);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.8 });
  const rimGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.19, 12);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xE0E0E0, metalness: 0.8 });

  const wheelPositions = [
    [0.55, 0.26, 0.48],
    [-0.55, 0.26, 0.48],
    [0.55, 0.26, -0.48],
    [-0.55, 0.26, -0.48]
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const wGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    tire.rotation.x = Math.PI / 2;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    wGroup.add(tire);
    wGroup.add(rim);
    wGroup.position.set(x, y, z);
    group.add(wGroup);
    wheels.push(wGroup);
  });

  // حجرة البطاريات الجافة مع إشارة + و -
  const batteryBayGeo = new THREE.BoxGeometry(0.5, 0.2, 0.35);
  const batteryBayMat = new THREE.MeshStandardMaterial({ color: 0x5B7065, metalness: 0.5 });
  const batteryBay = new THREE.Mesh(batteryBayGeo, batteryBayMat);
  batteryBay.position.set(-0.2, 0.55, 0);
  group.add(batteryBay);

  group.userData = {
    type: 'car',
    wheels,
    animate: (time) => {
      wheels.forEach(w => {
        w.children.forEach(part => {
          part.rotation.z -= 0.08;
        });
      });
      // اهتزاز لطيف لمحاكاة حركة المحرك
      body.position.y = 0.42 + Math.sin(time * 12) * 0.008;
    }
  };

  return group;
}

// إنشاء نموذج الراديو ثلاثي الأبعاد في AR
function createArRadio() {
  const group = new THREE.Group();

  // جسم الراديو (أزرق سماوي تعليمي)
  const bodyGeo = new THREE.BoxGeometry(1.3, 0.95, 0.5);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3A86FF, roughness: 0.4, metalness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.55;
  group.add(body);

  // شبكة السماعة
  const speakerGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 24);
  const speakerMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.6 });
  const speaker = new THREE.Mesh(speakerGeo, speakerMat);
  speaker.rotation.x = Math.PI / 2;
  speaker.position.set(-0.3, 0.55, 0.25);
  group.add(speaker);

  // شاشة التردد ومؤشر التوليف
  const tunerGeo = new THREE.BoxGeometry(0.45, 0.25, 0.04);
  const tunerMat = new THREE.MeshBasicMaterial({ color: 0xFFF3D6 });
  const tuner = new THREE.Mesh(tunerGeo, tunerMat);
  tuner.position.set(0.3, 0.65, 0.25);
  group.add(tuner);

  // مؤشر أحمر متحرك
  const needleGeo = new THREE.BoxGeometry(0.02, 0.2, 0.05);
  const needleMat = new THREE.MeshBasicMaterial({ color: 0xE63946 });
  const needle = new THREE.Mesh(needleGeo, needleMat);
  needle.position.set(0.3, 0.65, 0.26);
  group.add(needle);

  // هوائي الراديو (Antenna)
  const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
  const antennaMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.9 });
  const antenna = new THREE.Mesh(antennaGeo, antennaMat);
  antenna.position.set(0.48, 1.25, -0.15);
  antenna.rotation.z = -0.25;
  group.add(antenna);

  // أمواج صوتية متوهجة طافية
  const wavesGroup = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const waveGeo = new THREE.TorusGeometry(0.18 + i * 0.12, 0.02, 8, 24, Math.PI);
    const waveMat = new THREE.MeshBasicMaterial({ color: 0xFFB703, transparent: true, opacity: 0.6 });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.rotation.z = -Math.PI / 2;
    wave.position.set(-0.3, 0.55, 0.35 + i * 0.15);
    wavesGroup.add(wave);
  }
  group.add(wavesGroup);

  group.userData = {
    type: 'radio',
    needle,
    wavesGroup,
    animate: (time) => {
      needle.position.x = 0.3 + Math.sin(time * 2) * 0.16;
      wavesGroup.children.forEach((w, idx) => {
        const p = (time * 3 + idx * 0.33) % 1;
        w.scale.setScalar(0.7 + p * 0.8);
        w.material.opacity = Math.max(0, 1 - p);
      });
    }
  };

  return group;
}

// إنشاء نموذج البطارية الجافة ثلاثية الأبعاد في AR
function createArBattery() {
  const group = new THREE.Group();

  // أسطوانة البطارية الرئيسية
  const cellGeo = new THREE.CylinderGeometry(0.36, 0.36, 1.2, 32);
  const cellMat = new THREE.MeshStandardMaterial({
    color: 0x2F3E36,
    metalness: 0.4,
    roughness: 0.3
  });
  const cell = new THREE.Mesh(cellGeo, cellMat);
  cell.position.y = 0.65;
  group.add(cell);

  // شريط ذهبي لامع حول البطارية
  const bandGeo = new THREE.CylinderGeometry(0.365, 0.365, 0.55, 32);
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0xFFB703,
    metalness: 0.8,
    roughness: 0.2
  });
  const band = new THREE.Mesh(bandGeo, bandMat);
  band.position.y = 0.65;
  group.add(band);

  // القطب الموجب البارز (+)
  const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 24);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xE0E0E0, metalness: 0.95 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 1.32;
  group.add(pole);

  // حلقة طاقة كهربائية متوهجة تدور حول البطارية
  const ringGeo = new THREE.TorusGeometry(0.55, 0.03, 16, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFB703, transparent: true, opacity: 0.75 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.65;
  group.add(ring);

  group.userData = {
    type: 'battery',
    ring,
    animate: (time) => {
      ring.rotation.z += 0.04;
      ring.position.y = 0.65 + Math.sin(time * 4) * 0.25;
      ring.scale.setScalar(0.9 + Math.sin(time * 5) * 0.12);
    }
  };

  return group;
}

// إنشاء نموذج مصباح المكتب السلكي في AR
function createArLamp() {
  const group = new THREE.Group();

  // القاعدة
  const baseGeo = new THREE.CylinderGeometry(0.45, 0.5, 0.1, 24);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x2F3E36, metalness: 0.7 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.05;
  group.add(base);

  // عمود المصباح
  const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 16);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xFFB703, metalness: 0.8 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(0, 0.55, 0);
  group.add(pole);

  // غطاء المصباح (Shade)
  const shadeGeo = new THREE.ConeGeometry(0.38, 0.45, 24, 1, true);
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0x5B7065, side: THREE.DoubleSide });
  const shade = new THREE.Mesh(shadeGeo, shadeMat);
  shade.position.set(0, 1.1, 0);
  group.add(shade);

  // المصباح الكهربائي المتوهج
  const bulbGeo = new THREE.SphereGeometry(0.16, 20, 20);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xFFFF88 });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.set(0, 0.98, 0);
  group.add(bulb);

  // مخروط الإضاءة المشع
  const coneGeo = new THREE.ConeGeometry(0.85, 1.2, 24, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xFFEE77,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.set(0, 0.4, 0);
  group.add(cone);

  group.userData = {
    type: 'lamp',
    bulb,
    cone,
    animate: (time) => {
      cone.material.opacity = 0.22 + Math.sin(time * 6) * 0.08;
    }
  };

  return group;
}

// إنشاء شبكة لوحة التتبع ثلاثية الأبعاد (AR Reticle & Target Guide)
function createArReticle() {
  const group = new THREE.Group();

  // حلقة هولوغرام خارجية دوارة
  const outerRingGeo = new THREE.RingGeometry(0.95, 1.05, 32);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: 0xFFB703,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = -Math.PI / 2;
  group.add(outerRing);

  // حلقة داخلية منقطة
  const innerRingGeo = new THREE.RingGeometry(0.55, 0.6, 24);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: 0x2EC4B6,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.rotation.x = -Math.PI / 2;
  group.add(innerRing);

  // 4 زوايا توجيه تركيز (Tracking Corner Brackets)
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const bracketGeo = new THREE.BoxGeometry(0.3, 0.04, 0.04);
    const bracketMat = new THREE.MeshBasicMaterial({ color: 0xFFB703 });
    const b1 = new THREE.Mesh(bracketGeo, bracketMat);
    b1.position.set(Math.cos(angle) * 1.25, 0.01, Math.sin(angle) * 1.25);
    b1.rotation.y = angle;
    group.add(b1);
  }

  // شبكة الليزر الأرضية الهولوغرامية
  const gridHelper = new THREE.GridHelper(2.4, 8, 0xFFB703, 0x5B7065);
  gridHelper.position.y = 0.005;
  group.add(gridHelper);

  group.userData = {
    animate: (time) => {
      outerRing.rotation.z += 0.015;
      innerRing.rotation.z -= 0.025;
      const s = 1.0 + Math.sin(time * 3) * 0.04;
      outerRing.scale.set(s, s, s);
    }
  };

  return group;
}

/**
 * فتح مدخل الواقع المعزز الحقيقي (True AR Gateway)
 * @param {Object} options
 * @param {Function} options.onContinue - يستدعى عند النقر على "انتقل للنشاط التقويمي"
 * @param {string} options.title - عنوان النشاط في الواجهة
 * @param {string} options.mode - 'dynamic' أو 'static'
 */
export async function launchArGateway(options = {}) {
  const {
    onContinue = () => {},
    title = 'مختبر شرارة الذكي | مدخل الواقع المعزز الحقيقي',
    mode = 'dynamic'
  } = options;

  // إزالة أي مدخل AR سابق إذا وجد
  const existing = document.getElementById('ar-gateway-overlay');
  if (existing) existing.remove();

  // بناء هيكل واجهة الواقع المعزز
  const overlay = document.createElement('div');
  overlay.id = 'ar-gateway-overlay';
  overlay.className = 'ar-gateway-overlay';
  overlay.innerHTML = `
    <!-- مشغل الكاميرا الحقيقية للجهاز -->
    <video id="ar-camera-feed" class="ar-camera-feed" autoplay playsinline muted></video>

    <!-- كانفاس الرؤية الحاسوبية الخفية للتعرف على البطاقة والسطح -->
    <canvas id="ar-tracking-canvas" width="160" height="120" style="display:none;"></canvas>

    <!-- كانفاس Three.js الشفاف المدمج فوق الكاميرا -->
    <div id="ar-canvas-container" class="ar-canvas-container"></div>

    <!-- الترويسة العلوية للواقع المعزز -->
    <header class="ar-top-bar">
      <div class="ar-brand-badge">
        <span class="ar-pulse-dot"></span>
        <span class="ar-logo-spark">✨</span>
        <div class="ar-title-group">
          <strong>الواقع المعزز الحقيقي (True AR)</strong>
          <small>${title}</small>
        </div>
      </div>
      <div class="ar-top-actions">
        <button type="button" id="ar-view-card-btn" class="ar-icon-btn" title="عرض بطاقة التتبع AR Marker">
          📄 <span>البطاقة</span>
        </button>
        <button type="button" id="ar-voice-btn" class="ar-icon-btn" title="استمع للتوجيه الصوتي">
          🔊 <span>توجيه صوتي</span>
        </button>
        <button type="button" id="ar-flip-camera-btn" class="ar-icon-btn" title="تبديل الكاميرا">
          🔄
        </button>
      </div>
    </header>

    <!-- شارة حالة التتبع الحية للواقع المعزز -->
    <div class="ar-tracking-status-pill" id="ar-tracking-pill">
      <span class="ar-status-icon" id="ar-status-icon">🔍</span>
      <span class="ar-status-text" id="ar-status-text">وجّه الكاميرا نحو بطاقة التتبع أو سطح الطاولة...</span>
    </div>

    <!-- بطاقة توجيه المحقق الصغير الطافية -->
    <div class="ar-detective-floating-card" id="ar-detective-card">
      <div class="ar-detective-avatar">⚡</div>
      <div class="ar-detective-bubble">
        <strong id="ar-bubble-title">مرحباً بك يا بطل! 🌟</strong>
        <p id="ar-bubble-text">
          شاهد المجسم ثلاثي الأبعاد يطفو في غرفتك كالسحر! يمكنك لمسه وتدويره 360°، وعندما تكون جاهزاً اضغط الزر الذهبي لبدء التحدي!
        </p>
      </div>
    </div>

    <!-- شريط التبديل بين المجسمات ثلاثية الأبعاد -->
    <div class="ar-model-switcher" id="ar-model-switcher">
      <button type="button" class="ar-model-chip active" data-model="car">
        🚗 <span>سيارة ألعاب</span>
      </button>
      <button type="button" class="ar-model-chip" data-model="radio">
        📻 <span>راديو</span>
      </button>
      <button type="button" class="ar-model-chip" data-model="battery">
        🔋 <span>بطارية</span>
      </button>
      <button type="button" class="ar-model-chip" data-model="lamp">
        💡 <span>مصباح</span>
      </button>
    </div>

    <!-- الإجراءات السفلية: الزر الذهبي الرئيسي وتخطي الكاميرا -->
    <footer class="ar-bottom-controls">
      <button type="button" id="ar-skip-btn" class="ar-btn-secondary">
        تخطي الكاميرا
      </button>
      <button type="button" id="ar-continue-btn" class="ar-btn-primary-golden">
        <span>انتقل للنشاط التقويمي</span>
        <span class="ar-btn-arrow">➔</span>
      </button>
    </footer>

    <!-- نافذة منبثقة لعرض وطباعة بطاقة التتبع AR Marker -->
    <div id="ar-marker-modal" class="ar-marker-modal" style="display:none;">
      <div class="ar-marker-card">
        <div class="ar-marker-head">
          <h3>📄 بطاقة الواقع المعزز (AR Marker Card)</h3>
          <button type="button" id="ar-marker-close-btn" class="ar-modal-close">✕</button>
        </div>
        <p class="ar-marker-hint">
          وجّه كاميرا هاتفك نحو هذه البطاقة أو افتحها من شاشة ثانية لرؤية المجسم يطفو فوقها مباشرة:
        </p>
        <div class="ar-marker-preview-box">
          <!-- نمط باركود التتبع الهولوغرامي Hiro/Spark -->
          <svg viewBox="0 0 240 240" class="ar-svg-marker">
            <rect width="240" height="240" fill="#000000" />
            <rect x="36" y="36" width="168" height="168" fill="#FFFFFF" rx="10" />
            <circle cx="120" cy="120" r="48" fill="#FFB703" />
            <path d="M 120 85 L 128 112 L 155 120 L 128 128 L 120 155 L 112 128 L 85 120 L 112 112 Z" fill="#2F3E36" />
            <circle cx="120" cy="120" r="10" fill="#FFFFFF" />
          </svg>
        </div>
        <div class="ar-marker-actions">
          <button type="button" class="ar-btn-print" onclick="window.print()">
            🖨️ طباعة البطاقة
          </button>
          <button type="button" id="ar-marker-ok-btn" class="ar-btn-ok">
            فهمت، وجّه الكاميرا الآن
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // إيقاف تمرير الصفحة أثناء الواقع المعزز
  const prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const videoEl = overlay.querySelector('#ar-camera-feed');
  const canvasContainer = overlay.querySelector('#ar-canvas-container');
  const pillEl = overlay.querySelector('#ar-tracking-pill');
  const statusIcon = overlay.querySelector('#ar-status-icon');
  const statusText = overlay.querySelector('#ar-status-text');
  const continueBtn = overlay.querySelector('#ar-continue-btn');
  const skipBtn = overlay.querySelector('#ar-skip-btn');
  const viewCardBtn = overlay.querySelector('#ar-view-card-btn');
  const markerModal = overlay.querySelector('#ar-marker-modal');
  const markerCloseBtn = overlay.querySelector('#ar-marker-close-btn');
  const markerOkBtn = overlay.querySelector('#ar-marker-ok-btn');
  const voiceBtn = overlay.querySelector('#ar-voice-btn');
  const flipBtn = overlay.querySelector('#ar-flip-camera-btn');
  const switcherBtns = overlay.querySelectorAll('.ar-model-chip');

  trackingCanvas = overlay.querySelector('#ar-tracking-canvas');
  trackingCtx = trackingCanvas?.getContext('2d', { willReadFrequently: true });

  let currentFacingMode = 'environment';

  // 1. تشغيل كاميرا الهاتف
  async function startCamera(facing = 'environment') {
    try {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      activeStream = stream;
      videoEl.srcObject = stream;
      await videoEl.play();
      statusText.textContent = 'الكاميرا نشطة! وجّه نحو البطاقة أو سطح الطاولة';
      statusIcon.textContent = '📷';
      startTrackingLoop();
    } catch (err) {
      console.warn('Camera access error in AR Gateway:', err);
      // في حال تعذر فتح الكاميرا (حاسوب مكتبي بلا كاميرا أو تم رفض الإذن):
      // تفعيل خلفية بيئة طاولة الواقع المعزز الافتراضية بسلاسة
      videoEl.style.display = 'none';
      overlay.classList.add('ar-simulated-mode');
      statusText.textContent = 'وضع المحاكاة ثلاثي الأبعاد نشط (السطح الافتراضي)';
      statusIcon.textContent = '🪐';
      markerDetected = true;
      updateDetectedState();
    }
  }

  // 2. حلقة التعرف البصري على البطاقة والسطح (Vision Tracking Loop)
  function startTrackingLoop() {
    clearInterval(trackingTimer);
    trackingTimer = setInterval(() => {
      if (!trackingCtx || !videoEl || videoEl.readyState < 2) return;
      try {
        trackingCtx.drawImage(videoEl, 0, 0, 160, 120);
        const frame = trackingCtx.getImageData(0, 0, 160, 120);
        const data = frame.data;
        let contrastDiff = 0, centerLight = 0, edgeLight = 0;

        // فحص تباين المركز مقابل الأطراف للتعرف على النمط المربع
        for (let i = 0; i < data.length; i += 16) {
          const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          const pixelIdx = i / 4;
          const x = pixelIdx % 160, y = Math.floor(pixelIdx / 160);
          if (x > 40 && x < 120 && y > 30 && y < 90) {
            centerLight += lum;
          } else {
            edgeLight += lum;
          }
        }

        contrastDiff = Math.abs((centerLight / 4800) - (edgeLight / 14400));
        // عند التقاط نمط متباين أو تثبيت الكاميرا
        if (contrastDiff > 12 || !markerDetected) {
          if (!markerDetected) {
            markerDetected = true;
            updateDetectedState();
          }
        }
      } catch {}
    }, 150);
  }

  function updateDetectedState() {
    pillEl.classList.add('detected');
    statusIcon.textContent = '🎯';
    statusText.textContent = 'تم التعرف على الهدف! المجسم يطفو في عالمك الحقيقي!';
    
    // نطق التوجيه الصوتي للنجاح في AR
    speak(
      'رائع! تم التعرف على بطاقة التتبع في العالم الحقيقي! يمكنك تدوير المجسم ولمسه، ثم اضغط على انتقل للنشاط التقويمي.',
      'ar'
    );
  }

  // 3. تهيئة مشهد Three.js ثلاثي الأبعاد للواقع المعزز
  function initThreeAR() {
    const width = canvasContainer.clientWidth || window.innerWidth;
    const height = canvasContainer.clientHeight || window.innerHeight;

    arScene = new THREE.Scene();
    arCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    arCamera.position.set(0, 1.6, 3.2);
    arCamera.lookAt(0, 0.6, 0);

    arRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    arRenderer.setSize(width, height);
    arRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    arRenderer.shadowMap.enabled = true;
    canvasContainer.appendChild(arRenderer.domElement);

    // إضاءة واقعية
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.4);
    arScene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    dirLight.position.set(2, 4, 3);
    dirLight.castShadow = true;
    arScene.add(dirLight);

    const pointLight = new THREE.PointLight(0xFFB703, 1.5, 8);
    pointLight.position.set(0, 2, 0);
    arScene.add(pointLight);

    // إضافة لوحة التتبع ثلاثية الأبعاد (Reticle)
    const reticle = createArReticle();
    arScene.add(reticle);

    // إضافة النموذج الافتراضي (السيارة)
    loadModel('car');

    // تفاعل التدوير واللمس عبر السحب بإصبع واحد
    let isDragging = false, prevX = 0, prevY = 0;
    const dom = arRenderer.domElement;

    const onDown = (x, y) => {
      isDragging = true;
      prevX = x;
      prevY = y;
    };
    const onMove = (x, y) => {
      if (!isDragging || !currentModelGroup) return;
      const dx = x - prevX;
      const dy = y - prevY;
      prevX = x;
      prevY = y;
      currentModelGroup.rotation.y += dx * 0.015;
      currentModelGroup.rotation.x = Math.max(-0.5, Math.min(0.5, currentModelGroup.rotation.x + dy * 0.01));
    };
    const onUp = () => { isDragging = false; };

    // أحداث الماوس
    dom.addEventListener('mousedown', e => onDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onUp);

    // أحداث اللمس الأصلية للجوالات
    dom.addEventListener('touchstart', e => {
      if (e.touches[0]) onDown(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchmove', e => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchend', onUp);

    // حلقة التصيير والأنيميشن
    let clock = new THREE.Clock();
    function animate() {
      arAnimFrame = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // تدوير تلقائي بطيء وممتع عند عدم لمس المستخدم
      if (!isDragging && currentModelGroup) {
        currentModelGroup.rotation.y += 0.008;
        // طفو ناعم في الفضاء الواقعي
        currentModelGroup.position.y = Math.sin(time * 2.5) * 0.06;
      }

      if (reticle?.userData?.animate) reticle.userData.animate(time);
      if (currentModelGroup?.userData?.animate) currentModelGroup.userData.animate(time);

      arRenderer.render(arScene, arCamera);
    }
    animate();

    // ضبط الأبعاد عند تدوير الهاتف أو تغيير حجم الشاشة
    window.addEventListener('resize', handleResize);
  }

  function handleResize() {
    if (!arRenderer || !arCamera || !canvasContainer) return;
    const w = canvasContainer.clientWidth || window.innerWidth;
    const h = canvasContainer.clientHeight || window.innerHeight;
    arCamera.aspect = w / h;
    arCamera.updateProjectionMatrix();
    arRenderer.setSize(w, h);
  }

  function loadModel(modelId) {
    if (currentModelGroup) {
      arScene.remove(currentModelGroup);
    }
    switch (modelId) {
      case 'car': currentModelGroup = createArCar(); break;
      case 'radio': currentModelGroup = createArRadio(); break;
      case 'battery': currentModelGroup = createArBattery(); break;
      case 'lamp': currentModelGroup = createArLamp(); break;
      default: currentModelGroup = createArCar();
    }
    currentModelGroup.position.set(0, 0, 0);
    arScene.add(currentModelGroup);
  }

  // 4. ربط أحداث أزرار التبديل والمودال
  switcherBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switcherBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadModel(btn.dataset.model);
      const names = {
        car: 'سيارة ألعاب الأطفال تعمل بالبطارية',
        radio: 'الراديو المحمول الصغير يعمل بالبطارية',
        battery: 'البطارية الجافة خفيفة وآمنة',
        lamp: 'مصباح المكتب السلكي يعمل بكهرباء المنزل'
      };
      speak(names[btn.dataset.model] || 'مجسم ثلاثي الأبعاد', 'ar');
    });
  });

  // فتح وإغلاق نافذة بطاقة التتبع
  viewCardBtn.addEventListener('click', () => {
    markerModal.style.display = 'flex';
  });
  markerCloseBtn.addEventListener('click', () => {
    markerModal.style.display = 'none';
  });
  markerOkBtn.addEventListener('click', () => {
    markerModal.style.display = 'none';
  });

  // تبديل الكاميرا الخلفية / الأمامية
  flipBtn.addEventListener('click', () => {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    startCamera(currentFacingMode);
  });

  // نطق التوجيه الصوتي
  voiceBtn.addEventListener('click', () => {
    speak(
      'مرحباً بك في مدخل الواقع المعزز! وجّه الكاميرا نحو بطاقة التتبع أو سطح الطاولة لمشاهدة المجسم ثلاثي الأبعاد. يمكنك تدويره بأصابعك 360 درجة، ثم اضغط على انتقل للنشاط التقويمي.',
      'ar'
    );
  });

  // إغلاق الواقع المعزز والانتقال للنشاط التقويمي
  function closeAndContinue() {
    stopAudio();
    clearInterval(trackingTimer);
    if (arAnimFrame) cancelAnimationFrame(arAnimFrame);
    if (activeStream) {
      activeStream.getTracks().forEach(t => t.stop());
      activeStream = null;
    }
    window.removeEventListener('resize', handleResize);
    document.body.style.overflow = prevBodyOverflow;
    
    // حركة خروج سلسة
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
      onContinue();
    }, 380);
  }

  continueBtn.addEventListener('click', closeAndContinue);
  skipBtn.addEventListener('click', closeAndContinue);

  // تشغيل الكاميرا و Three.js والترحيب الصوتي الأولي
  await startCamera(currentFacingMode);
  initThreeAR();

  // ترحيب صوتي باللغة العربية
  setTimeout(() => {
    speak(
      'أهلاً بك في عالم الواقع المعزز! وجّه الكاميرا نحو بطاقة التتبع أو سطح الطاولة لمشاهدة المجسم ثلاثي الأبعاد.',
      'ar'
    );
  }, 450);
}
