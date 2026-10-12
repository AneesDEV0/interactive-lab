// ═══════════════════════════════════════════════════════════════════════════
// src/friction/models.js — المجسمات ثلاثية الأبعاد الواقعية والمعبّرة لمحطة الاحتكاك والدلك
// تضم أيدي بشرية مفصلية، طفل الشتاء، بالون وصوف منسوج، مسطرة مدرّجة، مشط، وخشب طبيعي
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const materials = {
  // بشرة وملابس بشرية واقعية
  skin: new THREE.MeshStandardMaterial({ color: 0xf4c49c, roughness: 0.52, metalness: 0.04 }),
  skinWarm: new THREE.MeshStandardMaterial({ color: 0xf7a082, roughness: 0.45, metalness: 0.05, emissive: 0xd9480f, emissiveIntensity: 0.18 }),
  cheekCold: new THREE.MeshStandardMaterial({ color: 0xefb0a4, roughness: 0.6 }),
  cheekWarm: new THREE.MeshStandardMaterial({ color: 0xf46a55, roughness: 0.5, emissive: 0xe03131, emissiveIntensity: 0.22 }),
  eye: new THREE.MeshStandardMaterial({ color: 0x1e1b24, roughness: 0.25 }),
  eyeWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.82 }),
  sleeveBlue: new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.65 }),
  sleeveGreen: new THREE.MeshStandardMaterial({ color: 0x2f855a, roughness: 0.65 }),
  cuffWhite: new THREE.MeshStandardMaterial({ color: 0xf7fafc, roughness: 0.7 }),

  // ملابس الطفل الشتوية (مطابقة لورقة الاختبار)
  jacketBlue: new THREE.MeshStandardMaterial({ color: 0x1e88e5, roughness: 0.42, metalness: 0.06 }),
  jacketDark: new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.5 }),
  jacketTrimRed: new THREE.MeshStandardMaterial({ color: 0xe53935, roughness: 0.48 }),
  winterYellow: new THREE.MeshStandardMaterial({ color: 0xf6c93e, roughness: 0.78, metalness: 0.02 }),
  winterYellowDark: new THREE.MeshStandardMaterial({ color: 0xddaa1e, roughness: 0.82 }),
  pantsBlue: new THREE.MeshStandardMaterial({ color: 0x1e4e8c, roughness: 0.65 }),
  bootsDark: new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.5 }),
  snowBase: new THREE.MeshStandardMaterial({ color: 0xeef6ff, roughness: 0.85, metalness: 0.02 }),
  iceCrystal: new THREE.MeshBasicMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.75 }),

  // طاولة المختبر الخشبية
  tableTop: new THREE.MeshStandardMaterial({ color: 0xd8a46f, roughness: 0.62, metalness: 0.04 }),
  tableEdge: new THREE.MeshStandardMaterial({ color: 0xb07c49, roughness: 0.7 }),

  // بالون مطاطي وصوف محبوك
  balloonRed: new THREE.MeshPhysicalMaterial({
    color: 0xe53855,
    roughness: 0.14,
    metalness: 0.03,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1
  }),
  stringWhite: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 }),
  woolPurple: new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.92 }),
  woolLavender: new THREE.MeshStandardMaterial({ color: 0x9f7aea, roughness: 0.9 }),
  woolTeal: new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.92 }),
  woolTealLight: new THREE.MeshStandardMaterial({ color: 0x2dd4bf, roughness: 0.9 }),

  // مسطرة بلاستيكية ومشط
  rulerPlastic: new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    roughness: 0.15,
    transmission: 0.35,
    transparent: true,
    opacity: 0.88,
    clearcoat: 0.6
  }),
  rulerInk: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }),
  combPlastic: new THREE.MeshPhysicalMaterial({
    color: 0xec4899,
    roughness: 0.2,
    metalness: 0.05,
    clearcoat: 0.75
  }),

  // خشب طبيعي
  woodDark: new THREE.MeshStandardMaterial({ color: 0x7c4a21, roughness: 0.8 }),
  woodMedium: new THREE.MeshStandardMaterial({ color: 0xa46b39, roughness: 0.75 }),
  woodLight: new THREE.MeshStandardMaterial({ color: 0xd7a876, roughness: 0.7 }),

  // قصاصات الورق الملونة
  paperWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, side: THREE.DoubleSide }),
  paperYellow: new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.75, side: THREE.DoubleSide }),
  paperBlue: new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.75, side: THREE.DoubleSide }),
  paperPink: new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.75, side: THREE.DoubleSide }),

  // مؤثرات الحرارة والشرارات الساكنة
  heatWave: new THREE.MeshBasicMaterial({ color: 0xff6b2b, transparent: true, opacity: 0.9 }),
  warmGlow: new THREE.MeshBasicMaterial({ color: 0xff9f1c, transparent: true, opacity: 0.36 }),
  sparkCharge: new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.92 }),
  sparkGold: new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.9 })
};

function mesh(parent, geom, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geom, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function rbox(p, w, h, d, m, x = 0, y = 0, z = 0, r = 0.04) {
  return mesh(p, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 4, h / 4, d / 4)), m, x, y, z);
}

function cyl(p, rTop, rBot, h, m, x = 0, y = 0, z = 0, seg = 24) {
  return mesh(p, new THREE.CylinderGeometry(rTop, rBot, h, seg), m, x, y, z);
}

function sphere(p, r, m, x = 0, y = 0, z = 0, seg = 24) {
  return mesh(p, new THREE.SphereGeometry(r, seg, 18), m, x, y, z);
}

// ─── طاولة خشبية واقعية للتجارب ───
function createLabTable(parent, y = 0.06) {
  const table = new THREE.Group();
  rbox(table, 3.0, 0.12, 1.9, materials.tableTop, 0, y, 0, 0.04);
  rbox(table, 3.04, 0.04, 1.94, materials.tableEdge, 0, y - 0.05, 0, 0.02);
  parent.add(table);
  return table;
}

// ─── يد بشرية مفصلية واقعية مع كم قميص وأصابع ───
function createDetailedHand({ side = 'right', pose = 'grip', sleeveMat = materials.sleeveBlue, scale = 1.0 } = {}) {
  const hand = new THREE.Group();
  const s = side === 'left' ? -1 : 1;

  // الساعد والكمّ
  cyl(hand, 0.14, 0.17, 0.62, sleeveMat, 0, -0.44, 0);
  cyl(hand, 0.145, 0.145, 0.08, materials.cuffWhite, 0, -0.14, 0);
  sphere(hand, 0.13, materials.skin, 0, -0.04, 0);

  // راحة الكف
  const palm = rbox(hand, 0.3, 0.32, 0.13, materials.skin, 0, 0.15, 0, 0.05);

  // الأصابع الأربعة بمفاصل واقعية
  const offsets = [-0.1, -0.033, 0.033, 0.1];
  const lengths = [0.24, 0.27, 0.25, 0.2];
  offsets.forEach((xOff, idx) => {
    const len = lengths[idx];
    const fGroup = new THREE.Group();
    fGroup.position.set(xOff, 0.3, 0);
    if (pose === 'grip') fGroup.rotation.x = 0.35;
    else if (pose === 'press') fGroup.rotation.x = 0.18;

    cyl(fGroup, 0.029, 0.033, len * 0.55, materials.skin, 0, len * 0.27, 0);
    const tip = new THREE.Group();
    tip.position.set(0, len * 0.55, 0);
    tip.rotation.x = pose === 'grip' ? 0.65 : pose === 'press' ? 0.25 : 0.08;
    cyl(tip, 0.025, 0.029, len * 0.48, materials.skin, 0, len * 0.24, 0);
    sphere(tip, 0.025, materials.skin, 0, len * 0.48, 0);
    fGroup.add(tip);
    hand.add(fGroup);
  });

  // الإبهام
  const thumb = new THREE.Group();
  thumb.position.set(s * -0.15, 0.1, 0.04);
  thumb.rotation.z = s * 0.55;
  thumb.rotation.x = pose === 'grip' ? 0.4 : 0.15;
  cyl(thumb, 0.032, 0.036, 0.22, materials.skin, 0, 0.11, 0);
  sphere(thumb, 0.031, materials.skin, 0, 0.22, 0);
  hand.add(thumb);

  hand.scale.setScalar(scale);
  hand.userData.palm = palm;
  return hand;
}

// ─── قطعة صوف محبوكة реалистية بخيوط بارزة (وليست مكعباً مصمتاً) ───
function createKnittedWoolBundle(mainMat = materials.woolPurple, accentMat = materials.woolLavender) {
  const wool = new THREE.Group();
  // قلب الصوف المرن
  const core = sphere(wool, 0.26, mainMat, 0, 0, 0);
  core.scale.set(1.25, 0.72, 1.05);

  // حلقات الغزل المحبوكة المتداخلة لإظهار ملمس الصوف الحقيقي
  for (let i = 0; i < 8; i++) {
    const mat = i % 2 === 0 ? mainMat : accentMat;
    const loop = mesh(wool, new THREE.TorusGeometry(0.22, 0.042, 12, 28), mat, (i - 3.5) * 0.045, 0, 0);
    loop.rotation.y = (i * Math.PI) / 6;
    loop.rotation.x = (i % 3) * 0.45;
  }
  for (let j = -2; j <= 2; j++) {
    const strand = cyl(wool, 0.038, 0.038, 0.52, accentMat, 0, 0.03 * (j % 2), j * 0.075);
    strand.rotation.z = Math.PI / 2;
  }
  return wool;
}

// ─── موجات الدفء والحرارة المتصاعدة ───
function createWarmthEffect(x = 0, y = 1.0, z = 0.45, scale = 1.0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);

  const waves = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const yOff = (i - 1) * 0.15;
      const pts = [
        new THREE.Vector3(side * 0.14, yOff, 0),
        new THREE.Vector3(side * 0.24, yOff + 0.055, 0.02),
        new THREE.Vector3(side * 0.34, yOff - 0.045, -0.02),
        new THREE.Vector3(side * 0.45, yOff + 0.05, 0)
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      const w = mesh(group, new THREE.TubeGeometry(curve, 16, 0.022, 8, false), materials.heatWave);
      w.userData.baseY = w.position.y;
      w.userData.phase = i * 1.1 + (side > 0 ? 0.5 : 0);
      waves.push(w);
    }
  }
  const glow = sphere(group, 0.24, materials.warmGlow, 0, 0, 0);
  group.userData.waves = waves;
  group.userData.glow = glow;
  return group;
}

// ─── شرارات الشحنات الكهربائية الساكنة عند الدلك ───
function createStaticSparks(x = 0, y = 1.0, z = 0.2) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const bolts = [];

  const offsets = [
    [-0.22, 0.12, 0.12],
    [0.0, 0.22, 0.16],
    [0.22, 0.08, 0.12],
    [-0.14, -0.14, 0.15],
    [0.16, -0.12, 0.15]
  ];

  offsets.forEach(([bx, by, bz], idx) => {
    const bolt = new THREE.Group();
    bolt.position.set(bx, by, bz);
    const mat = idx % 2 === 0 ? materials.sparkCharge : materials.sparkGold;
    const pts = [
      new THREE.Vector3(-0.06, -0.05, 0),
      new THREE.Vector3(0.01, 0.01, 0.02),
      new THREE.Vector3(-0.02, 0.04, -0.01),
      new THREE.Vector3(0.06, 0.09, 0)
    ];
    mesh(bolt, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.014, 6, false), mat);
    sphere(bolt, 0.028, mat, 0, 0, 0);
    bolt.userData.phase = idx * 1.3;
    group.add(bolt);
    bolts.push(bolt);
  });

  group.userData.bolts = bolts;
  return group;
}

// ─── قصاصات الورق الملونة التي تنجذب وتلتصق بالجسم المدلوك ───
function createAttractablePaperBits(yTable = 0.13, targetPoints = []) {
  const group = new THREE.Group();
  const mats = [materials.paperWhite, materials.paperYellow, materials.paperBlue, materials.paperPink];
  const baseCoords = [
    [-0.52, yTable, 0.28],
    [-0.26, yTable, -0.18],
    [-0.08, yTable, 0.24],
    [0.12, yTable, -0.12],
    [0.32, yTable, 0.22],
    [0.52, yTable, -0.08],
    [-0.36, yTable, 0.06],
    [0.22, yTable, 0.05]
  ];

  baseCoords.forEach(([x, y, z], idx) => {
    const bit = rbox(group, 0.16, 0.018, 0.12, mats[idx % mats.length], x, y, z, 0.004);
    bit.rotation.y = idx * 0.65;
    bit.userData.basePos = new THREE.Vector3(x, y, z);
    const target = targetPoints[idx % targetPoints.length] || new THREE.Vector3(x * 0.6, y + 0.52, z * 0.5);
    bit.userData.targetPos = target.clone();
    bit.userData.phase = idx * 0.9;
  });

  return group;
}

function createProceduralFrictionModel(id) {
  const g = new THREE.Group();
  const anim = {
    id,
    leftPart: null,
    rightPart: null,
    effectGroup: null,
    coldGroup: null,
    paperBits: null,
    cheeks: []
  };
  g.userData.anim = anim;

  switch (id) {
    case 'winterHands': {
      // ─── ١. فرك اليدين في الشتاء: طفل شتوي واقعي يفرك كفّيه أمام صدره ───
      // قاعدة ثلجية شتوية ناعمة
      cyl(g, 0.95, 1.05, 0.1, materials.snowBase, 0, 0.05, 0, 32);

      // الحذاءان الشتويان والساقان
      rbox(g, 0.22, 0.16, 0.34, materials.bootsDark, -0.22, 0.16, 0.05, 0.05);
      rbox(g, 0.22, 0.16, 0.34, materials.bootsDark, 0.22, 0.16, 0.05, 0.05);
      cyl(g, 0.13, 0.11, 0.48, materials.pantsBlue, -0.22, 0.44, 0);
      cyl(g, 0.13, 0.11, 0.48, materials.pantsBlue, 0.22, 0.44, 0);

      // المعطف الشتوي الأزرق المبطن (Puffer Jacket) مع سحاب وحاشية حمراء
      rbox(g, 0.88, 0.88, 0.54, materials.jacketBlue, 0, 1.06, 0, 0.16);
      for (const yStripe of [0.84, 1.06, 1.26]) {
        rbox(g, 0.9, 0.03, 0.56, materials.jacketDark, 0, yStripe, 0, 0.01);
      }
      rbox(g, 0.055, 0.86, 0.57, materials.jacketTrimRed, 0, 1.06, 0, 0.02);
      rbox(g, 0.91, 0.07, 0.57, materials.jacketTrimRed, 0, 0.65, 0, 0.02);

      // الوشاح الشتوي الأصفر المحبوك حول العنق
      const scarf = mesh(g, new THREE.TorusGeometry(0.3, 0.085, 16, 32), materials.winterYellow, 0, 1.48, 0.02);
      scarf.rotation.x = Math.PI / 2;
      rbox(g, 0.15, 0.38, 0.07, materials.winterYellow, 0.18, 1.28, 0.29, 0.03);
      rbox(g, 0.15, 0.05, 0.075, materials.winterYellowDark, 0.18, 1.11, 0.29, 0.01);

      // الرأس والملامح البشرية اللطيفة
      sphere(g, 0.34, materials.skin, 0, 1.82, 0.02);
      sphere(g, 0.045, materials.skin, 0, 1.78, 0.36); // الأنف
      // العينان البراقتان والحاجبان
      sphere(g, 0.052, materials.eyeWhite, -0.12, 1.84, 0.31);
      sphere(g, 0.052, materials.eyeWhite, 0.12, 1.84, 0.31);
      sphere(g, 0.032, materials.eye, -0.12, 1.84, 0.345);
      sphere(g, 0.032, materials.eye, 0.12, 1.84, 0.345);
      // الابتسامة
      const smile = mesh(g, new THREE.TorusGeometry(0.065, 0.014, 8, 20, Math.PI), materials.jacketTrimRed, 0, 1.72, 0.33);
      smile.rotation.z = Math.PI;
      // الخدود التي تتورد بالدفء عند الفرك
      const cheekL = sphere(g, 0.06, materials.cheekCold, -0.21, 1.75, 0.28);
      const cheekR = sphere(g, 0.06, materials.cheekCold, 0.21, 1.75, 0.28);
      anim.cheeks = [cheekL, cheekR];

      // القبعة الصوفية الصفراء المضلعة مع الكرة الصوفية العلوية
      const beanie = sphere(g, 0.36, materials.winterYellow, 0, 1.94, 0);
      beanie.scale.set(1.03, 0.88, 1.03);
      const brim = mesh(g, new THREE.TorusGeometry(0.34, 0.07, 14, 32), materials.winterYellowDark, 0, 1.93, 0.02);
      brim.rotation.x = Math.PI / 2 - 0.1;
      sphere(g, 0.105, materials.winterYellow, 0, 2.3, -0.01);

      // الذراع اليسرى واليد اليسرى بأصابعها
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.07, 1.14, 0.42);
      const sleeveL = cyl(leftArm, 0.11, 0.13, 0.52, materials.jacketBlue, -0.26, 0.04, -0.18);
      sleeveL.rotation.z = -0.95;
      sleeveL.rotation.x = 0.55;
      rbox(leftArm, 0.09, 0.22, 0.2, materials.skin, -0.01, -0.02, 0, 0.04);
      for (let f = 0; f < 4; f++) {
        cyl(leftArm, 0.022, 0.024, 0.14, materials.skin, -0.01, 0.11, -0.06 + f * 0.04);
      }
      const thumbL = cyl(leftArm, 0.024, 0.026, 0.12, materials.skin, -0.01, 0.06, 0.11);
      thumbL.rotation.x = -0.45;
      g.add(leftArm);

      // الذراع اليمنى واليد اليمنى بأصابعها
      const rightArm = new THREE.Group();
      rightArm.position.set(0.07, 1.14, 0.42);
      const sleeveR = cyl(rightArm, 0.11, 0.13, 0.52, materials.jacketBlue, 0.26, 0.04, -0.18);
      sleeveR.rotation.z = 0.95;
      sleeveR.rotation.x = 0.55;
      rbox(rightArm, 0.09, 0.22, 0.2, materials.skin, 0.01, -0.02, 0, 0.04);
      for (let f = 0; f < 4; f++) {
        cyl(rightArm, 0.022, 0.024, 0.14, materials.skin, 0.01, 0.11, -0.06 + f * 0.04);
      }
      const thumbR = cyl(rightArm, 0.024, 0.026, 0.12, materials.skin, 0.01, 0.06, 0.11);
      thumbR.rotation.x = -0.45;
      g.add(rightArm);

      // بلورات ثلج شتوية قبل الفرك (تختفي عند الشعور بالدفء)
      const coldGroup = new THREE.Group();
      for (const [sx, sy, sz] of [[-0.62, 1.65, 0.2], [0.62, 1.55, 0.2], [-0.55, 1.05, 0.3], [0.58, 1.0, 0.28]]) {
        const flake = new THREE.Group();
        flake.position.set(sx, sy, sz);
        for (let a = 0; a < 3; a++) {
          const bar = rbox(flake, 0.16, 0.022, 0.022, materials.iceCrystal, 0, 0, 0, 0.005);
          bar.rotation.z = (a * Math.PI) / 3;
        }
        coldGroup.add(flake);
      }
      g.add(coldGroup);

      // موجات الدفء والتوهج الحراري بين الكفّين عند الفرك
      const heat = createWarmthEffect(0, 1.16, 0.48, 1.05);
      heat.visible = false;
      g.add(heat);

      anim.leftPart = leftArm;
      anim.rightPart = rightArm;
      anim.coldGroup = coldGroup;
      anim.effectGroup = heat;
      break;
    }

    case 'balloonWool': {
      // ─── ٢. دلك بالون بقطعة صوف: يد تمسك البالون ويد تدلكه بصوف محبوك ───
      createLabTable(g, 0.06);

      // مجموعة البالون واليد اليسرى الممسكة بعنقه
      const balloonGroup = new THREE.Group();
      balloonGroup.position.set(-0.22, 1.15, 0);

      // جسم البالون الكمثرى اللامع وعنقه وحلقته وخيطه
      const bBody = sphere(balloonGroup, 0.56, materials.balloonRed, 0, 0.06, 0, 32);
      bBody.scale.set(0.94, 1.14, 0.94);
      cyl(balloonGroup, 0.045, 0.095, 0.12, materials.balloonRed, 0, -0.58, 0);
      const lip = mesh(balloonGroup, new THREE.TorusGeometry(0.085, 0.02, 10, 24), materials.balloonRed, 0, -0.64, 0);
      lip.rotation.x = Math.PI / 2;

      // خيط البالون الأبيض المنحني
      const stringCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.65, 0),
        new THREE.Vector3(-0.06, -0.82, 0.04),
        new THREE.Vector3(0.03, -0.98, -0.02)
      ]);
      mesh(balloonGroup, new THREE.TubeGeometry(stringCurve, 14, 0.014, 8, false), materials.stringWhite);

      // اليد اليسرى تمسك عنق البالون
      const leftHand = createDetailedHand({ side: 'left', pose: 'grip', sleeveMat: materials.sleeveBlue, scale: 0.72 });
      leftHand.position.set(-0.28, -0.62, 0.06);
      leftHand.rotation.z = -1.25;
      leftHand.rotation.y = 0.35;
      balloonGroup.add(leftHand);
      g.add(balloonGroup);

      // مجموعة قطعة الصوف المحبوكة واليد اليمنى التي تدلك سطح البالون
      const woolGroup = new THREE.Group();
      woolGroup.position.set(0.32, 1.24, 0.12);
      const woolBundle = createKnittedWoolBundle(materials.woolPurple, materials.woolLavender);
      woolBundle.rotation.z = 0.95;
      woolGroup.add(woolBundle);

      const rightHand = createDetailedHand({ side: 'right', pose: 'press', sleeveMat: materials.sleeveGreen, scale: 0.78 });
      rightHand.position.set(0.36, 0.08, 0.04);
      rightHand.rotation.z = 1.45;
      rightHand.rotation.x = 0.25;
      woolGroup.add(rightHand);
      g.add(woolGroup);

      // قصاصات الورق على الطاولة تنجذب إلى أسفل البالون عند الدلك
      const targetPts = [
        new THREE.Vector3(-0.42, 0.68, 0.22),
        new THREE.Vector3(-0.28, 0.62, -0.18),
        new THREE.Vector3(-0.14, 0.64, 0.25),
        new THREE.Vector3(0.02, 0.72, -0.14),
        new THREE.Vector3(0.14, 0.78, 0.18),
        new THREE.Vector3(-0.35, 0.76, -0.08)
      ];
      const bits = createAttractablePaperBits(0.13, targetPts);
      g.add(bits);

      // شرارات الشحنات الساكنة على سطح البالون
      const sparks = createStaticSparks(0.08, 1.22, 0.38);
      sparks.visible = false;
      g.add(sparks);

      anim.leftPart = balloonGroup;
      anim.rightPart = woolGroup;
      anim.paperBits = bits;
      anim.effectGroup = sparks;
      break;
    }

    case 'rulerWool': {
      // ─── ٣. دلك مسطرة بلاستيكية بالصوف: يد تمسك مسطرة مدرّجة ويد تدلكها بالصوف ───
      createLabTable(g, 0.06);

      // المسطرة البلاستيكية الشفافة مع تدريجات السنتيمتر واليد اليسرى الممسكة بطرفها
      const rulerGroup = new THREE.Group();
      rulerGroup.position.set(0, 0.92, 0);
      rbox(rulerGroup, 2.15, 0.34, 0.045, materials.rulerPlastic, 0, 0, 0, 0.018);
      for (let i = -9; i <= 9; i++) {
        const isMajor = i % 3 === 0;
        const h = isMajor ? 0.11 : 0.06;
        rbox(rulerGroup, 0.014, h, 0.052, materials.rulerInk, i * 0.1, 0.16 - h / 2, 0, 0.002);
      }

      const leftHand = createDetailedHand({ side: 'left', pose: 'grip', sleeveMat: materials.sleeveBlue, scale: 0.76 });
      leftHand.position.set(-1.12, -0.04, 0.05);
      leftHand.rotation.z = -1.45;
      rulerGroup.add(leftHand);
      rulerGroup.rotation.z = -0.08;
      g.add(rulerGroup);

      // قطعة الصوف المحبوكة واليد اليمنى التي تدلك المسطرة ذهاباً وإياباً
      const woolGroup = new THREE.Group();
      woolGroup.position.set(0.22, 1.12, 0.06);
      const woolBundle = createKnittedWoolBundle(materials.woolTeal, materials.woolTealLight);
      woolBundle.scale.set(0.95, 0.78, 0.9);
      woolGroup.add(woolBundle);

      const rightHand = createDetailedHand({ side: 'right', pose: 'press', sleeveMat: materials.sleeveGreen, scale: 0.76 });
      rightHand.position.set(0.32, 0.26, 0.04);
      rightHand.rotation.z = 2.15;
      rightHand.rotation.x = 0.2;
      woolGroup.add(rightHand);
      g.add(woolGroup);

      // قصاصات الورق التي تقفز وتلتصق بأسفل المسطرة بعد الدلك
      const targetPts = [
        new THREE.Vector3(-0.45, 0.74, 0.06),
        new THREE.Vector3(-0.22, 0.72, -0.05),
        new THREE.Vector3(0.0, 0.7, 0.05),
        new THREE.Vector3(0.24, 0.68, -0.04),
        new THREE.Vector3(0.46, 0.66, 0.06),
        new THREE.Vector3(0.64, 0.64, -0.03)
      ];
      const bits = createAttractablePaperBits(0.13, targetPts);
      g.add(bits);

      const sparks = createStaticSparks(0.15, 0.92, 0.14);
      sparks.visible = false;
      g.add(sparks);

      anim.leftPart = rulerGroup;
      anim.rightPart = woolGroup;
      anim.paperBits = bits;
      anim.effectGroup = sparks;
      break;
    }

    case 'combHair': {
      // ─── ٤. دلك مشط بلاستيكي بالصوف: يد تمسك مقبض المشط ويد تدلك أسنانه بالصوف ───
      createLabTable(g, 0.06);

      const combGroup = new THREE.Group();
      combGroup.position.set(0, 0.94, 0);
      // ظهر المشط ومقبضه الانسيابي وأسنانه المتقاربة
      rbox(combGroup, 1.75, 0.14, 0.055, materials.combPlastic, 0.12, 0.15, 0, 0.03);
      rbox(combGroup, 0.52, 0.18, 0.06, materials.combPlastic, -0.82, 0.13, 0, 0.04);
      for (let i = -6; i <= 9; i++) {
        rbox(combGroup, 0.038, 0.28, 0.038, materials.combPlastic, i * 0.095, -0.03, 0, 0.01);
      }

      const leftHand = createDetailedHand({ side: 'left', pose: 'grip', sleeveMat: materials.sleeveBlue, scale: 0.76 });
      leftHand.position.set(-1.12, 0.1, 0.05);
      leftHand.rotation.z = -1.48;
      combGroup.add(leftHand);
      g.add(combGroup);

      const woolGroup = new THREE.Group();
      woolGroup.position.set(0.24, 1.18, 0.06);
      const woolBundle = createKnittedWoolBundle(materials.woolPurple, materials.woolLavender);
      woolBundle.scale.set(0.95, 0.78, 0.9);
      woolGroup.add(woolBundle);

      const rightHand = createDetailedHand({ side: 'right', pose: 'press', sleeveMat: materials.sleeveGreen, scale: 0.76 });
      rightHand.position.set(0.32, 0.26, 0.04);
      rightHand.rotation.z = 2.15;
      rightHand.rotation.x = 0.2;
      woolGroup.add(rightHand);
      g.add(woolGroup);

      const targetPts = [
        new THREE.Vector3(-0.38, 0.71, 0.04),
        new THREE.Vector3(-0.15, 0.71, -0.04),
        new THREE.Vector3(0.08, 0.71, 0.05),
        new THREE.Vector3(0.3, 0.71, -0.04),
        new THREE.Vector3(0.52, 0.71, 0.04),
        new THREE.Vector3(0.72, 0.71, -0.03)
      ];
      const bits = createAttractablePaperBits(0.13, targetPts);
      g.add(bits);

      const sparks = createStaticSparks(0.18, 0.94, 0.14);
      sparks.visible = false;
      g.add(sparks);

      anim.leftPart = combGroup;
      anim.rightPart = woolGroup;
      anim.paperBits = bits;
      anim.effectGroup = sparks;
      break;
    }

    case 'woodFriction':
    default: {
      // ─── ٥. فرك قطعتي خشب معًا: يد تثبت اللوح السفلي ويد تفرك القطعة العلوية لتوليد الحرارة ───
      createLabTable(g, 0.06);

      const bottomWood = new THREE.Group();
      bottomWood.position.set(0, 0.28, 0);
      rbox(bottomWood, 2.05, 0.3, 0.85, materials.woodDark, 0, 0, 0, 0.05);
      // خطوط ألياف الخشب الطبيعية على السطح
      for (const zOff of [-0.24, 0, 0.24]) {
        rbox(bottomWood, 1.9, 0.015, 0.06, materials.woodMedium, 0, 0.152, zOff, 0.005);
      }
      // اليد اليسرى تثبت طرف الخشبة السفلية
      const leftHand = createDetailedHand({ side: 'left', pose: 'press', sleeveMat: materials.sleeveBlue, scale: 0.78 });
      leftHand.position.set(-1.12, 0.18, 0.12);
      leftHand.rotation.z = -1.85;
      leftHand.rotation.y = 0.25;
      bottomWood.add(leftHand);
      g.add(bottomWood);

      // القطعة الخشبية العلوية مع اليد اليمنى التي تفركها بسرعة
      const topWood = new THREE.Group();
      topWood.position.set(0.08, 0.56, 0);
      rbox(topWood, 1.1, 0.28, 0.58, materials.woodLight, 0, 0, 0, 0.05);
      for (const zOff of [-0.14, 0.14]) {
        rbox(topWood, 0.98, 0.015, 0.05, materials.woodMedium, 0, 0.142, zOff, 0.005);
      }
      const rightHand = createDetailedHand({ side: 'right', pose: 'grip', sleeveMat: materials.sleeveGreen, scale: 0.8 });
      rightHand.position.set(0.32, 0.34, 0.08);
      rightHand.rotation.z = 2.1;
      rightHand.rotation.x = 0.18;
      topWood.add(rightHand);
      g.add(topWood);

      // موجات الحرارة وتوهج الاحتكاك بين قطعتي الخشب
      const heat = createWarmthEffect(0.05, 0.55, 0.36, 1.15);
      heat.visible = false;
      g.add(heat);

      anim.leftPart = bottomWood;
      anim.rightPart = topWood;
      anim.effectGroup = heat;
      break;
    }
  }

  return g;
}

function normalizeBounds(object, targetSize = 2.45) {
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const scale = targetSize / maxDim;
  object.scale.multiplyScalar(scale);

  bounds.setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= bounds.min.y;
}

export async function loadFrictionItem(item) {
  const object = createProceduralFrictionModel(item.id);
  normalizeBounds(object);

  const root = new THREE.Group();
  root.add(object);
  root.userData.itemId = item.id;

  const sparkleRing = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 1.35, 32),
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    })
  );
  sparkleRing.rotation.x = -Math.PI / 2;
  sparkleRing.position.y = 0.02;
  root.add(sparkleRing);
  root.userData.sparkleRing = sparkleRing;

  const sharedMaterials = new Set(Object.values(materials));
  root.traverse(node => {
    for (const material of (Array.isArray(node.material) ? node.material : [node.material]).filter(Boolean)) {
      if (!sharedMaterials.has(material)) material.userData.localToModel = true;
    }
  });

  const anim = object.userData.anim;
  const leftBasePos = anim?.leftPart ? anim.leftPart.position.clone() : null;
  const rightBasePos = anim?.rightPart ? anim.rightPart.position.clone() : null;

  root.userData.updateFrictionState = (tested, reduced = false) => {
    if (!anim) return;
    const active = Boolean(tested);
    if (anim.effectGroup) anim.effectGroup.visible = active;
    if (anim.coldGroup) anim.coldGroup.visible = !active;
    if (anim.cheeks?.length) {
      for (const cheek of anim.cheeks) {
        cheek.material = active ? materials.cheekWarm : materials.cheekCold;
      }
    }

    const t = performance.now() * 0.011;
    if (active && !reduced) {
      if (item.id === 'winterHands' && anim.leftPart && anim.rightPart) {
        // الكفّان يتلاصقان ويفركان صعوداً وهبوطاً بسرعة
        anim.leftPart.position.x = leftBasePos.x + 0.022;
        anim.rightPart.position.x = rightBasePos.x - 0.022;
        anim.leftPart.position.y = leftBasePos.y + Math.sin(t * 1.6) * 0.11;
        anim.rightPart.position.y = rightBasePos.y - Math.sin(t * 1.6) * 0.11;
      } else if (item.id === 'balloonWool' && anim.rightPart && rightBasePos) {
        // اليد تدلك سطح البالون بقطعة الصوف المحبوكة
        anim.rightPart.position.y = rightBasePos.y + Math.sin(t * 1.5) * 0.18;
        anim.rightPart.position.x = rightBasePos.x - 0.06 + Math.cos(t * 1.5) * 0.05;
      } else if (anim.rightPart && rightBasePos) {
        // اليد تدلك المسطرة أو المشط أو تفرك قطعة الخشب ذهاباً وإياباً
        anim.rightPart.position.x = rightBasePos.x + Math.sin(t * 1.55) * 0.32;
      }

      // حركة موجات الحرارة أو وميض الشحنات الساكنة
      if (anim.effectGroup?.userData?.waves) {
        anim.effectGroup.userData.waves.forEach(w => {
          w.position.y = w.userData.baseY + Math.sin(t * 1.2 + w.userData.phase) * 0.035;
        });
      }
      if (anim.effectGroup?.userData?.bolts) {
        anim.effectGroup.userData.bolts.forEach(b => {
          const s = 0.8 + 0.35 * Math.abs(Math.sin(t * 1.8 + b.userData.phase));
          b.scale.setScalar(s);
        });
      }

      // انجذاب قصاصات الورق من الطاولة والتصاقها بالبالون أو المسطرة أو المشط
      if (anim.paperBits) {
        anim.paperBits.children.forEach(bit => {
          const target = bit.userData.targetPos;
          bit.position.x = THREE.MathUtils.lerp(bit.position.x, target.x, 0.12);
          bit.position.z = THREE.MathUtils.lerp(bit.position.z, target.z, 0.12);
          bit.position.y = THREE.MathUtils.lerp(bit.position.y, target.y + Math.sin(t * 0.9 + bit.userData.phase) * 0.04, 0.12);
          bit.rotation.x = Math.sin(t * 0.8 + bit.userData.phase) * 0.35;
        });
      }
    } else {
      if (anim.leftPart && leftBasePos) anim.leftPart.position.copy(leftBasePos);
      if (anim.rightPart && rightBasePos) anim.rightPart.position.copy(rightBasePos);
      if (anim.paperBits) {
        anim.paperBits.children.forEach(bit => {
          if (active) {
            bit.position.copy(bit.userData.targetPos);
          } else {
            bit.position.copy(bit.userData.basePos);
            bit.rotation.x = 0;
          }
        });
      }
    }
  };

  return root;
}
