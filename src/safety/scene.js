// ═══════════════════════════════════════════════════════════════════════════
// src/safety/scene.js — مشهد Three.js وطاولة فحص وتصنيف مواقف السلامة
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadSafetyItem } from './models.js';

export class SafetyScene {
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
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setClearColor(0x000000, 0);

    container.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label', 'طاولة فحص سلوكيات السلامة الكهربائية. اسحب لتدوير المجسم.');

    // المشهد والكاميرا
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    this.camera.position.set(3.8, 3.2, 4.8);

    // أداة التحكم بالدوران
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.75, 0);
    this.controls.enablePan = false;
    this.controls.minDistance = 2.8;
    this.controls.maxDistance = 9.5;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.enableDamping = !this.reduced;
    this.controls.dampingFactor = 0.08;
    this.controls.update();
    this.controls.saveState();

    // الإضاءة
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb0bcc7, 2.2));

    const sun = new THREE.DirectionalLight(0xfffaed, 2.8);
    sun.position.set(4, 8, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.normalBias = 0.035;
    this.scene.add(sun);

    const fillLight = new THREE.DirectionalLight(0xd4e2ff, 1.4);
    fillLight.position.set(-4, 3, -3);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfff3e0, 1.2);
    rimLight.position.set(0, 5, -5);
    this.scene.add(rimLight);

    // طاولة العرض الدائرية
    this.tableGroup = new THREE.Group();
    this.scene.add(this.tableGroup);

    const tableGeom = new THREE.CylinderGeometry(2.35, 2.45, 0.16, 64);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0xf4ead9,
      roughness: 0.85,
      metalness: 0.05
    });
    this.table = new THREE.Mesh(tableGeom, tableMat);
    this.table.position.y = -0.08;
    this.table.receiveShadow = true;
    this.tableGroup.add(this.table);

    // حلقة زينة خضراء/أمان حول طاولة العرض
    const rimGeom = new THREE.TorusGeometry(2.32, 0.018, 12, 64);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x38a169, roughness: 0.3, metalness: 0.8 });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.002;
    this.tableGroup.add(rim);

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();

    this.lastTime = performance.now();
    this.renderer.setAnimationLoop(() => this.frame());

    this.revision = 0;
    this.currentModel = null;
    this.shakeAmount = 0;
  }

  resize() {
    const { width, height } = this.container.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  async setItem(item) {
    const rev = ++this.revision;
    if (this.currentModel) {
      this.tableGroup.remove(this.currentModel);
      this.disposeModel(this.currentModel);
      this.currentModel = null;
    }

    const model = await loadSafetyItem(item);
    if (rev !== this.revision) {
      this.disposeModel(model);
      return;
    }

    this.currentModel = model;
    this.tableGroup.add(model);
    this.activeItem = item;
  }

  disposeModel(model) {
    if (!model) return;
    model.traverse(o => {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.filter(Boolean).forEach(m => m.dispose());
    });
  }

  celebrateSuccess() {
    if (this.currentModel?.userData.triggerCelebration) {
      this.currentModel.userData.triggerCelebration();
    }
  }

  shakeWrong() {
    this.shakeAmount = 0.25;
  }

  resetView() {
    this.controls.reset();
  }

  zoom(factor) {
    this.camera.position.sub(this.controls.target).multiplyScalar(factor).add(this.controls.target);
    this.controls.update();
  }

  frame() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.currentModel?.userData.animate) {
      this.currentModel.userData.animate(dt, true, this.reduced);
    }

    if (this.shakeAmount > 0) {
      this.shakeAmount = Math.max(0, this.shakeAmount - dt * 1.5);
      this.tableGroup.position.x = Math.sin(now * 0.05) * this.shakeAmount * 0.3;
    } else {
      this.tableGroup.position.x = 0;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.renderer.setAnimationLoop(null);
    this.observer?.disconnect();
    if (this.currentModel) this.disposeModel(this.currentModel);
    this.renderer.dispose();
  }
}
