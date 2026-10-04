import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const defaults = {blue: 0x3093d7, navy: 0x254a61, mint: 0x60cbbb, yellow: 0xffcf57, white: 0xf7faf4, dark: 0x294552, orange: 0xf3a05c, red: 0xe53e3e, silver: 0xcfd8dc};

export async function createLabScene(host, {getState, dispatch, onDevice, onBattery, onMains, projectLabel}) {
  let palette = {...defaults};
  try {
    const result = await fetch('./assets/models/lab-design.json', {signal: AbortSignal.timeout(4000)});
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
    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'low-power'});
  } catch {
    dispatch({type: 'RENDERER_FAILED'});
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6.5, 6.5, 4.3, -4.3, 0.1, 80);
  let view = 0, zoom = 1, focus = null, dead = false, frame = 0, renderCount = 0, measureStart = performance.now(), fps = 0, quality = 'standard', lastScienceRevision = -1;

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

  const mats = new Map();
  function mat(color, emissive = 0) {
    const key = `${color}_${emissive}`;
    if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({color, roughness: 0.65, emissive}));
    return mats.get(key);
  }

  function mesh(parent, geo, color, pos, emissive = 0) {
    const m = new THREE.Mesh(geo, mat(color, emissive));
    if (pos) m.position.set(...pos);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  const box = (p, w, h, d, c, x = 0, y = 0, z = 0, r = 0.08) => mesh(p, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w/3, h/3, d/3)), c, [x, y, z]);
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
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: t}));
    m.position.set(x, y, z);
    p.add(m);
    return m;
  }

  // Ground & Grid
  const ground = box(scene, 40, 0.1, 30, 0xe1efec, 0, -0.1, 0);
  ground.receiveShadow = true;
  const grid = new THREE.GridHelper(36, 36, 0xcaddd9, 0xd2e3de);
  grid.position.y = -0.038;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  scene.add(grid);

  // Background wall & room decorations
  box(scene, 26, 10, 0.15, 0xe7f2ec, 0, 4, -5.8);
  box(scene, 4.5, 3.2, 0.12, 0xc0e6ec, -4, 4.2, -5.66);
  box(scene, 3.5, 0.15, 0.5, 0xb2d4ce, 3.2, 3.25, -5.4);
  for (let i = 0; i < 5; i++) box(scene, 0.23, 0.65 + (i % 2) * 0.12, 0.33, [palette.blue, palette.yellow, palette.mint, palette.orange, palette.white][i], 2 + i * 0.28, 3.62, -5.35, 0.015);

  // Cart Table (واسعة تتسع لـ 4 أجهزة)
  const cart = new THREE.Group();
  scene.add(cart);
  box(cart, 9.8, 0.25, 3.2, 0xf7e5b1, 0, 1.75, 0, 0.1);
  box(cart, 9.6, 0.11, 3.05, 0xfdfbf0, 0, 1.91, 0, 0.05);
  box(cart, 9.4, 0.19, 2.8, 0x8ad1c5, 0, 0.55, 0);
  for (const x of [-4.4, 4.4]) for (const z of [-1.15, 1.15]) {
    box(cart, 0.15, 1.38, 0.15, palette.navy, x, 1, z, 0.03);
    const w = cyl(cart, 0.26, 0.18, palette.dark, x, 0.2, z);
    w.rotation.z = Math.PI / 2;
  }

  // Clean Table (إلغاء الصينية والبطارية العشوائية لتنظيف الطاولة تماماً)
  const battery = new THREE.Group();
  battery.visible = false;
  scene.add(battery);
  const bBody = cyl(battery, 0.145, 0.83, palette.yellow); bBody.rotation.z = Math.PI / 2;
  const bCap = cyl(battery, 0.147, 0.22, palette.navy, 0.29, 0, 0); bCap.rotation.z = Math.PI / 2;
  const bPole = cyl(battery, 0.07, 0.09, 0xc9d5d6, 0.48, 0, 0); bPole.rotation.z = Math.PI / 2;
  const bBottom = cyl(battery, 0.14, 0.045, 0xb9cdd0, -0.44, 0, 0); bBottom.rotation.z = Math.PI / 2;
  label(battery, '−    +', 0, 0.005, 0.15, 0.68, 0.18, '#ffcf57');

  // Robot Sharara
  const robot = new THREE.Group();
  robot.position.set(5.2, 0.02, -0.05);
  scene.add(robot);
  cyl(robot, 0.48, 0.17, palette.navy, 0, 0.17, 0);
  box(robot, 0.69, 0.77, 0.57, palette.white, 0, 0.7, 0, 0.15);
  box(robot, 0.48, 0.3, 0.05, palette.mint, 0, 0.76, 0.31);
  box(robot, 0.94, 0.66, 0.62, palette.white, 0, 1.45, 0, 0.19);
  box(robot, 0.75, 0.39, 0.06, palette.navy, 0, 1.46, 0.32, 0.1);
  for (const x of [-0.2, 0.2]) ball(robot, 0.055, palette.mint, x, 1.5, 0.37);
  const robotArm = box(robot, 0.18, 0.59, 0.2, palette.mint, -0.5, 0.81, 0, 0.06);
  robotArm.rotation.z = -0.25;

  // ─── كابل الكهرباء الرئيسي ومقبس الجدار ثلاثي الأبعاد الواقعي 220V ───
  const mainsWire = new THREE.Group();
  scene.add(mainsWire);
  const socketPos = new THREE.Vector3(-4.5, 2.15, -2.0);

  // مجسم مقبس الجدار الكهربائي المزدوج (Realistic 3D Wall Socket 220V)
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
  ball(wallSocketGroup, 0.035, 0xef4444, 0.22, 0.28, 0.08, 0.9);
  label(wallSocketGroup, '220V مقبس كهرباء', 0, -0.45, 0.08, 0.78, 0.22, '#254a61', '#ffcf57');

  const initialCurve = new THREE.CatmullRomCurve3([
    socketPos,
    new THREE.Vector3(-3.8, 1.85, -1.3),
    new THREE.Vector3(-3.1, 2.05, -1.0)
  ]);
  let mainsWireMesh = mesh(mainsWire, new THREE.TubeGeometry(initialCurve, 24, 0.038, 8, false), palette.navy);
  mainsWire.visible = false;

  // مجسم فيشة الكهرباء الواقعية (3D Plug Model)
  const plugModel = new THREE.Group();
  scene.add(plugModel);
  box(plugModel, 0.26, 0.20, 0.40, palette.navy, 0, 0, 0, 0.04);
  const prong1 = cyl(plugModel, 0.025, 0.16, 0xD0D0D0, -0.065, 0, 0.25); prong1.rotation.x = Math.PI / 2;
  const prong2 = cyl(plugModel, 0.025, 0.16, 0xD0D0D0, 0.065, 0, 0.25); prong2.rotation.x = Math.PI / 2;
  const plugBoot = cyl(plugModel, 0.055, 0.10, 0x1A1A1A, 0, 0, -0.22); plugBoot.rotation.x = Math.PI / 2;
  plugModel.visible = false;

  function updateMainsCable(targetPlugPos) {
    const midPoint = new THREE.Vector3().addVectors(socketPos, targetPlugPos).multiplyScalar(0.5);
    // محاكاة جاذبية وتدلي السلك بفيزيائية طبيعية فوق الطاولة
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

  // ─── نظام الشرارات والتوهج الكهربائي ثلاثي الأبعاد (Electrical Sparks & Glow) ───
  const sparksGroup = new THREE.Group();
  scene.add(sparksGroup);
  const sparksPointLight = new THREE.PointLight(0xFFD700, 0, 4.5);
  sparksGroup.add(sparksPointLight);

  const sparkMeshes = [];
  const sparkVelocities = [];
  const sparkGeo = new THREE.SphereGeometry(0.045, 6, 6);
  const sparkMatYellow = new THREE.MeshBasicMaterial({color: 0xFFD700});
  const sparkMatBlue = new THREE.MeshBasicMaterial({color: 0x00E5FF});

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
      sparkMeshes.forEach(m => m.visible = false);
      sparksPointLight.intensity = 0;
      return;
    }
    sparksPointLight.intensity = Math.max(0, 2.8 * (1 - elapsed / 0.75));
    const factor = Math.max(0, 1 - elapsed / 0.75);
    sparkMeshes.forEach((m, idx) => {
      m.position.add(sparkVelocities[idx]);
      sparkVelocities[idx].y -= 0.007; // gravity
      m.scale.setScalar(factor);
    });
  }

  // ─── حلقة هالة التوصيل المغناطيسية أسفل الجهاز الأقرب ───
  const snapRing = new THREE.Mesh(
    new THREE.RingGeometry(0.65, 0.8, 32),
    new THREE.MeshBasicMaterial({color: 0xFFB703, side: THREE.DoubleSide, transparent: true, opacity: 0.85})
  );
  snapRing.rotation.x = -Math.PI / 2;
  snapRing.position.y = 1.99;
  snapRing.visible = false;
  scene.add(snapRing);


  // ─── 4 أماكن للأجهزة على الطاولة متناسقة وموزعة بدقة ───
  const SLOT_X = [-2.55, -0.85, 0.85, 2.55];
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

  // مصنع مجسمات الأجهزة بأسلوب Three.js الأصلي
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

        // حجرة البطارية الغائرة المخصصة للسيارة مع الأقطاب والزنبرك
        const carBay = new THREE.Group(); g.add(carBay);
        carBay.position.set(-0.46, 0.62, 0);
        box(carBay, 0.94, 0.22, 0.36, 0x1e293b, 0, 0, 0, 0.03);
        box(carBay, 0.88, 0.16, 0.30, 0x0f172a, 0, 0.02, 0, 0.02);
        box(carBay, 0.04, 0.12, 0.12, 0xf59e0b, 0.40, 0.04, 0);
        const cSpring = cyl(carBay, 0.05, 0.08, 0xcfd8dc, -0.38, 0.04, 0);
        cSpring.rotation.z = Math.PI / 2;
        label(carBay, '- 1.5V +', 0, 0.14, 0, 0.46, 0.15, '#0f172a', '#facc15');

        fx.wheels = [];
        for (const x of [-0.55, 0.55]) for (const z of [-0.48, 0.48]) {
          const w = cyl(g, 0.25, 0.16, palette.dark, x, 0.22, z);
          w.rotation.x = Math.PI / 2;
          fx.wheels.push(w);
        }
        fx.headlights = [
          ball(g, 0.08, 0xfef08a, 0.78, 0.42, -0.32),
          ball(g, 0.08, 0xfef08a, 0.78, 0.42, 0.32)
        ];
        fx.headlights.forEach(h => h.visible = false);
        break;

      case 'radio':
        box(g, 1.4, 1.1, 0.6, palette.blue, 0, 0.75, 0, 0.15);
        cyl(g, 0.35, 0.08, palette.navy, -0.28, 0.78, 0.32).rotation.x = Math.PI / 2;
        cyl(g, 0.1, 0.09, palette.white, 0.38, 0.7, 0.33).rotation.x = Math.PI / 2;

        // حجرة البطارية بالراديو
        const rBay = new THREE.Group(); g.add(rBay);
        rBay.position.set(0, 0.32, 0.31);
        box(rBay, 0.94, 0.28, 0.14, 0x1e293b, 0, 0, 0, 0.03);
        box(rBay, 0.88, 0.22, 0.10, 0x0f172a, 0, 0, 0.02, 0.02);
        box(rBay, 0.04, 0.12, 0.08, 0xf59e0b, 0.40, 0, 0.02);
        const rSp = cyl(rBay, 0.05, 0.08, 0xcfd8dc, -0.38, 0, 0.02);
        rSp.rotation.z = Math.PI / 2;
        label(rBay, '- 1.5V +', 0, 0.15, 0.07, 0.44, 0.14, '#0f172a', '#facc15');

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
        // حجرة البطارية بالمصباح اليدوي
        box(g, 0.88, 0.24, 0.24, 0x1e293b, -0.05, 0.55, 0, 0.03);
        box(g, 0.82, 0.18, 0.18, 0x0f172a, -0.05, 0.55, 0, 0.02);
        box(g, 0.04, 0.10, 0.10, 0xf59e0b, 0.32, 0.55, 0);
        const flSp = cyl(g, 0.045, 0.06, 0xcfd8dc, -0.42, 0.55, 0); flSp.rotation.z = Math.PI / 2;
        label(g, '- 1.5V +', -0.05, 0.72, 0, 0.38, 0.12, '#0f172a', '#facc15');
        const cone = new THREE.ConeGeometry(0.8, 2.0, 16, 1, true);
        fx.beam = mesh(g, cone, palette.yellow, [1.9, 0.55, 0], 0.8);
        fx.beam.rotation.z = -Math.PI / 2;
        fx.beam.material.transparent = true; fx.beam.material.opacity = 0.4;
        fx.beam.visible = false;
        break;

      case 'wallClock':
        const face = cyl(g, 0.65, 0.12, palette.white, 0, 0.85, 0); face.rotation.x = Math.PI / 2;
        mesh(g, new THREE.TorusGeometry(0.65, 0.07, 10, 28), palette.navy, [0, 0.85, 0]);
        fx.minHand = box(g, 0.04, 0.45, 0.02, palette.red, 0, 0.98, 0.1);
        fx.hourHand = box(g, 0.05, 0.32, 0.02, palette.dark, 0, 0.92, 0.09);
        break;

      case 'remote':
        box(g, 0.55, 0.14, 1.25, palette.dark, 0, 0.12, 0, 0.08);
        for (let r = 0; r < 4; r++) for (let c = -1; c <= 1; c++) cyl(g, 0.045, 0.06, palette.silver, c * 0.13, 0.2, -0.3 + r * 0.17);
        fx.irLed = ball(g, 0.05, palette.red, 0, 0.12, -0.64);
        fx.irWaves = new THREE.Group(); fx.irWaves.position.set(0, 0.12, -0.7); g.add(fx.irWaves);
        fx.irArcs = [];
        for (let i = 0; i < 3; i++) {
          const arc = mesh(fx.irWaves, new THREE.TorusGeometry(0.16 + i * 0.1, 0.018, 6, 16, Math.PI), 0xef4444);
          arc.rotation.x = Math.PI / 2;
          arc.material.transparent = true;
          fx.irArcs.push(arc);
        }
        fx.irWaves.visible = false;
        break;

      case 'calculator':
        box(g, 0.85, 0.15, 1.2, 0xd8e2dc, 0, 0.12, 0, 0.08);
        fx.calcLcd = label(g, '50 × 2 = 100', 0, 0.21, -0.34, 0.65, 0.22, '#0f172a', '#22c55e');
        fx.calcLcd.rotation.x = -Math.PI / 2;
        fx.calcLcd.visible = false;
        for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) box(g, 0.13, 0.05, 0.11, palette.navy, c * 0.21, 0.21, 0.05 + r * 0.17, 0.02);
        break;

      case 'digitalScale':
        box(g, 1.3, 0.12, 1.3, 0xe2e8f0, 0, 0.1, 0, 0.1);
        cyl(g, 0.45, 0.02, palette.silver, 0, 0.17, 0.1);
        fx.scaleLcd = label(g, '24.5 kg', 0, 0.17, -0.42, 0.55, 0.2, '#0f172a', '#10b981');
        fx.scaleLcd.rotation.x = -Math.PI / 2;
        fx.scaleLcd.visible = false;
        break;

      case 'smokeDetector':
        cyl(g, 0.62, 0.22, palette.white, 0, 0.16, 0);
        mesh(g, new THREE.TorusGeometry(0.62, 0.05, 8, 24), palette.silver, [0, 0.16, 0]).rotation.x = Math.PI / 2;
        fx.smokeLed = cyl(g, 0.18, 0.08, palette.red, 0, 0.28, 0);
        fx.alarmWaves = new THREE.Group(); fx.alarmWaves.position.set(0, 0.35, 0); g.add(fx.alarmWaves);
        fx.alarmRings = [];
        for (let i = 0; i < 3; i++) {
          const ring = mesh(fx.alarmWaves, new THREE.TorusGeometry(0.28 + i * 0.14, 0.02, 8, 24), 0xef4444);
          ring.rotation.x = Math.PI / 2;
          ring.material.transparent = true;
          fx.alarmRings.push(ring);
        }
        fx.alarmWaves.visible = false;
        break;

      case 'laserPointer':
        const lp = cyl(g, 0.08, 1.15, palette.silver, 0, 0.35, 0); lp.rotation.z = Math.PI / 2;
        cyl(g, 0.1, 0.18, palette.yellow, -0.48, 0.35, 0).rotation.z = Math.PI / 2;
        const lBeam = new THREE.CylinderGeometry(0.02, 0.02, 3.2, 8);
        fx.laser = mesh(g, lBeam, palette.red, [2.1, 0.35, 0], 1.0);
        fx.laser.rotation.z = Math.PI / 2;
        fx.laser.visible = false;
        fx.laserDot = ball(g, 0.07, palette.red, 3.7, 0.35, 0, 1.0);
        fx.laserDot.visible = false;
        break;

      case 'hearingAid':
        const hp = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.12, 0.1, 0), new THREE.Vector3(-0.04, 0.45, 0), new THREE.Vector3(0.16, 0.4, 0), new THREE.Vector3(0.22, 0.18, 0)]);
        mesh(g, new THREE.TubeGeometry(hp, 16, 0.11, 10, false), 0xf6d365);
        cyl(g, 0.08, 0.12, palette.silver, 0.24, 0.15, 0).rotation.z = Math.PI / 2;
        fx.soundWaves = new THREE.Group(); fx.soundWaves.position.set(0.32, 0.15, 0); g.add(fx.soundWaves);
        fx.soundRings = [];
        for (let i = 0; i < 3; i++) {
          const sw = mesh(fx.soundWaves, new THREE.TorusGeometry(0.14 + i * 0.09, 0.018, 8, 20), palette.mint);
          sw.rotation.y = Math.PI / 2;
          sw.material.transparent = true;
          fx.soundRings.push(sw);
        }
        fx.soundWaves.visible = false;
        fx.eqBars = [];
        for (let i = 0; i < 3; i++) {
          const bar = box(g, 0.03, 0.08 + i * 0.04, 0.03, [0x22c55e, 0xfacc15, 0xef4444][i], -0.06 + i * 0.05, 0.35, 0.11);
          bar.visible = false;
          fx.eqBars.push(bar);
        }
        break;

      case 'fridge':
        box(g, 1.3, 2.3, 1.05, palette.mint, 0, 1.25, 0, 0.12);
        box(g, 1.16, 2.1, 0.04, 0xe5f3e7, 0, 1.25, 0.54);
        // مدخل سلك الكهرباء الخلفي 220V
        cyl(g, 0.06, 0.12, 0x111827, 0, 0.35, -0.54).rotation.x = Math.PI / 2;
        label(g, '⚡ 220V', 0, 0.65, -0.54, 0.42, 0.15, '#1e293b', '#facc15');
        fx.door = new THREE.Group(); fx.door.position.set(-0.6, 0.1, 0.56); g.add(fx.door);
        box(fx.door, 1.24, 1.55, 0.12, 0xc4eadc, 0.6, 0.85, 0, 0.08);
        box(fx.door, 1.24, 0.68, 0.12, 0xc4eadc, 0.6, 1.95, 0, 0.08);
        box(fx.door, 0.08, 0.35, 0.1, palette.white, 1.05, 1.1, 0.1);
        fx.cooling = label(g, '❄ 4°', 0, 2.6, 0.35, 0.85, 0.28, '#d7faf0', '#168176');
        fx.cooling.visible = false;
        break;

      case 'microwave':
        box(g, 1.4, 0.88, 0.9, palette.silver, 0, 0.52, 0, 0.09);
        box(g, 0.85, 0.6, 0.05, 0x1e293b, -0.18, 0.52, 0.46);
        cyl(g, 0.05, 0.10, 0x111827, 0.45, 0.25, -0.46).rotation.x = Math.PI / 2;
        label(g, '⚡ 220V', 0.45, 0.45, -0.46, 0.36, 0.14, '#1e293b', '#facc15');
        fx.microGlow = box(g, 0.82, 0.56, 0.02, 0x1e293b, -0.18, 0.52, 0.44);
        fx.microPlate = cyl(g, 0.28, 0.02, 0xf1f5f9, -0.18, 0.26, 0.22);
        fx.microFood = cyl(g, 0.14, 0.06, 0xf97316, -0.18, 0.30, 0.22);
        box(g, 0.28, 0.62, 0.04, palette.white, 0.46, 0.52, 0.46);
        fx.microTimer = label(g, '0:45', 0.46, 0.72, 0.49, 0.22, 0.09, '#0f172a', '#22c55e');
        fx.microTimer.visible = false;
        break;

      case 'washer':
        box(g, 1.25, 1.5, 1.15, palette.white, 0, 0.8, 0, 0.1);
        box(g, 1.15, 0.22, 0.05, palette.navy, 0, 1.38, 0.58);
        cyl(g, 0.06, 0.12, 0x111827, 0, 0.35, -0.59).rotation.x = Math.PI / 2;
        label(g, '⚡ 220V', 0, 0.65, -0.59, 0.42, 0.15, '#1e293b', '#facc15');
        mesh(g, new THREE.TorusGeometry(0.4, 0.06, 10, 24), palette.silver, [0, 0.72, 0.58]);
        fx.drumGroup = new THREE.Group(); fx.drumGroup.position.set(0, 0.72, 0.57); g.add(fx.drumGroup);
        fx.drum = cyl(fx.drumGroup, 0.36, 0.04, palette.navy, 0, 0, 0);
        fx.drum.rotation.x = Math.PI / 2;
        const clothesColors = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981];
        fx.clothes = [];
        for (let i = 0; i < 4; i++) {
          const ang = (i * Math.PI) / 2;
          const cl = ball(fx.drumGroup, 0.09, clothesColors[i], Math.cos(ang) * 0.2, Math.sin(ang) * 0.2, 0.03);
          fx.clothes.push(cl);
        }
        fx.washerLed = label(g, '🌀 SPIN', 0.36, 1.38, 0.61, 0.35, 0.12, '#0f172a', '#38bdf8');
        fx.washerLed.visible = false;
        break;

      case 'airConditioner':
        box(g, 1.55, 0.68, 0.55, palette.white, 0, 1.15, 0, 0.08);
        fx.acFlap = box(g, 1.38, 0.14, 0.04, palette.mint, 0, 0.88, 0.28, 0.02);
        fx.acLed = ball(g, 0.04, palette.mint, 0.62, 1.28, 0.28);
        fx.acLed.visible = false;
        fx.airWind = new THREE.Group(); g.add(fx.airWind);
        fx.airWind.position.set(0, 0.78, 0.38);
        fx.airParticles = [];
        for (let i = 0; i < 5; i++) {
          const wind = cyl(fx.airWind, 0.015, 0.55, 0x93c5fd, -0.45 + i * 0.22, -0.15, 0.2);
          wind.rotation.x = Math.PI / 3;
          wind.material.transparent = true;
          wind.material.opacity = 0.65;
          fx.airParticles.push(wind);
        }
        fx.airWind.visible = false;
        break;

      case 'vacuum':
        fx.vacBody = box(g, 1.05, 0.62, 0.7, palette.red, 0, 0.42, 0, 0.14);
        for (const x of [-0.38, 0.38]) cyl(g, 0.2, 0.09, palette.dark, x, 0.2, 0.35).rotation.x = Math.PI / 2;
        const vp = new THREE.CatmullRomCurve3([new THREE.Vector3(0.4, 0.55, 0), new THREE.Vector3(0.65, 0.9, 0), new THREE.Vector3(0.85, 0.35, 0.25), new THREE.Vector3(0.85, 0.05, 0.55)]);
        mesh(g, new THREE.TubeGeometry(vp, 16, 0.05, 8, false), palette.dark);
        box(g, 0.48, 0.09, 0.32, palette.navy, 0.85, 0.05, 0.55, 0.04);
        const canister = cyl(g, 0.18, 0.35, 0x93c5fd, -0.15, 0.68, 0);
        canister.material.transparent = true; canister.material.opacity = 0.5;
        fx.vacSwirl = new THREE.Group(); fx.vacSwirl.position.set(-0.15, 0.68, 0); g.add(fx.vacSwirl);
        for (let i = 0; i < 4; i++) {
          ball(fx.vacSwirl, 0.035, 0x78716c, Math.cos(i * 1.5) * 0.1, (i - 1.5) * 0.06, Math.sin(i * 1.5) * 0.1);
        }
        fx.vacSwirl.visible = false;
        break;

      case 'lamp':
        cyl(g, 0.38, 0.08, palette.navy, 0, 0.08, 0);
        const l1 = cyl(g, 0.035, 0.75, palette.silver, 0, 0.42, 0); l1.rotation.z = -0.22;
        const l2 = cyl(g, 0.035, 0.75, palette.silver, 0.16, 0.92, 0); l2.rotation.z = 0.28;
        cyl(g, 0.3, 0.38, palette.yellow, 0.42, 1.22, 0).rotation.z = -0.45;
        fx.bulb = ball(g, 0.14, 0xfff382, 0.52, 1.12, 0);
        fx.bulb.visible = false;
        const lampConeGeo = new THREE.ConeGeometry(0.85, 1.35, 16, 1, true);
        fx.lightCone = mesh(g, lampConeGeo, 0xfff382, [0.72, 0.5, 0], 0.7);
        fx.lightCone.rotation.z = 0.45;
        fx.lightCone.material.transparent = true;
        fx.lightCone.material.opacity = 0.35;
        fx.lightCone.visible = false;
        break;

      case 'electricOven':
        box(g, 1.3, 1.2, 1.0, 0x4a5568, 0, 0.66, 0, 0.09);
        box(g, 1.1, 0.7, 0.05, 0x1a202c, 0, 0.58, 0.51);
        fx.ovenChamber = box(g, 1.05, 0.65, 0.02, 0x1a202c, 0, 0.58, 0.49);
        fx.ovenCoils = box(g, 0.85, 0.04, 0.04, palette.red, 0, 0.82, 0.48);
        fx.ovenCoils.visible = false;
        fx.ovenTemp = label(g, '🔥 220°C', 0.36, 1.12, 0.54, 0.38, 0.12, '#0f172a', '#f97316');
        fx.ovenTemp.visible = false;
        break;

      case 'iron':
        box(g, 1.05, 0.16, 0.55, palette.blue, 0, 0.14, 0, 0.08);
        box(g, 1.08, 0.05, 0.56, palette.silver, 0, 0.04, 0);
        const ih = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.38, 0.24, 0), new THREE.Vector3(-0.32, 0.62, 0), new THREE.Vector3(0.18, 0.62, 0), new THREE.Vector3(0.32, 0.24, 0)]);
        mesh(g, new THREE.TubeGeometry(ih, 12, 0.055, 8, false), palette.navy);
        fx.steamGroup = new THREE.Group(); g.add(fx.steamGroup);
        fx.steamPuffs = [];
        for (let i = 0; i < 5; i++) {
          const puff = ball(fx.steamGroup, 0.08 + i * 0.02, 0xffffff, -0.3 + i * 0.15, 0.15, 0.2);
          puff.material.transparent = true;
          fx.steamPuffs.push(puff);
        }
        fx.steamGroup.visible = false;
        break;

      case 'hairDryer':
        const db = cyl(g, 0.2, 0.85, 0xd53f8c, 0, 0.78, 0); db.rotation.z = Math.PI / 2;
        cyl(g, 0.16, 0.22, palette.dark, 0.48, 0.78, 0).rotation.z = Math.PI / 2;
        const dh = cyl(g, 0.11, 0.72, 0x702459, -0.14, 0.38, 0); dh.rotation.z = 0.2;
        fx.dryerWind = new THREE.Group(); fx.dryerWind.position.set(0.6, 0.78, 0); g.add(fx.dryerWind);
        fx.windRays = [];
        for (let i = 0; i < 4; i++) {
          const ray = cyl(fx.dryerWind, 0.015, 0.65, 0xf97316, 0.3, -0.1 + i * 0.07, 0);
          ray.rotation.z = Math.PI / 2;
          ray.material.transparent = true;
          fx.windRays.push(ray);
        }
        fx.dryerWind.visible = false;
        break;

      case 'electricWaterHeater':
        cyl(g, 0.52, 1.75, 0xedf2f7, 0, 0.98, 0);
        mesh(g, new THREE.TorusGeometry(0.52, 0.05, 8, 24), palette.silver, [0, 0.98, 0]).rotation.x = Math.PI / 2;
        fx.waterTemp = label(g, '♨ 85°C', 0, 1.45, 0.54, 0.65, 0.22, '#0f172a', '#ef4444');
        fx.waterTemp.visible = false;
        fx.steamVent = new THREE.Group(); fx.steamVent.position.set(0, 1.9, 0); g.add(fx.steamVent);
        fx.bubbles = [];
        for (let i = 0; i < 4; i++) {
          const b = ball(fx.steamVent, 0.05 + i * 0.015, 0xffffff, -0.08 + i * 0.05, 0, 0);
          b.material.transparent = true;
          fx.bubbles.push(b);
        }
        fx.steamVent.visible = false;
        break;

      case 'robotToy':
        box(g, 0.75, 0.85, 0.55, palette.mint, 0, 0.75, 0, 0.08);
        fx.robotHead = box(g, 0.65, 0.55, 0.52, palette.blue, 0, 1.45, 0, 0.08);
        cyl(g, 0.04, 0.25, palette.yellow, 0, 1.82, 0);
        fx.robotAntenna = ball(g, 0.08, palette.red, 0, 1.95, 0);
        fx.robotEyes = [
          ball(fx.robotHead, 0.07, 0x38bdf8, -0.16, 0.05, 0.28),
          ball(fx.robotHead, 0.07, 0x38bdf8, 0.16, 0.05, 0.28)
        ];
        fx.robotArmL = cyl(g, 0.08, 0.65, palette.yellow, -0.48, 0.75, 0);
        fx.robotArmR = cyl(g, 0.08, 0.65, palette.yellow, 0.48, 0.75, 0);
        break;

      case 'electricToothbrush':
        cyl(g, 0.13, 1.1, palette.white, 0, 0.65, 0);
        cyl(g, 0.14, 0.32, palette.mint, 0, 0.35, 0);
        cyl(g, 0.045, 0.65, palette.silver, 0, 1.35, 0);
        fx.brushHead = new THREE.Group(); fx.brushHead.position.set(0, 1.68, 0); g.add(fx.brushHead);
        cyl(fx.brushHead, 0.09, 0.18, 0x38bdf8, 0, 0, 0.06).rotation.x = Math.PI / 2;
        box(fx.brushHead, 0.12, 0.15, 0.08, 0xffffff, 0, 0, 0.16, 0.02);
        fx.sonicWaves = new THREE.Group(); fx.brushHead.add(fx.sonicWaves);
        fx.sonicRings = [];
        for (let i = 0; i < 3; i++) {
          const w = mesh(fx.sonicWaves, new THREE.TorusGeometry(0.16 + i * 0.08, 0.015, 6, 16, Math.PI), 0x38bdf8, [0, 0, 0.06]);
          w.rotation.z = Math.PI / 2;
          w.material.transparent = true;
          fx.sonicRings.push(w);
        }
        fx.sonicWaves.visible = false;
        break;

      case 'electricHeater':
        box(g, 1.65, 1.1, 0.45, palette.dark, 0, 0.65, 0, 0.08);
        box(g, 1.45, 0.85, 0.1, 0x1f2937, 0, 0.65, 0.18, 0.04);
        fx.heatBars = [];
        for (let i = 0; i < 3; i++) {
          const bar = cyl(g, 0.045, 1.3, 0xef4444, 0, 0.42 + i * 0.23, 0.22);
          bar.rotation.z = Math.PI / 2;
          fx.heatBars.push(bar);
        }
        for (let i = -6; i <= 6; i++) {
          cyl(g, 0.012, 0.85, palette.silver, i * 0.11, 0.65, 0.25);
        }
        fx.heatWaves = new THREE.Group(); g.add(fx.heatWaves);
        fx.heatWaves.position.set(0, 1.25, 0);
        fx.heatParticles = [];
        for (let i = 0; i < 6; i++) {
          const hw = cyl(fx.heatWaves, 0.02, 0.35, 0xf97316, -0.5 + i * 0.2, 0, 0.1);
          hw.rotation.z = 0.2;
          hw.material.transparent = true;
          hw.material.opacity = 0.5;
          fx.heatParticles.push(hw);
        }
        fx.heatWaves.visible = false;
        break;

      case 'blender':
        cyl(g, 0.45, 0.55, palette.mint, 0, 0.32, 0);
        cyl(g, 0.08, 0.09, palette.navy, 0, 0.32, 0.44).rotation.x = Math.PI / 2;
        const pitcherGeo = new THREE.CylinderGeometry(0.38, 0.28, 1.05, 16);
        const pitcherMat = new THREE.MeshStandardMaterial({color: 0xe0f2fe, roughness: 0.1, transparent: true, opacity: 0.55});
        const pitcher = new THREE.Mesh(pitcherGeo, pitcherMat);
        pitcher.position.set(0, 1.05, 0);
        g.add(pitcher);
        cyl(g, 0.4, 0.12, palette.navy, 0, 1.58, 0);
        fx.blenderBlades = cyl(g, 0.18, 0.03, palette.silver, 0, 0.62, 0);
        const fluidGeo = new THREE.CylinderGeometry(0.34, 0.25, 0.65, 16);
        fx.fluid = new THREE.Mesh(fluidGeo, mat(0xf97316, 0.2));
        fx.fluid.position.set(0, 0.92, 0);
        g.add(fx.fluid);
        break;
    }

    // صندوق تفاعل افتراضي موسع لضمان التقاط أي نقرة أو لمسة لمسية مهما كان حجم الجهاز أو نحافته
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.0, 1.6),
      new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false})
    );
    hitBox.position.set(0, 0.8, 0);
    hitBox.userData.device = id;
    g.add(hitBox);

    return {mesh: g, fx};
  }

  // تركيب الأجهزة المعروضة في الجولة الحالية
  function mountRoundDevices(deviceIds) {
    for (const id in objects) {
      scene.remove(objects[id]);
      delete objects[id];
      delete activeEffects[id];
    }
    targets.length = 0;
    battery.traverse(o => { o.userData.battery = true; if (o.isMesh) targets.push(o); });

    deviceIds.forEach((id, idx) => {
      const built = createDeviceMesh(id);
      built.mesh.position.set(SLOT_X[idx], 1.98, 0);
      scene.add(built.mesh);
      objects[id] = built.mesh;
      activeEffects[id] = built.fx;
      registerTarget(built.mesh, id);
    });
  }

  // Interaction (Raycasting & Drag)
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();

  function pick(x, y) {
    const r = host.getBoundingClientRect();
    pointer.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(targets, false)[0];
    return hit?.object.userData;
  }

  function at(x, y) {
    const hit = pick(x, y);
    if (hit?.device) return hit.device;

    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    let nearest = null, min = Math.max(220, rect.width * 0.55);
    for (const id in objects) {
      const v = new THREE.Vector3();
      objects[id].getWorldPosition(v);
      v.y += 0.2; // Table surface level
      v.project(camera);
      const screenX = (v.x + 1) * rect.width / 2 + rect.left;
      const screenY = (-v.y + 1) * rect.height / 2 + rect.top;
      const dx = screenX - x;
      const dy = (screenY - y) * 0.7; // Weighted slightly for horizontal slot layout
      const dist = Math.hypot(dx, dy);
      if (dist < min) { min = dist; nearest = id; }
    }
    if (nearest) return nearest;
    if (hit?.battery && previousLocation && objects[previousLocation]) return previousLocation;
    return null;
  }

  // ─── التحكم في سحب العناصر ثلاثي الأبعاد باللمس والماوس (3D World Drag Tracking) ───
  const tableSurfacePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.98);
  const dragRaycaster = new THREE.Raycaster();
  const dragPointerVec = new THREE.Vector2();
  const dragIntersectWorld = new THREE.Vector3();
  let currentDragTool = null;

  function setDragWorld(tool, clientX, clientY) {
    currentDragTool = tool;
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dragPointerVec.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    dragRaycaster.setFromCamera(dragPointerVec, camera);
    const hit = dragRaycaster.ray.intersectPlane(tableSurfacePlane, dragIntersectWorld);
    if (!hit) return;

    if (tool === 'mains') {
      const targetPos = dragIntersectWorld.clone();
      targetPos.y = Math.max(1.98, targetPos.y + 0.15);
      updateMainsCable(targetPos);
    } else if (tool === 'battery') {
      battery.position.copy(dragIntersectWorld);
      battery.position.y = Math.max(2.15, dragIntersectWorld.y + 0.22);
      battery.visible = true;
    }

    // إبراز هالة الجهاز الأقرب
    const nearestId = at(clientX, clientY);
    if (nearestId && objects[nearestId]) {
      const v = new THREE.Vector3();
      objects[nearestId].getWorldPosition(v);
      snapRing.position.set(v.x, 1.99, v.z);
      snapRing.visible = true;
    } else {
      snapRing.visible = false;
    }
  }

  function clearDragWorld() {
    currentDragTool = null;
    snapRing.visible = false;
    const s = getState();
    const mainsRunning = Object.values(s.devices || {}).some(d => d.status === 'running' && d.source === 'mains');
    if (!mainsRunning) {
      mainsWire.visible = false;
      plugModel.visible = false;
    }
  }

  let down = null, isRotating = false, rotateDevice = null, lastPointerX = 0, lastPointerY = 0;
  let didRotate = false;

  renderer.domElement.addEventListener('pointerdown', e => {
    const hitDevice = pick(e.clientX, e.clientY)?.device || at(e.clientX, e.clientY);
    const hitBattery = pick(e.clientX, e.clientY)?.battery;
    down = {x: e.clientX, y: e.clientY, hitDevice, hitBattery, time: Date.now()};
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    didRotate = false;

    if (hitBattery) {
      onBattery(e);
    } else if (hitDevice) {
      rotateDevice = hitDevice;
    }
  });

  renderer.domElement.addEventListener('pointermove', e => {
    if (!down) return;
    const dist = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (dist > 28 && rotateDevice && objects[rotateDevice]) {
      didRotate = true;
      isRotating = true;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      // تدوير الجهاز أفقياً وعمودياً لفحصه
      objects[rotateDevice].rotation.y += dx * 0.02;
      objects[rotateDevice].rotation.x = Math.max(-0.4, Math.min(0.4, objects[rotateDevice].rotation.x + dy * 0.015));
    }
  });

  renderer.domElement.addEventListener('pointerup', e => {
    if (isRotating) {
      isRotating = false;
    }
    // نقرة أو لمسة لمسية دقيقة وسريعة على الجهاز
    if (down && !down.hitBattery && (!didRotate || Math.hypot(e.clientX - down.x, e.clientY - down.y) < 30)) {
      const targetId = down.hitDevice || pick(e.clientX, e.clientY)?.device || at(e.clientX, e.clientY);
      if (targetId && objects[targetId]) {
        onDevice(targetId);
      }
    }
    down = null;
    rotateDevice = null;
    didRotate = false;
  });

  renderer.domElement.addEventListener('pointercancel', () => {
    isRotating = false;
    rotateDevice = null;
    didRotate = false;
    down = null;
  });

  renderer.domElement.addEventListener('webglcontextlost', e => {
    e.preventDefault(); dead = true; cancelAnimationFrame(frame); dispatch({type: 'RENDERER_FAILED'});
  });

  function cameraUpdate() {
    const rect = host.getBoundingClientRect(), aspect = Math.max(rect.width, 1) / Math.max(rect.height, 1);
    const isMobile = aspect < 1 || rect.width <= 768;
    const baseSpan = isMobile ? 5.4 : 6.2;
    const half = Math.max(3.6, baseSpan / aspect);
    camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half;
    camera.zoom = isMobile ? 1.05 * zoom : zoom;
    const p = focus && objects[focus] ? objects[focus].position.clone().add(new THREE.Vector3(0, 0.9, 0)) : new THREE.Vector3(0, isMobile ? 1.95 : 2.2, 0);
    const camX = view === 1 ? -1.5 : (isMobile ? 0.2 : 1.0);
    camera.position.copy(p).add(new THREE.Vector3(camX, isMobile ? 3.8 : 5.0, isMobile ? 8.8 : 10.5));
    camera.lookAt(p);
    camera.updateProjectionMatrix();
  }

  const observer = new ResizeObserver(() => {
    renderer.setSize(host.clientWidth, host.clientHeight);
    cameraUpdate();
  });
  observer.observe(host);
  cameraUpdate();

  let last = 0, lastRevision = -1, previousLocation = 'tray', insertionStart = 0, mountedDevicesKey = '';
  let sparkTriggeredBattery = false, sparkTriggeredMains = false;
  const batteryPos = new THREE.Vector3(), insertionFrom = new THREE.Vector3(0.65, 2.24, 1.15);

  function tick(now) {
    if (dead) return;
    frame = requestAnimationFrame(tick);
    if (now - last < 28) return;
    last = now;
    const s = getState();

    // فحص إعادة توليد الأجهزة عند جولة جديدة
    const currentKey = s.devices ? Object.keys(s.devices).join(',') : '';
    if (currentKey && currentKey !== mountedDevicesKey) {
      mountedDevicesKey = currentKey;
      mountRoundDevices(Object.keys(s.devices));
    }

    const t = now / 1000;

    // حركة البطارية
    if (s.batteryLocation !== previousLocation) {
      insertionStart = now;
      insertionFrom.copy(battery.position);
      if (previousLocation === 'held') insertionFrom.set(0.65, 2.5, 1.15);
      previousLocation = s.batteryLocation;
    }

    if (objects[s.batteryLocation]) {
      objects[s.batteryLocation].getWorldPosition(batteryPos);
      if (s.batteryLocation === 'car' || s.batteryLocation === 'toyCar') {
        batteryPos.x -= 0.46;
        batteryPos.y += 0.64;
      } else if (s.batteryLocation === 'radio') {
        batteryPos.y += 0.32;
        batteryPos.z += 0.32;
      } else if (s.batteryLocation === 'flashlight') {
        batteryPos.x -= 0.05;
        batteryPos.y += 0.55;
      } else {
        batteryPos.y += 0.15;
        batteryPos.z += 0.2;
      }
    } else {
      batteryPos.set(0.65, 2.24, 1.15);
    }

    const progress = s.reducedMotion ? 1 : Math.min(1, (now - insertionStart) / 380);
    battery.position.lerpVectors(insertionFrom, batteryPos, progress);
    battery.position.y += Math.sin(progress * Math.PI) * 0.28;
    battery.visible = s.batteryLocation !== 'held' && s.batteryLocation !== 'tray' && Boolean(objects[s.batteryLocation]);

    if (s.batteryLocation !== 'held' && s.batteryLocation !== 'tray' && objects[s.batteryLocation]) {
      if (progress >= 0.95 && !sparkTriggeredBattery) {
        sparkTriggeredBattery = true;
        const bp = new THREE.Vector3();
        battery.getWorldPosition(bp);
        triggerSparks(bp);
      }
    } else {
      sparkTriggeredBattery = false;
    }

    // حركة الروبوت وكابل الكهرباء الرئيسية مع الشرارات
    const mainsRunningId = Object.keys(s.devices || {}).find(id => s.devices[id].status === 'running' && s.devices[id].source === 'mains');
    if (mainsRunningId && objects[mainsRunningId]) {
      const devPos = new THREE.Vector3();
      objects[mainsRunningId].getWorldPosition(devPos);
      devPos.y += 0.25;
      devPos.z -= 0.35;
      updateMainsCable(devPos);
      if (!sparkTriggeredMains) {
        sparkTriggeredMains = true;
        triggerSparks(devPos);
      }
    } else if (!currentDragTool) {
      mainsWire.visible = false;
      plugModel.visible = false;
      sparkTriggeredMains = false;
    }
    robotArm.rotation.z = mainsRunningId ? -0.95 : -0.25;

    // تحديث حركة الشرارات الكهربائية
    updateSparks(now);

    // تأثيرات تشغيل الأجهزة المعروضة (Dynamic Continuous Animations)
    for (const id in objects) {
      const isRunning = s.devices[id]?.status === 'running';
      const fx = activeEffects[id];
      if (!fx) continue;

      switch (id) {
        case 'car':
        case 'toyCar':
          // حركة واهتزاز مستمر للسيارة مع دوران سريع للعجلات وإضاءة المصابيح الأمامية
          objects[id].position.z = isRunning && !s.reducedMotion ? Math.sin(t * 4) * 0.28 : 0;
          if (isRunning && !s.reducedMotion) objects[id].rotation.z = Math.sin(t * 8) * 0.03;
          else objects[id].rotation.z = 0;
          if (fx.wheels) for (const w of fx.wheels) w.rotation.x = isRunning ? t * 7 : 0;
          if (fx.headlights) fx.headlights.forEach(h => {
            h.visible = isRunning;
            if (isRunning) h.material = mat(0xfef08a, 0.85 + Math.sin(t * 6) * 0.15);
          });
          break;

        case 'radio':
          // موجات صوتية نابضة ووميض لمبة الإشارة
          if (fx.waves) {
            fx.waves.visible = isRunning;
            if (isRunning) {
              fx.waves.scale.setScalar(1 + Math.sin(t * 8) * 0.15);
              fx.waves.children.forEach((c, idx) => {
                if (c.material) c.material.opacity = 0.5 + Math.sin(t * 10 + idx * 1.2) * 0.4;
              });
            }
          }
          if (fx.radioLight) fx.radioLight.material = mat(isRunning ? palette.mint : 0x6b7b78, isRunning ? (0.6 + Math.sin(t * 6) * 0.4) : 0);
          break;

        case 'flashlight':
          // شعاع ضوئي نابض متوهج
          if (fx.beam) {
            fx.beam.visible = isRunning;
            if (isRunning) fx.beam.material.opacity = 0.45 + Math.sin(t * 5) * 0.15;
          }
          break;

        case 'wallClock':
          // دوران مستمر وسريع لعقرب الدقائق والثواني
          if (isRunning) {
            if (fx.minHand) fx.minHand.rotation.z -= 0.08;
            if (fx.hourHand) fx.hourHand.rotation.z -= 0.01;
          }
          break;

        case 'remote':
          // وميض أحمر للأشعة تحت الحمراء وانطلاق موجات تحكم متتالية
          if (fx.irLed) fx.irLed.material = mat(palette.red, isRunning && Math.sin(t * 12) > 0 ? 1.0 : 0);
          if (fx.irWaves) {
            fx.irWaves.visible = isRunning;
            if (isRunning && fx.irArcs) {
              fx.irArcs.forEach((arc, i) => {
                const ph = (t * 4 + i * 0.33) % 1;
                arc.scale.setScalar(0.7 + ph * 0.9);
                arc.material.opacity = Math.max(0, 1 - ph);
                arc.position.z = -ph * 0.35;
              });
            }
          }
          break;

        case 'calculator':
          // شاشة رقمية حاسبة تعرض العملية الحسابية فور التشغيل
          if (fx.calcLcd) fx.calcLcd.visible = isRunning;
          break;

        case 'digitalScale':
          // شاشة رقمية تعرض قراءة الوزن بالكيلوجرام فور التشغيل
          if (fx.scaleLcd) fx.scaleLcd.visible = isRunning;
          break;

        case 'smokeDetector':
          // وميض صافرة الإنذار وموجات صوت التنبيه المتوسعة
          if (fx.smokeLed) fx.smokeLed.material = mat(palette.red, isRunning && Math.sin(t * 10) > 0 ? 1.0 : 0);
          if (fx.alarmWaves) {
            fx.alarmWaves.visible = isRunning;
            if (isRunning && fx.alarmRings) {
              fx.alarmRings.forEach((ring, i) => {
                const ph = (t * 5 + i * 0.33) % 1;
                ring.scale.setScalar(0.6 + ph * 1.1);
                ring.material.opacity = Math.max(0, 1 - ph);
              });
            }
          }
          break;

        case 'laserPointer':
          // شعاع ليزر أحمر ساطع ونقطة ليزر نابضة على الهدف
          if (fx.laser) {
            fx.laser.visible = isRunning;
            if (isRunning) fx.laser.material.emissiveIntensity = 0.8 + Math.sin(t * 10) * 0.2;
          }
          if (fx.laserDot) {
            fx.laserDot.visible = isRunning;
            if (isRunning) fx.laserDot.scale.setScalar(1 + Math.sin(t * 15) * 0.25);
          }
          break;

        case 'hearingAid':
          // موجات صوتية متوسعة ومؤشر طاقة الصوت (Equalizer) يرتفع وينخفض
          if (fx.soundWaves) {
            fx.soundWaves.visible = isRunning;
            if (isRunning && fx.soundRings) {
              fx.soundRings.forEach((r, i) => {
                const ph = (t * 4 + i * 0.33) % 1;
                r.scale.setScalar(0.6 + ph * 0.9);
                r.material.opacity = Math.max(0, 1 - ph);
              });
            }
          }
          if (fx.eqBars) {
            fx.eqBars.forEach((bar, i) => {
              bar.visible = isRunning;
              if (isRunning) bar.scale.y = 0.5 + Math.abs(Math.sin(t * 10 + i * 1.8)) * 1.2;
            });
          }
          break;

        case 'fridge':
          // شارة التبريد وبخار البرودة
          if (fx.cooling) fx.cooling.visible = isRunning;
          if (fx.door) fx.door.rotation.y = s.doorOpen ? -Math.PI * 0.58 : 0;
          break;

        case 'microwave':
          // إضاءة الحجرة الداخلية، دوران طبق الطعام، وشاشة المؤقت الرقمي
          if (fx.microTimer) fx.microTimer.visible = isRunning;
          if (fx.microGlow) {
            fx.microGlow.material = mat(isRunning ? 0xfef08a : 0x1e293b, isRunning ? (0.75 + Math.sin(t * 4) * 0.25) : 0);
          }
          if (isRunning) {
            if (fx.microPlate) fx.microPlate.rotation.y += 0.05;
            if (fx.microFood) fx.microFood.rotation.y += 0.05;
          }
          break;

        case 'washer':
          // دوران حوض الغسيل سريعاً مع تقليب الملابس واهتزاز الغسالة وشاشة الدوران
          if (fx.washerLed) fx.washerLed.visible = isRunning;
          if (isRunning) {
            if (fx.drumGroup) fx.drumGroup.rotation.z += 0.26;
            const slotIdx = Object.keys(objects).indexOf(id);
            if (slotIdx >= 0 && !s.reducedMotion) {
              objects[id].position.x = SLOT_X[slotIdx] + Math.sin(t * 35) * 0.018;
            }
          }
          break;

        case 'airConditioner':
          // تدفق هواء متحرك ورفرفة الموزع (Wind animation)
          if (fx.acLed) fx.acLed.visible = isRunning;
          if (fx.acFlap) fx.acFlap.rotation.x = isRunning ? (-0.35 + Math.sin(t * 3) * 0.08) : 0;
          if (fx.airWind) {
            fx.airWind.visible = isRunning;
            if (isRunning && fx.airParticles) {
              fx.airParticles.forEach((p, idx) => {
                p.position.y = -0.15 + Math.sin(t * 8 + idx) * 0.08;
                p.position.z = 0.2 + (Math.sin(t * 10 + idx) + 1) * 0.12;
              });
            }
          }
          break;

        case 'vacuum':
          // دوامة سريعة لجسيمات الأتربة في حجرة الشفط واهتزاز هيكل المكنسة بقوة
          if (fx.vacSwirl) {
            fx.vacSwirl.visible = isRunning;
            if (isRunning) fx.vacSwirl.rotation.y += 0.38;
          }
          if (isRunning && fx.vacBody && !s.reducedMotion) {
            fx.vacBody.position.y = 0.42 + Math.sin(t * 35) * 0.025;
          }
          break;

        case 'lamp':
          // إضاءة مصباح ساطعة مع مخروط ضوء ناصع على الطاولة
          if (fx.bulb) {
            fx.bulb.visible = isRunning;
            if (isRunning) fx.bulb.material = mat(0xfff382, 0.95);
          }
          if (fx.lightCone) {
            fx.lightCone.visible = isRunning;
            if (isRunning) fx.lightCone.material.opacity = 0.35 + Math.sin(t * 5) * 0.08;
          }
          break;

        case 'electricOven':
          // توهج حجرة الفرن وقضبان التسخين باللون الأحمر الحراري وشاشة درجة الحرارة 220°C
          if (fx.ovenTemp) fx.ovenTemp.visible = isRunning;
          if (fx.ovenCoils) {
            fx.ovenCoils.visible = isRunning;
            if (isRunning) fx.ovenCoils.material = mat(0xef4444, 0.85 + Math.sin(t * 4) * 0.15);
          }
          if (fx.ovenChamber) {
            fx.ovenChamber.material = mat(isRunning ? 0xf97316 : 0x1a202c, isRunning ? (0.65 + Math.sin(t * 3) * 0.2) : 0);
          }
          break;

        case 'iron':
          // سحب بخار بيضاء تتصاعد وتنتفخ من قاعدة المكواة
          if (fx.steamGroup) {
            fx.steamGroup.visible = isRunning;
            if (isRunning && fx.steamPuffs) {
              fx.steamPuffs.forEach((puff, idx) => {
                const ph = (t * 2.5 + idx * 0.22) % 1;
                puff.position.y = 0.15 + ph * 0.48;
                puff.scale.setScalar(0.7 + ph * 0.85);
                puff.material.opacity = Math.max(0, 0.8 - ph * 0.8);
              });
            }
          }
          break;

        case 'hairDryer':
          // تيارات هواء ساخنة برتقالية تتدفق بسرعة من الفوهة
          if (fx.dryerWind) {
            fx.dryerWind.visible = isRunning;
            if (isRunning && fx.windRays) {
              fx.windRays.forEach((ray, idx) => {
                const ph = (t * 6 + idx * 0.28) % 1;
                ray.position.x = 0.2 + ph * 0.55;
                ray.scale.set(0.6 + ph * 0.6, 1, 1);
                ray.material.opacity = Math.max(0, 0.8 - ph * 0.7);
              });
            }
          }
          break;

        case 'electricWaterHeater':
          // فقاعات بخار متصاعدة من الفوهة العلوية وشاشة الحرارة 85°C
          if (fx.waterTemp) fx.waterTemp.visible = isRunning;
          if (fx.steamVent) {
            fx.steamVent.visible = isRunning;
            if (isRunning && fx.bubbles) {
              fx.bubbles.forEach((b, idx) => {
                const ph = (t * 2.8 + idx * 0.28) % 1;
                b.position.y = ph * 0.42;
                b.scale.setScalar(0.6 + ph * 0.7);
                b.material.opacity = Math.max(0, 0.8 - ph * 0.7);
              });
            }
          }
          break;

        case 'electricHeater':
          // توهج قضبان التدفئة بالأحمر الناري مع تموجات حرارية حية متصاعدة
          if (fx.heatBars) {
            fx.heatBars.forEach((bar, idx) => {
              bar.material = mat(isRunning ? 0xff2200 : 0x475569, isRunning ? (0.85 + Math.sin(t * 4 + idx) * 0.15) : 0);
            });
          }
          if (fx.heatWaves) {
            fx.heatWaves.visible = isRunning;
            if (isRunning && fx.heatParticles) {
              fx.heatParticles.forEach((p, idx) => {
                p.position.y = (t * 0.4 + idx * 0.12) % 0.55;
                p.material.opacity = isRunning ? (0.55 - p.position.y * 0.9) : 0;
              });
            }
          }
          break;

        case 'blender':
          // دوران فائق لشفرات الخلاط مع دوامة العصير
          if (isRunning) {
            if (fx.blenderBlades) fx.blenderBlades.rotation.y += 0.55;
            if (fx.fluid) {
              fx.fluid.rotation.y += 0.18;
              fx.fluid.scale.set(1 + Math.sin(t * 14) * 0.05, 1, 1 + Math.cos(t * 14) * 0.05);
            }
          }
          break;

        case 'robotToy':
          // حركة رأس وأذرع الروبوت مع وميض العيون والهوائي
          if (isRunning) {
            if (fx.robotHead) fx.robotHead.rotation.y = Math.sin(t * 3.5) * 0.25;
            if (fx.robotArmL) fx.robotArmL.rotation.x = Math.sin(t * 7) * 0.5;
            if (fx.robotArmR) fx.robotArmR.rotation.x = -Math.sin(t * 7) * 0.5;
            if (fx.robotAntenna) fx.robotAntenna.material = mat(palette.red, Math.sin(t * 8) > 0 ? 1 : 0);
            if (fx.robotEyes) fx.robotEyes.forEach(eye => { eye.material = mat(0x38bdf8, 0.75 + Math.sin(t * 6) * 0.25); });
          }
          break;

        case 'electricToothbrush':
          // تذبذب دوراني فائق لرأس الفرشاة وموجات صوتية واهتزاز سريع
          if (fx.sonicWaves) {
            fx.sonicWaves.visible = isRunning;
            if (isRunning && fx.sonicRings) {
              fx.sonicRings.forEach((r, idx) => {
                const ph = (t * 8 + idx * 0.33) % 1;
                r.scale.setScalar(0.7 + ph * 0.7);
                r.material.opacity = Math.max(0, 0.8 - ph * 0.8);
              });
            }
          }
          if (isRunning) {
            if (fx.brushHead) fx.brushHead.rotation.z = Math.sin(t * 50) * 0.28;
            const slotIdx = Object.keys(objects).indexOf(id);
            if (slotIdx >= 0 && !s.reducedMotion) {
              objects[id].position.x = SLOT_X[slotIdx] + Math.sin(t * 40) * 0.015;
            }
          }
          break;
      }

      // تحديث إحداثيات الشارات العائمة
      const v = objects[id].position.clone();
      v.y += id === 'fridge' ? 3.1 : (id === 'electricWaterHeater' || id === 'electricHeater' ? 2.6 : 1.7);
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
    zoomIn() { zoom = Math.min(1.65, zoom + 0.15); cameraUpdate(); },
    zoomOut() { zoom = Math.max(0.75, zoom - 0.15); cameraUpdate(); },
    reset() {
      focus = null; zoom = 1; view = 0;
      for (const id in objects) {
        objects[id].rotation.set(0, 0, 0);
      }
      cameraUpdate();
    },
    inspect(id) {
      focus = id || Object.keys(objects)[0];
      zoom = 1.6;
      view = view === 1 ? 0 : 1;
      // تدوير خفيف لإبراز المنظور الثلاثي الأبعاد عند الفحص
      if (objects[focus]) {
        objects[focus].rotation.y += 0.8;
      }
      cameraUpdate();
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
    }
  };
}
