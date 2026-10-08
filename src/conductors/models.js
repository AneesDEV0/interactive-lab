// ═══════════════════════════════════════════════════════════════════════════
// src/conductors/models.js — المجسمات ثلاثية الأبعاد للمواد الموصلة والعازلة
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();

// خامات فيزيائية أساسية PBR
const materials = {
  steel: new THREE.MeshStandardMaterial({
    color: 0xdfe6e9,
    roughness: 0.18,
    metalness: 0.88
  }),
  steelDark: new THREE.MeshStandardMaterial({
    color: 0x95a5a6,
    roughness: 0.25,
    metalness: 0.82
  }),
  copper: new THREE.MeshStandardMaterial({
    color: 0xd35400,
    roughness: 0.22,
    metalness: 0.85
  }),
  wood: new THREE.MeshStandardMaterial({
    color: 0xe67e22,
    roughness: 0.8,
    metalness: 0.02
  }),
  woodTip: new THREE.MeshStandardMaterial({
    color: 0xf5cd79,
    roughness: 0.75,
    metalness: 0.02
  }),
  graphite: new THREE.MeshStandardMaterial({
    color: 0x2d3436,
    roughness: 0.3,
    metalness: 0.6
  }),
  plasticBlue: new THREE.MeshPhysicalMaterial({
    color: 0x0984e3,
    transmission: 0.75,
    opacity: 0.9,
    transparent: true,
    roughness: 0.15,
    ior: 1.48
  }),
  plasticRed: new THREE.MeshStandardMaterial({
    color: 0xd63031,
    roughness: 0.3,
    metalness: 0.05
  }),
  rubberPink: new THREE.MeshStandardMaterial({
    color: 0xff7675,
    roughness: 0.9,
    metalness: 0.0
  }),
  rubberBlue: new THREE.MeshStandardMaterial({
    color: 0x74b9ff,
    roughness: 0.9,
    metalness: 0.0
  }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0x55efc4,
    transmission: 0.92,
    opacity: 1,
    transparent: true,
    roughness: 0.06,
    ior: 1.52,
    thickness: 0.8
  })
};

/**
 * بناء مجسم إجرائي للمسمار الحديدي
 */
function createNail() {
  const group = new THREE.Group();

  // رأس المسمار المسطح
  const headGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24);
  const head = new THREE.Mesh(headGeo, materials.steel);
  head.position.y = 1.4;
  head.castShadow = true;
  group.add(head);

  // ساق المسمار
  const shaftGeo = new THREE.CylinderGeometry(0.18, 0.16, 2.4, 20);
  const shaft = new THREE.Mesh(shaftGeo, materials.steel);
  shaft.position.y = 0.2;
  shaft.castShadow = true;
  group.add(shaft);

  // رأس المسمار المدبب (السن)
  const tipGeo = new THREE.ConeGeometry(0.16, 0.5, 20);
  const tip = new THREE.Mesh(tipGeo, materials.steel);
  tip.position.y = -1.25;
  tip.rotation.x = Math.PI;
  tip.castShadow = true;
  group.add(tip);

  return group;
}

/**
 * بناء مجسم قلم الرصاص الخشبي
 */
function createPencil() {
  const group = new THREE.Group();

  // جسم القلم السداسي الخشبي
  const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.6, 6);
  const body = new THREE.Mesh(bodyGeo, materials.wood);
  body.castShadow = true;
  group.add(body);

  // سن الخشب المخروطي
  const woodTipGeo = new THREE.ConeGeometry(0.3, 0.7, 16);
  const woodTip = new THREE.Mesh(woodTipGeo, materials.woodTip);
  woodTip.position.y = 1.65;
  woodTip.castShadow = true;
  group.add(woodTip);

  // سن الجرافيت الأسود
  const leadGeo = new THREE.ConeGeometry(0.12, 0.28, 16);
  const lead = new THREE.Mesh(leadGeo, materials.graphite);
  lead.position.y = 1.86;
  lead.castShadow = true;
  group.add(lead);

  // طوق الممحاة المعدني
  const collarGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.3, 16);
  const collar = new THREE.Mesh(collarGeo, materials.steelDark);
  collar.position.y = -1.45;
  group.add(collar);

  // الممحاة في الخلف
  const eraserGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.35, 16);
  const eraser = new THREE.Mesh(eraserGeo, materials.rubberPink);
  eraser.position.y = -1.75;
  group.add(eraser);

  return group;
}

/**
 * بناء مجسم الملعقة المعدنية
 */
function createSpoon() {
  const group = new THREE.Group();

  // مقبض الملعقة
  const handleGeo = new THREE.BoxGeometry(0.24, 2.6, 0.08);
  const handle = new THREE.Mesh(handleGeo, materials.steel);
  handle.position.y = -0.3;
  handle.castShadow = true;
  group.add(handle);

  // تجويف الملعقة البيضاوي
  const bowlGeo = new THREE.SphereGeometry(0.65, 24, 16);
  bowlGeo.scale(1, 1.4, 0.45);
  const bowl = new THREE.Mesh(bowlGeo, materials.steel);
  bowl.position.set(0, 1.35, 0.1);
  bowl.rotation.x = 0.2;
  bowl.castShadow = true;
  group.add(bowl);

  return group;
}

/**
 * بناء مجسم المسطرة البلاستيكية
 */
function createRuler() {
  const group = new THREE.Group();

  const rulerGeo = new THREE.BoxGeometry(1.0, 3.2, 0.08);
  const ruler = new THREE.Mesh(rulerGeo, materials.plasticBlue);
  ruler.castShadow = true;
  group.add(ruler);

  // تدريجات المسطرة البيضاء
  for (let i = -1.4; i <= 1.4; i += 0.25) {
    const markGeo = new THREE.BoxGeometry(0.25, 0.02, 0.09);
    const markMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mark = new THREE.Mesh(markGeo, markMat);
    mark.position.set(-0.35, i, 0);
    group.add(mark);
  }

  return group;
}

/**
 * بناء مجسم السلك النحاسي
 */
function createWire() {
  const group = new THREE.Group();

  // غلاف السلك البلاستيكي الأوسط
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.0, -1.0, 0),
    new THREE.Vector3(-0.4, 0.6, 0.2),
    new THREE.Vector3(0.4, -0.4, -0.2),
    new THREE.Vector3(1.0, 1.0, 0)
  ]);
  const jacketGeo = new THREE.TubeGeometry(curve, 32, 0.22, 16, false);
  const jacket = new THREE.Mesh(jacketGeo, materials.plasticRed);
  jacket.castShadow = true;
  group.add(jacket);

  // طرف النحاس المكشوف الأيمن
  const tip1Geo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16);
  const tip1 = new THREE.Mesh(tip1Geo, materials.copper);
  tip1.position.set(1.2, 1.25, 0);
  tip1.rotation.z = -0.8;
  tip1.castShadow = true;
  group.add(tip1);

  // طرف النحاس المكشوف الأيسر
  const tip2Geo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16);
  const tip2 = new THREE.Mesh(tip2Geo, materials.copper);
  tip2.position.set(-1.2, -1.25, 0);
  tip2.rotation.z = -0.8;
  tip2.castShadow = true;
  group.add(tip2);

  return group;
}

/**
 * بناء مجسم الممحاة المطاطية
 */
function createEraser() {
  const group = new THREE.Group();

  // نصف وردي
  const part1Geo = new THREE.BoxGeometry(1.6, 0.9, 0.5);
  const part1 = new THREE.Mesh(part1Geo, materials.rubberPink);
  part1.position.x = 0.8;
  part1.castShadow = true;
  group.add(part1);

  // نصف أزرق
  const part2Geo = new THREE.BoxGeometry(1.6, 0.9, 0.5);
  const part2 = new THREE.Mesh(part2Geo, materials.rubberBlue);
  part2.position.x = -0.8;
  part2.castShadow = true;
  group.add(part2);

  group.rotation.z = 0.2;
  return group;
}

/**
 * بناء مجسم مشبك الورق المعدني
 */
function createClip() {
  const group = new THREE.Group();

  const points = [
    new THREE.Vector3(-0.4, -1.2, 0),
    new THREE.Vector3(-0.4, 1.0, 0),
    new THREE.Vector3(0.0, 1.4, 0),
    new THREE.Vector3(0.4, 1.0, 0),
    new THREE.Vector3(0.4, -1.4, 0),
    new THREE.Vector3(0.0, -1.7, 0),
    new THREE.Vector3(-0.7, -1.4, 0),
    new THREE.Vector3(-0.7, 1.2, 0),
    new THREE.Vector3(0.0, 1.8, 0),
    new THREE.Vector3(0.7, 1.2, 0),
    new THREE.Vector3(0.7, -0.6, 0)
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const clipGeo = new THREE.TubeGeometry(curve, 64, 0.08, 12, false);
  const clip = new THREE.Mesh(clipGeo, materials.steel);
  clip.castShadow = true;
  group.add(clip);

  return group;
}

/**
 * بناء مجسم الكرة الزجاجية
 */
function createMarble() {
  const group = new THREE.Group();

  // الكرة الشفافة
  const sphereGeo = new THREE.SphereGeometry(1.1, 32, 24);
  const sphere = new THREE.Mesh(sphereGeo, materials.glass);
  sphere.castShadow = true;
  group.add(sphere);

  // تموج داخلي ملون
  const swirlCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.6, -0.6, -0.2),
    new THREE.Vector3(0.2, -0.1, 0.3),
    new THREE.Vector3(-0.1, 0.4, -0.3),
    new THREE.Vector3(0.6, 0.6, 0.1)
  ]);
  const swirlGeo = new THREE.TubeGeometry(swirlCurve, 24, 0.16, 12, false);
  const swirlMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.3 });
  const swirl = new THREE.Mesh(swirlGeo, swirlMat);
  group.add(swirl);

  return group;
}

/**
 * الدالة الرئيسية لتحميل أو إنشاء مجسم العنصر
 * @param {object} item كائن بيانات العنصر
 */
export async function loadConductorItem(item) {
  // محاولة تحميل ملف GLB إن كان متوفراً
  try {
    const gltf = await new Promise((resolve, reject) => {
      gltfLoader.load(
        `assets/models/conductors/${item.id}.glb`,
        resolve,
        undefined,
        reject
      );
    });
    if (gltf && gltf.scene) {
      gltf.scene.traverse(node => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      return gltf.scene;
    }
  } catch {
    // اللجوء الإجرائي البديع
  }

  switch (item.id) {
    case 'iron_nail':
      return createNail();
    case 'wooden_pencil':
      return createPencil();
    case 'metal_spoon':
      return createSpoon();
    case 'plastic_ruler':
      return createRuler();
    case 'copper_wire':
      return createWire();
    case 'rubber_eraser':
      return createEraser();
    case 'paper_clip':
      return createClip();
    case 'glass_marble':
      return createMarble();
    default:
      return createNail();
  }
}
