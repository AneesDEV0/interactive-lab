// ═══════════════════════════════════════════════════════════════════════════
// src/conductors/models.js — المجسمات ثلاثية الأبعاد للمواد الموصلة والعازلة
// مبنية بتقنية Three.js مع دعم ملفات GLB والمجسمات الإجرائية الفيزيائية PBR
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// المواد الفيزيائية الأساسية PBR لمحاكاة خامات الطبيعة
const materials = {
  // خامة البلاستيك الشفاف الملون
  plastic: new THREE.MeshStandardMaterial({
    color: 0x3498db,
    roughness: 0.18,
    metalness: 0.08,
    transparent: true,
    opacity: 0.92
  }),
  // خامة الزجاج الشفاف البراق
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.92,
    opacity: 1,
    transparent: true,
    roughness: 0.05,
    ior: 1.52,
    thickness: 0.6,
    specularIntensity: 1.0
  }),
  // خامة الصوف والأقمشة
  wool: new THREE.MeshStandardMaterial({
    color: 0x22a699,
    roughness: 0.96,
    metalness: 0.0
  }),
  woolPink: new THREE.MeshStandardMaterial({
    color: 0xeb4d88,
    roughness: 0.92,
    metalness: 0.0
  }),
  // خامة المعادن الفولاذية والحديدية
  iron: new THREE.MeshStandardMaterial({
    color: 0xdae2ec,
    roughness: 0.16,
    metalness: 0.88
  }),
  // خامة الذهب النقي اللامع
  gold: new THREE.MeshStandardMaterial({
    color: 0xffca28,
    roughness: 0.18,
    metalness: 0.85
  }),
  // خامة النحاس الأصفر والهاون النحاسي
  brass: new THREE.MeshStandardMaterial({
    color: 0xd4a03e,
    roughness: 0.22,
    metalness: 0.82
  }),
  // خامة الخشب الطبيعي
  wood: new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.8,
    metalness: 0.04
  }),
  woodLight: new THREE.MeshStandardMaterial({
    color: 0xc49a6c,
    roughness: 0.75,
    metalness: 0.0
  }),
  // خامة الورق والكرتون
  paper: new THREE.MeshStandardMaterial({
    color: 0xf5ebd3,
    roughness: 0.85,
    metalness: 0.0
  }),
  // خامة الطبشور
  chalk: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.0
  }),
  // خامة المطاط
  rubberPink: new THREE.MeshStandardMaterial({
    color: 0xf87171,
    roughness: 0.65,
    metalness: 0.0
  }),
  rubberBlue: new THREE.MeshStandardMaterial({
    color: 0x60a5fa,
    roughness: 0.65,
    metalness: 0.0
  })
};

// دوال مساعدة لإنشاء الأشكال الهندسية الأساسية
function mesh(parent, geom, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geom, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function box(p, w, h, d, m, x = 0, y = 0, z = 0) {
  return mesh(p, new THREE.BoxGeometry(w, h, d), m, x, y, z);
}

function cylinder(p, rTop, rBot, h, seg, m, x = 0, y = 0, z = 0) {
  return mesh(p, new THREE.CylinderGeometry(rTop, rBot, h, seg), m, x, y, z);
}

function sphere(p, r, m, x = 0, y = 0, z = 0) {
  return mesh(p, new THREE.SphereGeometry(r, 24, 20), m, x, y, z);
}

/**
 * خريطة معرفات العناصر لدعم التسميات البديلة
 */
function normalizeId(id) {
  const map = {
    iron_nail: 'ironNail',
    metal_spoon: 'metalSpoon',
    paper_clip: 'paperClip',
    wooden_pencil: 'woodStick',
    wood_stick: 'woodStick',
    plastic_ruler: 'plasticRuler',
    copper_wire: 'ironNail',
    rubber_eraser: 'eraser',
    glass_marble: 'glassCup',
    fabric_cloth: 'fabricCloth',
    paper_envelope: 'paperEnvelope',
    glass_jar: 'glassJar',
    wool_ball: 'woolBall',
    brass_mortar: 'brassMortar',
    gold_ring: 'goldRing'
  };
  return map[id] || id;
}

/**
 * إنشاء مجسمات إجرائية احترافية عالية الدقة لجميع العناصر
 */
function createProceduralModel(rawId) {
  const id = normalizeId(rawId);
  const g = new THREE.Group();

  switch (id) {
    case 'ironNail': {
      // مسمار حديدي برأس مسطح وطرف مدبب
      cylinder(g, 0.35, 0.35, 0.06, 24, materials.iron, 0, 1.45, 0);
      cylinder(g, 0.09, 0.09, 1.35, 24, materials.iron, 0, 0.75, 0);
      cylinder(g, 0.09, 0.005, 0.25, 24, materials.iron, 0, 0.03, 0);
      g.rotation.z = -0.3;
      break;
    }

    case 'metalSpoon': {
      // ملعقة طعام معدنية فولاذية لامعة
      const spoonGroup = new THREE.Group();
      box(spoonGroup, 0.11, 1.55, 0.035, materials.iron, 0, 0.7, 0.02);
      const bowl = mesh(spoonGroup, new THREE.SphereGeometry(0.36, 32, 24), materials.iron, 0, -0.18, 0.08);
      bowl.scale.set(0.85, 1.35, 0.28);
      const neck = cylinder(spoonGroup, 0.06, 0.08, 0.35, 16, materials.iron, 0, 0.12, 0.04);
      neck.rotation.x = 0.15;
      spoonGroup.rotation.x = 0.18;
      spoonGroup.rotation.y = 0.5;
      spoonGroup.rotation.z = 0.22;
      g.add(spoonGroup);
      break;
    }

    case 'paperClip': {
      // مشبك ورق معدني كلاسيكي
      const wireMat = materials.iron;
      const r = 0.03;
      cylinder(g, r, r, 1.1, 12, wireMat, -0.2, 0.65, 0);
      cylinder(g, r, r, 1.4, 12, wireMat, 0.0, 0.75, 0);
      cylinder(g, r, r, 0.9, 12, wireMat, 0.2, 0.55, 0);
      const topArc = mesh(g, new THREE.TorusGeometry(0.1, r, 8, 16, Math.PI), wireMat, -0.1, 1.2, 0);
      topArc.rotation.z = 0;
      const botArc = mesh(g, new THREE.TorusGeometry(0.1, r, 8, 16, Math.PI), wireMat, 0.1, 0.1, 0);
      botArc.rotation.z = Math.PI;
      g.rotation.z = 0.2;
      break;
    }

    case 'keys': {
      // ميدالية مفاتيح معدنية نحاسية وحديدية
      const ring = mesh(g, new THREE.TorusGeometry(0.42, 0.04, 12, 32), materials.iron, 0, 1.1, 0);
      ring.rotation.x = Math.PI / 2;
      const k1 = new THREE.Group();
      cylinder(k1, 0.25, 0.25, 0.04, 16, materials.brass, 0, 0.75, 0);
      cylinder(k1, 0.04, 0.04, 0.9, 12, materials.brass, 0, 0.25, 0);
      box(k1, 0.14, 0.18, 0.04, materials.brass, 0.08, -0.08, 0);
      box(k1, 0.12, 0.12, 0.04, materials.brass, 0.07, 0.08, 0);
      k1.rotation.z = 0.35;
      g.add(k1);
      const k2 = new THREE.Group();
      cylinder(k2, 0.22, 0.22, 0.04, 16, materials.iron, 0, 0.78, 0.05);
      cylinder(k2, 0.038, 0.038, 0.85, 12, materials.iron, 0, 0.28, 0.05);
      box(k2, 0.13, 0.16, 0.04, materials.iron, -0.07, -0.05, 0.05);
      k2.rotation.z = -0.4;
      g.add(k2);
      break;
    }

    case 'brassMortar': {
      // هاون نحاسي صلب مع مدقة
      cylinder(g, 0.65, 0.45, 0.85, 32, materials.brass, 0, 0.45, 0);
      cylinder(g, 0.52, 0.55, 0.15, 32, materials.brass, 0, 0.07, 0);
      const rim = mesh(g, new THREE.TorusGeometry(0.63, 0.04, 12, 32), materials.brass, 0, 0.86, 0);
      rim.rotation.x = Math.PI / 2;
      const pestle = cylinder(g, 0.12, 0.14, 1.4, 16, materials.brass, 0.25, 0.75, 0.15);
      pestle.rotation.z = -0.35;
      pestle.rotation.x = 0.2;
      break;
    }

    case 'goldRing': {
      // خاتم ذهبي برّاق
      const ring = mesh(g, new THREE.TorusGeometry(0.55, 0.14, 24, 48), materials.gold, 0, 0.75, 0);
      ring.rotation.x = 0.45;
      ring.rotation.y = 0.3;
      sphere(g, 0.18, materials.gold, 0.32, 1.15, 0.25);
      break;
    }

    case 'woodStick': {
      // غصن أو عود خشب طبيعي
      cylinder(g, 0.24, 0.26, 1.8, 16, materials.wood, 0, 0.9, 0);
      cylinder(g, 0.23, 0.23, 0.02, 16, materials.woodLight, 0, 1.81, 0);
      cylinder(g, 0.25, 0.25, 0.02, 16, materials.woodLight, 0, 0.01, 0);
      const knot = cylinder(g, 0.08, 0.05, 0.35, 12, materials.wood, 0.22, 1.1, 0);
      knot.rotation.z = Math.PI / 3;
      g.rotation.z = 0.25;
      break;
    }

    case 'glassCup': {
      // كأس زجاجي شفاف أملس
      cylinder(g, 0.52, 0.42, 1.35, 32, materials.glass, 0, 0.72, 0);
      cylinder(g, 0.43, 0.44, 0.15, 32, materials.glass, 0, 0.12, 0);
      const rim = mesh(g, new THREE.TorusGeometry(0.51, 0.02, 12, 32), materials.glass, 0, 1.38, 0);
      rim.rotation.x = Math.PI / 2;
      break;
    }

    case 'eraser': {
      // ممحاة مطاطية ملونة بزاوية شطف
      box(g, 0.6, 0.32, 1.2, materials.rubberPink, 0, 0.16, -0.28);
      box(g, 0.6, 0.32, 0.6, materials.rubberBlue, 0, 0.16, 0.58);
      g.rotation.y = 0.4;
      break;
    }

    case 'plasticRuler': {
      // مسطرة بلاستيكية شفافة مع تدريجات القياس
      const ruler = box(g, 2.6, 0.45, 0.04, materials.plastic, 0, 0.5, 0);
      ruler.rotation.z = 0.15;
      for (let i = -12; i <= 12; i++) {
        const isMajor = i % 5 === 0;
        const markHeight = isMajor ? 0.14 : 0.08;
        const mark = box(g, 0.015, markHeight, 0.045, materials.plastic, i * 0.09, 0.62 - markHeight / 2, 0);
        mark.rotation.z = 0.15;
      }
      break;
    }

    case 'fabricCloth': {
      // قطعة قماش قطني مطوية
      box(g, 1.2, 0.12, 1.0, materials.woolPink, 0, 0.06, 0);
      box(g, 1.15, 0.12, 0.95, materials.wool, 0.04, 0.18, -0.02);
      box(g, 1.1, 0.12, 0.9, materials.plastic, -0.03, 0.3, 0.03);
      break;
    }

    case 'paperEnvelope': {
      // مغلف ورقي سيلولوزي
      const env = box(g, 1.6, 1.0, 0.04, materials.paper, 0, 0.6, 0);
      env.rotation.z = 0.1;
      const flapGeom = new THREE.ConeGeometry(0.5, 0.35, 3);
      const flap = mesh(g, flapGeom, materials.woodLight, 0, 0.85, 0.025);
      flap.rotation.z = Math.PI;
      break;
    }

    case 'chalk': {
      // طبشور مدرسي أبيض صلب
      cylinder(g, 0.16, 0.15, 1.5, 20, materials.chalk, 0, 0.75, 0);
      sphere(g, 0.16, materials.chalk, 0, 1.5, 0);
      cylinder(g, 0.17, 0.17, 0.5, 20, materials.paper, 0, 0.35, 0);
      g.rotation.z = 0.35;
      break;
    }

    case 'glassJar': {
      // مرطبان زجاجي
      cylinder(g, 0.6, 0.62, 1.2, 32, materials.glass, 0, 0.6, 0);
      cylinder(g, 0.45, 0.45, 0.22, 32, materials.glass, 0, 1.25, 0);
      cylinder(g, 0.49, 0.49, 0.14, 32, materials.gold, 0, 1.35, 0);
      cylinder(g, 0.58, 0.58, 0.12, 32, materials.glass, 0, 0.1, 0);
      break;
    }

    case 'woolBall': {
      // كرة صوف
      sphere(g, 0.75, materials.woolPink, 0, 0.75, 0);
      for (let i = 0; i < 7; i++) {
        const r = mesh(g, new THREE.TorusGeometry(0.74, 0.035, 12, 48), materials.wool, 0, 0.75, 0);
        r.rotation.x = (i * Math.PI) / 5;
        r.rotation.y = (i * Math.PI) / 7;
      }
      const thread = mesh(g, new THREE.CylinderGeometry(0.025, 0.025, 0.8, 12), materials.woolPink, 0.55, 0.2, 0.35);
      thread.rotation.z = -0.7;
      thread.rotation.x = 0.4;
      break;
    }

    default: {
      cylinder(g, 0.35, 0.35, 0.06, 24, materials.iron, 0, 1.45, 0);
      cylinder(g, 0.09, 0.09, 1.35, 24, materials.iron, 0, 0.75, 0);
      cylinder(g, 0.09, 0.005, 0.25, 24, materials.iron, 0, 0.03, 0);
      break;
    }
  }

  return g;
}

/**
 * ضبط مقاسات المجسم ومحاذاته تماماً في مركز طاولة الاستكشاف
 */
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

/**
 * الدالة الرئيسية لتحميل أو إنشاء مجسم العنصر
 */
export async function loadConductorItem(item) {
  let object = null;
  let isGlb = false;

  // محاولة تحميل ملف GLB إن كان متوفراً
  try {
    const gltf = await loader.loadAsync(`assets/models/conductors/${item.id}.glb`);
    if (gltf && gltf.scene) {
      object = gltf.scene;
      isGlb = true;
    }
  } catch {
    // في حال عدم توفر GLB ننتقل للمجسم الإجرائي عالي الدقة
  }

  if (!object) {
    object = createProceduralModel(item.id);
  }

  normalizeBounds(object);

  const root = new THREE.Group();
  root.add(object);
  root.userData.itemId = item.id;
  root.userData.isGlb = isGlb;

  // هالة توهج برّاقة للاحتفال عند التصنيف الصحيح
  const sparkleRing = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.3, 32),
    new THREE.MeshBasicMaterial({
      color: 0x7560af,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    })
  );
  sparkleRing.rotation.x = -Math.PI / 2;
  sparkleRing.position.y = 0.02;
  root.add(sparkleRing);
  root.userData.sparkleRing = sparkleRing;

  // دالة تحريك المجسم
  let celebrateTime = 0;
  root.userData.triggerCelebration = () => {
    celebrateTime = 1.6;
  };

  root.userData.animate = (dt, isRotating = true, reducedMotion = false) => {
    if (reducedMotion) return;

    if (celebrateTime > 0) {
      celebrateTime -= dt;
      const progress = 1 - celebrateTime / 1.6;
      object.position.y = Math.sin(progress * Math.PI) * 0.45;
      object.rotation.y += dt * 6.5;
      sparkleRing.material.opacity = Math.sin(progress * Math.PI) * 0.8;
      sparkleRing.scale.setScalar(1 + progress * 0.5);
    } else {
      sparkleRing.material.opacity = 0;
      if (isRotating) {
        object.rotation.y += dt * 0.6;
        object.position.y = Math.sin(Date.now() * 0.002) * 0.04;
      }
    }
  };

  return root;
}
