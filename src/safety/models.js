// ═══════════════════════════════════════════════════════════════════════════
// src/safety/models.js — المجسمات ثلاثية الأبعاد الواقعية والمعبرة لمحطة السلامة
// للصف الرابع الأساسي · كائنات واقعية متناسقة، مترابطة، وبشرية (أيدي، أطفال، أجهزة حقيقية)
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ─── كاش الخامات الفيزيائية الواقعية PBR ───
const materials = {
  // بشرة اليد والوجه (درجة دافئة طبيعية)
  skin: new THREE.MeshStandardMaterial({ color: 0xf5c9a4, roughness: 0.55, metalness: 0.05 }),
  skinWet: new THREE.MeshStandardMaterial({
    color: 0xf2be96,
    roughness: 0.12,
    metalness: 0.1,
    envMapIntensity: 1.5
  }),
  childSkin: new THREE.MeshStandardMaterial({ color: 0xfcd3a7, roughness: 0.5, metalness: 0.05 }),
  childHair: new THREE.MeshStandardMaterial({ color: 0x4a3321, roughness: 0.85, metalness: 0.0 }),
  childShirt: new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.7, metalness: 0.0 }),
  childPants: new THREE.MeshStandardMaterial({ color: 0xd69e2e, roughness: 0.8, metalness: 0.0 }),

  // مقابس وقوابس الجدار
  wallBackdrop: new THREE.MeshStandardMaterial({ color: 0xedf2f7, roughness: 0.85, metalness: 0.02 }),
  floorWood: new THREE.MeshStandardMaterial({ color: 0xc68a4c, roughness: 0.65, metalness: 0.05 }),
  socketFrame: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.22, metalness: 0.05 }),
  socketInner: new THREE.MeshStandardMaterial({ color: 0xf7fafc, roughness: 0.35, metalness: 0.05 }),
  socketHoles: new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.9, metalness: 0.05 }),
  plugBodyDark: new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.35, metalness: 0.1 }),
  plugBodyWhite: new THREE.MeshStandardMaterial({ color: 0xf7fafc, roughness: 0.25, metalness: 0.05 }),
  plugBodySafe: new THREE.MeshStandardMaterial({ color: 0x276749, roughness: 0.3, metalness: 0.1 }),
  brassProngs: new THREE.MeshStandardMaterial({ color: 0xd69e2e, roughness: 0.2, metalness: 0.85 }),

  // أسلاك وموصلات
  cordWhite: new THREE.MeshStandardMaterial({ color: 0xf7fafc, roughness: 0.45, metalness: 0.0 }),
  cordBlue: new THREE.MeshStandardMaterial({ color: 0x3182ce, roughness: 0.4, metalness: 0.0 }),
  cordBlack: new THREE.MeshStandardMaterial({ color: 0x171923, roughness: 0.45, metalness: 0.05 }),
  copperWire: new THREE.MeshStandardMaterial({ color: 0xdd6b20, roughness: 0.18, metalness: 0.92 }),
  wireBlueInner: new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.4 }),
  wireBrownInner: new THREE.MeshStandardMaterial({ color: 0x7b341e, roughness: 0.4 }),

  // أدوات ومقصات ومعادن وأجهزة
  chromeSteel: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.12, metalness: 0.95 }),
  scissorsHandle: new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.25, metalness: 0.1 }),
  ironSole: new THREE.MeshStandardMaterial({ color: 0xcbd5e0, roughness: 0.15, metalness: 0.9 }),
  ironBody: new THREE.MeshStandardMaterial({ color: 0x742a2a, roughness: 0.3, metalness: 0.2 }),
  lampShade: new THREE.MeshStandardMaterial({ color: 0xdd6b20, roughness: 0.4, metalness: 0.1 }),
  dryerBody: new THREE.MeshStandardMaterial({ color: 0x9b2c2c, roughness: 0.3, metalness: 0.2 }),
  tapeBlack: new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.55, metalness: 0.05 }),
  towelFabric: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0.0 }),

  // ماء وسوائل وشفافية
  waterDrop: new THREE.MeshPhysicalMaterial({
    color: 0x90cdf4,
    transmission: 0.92,
    opacity: 1,
    transparent: true,
    roughness: 0.04,
    ior: 1.33
  }),
  waterBathtub: new THREE.MeshPhysicalMaterial({
    color: 0x63b3ed,
    transmission: 0.88,
    opacity: 0.95,
    transparent: true,
    roughness: 0.08,
    ior: 1.33
  }),

  // شرارات كهربائية وتوهجات خطر/أمان
  electricSpark: new THREE.MeshBasicMaterial({ color: 0xfff066 }),
  sparkCore: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  hazardGlow: new THREE.MeshBasicMaterial({ color: 0xe53e3e, transparent: true, opacity: 0.45 }),
  safeGreenGlow: new THREE.MeshBasicMaterial({ color: 0x38a169, transparent: true, opacity: 0.45 }),
  carpetPattern: new THREE.MeshStandardMaterial({ color: 0x822727, roughness: 0.85, metalness: 0.0 })
};

// ─── دوال هندسية أساسية مساعدة ───
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
  return mesh(p, new THREE.SphereGeometry(r, 16, 12), m, x, y, z);
}

// ─── مقبس جداري واقعي ومفصل ومثبت على جدار ───
function createDetailedSocket(parent, x = 0, y = 0.8, z = 0, hasCover = false) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  // إطار الجدار الخلفي
  rbox(g, 1.4, 1.4, 0.12, materials.socketFrame, 0, 0, 0, 0.08);
  // وجه المقبس الأوسط
  rbox(g, 1.15, 1.15, 0.16, materials.socketInner, 0, 0, 0.03, 0.05);

  if (hasCover) {
    // غطاء حماية بلاستيكي دائري يغلق الفتحات بإحكام (Safety Plug Cover)
    const cap = cyl(g, 0.42, 0.42, 0.15, materials.plugBodySafe, 0, 0, 0.14, 24);
    cap.rotation.x = Math.PI / 2;
    rbox(g, 0.5, 0.14, 0.14, materials.plugBodySafe, 0, 0, 0.18, 0.04);
  } else {
    // تجويف المقبس الدائري (مائل أفقياً للأمام)
    const recess = cyl(g, 0.42, 0.42, 0.08, materials.socketInner, 0, 0, 0.1, 24);
    recess.rotation.x = Math.PI / 2;

    // فتحتا المقبس (أفقيتان بالعمق)
    const slotL = cyl(g, 0.045, 0.045, 0.14, materials.socketHoles, -0.18, 0, 0.12, 12);
    slotL.rotation.x = Math.PI / 2;
    const slotR = cyl(g, 0.045, 0.045, 0.14, materials.socketHoles, 0.18, 0, 0.12, 12);
    slotR.rotation.x = Math.PI / 2;

    // مشابك التأريض المعدنية النحاسية
    rbox(g, 0.08, 0.12, 0.05, materials.brassProngs, 0, 0.28, 0.12, 0.02);
    rbox(g, 0.08, 0.12, 0.05, materials.brassProngs, 0, -0.28, 0.12, 0.02);
  }

  parent.add(g);
  return g;
}

// ─── تشريح يد بشرية واقعية مع أصابع ومفاصل ───
function createHumanHand({
  isWet = false,
  holdingType = 'reaching', // reaching | gripping_plug | pulling_cord | holding_scissors
  scale = 1.0
} = {}) {
  const hand = new THREE.Group();
  const skinMat = isWet ? materials.skinWet : materials.skin;

  // الساعد
  const arm = cyl(hand, 0.2, 0.26, 1.2, skinMat, 0, -0.6, 0);
  arm.rotation.z = 0.12;

  // المعصم
  sphere(hand, 0.2, skinMat, 0, 0, 0);

  // راحة الكف
  rbox(hand, 0.44, 0.42, 0.2, skinMat, 0, 0.22, 0, 0.06);

  // أصابع اليد الأربعة (السبابة، الوسطى، البنصر، الخنصر)
  const fingerOffsets = [-0.15, -0.05, 0.05, 0.15];
  const fingerLengths = [0.35, 0.4, 0.36, 0.28];

  fingerOffsets.forEach((xOff, i) => {
    const fLen = fingerLengths[i];
    const fingerGroup = new THREE.Group();
    fingerGroup.position.set(xOff, 0.43, 0);

    // مفصل القاعدة
    cyl(fingerGroup, 0.042, 0.048, fLen * 0.55, skinMat, 0, fLen * 0.27, 0);

    // المفصل الثاني / الطرفي
    const joint2 = new THREE.Group();
    joint2.position.set(0, fLen * 0.55, 0);
    if (holdingType === 'gripping_plug' || holdingType === 'pulling_cord') {
      joint2.rotation.x = -0.75; // انحناء للإمساك
    } else if (holdingType === 'holding_scissors') {
      joint2.rotation.x = -0.55;
    } else {
      joint2.rotation.x = -0.15; // تمدد للمس
    }
    cyl(joint2, 0.035, 0.042, fLen * 0.5, skinMat, 0, fLen * 0.25, 0);
    fingerGroup.add(joint2);

    if (isWet) {
      // قطرات ماء فيزيائية لامعة على أطراف الأصابع
      sphere(fingerGroup, 0.06, materials.waterDrop, 0, fLen * 1.05, 0.04);
      sphere(fingerGroup, 0.04, materials.waterDrop, 0, fLen * 0.5, 0.05);
    }

    hand.add(fingerGroup);
  });

  // الإبهام
  const thumb = new THREE.Group();
  thumb.position.set(-0.22, 0.12, 0.06);
  thumb.rotation.z = 0.55;
  thumb.rotation.y = -0.3;
  cyl(thumb, 0.045, 0.05, 0.36, skinMat, 0, 0.18, 0);
  if (isWet) sphere(thumb, 0.055, materials.waterDrop, 0, 0.38, 0);
  hand.add(thumb);

  if (isWet) {
    // قطرات ماء متساقطة في الهواء نحو القابس
    sphere(hand, 0.1, materials.waterDrop, 0.06, 0.8, 0.12);
    sphere(hand, 0.13, materials.waterDrop, -0.04, 0.65, 0.18);
    sphere(hand, 0.08, materials.waterDrop, 0.15, 0.48, 0.15);
  }

  hand.scale.setScalar(scale);
  return hand;
}

// ─── مجسم طفل لطيف وواقعي يجلس ويلعب ───
function createChildFigure() {
  const child = new THREE.Group();

  // رأس وشعر وملامح الطفل
  sphere(child, 0.32, materials.childSkin, 0, 1.15, 0);
  const hair = sphere(child, 0.34, materials.childHair, 0, 1.25, -0.03);
  hair.scale.set(1.02, 0.82, 1.02);

  // عيون الطفل
  sphere(child, 0.04, materials.socketHoles, -0.1, 1.18, 0.29);
  sphere(child, 0.04, materials.socketHoles, 0.1, 1.18, 0.29);

  // جذع الطفل (قميص أزرق لطيف)
  cyl(child, 0.24, 0.3, 0.62, materials.childShirt, 0, 0.65, 0);

  // ساقان جالستان على الأرض
  const legL = cyl(child, 0.1, 0.09, 0.52, materials.childPants, -0.2, 0.16, 0.2);
  legL.rotation.x = Math.PI / 2;
  const legR = cyl(child, 0.1, 0.09, 0.52, materials.childPants, 0.2, 0.16, 0.2);
  legR.rotation.x = Math.PI / 2;

  // حذاءان
  sphere(child, 0.11, materials.cordBlue, -0.2, 0.14, 0.48);
  sphere(child, 0.11, materials.cordBlue, 0.2, 0.14, 0.48);

  // ذراعان تمتدان للأمام وتشدان السلك
  const armL = cyl(child, 0.075, 0.065, 0.48, materials.childShirt, -0.28, 0.72, 0.2);
  armL.rotation.x = 1.15;
  armL.rotation.z = -0.25;
  sphere(child, 0.075, materials.childSkin, -0.28, 0.52, 0.42);

  const armR = cyl(child, 0.075, 0.065, 0.48, materials.childShirt, 0.28, 0.72, 0.2);
  armR.rotation.x = 1.15;
  armR.rotation.z = 0.25;
  sphere(child, 0.075, materials.childSkin, 0.28, 0.52, 0.42);

  return child;
}

// ─── صاعقة كهربائية ساطعة وشرارات حية ───
function createLightningSparks(x = 0, y = 0, z = 0, scale = 1.0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  const points = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.14, 0.18, 0.04),
    new THREE.Vector3(0.12, 0.36, -0.04),
    new THREE.Vector3(-0.06, 0.52, 0.06),
    new THREE.Vector3(0.15, 0.68, 0)
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const geom = new THREE.TubeGeometry(curve, 14, 0.032 * scale, 5, false);
  mesh(g, geom, materials.electricSpark);

  sphere(g, 0.07 * scale, materials.sparkCore, -0.14, 0.18, 0.04);
  sphere(g, 0.08 * scale, materials.electricSpark, 0.12, 0.36, -0.04);
  sphere(g, 0.06 * scale, materials.sparkCore, -0.06, 0.52, 0.06);

  return g;
}

// ─── مصنع المجسمات الواقعية لجميع السلوكيات الـ 14 ───
function createProceduralModel(id) {
  const g = new THREE.Group();

  switch (id) {
    // 1. تحميل المقبس بأجهزة وشواحن كثيرة (مشترك كهربائي 5 منافذ مكدس بشواحن ومحولات)
    case 'overloaded_socket': {
      // مشترك كهربائي أبيض أفقي ممتد على الطاولة
      const strip = new THREE.Group();
      strip.position.set(0, 0.12, 0);
      rbox(strip, 2.8, 0.22, 0.75, materials.socketFrame, 0, 0, 0, 0.08);

      // زر تشغيل المشترك الأحمر
      rbox(strip, 0.22, 0.14, 0.24, materials.cordBlue, -1.15, 0.08, 0, 0.03);

      // 5 منافذ دائرية على المشترك
      const slotXs = [-0.75, -0.38, 0.0, 0.38, 0.75];
      slotXs.forEach(sx => {
        const h = cyl(strip, 0.16, 0.16, 0.05, materials.socketInner, sx, 0.11, 0, 16);
        h.rotation.x = 0;
      });

      // منفذ 1: شاحن هاتف أبيض مع كابل USB يلتف على الطاولة
      rbox(strip, 0.3, 0.55, 0.3, materials.plugBodyWhite, -0.75, 0.36, 0, 0.04);
      const usbWire = cyl(strip, 0.022, 0.022, 0.7, materials.cordWhite, -0.75, 0.1, 0.38);
      usbWire.rotation.x = Math.PI / 2;

      // منفذ 2 و 3: موزع ثلاثي (T-socket) مكدس بمحولين فوق بعضهما بشكل خطير
      const adapterT = new THREE.Group();
      adapterT.position.set(-0.18, 0.35, 0);
      rbox(adapterT, 0.5, 0.6, 0.45, materials.plugBodyDark, 0, 0, 0, 0.05);

      // قابسان متزاحمان موصولان في الموزع الثلاثي
      rbox(adapterT, 0.32, 0.45, 0.32, materials.plugBodyDark, -0.22, 0.22, 0.15, 0.04);
      rbox(adapterT, 0.35, 0.5, 0.32, materials.plugBodyDark, 0.22, 0.24, -0.12, 0.04);
      strip.add(adapterT);

      // منفذ 4: قابس كبير مائل مع سلك أسود سميك
      const heavyPlug = rbox(strip, 0.38, 0.65, 0.42, materials.plugBodyDark, 0.55, 0.42, 0.05, 0.06);
      heavyPlug.rotation.z = 0.22;
      const heavyWire = cyl(strip, 0.045, 0.045, 0.9, materials.cordBlack, 0.65, 0.3, 0.4);
      heavyWire.rotation.x = 0.8;

      // سلك التغذية الرئيسي للمشترك
      const mainCord = cyl(strip, 0.055, 0.055, 1.2, materials.cordWhite, 1.45, 0, 0);
      mainCord.rotation.z = Math.PI / 2;

      g.add(strip);

      // توهج حراري أحمر وشرارات حمل زائد عند الموزع المتكدس
      sphere(g, 0.22, materials.hazardGlow, -0.18, 0.5, 0);
      g.add(createLightningSparks(-0.15, 0.65, 0.1, 1.1));
      break;
    }

    // 2. استخدام أسلاك كهربائية معراة وتالفة (مصباح طاولة مع كابل أزرق ممزق ونحاس مكشوف يتطاير منه الشرر)
    case 'exposed_damaged_wire': {
      // مصباح طاولة صغير على اليسار كمصدر للأجهزة المنزلية
      const lamp = new THREE.Group();
      lamp.position.set(-1.1, 0, 0);
      cyl(lamp, 0.38, 0.42, 0.12, materials.chromeSteel, 0, 0.06, 0); // قاعدة المصباح
      cyl(lamp, 0.05, 0.05, 0.85, materials.chromeSteel, 0, 0.5, 0); // رقبة المصباح
      cyl(lamp, 0.18, 0.38, 0.45, materials.lampShade, 0, 1.05, 0); // غطاء المصباح
      g.add(lamp);

      // كابل كهربائي أزرق سميك يمتد أفقياً على الطاولة نحو اليمين
      const wireLeft = cyl(g, 0.075, 0.075, 0.85, materials.cordBlue, -0.55, 0.07, 0);
      wireLeft.rotation.z = Math.PI / 2;

      const wireRight = cyl(g, 0.075, 0.075, 0.85, materials.cordBlue, 0.55, 0.07, 0);
      wireRight.rotation.z = Math.PI / 2;

      // قابس الجهاز في أقصى اليمين
      rbox(g, 0.38, 0.3, 0.32, materials.plugBodyDark, 1.1, 0.1, 0, 0.05);

      // منطقة التمزق والتلف في منتصف الكابل (أسلاك داخلية بنية وزرقاء مكشوفة)
      const innerBlue = cyl(g, 0.035, 0.035, 0.35, materials.wireBlueInner, -0.08, 0.09, 0.03);
      innerBlue.rotation.z = Math.PI / 2;
      const innerBrown = cyl(g, 0.035, 0.035, 0.35, materials.wireBrownInner, 0.08, 0.09, -0.03);
      innerBrown.rotation.z = Math.PI / 2;

      // شعيرات النحاس المعراة المتطايرة بدون عازل
      const copper1 = cyl(g, 0.025, 0.025, 0.32, materials.copperWire, 0.0, 0.15, 0.04);
      copper1.rotation.z = 0.8;
      const copper2 = cyl(g, 0.025, 0.025, 0.32, materials.copperWire, -0.02, 0.15, -0.04);
      copper2.rotation.z = -0.7;

      // شرارات كهربائية نشطة تتفرع من النحاس المكشوف
      g.add(createLightningSparks(0, 0.12, 0, 1.15));
      sphere(g, 0.15, materials.hazardGlow, 0, 0.12, 0);
      break;
    }

    // 3. عبث الأطفال بالأسلاك والتوصيلات (طفل جالس على الأرض يشد سلك مقبس جداري)
    case 'kids_playing_cords': {
      // جدار خلفي ومقبس جداري
      rbox(g, 3.0, 2.2, 0.15, materials.wallBackdrop, 0, 1.1, -0.5, 0.04);
      createDetailedSocket(g, -0.85, 0.9, -0.42);

      // قابس موصول بالمقبس يميل تحت الشد
      const plug = rbox(g, 0.38, 0.42, 0.38, materials.plugBodyDark, -0.85, 0.9, -0.15, 0.05);
      plug.rotation.z = -0.25;

      // سلك يتدلى من المقبس إلى الأرض ويصل إلى يدي الطفل
      const wireDown = cyl(g, 0.04, 0.04, 0.95, materials.cordWhite, -0.7, 0.5, -0.15);
      wireDown.rotation.z = 0.35;

      const wireFloor = cyl(g, 0.04, 0.04, 1.1, materials.cordWhite, -0.1, 0.12, 0.15);
      wireFloor.rotation.z = Math.PI / 2 - 0.2;

      // مجسم الطفل جالس على الأرض يشد السلك بيديه
      const child = createChildFigure();
      child.position.set(0.45, 0, 0.15);
      child.rotation.y = -0.55;
      g.add(child);

      // شوكات القابس النحاسية تبرز نتيجة الشد مع شرر
      cyl(g, 0.03, 0.03, 0.14, materials.brassProngs, -0.85, 0.9, -0.36);
      g.add(createLightningSparks(-0.85, 0.9, -0.25, 0.85));
      break;
    }

    // 4. لمس القابس أو المقبس بيد مبللة بالماء (يد بشرية واقعية مبللة بقطرات تسيل نحو القابس)
    case 'wet_hands_plug': {
      // جدار وبلاط حمام ومقبس جداري
      rbox(g, 2.6, 2.2, 0.15, materials.wallBackdrop, 0, 1.1, -0.4, 0.04);
      createDetailedSocket(g, -0.55, 0.95, -0.32);

      // قابس أسود في المقبس
      rbox(g, 0.42, 0.48, 0.42, materials.plugBodyDark, -0.55, 0.95, -0.05, 0.06);
      const wire = cyl(g, 0.04, 0.04, 1.0, materials.cordBlack, -0.55, 0.45, 0.05);

      // يد بشرية مبللة بالماء تقترب مباشرة لتلمس القابس
      const wetHand = createHumanHand({ isWet: true, holdingType: 'reaching', scale: 0.92 });
      wetHand.position.set(0.55, 0.72, 0.15);
      wetHand.rotation.z = -1.25;
      wetHand.rotation.y = -0.35;
      g.add(wetHand);

      // قوس صاعقة كهربائية ساطعة بين أصابع اليد المبللة والمقبس
      g.add(createLightningSparks(-0.25, 0.95, 0.1, 1.2));
      sphere(g, 0.18, materials.hazardGlow, -0.25, 0.95, 0.1);
      break;
    }

    // 5. عض سلك الشاحن أو وضعه في الفم (طفل رضيع يقرب طرف كابل الشاحن المعدني من فمه)
    case 'baby_biting_cord': {
      // جدار ومقبس جداري مع رأس شاحن هاتف
      rbox(g, 2.8, 2.2, 0.15, materials.wallBackdrop, 0, 1.1, -0.45, 0.04);
      createDetailedSocket(g, -0.9, 1.15, -0.37);
      rbox(g, 0.35, 0.48, 0.35, materials.plugBodyWhite, -0.9, 1.15, -0.15, 0.04);

      // سجادة دائرية للأطفال على الأرض
      const rug = cyl(g, 1.1, 1.1, 0.04, materials.carpetPattern, 0.2, 0.02, 0.1, 32);

      // طفل جالس على السجادة
      const baby = createChildFigure();
      baby.position.set(0.25, 0, 0.1);
      baby.rotation.y = -0.4;
      g.add(baby);

      // كابل الشاحن الأبيض يمتد من المقبس نحو يدي وفم الطفل
      const cord1 = cyl(g, 0.028, 0.028, 1.3, materials.cordWhite, -0.5, 0.7, -0.1);
      cord1.rotation.z = -0.75;

      // طرف كابل الشاحن المعدني عند فم الطفل
      const tip = cyl(g, 0.035, 0.035, 0.14, materials.chromeSteel, 0.25, 1.12, 0.36);
      tip.rotation.x = Math.PI / 2;

      // وميض خطر عند الفم حيث ينقل اللعاب التيار
      sphere(g, 0.16, materials.electricSpark, 0.25, 1.12, 0.36);
      sphere(g, 0.2, materials.hazardGlow, 0.25, 1.12, 0.36);
      break;
    }

    // 6. إدخال مقص أو أدوات معدنية في المقبس (مقص حديدي ذو شفرات تلامس داخل المقبس ويد تمسكه)
    case 'inserting_scissors_socket': {
      // جدار ومقبس جداري مفصل
      rbox(g, 2.6, 2.2, 0.15, materials.wallBackdrop, 0, 1.1, -0.3, 0.04);
      createDetailedSocket(g, -0.15, 0.95, -0.22);

      // مقص معدني بشفرتين من الصلب وحلقتي مقبض
      const scissors = new THREE.Group();
      // شفرتان من الكروم الصلب
      rbox(scissors, 0.05, 1.1, 0.12, materials.chromeSteel, 0, 0.45, 0, 0.02);
      rbox(scissors, 0.05, 1.1, 0.12, materials.chromeSteel, 0.03, 0.45, 0.02, 0.02);
      // برغي المفصل الأوسط
      sphere(scissors, 0.05, materials.brassProngs, 0.02, 0.15, 0);
      // حلقتا المقبض البلاستيكي
      mesh(scissors, new THREE.TorusGeometry(0.22, 0.055, 12, 24), materials.scissorsHandle, -0.15, -0.28, 0);
      mesh(scissors, new THREE.TorusGeometry(0.22, 0.055, 12, 24), materials.scissorsHandle, 0.18, -0.28, 0);

      // تموضع المقص متجهاً مباشرة داخل ثقب المقبس
      scissors.position.set(0.12, 0.8, 0.1);
      scissors.rotation.z = -0.55;
      scissors.rotation.y = 0.3;
      g.add(scissors);

      // يد تمسك بمقبض المقص
      const hand = createHumanHand({ isWet: false, holdingType: 'holding_scissors', scale: 0.88 });
      hand.position.set(0.68, 0.38, 0.25);
      hand.rotation.z = -0.85;
      g.add(hand);

      // صاعقة كهربائية ساطعة تنطلق من ثقب المقبس عبر الشفرة
      g.add(createLightningSparks(-0.05, 0.95, -0.05, 1.25));
      sphere(g, 0.18, materials.hazardGlow, -0.05, 0.95, -0.05);
      break;
    }

    // 7. سحب السلك بقوة وعنف لنزعه من الجدار (السلك مشدود بقوة أفقية والرقبة تتمزق وتكشف النحاس)
    case 'pulling_cord_violently': {
      // جدار ومقبس جداري
      rbox(g, 2.6, 2.2, 0.15, materials.wallBackdrop, 0, 1.1, -0.3, 0.04);
      createDetailedSocket(g, -0.9, 0.9, -0.22);

      // رأس القابس ما زال مغروزاً في المقبس
      rbox(g, 0.42, 0.48, 0.42, materials.plugBodyDark, -0.9, 0.9, 0.05, 0.06);

      // السلك مشدود أفقياً بقوة مشدودة للغاية
      const cord = cyl(g, 0.06, 0.06, 1.6, materials.cordBlack, 0.05, 0.9, 0.1);
      cord.rotation.z = Math.PI / 2;

      // نقطة التمزق عند رقبة القابس تبرز أسلاك النحاس
      sphere(g, 0.14, materials.copperWire, -0.65, 0.9, 0.1);
      g.add(createLightningSparks(-0.65, 0.9, 0.15, 0.9));

      // يد بشرية تقبض على السلك بشدة وتسحب للخلف
      const hand = createHumanHand({ isWet: false, holdingType: 'pulling_cord', scale: 0.92 });
      hand.position.set(0.9, 0.9, 0.1);
      hand.rotation.z = -1.57;
      g.add(hand);
      break;
    }

    // 8. استخدام مجفف الشعر والأجهزة قرب حوض الماء (مجفف شعر على حافة حوض مبلل يوشك على السقوط)
    case 'appliance_near_bathtub': {
      // حوض ماء أبيض سيراميكي
      const tub = new THREE.Group();
      tub.position.set(-0.35, 0.35, 0);
      rbox(tub, 1.9, 0.7, 1.7, materials.socketFrame, 0, 0, 0, 0.12);
      rbox(tub, 1.6, 0.1, 1.4, materials.waterBathtub, 0, 0.28, 0, 0.05); // سطح الماء
      g.add(tub);

      // مجفف شعر واقعي بمقبض وفوهة وسلك
      const dryer = new THREE.Group();
      cyl(dryer, 0.18, 0.24, 0.8, materials.dryerBody, 0, 0.4, 0); // فوهة المجفف
      rbox(dryer, 0.12, 0.52, 0.14, materials.plugBodyDark, 0, 0, 0, 0.03); // مقبض
      const cord = cyl(dryer, 0.035, 0.035, 1.1, materials.cordBlack, 0, -0.45, 0.08); // سلك يتدلى نحو الماء

      dryer.position.set(0.65, 0.75, 0.25);
      dryer.rotation.z = 0.58;
      dryer.rotation.y = 0.2;
      g.add(dryer);

      // قطرات ماء وشرارات تحذيرية بين الفوهة وسطح الماء
      sphere(g, 0.14, materials.electricSpark, 0.35, 0.7, 0.3);
      sphere(g, 0.18, materials.hazardGlow, 0.35, 0.7, 0.3);
      break;
    }

    // 9. تمرير الأسلاك الكهربائية تحت السجاد (أرضية خشبية وسجادة ذات انتفاخ طولي واضح للسلك المدفون)
    case 'cord_under_carpet': {
      // أرضية خشب باركيه
      rbox(g, 2.8, 0.1, 2.0, materials.floorWood, 0, 0.05, 0);

      // سجادة منقوشة مفرودة على الأرضية
      rbox(g, 2.1, 0.08, 1.5, materials.carpetPattern, 0, 0.14, 0, 0.03);

      // بروز وانتفاخ طولي في السجادة يوضح مرور السلك السميك تحتها
      const ridge = cyl(g, 0.075, 0.075, 2.15, materials.carpetPattern, 0, 0.19, 0, 16);
      ridge.rotation.x = Math.PI / 2;

      // طرف السلك الأزرق يخرج من حافة السجادة
      const cordOut = cyl(g, 0.065, 0.065, 0.55, materials.cordBlue, 0, 0.16, 0.98);
      cordOut.rotation.x = Math.PI / 2;

      // لهب وشرر تحذيري يوضح انحباس الحرارة وخطر احتراق النسيج
      sphere(g, 0.16, materials.hazardGlow, 0, 0.35, 0);
      g.add(createLightningSparks(0, 0.42, 0, 0.85));
      break;
    }

    // 10. نزع القابس بمسك الرأس البلاستيكي العازل بلطف (سلوك آمن: يد تمسك الرأس البلاستيكي بأمان)
    case 'pulling_by_plug_head': {
      // جدار ومقبس جداري
      rbox(g, 2.6, 2.2, 0.15, materials.wallBackdrop, 0, 1.1, -0.3, 0.04);
      createDetailedSocket(g, -0.6, 0.9, -0.22);

      // رأس القابس الأخضر الآمن ينزلق برفق من المقبس
      rbox(g, 0.5, 0.6, 0.5, materials.plugBodySafe, -0.6, 0.9, 0.15, 0.08);

      // شوكات القابس النحاسية تبرز قليلاً أثناء النزع السليم
      cyl(g, 0.04, 0.04, 0.22, materials.brassProngs, -0.6, 0.9, -0.08);

      // السلك الأبيض يتدلى بحرية دون أي شد
      const cord = cyl(g, 0.048, 0.048, 1.3, materials.cordWhite, 0.1, 0.65, 0.25);
      cord.rotation.z = -0.45;

      // يد بشرية تمسك بالرأس البلاستيكي العازل بأمان تام
      const hand = createHumanHand({ isWet: false, holdingType: 'gripping_plug', scale: 0.92 });
      hand.position.set(-0.25, 0.9, 0.15);
      hand.rotation.z = -1.57;
      g.add(hand);

      // درع أمان أخضر متوهج
      sphere(g, 0.26, materials.safeGreenGlow, -0.4, 1.4, 0.1);
      break;
    }

    // 11. تجفيف اليدين تماماً قبل لمس المفاتيح (سلوك آمن: يد جافة تضغط مفتاح الإنارة وبجانبها منشفة)
    case 'dry_hands_switch': {
      // جدار ومفتاح إنارة أنيق
      rbox(g, 2.6, 2.2, 0.15, materials.wallBackdrop, 0, 1.1, -0.3, 0.04);
      rbox(g, 1.2, 1.3, 0.14, materials.socketFrame, 0.25, 0.95, -0.2, 0.08);
      // زر المفتاح المائل للأمان
      rbox(g, 0.45, 0.55, 0.18, materials.plugBodySafe, 0.25, 0.95, -0.12, 0.03);

      // منشفة قطنية نظيفة معلقة تدل على التجفيف
      const towel = cyl(g, 0.25, 0.25, 1.2, materials.towelFabric, -0.65, 0.8, -0.05, 20);
      towel.rotation.z = 0.2;

      // يد بشرية جافة تمد إصبعها للضغط بأمان
      const hand = createHumanHand({ isWet: false, holdingType: 'reaching', scale: 0.92 });
      hand.position.set(0.85, 0.75, 0.15);
      hand.rotation.z = -1.15;
      g.add(hand);

      // هالة أمان خضراء متوهجة
      sphere(g, 0.24, materials.safeGreenGlow, 0.25, 1.35, 0);
      break;
    }

    // 12. تركيب أغطية الحماية البلاستيكية على المقابس (سلوك آمن: مقبس مغلق بغطاء أمان واقٍ)
    case 'childproof_socket_cover': {
      // جدار ومقبس محمي بالكامل بغطاء حماية بلاستيكي
      rbox(g, 2.6, 2.2, 0.15, materials.wallBackdrop, 0, 1.1, -0.3, 0.04);
      createDetailedSocket(g, 0, 0.95, -0.22, true);

      // يد طفل تحاول الاستكشاف فتصطدم بالغطاء العازل المصمت
      const childHand = createHumanHand({ isWet: false, holdingType: 'reaching', scale: 0.72 });
      childHand.position.set(0.52, 0.72, 0.25);
      childHand.rotation.z = -1.25;
      g.add(childHand);

      // درع أمان أخضر واقٍ
      sphere(g, 0.28, materials.safeGreenGlow, 0, 1.5, 0);
      break;
    }

    // 13. فصل الأجهزة الكهربائية فور الانتهاء منها (سلوك آمن: مكواة ملابس مستقرة وقابسها مفصول بوضوح)
    case 'unplug_idle_appliances': {
      // لوح كي ملابس خشبي رمادي
      rbox(g, 2.6, 0.12, 1.5, materials.socketInner, 0, 0.35, 0, 0.06);

      // مكواة ملابس واقفة على قاعدتها بأمان
      const iron = new THREE.Group();
      iron.position.set(-0.35, 0.42, 0);
      rbox(iron, 1.25, 0.16, 0.7, materials.ironSole, 0, 0.08, 0, 0.04); // قاعدة معدنية
      cyl(iron, 0.22, 0.32, 0.5, materials.ironBody, -0.1, 0.4, 0); // جسم المكواة
      rbox(iron, 0.12, 0.35, 0.75, materials.plugBodyDark, 0.15, 0.65, 0, 0.04); // مقبض اليد
      g.add(iron);

      // كابل المكواة يلتف بأمان
      const cord = cyl(g, 0.04, 0.04, 1.0, materials.cordWhite, 0.4, 0.42, 0.2);
      cord.rotation.x = Math.PI / 2;

      // القابس مفصول بوضوح ومستقر على اللوح (غير موصول بالكهرباء)
      rbox(g, 0.36, 0.42, 0.36, materials.plugBodyDark, 0.75, 0.48, 0.2, 0.05);
      cyl(g, 0.035, 0.035, 0.18, materials.brassProngs, 0.75, 0.48, 0.4);

      // هالة أمان خضراء
      sphere(g, 0.25, materials.safeGreenGlow, -0.35, 1.15, 0);
      break;
    }

    // 14. عزل الأسلاك بشريط لاصق عازل خاص (سلوك آمن: سلك كهربائي ملفوف بشريط PVC أسود محكم وبكرة لاصق)
    case 'insulating_tape_repair': {
      // طاولة عمل خشبية
      rbox(g, 2.8, 0.1, 1.8, materials.floorWood, 0, 0.05, 0);

      // كابل كهربائي يمتد أفقياً على طاولة العمل
      const wireL = cyl(g, 0.075, 0.075, 0.95, materials.cordBlue, -0.65, 0.12, 0);
      wireL.rotation.z = Math.PI / 2;
      const wireR = cyl(g, 0.075, 0.075, 0.95, materials.cordBlue, 0.65, 0.12, 0);
      wireR.rotation.z = Math.PI / 2;

      // منطقة العزل المغلفة بالشريط اللاصق الأسود بإحكام
      const tapedSection = cyl(g, 0.11, 0.11, 0.55, materials.tapeBlack, 0, 0.12, 0, 24);
      tapedSection.rotation.z = Math.PI / 2;

      // بكرة شريط لاصق عازل (PVC Tape Roll) موضوعة بجانب السلك
      const tapeRoll = new THREE.Group();
      tapeRoll.position.set(0.45, 0.16, 0.45);
      mesh(tapeRoll, new THREE.TorusGeometry(0.24, 0.09, 16, 32), materials.tapeBlack);
      cyl(tapeRoll, 0.15, 0.15, 0.18, materials.socketInner, 0, 0, 0); // قلب البكرة الكرتوني
      tapeRoll.rotation.x = Math.PI / 2;
      g.add(tapeRoll);

      // درع أمان أخضر متوهج
      sphere(g, 0.25, materials.safeGreenGlow, 0, 0.55, 0);
      break;
    }

    default: {
      rbox(g, 1.0, 1.0, 1.0, materials.socketFrame, 0, 0.5, 0);
      break;
    }
  }

  return g;
}

// ─── ضبط وتحجيم المشهد ليملأ مسرح العرض بنسب متناسقة ───
function normalizeBounds(object, targetSize = 2.4) {
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
  // Evaluation cues belong in feedback, never in the challenge scene.
  const cues=[];
  object.traverse(node => {
    if ([materials.hazardGlow, materials.safeGreenGlow, materials.electricSpark, materials.sparkCore].includes(node.material)) cues.push(node);
  });
  cues.forEach(node=>{node.removeFromParent();node.geometry?.dispose();});
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
  const sharedMaterials=new Set(Object.values(materials));
  root.traverse(node=>{for(const material of (Array.isArray(node.material)?node.material:[node.material]).filter(Boolean))if(!sharedMaterials.has(material))material.userData.localToModel=true;});

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
        object.rotation.y += dt * 0.4;
        object.position.y = Math.sin(Date.now() * 0.002) * 0.025;
      }
    }
  };

  return root;
}

export function disposeModel(model) {
  if (!model) return;
  model.traverse(node => {
    if (node.isMesh) {
      if (node.geometry) node.geometry.dispose();
    }
  });
}
