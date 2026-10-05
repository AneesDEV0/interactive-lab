// ═══════════════════════════════════════════════════════════════════════════
// src/coach.js — محرك التوجيه الذكي المتدرج (Smart Coach Engine)
// يقود تجربة الطفل عبر تلميحات ثلاثية المستويات، وكشف أنماط الأخطاء ومقياس القدرة
// ═══════════════════════════════════════════════════════════════════════════

import { DEVICE_MAP } from './config.js';

export class CoachEngine {
  constructor() {
    this.consecutiveErrors = 0;
    this.consecutiveSuccesses = 0;
    this.deviceHintLevels = new Map(); // Map<deviceId, level (1, 2, 3)>
  }

  resetRound() {
    this.consecutiveErrors = 0;
    this.consecutiveSuccesses = 0;
    this.deviceHintLevels.clear();
  }

  recordAttempt(deviceId, isSuccess) {
    if (isSuccess) {
      this.consecutiveSuccesses++;
      this.consecutiveErrors = 0;
      this.deviceHintLevels.delete(deviceId);
    } else {
      this.consecutiveErrors++;
      this.consecutiveSuccesses = 0;
      const currentLevel = this.deviceHintLevels.get(deviceId) || 0;
      this.deviceHintLevels.set(deviceId, Math.min(currentLevel + 1, 3));
    }
  }

  getAdvice(state) {
    const activeDeviceIds = Object.keys(state.devices || {});
    const uncompletedIds = activeDeviceIds.filter(id => {
      const devState = state.devices[id];
      return !devState || devState.status !== 'running';
    });

    // 1. عند اكتمال الجولة
    if (uncompletedIds.length === 0 && activeDeviceIds.length > 0) {
      return {
        text: 'بطل عبقري! اكتمل استكشاف جميع أجهزة هذه الجولة بنجاح باهر!',
        audioKey: 'dyn.roundComplete',
        targetDevice: null,
        showPowerMeter: false,
        mood: 'happy',
        pointsToDevice: null
      };
    }

    // 2. كشف أنماط الأخطاء المتكررة وتفعيل مقياس القدرة
    if (this.consecutiveErrors >= 2) {
      // إيجاد الجهاز الأكثر محاولة غير موفقة
      let mostAttemptedId = uncompletedIds[0];
      let maxAttempts = 0;
      for (const id of uncompletedIds) {
        const att = state.attemptsByDevice?.[id] || 0;
        if (att > maxAttempts) {
          maxAttempts = att;
          mostAttemptedId = id;
        }
      }

      const dev = DEVICE_MAP[mostAttemptedId];
      if (dev) {
        return {
          text: `فكر معي يا بطل! ${dev.name} يستهلك ${dev.watts} تقريباً؛ هل تكفيه بطارية 1.5V صغيرة؟ شاهد مقياس القدرة!`,
          audioKey: `dyn.${dev.id}.hint`,
          targetDevice: dev.id,
          showPowerMeter: true,
          mood: 'explaining',
          pointsToDevice: dev.id
        };
      }
    }

    // 3. سلسلة نجاح متتالية (احتفال وتشجيع)
    if (this.consecutiveSuccesses >= 2) {
      const nextDevId = uncompletedIds[0];
      const nextDev = DEVICE_MAP[nextDevId];
      return {
        text: `أداء مذهل وسلسلة صحيحة! تفحص الآن ${nextDev ? nextDev.name : 'الجهاز التالي'} وواصل تألقك!`,
        audioKey: 'dyn.streak',
        targetDevice: nextDevId,
        showPowerMeter: false,
        mood: 'happy',
        pointsToDevice: nextDevId
      };
    }

    // 4. التلميح المتدرج للأجهزة غير المكتملة
    const targetId = uncompletedIds[0];
    const dev = DEVICE_MAP[targetId];
    if (!dev) {
      return {
        text: 'اسحب البطارية أو القابس إلى أحد الأجهزة لتجربة تشغيله!',
        audioKey: 'dyn.intro',
        targetDevice: null,
        showPowerMeter: false,
        mood: 'calm',
        pointsToDevice: null
      };
    }

    const hintLevel = this.deviceHintLevels.get(targetId) || 1;

    if (hintLevel === 1) {
      // المستوى 1: تنبيه لطيف دون حرق
      return {
        text: `تأمل ${dev.name}، هل تحمله بيدك وتتنقل به بحرية، أم هو جهاز منزلي ثابت؟`,
        audioKey: `dyn.${dev.id}.hint_l1`,
        targetDevice: dev.id,
        showPowerMeter: false,
        mood: 'thinking',
        pointsToDevice: dev.id
      };
    } else if (hintLevel === 2) {
      // المستوى 2: دليل بصري في التصميم
      const visualClue = dev.type === 'battery'
        ? `ابحث عن غطاء حجرة البطاريات وأقطاب (+ / -) في ${dev.name}.`
        : `انظر لكابل الطاقة الكهربائية والقابس الجداري المتصل بـ ${dev.name}.`;
      return {
        text: `دليل بصري: ${visualClue}`,
        audioKey: `dyn.${dev.id}.hint_l2`,
        targetDevice: dev.id,
        showPowerMeter: false,
        mood: 'pointing',
        pointsToDevice: dev.id
      };
    } else {
      // المستوى 3: تحليل شبه محلول ومقياس قدرة
      return {
        text: dev.reason,
        audioKey: `dyn.${dev.id}.hint_l3`,
        targetDevice: dev.id,
        showPowerMeter: true,
        mood: 'explaining',
        pointsToDevice: dev.id
      };
    }
  }
}

export const coach = new CoachEngine();
