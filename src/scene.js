// ═══════════════════════════════════════════════════════════════════════════
// src/scene.js — محرك المشهد ثلاثي الأبعاد المطور لمختبر شرارة المتحرك
// 4 منصات دائرية 1×4، خامات PBR واقعية، تحكم مداري 360°، وعارض فحص استوديو
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createPBRMaterials, disposeMaterials } from './materials.js';
import { createPlinth, normalizeDeviceOnPlinth, calculateCameraFrustum, PLINTH_X_SLOTS, PLINTH_TOP_Y } from './layout.js';
import { createDevice3D } from './devices/factory.js';
import { createInspectorViewer } from './inspector.js';
import { ALL_DEVICES } from './config.js';

export async function createLabScene(host, { getState, dispatch, onDevice, onBattery, onMains, projectLabel }) {
  let renderer;
  try {
    if (new URLSearchParams(location.search).has('fallback')) throw Error('Requested fallback');
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    dispatch({ type: 'RENDERER_FAILED' });
    return null;
  }

  const materials = createPBRMaterials();

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6.5, 6.5, 4.3, -4.3, 0.1, 100);

  let zoom = 1.0, dead = false, frame = 0, renderCount = 0;
  let isIntroPlaying = false, introStartTime = 0;
  let orbitRadius = 18.5;
  let orbitTheta = -0.08;
  let orbitPhi = 0.72;
  let targetCamPos = new THREE.Vector3(0, 12, 14);
  let currentCamPos = new THREE.Vector3(0, 12, 14);
  let targetLookAt = new THREE.Vector3(0, 1.8, 0);
  let currentLookAt = new THREE.Vector3(0, 1.8, 0);
  let isPassthrough = false;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0xeaf5f2, 1);

  host.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  // تعيين الحجم الأولي فقط إن كان الحجم صالحاً (> 1px)
  const initW = host.clientWidth;
  const initH = host.clientHeight;
  if (initW >= 2 && initH >= 2) {
    renderer.setSize(initW, initH, false);
  }

  // ─── الإضاءة الاحترافية الموزعة للمشهد ───
  const ambient = new THREE.HemisphereLight(0xffffff, 0xb0cdd4, 1.9);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff5dc, 2.3);
  sun.position.set(-3.5, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.0002;
  scene.add(sun);

  const fillLight = new THREE.DirectionalLight(0x2ec4b6, 0.6);
  fillLight.position.set(4, 3, -3);
  scene.add(fillLight);

  // ─── الخلفية والطاولة والبيئة ───
  const bgGroup = new THREE.Group();
  scene.add(bgGroup);

  // أرضية وشبكة هادئة
  const groundGeo = new THREE.PlaneGeometry(40, 30);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xdfedea, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  bgGroup.add(ground);

  const grid = new THREE.GridHelper(36, 36, 0xc0d7d2, 0xd0e3de);
  grid.position.y = 0.001;
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  bgGroup.add(grid);

  // جدار الغرفة الخلفي
  const wallGeo = new THREE.PlaneGeometry(30, 12);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe5f0eb, roughness: 0.95 });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(0, 5, -5.5);
  bgGroup.add(wall);

  // طاولة المختبر الكبيرة المصقولة (تتسع للمنصات الأربع بهامش وافر)
  const tableGroup = new THREE.Group();
  scene.add(tableGroup);

  const tableTopGeo = new RoundedBoxGeometry(8.6, 0.28, 3.2, 3, 0.08);
  const tableTop = new THREE.Mesh(tableTopGeo, materials.tableTop);
  tableTop.position.set(0, 1.74, 0);
  tableTop.receiveShadow = true;
  tableTop.castShadow = true;
  tableGroup.add(tableTop);

  const tableTrimGeo = new RoundedBoxGeometry(8.4, 0.12, 3.0, 2, 0.04);
  const tableTrim = new THREE.Mesh(tableTrimGeo, materials.custom(0x0f766e, { roughness: 0.3 }));
  tableTrim.position.set(0, 1.84, 0);
  tableGroup.add(tableTrim);

  // أرجل الطاولة
  for (const x of [-3.8, 3.8]) {
    for (const z of [-1.15, 1.15]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 16), materials.matteNavy);
      leg.position.set(x, 0.8, z);
      leg.castShadow = true;
      tableGroup.add(leg);
    }
  }

  // ─── مقبس الجدار 220V ───
  const wallSocketPillar = new THREE.Group();
  scene.add(wallSocketPillar);
  wallSocketPillar.position.set(-4.4, 0, -1.8);
  const socketPillarMesh = new THREE.Mesh(new RoundedBoxGeometry(0.4, 4.4, 0.4, 2, 0.05), materials.custom(0x94a3b8));
  socketPillarMesh.position.y = 2.2;
  wallSocketPillar.add(socketPillarMesh);

  const socketPos = new THREE.Vector3(-4.4, 2.2, -1.6);
  const wallSocketGroup = new THREE.Group();
  scene.add(wallSocketGroup);
  wallSocketGroup.position.copy(socketPos);
  const socketPlate = new THREE.Mesh(new RoundedBoxGeometry(0.74, 0.78, 0.12, 2, 0.05), materials.glossyWhite);
  wallSocketGroup.add(socketPlate);

  for (const yo of [-0.17, 0.17]) {
    const cav = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 20), materials.rubberDark);
    cav.rotation.x = Math.PI / 2;
    cav.position.set(0, yo, 0.08);
    wallSocketGroup.add(cav);
  }

  // كابل الكهرباء المتحرك وقابس 220V
  const mainsWire = new THREE.Group();
  scene.add(mainsWire);
  let mainsWireMesh = null;
  mainsWire.visible = false;

  const plugModel = new THREE.Group();
  scene.add(plugModel);
  const plugBody = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.2, 0.4, 2, 0.04), materials.rubberDark);
  const prong1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 12), materials.brushedMetal);
  prong1.rotation.x = Math.PI / 2; prong1.position.set(-0.065, 0, 0.25);
  const prong2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 12), materials.brushedMetal);
  prong2.rotation.x = Math.PI / 2; prong2.position.set(0.065, 0, 0.25);
  plugModel.add(plugBody, prong1, prong2);
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

    if (mainsWireMesh) mainsWireMesh.geometry.dispose();
    mainsWireMesh = new THREE.Mesh(new THREE.TubeGeometry(dynamicCurve, 24, 0.038, 8, false), materials.rubberDark);
    mainsWire.clear();
    mainsWire.add(mainsWireMesh);
    plugModel.position.copy(targetPlugPos);
    plugModel.lookAt(targetPlugPos.x, targetPlugPos.y, targetPlugPos.z + 1);
    mainsWire.visible = true;
    plugModel.visible = true;
  }

  // ─── الروبوت شرارة (الذراع المؤشرة) ───
  const robot = new THREE.Group();
  robot.position.set(4.9, 0.02, 0);
  scene.add(robot);
  const robotBody = new THREE.Mesh(new RoundedBoxGeometry(0.9, 1.4, 0.6, 2, 0.15), materials.glossyWhite);
  robotBody.position.y = 1.1;
  robot.add(robotBody);

  const robotArmPivot = new THREE.Group();
  robotArmPivot.position.set(-0.45, 1.25, 0);
  const armMesh = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.65, 0.18, 2, 0.06), materials.toyMint);
  armMesh.position.y = -0.32;
  robotArmPivot.add(armMesh);
  robot.add(robotArmPivot);
  robotArmPivot.rotation.z = 0.2;

  // ─── الشرارات والتوهج ───
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

  // ─── إدارة المنصات الأربع وتطبيع الأجهزة ───
  const plinths = [];
  for (let i = 0; i < 4; i++) {
    const plinth = createPlinth(i, materials);
    scene.add(plinth);
    plinths.push(plinth);
  }

  const objects = {};
  const activeEffects = {};
  const targets = [];

  function mountDevices(devIds) {
    for (const id in objects) {
      scene.remove(objects[id]);
      objects[id].traverse(o => { if (o.geometry) o.geometry.dispose(); });
      delete objects[id];
      delete activeEffects[id];
    }
    targets.length = 0;

    devIds.forEach((id, idx) => {
      const meshObj = createDevice3D(id, materials);
      normalizeDeviceOnPlinth(meshObj, 1.35);
      const xPos = PLINTH_X_SLOTS[idx] || 0;
      meshObj.position.set(xPos, PLINTH_TOP_Y, 0);

      scene.add(meshObj);
      objects[id] = meshObj;
      activeEffects[id] = meshObj.userData.effects || {};

      meshObj.traverse(o => {
        if (o.isMesh) {
          o.userData.device = id;
          targets.push(o);
        }
      });
    });

    fitToDevices({ animate: false });
  }

  // ─── عارض الفحص المتقدم ───
  const inspector = createInspectorViewer({
    renderer,
    materials,
    host,
    onExit: () => {
      fitToDevices({ animate: true });
    }
  });

  // ─── ضبط الكاميرا التلقائي (fitToDevices) ───
  function cameraUpdate() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w < 2 || h < 2) return;
    const isPortrait = h > w * 1.05;
    const frustum = calculateCameraFrustum(w, h, zoom, isPortrait);
    camera.left = frustum.left;
    camera.right = frustum.right;
    camera.top = frustum.top;
    camera.bottom = frustum.bottom;
    camera.updateProjectionMatrix();
  }

  function fitToDevices({ animate = true } = {}) {
    targetLookAt.set(0, 1.9, 0);
    const r = orbitRadius;
    targetCamPos.set(
      r * Math.sin(orbitPhi) * Math.sin(orbitTheta),
      1.9 + r * Math.cos(orbitPhi),
      r * Math.sin(orbitPhi) * Math.cos(orbitTheta)
    );

    if (!animate || getState().reducedMotion) {
      currentCamPos.copy(targetCamPos);
      currentLookAt.copy(targetLookAt);
      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);
    }
    cameraUpdate();
  }

  function handleResize() {
    if (dead) return;
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w < 2 || h < 2) return;
    renderer.setSize(w, h, false);
    cameraUpdate();
    fitToDevices({ animate: false });
  }

  const observer = new ResizeObserver(handleResize);
  observer.observe(host);
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize, { passive: true });

  // ─── تفاعل السحب لتدوير الطاولة 360° ───
  let isPointerDown = false;
  let startX = 0, startY = 0;
  let lastX = 0, lastY = 0;
  let hasMoved = false;

  renderer.domElement.addEventListener('pointerdown', e => {
    if (inspector.isOpen()) return;
    isPointerDown = true;
    startX = e.clientX; startY = e.clientY;
    lastX = e.clientX; lastY = e.clientY;
    hasMoved = false;
    try { renderer.domElement.setPointerCapture(e.pointerId); } catch {}
  });

  renderer.domElement.addEventListener('pointermove', e => {
    if (!isPointerDown || inspector.isOpen()) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > 6) hasMoved = true;
    lastX = e.clientX; lastY = e.clientY;

    orbitTheta -= dx * 0.008;
    orbitPhi = Math.max(0.35, Math.min(1.3, orbitPhi - dy * 0.006));
    fitToDevices({ animate: false });
  });

  const onPointerUp = e => {
    if (!isPointerDown) return;
    isPointerDown = false;
    try { renderer.domElement.releasePointerCapture(e.pointerId); } catch {}
    if (!hasMoved) {
      const clicked = at(e.clientX, e.clientY);
      if (clicked && onDevice) onDevice(clicked);
    }
  };

  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointercancel', () => { isPointerDown = false; });

  renderer.domElement.addEventListener('wheel', e => {
    if (inspector.isOpen()) return;
    e.preventDefault();
    zoom = Math.max(0.7, Math.min(1.8, zoom + (e.deltaY < 0 ? 0.08 : -0.08)));
    cameraUpdate();
  }, { passive: false });

  // ─── Raycaster لاكتشاف النقر على الأجهزة ───
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

  // ─── حلقة التصيير الرئيسية ───
  let prevRevision = -1;

  function tick(now) {
    if (dead) return;
    frame = requestAnimationFrame(tick);
    renderCount++;

    if (document.hidden || inspector.isOpen()) return;

    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w < 2 || h < 2) return;

    const s = getState();
    const t = now * 0.001;

    if (s.sessionRevision !== prevRevision) {
      prevRevision = s.sessionRevision;
      mountDevices(Object.keys(s.devices || {}));
    }

    if (isIntroPlaying) {
      const elapsed = (now - introStartTime) / 1000;
      if (elapsed > 3.0) {
        isIntroPlaying = false;
        orbitTheta = -0.08; orbitPhi = 0.72;
        fitToDevices({ animate: true });
      } else {
        const p = elapsed / 3.0;
        orbitTheta = Math.sin(p * Math.PI) * 0.25 - 0.08;
      }
    }

    currentCamPos.lerp(targetCamPos, 0.08);
    currentLookAt.lerp(targetLookAt, 0.08);
    camera.position.copy(currentCamPos);
    camera.lookAt(currentLookAt);

    updateSparks(now);

    if (s.mainsLocation && s.mainsLocation !== 'socket' && objects[s.mainsLocation]) {
      const devPos = objects[s.mainsLocation].position.clone();
      devPos.y += 0.25;
      updateMainsCable(devPos);
    } else {
      mainsWire.visible = false;
      plugModel.visible = false;
      lastTargetPlugPos = null;
    }

    // تشغيل مؤثرات الأجهزة الأربعة في المشهد
    for (const id in objects) {
      const isRunning = s.devices[id]?.status === 'running';
      const fx = activeEffects[id] || {};

      switch (id) {
        case 'car':
        case 'toyCar':
          if (isRunning) {
            fx.wheels?.forEach(w => { w.rotation.x += 0.35; });
            fx.headlights?.forEach(h => { h.visible = true; });
            objects[id].position.z = Math.sin(t * 10) * 0.12;
            objects[id].position.y = PLINTH_TOP_Y + Math.abs(Math.sin(t * 20)) * 0.02;
          } else {
            fx.headlights?.forEach(h => { h.visible = false; });
            objects[id].position.z = 0;
            objects[id].position.y = PLINTH_TOP_Y;
          }
          break;

        case 'radio':
          if (isRunning) {
            if (fx.waves) fx.waves.visible = true;
            if (fx.radioLight) fx.radioLight.material = materials.custom(Math.sin(t * 8) > 0 ? 0x2ec4b6 : 0xffb703, { isEmissive: true });
            fx.waves?.children.forEach((c, idx) => {
              c.scale.setScalar(1 + Math.sin(t * 12 + idx * 1.5) * 0.3);
            });
          } else {
            if (fx.waves) fx.waves.visible = false;
            if (fx.radioLight) fx.radioLight.material = materials.custom(0x334155);
          }
          break;

        case 'flashlight':
          if (fx.beam) fx.beam.visible = isRunning;
          break;

        case 'wallClock':
          if (isRunning) {
            if (fx.handM) fx.handM.rotation.z -= 0.18;
            if (fx.handH) fx.handH.rotation.z -= 0.03;
          }
          break;

        case 'remote':
          if (isRunning) {
            if (fx.irLed) fx.irLed.material = materials.custom(Math.sin(t * 15) > 0 ? 0xef4444 : 0x334155, { isEmissive: Math.sin(t * 15) > 0 });
            if (fx.irWave) {
              fx.irWave.visible = true;
              fx.irWave.scale.setScalar(1 + Math.sin(t * 20) * 0.4);
            }
          } else {
            if (fx.irLed) fx.irLed.material = materials.custom(0x334155);
            if (fx.irWave) fx.irWave.visible = false;
          }
          break;

        case 'smokeDetector':
          if (isRunning) {
            if (fx.alarmLight) fx.alarmLight.material = materials.custom(Math.sin(t * 14) > 0 ? 0xef4444 : 0x334155, { isEmissive: Math.sin(t * 14) > 0 });
            if (fx.alarmRing) {
              fx.alarmRing.visible = true;
              fx.alarmRing.scale.setScalar(1 + Math.sin(t * 16) * 0.5);
            }
          } else {
            if (fx.alarmLight) fx.alarmLight.material = materials.custom(0x334155);
            if (fx.alarmRing) fx.alarmRing.visible = false;
          }
          break;

        case 'laserPointer':
          if (fx.laserBeam) fx.laserBeam.visible = isRunning;
          if (fx.laserDot) fx.laserDot.visible = isRunning;
          break;

        case 'hearingAid':
          if (fx.aidWaves) fx.aidWaves.visible = isRunning;
          break;

        case 'robotToy':
          if (isRunning) {
            fx.robotEyes?.forEach(e => { e.material = materials.custom(Math.sin(t * 8) > 0 ? 0xffb703 : 0x2ec4b6, { isEmissive: true }); });
            objects[id].rotation.y = Math.sin(t * 6) * 0.25;
          } else {
            fx.robotEyes?.forEach(e => { e.material = materials.custom(0x0f172a); });
            objects[id].rotation.y = 0;
          }
          break;

        case 'electricToothbrush':
          if (isRunning && fx.brushHead) {
            fx.brushHead.rotation.y += 0.5;
            objects[id].position.y = PLINTH_TOP_Y + Math.sin(t * 30) * 0.01;
          }
          break;

        case 'microwave':
          if (fx.plate && isRunning) fx.plate.rotation.y += 0.15;
          break;

        case 'washer':
          if (fx.drum && isRunning) {
            fx.drum.rotation.z += 0.35;
            objects[id].position.y = PLINTH_TOP_Y + Math.abs(Math.sin(t * 40)) * 0.015;
          } else {
            objects[id].position.y = PLINTH_TOP_Y;
          }
          break;

        case 'airConditioner':
          if (fx.louver && isRunning) fx.louver.rotation.x = Math.sin(t * 4) * 0.35;
          break;

        case 'vacuum':
          if (isRunning) {
            if (fx.vortex) { fx.vortex.visible = true; fx.vortex.rotation.z += 0.35; }
          } else {
            if (fx.vortex) fx.vortex.visible = false;
          }
          break;

        case 'lamp':
          if (fx.bulb) fx.bulb.material = materials.custom(isRunning ? 0xfef08a : 0x475569, { isEmissive: isRunning });
          if (fx.spotlight) fx.spotlight.visible = isRunning;
          break;

        case 'electricOven':
          if (fx.coils) fx.coils.forEach(c => { c.visible = isRunning; });
          break;

        case 'iron':
          if (fx.steam) fx.steam.forEach((s, idx) => {
            s.visible = isRunning;
            if (isRunning) s.position.y = 0.8 + ((t * 2 + idx * 0.4) % 0.6);
          });
          break;

        case 'hairDryer':
          if (fx.windRings) {
            fx.windRings.forEach((r, idx) => {
              r.visible = isRunning;
              if (isRunning) {
                const phase = ((t * 4 + idx * 0.4) % 1.2);
                r.position.x = 0.6 + phase * 0.6;
                r.scale.setScalar(0.6 + phase * 0.7);
              }
            });
          }
          break;

        case 'electricHeater':
          if (fx.rods) fx.rods.forEach(r => { r.visible = isRunning; });
          break;

        case 'blender':
          if (isRunning) {
            if (fx.blades) fx.blades.rotation.y += 0.6;
            if (fx.juice) fx.juice.visible = true;
          } else {
            if (fx.juice) fx.juice.visible = false;
          }
          break;
      }

      // إسقاط موقع كل منصة على شاشة الـ DOM
      if (projectLabel) {
        const v = objects[id].position.clone();
        v.y -= 0.15;
        v.project(camera);
        const screenX = ((v.x + 1) * w) / 2;
        const screenY = ((-v.y + 1) * h) / 2;
        projectLabel(id, screenX, screenY);
      }
    }

    renderer.render(scene, camera);
  }

  frame = requestAnimationFrame(tick);

  return {
    at,
    setDragWorld(tool, x, y) {
      // إشارة بدون حلقات صفراء
    },
    clearDragWorld() {},
    triggerSparks,
    fitToDevices,
    playRevealIntro() {
      if (getState().reducedMotion) { fitToDevices({ animate: false }); return; }
      isIntroPlaying = true;
      introStartTime = performance.now();
    },
    skipRevealIntro() {
      isIntroPlaying = false;
      orbitTheta = -0.08; orbitPhi = 0.72;
      fitToDevices({ animate: true });
    },
    setCameraPassthrough(stream) {
      isPassthrough = Boolean(stream);
      if (isPassthrough) {
        renderer.setClearAlpha(0);
        bgGroup.visible = false;
      } else {
        renderer.setClearAlpha(1);
        bgGroup.visible = true;
      }
    },
    pointTo(deviceId) {
      if (!deviceId || !objects[deviceId]) {
        robotArmPivot.rotation.z = 0.2;
        return;
      }
      robotArmPivot.rotation.z = -0.65;
    },
    showTargetRing(deviceId) {},
    zoomIn() { zoom = Math.min(1.8, zoom + 0.15); cameraUpdate(); },
    zoomOut() { zoom = Math.max(0.7, zoom - 0.15); cameraUpdate(); },
    reset() {
      zoom = 1;
      orbitTheta = -0.08; orbitPhi = 0.72;
      for (const id in objects) { objects[id].rotation.set(0, 0, 0); }
      fitToDevices({ animate: true });
    },
    inspect(id) { inspector.open(id); },
    openInspector(id) { inspector.open(id); },
    closeInspector() { inspector.close(); },
    rotateDevice(id, angleY = Math.PI / 2) {
      if (objects[id]) objects[id].rotation.y += angleY;
    },
    dispose() {
      dead = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      inspector.dispose();
      disposeMaterials();
      scene.traverse(o => {
        o.geometry?.dispose();
        if (o.material?.map) o.material.map.dispose();
      });
      renderer.dispose();
    },
    stats() {
      return { renderCount, zoom };
    }
  };
}
