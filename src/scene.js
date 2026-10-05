// ═══════════════════════════════════════════════════════════════════════════
// src/scene.js — محرك المشهد ثلاثي الأبعاد الشامل لمختبر شرارة المتحرك
// كاميرا تلقائية fitToDevices، كاميرا الكشف Reveal Intro، مؤشرات ومجسمات الـ 24 جهازاً
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const defaults = {
  blue: 0x3093d7,
  navy: 0x254a61,
  mint: 0x60cbbb,
  yellow: 0xffcf57,
  white: 0xf7faf4,
  dark: 0x294552,
  orange: 0xf3a05c,
  red: 0xe53e3e,
  silver: 0xcfd8dc
};

export async function createLabScene(host, { getState, dispatch, onDevice, onBattery, onMains, projectLabel }) {
  let palette = { ...defaults };
  try {
    const result = await fetch('./assets/models/lab-design.json', { signal: AbortSignal.timeout(4000) });
    if (result.ok) {
      const data = await result.json();
      for (const key of Object.keys(defaults)) {
        if (Number.isInteger(data.palette?.[key])) palette[key] = data.palette[key];
      }
    }
  } catch {}

  let renderer;
  try {
    if (new URLSearchParams(location.search).has('fallback')) throw Error('Requested fallback');
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    dispatch({ type: 'RENDERER_FAILED' });
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6.5, 6.5, 4.3, -4.3, 0.1, 80);
  let view = 0, zoom = 1, focus = null, dead = false, frame = 0, renderCount = 0;
  let isIntroPlaying = false, introProgress = 0, introStartTime = 0;
  let targetCamPos = new THREE.Vector3(-1.8, 12, 14);
  let currentCamPos = new THREE.Vector3(-1.8, 12, 14);
  let targetLookAt = new THREE.Vector3(0, 1.8, 0);
  let currentLookAt = new THREE.Vector3(0, 1.8, 0);
  let isPassthrough = false;

  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xeaf5f2, 1);

  host.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const ambient = new THREE.HemisphereLight(0xffffff, 0xaccbd0, 1.8);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff5dc, 2.1);
  sun.position.set(-3, 10, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.0001;
  scene.add(sun);

  // ─── ذاكرة التخزين المؤقت للمواد لتجنب التسريب وإنشاء مواد كل إطار ───
  const mats = new Map();
  function mat(color, isEmissive = 0) {
    const key = `${color}_${isEmissive ? 1 : 0}`;
    if (!mats.has(key)) {
      mats.set(key, new THREE.MeshStandardMaterial({
        color,
        roughness: 0.65,
        emissive: isEmissive ? new THREE.Color(color) : new THREE.Color(0x000000),
        emissiveIntensity: isEmissive ? 0.85 : 0
      }));
    }
    return mats.get(key);
  }

  function mesh(parent, geo, color, pos, isEmissive = 0) {
    const m = new THREE.Mesh(geo, mat(color, isEmissive));
    if (pos) m.position.set(...pos);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  const box = (p, w, h, d, c, x = 0, y = 0, z = 0, r = 0.08) => mesh(p, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3)), c, [x, y, z]);
  const cyl = (p, r, h, c, x = 0, y = 0, z = 0, n = 24) => mesh(p, new THREE.CylinderGeometry(r, r, h, n), c, [x, y, z]);
  const ball = (p, r, c, x = 0, y = 0, z = 0) => mesh(p, new THREE.SphereGeometry(r, 20, 12), c, [x, y, z]);

  function label(p, text, x, y, z, w = 0.7, h = 0.25, bg = '#f5faf4', fg = '#294552') {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 160;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = fg; ctx.font = 'bold 92px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 87);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }));
    m.position.set(x, y, z);
    p.add(m);
    return m;
  }

  // ─── الأرضية والخلفية والشبكة التفاعلية ───
  const bgGroup = new THREE.Group();
  scene.add(bgGroup);

  const ground = box(bgGroup, 40, 0.1, 30, 0xe1efec, 0, -0.1, 0);
  ground.receiveShadow = true;
  const grid = new THREE.GridHelper(36, 36, 0xcaddd9, 0xd2e3de);
  grid.position.y = -0.038;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  bgGroup.add(grid);

  // جدار الغرفة الخلفي واللوحات
  box(bgGroup, 26, 10, 0.15, 0xe7f2ec, 0, 4, -5.8);
  box(bgGroup, 4.5, 3.2, 0.12, 0xc0e6ec, -4, 4.2, -5.66);
  box(bgGroup, 3.5, 0.15, 0.5, 0xb2d4ce, 3.2, 3.25, -5.4);
  for (let i = 0; i < 5; i++) {
    box(bgGroup, 0.23, 0.65 + (i % 2) * 0.12, 0.33, [palette.blue, palette.yellow, palette.mint, palette.orange, palette.white][i], 2 + i * 0.28, 3.62, -5.35, 0.015);
  }

  // طاولة المختبر الرئيسية (تتسع بدقة للأجهزة الـ 4)
  const cart = new THREE.Group();
  scene.add(cart);
  box(cart, 9.8, 0.25, 3.2, 0xf7e5b1, 0, 1.75, 0, 0.1);
  box(cart, 9.6, 0.11, 3.05, 0xfdfbf0, 0, 1.91, 0, 0.05);
  box(cart, 9.4, 0.19, 2.8, 0x8ad1c5, 0, 0.55, 0);
  for (const x of [-4.4, 4.4]) {
    for (const z of [-1.15, 1.15]) {
      box(cart, 0.15, 1.38, 0.15, palette.navy, x, 1, z, 0.03);
      const w = cyl(cart, 0.26, 0.18, palette.dark, x, 0.2, z);
      w.rotation.z = Math.PI / 2;
    }
  }

  // ─── الروبوت شرارة (الذراع المؤشرة وحركات التوجيه) ───
  const robot = new THREE.Group();
  robot.position.set(5.1, 0.02, -0.05);
  scene.add(robot);
  cyl(robot, 0.48, 0.17, palette.navy, 0, 0.17, 0);
  box(robot, 0.69, 0.77, 0.57, palette.white, 0, 0.7, 0, 0.15);
  box(robot, 0.48, 0.3, 0.05, palette.mint, 0, 0.76, 0.31);
  box(robot, 0.94, 0.66, 0.62, palette.white, 0, 1.45, 0, 0.19);
  box(robot, 0.75, 0.39, 0.06, palette.navy, 0, 1.46, 0.32, 0.1);
  for (const x of [-0.2, 0.2]) ball(robot, 0.055, palette.mint, x, 1.5, 0.37);

  const robotArmPivot = new THREE.Group();
  robotArmPivot.position.set(-0.45, 1.15, 0);
  robot.add(robotArmPivot);
  const robotArm = box(robotArmPivot, 0.18, 0.65, 0.18, palette.mint, 0, -0.32, 0, 0.06);
  robotArmPivot.rotation.z = 0.2;

  // ─── لوحة الجدار المثبتة وعمود مقبس 220V ───
  const wallSocketPillar = new THREE.Group();
  scene.add(wallSocketPillar);
  wallSocketPillar.position.set(-4.5, 0, -1.8);
  box(wallSocketPillar, 0.4, 4.4, 0.4, 0x94a3b8, 0, 2.2, 0, 0.05);

  const socketPos = new THREE.Vector3(-4.5, 2.2, -1.6);
  const wallSocketGroup = new THREE.Group();
  scene.add(wallSocketGroup);
  wallSocketGroup.position.copy(socketPos);
  box(wallSocketGroup, 0.74, 0.78, 0.12, 0xf8fafc, 0, 0, 0, 0.05);
  box(wallSocketGroup, 0.66, 0.70, 0.14, 0xe2e8f0, 0, 0, 0.01, 0.03);
  for (const yo of [-0.17, 0.17]) {
    const cav = cyl(wallSocketGroup, 0.16, 0.04, 0xcdd7d4, 0, yo, 0.08);
    cav.rotation.x = Math.PI / 2;
    for (const xo of [-0.065, 0.065]) {
      const pin = cyl(wallSocketGroup, 0.022, 0.06, 0x0f172a, xo, yo, 0.09);
      pin.rotation.x = Math.PI / 2;
    }
  }
  ball(wallSocketGroup, 0.035, 0xef4444, 0.22, 0.28, 0.08);
  label(wallSocketGroup, '220V مقبس كهرباء', 0, -0.45, 0.08, 0.78, 0.22, '#254a61', '#ffcf57');

  // كابل الكهرباء وقابس 220V
  const mainsWire = new THREE.Group();
  scene.add(mainsWire);
  const initialCurve = new THREE.CatmullRomCurve3([
    socketPos,
    new THREE.Vector3(-3.8, 1.85, -1.3),
    new THREE.Vector3(-3.1, 2.05, -1.0)
  ]);
  let mainsWireMesh = mesh(mainsWire, new THREE.TubeGeometry(initialCurve, 24, 0.038, 8, false), palette.navy);
  mainsWire.visible = false;

  const plugModel = new THREE.Group();
  scene.add(plugModel);
  box(plugModel, 0.26, 0.20, 0.40, palette.navy, 0, 0, 0, 0.04);
  const prong1 = cyl(plugModel, 0.025, 0.16, 0xd0d0d0, -0.065, 0, 0.25); prong1.rotation.x = Math.PI / 2;
  const prong2 = cyl(plugModel, 0.025, 0.16, 0xd0d0d0, 0.065, 0, 0.25); prong2.rotation.x = Math.PI / 2;
  const plugBoot = cyl(plugModel, 0.055, 0.10, 0x1a1a1a, 0, 0, -0.22); plugBoot.rotation.x = Math.PI / 2;
  plugModel.visible = false;

  let lastTargetPlugPos = null;
  function updateMainsCable(targetPlugPos) {
    if (lastTargetPlugPos && lastTargetPlugPos.distanceToSquared(targetPlugPos) < 0.0001) return;
    lastTargetPlugPos = targetPlugPos.clone();

    const midPoint = new THREE.Vector3().addVectors(socketPos, targetPlugPos).multiplyScalar(0.5);
    midPoint.y = Math.max(1.72, Math.min(midPoint.y, 2.2) - 0.48);
    midPoint.z += 0.25;

    const dynamicCurve = new THREE.CatmullRomCurve3([
      socketPos,
      new THREE.Vector3(-3.8, 1.85, -1.3),
      midPoint,
      targetPlugPos
    ]);

    if (mainsWireMesh) {
      mainsWireMesh.geometry.dispose();
      mainsWireMesh.geometry = new THREE.TubeGeometry(dynamicCurve, 24, 0.038, 8, false);
    }
    plugModel.position.copy(targetPlugPos);
    plugModel.lookAt(targetPlugPos.x, targetPlugPos.y, targetPlugPos.z + 1);
    mainsWire.visible = true;
    plugModel.visible = true;
  }

  // ─── الشرارات والتوهج والضوء التفاعلي ───
  const sparksGroup = new THREE.Group();
  scene.add(sparksGroup);
  const sparksPointLight = new THREE.PointLight(0xffd700, 0, 4.5);
  sparksGroup.add(sparksPointLight);

  const sparkMeshes = [];
  const sparkVelocities = [];
  const sparkGeo = new THREE.SphereGeometry(0.045, 6, 6);
  const sparkMatYellow = new THREE.MeshBasicMaterial({ color: 0xffd700 });
  const sparkMatBlue = new THREE.MeshBasicMaterial({ color: 0x00e5ff });

  for (let i = 0; i < 22; i++) {
    const sm = new THREE.Mesh(sparkGeo, i % 2 === 0 ? sparkMatYellow : sparkMatBlue);
    sm.visible = false;
    sparksGroup.add(sm);
    sparkMeshes.push(sm);
    sparkVelocities.push(new THREE.Vector3());
  }
  let sparksActive = false, sparksStartTime = 0;

  function triggerSparks(pos) {
    sparksGroup.position.copy(pos);
    sparksPointLight.intensity = 2.8;
    sparksActive = true;
    sparksStartTime = performance.now();
    sparkMeshes.forEach((m, idx) => {
      m.position.set(0, 0, 0);
      m.visible = true;
      m.scale.setScalar(1);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.7;
      const speed = 0.09 + Math.random() * 0.16;
      sparkVelocities[idx].set(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + 0.06,
        Math.sin(phi) * Math.sin(theta) * speed
      );
    });
  }

  function updateSparks(now) {
    if (!sparksActive) return;
    const elapsed = (now - sparksStartTime) / 1000;
    if (elapsed > 0.75) {
      sparksActive = false;
      sparkMeshes.forEach(m => { m.visible = false; });
      sparksPointLight.intensity = 0;
      return;
    }
    sparksPointLight.intensity = Math.max(0, 2.8 * (1 - elapsed / 0.75));
    const factor = Math.max(0, 1 - elapsed / 0.75);
    sparkMeshes.forEach((m, idx) => {
      m.position.add(sparkVelocities[idx]);
      sparkVelocities[idx].y -= 0.007;
      m.scale.setScalar(factor);
    });
  }

  // حلقة هالة التوجيه النابضة (Target Highlight Glow Ring)
  const targetRing = new THREE.Mesh(
    new THREE.RingGeometry(0.7, 0.9, 32),
    new THREE.MeshBasicMaterial({ color: 0xffb703, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  targetRing.rotation.x = -Math.PI / 2;
  targetRing.position.y = 1.98;
  targetRing.visible = false;
  scene.add(targetRing);

  // ─── 4 أماكن للأجهزة على الطاولة ───
  const SLOT_X_LANDSCAPE = [-2.55, -0.85, 0.85, 2.55];
  const SLOT_POS_PORTRAIT = [
    new THREE.Vector3(-1.4, 1.98, -0.6),
    new THREE.Vector3(1.4, 1.98, -0.6),
    new THREE.Vector3(-1.4, 1.98, 0.6),
    new THREE.Vector3(1.4, 1.98, 0.6)
  ];

  const objects = {};
  const activeEffects = {};
  const targets = [];

  function registerTarget(obj, id) {
    obj.traverse(o => {
      if (o.isMesh) {
        o.userData.device = id;
        targets.push(o);
      }
    });
  }

  // ─── بناء حجرة البطارية مع أقطاب (+ / -) لجميع أجهزة البطارية الـ 12 ───
  function attachBatteryBay(parent, x = 0, y = 0.35, z = 0.35, scale = 1) {
    const bay = new THREE.Group();
    bay.position.set(x, y, z);
    bay.scale.setScalar(scale);
    box(bay, 0.90, 0.26, 0.20, 0x1e293b, 0, 0, 0, 0.03);
    box(bay, 0.84, 0.20, 0.16, 0x0f172a, 0, 0.02, 0, 0.02);
    box(bay, 0.04, 0.12, 0.10, 0xf59e0b, 0.38, 0.02, 0);
    const sp = cyl(bay, 0.045, 0.07, 0xcfd8dc, -0.38, 0.02, 0);
    sp.rotation.z = Math.PI / 2;
    label(bay, '-  1.5V  +', 0, 0.13, 0.05, 0.46, 0.14, '#0f172a', '#facc15');
    parent.add(bay);
    return bay;
  }

  // ─── مصنع مجسمات الأجهزة الـ 24 ───
  function createDeviceMesh(id) {
    const g = new THREE.Group();
    g.name = id;
    const fx = {};

    switch (id) {
      case 'car':
      case 'toyCar':
        box(g, 1.6, 0.38, 0.95, palette.yellow, 0, 0.45, 0, 0.15);
        box(g, 0.95, 0.48, 0.82, palette.yellow, -0.1, 0.78, 0, 0.14);
        box(g, 0.75, 0.32, 0.84, 0x7db8ca, -0.12, 0.84, 0, 0.08);
        attachBatteryBay(g, -0.46, 0.62, 0, 0.95);
        fx.wheels = [];
        for (const x of [-0.55, 0.55]) for (const z of [-0.48, 0.48]) {
          const w = cyl(g, 0.25, 0.16, palette.dark, x, 0.22, z);
          w.rotation.x = Math.PI / 2;
          fx.wheels.push(w);
        }
        fx.headlights = [ball(g, 0.08, 0xfef08a, 0.78, 0.42, -0.32), ball(g, 0.08, 0xfef08a, 0.78, 0.42, 0.32)];
        fx.headlights.forEach(h => { h.visible = false; });
        break;

      case 'radio':
        box(g, 1.4, 1.1, 0.6, palette.blue, 0, 0.75, 0, 0.15);
        cyl(g, 0.35, 0.08, palette.navy, -0.28, 0.78, 0.32).rotation.x = Math.PI / 2;
        cyl(g, 0.1, 0.09, palette.white, 0.38, 0.7, 0.33).rotation.x = Math.PI / 2;
        attachBatteryBay(g, 0, 0.32, 0.31, 0.9);
        fx.radioLight = ball(g, 0.055, 0x6b7b78, 0.48, 1.1, 0.32);
        fx.waves = new THREE.Group(); g.add(fx.waves);
        fx.waves.position.set(-0.8, 0.85, 0);
        for (let i = 0; i < 3; i++) {
          const r = mesh(fx.waves, new THREE.TorusGeometry(0.18 + i * 0.12, 0.02, 6, 18, Math.PI), palette.mint);
          r.rotation.z = Math.PI / 2; r.position.x = -i * 0.08;
        }
        fx.waves.visible = false;
        break;

      case 'flashlight':
        const fb = cyl(g, 0.15, 1.1, palette.orange, 0, 0.55, 0); fb.rotation.z = Math.PI / 2;
        const fh = cyl(g, 0.3, 0.35, palette.navy, 0.62, 0.55, 0); fh.rotation.z = Math.PI / 2;
        attachBatteryBay(g, -0.05, 0.55, 0, 0.8);
        fx.beam = mesh(g, new THREE.ConeGeometry(0.55, 1.2, 16), 0xfef08a, [1.35, 0.55, 0]);
        fx.beam.rotation.z = -Math.PI / 2;
        fx.beam.material = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.65 });
        fx.beam.visible = false;
        break;

      case 'wallClock':
        const cf = cyl(g, 0.65, 0.14, palette.mint, 0, 0.75, 0); cf.rotation.x = Math.PI / 2;
        const cd = cyl(g, 0.56, 0.15, palette.white, 0, 0.75, 0.01); cd.rotation.x = Math.PI / 2;
        attachBatteryBay(g, 0, 0.75, -0.10, 0.75);
        fx.handH = box(g, 0.04, 0.32, 0.02, palette.dark, 0, 0.85, 0.08);
        fx.handM = box(g, 0.03, 0.44, 0.02, palette.red, 0, 0.88, 0.09);
        break;

      case 'remote':
        box(g, 0.48, 1.25, 0.22, palette.dark, 0, 0.68, 0, 0.06);
        for (let y = 0.4; y <= 1.0; y += 0.2) for (let x of [-0.12, 0.12]) box(g, 0.1, 0.1, 0.06, palette.silver, x, y, 0.12, 0.02);
        attachBatteryBay(g, 0, 0.65, -0.12, 0.65);
        fx.irLed = ball(g, 0.04, palette.red, 0, 1.32, 0);
        break;

      case 'calculator':
        box(g, 0.75, 1.1, 0.16, 0x334155, 0, 0.62, 0, 0.05);
        box(g, 0.58, 0.24, 0.04, 0x86efac, 0, 0.95, 0.09);
        attachBatteryBay(g, 0, 0.42, -0.10, 0.65);
        break;

      case 'digitalScale':
        box(g, 1.2, 0.12, 1.2, 0xe2e8f0, 0, 0.2, 0, 0.06);
        box(g, 0.48, 0.18, 0.04, 0x0f172a, 0, 0.27, -0.32);
        attachBatteryBay(g, 0, 0.06, 0, 0.75);
        break;

      case 'smokeDetector':
        const sdb = cyl(g, 0.62, 0.22, palette.white, 0, 0.55, 0); sdb.rotation.x = Math.PI / 2;
        attachBatteryBay(g, 0, 0.55, -0.12, 0.7);
        fx.alarmLight = ball(g, 0.05, palette.red, 0, 0.55, 0.14);
        break;

      case 'laserPointer':
        const lp = cyl(g, 0.09, 1.2, palette.blue, 0, 0.6, 0); lp.rotation.z = Math.PI / 2;
        attachBatteryBay(g, -0.15, 0.6, 0, 0.55);
        fx.laserDot = ball(g, 0.05, palette.red, 0.7, 0.6, 0);
        break;

      case 'hearingAid':
        mesh(g, new THREE.TorusGeometry(0.38, 0.1, 12, 20, Math.PI * 0.8), palette.orange, [0, 0.55, 0]);
        attachBatteryBay(g, 0, 0.55, 0, 0.45);
        break;

      case 'robotToy':
        box(g, 0.85, 0.95, 0.65, palette.mint, 0, 0.75, 0, 0.12);
        attachBatteryBay(g, 0, 0.55, -0.34, 0.75);
        fx.robotEyes = [ball(g, 0.08, palette.yellow, -0.22, 0.95, 0.34), ball(g, 0.08, palette.yellow, 0.22, 0.95, 0.34)];
        break;

      case 'electricToothbrush':
        cyl(g, 0.16, 1.1, palette.white, 0, 0.65, 0);
        attachBatteryBay(g, 0, 0.45, 0.16, 0.55);
        fx.brushHead = cyl(g, 0.12, 0.22, palette.blue, 0, 1.25, 0);
        break;

      // أجهزة كهرباء المنزل 220V
      case 'fridge':
        box(g, 1.45, 2.7, 1.2, palette.white, 0, 1.55, 0, 0.12);
        box(g, 1.47, 0.06, 0.04, palette.navy, 0, 1.8, 0.61);
        box(g, 0.06, 0.45, 0.08, palette.dark, -0.6, 2.05, 0.64);
        box(g, 0.06, 0.65, 0.08, palette.dark, -0.6, 1.15, 0.64);
        fx.fridgeLight = ball(g, 0.08, 0x38bdf8, 0.48, 2.6, 0.62);
        break;

      case 'microwave':
        box(g, 1.6, 1.05, 1.0, palette.dark, 0, 0.75, 0, 0.08);
        box(g, 0.95, 0.65, 0.04, 0x0f172a, -0.25, 0.75, 0.51);
        break;

      case 'washer':
        box(g, 1.4, 1.6, 1.3, palette.white, 0, 1.0, 0, 0.1);
        cyl(g, 0.45, 0.08, palette.dark, 0, 0.95, 0.66).rotation.x = Math.PI / 2;
        break;

      case 'airConditioner':
        box(g, 2.2, 0.85, 0.65, palette.white, 0, 0.75, 0, 0.06);
        fx.acLight = ball(g, 0.04, palette.mint, 0.75, 0.75, 0.34);
        break;

      case 'vacuum':
        ball(g, 0.65, palette.orange, 0, 0.65, 0);
        for (let z of [-0.68, 0.68]) cyl(g, 0.35, 0.12, palette.dark, -0.15, 0.45, z).rotation.x = Math.PI / 2;
        break;

      case 'lamp':
        cyl(g, 0.45, 0.1, palette.dark, 0, 0.28, 0);
        cyl(g, 0.05, 1.2, palette.silver, 0, 0.88, 0);
        mesh(g, new THREE.ConeGeometry(0.55, 0.65, 20, 1, true), palette.yellow, [0, 1.48, 0]).rotation.x = Math.PI;
        fx.bulb = ball(g, 0.14, 0xfef08a, 0, 1.35, 0);
        break;

      case 'electricOven':
        box(g, 1.5, 1.4, 1.1, palette.dark, 0, 0.9, 0, 0.08);
        box(g, 1.1, 0.8, 0.04, 0x0f172a, 0, 0.8, 0.56);
        break;

      case 'iron':
        box(g, 1.2, 0.2, 0.65, palette.silver, 0, 0.35, 0, 0.05);
        box(g, 1.0, 0.4, 0.55, palette.blue, 0, 0.55, 0, 0.08);
        break;

      case 'hairDryer':
        const hdb = cyl(g, 0.25, 1.1, palette.red, 0, 0.75, 0); hdb.rotation.z = Math.PI / 2;
        cyl(g, 0.16, 0.85, palette.dark, 0.2, 0.35, 0);
        break;

      case 'electricWaterHeater':
        cyl(g, 0.65, 1.8, palette.white, 0, 1.1, 0);
        break;

      case 'electricHeater':
        box(g, 1.7, 1.2, 0.55, palette.red, 0, 0.8, 0, 0.06);
        break;

      case 'blender':
        cyl(g, 0.5, 0.7, palette.blue, 0, 0.55, 0);
        cyl(g, 0.42, 0.95, 0xdbeafe, 0, 1.25, 0);
        break;

      default:
        box(g, 1.2, 1.2, 1.0, palette.white, 0, 0.8, 0, 0.08);
        break;
    }

    registerTarget(g, id);
    activeEffects[id] = fx;
    return g;
  }

  // ─── ضبط الكاميرا التلقائي (fitToDevices) ───
  function fitToDevices({ animate = true } = {}) {
    if (focus && objects[focus]) {
      const p = objects[focus].position;
      targetLookAt.set(p.x, p.y + 0.3, p.z);
      targetCamPos.set(p.x - 0.5, p.y + 3.2, p.z + 5.5);
      zoom = 1.45;
    } else {
      const activeKeys = Object.keys(objects);
      if (activeKeys.length > 0) {
        let minX = Infinity, maxX = -Infinity;
        activeKeys.forEach(k => {
          const x = objects[k].position.x;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        });
        const midX = (minX + maxX) / 2;
        targetLookAt.set(midX, 1.8, 0);
        targetCamPos.set(midX - 1.2, 12, 14);
        zoom = 1.0;
      } else {
        targetLookAt.set(0, 1.8, 0);
        targetCamPos.set(-1.8, 12, 14);
        zoom = 1.0;
      }
    }

    if (!animate || getState().reducedMotion) {
      currentCamPos.copy(targetCamPos);
      currentLookAt.copy(targetLookAt);
      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);
    }
  }

  // ─── تركيب أجهزة الجولة ───
  function mountDevices(devIds) {
    // تنظيف الأجهزة السابقة
    for (const id in objects) {
      scene.remove(objects[id]);
      objects[id].traverse(o => {
        if (o.geometry) o.geometry.dispose();
      });
      delete objects[id];
      delete activeEffects[id];
    }
    targets.length = 0;

    const isPortrait = host.clientHeight > host.clientWidth * 1.15;

    devIds.forEach((id, idx) => {
      const meshObj = createDeviceMesh(id);
      if (isPortrait) {
        meshObj.position.copy(SLOT_POS_PORTRAIT[idx] || new THREE.Vector3(0, 1.98, 0));
      } else {
        meshObj.position.set(SLOT_X_LANDSCAPE[idx] ?? 0, 1.98, 0);
      }
      scene.add(meshObj);
      objects[id] = meshObj;
    });

    renderer.shadowMap.needsUpdate = true;
    fitToDevices({ animate: false });
  }

  // ─── كاميرا الكشف الافتتاحية (playRevealIntro) ───
  function playRevealIntro() {
    if (getState().reducedMotion) {
      fitToDevices({ animate: false });
      return;
    }
    isIntroPlaying = true;
    introProgress = 0;
    introStartTime = performance.now();
  }

  // ─── تمرير الكاميرا الشفاف للواقع المعزز ───
  function setCameraPassthrough(stream) {
    isPassthrough = Boolean(stream);
    if (isPassthrough) {
      renderer.setClearAlpha(0);
      bgGroup.visible = false;
    } else {
      renderer.setClearAlpha(1);
      bgGroup.visible = true;
    }
  }

  // ─── إشارة شرارة وحلقة التوهج للجهاز ───
  function pointTo(deviceId) {
    if (!deviceId || !objects[deviceId]) {
      robotArmPivot.rotation.z = 0.2;
      targetRing.visible = false;
      return;
    }
    const devPos = objects[deviceId].position;
    robotArmPivot.rotation.z = -0.65;
    targetRing.position.set(devPos.x, 1.99, devPos.z);
    targetRing.visible = true;
  }

  // ─── التحقق الدقيق من موضع النقر (Raycast with tuned radius) ───
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function at(x, y) {
    const rect = host.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;

    mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(targets, true);

    if (hits.length > 0) {
      let found = hits[0].object;
      while (found && !found.userData.device && found.parent) found = found.parent;
      return found?.userData?.device || null;
    }
    return null;
  }

  function setDragWorld(tool, x, y) {
    const d = at(x, y);
    if (d && objects[d]) {
      targetRing.position.set(objects[d].position.x, 1.99, objects[d].position.z);
      targetRing.visible = true;
    } else {
      targetRing.visible = false;
    }
  }

  function clearDragWorld() {
    targetRing.visible = false;
  }

  function cameraUpdate() {
    const aspect = host.clientWidth / host.clientHeight;
    const frustumSize = (host.clientHeight > host.clientWidth ? 12 : 9.5) / zoom;
    camera.left = -frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();
  }

  const observer = new ResizeObserver(() => {
    if (dead) return;
    renderer.setSize(host.clientWidth, host.clientHeight);
    cameraUpdate();
    fitToDevices({ animate: false });
  });
  observer.observe(host);
  cameraUpdate();

  // ─── حلقة التصيير والأنيميشن التفاعلي ───
  let prevRoundRevision = -1;

  function tick(now) {
    if (dead) return;
    frame = requestAnimationFrame(tick);
    renderCount++;

    const s = getState();
    const t = now * 0.001;

    // تحديث الأجهزة عند تغير الجولة
    if (s.sessionRevision !== prevRoundRevision) {
      prevRoundRevision = s.sessionRevision;
      mountDevices(Object.keys(s.devices || {}));
    }

    // حركة كاميرا الكشف الافتتاحية (Intro Sweep)
    if (isIntroPlaying) {
      const elapsed = (now - introStartTime) / 1000;
      if (elapsed > 3.0) {
        isIntroPlaying = false;
        fitToDevices({ animate: true });
      } else {
        const p = elapsed / 3.0;
        // مسح واسع عبر الأجهزة
        targetLookAt.set(Math.sin(p * Math.PI) * 2.0, 1.8, 0);
        targetCamPos.set(Math.sin(p * Math.PI) * 2.0 - 1.2, 12, 14);
      }
    }

    // تنعيم حركة الكاميرا (Smooth Lerp)
    currentCamPos.lerp(targetCamPos, 0.08);
    currentLookAt.lerp(targetLookAt, 0.08);
    camera.position.copy(currentCamPos);
    camera.lookAt(currentLookAt);

    // وميض حلقة التوجيه
    if (targetRing.visible) {
      targetRing.scale.setScalar(1 + Math.sin(t * 8) * 0.06);
    }

    // تحديث الشرارات
    updateSparks(now);

    // تحديث كابل الكهرباء
    if (s.mainsLocation && s.mainsLocation !== 'socket' && objects[s.mainsLocation]) {
      const devPos = objects[s.mainsLocation].position.clone();
      devPos.y += 0.25;
      updateMainsCable(devPos);
    } else {
      mainsWire.visible = false;
      plugModel.visible = false;
      lastTargetPlugPos = null;
    }

    // تحديث أنيميشن الأجهزة النشطة الـ 24
    for (const id in objects) {
      const isRunning = s.devices[id]?.status === 'running';
      const fx = activeEffects[id] || {};

      switch (id) {
        case 'car':
        case 'toyCar':
          if (isRunning && fx.wheels) {
            fx.wheels.forEach(w => { w.rotation.z += 0.28; });
            fx.headlights?.forEach(h => { h.visible = true; });
          } else {
            fx.headlights?.forEach(h => { h.visible = false; });
          }
          break;

        case 'radio':
          if (isRunning) {
            if (fx.waves) fx.waves.visible = true;
            if (fx.radioLight) fx.radioLight.material = mat(palette.mint, 1);
          } else {
            if (fx.waves) fx.waves.visible = false;
            if (fx.radioLight) fx.radioLight.material = mat(0x6b7b78, 0);
          }
          break;

        case 'flashlight':
          if (fx.beam) fx.beam.visible = isRunning;
          break;

        case 'wallClock':
          if (isRunning && fx.handM) {
            fx.handM.rotation.z += 0.12;
            fx.handH.rotation.z += 0.01;
          }
          break;

        case 'fridge':
          if (fx.fridgeLight) fx.fridgeLight.material = mat(isRunning ? 0x38bdf8 : 0x475569, isRunning ? 1 : 0);
          break;

        case 'airConditioner':
          if (fx.acLight) fx.acLight.material = mat(isRunning ? palette.mint : 0x475569, isRunning ? 1 : 0);
          break;

        case 'lamp':
          if (fx.bulb) fx.bulb.material = mat(isRunning ? 0xfef08a : 0x475569, isRunning ? 1 : 0);
          break;
      }

      // تحديث إحداثيات الشارات
      const v = objects[id].position.clone();
      v.y += id === 'fridge' ? 3.1 : 1.7;
      v.project(camera);
      projectLabel(id, (v.x + 1) * host.clientWidth / 2, (-v.y + 1) * host.clientHeight / 2);
    }

    renderer.render(scene, camera);
  }

  frame = requestAnimationFrame(tick);

  return {
    at,
    setDragWorld,
    clearDragWorld,
    triggerSparks,
    fitToDevices,
    playRevealIntro,
    setCameraPassthrough,
    pointTo,
    showTargetRing(deviceId) {
      if (!deviceId || !objects[deviceId]) {
        targetRing.visible = false;
      } else {
        const p = objects[deviceId].position;
        targetRing.position.set(p.x, 1.99, p.z);
        targetRing.visible = true;
      }
    },
    zoomIn() { zoom = Math.min(1.65, zoom + 0.15); cameraUpdate(); },
    zoomOut() { zoom = Math.max(0.75, zoom - 0.15); cameraUpdate(); },
    reset() {
      focus = null; zoom = 1; view = 0;
      for (const id in objects) {
        objects[id].rotation.set(0, 0, 0);
      }
      fitToDevices({ animate: true });
    },
    inspect(id) {
      focus = id || Object.keys(objects)[0];
      zoom = 1.6;
      view = view === 1 ? 0 : 1;
      if (objects[focus]) objects[focus].rotation.y += 0.8;
      fitToDevices({ animate: true });
    },
    rotateDevice(id, angleY) {
      if (objects[id]) objects[id].rotation.y += angleY;
    },
    dispose() {
      dead = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse(o => {
        o.geometry?.dispose();
        if (o.material?.map) o.material.map.dispose();
      });
      renderer.dispose();
    },
    stats() {
      return { renderCount, zoom, focus };
    }
  };
}
