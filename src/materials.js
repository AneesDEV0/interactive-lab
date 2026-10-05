// ═══════════════════════════════════════════════════════════════════════════
// src/materials.js — نظام الخامات الفيزيائية (PBR) والنسيج الإجرائي
// خامات واقعية وخفيفة بدون تحميل ملفات خارجية، متوافقة مع جوالات الطلاب
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';

const textureCache = new Map();
const materialCache = new Map();

/**
 * توليد نسيج معدن مصقول إجرائي
 */
export function getBrushedMetalTexture() {
  if (textureCache.has('brushed_metal')) return textureCache.get('brushed_metal');

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b0bec5';
  ctx.fillRect(0, 0, 256, 256);

  // خطوط مصقولة أفقية
  for (let y = 0; y < 256; y += 2) {
    const shade = Math.floor(160 + Math.random() * 55);
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.35)`;
    ctx.fillRect(0, y, 256, 1 + Math.random());
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('brushed_metal', texture);
  return texture;
}

/**
 * توليد نسيج شبكة تهوية
 */
export function getVentGridTexture() {
  if (textureCache.has('vent_grid')) return textureCache.get('vent_grid');

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#0f172a';
  for (let y = 8; y < 128; y += 16) {
    for (let x = 8; x < 128; x += 16) {
      ctx.beginPath();
      ctx.roundRect(x, y, 10, 8, 3);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('vent_grid', texture);
  return texture;
}

/**
 * توليد ملصق المواصفات الكهربائية (220V أو 1.5V)
 */
export function getSpecLabelTexture(title = '220V 50Hz', sub = 'RATED POWER') {
  const key = `spec_${title}_${sub}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 120);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, 128, 54);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(sub, 128, 92);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * توليد نسيج سطح خشب الطاولة المصقول
 */
export function getWoodTableTexture() {
  if (textureCache.has('table_wood')) return textureCache.get('table_wood');

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f7eed4';
  ctx.fillRect(0, 0, 512, 512);

  // حبيبات خشبية ناعمة
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const w = 40 + Math.random() * 120;
    const h = 2 + Math.random() * 3;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(217, 185, 137, 0.25)' : 'rgba(240, 225, 195, 0.35)';
    ctx.fillRect(x, y, w, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('table_wood', texture);
  return texture;
}

/**
 * نسيج شاشة LCD رقمية
 */
export function getLCDTexture(text = '0.00 kg') {
  const key = `lcd_${text}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#86efac';
  ctx.fillRect(0, 0, 256, 128);

  ctx.fillStyle = '#064e3b';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * مولد الخامات PBR المتقدمة
 */
export function createPBRMaterials(palette = {}) {
  const p = {
    blue: 0x3093d7,
    navy: 0x254a61,
    mint: 0x2ec4b6,
    yellow: 0xffb703,
    white: 0xf8fafc,
    dark: 0x1e293b,
    silver: 0xcfd8dc,
    red: 0xef4444,
    orange: 0xfb8500,
    gold: 0xf59e0b,
    ...palette
  };

  function getMat(key, factory) {
    if (!materialCache.has(key)) {
      materialCache.set(key, factory());
    }
    return materialCache.get(key);
  }

  return {
    // بلاستيك أبيض لامع مع Clearcoat (للغسالة، الثلاجة، المكيف)
    glossyWhite: getMat('glossyWhite', () => new THREE.MeshPhysicalMaterial({
      color: p.white,
      roughness: 0.22,
      metalness: 0.05,
      clearcoat: 0.65,
      clearcoatRoughness: 0.15
    })),

    // بلاستيك كحلي ناعم
    matteNavy: getMat('matteNavy', () => new THREE.MeshStandardMaterial({
      color: p.navy,
      roughness: 0.45,
      metalness: 0.1
    })),

    // بلاستيك أصفر زاهٍ للألعاب
    toyYellow: getMat('toyYellow', () => new THREE.MeshPhysicalMaterial({
      color: p.yellow,
      roughness: 0.3,
      metalness: 0.02,
      clearcoat: 0.5
    })),

    // بلاستيك تركوازي
    toyMint: getMat('toyMint', () => new THREE.MeshPhysicalMaterial({
      color: p.mint,
      roughness: 0.3,
      metalness: 0.02,
      clearcoat: 0.5
    })),

    // بلاستيك أحمر
    toyRed: getMat('toyRed', () => new THREE.MeshPhysicalMaterial({
      color: p.red,
      roughness: 0.32,
      metalness: 0.02,
      clearcoat: 0.5
    })),

    // معدن مصقول (ستانلس ستيل) للمقابض والمحاور
    brushedMetal: getMat('brushedMetal', () => new THREE.MeshStandardMaterial({
      color: 0xdde5eb,
      metalness: 0.88,
      roughness: 0.28,
      roughnessMap: getBrushedMetalTexture()
    })),

    // ذهبي / نحاسي للأقطاب ونوابض البطارية
    brass: getMat('brass', () => new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.25
    })),

    // كروم فضي فائق اللمعان
    chrome: getMat('chrome', () => new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.96,
      roughness: 0.12
    })),

    // زجاج حقيقي ناقل للضوء (للخلاط، نافذة الميكروويف، الغسالة)
    glass: getMat('glass', () => new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.88,
      opacity: 1,
      transparent: true,
      roughness: 0.08,
      ior: 1.5,
      thickness: 0.4,
      specularIntensity: 1.0
    })),

    // زجاج مدخن / معتم للميكروويف
    smokedGlass: getMat('smokedGlass', () => new THREE.MeshPhysicalMaterial({
      color: 0x334155,
      transmission: 0.6,
      opacity: 1,
      transparent: true,
      roughness: 0.12,
      ior: 1.52,
      thickness: 0.3
    })),

    // مطاط داكن للعجلات والأرجل والأزرار
    rubberDark: getMat('rubberDark', () => new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.82,
      metalness: 0.02
    })),

    // سطح منصة العرض الدوارة المصقولة (Plinth)
    plinthBase: getMat('plinthBase', () => new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.18,
      metalness: 0.08,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1
    })),

    // حلقة ذهبية لمنصة العرض
    plinthRim: getMat('plinthRim', () => new THREE.MeshStandardMaterial({
      color: 0x2ec4b6,
      metalness: 0.7,
      roughness: 0.3
    })),

    // سطح الطاولة
    tableTop: getMat('tableTop', () => new THREE.MeshStandardMaterial({
      color: 0xfbf6e9,
      map: getWoodTableTexture(),
      roughness: 0.55,
      metalness: 0.02
    })),

    // دالة إنشاء خامة لونية مخصصة ومخزنة مؤقتاً
    custom(color, { roughness = 0.5, metalness = 0.05, clearcoat = 0, isEmissive = false } = {}) {
      const key = `c_${color}_${roughness}_${metalness}_${clearcoat}_${isEmissive}`;
      return getMat(key, () => new THREE.MeshPhysicalMaterial({
        color,
        roughness,
        metalness,
        clearcoat,
        emissive: isEmissive ? new THREE.Color(color) : new THREE.Color(0x000000),
        emissiveIntensity: isEmissive ? 1.0 : 0
      }));
    }
  };
}

/**
 * تنظيف ذاكرة الخامات والنسيج عند إنهاء المشهد
 */
export function disposeMaterials() {
  materialCache.forEach(m => m.dispose());
  materialCache.clear();
  textureCache.forEach(t => t.dispose());
  textureCache.clear();
}
