// ═══════════════════════════════════════════════════════════════════════════
// src/materials/models.js — المجسمات ثلاثية الأبعاد لخامات البيئة (Three.js)
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// المواد الفيزيائية الأساسية PBR لمحاكاة خامات الطبيعة
const materials = {
  // خامة البلاستيك الشفاف الملون
  plastic: new THREE.MeshStandardMaterial({
    color: 0xffd148,
    roughness: 0.15,
    metalness: 0.08,
    transparent: true,
    opacity: 0.9
  }),
  // خامة الزجاج الشفاف البراق
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xb8e2ed,
    transmission: 0.25,
    opacity: 0.48,
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 0.12,
    ior: 1.52,
    thickness: 0.6,
    specularIntensity: 1.0
  }),
  // خامة الصوف والأقمشة (مات بدون لمعان مع ملمس ناعم)
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
  // خامة المعادن (فولاذ مقاوم للصدأ وكروم لامع وفضي ناصع)
  iron: new THREE.MeshStandardMaterial({
    color: 0xdae2ec,
    roughness: 0.16,
    metalness: 0.85
  }),
  // خامة الذهب النقي اللامع
  gold: new THREE.MeshStandardMaterial({
    color: 0xffca28,
    roughness: 0.18,
    metalness: 0.82
  }),
  // خامة النحاس الأصفر والبرونز
  brass: new THREE.MeshStandardMaterial({
    color: 0xd4a03e,
    roughness: 0.22,
    metalness: 0.78
  }),
  // خامة الخشب الطبيعي
  wood: new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.8,
    metalness: 0.05
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
  // خامة المطاط
  rubberPink: new THREE.MeshStandardMaterial({
    color: 0xf87171,
    roughness: 0.6,
    metalness: 0.0
  }),
  rubberBlue: new THREE.MeshStandardMaterial({
    color: 0x60a5fa,
    roughness: 0.6,
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
 * إنشاء مجسمات إجرائية احترافية عالية الدقة لجميع العناصر
 */
function createProceduralModel(id) {
  const g = new THREE.Group();
  const fx = {};
  g.userData.effects = fx;

  switch (id) {
    case 'plasticRuler': {
      // مسطرة بلاستيكية صفراء شفافة مع تدريجات القياس
      const ruler = box(g, 2.6, 0.45, 0.04, materials.plastic, 0, 0.5, 0);
      const ink = new THREE.MeshStandardMaterial({ color: 0x514121, roughness: .6 });
      ink.userData.localToModel = true;
      // علامات تدريج السنتيمتر
      for (let i = -12; i <= 12; i++) {
        const isMajor = i % 5 === 0;
        const markHeight = isMajor ? 0.14 : 0.08;
        box(g, 0.015, markHeight, 0.007, ink, i * 0.09, 0.715 - markHeight / 2, 0.025);
      }
      g.rotation.z = .08;
      break;
    }

    case 'woolBall': {
      // كرة صوف محبوكة بخيوط ملفوفة
      const core = sphere(g, 0.75, materials.woolPink, 0, 0.75, 0);
      // لفات من خيوط الصوف متقاطعة
      for (let i = 0; i < 7; i++) {
        const ring = mesh(g, new THREE.TorusGeometry(0.74, 0.035, 12, 48), materials.wool, 0, 0.75, 0);
        ring.rotation.x = (i * Math.PI) / 5;
        ring.rotation.y = (i * Math.PI) / 7;
      }
      // طرف خيط الصوف المتدلي
      const thread = mesh(g, new THREE.CylinderGeometry(0.025, 0.025, 0.8, 12), materials.woolPink, 0.55, 0.2, 0.35);
      thread.rotation.z = -0.7;
      thread.rotation.x = 0.4;
      break;
    }

    case 'glassJar': {
      // مرطبان زجاجي مع غطاء معدني
      cylinder(g, 0.6, 0.62, 1.2, 32, materials.glass, 0, 0.6, 0);
      cylinder(g, 0.45, 0.45, 0.22, 32, materials.glass, 0, 1.25, 0);
      // غطاء معدني أصفر/ذهبي
      cylinder(g, 0.49, 0.49, 0.14, 32, materials.gold, 0, 1.35, 0);
      // قاع سميك زجاجي
      cylinder(g, 0.58, 0.58, 0.12, 32, materials.glass, 0, 0.1, 0);
      break;
    }

    case 'glassCup': {
      // كأس زجاجي شفاف أملس
      mesh(g, new THREE.CylinderGeometry(0.52, 0.42, 1.35, 48, 1, true), materials.glass, 0, 0.72, 0);
      // قاعدة زجاجية سميكة مانعة للانزلاق
      cylinder(g, 0.43, 0.44, 0.15, 32, materials.glass, 0, 0.12, 0);
      // حافة علوية مستديرة
      const rim = mesh(g, new THREE.TorusGeometry(0.51, 0.02, 12, 32), materials.glass, 0, 1.38, 0);
      rim.rotation.x = Math.PI / 2;
      break;
    }

    case 'ironNail': {
      // مسمار حديدي برأس مسطح وطرف مدبب
      // الرأس المسطح
      cylinder(g, 0.35, 0.35, 0.06, 24, materials.iron, 0, 1.45, 0);
      // ساق المسمار
      cylinder(g, 0.09, 0.09, 1.35, 24, materials.iron, 0, 0.75, 0);
      // الطرف المدبب
      cylinder(g, 0.09, 0.005, 0.25, 24, materials.iron, 0, 0.03, 0);
      g.rotation.z = -0.3;
      break;
    }

    case 'woodStick': {
      // غصن أو قطعة خشب طبيعية مع حلقات النمو
      cylinder(g, 0.24, 0.26, 1.8, 16, materials.wood, 0, 0.9, 0);
      // وجه الشريحة الخشبية الفاتحة من الأعلى والأسفل
      cylinder(g, 0.23, 0.23, 0.02, 16, materials.woodLight, 0, 1.81, 0);
      cylinder(g, 0.25, 0.25, 0.02, 16, materials.woodLight, 0, 0.01, 0);
      // عقدة شجرية جانبية صغيرة
      const knot = cylinder(g, 0.08, 0.05, 0.35, 12, materials.wood, 0.22, 1.1, 0);
      knot.rotation.z = Math.PI / 3;
      g.rotation.z = 0.25;
      break;
    }

    case 'metalSpoon': {
      // ملعقة طعام معدنية فولاذية مستقرة بأناقة على طاولة الاستكشاف
      const spoonGroup = new THREE.Group();
      // مقبض الملعقة الأملس مع انحناء خفيف مريح
      const handle = box(spoonGroup, 0.11, 1.55, 0.035, materials.iron, 0, 0.7, 0.02);
      // تجويف رأس الملعقة البيضاوي اللامع
      const bowl = mesh(spoonGroup, new THREE.SphereGeometry(0.36, 32, 24), materials.iron, 0, -0.18, 0.08);
      bowl.scale.set(0.85, 1.35, 0.28);
      // عنق الملعقة المنحني
      const neck = cylinder(spoonGroup, 0.06, 0.08, 0.35, 16, materials.iron, 0, 0.12, 0.04);
      neck.rotation.x = 0.15;
      // استقرار الملعقة بزاوية أفقية طبيعية كأنها موضوعة على الطاولة
      spoonGroup.rotation.x = 0.18;
      spoonGroup.rotation.y = 0.5;
      spoonGroup.rotation.z = 0.22;
      g.add(spoonGroup);
      break;
    }

    case 'fabricCloth': {
      // قطعة قماش مطوية ملونة
      box(g, 1.2, 0.12, 1.0, materials.woolPink, 0, 0.06, 0);
      box(g, 1.15, 0.12, 0.95, materials.wool, 0.04, 0.18, -0.02);
      box(g, 1.1, 0.12, 0.9, materials.plastic, -0.03, 0.3, 0.03);
      break;
    }

    case 'paperEnvelope': {
      // مغلف بريدي ورقي كلاسيكي
      const env = box(g, 1.6, 1.0, 0.04, materials.paper, 0, 0.6, 0);
      env.rotation.z = 0.1;
      // مثلث الطي في المغلف
      const flapGeom = new THREE.ConeGeometry(0.5, 0.35, 3);
      const flap = mesh(g, flapGeom, materials.woodLight, 0, 0.85, 0.025);
      flap.rotation.z = Math.PI;
      break;
    }

    case 'eraser': {
      // ممحاة مطاطية ملونة بزاوية شطف
      box(g, 0.6, 0.32, 1.2, materials.rubberPink, 0, 0.16, -0.28);
      box(g, 0.6, 0.32, 0.6, materials.rubberBlue, 0, 0.16, 0.58);
      g.rotation.y = 0.4;
      break;
    }

    case 'paperClip': {
      // مشبك ورق معدني كلاسيكي
      const wireMat = materials.iron;
      const r = 0.03;
      // حلقات المشبك
      cylinder(g, r, r, 1.1, 12, wireMat, -0.2, 0.65, 0);
      cylinder(g, r, r, 1.4, 12, wireMat, 0.0, 0.75, 0);
      cylinder(g, r, r, 1.0, 12, wireMat, 0.2, 0.6, 0);
      // أقواس الانحناء العلوية والسفلية
      const arc1 = mesh(g, new THREE.TorusGeometry(0.1, r, 8, 24, Math.PI), wireMat, -0.1, 1.2, 0);
      arc1.rotation.z = 0;
      const arc2 = mesh(g, new THREE.TorusGeometry(0.1, r, 8, 24, Math.PI), wireMat, 0.1, 0.1, 0);
      arc2.rotation.z = Math.PI;
      g.rotation.z = 0.2;
      break;
    }

    case 'goldRing': {
      // خاتم ذهبي ناصع ومشرق
      const ring = mesh(g, new THREE.TorusGeometry(0.65, 0.14, 24, 48), materials.gold, 0, 0.75, 0);
      ring.rotation.x = Math.PI / 4;
      // نقش زينة على الخاتم
      sphere(g, 0.18, materials.gold, 0, 1.25, 0.45);
      break;
    }

    case 'brassMortar': {
      // هاون نحاسي مع مدقة
      cylinder(g, 0.75, 0.5, 0.9, 32, materials.brass, 0, 0.55, 0);
      // قاعدة عريضة
      cylinder(g, 0.6, 0.65, 0.15, 32, materials.brass, 0, 0.1, 0);
      // مدقة الهاون
      const pestle = cylinder(g, 0.14, 0.18, 1.2, 24, materials.brass, 0.25, 0.95, 0);
      pestle.rotation.z = -0.45;
      break;
    }

    case 'keys': {
      // حلقة مفاتيح معدنية
      mesh(g, new THREE.TorusGeometry(0.45, 0.045, 12, 32), materials.iron, 0, 1.2, 0);
      // المفتاح الأول
      const k1 = box(g, 0.14, 0.9, 0.035, materials.brass, -0.15, 0.65, 0.05);
      k1.rotation.z = 0.2;
      // المفتاح الثاني
      const k2 = box(g, 0.14, 1.0, 0.035, materials.iron, 0.15, 0.6, -0.05);
      k2.rotation.z = -0.25;
      break;
    }

    case 'chalk': {
      // حزمة أصابع طباشير ملونة
      cylinder(g, 0.12, 0.12, 1.2, 16, materials.paper, -0.18, 0.6, 0);
      cylinder(g, 0.12, 0.12, 1.2, 16, materials.rubberBlue, 0.16, 0.6, 0.1);
      cylinder(g, 0.12, 0.12, 1.2, 16, materials.rubberPink, 0.0, 0.6, -0.15);
      g.rotation.z = 0.2;
      break;
    }

    default: {
      // مجسم افتراضي أنيق في حال إضافة عناصر جديدة لاحقاً
      box(g, 1, 1, 1, materials.plastic, 0, 0.6, 0);
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

  // إعادة الحساب بعد التكبير لوضع القاع على y = 0
  bounds.setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= bounds.min.y;
}

/**
 * تحميل المجسم للعنصر (يحاول تحميل ملف GLB أولاً، ثم يستخدم المجسم الإجرائي)
 */
export async function loadMaterialItem(item) {
  let object = null;
  let isGlb = false;

  // التحقق إن كان يتوفر ملف GLB للعنصر
  if (item.model) {
    try {
      const gltf = await loader.loadAsync(`assets/models/materials/${item.model}.glb`);
      object = gltf.scene;
      isGlb = true;
    } catch {
      // في حال عدم توفر GLB ننتقل للمجسم الإجرائي
    }
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
      color: 0x48bb78,
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

  // دالة تحريك المجسم
  let celebrateTime = 0;
  root.userData.triggerCelebration = () => {
    celebrateTime = 1.6; // مدة الاحتفال بالثواني
  };

  root.userData.animate = (dt, isRotating = true, reducedMotion = false) => {
    if (reducedMotion) return;

    if (celebrateTime > 0) {
      celebrateTime -= dt;
      // قفزة نصر دورانية سريعة
      const progress = 1 - celebrateTime / 1.6;
      object.position.y = Math.sin(progress * Math.PI) * 0.45;
      object.rotation.y += dt * 6.5;
      sparkleRing.material.opacity = Math.sin(progress * Math.PI) * 0.8;
      sparkleRing.scale.setScalar(1 + progress * 0.5);
    } else {
      sparkleRing.material.opacity = 0;
      if (isRotating) {
        object.rotation.y += dt * 0.6;
        // حركة طفو لطيفة
        object.position.y = Math.sin(Date.now() * 0.002) * 0.04;
      }
    }
  };

  return root;
}
