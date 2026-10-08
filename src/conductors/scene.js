// ═══════════════════════════════════════════════════════════════════════════
// src/conductors/scene.js — مشهد Three.js وطاولة الفحص للموصلات والعوازل
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadConductorItem } from './models.js';

export class ConductorsScene {
  constructor(container, hooks = {}) {
    this.container = container;
    this.hooks = hooks;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // تهيئة عارض WebGL
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setClearColor(0x000000, 0);

    container.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label', 'طاولة فحص المواد. اسحب لتدوير المجسم.');

    // المشهد والكاميرا
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    this.camera.position.set(3.5, 3.0, 4.5);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.4, 0);
    this.controls.enablePan = false;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 8.5;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.enableDamping = !this.reduced;
    this.controls.dampingFactor = 0.08;
    this.controls.update();

    // الإضاءة
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb0bcc7, 2.0));

    const sun = new THREE.DirectionalLight(0xfffaed, 2.6);
    sun.position.set(4, 7, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.normalBias = 0.03;
    this.scene.add(sun);

    const fillLight = new THREE.DirectionalLight(0xd4e2ff, 1.3);
    fillLight.position.set(-4, 2, -3);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfff3e0, 1.0);
    rimLight.position.set(0, 4, -4);
    this.scene.add(rimLight);

    // قاعدة الفحص الأنيقة (Pedestal)
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.22, 36);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1
    });
    this.pedestal = new THREE.Mesh(baseGeo, baseMat);
    this.pedestal.position.y = -1.4;
    this.pedestal.receiveShadow = true;
    this.scene.add(this.pedestal);

    // حلقة ضوئية حول القاعدة
    const ringGeo = new THREE.RingGeometry(1.65, 1.78, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x7560af,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.28;
    this.scene.add(ring);

    this.currentMesh = null;
    this.autoRotate = true;
    this.clock = new THREE.Clock();

    this.onResize = this.resize.bind(this);
    window.addEventListener('resize', this.onResize);
    this.resize();
    this.animate();
  }

  resize() {
    const w = this.container.clientWidth || 300;
    const h = this.container.clientHeight || 300;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  async setItem(item) {
    if (this.currentMesh) {
      this.scene.remove(this.currentMesh);
      this.currentMesh = null;
    }

    const mesh = await loadConductorItem(item);
    mesh.position.set(0, 0, 0);

    // ضبط المقياس والموقع
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 2.6) {
      const scale = 2.4 / maxDim;
      mesh.scale.set(scale, scale, scale);
    }

    this.scene.add(mesh);
    this.currentMesh = mesh;

    // إعادة توجيه الكاميرا
    this.controls.reset();
    this.camera.position.set(3.4, 2.8, 4.2);
    this.controls.update();
  }

  resetView() {
    this.camera.position.set(3.4, 2.8, 4.2);
    this.controls.target.set(0, 0.4, 0);
    this.controls.update();
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  animate() {
    this.raf = requestAnimationFrame(this.animate.bind(this));
    const delta = this.clock.getDelta();

    if (this.currentMesh && this.autoRotate && !this.reduced) {
      this.currentMesh.rotation.y += delta * 0.55;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.remove();
    }
  }
}
