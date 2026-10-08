// ═══════════════════════════════════════════════════════════════════════════
// src/materials/scene.js — إدارة مشهد Three.js وطاولة الاستكشاف ثلاثية الأبعاد
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadMaterialItem } from './models.js';

export class MaterialsScene {
  constructor(container, hooks = {}) {
    this.container = container;
    this.hooks = hooks;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // تهيئة عارض WebGL بأعلى جودة بصرية
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setClearColor(0x000000, 0);

    container.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label', 'طاولة استكشاف خامات البيئة. اسحب لتدوير المجسم.');

    // المشهد والكاميرا
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    this.camera.position.set(3.8, 3.2, 4.8);

    // أداة التحكم بالدوران OrbitControls
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

    // الإضاءة البيئية والموجهة المضيئة
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

    // توليد خريطة بيئة استوديو محيطة عاكسة لإبراز لمعان وبريق المعادن والزجاج
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const envScene = new THREE.Scene();
      envScene.add(new THREE.HemisphereLight(0xffffff, 0xcfd8e6, 2.5));
      const envL1 = new THREE.DirectionalLight(0xffffff, 3.0);
      envL1.position.set(5, 7, 5);
      envScene.add(envL1);
      const envL2 = new THREE.DirectionalLight(0xdbe7ff, 2.0);
      envL2.position.set(-5, 4, -4);
      envScene.add(envL2);
      this.scene.environment = pmrem.fromScene(envScene).texture;
      pmrem.dispose();
    } catch { }

    // طاولة العرض الدائرية (Pedestal)
    this.tableGroup = new THREE.Group();
    this.scene.add(this.tableGroup);

    // قرص الطاولة الخشبي الأنيق
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

    // حلقة زينة ذهبية حول قرص الطاولة
    const rimGeom = new THREE.TorusGeometry(2.32, 0.018, 12, 64);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd8ba6e, roughness: 0.3, metalness: 0.8 });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.002;
    this.tableGroup.add(rim);

    // مراقبة أبعاد الحاوية
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();

    // حلقة التحريك والتقديم Animation Loop
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

  /**
   * تعيين العنصر المعروض على طاولة الاستكشاف
   */
  async setItem(item) {
    const rev = ++this.revision;
    if (this.currentModel) {
      this.tableGroup.remove(this.currentModel);
      this.disposeModel(this.currentModel);
      this.currentModel = null;
    }

    const model = await loadMaterialItem(item);
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

  /**
   * تشغيل حركة الاحتفال عند الإجابة الصحيحة
   */
  celebrateSuccess() {
    if (this.currentModel?.userData.triggerCelebration) {
      this.currentModel.userData.triggerCelebration();
    }
  }

  /**
   * تشغيل هزة تنبيهية لطيفة عند التصنيف غير الصحيح
   */
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

    // تطبيق حركة النموذج
    if (this.currentModel?.userData.animate) {
      this.currentModel.userData.animate(dt, true, this.reduced);
    }

    // هزة الخطأ الخفيفة
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
