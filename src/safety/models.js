// ═══════════════════════════════════════════════════════════════════════════
// src/safety/models.js — المجسمات ثلاثية الأبعاد لمحطة السلامة الكهربائية (Three.js)
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// المواد الفيزيائية PBR
const materials = {
  socketWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.05 }),
  socketFace: new THREE.MeshStandardMaterial({ color: 0xedf2f7, roughness: 0.3, metalness: 0.05 }),
  slotDark: new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.5, metalness: 0.1 }),
  chargerBlack: new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.25, metalness: 0.2 }),
  chargerDark: new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.3, metalness: 0.2 }),
  plugHead: new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.2, metalness: 0.1 }),
  cordBlue: new THREE.MeshStandardMaterial({ color: 0x3182ce, roughness: 0.35, metalness: 0.0 }),
  cordWhite: new THREE.MeshStandardMaterial({ color: 0xf7fafc, roughness: 0.4, metalness: 0.0 }),
  copperWire: new THREE.MeshStandardMaterial({ color: 0xd69e2e, roughness: 0.18, metalness: 0.85 }),
  scissorsMetal: new THREE.MeshStandardMaterial({ color: 0xcbd5e0, roughness: 0.14, metalness: 0.9 }),
  scissorsHandle: new THREE.MeshStandardMaterial({ color: 0x3182ce, roughness: 0.25, metalness: 0.0 }),
  waterDrop: new THREE.MeshPhysicalMaterial({ color: 0x63b3ed, transmission: 0.9, opacity: 1, transparent: true, roughness: 0.05, ior: 1.33 }),
  safeGreen: new THREE.MeshStandardMaterial({ color: 0x38a169, roughness: 0.2, metalness: 0.1 }),
  hazardRed: new THREE.MeshStandardMaterial({ color: 0xe53e3e, roughness: 0.2, metalness: 0.1 }),
  warningOrange: new THREE.MeshStandardMaterial({ color: 0xdd6b20, roughness: 0.2, metalness: 0.1 }),
  sparkGold: new THREE.MeshBasicMaterial({ color: 0xf6e05e }),
  carpetFabric: new THREE.MeshStandardMaterial({ color: 0x9b2c2c, roughness: 0.85, metalness: 0.0 }),
  woodFloor: new THREE.MeshStandardMaterial({ color: 0xc69255, roughness: 0.7, metalness: 0.0 }),
  ironBody: new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.25, metalness: 0.4 }),
  tapeBlack: new THREE.MeshStandardMaterial({ color: 0x171923, roughness: 0.5, metalness: 0.0 })
};

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
  return mesh(p, new THREE.SphereGeometry(r, 20, 16), m, x, y, z);
}

/**
 * بناء مجسم المقبس الجداري النموذجي
 */
function createWallSocket(parent, x = 0, y = 0, z = 0) {
  const sGroup = new THREE.Group();
  box(sGroup, 1.4, 1.4, 0.16, materials.socketWhite, 0, 0, 0);
  box(sGroup, 1.1, 1.1, 0.18, materials.socketFace, 0, 0, 0.01);
  box(sGroup, 0.12, 0.35, 0.2, materials.slotDark, -0.28, 0, 0.02);
  box(sGroup, 0.12, 0.35, 0.2, materials.slotDark, 0.28, 0, 0.02);
  cylinder(sGroup, 0.08, 0.08, 0.2, 12, materials.slotDark, 0, 0.25, 0.02);
  sGroup.position.set(x, y, z);
  parent.add(sGroup);
  return sGroup;
}

/**
 * إنشاء مجسمات إجرائية ثلاثية الأبعاد عالية الدقة لكل سلوك
 */
function createProceduralModel(id) {
  const g = new THREE.Group();

  switch (id) {
    case 'overloaded_socket': {
      // مشترك كهربائي مع شواحن ومحولات متكدسة
      box(g, 2.6, 0.35, 1.0, materials.socketWhite, 0, 0.18, 0);
      box(g, 0.25, 0.18, 0.3, materials.hazardRed, -1.05, 0.28, 0); // زر التشغيل
      // شواحن ومحولات متكدسة فوق بعضها
      box(g, 0.55, 0.9, 0.65, materials.chargerBlack, -0.4, 0.7, 0);
      box(g, 0.65, 1.1, 0.7, materials.chargerDark, 0.35, 0.8, -0.05);
      // شاحن إضافي مائل متراكب
      const tiltedCharger = new THREE.Group();
      box(tiltedCharger, 0.5, 0.85, 0.55, materials.chargerBlack, 0, 0.45, 0);
      tiltedCharger.rotation.z = 0.35;
      tiltedCharger.rotation.x = 0.2;
      tiltedCharger.position.set(0.9, 0.35, 0.1);
      g.add(tiltedCharger);
      // شرارات التحميل الزائد
      sphere(g, 0.15, materials.sparkGold, 0.1, 1.45, 0.1);
      sphere(g, 0.1, materials.warningOrange, -0.2, 1.3, -0.15);
      break;
    }

    case 'kids_playing_cords': {
      // مقبس جداري منخفض وسلك ممتد مع مكعبات أطفال
      createWallSocket(g, -0.8, 0.8, 0);
      // سلك يمتد من المقبس نحو الأرض
      cylinder(g, 0.04, 0.04, 1.6, 12, materials.cordWhite, -0.3, 0.4, 0.3);
      // مكعبات أطفال ملونة قرب السلك
      box(g, 0.45, 0.45, 0.45, materials.cordBlue, 0.6, 0.23, 0.2);
      box(g, 0.4, 0.4, 0.4, materials.hazardRed, 0.45, 0.65, 0.15);
      box(g, 0.38, 0.38, 0.38, materials.warningOrange, 0.9, 0.2, -0.2);
      // مثلث تحذير
      const warnTri = cylinder(g, 0.35, 0.35, 0.08, 3, materials.hazardRed, 0.1, 1.4, 0);
      warnTri.rotation.z = Math.PI;
      break;
    }

    case 'baby_biting_cord': {
      // شاحن جداري وسلك أبيض سميك مع حلقة تحذير عند العض
      createWallSocket(g, 0, 1.1, 0);
      box(g, 0.5, 0.65, 0.55, materials.chargerBlack, 0, 1.1, 0.32);
      // كابل الشاحن يتدلى للأسفل
      cylinder(g, 0.04, 0.04, 1.4, 12, materials.cordWhite, 0, 0.4, 0.4);
      // حلقة حمراء تحذيرية تمثل منطقة الخطر
      const ring = mesh(g, new THREE.TorusGeometry(0.35, 0.05, 12, 32), materials.hazardRed, 0, 0.1, 0.4);
      ring.rotation.x = Math.PI / 2;
      sphere(g, 0.12, materials.sparkGold, 0.05, 0.1, 0.4);
      break;
    }

    case 'exposed_damaged_wire': {
      // سلك سميك مقطوع العازل تبرز منه الأسلاك النحاسية
      cylinder(g, 0.16, 0.16, 1.1, 20, materials.cordBlue, -0.8, 0.7, 0);
      cylinder(g, 0.16, 0.16, 1.1, 20, materials.cordBlue, 0.8, 0.7, 0);
      // الأسلاك النحاسية المعراة في الوسط
      cylinder(g, 0.04, 0.04, 0.9, 12, materials.copperWire, -0.05, 0.7, 0.08);
      cylinder(g, 0.04, 0.04, 0.9, 12, materials.copperWire, 0.08, 0.7, -0.05);
      cylinder(g, 0.035, 0.035, 0.85, 12, materials.copperWire, -0.02, 0.7, -0.07);
      // شرارات متطايرة
      sphere(g, 0.12, materials.sparkGold, 0, 0.75, 0);
      sphere(g, 0.08, materials.hazardRed, 0.15, 0.9, 0.05);
      sphere(g, 0.08, materials.warningOrange, -0.15, 0.55, -0.05);
      break;
    }

    case 'inserting_scissors_socket': {
      // مقبس جداري ومقص معدني داخل في الفتحة
      createWallSocket(g, 0, 0.7, 0);
      const sc = new THREE.Group();
      // شفرات المقص المعدنية
      box(sc, 0.08, 1.4, 0.15, materials.scissorsMetal, 0, 0.5, 0);
      box(sc, 0.08, 1.4, 0.15, materials.scissorsMetal, 0.06, 0.5, 0.02);
      // مقبض المقص الأزرق
      mesh(sc, new THREE.TorusGeometry(0.22, 0.06, 12, 24), materials.scissorsHandle, -0.15, -0.3, 0);
      mesh(sc, new THREE.TorusGeometry(0.22, 0.06, 12, 24), materials.scissorsHandle, 0.25, -0.3, 0);
      sc.rotation.z = -0.35;
      sc.rotation.y = 0.2;
      sc.position.set(0.25, 0.55, 0.3);
      g.add(sc);
      // شرارة التلامس المعدني
      sphere(g, 0.18, materials.sparkGold, 0.25, 0.7, 0.15);
      break;
    }

    case 'wet_hands_plug': {
      // مقبس مع قابس وقطرات ماء متساقطة
      createWallSocket(g, 0.4, 0.75, 0);
      box(g, 0.55, 0.65, 0.55, materials.plugHead, 0.4, 0.75, 0.35);
      // قطرات ماء ثلاثية الأبعاد لامعة
      sphere(g, 0.16, materials.waterDrop, -0.3, 0.9, 0.25);
      sphere(g, 0.22, materials.waterDrop, -0.2, 0.55, 0.35);
      sphere(g, 0.14, materials.waterDrop, -0.1, 0.25, 0.3);
      sphere(g, 0.18, materials.waterDrop, 0.1, 0.65, 0.4);
      // صاعقة تحذير عند التلامس
      sphere(g, 0.15, materials.sparkGold, 0.2, 0.75, 0.35);
      break;
    }

    case 'pulling_cord_violently': {
      // قابس مشدود بزاوية حادة مع سهم تحذير أحمر
      createWallSocket(g, -0.7, 0.7, 0);
      box(g, 0.45, 0.55, 0.45, materials.plugHead, -0.7, 0.7, 0.28);
      // سلك مشدود بقوة أفقية
      const cord = cylinder(g, 0.06, 0.06, 1.8, 12, materials.chargerBlack, 0.2, 0.7, 0.3);
      cord.rotation.z = Math.PI / 2;
      // مؤشر شد أحمر عند موضع الانقطاع
      sphere(g, 0.16, materials.hazardRed, -0.45, 0.7, 0.3);
      break;
    }

    case 'cord_under_carpet': {
      // طبقة سجادة بارزة يمر تحتها سلك
      box(g, 2.4, 0.12, 1.8, materials.woodFloor, 0, 0.06, 0);
      // سجادة حمراء تغطي السلك
      box(g, 1.8, 0.08, 1.4, materials.carpetFabric, 0, 0.16, 0);
      // انتفاخ السلك البارز تحت السجادة
      cylinder(g, 0.06, 0.06, 2.0, 12, materials.cordBlue, 0, 0.14, 0);
      // لهب تحذيري رمزي
      sphere(g, 0.16, materials.warningOrange, 0, 0.35, 0);
      sphere(g, 0.1, materials.hazardRed, 0, 0.5, 0);
      break;
    }

    case 'appliance_near_bathtub': {
      // حوض ماء ومجفف شعر كهربائي
      box(g, 1.6, 0.6, 1.6, materials.socketWhite, -0.4, 0.3, 0);
      box(g, 1.4, 0.1, 1.4, materials.waterDrop, -0.4, 0.55, 0);
      // مجفف شعر على الحافة
      const dryer = new THREE.Group();
      cylinder(dryer, 0.18, 0.16, 0.8, 16, materials.hazardRed, 0, 0.4, 0);
      box(dryer, 0.14, 0.5, 0.14, materials.chargerBlack, 0, 0, 0);
      dryer.rotation.z = 0.5;
      dryer.position.set(0.6, 0.6, 0.2);
      g.add(dryer);
      break;
    }

    case 'pulling_by_plug_head': {
      // مقبس وقابس يُمسك من الرأس البلاستيكي بأمان
      createWallSocket(g, -0.4, 0.7, 0);
      box(g, 0.55, 0.65, 0.55, materials.safeGreen, -0.4, 0.7, 0.35);
      cylinder(g, 0.05, 0.05, 1.4, 12, materials.cordWhite, 0.35, 0.7, 0.35);
      // درع أمان أخضر متوهج
      const shield = cylinder(g, 0.4, 0.4, 0.08, 6, materials.safeGreen, 0.2, 1.3, 0.2);
      shield.rotation.x = Math.PI / 2;
      break;
    }

    case 'dry_hands_switch': {
      // مفتاح إنارة مع منشفة تجفيف جافة
      box(g, 1.2, 1.3, 0.15, materials.socketWhite, 0.3, 0.75, 0);
      box(g, 0.45, 0.7, 0.2, materials.socketFace, 0.3, 0.75, 0.05);
      // منشفة ملفوفة جافة بجانب المفتاح
      const towel = cylinder(g, 0.25, 0.25, 1.2, 16, materials.safeGreen, -0.5, 0.7, 0.2);
      towel.rotation.z = 0.2;
      sphere(g, 0.14, materials.safeGreen, 0.3, 1.45, 0);
      break;
    }

    case 'childproof_socket_cover': {
      // مقبس محمي بغطاء أمان بلاستيكي عازل
      createWallSocket(g, 0, 0.7, 0);
      // غطاء الأمان الأزرق الدائري الواقي
      cylinder(g, 0.45, 0.45, 0.15, 32, materials.cordBlue, 0, 0.7, 0.15);
      box(g, 0.45, 0.12, 0.2, materials.safeGreen, 0, 0.7, 0.22);
      // قفل الأمان الصغير
      sphere(g, 0.12, materials.safeGreen, 0, 1.2, 0.15);
      break;
    }

    case 'unplug_idle_appliances': {
      // مكواة ملابس مع قابس مفصول ومستريح
      const iron = new THREE.Group();
      box(iron, 1.2, 0.25, 0.65, materials.ironBody, 0, 0.15, 0);
      box(iron, 0.6, 0.4, 0.12, materials.hazardRed, 0, 0.4, 0);
      cylinder(iron, 0.08, 0.08, 0.8, 12, materials.ironBody, 0, 0.6, 0);
      iron.position.set(-0.3, 0.3, 0);
      g.add(iron);
      // رأس القابس المفصول بجانب المكواة
      box(g, 0.4, 0.4, 0.4, materials.safeGreen, 0.7, 0.3, 0.2);
      cylinder(g, 0.04, 0.04, 0.8, 12, materials.cordWhite, 0.2, 0.3, 0.1);
      break;
    }

    case 'insulating_tape_repair': {
      // سلك معزول ومغلف بشريط عازل أسود مع بكرة الشريط
      cylinder(g, 0.12, 0.12, 1.8, 16, materials.cordBlue, 0, 0.6, 0);
      // طبقات الشريط اللاصق العازل المحكمة في المنتصف
      cylinder(g, 0.16, 0.16, 0.65, 20, materials.tapeBlack, 0, 0.6, 0);
      // بكرة الشريط العازل بجانبه
      const roll = mesh(g, new THREE.TorusGeometry(0.35, 0.12, 16, 32), materials.tapeBlack, 0.65, 0.4, 0.2);
      roll.rotation.x = Math.PI / 2;
      sphere(g, 0.15, materials.safeGreen, 0, 1.25, 0);
      break;
    }

    default: {
      createWallSocket(g, 0, 0.7, 0);
      break;
    }
  }

  return g;
}

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

export async function loadSafetyItem(item) {
  let object = null;
  let isGlb = false;

  if (item.model) {
    try {
      const gltf = await loader.loadAsync(`assets/models/safety/${item.id}.glb`);
      if (gltf && gltf.scene) {
        object = gltf.scene;
        isGlb = true;
      }
    } catch {}
  }

  if (!object) {
    object = createProceduralModel(item.id);
  }

  normalizeBounds(object);

  const root = new THREE.Group();
  root.add(object);
  root.userData.itemId = item.id;
  root.userData.isGlb = isGlb;

  const sparkleRing = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.3, 32),
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
