// ═══════════════════════════════════════════════════════════════════════════
// src/safety/models.js — المجسمات ثلاثية الأبعاد الواقعية والمعبرة لمحطة السلامة
// للصف الرابع الأساسي · كائنات بشرية (أيدي، أطفال)، أدوات واقعية، شرارات مائية وكهربائية
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ─── كاش الخامات الفيزيائية الواقعية PBR ───
const materials = {
  // بشرة اليد والوجه (درجة دافئة واقعية)
  skin: new THREE.MeshStandardMaterial({ color: 0xf5c9a4, roughness: 0.55, metalness: 0.05 }),
  skinWet: new THREE.MeshStandardMaterial({ color: 0xf2be96, roughness: 0.15, metalness: 0.1 }),
  childSkin: new THREE.MeshStandardMaterial({ color: 0xfcd3a7, roughness: 0.5, metalness: 0.05 }),
  childHair: new THREE.MeshStandardMaterial({ color: 0x4a3321, roughness: 0.85, metalness: 0.0 }),
  childShirt: new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.7, metalness: 0.0 }),
  childPants: new THREE.MeshStandardMaterial({ color: 0xd69e2e, roughness: 0.8, metalness: 0.0 }),

  // مقابس وقوابس الجدار
  socketFrame: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.05 }),
  socketInner: new THREE.MeshStandardMaterial({ color: 0xf7fafc, roughness: 0.35, metalness: 0.05 }),
  socketHoles: new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.8, metalness: 0.1 }),
  plugBodyDark: new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.3, metalness: 0.15 }),
  plugBodySafe: new THREE.MeshStandardMaterial({ color: 0x22543d, roughness: 0.3, metalness: 0.1 }),
  brassProngs: new THREE.MeshStandardMaterial({ color: 0xd69e2e, roughness: 0.2, metalness: 0.85 }),

  // أسلاك وموصلات
  cordWhite: new THREE.MeshStandardMaterial({ color: 0xf7fafc, roughness: 0.45, metalness: 0.0 }),
  cordBlue: new THREE.MeshStandardMaterial({ color: 0x3182ce, roughness: 0.4, metalness: 0.0 }),
  cordBlack: new THREE.MeshStandardMaterial({ color: 0x171923, roughness: 0.45, metalness: 0.05 }),
  copperWire: new THREE.MeshStandardMaterial({ color: 0xdd6b20, roughness: 0.18, metalness: 0.9 }),
  wireBlueInner: new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.4 }),
  wireBrownInner: new THREE.MeshStandardMaterial({ color: 0x7b341e, roughness: 0.4 }),
  wireGreenInner: new THREE.MeshStandardMaterial({ color: 0x276749, roughness: 0.4 }),

  // أدوات ومقصات ومعادن
  chromeSteel: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.12, metalness: 0.95 }),
  scissorsHandle: new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.25, metalness: 0.1 }),
  ironSole: new THREE.MeshStandardMaterial({ color: 0xcbd5e0, roughness: 0.15, metalness: 0.9 }),
  ironBody: new THREE.MeshStandardMaterial({ color: 0x742a2a, roughness: 0.3, metalness: 0.2 }),
  tapeBlack: new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.55, metalness: 0.0 }),

  // ماء وسوائل وشفافية
  waterDrop: new THREE.MeshPhysicalMaterial({
    color: 0x90cdf4,
    transmission: 0.88,
    opacity: 1,
    transparent: true,
    roughness: 0.04,
    ior: 1.33
  }),
  waterBathtub: new THREE.MeshPhysicalMaterial({
    color: 0x63b3ed,
    transmission: 0.85,
    opacity: 0.95,
    transparent: true,
    roughness: 0.08,
    ior: 1.33
  }),

  // شرارات كهربائية وتوهجات خطر/أمان
  electricSpark: new THREE.MeshBasicMaterial({ color: 0xfff066 }),
  sparkCore: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  hazardRed: new THREE.MeshStandardMaterial({ color: 0xe53e3e, roughness: 0.3, metalness: 0.1 }),
  safeGreen: new THREE.MeshStandardMaterial({ color: 0x38a169, roughness: 0.3, metalness: 0.1 }),
  woodPlank: new THREE.MeshStandardMaterial({ color: 0xb7791f, roughness: 0.75, metalness: 0.0 }),
  carpetPattern: new THREE.MeshStandardMaterial({ color: 0x9b2c2c, roughness: 0.85, metalness: 0.0 })
};

// ─── دوال هندسية أساسية ───
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

function cyl(p, rTop, rBot, h, m, x = 0, y = 0, z = 0, seg = 20) {
  return mesh(p, new THREE.CylinderGeometry(rTop, rBot, h, seg), m, x, y, z);
}

function sphere(p, r, m, x = 0, y = 0, z = 0) {
  return mesh(p, new THREE.SphereGeometry(r, 18, 14), m, x, y, z);
}

// ─── شارة ثلاثية الأبعاد متحركة توضح معنى الموقف فورياً ───
function createStatusBadge(isSafe, labelText = '') {
  const badgeGroup = new THREE.Group();
  badgeGroup.position.set(0, 2.1, 0);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = isSafe ? '#22543d' : '#9b2c2c';
  ctx.beginPath();
  ctx.roundRect(10, 10, 492, 120, 24);
  ctx.fill();

  ctx.strokeStyle = isSafe ? '#68d391' : '#fc8181';
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px Tajawal, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = labelText || (isSafe ? '🛡️ سلوك آمن وسليم' : '⚡ خطر صعق كهربائي!');
  ctx.fillText(text, 256, 70);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.52),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
  );
  badgeGroup.add(plane);

  return badgeGroup;
}

// ─── مقبس جداري واقعي ومفصل ───
function createDetailedSocket(parent, x = 0, y = 0.8, z = 0, hasCover = false) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  // إطار الجدار الخلفي
  rbox(g, 1.6, 1.6, 0.14, materials.socketFrame, 0, 0, 0, 0.08);
  // وجه المقبس الأوسط
  rbox(g, 1.3, 1.3, 0.18, materials.socketInner, 0, 0, 0.04, 0.06);

  if (hasCover) {
    // غطاء أمان واقٍ للأطفال يغلق الثقوب
    cyl(g, 0.45, 0.45, 0.14, materials.safeGreen, 0, 0, 0.18);
    sphere(g, 0.12, materials.chromeSteel, 0, 0, 0.26);
    rbox(g, 0.6, 0.14, 0.12, materials.safeGreen, 0, 0, 0.22, 0.04);
  } else {
    // تجويف المقبس الدائري
    cyl(g, 0.46, 0.46, 0.12, materials.socketInner, 0, 0, 0.14);
    // ثقوب التوصيل السوداء
    cyl(g, 0.05, 0.05, 0.18, materials.slotDark || materials.socketHoles, -0.22, 0, 0.16);
    cyl(g, 0.05, 0.05, 0.18, materials.slotDark || materials.socketHoles, 0.22, 0, 0.16);
    // برغي التثبيت الأوسط
    sphere(g, 0.035, materials.chromeSteel, 0, 0, 0.2);
  }

  parent.add(g);
  return g;
}

// ─── يد بشرية واقعية مع أصابع ومفاصل ───
function createHumanHand({
  isWet = false,
  holdingType = 'reaching', // reaching | gripping_plug | pulling_cord | holding_scissors | pressing_switch
  scale = 1.0
} = {}) {
  const hand = new THREE.Group();
  const skinMat = isWet ? materials.skinWet : materials.skin;

  // الساعد
  const arm = cyl(hand, 0.22, 0.28, 1.2, skinMat, 0, -0.6, 0);
  arm.rotation.z = 0.1;

  // المعصم
  sphere(hand, 0.22, skinMat, 0, 0, 0);

  // راحة الكف
  const palm = rbox(hand, 0.48, 0.44, 0.22, skinMat, 0, 0.24, 0, 0.06);

  // أصابع اليد الأربعة (السبابة، الوسطى، البنصر، الخنصر)
  const fingerOffsets = [-0.16, -0.05, 0.06, 0.17];
  const fingerLengths = [0.36, 0.42, 0.38, 0.3];

  fingerOffsets.forEach((xOff, i) => {
    const fLen = fingerLengths[i];
    const fingerGroup = new THREE.Group();
    fingerGroup.position.set(xOff, 0.46, 0);

    // المفصل الأول
    cyl(fingerGroup, 0.045, 0.05, fLen * 0.55, skinMat, 0, fLen * 0.27, 0);
    // المفصل الثاني
    const joint2 = new THREE.Group();
    joint2.position.set(0, fLen * 0.55, 0);
    if (holdingType === 'gripping_plug' || holdingType === 'pulling_cord') {
      joint2.rotation.x = -0.7; // انحناء للإمساك
    } else if (holdingType === 'reaching') {
      joint2.rotation.x = -0.15; // تمدد للمس
    }
    cyl(joint2, 0.038, 0.045, fLen * 0.5, skinMat, 0, fLen * 0.25, 0);
    fingerGroup.add(joint2);

    if (isWet) {
      // قطرات ماء تلمع وتسيل من أطراف الأصابع
      sphere(fingerGroup, 0.065, materials.waterDrop, 0, fLen * 1.05, 0.04);
      sphere(fingerGroup, 0.045, materials.waterDrop, 0, fLen * 0.5, 0.06);
    }

    hand.add(fingerGroup);
  });

  // الإبهام
  const thumb = new THREE.Group();
  thumb.position.set(-0.25, 0.12, 0.06);
  thumb.rotation.z = 0.55;
  thumb.rotation.y = -0.3;
  cyl(thumb, 0.05, 0.055, 0.38, skinMat, 0, 0.19, 0);
  if (isWet) sphere(thumb, 0.06, materials.waterDrop, 0, 0.4, 0);
  hand.add(thumb);

  if (isWet) {
    // قطرات ماء متساقطة في الهواء من اليد
    sphere(hand, 0.11, materials.waterDrop, 0.08, 0.85, 0.15);
    sphere(hand, 0.14, materials.waterDrop, -0.05, 0.72, 0.22);
    sphere(hand, 0.09, materials.waterDrop, 0.18, 0.55, 0.2);
    sphere(hand, 0.12, materials.waterDrop, -0.12, 0.35, 0.25);
  }

  hand.scale.setScalar(scale);
  return hand;
}

// ─── مجسم طفل واقعي وظريف يلعب بالأجهزة ───
function createChildFigure({ action = 'playing_cords' } = {}) {
  const child = new THREE.Group();

  // رأس الطفل
  const head = sphere(child, 0.34, materials.childSkin, 0, 1.15, 0);
  // شعر الطفل
  const hair = sphere(child, 0.36, materials.childHair, 0, 1.25, -0.04);
  hair.scale.set(1.02, 0.8, 1.02);

  // عيون الطفل
  sphere(child, 0.045, materials.slotDark || materials.socketHoles, -0.11, 1.18, 0.31);
  sphere(child, 0.045, materials.slotDark || materials.socketHoles, 0.11, 1.18, 0.31);

  // جذع الطفل (قميص أزرق لطيف)
  const torso = cyl(child, 0.26, 0.32, 0.65, materials.childShirt, 0, 0.65, 0);

  // ساقان جالستان على الأرض
  const legL = cyl(child, 0.11, 0.1, 0.55, materials.childPants, -0.22, 0.16, 0.2);
  legL.rotation.x = Math.PI / 2;
  const legR = cyl(child, 0.11, 0.1, 0.55, materials.childPants, 0.22, 0.16, 0.2);
  legR.rotation.x = Math.PI / 2;

  // حذاءان
  sphere(child, 0.12, materials.hazardRed, -0.22, 0.14, 0.5);
  sphere(child, 0.12, materials.hazardRed, 0.22, 0.14, 0.5);

  // ذراعان تمتدان وتشدان السلك
  const armL = cyl(child, 0.08, 0.07, 0.5, materials.childShirt, -0.32, 0.72, 0.22);
  armL.rotation.x = 1.1;
  armL.rotation.z = -0.3;
  sphere(child, 0.08, materials.childSkin, -0.32, 0.52, 0.44); // يد يسرى

  const armR = cyl(child, 0.08, 0.07, 0.5, materials.childShirt, 0.32, 0.72, 0.22);
  armR.rotation.x = 1.1;
  armR.rotation.z = 0.3;
  sphere(child, 0.08, materials.childSkin, 0.32, 0.52, 0.44); // يد يمنى

  return child;
}

// ─── صاعقة كهربائية ساطعة وشرارات متطايرة ───
function createLightningSparks(x = 0, y = 0, z = 0, scale = 1.0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  // قوس تفريغ كهربائي متعرج
  const points = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.15, 0.2, 0.05),
    new THREE.Vector3(0.12, 0.38, -0.05),
    new THREE.Vector3(-0.08, 0.55, 0.08),
    new THREE.Vector3(0.18, 0.72, 0)
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const geom = new THREE.TubeGeometry(curve, 16, 0.035 * scale, 6, false);
  mesh(g, geom, materials.electricSpark);

  // شرارات متطايرة حول القوس
  sphere(g, 0.08 * scale, materials.sparkCore, -0.15, 0.2, 0.05);
  sphere(g, 0.09 * scale, materials.electricSpark, 0.12, 0.38, -0.05);
  sphere(g, 0.07 * scale, materials.sparkCore, -0.08, 0.55, 0.08);

  return g;
}

// ─── مصنع المجسمات ثلاثية الأبعاد الواقعية لكل سلوك ───
function createProceduralModel(id) {
  const g = new THREE.Group();

  switch (id) {
    // 1. لمس القابس بيد مبللة بالماء
    case 'wet_hands_plug': {
      g.add(createStatusBadge(false, '⚡ ماء + كهرباء = خطر الصعق!'));
      createDetailedSocket(g, -0.6, 0.95, 0);

      // قابس كهربائي في المقبس
      rbox(g, 0.5, 0.55, 0.55, materials.plugBodyDark, -0.6, 0.95, 0.35, 0.08);
      cyl(g, 0.045, 0.045, 1.2, materials.cordBlack, -0.6, 0.4, 0.45);

      // يد بشرية مبللة بالماء تقترب مباشرة لتلمس القابس
      const hand = createHumanHand({ isWet: true, holdingType: 'reaching', scale: 0.95 });
      hand.position.set(0.65, 0.7, 0.35);
      hand.rotation.z = -1.25;
      hand.rotation.y = -0.4;
      g.add(hand);

      // صاعقة كهربائية ساطعة بين أصابع اليد المبللة والمقبس
      g.add(createLightningSparks(-0.25, 0.9, 0.35, 1.1));
      break;
    }

    // 2. إدخال مقص أو أدوات معدنية في المقبس
    case 'inserting_scissors_socket': {
      g.add(createStatusBadge(false, '⚡ معدن في المقبس = صعق مميت!'));
      createDetailedSocket(g, 0, 0.9, 0);

      // مقص معدني دقيق
      const scissors = new THREE.Group();
      // شفرتان من الصلب اللامع تنغرز إحداهما في ثقب المقبس
      rbox(scissors, 0.06, 1.2, 0.14, materials.chromeSteel, 0, 0.4, 0);
      rbox(scissors, 0.06, 1.2, 0.14, materials.chromeSteel, 0.04, 0.4, 0.02);
      // حلقات المقبض البلاستيكي الأزرق
      mesh(scissors, new THREE.TorusGeometry(0.24, 0.065, 12, 28), materials.scissorsHandle, -0.16, -0.32, 0);
      mesh(scissors, new THREE.TorusGeometry(0.24, 0.065, 12, 28), materials.scissorsHandle, 0.22, -0.32, 0);

      // زاوية إدخال المقص في المقبس
      scissors.position.set(0.22, 0.75, 0.35);
      scissors.rotation.z = -0.45;
      scissors.rotation.y = 0.25;
      g.add(scissors);

      // يد بشرية تمسك بمقبض المقص
      const hand = createHumanHand({ isWet: false, holdingType: 'holding_scissors', scale: 0.9 });
      hand.position.set(0.75, 0.35, 0.45);
      hand.rotation.z = -0.8;
      g.add(hand);

      // صاعقة كهربائية مشتعلة عند نقطة التلامس بين طرف المقص وثقب المقبس
      g.add(createLightningSparks(0.08, 0.85, 0.2, 1.2));
      break;
    }

    // 3. عبث الأطفال بالأسلاك والتوصيلات
    case 'kids_playing_cords': {
      g.add(createStatusBadge(false, '⚠️ عبث الأطفال بالأسلاك = خطر!'));
      // مقبس جداري منخفض
      createDetailedSocket(g, -1.1, 0.6, -0.4);

      // مشترك كهربائي أرضي
      const strip = new THREE.Group();
      strip.position.set(0.1, 0.1, 0.3);
      rbox(strip, 1.8, 0.22, 0.6, materials.socketFrame, 0, 0, 0);
      cyl(strip, 0.18, 0.18, 0.1, materials.socketHoles, -0.5, 0.12, 0);
      cyl(strip, 0.18, 0.18, 0.1, materials.socketHoles, 0, 0.12, 0);
      cyl(strip, 0.18, 0.18, 0.1, materials.socketHoles, 0.5, 0.12, 0);
      g.add(strip);

      // سلك ممتد بين المقبس والمشترك
      cyl(g, 0.045, 0.045, 1.5, materials.cordWhite, -0.5, 0.3, 0);

      // طفل حقيقي ثلاثي الأبعاد جالس على الأرض يشد الأسلاك
      const child = createChildFigure({ action: 'playing_cords' });
      child.position.set(0.5, 0, 0.2);
      child.rotation.y = -0.6;
      g.add(child);

      // علامة تحذير وشرارة بالقرب من يد الطفل
      g.add(createLightningSparks(0.35, 0.55, 0.45, 0.9));
      break;
    }

    // 4. عض سلك الشاحن أو وضعه في الفم
    case 'baby_biting_cord': {
      g.add(createStatusBadge(false, '⚡ لعاب الفم يوصل الكهرباء!'));
      // مقبس جداري مع شاحن هاتف
      createDetailedSocket(g, -0.8, 1.1, -0.2);
      rbox(g, 0.45, 0.6, 0.45, materials.plugBodyDark, -0.8, 1.1, 0.15);

      // طفل جالس يرفع سلك الشاحن الأبيض نحو فمه
      const baby = createChildFigure();
      baby.position.set(0.2, 0, 0.2);
      baby.rotation.y = -0.3;
      g.add(baby);

      // كابل الشاحن يمتد من الشاحن إلى فم الطفل
      const cord = cyl(g, 0.035, 0.035, 1.6, materials.cordWhite, -0.3, 0.7, 0.15);
      cord.rotation.z = -0.8;

      // وميض خطر عند فم الطفل
      sphere(g, 0.14, materials.electricSpark, 0.2, 1.1, 0.35);
      sphere(g, 0.2, materials.hazardRed, 0.2, 1.1, 0.35);
      break;
    }

    // 5. تحميل المقبس بأجهزة وشواحن كثيرة
    case 'overloaded_socket': {
      g.add(createStatusBadge(false, '⚠️ أحمال زائدة تسبب اشتعال الحرائق!'));
      // مشترك كهربائي على الطاولة
      rbox(g, 2.4, 0.3, 0.8, materials.socketFrame, 0, 0.15, 0, 0.06);
      rbox(g, 0.2, 0.14, 0.25, materials.hazardRed, -0.9, 0.25, 0); // زر التشغيل المتوهج

      // 4 شواحن ومحولات متكدسة ومائلة فوق بعضها
      rbox(g, 0.45, 0.85, 0.55, materials.plugBodyDark, -0.45, 0.65, 0);
      rbox(g, 0.55, 1.05, 0.65, materials.cordBlack, 0.25, 0.75, -0.05);

      // محول إضافي متراكب مائل بشكل خطير
      const tiltedAdapter = new THREE.Group();
      rbox(tiltedAdapter, 0.5, 0.8, 0.5, materials.plugBodyDark, 0, 0.4, 0);
      tiltedAdapter.position.set(0.85, 0.3, 0.1);
      tiltedAdapter.rotation.z = 0.35;
      tiltedAdapter.rotation.x = 0.2;
      g.add(tiltedAdapter);

      // محول رابع بزاوية أخرى
      const adapter4 = new THREE.Group();
      rbox(adapter4, 0.4, 0.7, 0.45, materials.plugBodyDark, 0, 0.35, 0);
      adapter4.position.set(-0.45, 1.1, 0.05);
      adapter4.rotation.y = 0.5;
      g.add(adapter4);

      // أسلاك سوداء متشابكة تخرج من المحولات
      cyl(g, 0.035, 0.035, 1.2, materials.cordBlack, 0.3, 1.1, 0.4);
      cyl(g, 0.035, 0.035, 1.0, materials.cordWhite, -0.3, 0.9, -0.3);

      // شرارات حرارة وحمل زائد متوهجة
      sphere(g, 0.18, materials.electricSpark, 0.1, 1.35, 0.1);
      sphere(g, 0.14, materials.hazardRed, -0.15, 1.2, 0.15);
      break;
    }

    // 6. استخدام أسلاك معراة وتالفة
    case 'exposed_damaged_wire': {
      g.add(createStatusBadge(false, '⚡ سلك معرى = تيار مكشوف وصعق!'));
      // سلك أزرق سميك به تمزق كبير في المنتصف
      cyl(g, 0.15, 0.15, 1.0, materials.cordBlue, -0.85, 0.7, 0);
      cyl(g, 0.15, 0.15, 1.0, materials.cordBlue, 0.85, 0.7, 0);

      // الأسلاك الداخلية المعزولة المكشوفة (بني، أزرق، أرضي)
      cyl(g, 0.05, 0.05, 0.8, materials.wireBrownInner, -0.1, 0.78, 0.05);
      cyl(g, 0.05, 0.05, 0.8, materials.wireBlueInner, 0.1, 0.78, -0.05);

      // الشعيرات النحاسية المقطوعة والمشرذمة في الهواء
      cyl(g, 0.035, 0.035, 0.9, materials.copperWire, -0.05, 0.65, 0.08);
      cyl(g, 0.035, 0.035, 0.9, materials.copperWire, 0.06, 0.65, -0.07);
      cyl(g, 0.03, 0.03, 0.85, materials.copperWire, 0.0, 0.7, 0.12);

      // صواعق شرر كهربائي نشطة تخرج من النحاس
      g.add(createLightningSparks(0, 0.7, 0.1, 1.2));
      break;
    }

    // 7. سحب السلك بقوة وعنف لنزعه من الجدار
    case 'pulling_cord_violently': {
      g.add(createStatusBadge(false, '⚠️ شد السلك يمزقه ويسبب الصعق!'));
      createDetailedSocket(g, -0.9, 0.85, 0);
      // القابس ما زال عالقاً في المقبس
      rbox(g, 0.5, 0.55, 0.5, materials.plugBodyDark, -0.9, 0.85, 0.3, 0.08);

      // السلك مشدود بقوة أفقية عنيفة بزاوية حادة
      const cord = cyl(g, 0.065, 0.065, 1.8, materials.cordBlack, 0.1, 0.85, 0.3);
      cord.rotation.z = Math.PI / 2;

      // نقطة تمزق وتشقق واضحة عند رقبة القابس تكشف النحاس
      sphere(g, 0.16, materials.copperWire, -0.6, 0.85, 0.3);
      sphere(g, 0.18, materials.hazardRed, -0.6, 0.85, 0.3);

      // يد بشرية تشد السلك بعنف من مسافة بعيدة
      const pullingHand = createHumanHand({ isWet: false, holdingType: 'pulling_cord', scale: 0.95 });
      pullingHand.position.set(0.95, 0.85, 0.3);
      pullingHand.rotation.z = -1.57;
      g.add(pullingHand);
      break;
    }

    // 8. استخدام مجفف الشعر والأجهزة قرب حوض الماء
    case 'appliance_near_bathtub': {
      g.add(createStatusBadge(false, '⚡ أجهزة كهربائية قرب الماء = خطر مميت!'));
      // حوض استحمام سيراميك أبيض مع ماء
      rbox(g, 1.8, 0.7, 1.8, materials.socketFrame, -0.3, 0.35, 0, 0.12);
      rbox(g, 1.5, 0.1, 1.5, materials.waterBathtub, -0.3, 0.65, 0);

      // مجفف شعر واقعي بمقبض وفوهة موضوع على الحافة المبللة
      const dryer = new THREE.Group();
      cyl(dryer, 0.22, 0.18, 0.85, materials.hazardRed, 0, 0.42, 0); // جسم المجفف
      rbox(dryer, 0.14, 0.55, 0.16, materials.plugBodyDark, 0, 0, 0, 0.04); // مقبض اليد
      cyl(dryer, 0.04, 0.04, 1.2, materials.cordBlack, 0, -0.4, 0.1); // سلك المجفف يتدلى نحو الماء

      dryer.position.set(0.65, 0.75, 0.3);
      dryer.rotation.z = 0.55;
      dryer.rotation.y = 0.2;
      g.add(dryer);

      // قطرات ماء وشرارات صاعقة تحذيرية
      sphere(g, 0.15, materials.electricSpark, 0.4, 0.75, 0.4);
      break;
    }

    // 9. تمرير الأسلاك الكهربائية تحت السجاد
    case 'cord_under_carpet': {
      g.add(createStatusBadge(false, '⚠️ الأسلاك تحت السجاد تسبب الحرائق!'));
      // أرضية خشبية
      rbox(g, 2.6, 0.1, 1.9, materials.woodPlank, 0, 0.05, 0);

      // سجادة منسوجة بنمط بارز
      rbox(g, 2.0, 0.08, 1.5, materials.carpetPattern, 0, 0.14, 0, 0.02);

      // انتفاخ وبروز واضح للسلك السميك المار تحت السجاد
      const bump = cyl(g, 0.08, 0.08, 2.1, materials.carpetPattern, 0, 0.2, 0);
      bump.rotation.x = Math.PI / 2;

      // سلك أزرق يبرز من حافة السجادة
      cyl(g, 0.065, 0.065, 0.6, materials.cordBlue, 0, 0.16, 0.95);

      // لهب وشرر تحذيري يوضح انحباس الحرارة
      sphere(g, 0.18, materials.hazardRed, 0, 0.4, 0);
      sphere(g, 0.14, materials.electricSpark, 0, 0.55, 0);
      break;
    }

    // 10. نزع القابس بمسك الرأس البلاستيكي العازل بلطف (سلوك آمن)
    case 'pulling_by_plug_head': {
      g.add(createStatusBadge(true, '🛡️ سلوك آمن: نمسك بالبلاستيك العازل'));
      createDetailedSocket(g, -0.6, 0.85, 0);

      // رأس القابس البلاستيكي الأخضر الآمن
      rbox(g, 0.55, 0.65, 0.55, materials.plugBodySafe, -0.6, 0.85, 0.35, 0.08);
      // شوكات القابس النحاسية بارزة قليلاً أثناء النزع السليم
      cyl(g, 0.045, 0.045, 0.25, materials.brassProngs, -0.6, 0.85, 0.05);

      // سلك التوصيل متصل دون أي شد
      cyl(g, 0.05, 0.05, 1.4, materials.cordWhite, 0.2, 0.85, 0.35);

      // يد بشرية تمسك برأس القابس البلاستيكي بإتقان وأمان
      const hand = createHumanHand({ isWet: false, holdingType: 'gripping_plug', scale: 0.95 });
      hand.position.set(-0.25, 0.85, 0.35);
      hand.rotation.z = -1.57;
      g.add(hand);

      // درع أمان أخضر متوهج
      sphere(g, 0.25, materials.safeGreen, 0.3, 1.4, 0.2);
      break;
    }

    // 11. تجفيف اليدين تماماً قبل لمس المفاتيح (سلوك آمن)
    case 'dry_hands_switch': {
      g.add(createStatusBadge(true, '🛡️ يد جافة تماماً = أمان تام'));
      // مفتاح إنارة جداري أنيق
      rbox(g, 1.4, 1.5, 0.14, materials.socketFrame, 0.3, 0.85, 0, 0.08);
      rbox(g, 0.55, 0.8, 0.2, materials.socketInner, 0.3, 0.85, 0.06, 0.04);
      // زر التبديل المائل
      rbox(g, 0.45, 0.35, 0.24, materials.safeGreen, 0.3, 0.95, 0.08, 0.02);

      // منشفة قطنية نظيفة وجافة تدل على التجفيف
      const towel = cyl(g, 0.28, 0.28, 1.3, materials.cordWhite, -0.65, 0.75, 0.2, 24);
      towel.rotation.z = 0.25;

      // يد بشرية جافة تمد إصبعها للضغط بأمان
      const hand = createHumanHand({ isWet: false, holdingType: 'reaching', scale: 0.95 });
      hand.position.set(0.9, 0.65, 0.3);
      hand.rotation.z = -1.1;
      g.add(hand);
      break;
    }

    // 12. تركيب أغطية الحماية البلاستيكية على المقابس (سلوك آمن)
    case 'childproof_socket_cover': {
      g.add(createStatusBadge(true, '🛡️ غطاء واقٍ يحمي الأطفال من الصعق'));
      // مقبس محمي بغطاء أمان دائري مغلق
      createDetailedSocket(g, 0, 0.85, 0, true);

      // يد طفل تحاول اللمس فتصطدم بالغطاء البلاستيكي العازل الآمن
      const childHand = createHumanHand({ isWet: false, holdingType: 'reaching', scale: 0.75 });
      childHand.position.set(0.55, 0.65, 0.4);
      childHand.rotation.z = -1.2;
      g.add(childHand);

      // درع أمان أخضر كبير
      sphere(g, 0.28, materials.safeGreen, 0, 1.5, 0.2);
      break;
    }

    // 13. فصل الأجهزة الكهربائية فور الانتهاء منها (سلوك آمن)
    case 'unplug_idle_appliances': {
      g.add(createStatusBadge(true, '🛡️ فصل الأجهزة يمنع الحرائق والماس'));
      // مكواة ملابس مستقرة ومفصولة
      const iron = new THREE.Group();
      iron.position.set(-0.35, 0.3, 0);

      // قاعدة المكواة الفولاذية
      rbox(iron, 1.3, 0.18, 0.75, materials.ironSole, 0, 0.09, 0, 0.04);
      // جسم المكواة الأحمر
      rbox(iron, 1.0, 0.45, 0.65, materials.ironBody, -0.05, 0.35, 0, 0.08);
      // مقبض المكواة
      const handle = cyl(iron, 0.09, 0.09, 0.9, materials.plugBodyDark, -0.05, 0.7, 0);
      handle.rotation.z = Math.PI / 2;
      g.add(iron);

      // رأس القابس مفصول تماماً ومستريح على الطاولة
      rbox(g, 0.45, 0.45, 0.45, materials.safeGreen, 0.75, 0.25, 0.3, 0.06);
      cyl(g, 0.045, 0.045, 0.2, materials.brassProngs, 0.75, 0.25, 0.55);
      cyl(g, 0.045, 0.045, 1.1, materials.cordWhite, 0.25, 0.25, 0.15);
      break;
    }

    // 14. عزل الأسلاك بشريط لاصق عازل (سلوك آمن)
    case 'insulating_tape_repair': {
      g.add(createStatusBadge(true, '🛡️ الشريط العازل يحجب النحاس ويحمينا'));
      // سلك أزرق تم إصلاحه ولفه بطبقات شريط عازل أسود متقنة
      cyl(g, 0.13, 0.13, 2.0, materials.cordBlue, 0, 0.75, 0);
      // طبقات الشريط اللاصق العازل السوداء السميكة في المنتصف
      cyl(g, 0.18, 0.18, 0.75, materials.tapeBlack, 0, 0.75, 0);

      // بكرة الشريط اللاصق العازل مستقرة بجانب السلك
      const tapeRoll = new THREE.Group();
      tapeRoll.position.set(0.75, 0.35, 0.25);
      tapeRoll.rotation.x = Math.PI / 2;
      mesh(tapeRoll, new THREE.CylinderGeometry(0.42, 0.42, 0.22, 28), materials.tapeBlack);
      mesh(tapeRoll, new THREE.CylinderGeometry(0.22, 0.22, 0.24, 24), materials.socketInner);
      g.add(tapeRoll);

      // درع أمان أخضر متوهج
      sphere(g, 0.25, materials.safeGreen, 0, 1.5, 0.1);
      break;
    }

    default: {
      createDetailedSocket(g, 0, 0.85, 0);
      break;
    }
  }

  return g;
}

// ─── مواءمة وتوسيط أبعاد المجسم بدقة ───
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

// ─── تصدير دالة تحميل وتهيئة الموقف ───
export async function loadSafetyItem(item) {
  const object = createProceduralModel(item.id);
  normalizeBounds(object);

  const root = new THREE.Group();
  root.add(object);
  root.userData.itemId = item.id;

  // حلقة هالة سفلية تتوهج عند التصنيف
  const sparkleRing = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1.4, 32),
    new THREE.MeshBasicMaterial({
      color: item.category === 'safe' ? 0x38a169 : 0xe53e3e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    })
  );
  sparkleRing.rotation.x = -Math.PI / 2;
  sparkleRing.position.y = 0.02;
  root.add(sparkleRing);
  root.userData.sparkleRing = sparkleRing;

  let celebrateTime = 0;
  root.userData.triggerCelebration = () => {
    celebrateTime = 1.6;
  };

  // حركة تنفس ودوران ناعمة وهادئة للمجسم
  root.userData.animate = (dt, isRotating = true, reducedMotion = false) => {
    if (reducedMotion) return;

    if (celebrateTime > 0) {
      celebrateTime -= dt;
      const progress = 1 - celebrateTime / 1.6;
      object.position.y = Math.sin(progress * Math.PI) * 0.35;
      object.rotation.y += dt * 5.0;
      sparkleRing.material.opacity = Math.sin(progress * Math.PI) * 0.85;
      sparkleRing.scale.setScalar(1 + progress * 0.4);
    } else {
      sparkleRing.material.opacity = 0;
      if (isRotating) {
        object.rotation.y += dt * 0.45;
        object.position.y = Math.sin(Date.now() * 0.002) * 0.03;
      }
    }
  };

  return root;
}
