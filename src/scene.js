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

  // Mains Wire
  const mainsWire = new THREE.Group();
  scene.add(mainsWire);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.1, 2.1, -1), new THREE.Vector3(-4.1, 1.7, -1.4), new THREE.Vector3(-4.5, 1.9, -2)]);
  mesh(mainsWire, new THREE.TubeGeometry(curve, 20, 0.035, 8, false), palette.navy);
  mainsWire.visible = false;

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
        fx.wheels = [];
        for (const x of [-0.55, 0.55]) for (const z of [-0.48, 0.48]) {
          const w = cyl(g, 0.25, 0.16, palette.dark, x, 0.22, z);
          w.rotation.x = Math.PI / 2;
          fx.wheels.push(w);
        }
        break;

      case 'radio':
        box(g, 1.4, 1.1, 0.6, palette.blue, 0, 0.75, 0, 0.15);
        cyl(g, 0.35, 0.08, palette.navy, -0.28, 0.78, 0.32).rotation.x = Math.PI / 2;
        cyl(g, 0.1, 0.09, palette.white, 0.38, 0.7, 0.33).rotation.x = Math.PI / 2;
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
        break;

      case 'calculator':
        box(g, 0.85, 0.15, 1.2, 0xd8e2dc, 0, 0.12, 0, 0.08);
        fx.calcLcd = box(g, 0.65, 0.04, 0.28, 0x86efac, 0, 0.21, -0.34, 0.02);
        for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) box(g, 0.13, 0.05, 0.11, palette.navy, c * 0.21, 0.21, 0.05 + r * 0.17, 0.02);
        break;

      case 'digitalScale':
        box(g, 1.3, 0.12, 1.3, 0xe2e8f0, 0, 0.1, 0, 0.1);
        cyl(g, 0.45, 0.02, palette.silver, 0, 0.17, 0.1);
        fx.scaleLcd = box(g, 0.52, 0.03, 0.2, 0x2d3748, 0, 0.17, -0.42);
        break;

      case 'smokeDetector':
        cyl(g, 0.62, 0.22, palette.white, 0, 0.16, 0);
        mesh(g, new THREE.TorusGeometry(0.62, 0.05, 8, 24), palette.silver, [0, 0.16, 0]).rotation.x = Math.PI / 2;
        fx.smokeLed = ball(g, 0.06, palette.mint, 0, 0.34, 0);
        break;

      case 'laserPointer':
        const lp = cyl(g, 0.08, 1.15, palette.silver, 0, 0.35, 0); lp.rotation.z = Math.PI / 2;
        cyl(g, 0.1, 0.18, palette.yellow, -0.48, 0.35, 0).rotation.z = Math.PI / 2;
        const lBeam = new THREE.CylinderGeometry(0.02, 0.02, 3.2, 8);
        fx.laser = mesh(g, lBeam, palette.red, [2.1, 0.35, 0], 1.0);
        fx.laser.rotation.z = Math.PI / 2;
        fx.laser.visible = false;
        break;

      case 'hearingAid':
        const hp = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.12, 0.1, 0), new THREE.Vector3(-0.04, 0.45, 0), new THREE.Vector3(0.16, 0.4, 0), new THREE.Vector3(0.22, 0.18, 0)]);
        mesh(g, new THREE.TubeGeometry(hp, 16, 0.11, 10, false), 0xf6d365);
        fx.aidPulse = ball(g, 0.16, palette.mint, 0.24, 0.15, 0);
        fx.aidPulse.visible = false;
        break;

      case 'fridge':
        box(g, 1.3, 2.3, 1.05, palette.mint, 0, 1.25, 0, 0.12);
        box(g, 1.16, 2.1, 0.04, 0xe5f3e7, 0, 1.25, 0.54);
        fx.door = new THREE.Group(); fx.door.position.set(-0.6, 0.1, 0.56); g.add(fx.door);
        box(fx.door, 1.24, 1.55, 0.12, 0xc4eadc, 0.6, 0.85, 0, 0.08);
        box(fx.door, 1.24, 0.68, 0.12, 0xc4eadc, 0.6, 1.95, 0, 0.08);
        box(fx.door, 0.08, 0.35, 0.1, palette.white, 1.05, 1.1, 0.1);
        fx.cooling = label(g, '❄ 4°', 0, 2.6, 0.35, 0.85, 0.28, '#d7faf0', '#168176');
        fx.cooling.visible = false;
        break;

      case 'microwave':
        box(g, 1.4, 0.88, 0.9, palette.silver, 0, 0.52, 0, 0.09);
        box(g, 0.85, 0.6, 0.05, palette.dark, -0.18, 0.52, 0.46);
        box(g, 0.28, 0.62, 0.04, palette.white, 0.46, 0.52, 0.46);
        fx.microLight = ball(g, 0.07, 0xfff382, -0.18, 0.52, 0.44);
        fx.microLight.visible = false;
        break;

      case 'washer':
        box(g, 1.25, 1.5, 1.15, palette.white, 0, 0.8, 0, 0.1);
        box(g, 1.15, 0.22, 0.05, palette.navy, 0, 1.38, 0.58);
        mesh(g, new THREE.TorusGeometry(0.4, 0.06, 10, 24), palette.silver, [0, 0.72, 0.58]);
        fx.drum = cyl(g, 0.36, 0.04, palette.blue, 0, 0.72, 0.57);
        fx.drum.rotation.x = Math.PI / 2;
        break;

      case 'airConditioner':
        box(g, 1.55, 0.68, 0.55, palette.white, 0, 1.15, 0, 0.08);
        fx.acFlap = box(g, 1.38, 0.14, 0.04, palette.mint, 0, 0.88, 0.28, 0.02);
        fx.acLed = ball(g, 0.04, palette.mint, 0.62, 1.28, 0.28);
        fx.acLed.visible = false;
        // خروج هواء بارد متحرك من المكيف (Wind / Air streams)
        fx.airWind = new THREE.Group();
        g.add(fx.airWind);
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
        break;

      case 'lamp':
        cyl(g, 0.38, 0.08, palette.navy, 0, 0.08, 0);
        const l1 = cyl(g, 0.035, 0.75, palette.silver, 0, 0.42, 0); l1.rotation.z = -0.22;
        const l2 = cyl(g, 0.035, 0.75, palette.silver, 0.16, 0.92, 0); l2.rotation.z = 0.28;
        cyl(g, 0.3, 0.38, palette.yellow, 0.42, 1.22, 0).rotation.z = -0.45;
        fx.bulb = ball(g, 0.14, 0xfff382, 0.52, 1.12, 0);
        fx.bulb.visible = false;
        // مخروط ضوء ساطع ينير الطاولة
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
        fx.ovenCoils = box(g, 0.85, 0.04, 0.04, palette.red, 0, 0.76, 0.48);
        fx.ovenCoils.visible = false;
        break;

      case 'iron':
        box(g, 1.05, 0.16, 0.55, palette.blue, 0, 0.14, 0, 0.08);
        box(g, 1.08, 0.05, 0.56, palette.silver, 0, 0.04, 0);
        const ih = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.38, 0.24, 0), new THREE.Vector3(-0.32, 0.62, 0), new THREE.Vector3(0.18, 0.62, 0), new THREE.Vector3(0.32, 0.24, 0)]);
        mesh(g, new THREE.TubeGeometry(ih, 12, 0.055, 8, false), palette.navy);
        fx.ironLed = ball(g, 0.05, palette.orange, 0.14, 0.28, 0);
        fx.ironLed.visible = false;
        break;

      case 'hairDryer':
        const db = cyl(g, 0.2, 0.85, 0xd53f8c, 0, 0.78, 0); db.rotation.z = Math.PI / 2;
        cyl(g, 0.16, 0.22, palette.dark, 0.48, 0.78, 0).rotation.z = Math.PI / 2;
        const dh = cyl(g, 0.11, 0.72, 0x702459, -0.14, 0.38, 0); dh.rotation.z = 0.2;
        fx.dryerAir = ball(g, 0.14, palette.orange, 0.58, 0.78, 0);
        fx.dryerAir.visible = false;
        break;

      case 'electricWaterHeater':
        cyl(g, 0.52, 1.75, 0xedf2f7, 0, 0.98, 0);
        mesh(g, new THREE.TorusGeometry(0.52, 0.05, 8, 24), palette.silver, [0, 0.98, 0]).rotation.x = Math.PI / 2;
        fx.heaterLed = ball(g, 0.055, palette.red, 0, 1.35, 0.54);
        fx.heaterLed.visible = false;
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
        fx.brushHead = cyl(g, 0.09, 0.22, 0x38bdf8, 0, 1.68, 0.06);
        fx.brushHead.rotation.x = Math.PI / 2;
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
        fx.heatWaves = new THREE.Group();
        g.add(fx.heatWaves);
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
    let nearest = null, min = 110;
    for (const id in objects) {
      const v = new THREE.Vector3();
      objects[id].getWorldPosition(v);
      v.y += 0.7;
      v.project(camera);
      const dx = (v.x + 1) * rect.width / 2 + rect.left - x;
      const dy = (-v.y + 1) * rect.height / 2 + rect.top - y;
      const dist = Math.hypot(dx, dy);
      if (dist < min) { min = dist; nearest = id; }
    }
    return nearest;
  }

  let down = null, isRotating = false, rotateDevice = null, lastPointerX = 0, lastPointerY = 0;

  renderer.domElement.addEventListener('pointerdown', e => {
    const hit = pick(e.clientX, e.clientY);
    down = {x: e.clientX, y: e.clientY, hit};
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;

    if (hit?.battery) {
      onBattery(e);
    } else if (hit?.device) {
      // تمكين الطالب من تدوير الجهاز 3D بسلاسة
      isRotating = true;
      rotateDevice = hit.device;
      renderer.domElement.setPointerCapture?.(e.pointerId);
    }
  });

  renderer.domElement.addEventListener('pointermove', e => {
    if (isRotating && rotateDevice && objects[rotateDevice]) {
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
      rotateDevice = null;
    }
    if (down && !down.hit?.battery && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 14) {
      const h = pick(e.clientX, e.clientY);
      if (h?.device) onDevice(h.device);
    }
    down = null;
  });

  renderer.domElement.addEventListener('pointercancel', () => {
    isRotating = false;
    rotateDevice = null;
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
      batteryPos.y += 0.15; batteryPos.z += 0.2;
    } else {
      batteryPos.set(0.65, 2.24, 1.15);
    }

    const progress = s.reducedMotion ? 1 : Math.min(1, (now - insertionStart) / 380);
    battery.position.lerpVectors(insertionFrom, batteryPos, progress);
    battery.position.y += Math.sin(progress * Math.PI) * 0.22;
    battery.visible = s.batteryLocation !== 'held' && s.batteryLocation !== 'tray' && Boolean(objects[s.batteryLocation]);

    // حركة الروبوت ومؤشرات الكهرباء الرئيسية
    const mainsRunning = Object.values(s.devices || {}).some(d => d.status === 'running' && d.source === 'mains');
    mainsWire.visible = mainsRunning;
    robotArm.rotation.z = mainsRunning ? -0.95 : -0.25;

    // تأثيرات تشغيل الأجهزة المعروضة (Dynamic Continuous Animations)
    for (const id in objects) {
      const isRunning = s.devices[id]?.status === 'running';
      const fx = activeEffects[id];
      if (!fx) continue;

      switch (id) {
        case 'car':
        case 'toyCar':
          // حركة واهتزاز مستمر للسيارة مع دوران سريع للعجلات
          objects[id].position.z = isRunning && !s.reducedMotion ? Math.sin(t * 4) * 0.28 : 0;
          if (fx.wheels) for (const w of fx.wheels) w.rotation.x = isRunning ? t * 7 : 0;
          break;
        case 'radio':
          // موجات صوتية نابضة ووميض لمبة الإشارة
          if (fx.waves) {
            fx.waves.visible = isRunning;
            if (isRunning) fx.waves.scale.setScalar(1 + Math.sin(t * 8) * 0.15);
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
          // وميض أحمر للأشعة تحت الحمراء
          if (fx.irLed) fx.irLed.material = mat(palette.red, isRunning && Math.sin(t * 12) > 0 ? 1.0 : 0);
          break;
        case 'calculator':
          // شاشة رقمية مضيئة بنبضات حية
          if (fx.calcLcd) fx.calcLcd.material = mat(isRunning ? 0x22c55e : 0x86efac, isRunning ? (0.7 + Math.sin(t * 4) * 0.3) : 0);
          break;
        case 'digitalScale':
          // شاشة رقمية مستمرة
          if (fx.scaleLcd) fx.scaleLcd.material = mat(isRunning ? 0x10b981 : 0x2d3748, isRunning ? 0.95 : 0);
          break;
        case 'smokeDetector':
          // وميض صافرة الإنذار المتقطع
          if (fx.smokeLed) fx.smokeLed.material = mat(palette.mint, isRunning && Math.sin(t * 7) > 0 ? 1.0 : 0);
          break;
        case 'laserPointer':
          // ليزر ساطع مستمر
          if (fx.laser) {
            fx.laser.visible = isRunning;
            if (isRunning) fx.laser.material.emissiveIntensity = 0.8 + Math.sin(t * 10) * 0.2;
          }
          break;
        case 'hearingAid':
          // نبضات دائرية صوتية في السماعة
          if (fx.aidPulse) {
            fx.aidPulse.visible = isRunning;
            if (isRunning) fx.aidPulse.scale.setScalar(1 + Math.sin(t * 6) * 0.2);
          }
          break;
        case 'fridge':
          // شارة التبريد وبخار البرودة
          if (fx.cooling) fx.cooling.visible = isRunning;
          if (fx.door) fx.door.rotation.y = s.doorOpen ? -Math.PI * 0.58 : 0;
          break;
        case 'microwave':
          // إضاءة داخلية وتوهج الحرارة
          if (fx.microLight) {
            fx.microLight.visible = isRunning;
            if (isRunning) fx.microLight.material = mat(0xffcf57, 0.7 + Math.sin(t * 5) * 0.3);
          }
          break;
        case 'washer':
          // دوران حوض الغسالة المستمر والسريع
          if (isRunning && fx.drum) fx.drum.rotation.z += 0.22;
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
          // اهتزاز محرك الشفط القوي للمكنسة
          if (isRunning && fx.vacBody) fx.vacBody.position.y = 0.42 + Math.sin(t * 35) * 0.03;
          break;
        case 'lamp':
          // إضاءة مصباح ساطعة مع مخروط ضوء ناصع على الطاولة
          if (fx.bulb) {
            fx.bulb.visible = isRunning;
            if (isRunning) fx.bulb.material = mat(0xfff382, 0.95);
          }
          if (fx.lightCone) {
            fx.lightCone.visible = isRunning;
            if (isRunning) fx.lightCone.material.opacity = 0.32 + Math.sin(t * 5) * 0.08;
          }
          break;
        case 'electricOven':
          // توهج سخان الفرن باللون الأحمر الحراري
          if (fx.ovenCoils) {
            fx.ovenCoils.visible = isRunning;
            if (isRunning) fx.ovenCoils.material = mat(0xef4444, 0.8 + Math.sin(t * 4) * 0.2);
          }
          break;
        case 'iron':
          // وميض لمبة التسخين البخاري
          if (fx.ironLed) {
            fx.ironLed.visible = isRunning;
            if (isRunning) fx.ironLed.material = mat(palette.orange, 0.9);
          }
          break;
        case 'hairDryer':
          // تدفق هواء ساخن متحرك من فوهة الاستشوار
          if (fx.dryerAir) {
            fx.dryerAir.visible = isRunning;
            if (isRunning) {
              fx.dryerAir.scale.setScalar(1 + Math.sin(t * 12) * 0.25);
              fx.dryerAir.material = mat(palette.orange, 0.7 + Math.sin(t * 8) * 0.3);
            }
          }
          break;
        case 'electricWaterHeater':
          // إضاءة تسخين الماء
          if (fx.heaterLed) {
            fx.heaterLed.visible = isRunning;
            if (isRunning) fx.heaterLed.material = mat(palette.red, 0.95);
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
          // حركة رأس وأذرع الروبوت مع وميض العيون
          if (isRunning) {
            if (fx.robotHead) fx.robotHead.rotation.y = Math.sin(t * 3.5) * 0.25;
            if (fx.robotArmL) fx.robotArmL.rotation.x = Math.sin(t * 7) * 0.5;
            if (fx.robotArmR) fx.robotArmR.rotation.x = -Math.sin(t * 7) * 0.5;
            if (fx.robotAntenna) fx.robotAntenna.material = mat(palette.red, Math.sin(t * 8) > 0 ? 1 : 0);
            if (fx.robotEyes) fx.robotEyes.forEach(eye => { eye.material = mat(0x38bdf8, 0.75 + Math.sin(t * 6) * 0.25); });
          }
          break;
        case 'electricToothbrush':
          // دوران رأس الفرشاة واهتزاز سريع
          if (isRunning) {
            if (fx.brushHead) fx.brushHead.rotation.y += 0.45;
            const slotIdx = Object.keys(objects).indexOf(id);
            if (slotIdx >= 0) objects[id].position.x = SLOT_X[slotIdx] + Math.sin(t * 40) * 0.015;
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
