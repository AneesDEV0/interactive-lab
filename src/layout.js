// ═══════════════════════════════════════════════════════════════════════════
// src/layout.js — إدارة المنصات الدائرية (Plinths) وتطبيع الأحجام وكاميرا fitToDevices
// ترتيب 1×4 أفقي دائم، تطبيع دقيق للأبعاد بالأرقام، ومحاذاة القواعد
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';

// المراكز الأفقية الثابتة للمنصات الأربع على الطاولة (1×4 دائماً)
export const PLINTH_X_SLOTS = [-2.85, -0.95, 0.95, 2.85];
export const TABLE_SURFACE_Y = 1.88;
export const PLINTH_HEIGHT = 0.12;
export const PLINTH_TOP_Y = TABLE_SURFACE_Y + PLINTH_HEIGHT;

/**
 * إنشاء منصة عرض دائرية مصقولة (Turntable Plinth) برقم وظل تلامس ناعم
 */
export function createPlinth(slotIndex, materials) {
  const group = new THREE.Group();
  group.name = `plinth_${slotIndex}`;
  const xPos = PLINTH_X_SLOTS[slotIndex] || 0;
  group.position.set(xPos, TABLE_SURFACE_Y, 0);

  // 1. ظل التلامس الناعم أسفل المنصة (Blob / Contact Shadow)
  const shadowGeo = new THREE.PlaneGeometry(2.3, 2.3);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128; shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d');
  const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.35)');
  grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.12)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.005;
  group.add(shadowMesh);

  // 2. جسم المنصة الدائري اللامع
  const plinthGeo = new THREE.CylinderGeometry(0.85, 0.90, PLINTH_HEIGHT, 36);
  const plinthMesh = new THREE.Mesh(plinthGeo, materials.plinthBase);
  plinthMesh.position.y = PLINTH_HEIGHT / 2;
  plinthMesh.receiveShadow = true;
  group.add(plinthMesh);

  // 3. حافة دائرية معدنية أنيقة
  const rimGeo = new THREE.TorusGeometry(0.86, 0.018, 12, 36);
  const rimMesh = new THREE.Mesh(rimGeo, materials.custom(0x0f766e, { roughness: 0.3 }));
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = PLINTH_HEIGHT;
  group.add(rimMesh);

  // 4. رقم المنصة البارز في الأمام (1 - 4)
  const numCanvas = document.createElement('canvas');
  numCanvas.width = 128; numCanvas.height = 128;
  const nCtx = numCanvas.getContext('2d');
  nCtx.fillStyle = '#0f172a';
  nCtx.beginPath();
  nCtx.arc(64, 64, 50, 0, Math.PI * 2);
  nCtx.fill();
  nCtx.lineWidth = 5;
  nCtx.strokeStyle = '#2ec4b6';
  nCtx.stroke();
  nCtx.fillStyle = '#f8fafc';
  nCtx.font = 'bold 60px Arial';
  nCtx.textAlign = 'center';
  nCtx.textBaseline = 'middle';
  nCtx.fillText(String(slotIndex + 1), 64, 66);

  const numTex = new THREE.CanvasTexture(numCanvas);
  numTex.colorSpace = THREE.SRGBColorSpace;
  const numMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true });
  const numMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36), numMat);
  numMesh.position.set(0, PLINTH_HEIGHT / 2, 0.88);
  numMesh.rotation.y = 0;
  group.add(numMesh);

  return group;
}

/**
 * تطبيع الحجم وضبط قاعدة المجسم على سطح المنصة بدقة (Box3 Normalization)
 */
export function normalizeDeviceOnPlinth(deviceGroup, targetUnitSize = 1.35) {
  deviceGroup.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(deviceGroup);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0.001) {
    const scaleFactor = targetUnitSize / maxDim;
    deviceGroup.scale.multiplyScalar(scaleFactor);
  }

  deviceGroup.updateMatrixWorld(true);
  const scaledBox = new THREE.Box3().setFromObject(deviceGroup);
  const scaledCenter = new THREE.Vector3();
  scaledBox.getCenter(scaledCenter);

  deviceGroup.position.x = -scaledCenter.x;
  deviceGroup.position.z = -scaledCenter.z;
  deviceGroup.position.y = -scaledBox.min.y;

  const wrapper = new THREE.Group();
  wrapper.add(deviceGroup);
  return wrapper;
}

/**
 * حساب إحداثيات الكاميرا التلقائي (fitToDevices)
 */
export function calculateCameraFrustum(hostWidth, hostHeight, zoom = 1.0, isPortrait = false) {
  const aspect = hostWidth / hostHeight;
  const totalTableWidth = 7.6;
  let frustumSize;

  if (isPortrait) {
    frustumSize = (totalTableWidth / aspect) * 1.15 / zoom;
  } else {
    frustumSize = 9.8 / zoom;
  }

  return {
    left: -frustumSize * aspect / 2,
    right: frustumSize * aspect / 2,
    top: frustumSize / 2,
    bottom: -frustumSize / 2,
    frustumSize
  };
}
