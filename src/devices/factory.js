// ═══════════════════════════════════════════════════════════════════════════
// src/devices/factory.js — مصنع المجسمات ثلاثية الأبعاد الواقعية للأجهزة الـ 24
// خامات فيزيائية PBR وتفاصيل هندسية دقيقة (حجرات بطاريات، أقطاب، فيش 220V)
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { getSpecLabelTexture, getVentGridTexture, getLCDTexture } from '../materials.js';

export function createDevice3D(id, materials) {
  const root = new THREE.Group();
  root.name = id;
  const fx = {};
  const interactiveParts = {};

  // دوال مساعدة لإنشاء الأشكال الهندسية المحسنة
  const box = (w, h, d, mat, x = 0, y = 0, z = 0, r = 0.05) => {
    const geo = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 3, h / 3, d / 3));
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  };

  const cyl = (rTop, rBot, h, mat, x = 0, y = 0, z = 0, seg = 28) => {
    const geo = new THREE.CylinderGeometry(rTop, rBot, h, seg);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  };

  const sphere = (r, mat, x = 0, y = 0, z = 0) => {
    const geo = new THREE.SphereGeometry(r, 20, 16);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    root.add(m);
    return m;
  };

  // ─── حجرة البطاريات المفصلة للأجهزة المحمولة ───
  function attachDetailedBatteryBay(parent, count = 2, type = 'AA', x = 0, y = 0.2, z = 0.4) {
    const bayGroup = new THREE.Group();
    bayGroup.position.set(x, y, z);

    // تجويف الحجرة
    const cavity = new THREE.Mesh(new RoundedBoxGeometry(0.85, 0.32, 0.24, 2, 0.02), materials.rubberDark);
    bayGroup.add(cavity);

    // بطاريات أسطوانية داخل الحجرة
    const batMeshes = [];
    for (let i = 0; i < count; i++) {
      const bX = (i - (count - 1) / 2) * 0.34;
      const bGroup = new THREE.Group();
      bGroup.position.set(bX, 0, 0);

      // جسم البطارية
      const bBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.52, 16), materials.toyMint);
      bBody.rotation.z = Math.PI / 2;
      bGroup.add(bBody);

      // قطب موجب (+) ذهبي
      const bPolePos = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12), materials.brass);
      bPolePos.rotation.z = Math.PI / 2;
      bPolePos.position.x = 0.28;
      bGroup.add(bPolePos);

      // نابض سالب (−) فضي
      const bSpring = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), materials.chrome);
      bSpring.rotation.z = Math.PI / 2;
      bSpring.position.x = -0.28;
      bGroup.add(bSpring);

      bayGroup.add(bGroup);
      batMeshes.push(bGroup);
    }

    // غطاء الحجرة القابل للفتح
    const cover = new THREE.Mesh(new RoundedBoxGeometry(0.88, 0.35, 0.04, 2, 0.02), materials.glossyWhite);
    cover.position.set(0, 0, 0.13);
    bayGroup.add(cover);

    parent.add(bayGroup);
    interactiveParts.batteryBay = { group: bayGroup, cover, batteries: batMeshes };
    return bayGroup;
  }

  // ─── سلك وقابس الكهرباء 220V للأجهزة الجدارية ───
  function attachDetailedMainsPlug(parent, x = 0, y = 0.15, z = -0.5) {
    const plugGroup = new THREE.Group();
    plugGroup.position.set(x, y, z);

    // سلك مرن منحني
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.1, -0.08, 0.15),
      new THREE.Vector3(0.05, -0.12, 0.35),
      new THREE.Vector3(0, -0.12, 0.55)
    ]);
    const cordMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.035, 8, false), materials.rubberDark);
    plugGroup.add(cordMesh);

    // رأس الفيشة 220V
    const plugHead = new THREE.Group();
    plugHead.position.set(0, -0.12, 0.65);
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.18, 0.32, 2, 0.04), materials.rubberDark);
    plugHead.add(body);

    // مسماران معدنيان مصقولان (Pins)
    const pin1 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.15, 12), materials.brushedMetal);
    pin1.rotation.x = Math.PI / 2;
    pin1.position.set(-0.06, 0, 0.22);
    plugHead.add(pin1);

    const pin2 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.15, 12), materials.brushedMetal);
    pin2.rotation.x = Math.PI / 2;
    pin2.position.set(0.06, 0, 0.22);
    plugHead.add(pin2);

    plugGroup.add(plugHead);
    parent.add(plugGroup);
    interactiveParts.mainsPlug = { group: plugGroup, plugHead };
    return plugGroup;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // بناء المجسمات الـ 24 بتفاصيل واقعية
  // ═══════════════════════════════════════════════════════════════════════════

  switch (id) {
    // 1. سيارة ألعاب
    case 'car':
    case 'toyCar': {
      box(1.5, 0.38, 0.9, materials.toyYellow, 0, 0.32, 0, 0.1);
      box(0.95, 0.42, 0.78, materials.toyYellow, -0.08, 0.68, 0, 0.1);
      box(0.72, 0.32, 0.8, materials.smokedGlass, -0.08, 0.72, 0, 0.05);

      // عجلات بمحاور
      fx.wheels = [];
      for (const x of [-0.48, 0.48]) {
        for (const z of [-0.48, 0.48]) {
          const wg = new THREE.Group();
          wg.position.set(x, 0.18, z);
          const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16), materials.rubberDark);
          tire.rotation.x = Math.PI / 2;
          const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.13, 12), materials.brushedMetal);
          rim.rotation.x = Math.PI / 2;
          wg.add(tire, rim);
          root.add(wg);
          fx.wheels.push(wg);
        }
      }

      // مصابيح أمامية
      fx.headlights = [];
      for (const z of [-0.28, 0.28]) {
        const hl = sphere(0.08, materials.custom(0xfef08a, { isEmissive: true }), 0.75, 0.32, z);
        hl.visible = false;
        fx.headlights.push(hl);
      }

      attachDetailedBatteryBay(root, 2, 'AA', -0.35, 0.28, 0);
      break;
    }

    // 2. راديو محمول
    case 'radio': {
      box(1.2, 0.85, 0.45, materials.matteNavy, 0, 0.48, 0, 0.08);
      // شبكة السماعة
      const grill = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshStandardMaterial({ map: getVentGridTexture() }));
      grill.position.set(-0.25, 0.48, 0.23);
      root.add(grill);

      // مؤشر التردد والضوء
      box(0.35, 0.18, 0.04, materials.custom(0x0f172a), 0.32, 0.65, 0.23);
      fx.radioLight = sphere(0.04, materials.custom(0x334155), 0.32, 0.45, 0.24);

      // قرص الصوت
      cyl(0.08, 0.08, 0.06, materials.brushedMetal, 0.32, 0.32, 0.24).rotation.x = Math.PI / 2;

      // هوائي تلسكوبي
      cyl(0.015, 0.015, 0.8, materials.chrome, -0.48, 1.05, -0.15);

      // موجات صوتية نابضة
      const wavesGroup = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.3 + i * 0.15, 0.34 + i * 0.15, 24), materials.custom(0x2ec4b6, { isEmissive: true }));
        ring.position.set(-0.25, 0.48, 0.25 + i * 0.08);
        wavesGroup.add(ring);
      }
      wavesGroup.visible = false;
      root.add(wavesGroup);
      fx.waves = wavesGroup;

      attachDetailedBatteryBay(root, 2, 'AA', 0, 0.42, -0.23);
      break;
    }

    // 3. كشاف الجيب
    case 'flashlight': {
      const body = cyl(0.18, 0.22, 1.1, materials.brushedMetal, 0, 0.6, 0);
      body.rotation.z = Math.PI / 2;

      const head = cyl(0.32, 0.22, 0.35, materials.matteNavy, 0.6, 0.6, 0);
      head.rotation.z = Math.PI / 2;

      // عدسة الضوء
      const lens = sphere(0.28, materials.glass, 0.72, 0.6, 0);
      lens.scale.set(0.2, 1, 1);

      // زر التشغيل
      box(0.12, 0.06, 0.08, materials.toyRed, 0.1, 0.78, 0);

      // شعاع الضوء المخروطي
      const beamGeo = new THREE.ConeGeometry(0.8, 2.2, 24, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.38, side: THREE.DoubleSide });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(1.8, 0.6, 0);
      beam.rotation.z = -Math.PI / 2;
      beam.visible = false;
      root.add(beam);
      fx.beam = beam;

      attachDetailedBatteryBay(root, 1, 'AA', -0.2, 0.6, 0.2);
      break;
    }

    // 4. ساعة الحائط
    case 'wallClock': {
      cyl(0.75, 0.75, 0.14, materials.glossyWhite, 0, 0.85, 0, 40).rotation.x = Math.PI / 2;
      cyl(0.70, 0.70, 0.04, materials.custom(0xffffff), 0, 0.85, 0.06, 40).rotation.x = Math.PI / 2;

      // إطار دائري
      const frameRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.04, 16, 40), materials.brushedMetal);
      frameRing.position.set(0, 0.85, 0.08);
      root.add(frameRing);

      // عقرب الساعات والدقائق
      fx.handH = box(0.04, 0.34, 0.02, materials.rubberDark, 0, 0.98, 0.09);
      fx.handM = box(0.03, 0.52, 0.02, materials.rubberDark, 0, 1.05, 0.1);

      // غطاء زجاجي
      const glassCover = new THREE.Mesh(new THREE.CircleGeometry(0.72, 32), materials.glass);
      glassCover.position.set(0, 0.85, 0.12);
      root.add(glassCover);

      attachDetailedBatteryBay(root, 1, 'AA', 0, 0.85, -0.08);
      break;
    }

    // 5. جهاز التحكم (الريموت)
    case 'remote': {
      box(0.48, 0.16, 1.3, materials.matteNavy, 0, 0.12, 0, 0.04);
      // أزرار مطاطية
      for (let z = -0.4; z <= 0.4; z += 0.18) {
        for (let x = -0.12; x <= 0.12; x += 0.24) {
          box(0.12, 0.05, 0.12, materials.rubberDark, x, 0.22, z, 0.02);
        }
      }
      // زر التشغيل الأحمر
      box(0.12, 0.06, 0.12, materials.toyRed, 0, 0.22, -0.52, 0.02);

      // لمبة الأشعة تحت الحمراء
      fx.irLed = sphere(0.04, materials.custom(0x334155), 0, 0.12, -0.66);

      // موجات تحت حمراء مرئية عند التشغيل
      const irRing = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.25, 20), materials.custom(0xef4444, { isEmissive: true }));
      irRing.position.set(0, 0.12, -0.85);
      irRing.rotation.x = Math.PI / 2;
      irRing.visible = false;
      root.add(irRing);
      fx.irWave = irRing;

      attachDetailedBatteryBay(root, 2, 'AAA', 0, 0.1, 0.35);
      break;
    }

    // 6. الآلة الحاسبة
    case 'calculator': {
      box(0.85, 0.14, 1.15, materials.custom(0x334155), 0, 0.12, 0, 0.05);
      // شاشة LCD
      const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.24), new THREE.MeshBasicMaterial({ map: getLCDTexture('123456') }));
      lcd.position.set(0, 0.2, -0.32);
      lcd.rotation.x = -Math.PI / 2;
      root.add(lcd);
      fx.screen = lcd;

      // أزرار الأرقام
      for (let z = -0.05; z <= 0.42; z += 0.15) {
        for (let x = -0.28; x <= 0.28; x += 0.18) {
          box(0.12, 0.04, 0.10, materials.rubberDark, x, 0.2, z, 0.02);
        }
      }

      attachDetailedBatteryBay(root, 1, 'AA', 0, 0.08, 0.25);
      break;
    }

    // 7. الميزان الرقمي
    case 'digitalScale': {
      box(1.2, 0.08, 1.2, materials.glass, 0, 0.08, 0, 0.08);
      box(1.15, 0.04, 1.15, materials.custom(0xf1f5f9), 0, 0.04, 0, 0.06);

      // شاشة الوزن الرقمية
      const scaleLcd = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.18), new THREE.MeshBasicMaterial({ map: getLCDTexture('0.00 kg') }));
      scaleLcd.position.set(0, 0.13, -0.35);
      scaleLcd.rotation.x = -Math.PI / 2;
      root.add(scaleLcd);
      fx.screen = scaleLcd;

      attachDetailedBatteryBay(root, 2, 'AAA', 0, 0.02, 0.25);
      break;
    }

    // 8. إنذار الدخان
    case 'smokeDetector': {
      cyl(0.65, 0.72, 0.25, materials.glossyWhite, 0, 0.2, 0, 32);
      // فتحات استشعار الدخان
      const vent = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 12, 28), materials.rubberDark);
      vent.position.set(0, 0.32, 0);
      vent.rotation.x = Math.PI / 2;
      root.add(vent);

      // زر الاختبار ومصباح التحذير
      fx.alarmLight = sphere(0.045, materials.custom(0x334155), 0, 0.33, 0);

      const ring = new THREE.Mesh(new THREE.RingGeometry(0.65, 0.8, 24), materials.custom(0xef4444, { isEmissive: true }));
      ring.position.set(0, 0.35, 0);
      ring.rotation.x = -Math.PI / 2;
      ring.visible = false;
      root.add(ring);
      fx.alarmRing = ring;

      attachDetailedBatteryBay(root, 1, 'AA', 0, 0.15, 0.35);
      break;
    }

    // 9. قلم الليزر
    case 'laserPointer': {
      cyl(0.08, 0.08, 1.2, materials.brushedMetal, 0, 0.6, 0).rotation.z = Math.PI / 2;
      box(0.06, 0.04, 0.06, materials.brass, 0, 0.68, 0);

      // شعاع الليزر والنقطة الحمراء
      const beam = cyl(0.015, 0.015, 2.5, materials.custom(0xef4444, { isEmissive: true }), 1.8, 0.6, 0);
      beam.rotation.z = Math.PI / 2;
      beam.visible = false;
      fx.laserBeam = beam;

      const dot = sphere(0.08, materials.custom(0xef4444, { isEmissive: true }), 3.1, 0.6, 0);
      dot.visible = false;
      fx.laserDot = dot;

      attachDetailedBatteryBay(root, 2, 'AAA', -0.25, 0.6, 0);
      break;
    }

    // 10. سماعة الأذن الطبية
    case 'hearingAid': {
      box(0.35, 0.55, 0.22, materials.custom(0xf6d8b8), 0, 0.35, 0, 0.06);
      cyl(0.04, 0.04, 0.45, materials.glass, 0.15, 0.65, 0).rotation.z = -0.5;

      // موجات التضخيم الصوتية
      const waves = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 16), materials.custom(0x2ec4b6, { isEmissive: true }));
      waves.position.set(0.3, 0.75, 0);
      waves.visible = false;
      root.add(waves);
      fx.aidWaves = waves;

      attachDetailedBatteryBay(root, 1, 'AA', 0, 0.25, 0.12);
      break;
    }

    // 11. روبوت الألعاب الذكي
    case 'robotToy': {
      // الرأس والجسم
      box(0.65, 0.52, 0.48, materials.glossyWhite, 0, 1.1, 0, 0.08);
      box(0.78, 0.65, 0.55, materials.toyMint, 0, 0.52, 0, 0.08);

      // أعين مضيئة
      fx.robotEyes = [
        sphere(0.06, materials.custom(0x0f172a), -0.16, 1.15, 0.25),
        sphere(0.06, materials.custom(0x0f172a), 0.16, 1.15, 0.25)
      ];

      // أذرع وهوائي
      cyl(0.025, 0.025, 0.28, materials.brushedMetal, 0, 1.45, 0);
      sphere(0.05, materials.toyYellow, 0, 1.6, 0);

      attachDetailedBatteryBay(root, 3, 'AA', 0, 0.52, -0.3);
      break;
    }

    // 12. فرشاة الأسنان الكهربائية
    case 'electricToothbrush': {
      cyl(0.12, 0.14, 1.1, materials.glossyWhite, 0, 0.6, 0, 24);
      box(0.16, 0.35, 0.1, materials.toyMint, 0, 0.65, 0.08, 0.04);
      // زر التشغيل
      sphere(0.045, materials.rubberDark, 0, 0.75, 0.14);

      // رأس الفرشاة الدوار
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.25, 0);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.35, 16), materials.glossyWhite);
      const bristles = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16), materials.custom(0x38bdf8));
      bristles.position.set(0, 0.2, 0.04);
      bristles.rotation.x = Math.PI / 2;
      headGroup.add(stem, bristles);
      root.add(headGroup);
      fx.brushHead = headGroup;

      attachDetailedBatteryBay(root, 1, 'AA', 0, 0.25, 0);
      break;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // أجهزة الكهرباء المنزلية 220V
    // ═════════════════════════════════════════════════════════════════════════

    // 13. الثلاجة
    case 'fridge': {
      box(1.15, 2.1, 1.05, materials.brushedMetal, 0, 1.08, 0, 0.08);
      // خط فاصل بين الفريزر والكابينة
      box(1.16, 0.025, 1.06, materials.rubberDark, 0, 1.45, 0);
      // مقابض معدنية
      cyl(0.025, 0.025, 0.45, materials.chrome, 0.45, 1.7, 0.56);
      cyl(0.025, 0.025, 0.65, materials.chrome, 0.45, 0.9, 0.56);

      // ملصق كفاءة الطاقة 220V
      const spec = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.35), new THREE.MeshBasicMaterial({ map: getSpecLabelTexture('220V', 'A+++') }));
      spec.position.set(-0.35, 1.75, 0.54);
      root.add(spec);

      fx.fridgeLight = sphere(0.06, materials.custom(0x334155), 0, 1.1, 0.54);
      attachDetailedMainsPlug(root, 0, 0.15, -0.6);
      break;
    }

    // 14. الميكروويف
    case 'microwave': {
      box(1.45, 0.88, 0.95, materials.glossyWhite, 0, 0.48, 0, 0.06);
      // باب زجاجي مدخن
      const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.65), materials.smokedGlass);
      windowMesh.position.set(-0.2, 0.48, 0.49);
      root.add(windowMesh);

      // لوحة التحكم الرقمية والمقبض
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.22), new THREE.MeshBasicMaterial({ map: getLCDTexture('01:30') }));
      panel.position.set(0.48, 0.65, 0.49);
      root.add(panel);
      cyl(0.08, 0.08, 0.05, materials.brushedMetal, 0.48, 0.38, 0.5).rotation.x = Math.PI / 2;

      // طبق دوار وكوب بداخله
      const plate = new THREE.Group();
      plate.position.set(-0.2, 0.22, 0);
      const glassPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 24), materials.glass);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.22, 16), materials.toyMint);
      cup.position.y = 0.11;
      plate.add(glassPlate, cup);
      root.add(plate);
      fx.plate = plate;

      attachDetailedMainsPlug(root, 0, 0.15, -0.55);
      break;
    }

    // 15. الغسالة
    case 'washer': {
      box(1.25, 1.35, 1.15, materials.glossyWhite, 0, 0.72, 0, 0.08);
      // باب دائري بإطار كروم وزجاج مقعر
      const doorRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 16, 32), materials.chrome);
      doorRing.position.set(0, 0.65, 0.59);
      const doorGlass = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), materials.glass);
      doorGlass.scale.set(1, 1, 0.25);
      doorGlass.position.set(0, 0.65, 0.58);
      root.add(doorRing, doorGlass);

      // حوض الغسيل الدوار الداخلي مع الملابس الملونة
      const drum = new THREE.Group();
      drum.position.set(0, 0.65, 0.2);
      const drumMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.45, 24, 1, true), materials.brushedMetal);
      drumMesh.rotation.x = Math.PI / 2;
      drum.add(drumMesh);

      // ملابس ملونة تدور داخل الحوض
      const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), materials.toyRed); c1.position.set(0.12, 0.1, 0);
      const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), materials.toyMint); c2.position.set(-0.1, -0.08, 0.05);
      drum.add(c1, c2);
      root.add(drum);
      fx.drum = drum;

      attachDetailedMainsPlug(root, 0, 0.15, -0.65);
      break;
    }

    // 16. مكيف الهواء
    case 'airConditioner': {
      box(1.75, 0.65, 0.55, materials.glossyWhite, 0, 0.6, 0, 0.06);
      // شفرة توزيع الهواء السفلية
      const louver = box(1.55, 0.04, 0.15, materials.custom(0xe2e8f0), 0, 0.35, 0.22, 0.01);
      fx.louver = louver;

      // شاشة عرض درجة الحرارة 18°C
      const acLcd = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.12), new THREE.MeshBasicMaterial({ map: getLCDTexture('18°C') }));
      acLcd.position.set(0.55, 0.6, 0.29);
      root.add(acLcd);

      attachDetailedMainsPlug(root, 0, 0.15, -0.35);
      break;
    }

    // 17. المكنسة الكهربائية
    case 'vacuum': {
      // جسم المكنسة الأسطواني الانسيابي
      cyl(0.35, 0.4, 0.75, materials.toyMint, 0, 0.38, 0, 24).rotation.z = Math.PI / 2;
      // عجلتان كبيرتان
      for (const z of [-0.42, 0.42]) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 20), materials.rubberDark);
        w.position.set(-0.15, 0.22, z);
        w.rotation.x = Math.PI / 2;
        root.add(w);
      }
      // خرطوم مرن ومقبض
      const hoseCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.35, 0.4, 0),
        new THREE.Vector3(0.65, 0.7, 0.1),
        new THREE.Vector3(0.85, 0.4, 0.2),
        new THREE.Vector3(0.95, 0.1, 0.25)
      ]);
      const hose = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 20, 0.045, 8, false), materials.custom(0x334155));
      root.add(hose);

      // دوامة إعصارية شفافة
      const vortex = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 12, 24), materials.custom(0x38bdf8, { isEmissive: true }));
      vortex.position.set(0, 0.38, 0);
      vortex.visible = false;
      root.add(vortex);
      fx.vortex = vortex;

      attachDetailedMainsPlug(root, -0.35, 0.15, -0.3);
      break;
    }

    // 18. المصباح المنزلي
    case 'lamp': {
      // قاعدة ثقيلة وعمود
      cyl(0.42, 0.45, 0.08, materials.brushedMetal, 0, 0.06, 0);
      cyl(0.035, 0.035, 1.1, materials.brushedMetal, 0, 0.65, 0);

      // غطاء المصباح المخروطي
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.52, 0.55, 32, 1, true), materials.custom(0xffffff, { roughness: 0.3 }));
      shade.position.set(0, 1.3, 0);
      root.add(shade);

      // لمبة LED مشعة
      const bulb = sphere(0.12, materials.custom(0x475569), 0, 1.25, 0);
      fx.bulb = bulb;

      // ضوء مسلط
      const spot = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
      spot.position.set(0, 0.35, 0);
      spot.visible = false;
      root.add(spot);
      fx.spotlight = spot;

      attachDetailedMainsPlug(root, 0, 0.06, -0.45);
      break;
    }

    // 19. الفرن الكهربائي
    case 'electricOven': {
      box(1.35, 0.95, 1.05, materials.custom(0x1e293b), 0, 0.52, 0, 0.06);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.55), materials.smokedGlass);
      glass.position.set(-0.15, 0.52, 0.54);
      root.add(glass);

      // لفائف تسخين كهربائية متوهجة بالأعلى والأسفل
      fx.coils = [
        cyl(0.02, 0.02, 0.75, materials.custom(0xef4444, { isEmissive: true }), -0.15, 0.75, 0.2),
        cyl(0.02, 0.02, 0.75, materials.custom(0xef4444, { isEmissive: true }), -0.15, 0.28, 0.2)
      ];
      fx.coils.forEach(c => { c.rotation.z = Math.PI / 2; c.visible = false; });

      attachDetailedMainsPlug(root, 0, 0.15, -0.6);
      break;
    }

    // 20. المكواة الكهربائية
    case 'iron': {
      // قاعدة معدنية مثلثة وناعمة
      const base = box(1.0, 0.12, 0.52, materials.chrome, 0, 0.08, 0, 0.06);
      // جسم ومقبض عازل
      box(0.75, 0.35, 0.42, materials.toyMint, -0.05, 0.3, 0, 0.08);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 12, 24, Math.PI), materials.custom(0x0f172a));
      handle.position.set(-0.05, 0.52, 0);
      root.add(handle);

      // بخار متصاعد
      fx.steam = [];
      for (let i = 0; i < 3; i++) {
        const s = sphere(0.08 + i * 0.04, materials.custom(0xffffff, { roughness: 0.1 }), (i - 1) * 0.2, 0.8 + i * 0.2, 0);
        s.visible = false;
        fx.steam.push(s);
      }

      attachDetailedMainsPlug(root, -0.45, 0.2, 0);
      break;
    }

    // 21. استشوار الشعر (المجفف)
    case 'hairDryer': {
      // فوهة أسطوانية ومقبض مائل
      cyl(0.18, 0.24, 0.85, materials.custom(0xbe185d), 0, 0.75, 0).rotation.z = Math.PI / 2;
      const handle = cyl(0.1, 0.08, 0.65, materials.rubberDark, -0.15, 0.38, 0);
      handle.rotation.z = 0.25;

      // حلقات هواء دافئة متوسعة
      fx.windRings = [];
      for (let i = 0; i < 3; i++) {
        const r = new THREE.Mesh(new THREE.RingGeometry(0.2 + i * 0.1, 0.25 + i * 0.1, 20), materials.custom(0xfb8500, { isEmissive: true }));
        r.position.set(0.6 + i * 0.3, 0.75, 0);
        r.rotation.y = Math.PI / 2;
        r.visible = false;
        root.add(r);
        fx.windRings.push(r);
      }

      attachDetailedMainsPlug(root, -0.15, 0.08, 0);
      break;
    }

    // 22. سخان الماء
    case 'electricWaterHeater': {
      cyl(0.48, 0.48, 1.45, materials.glossyWhite, 0, 0.85, 0, 32);
      // مؤشر درجة الحرارة
      fx.gauge = sphere(0.07, materials.custom(0x64748b), 0, 1.1, 0.48);
      // مواسير المياه الساخنة والباردة
      cyl(0.035, 0.035, 0.25, materials.toyRed, -0.18, 0.08, 0);
      cyl(0.035, 0.035, 0.25, materials.toyMint, 0.18, 0.08, 0);

      attachDetailedMainsPlug(root, 0, 0.2, -0.55);
      break;
    }

    // 23. المدفأة الكهربائية
    case 'electricHeater': {
      box(1.55, 0.95, 0.35, materials.custom(0x334155), 0, 0.52, 0, 0.06);
      // شبكة الحماية
      const grill = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.65), new THREE.MeshStandardMaterial({ map: getVentGridTexture() }));
      grill.position.set(0, 0.52, 0.19);
      root.add(grill);

      // أنابيب الكوارتز الحرارية المتوهجة
      fx.rods = [
        cyl(0.025, 0.025, 1.2, materials.custom(0xfb8500, { isEmissive: true }), 0, 0.65, 0.12),
        cyl(0.025, 0.025, 1.2, materials.custom(0xfb8500, { isEmissive: true }), 0, 0.4, 0.12)
      ];
      fx.rods.forEach(r => { r.rotation.z = Math.PI / 2; r.visible = false; });

      attachDetailedMainsPlug(root, 0, 0.15, -0.25);
      break;
    }

    // 24. الخلاط الكهربائي
    case 'blender': {
      // قاعدة المحرك مع قرص السرعات
      cyl(0.38, 0.48, 0.55, materials.brushedMetal, 0, 0.3, 0, 28);
      cyl(0.06, 0.06, 0.05, materials.rubberDark, 0, 0.3, 0.46).rotation.x = Math.PI / 2;

      // وعاء زجاجي شفاف مدرج
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.28, 0.85, 28, 1, true), materials.glass);
      jar.position.set(0, 0.98, 0);
      root.add(jar);

      // غطاء ومقبض
      cyl(0.39, 0.39, 0.1, materials.rubberDark, 0, 1.45, 0);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 12, 20), materials.rubberDark);
      handle.position.set(0.42, 0.98, 0);
      root.add(handle);

      // شفرات حادة متقاطعة
      const blades = new THREE.Group();
      blades.position.set(0, 0.6, 0);
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.06), materials.chrome);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.38), materials.chrome);
      blades.add(b1, b2);
      root.add(blades);
      fx.blades = blades;

      // عصير برتقالي يدور عند التشغيل
      const juice = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.55, 24), materials.custom(0xf59e0b, { roughness: 0.2 }));
      juice.position.set(0, 0.88, 0);
      juice.visible = false;
      root.add(juice);
      fx.juice = juice;

      attachDetailedMainsPlug(root, 0, 0.15, -0.45);
      break;
    }

    default: {
      box(1.0, 1.0, 1.0, materials.glossyWhite, 0, 0.55, 0, 0.08);
      break;
    }
  }

  root.userData.effects = fx;
  root.userData.interactiveParts = interactiveParts;
  return root;
}
