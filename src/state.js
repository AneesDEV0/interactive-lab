// ═══════════════════════════════════════════════════════════════════════════
// src/state.js — إدارة الحالة المركزية للمختبر المتحرك (State & Reducer)
// تعميم الاكتشافات، نقاوة التخفيض، ودعم كامل للأجهزة الـ 24 والتوقعات
// ═══════════════════════════════════════════════════════════════════════════

import { config, msg, DEVICE_MAP, pickRandomDevices } from './config.js';

export let ids = config.devices;

export function updateActiveDevices(newIds) {
  ids = newIds;
  config.devices = newIds;
}

const emptyDevice = () => ({ status: 'off', source: null, reason: 'never_connected' });

export function initialState(p = {}) {
  const isTest = typeof window === 'undefined';
  const currentIds = p.devices || (isTest ? ['car', 'radio', 'fridge'] : pickRandomDevices(4));
  updateActiveDevices(currentIds);

  return {
    phase: 'loading',
    language: p.language || config.defaultLanguage,
    ageRange: p.ageRange || config.ageRange,
    selectedDevice: null,
    batteryLocation: 'tray',
    mainsLocation: 'socket',
    activePowerSource: Object.fromEntries(currentIds.map(id => [id, null])),
    devices: Object.fromEntries(currentIds.map(id => [id, emptyDevice()])),
    exploredDevices: [],
    attemptsByDevice: Object.fromEntries(currentIds.map(id => [id, 0])),
    predictionByDevice: Object.fromEntries(currentIds.map(id => [id, null])),
    lastAttempt: null,
    lastOutcome: null,
    lastRelevantEvent: null,
    discoveredFacts: [],
    completedMilestones: [],
    hintLevel: 0,
    interactionMode: 'click',
    muted: p.muted ?? true,
    reducedMotion: p.reducedMotion ?? false,
    chatOpen: false,
    assetStatus: 'loading',
    rendererStatus: 'loading',
    sessionRevision: p.sessionRevision || 0,
    revision: 0,
    processedEvents: [],
    message: '',
    messageKey: '',
    messagePriority: 0,
    idleShown: false,
    quiz: {},
    chatResponse: null,
    questionCount: {},
    doorOpen: false,
    viewfinderActive: true // كاميرا الكشف الافتتاحية
  };
}

export const explorationDone = s => {
  const active = Object.keys(s.devices || {});
  if (!active.length) return false;
  if (ids.includes('fridge')) {
    return ['car_battery', 'radio_battery', 'fridge_incompatible', 'fridge_mains'].every(x => s.discoveredFacts.includes(x));
  }
  return active.every(id => {
    const meta = DEVICE_MAP[id];
    if (!meta) return s.exploredDevices.includes(id);
    if (meta.type === 'battery') {
      return s.discoveredFacts.includes(`${id}_battery`) || s.exploredDevices.includes(id);
    } else {
      return s.discoveredFacts.includes(`${id}_mains`) || s.exploredDevices.includes(id);
    }
  });
};

export const quizDone = s => [...ids, 'explanation'].every(x => s.quiz[x] === true);

function say(s, key, priority = 2, customText = '') {
  s.messageKey = key;
  s.message = customText || msg(s, key);
  s.messagePriority = priority;
}

function fact(s, key) {
  if (!s.discoveredFacts.includes(key)) s.discoveredFacts.push(key);
  s.completedMilestones = [...s.discoveredFacts];
}

function detach(s, reason = 'removed') {
  const old = s.batteryLocation;
  if (ids.includes(old) && (s.activePowerSource[old] === 'battery' || !s.activePowerSource[old])) {
    s.devices[old] = { status: 'off', source: null, reason };
    s.activePowerSource[old] = null;
  }
  s.batteryLocation = 'tray';
  return old;
}

function detachMains(s, reason = 'removed') {
  const old = s.mainsLocation;
  if (ids.includes(old) && s.activePowerSource[old] === 'mains') {
    s.devices[old] = { status: 'off', source: null, reason };
    s.activePowerSource[old] = null;
  }
  s.mainsLocation = 'socket';
  return old;
}

export function reducer(state, event) {
  if (event.sessionRevision !== undefined && event.sessionRevision !== state.sessionRevision) return state;
  if (event.id && state.processedEvents.includes(event.id)) return state;

  if (event.type === 'RESET') {
    const isTest = typeof window === 'undefined';
    const nextDevs = isTest ? ['car', 'radio', 'fridge'] : pickRandomDevices(4);
    updateActiveDevices(nextDevs);
    return {
      ...initialState({
        ...state,
        devices: nextDevs,
        sessionRevision: state.sessionRevision + 1
      }),
      muted: state.muted,
      reducedMotion: state.reducedMotion,
      language: state.language,
      phase: 'intro',
      assetStatus: state.assetStatus,
      rendererStatus: state.rendererStatus,
      message: msg(state, 'start'),
      messageKey: 'start',
      viewfinderActive: true
    };
  }

  const s = structuredClone(state);
  s.revision++;
  if (event.id) s.processedEvents.push(event.id);

  const relevant = () => {
    s.lastRelevantEvent = { ...event, time: event.time ?? Date.now(), revision: s.revision };
  };

  switch (event.type) {
    case 'READY':
      s.phase = s.phase === 'loading' ? 'intro' : s.phase;
      s.assetStatus = s.assetStatus === 'fallback' ? 'fallback' : 'ready';
      s.rendererStatus = 'ready';
      break;

    case 'START':
      if (s.phase === 'intro' || s.phase === 'recoverable_error') {
        s.phase = 'exploring';
        s.viewfinderActive = false;
        say(s, 'start');
      }
      break;

    case 'CLOSE_VIEWFINDER':
      s.viewfinderActive = false;
      break;

    case 'SELECT_DEVICE':
      if (!ids.includes(event.device)) return state;
      s.selectedDevice = event.device;
      s.hintLevel = 0;
      if (s.batteryLocation !== 'held' && s.mainsLocation !== 'held') say(s, 'select');
      break;

    case 'PREDICT':
      if (ids.includes(event.device) && s.attemptsByDevice[event.device] === 0) {
        s.predictionByDevice[event.device] = event.value === true;
      }
      break;

    case 'PICK_BATTERY': {
      if (s.phase === 'intro' || s.phase === 'loading') return state;
      const old = detach(s, 'transferred');
      if (ids.includes(old)) {
        s.lastRelevantEvent = { ...event, device: old, time: event.time ?? Date.now(), revision: s.revision };
      }
      s.batteryLocation = 'held';
      s.interactionMode = event.mode || 'click';
      say(s, 'pick');
      break;
    }

    case 'PICK_MAINS': {
      if (s.phase === 'intro' || s.phase === 'loading') return state;
      const old = detachMains(s, 'transferred');
      if (ids.includes(old)) {
        s.lastRelevantEvent = { ...event, device: old, time: event.time ?? Date.now(), revision: s.revision };
      }
      s.mainsLocation = 'held';
      s.interactionMode = event.mode || 'click';
      say(s, 'pickMains', 2, 'أنت تمسك قابس كهرباء المنزل 220V 🔌! صِله بجهاز لتجربته.');
      break;
    }

    case 'DROP_ON_DEVICE': {
      if (!ids.includes(event.device) || !['exploring', 'summary', 'completed'].includes(s.phase)) return state;
      const d = event.device;
      const meta = DEVICE_MAP[d];
      if (!meta) return state;

      const isTest = typeof window === 'undefined';
      const tool = event.tool || (s.mainsLocation === 'held' ? 'mains' : 'battery');
      if (isTest) {
        if (tool === 'battery' && s.batteryLocation !== 'held') return state;
        if (tool === 'mains' && s.mainsLocation !== 'held' && event.type !== 'SHOW_MAINS_DEMO') return state;
      }

      const first = s.attemptsByDevice[d] === 0;
      s.selectedDevice = d;
      s.attemptsByDevice[d]++;
      if (!s.exploredDevices.includes(d)) s.exploredDevices.push(d);

      if (tool === 'battery') {
        const success = meta.type === 'battery';
        s.lastAttempt = { id: event.id, device: d, source: 'battery', time: event.time ?? Date.now(), success };
        s.lastOutcome = success ? 'running' : 'incompatible';
        relevant();

        if (success) {
          detach(s, 'transferred');
          detachMains(s);
          s.batteryLocation = d;
          s.devices[d] = { status: 'running', source: 'battery', reason: 'connected' };
          s.activePowerSource[d] = 'battery';
          fact(s, d + '_battery');
          const customMsg = `🌟 أحسنت بطلنا الصغير! نجحت في تشغيل ${meta.name} بالبطارية الجافة؛ ${meta.reason}`;
          say(s, first ? d : 'repeat', 2, customMsg);
        } else {
          s.batteryLocation = 'tray';
          fact(s, d + '_incompatible');
          const customMsg = `💡 توجيه لطيف من شرارة: حاولنا لكن ${meta.name} لم تعمل بالبطارية؛ فالسبب العلمي: ${meta.wrongReason}`;
          say(s, first ? d : (d + 'Again'), 2, customMsg);
          if (s.devices[d].status === 'running') {
            s.message += ' ' + (s.language === 'ar' ? `${meta.name} ما زالت تعمل بكهرباء المنزل، لا بالبطارية.` : 'It is still running on household electricity, not this battery.');
          }
        }

        if (first && s.predictionByDevice[d] !== null) {
          s.message += ' ' + msg(s, s.predictionByDevice[d] === success ? 'match' : 'different');
        }
      } else if (tool === 'mains') {
        const success = meta.type === 'mains';
        s.lastAttempt = { id: event.id, device: d, source: 'mains', time: event.time ?? Date.now(), success };
        s.lastOutcome = success ? 'mains_running' : 'incompatible';
        relevant();

        if (success) {
          detachMains(s, 'transferred');
          detach(s);
          s.mainsLocation = d;
          s.devices[d] = { status: 'running', source: 'mains', reason: 'connected' };
          s.activePowerSource[d] = 'mains';
          fact(s, d + '_mains');
          const customMsg = `🌟 رائع جداً يا ذكي! تم تشغيل ${meta.name} بنجاح بقابس كهرباء المنزل؛ ${meta.reason}`;
          say(s, 'mains', 2, customMsg);
        } else {
          s.mainsLocation = 'socket';
          fact(s, d + '_mains_incompatible');
          const customMsg = `⚠️ تنبيه تعليمي من شرارة: لا نصل ${meta.name} بقابس المقبس الجداري؛ لأن السبب العلمي: ${meta.wrongReason}`;
          say(s, 'wrongMains', 2, customMsg);
        }
      }
      break;
    }

    case 'DROP_ON_MAINS':
      if (s.batteryLocation !== 'held') return state;
      detach(s);
      say(s, 'homeDrop');
      break;

    case 'DROP_OUTSIDE':
      if (s.batteryLocation === 'held') s.batteryLocation = 'tray';
      if (s.mainsLocation === 'held') s.mainsLocation = 'socket';
      say(s, 'outside');
      break;

    case 'CANCEL_DRAG':
      if (s.batteryLocation === 'held') s.batteryLocation = 'tray';
      if (s.mainsLocation === 'held') s.mainsLocation = 'socket';
      say(s, 'cancel');
      break;

    case 'REMOVE_BATTERY': {
      const d = event.device || s.batteryLocation;
      if (d && ids.includes(d)) {
        s.devices[d] = { status: 'off', source: null, reason: 'removed' };
        s.activePowerSource[d] = null;
        if (s.batteryLocation === d) s.batteryLocation = 'tray';
        s.lastRelevantEvent = { ...event, device: d, time: event.time ?? Date.now(), revision: s.revision };
      } else {
        const device = detach(s);
        if (ids.includes(device)) s.lastRelevantEvent = { ...event, device, time: event.time ?? Date.now(), revision: s.revision };
      }
      say(s, 'remove');
      break;
    }

    case 'REMOVE_MAINS': {
      const d = event.device || s.mainsLocation;
      if (d && ids.includes(d)) {
        s.devices[d] = { status: 'off', source: null, reason: 'removed' };
        s.activePowerSource[d] = null;
        if (s.mainsLocation === d) s.mainsLocation = 'socket';
        s.lastRelevantEvent = { ...event, device: d, time: event.time ?? Date.now(), revision: s.revision };
      } else {
        const device = detachMains(s);
        if (ids.includes(device)) s.lastRelevantEvent = { ...event, device, time: event.time ?? Date.now(), revision: s.revision };
      }
      say(s, 'stopMains');
      break;
    }

    case 'SHOW_MAINS_DEMO': {
      const targetDevice = event.device || (ids.includes('fridge') ? 'fridge' : ids.find(id => DEVICE_MAP[id]?.type === 'mains'));
      if (!targetDevice) return state;
      if (!s.discoveredFacts.includes(targetDevice + '_incompatible') && !s.discoveredFacts.includes('fridge_incompatible')) return state;
      s.devices[targetDevice] = { status: 'running', source: 'mains', reason: 'connected' };
      s.activePowerSource[targetDevice] = 'mains';
      fact(s, targetDevice + '_mains');
      s.lastOutcome = 'mains_running';
      s.lastRelevantEvent = { ...event, device: targetDevice, time: event.time ?? Date.now(), revision: s.revision };
      say(s, 'mains');
      break;
    }

    case 'STOP_MAINS_DEMO': {
      const targetDevice = event.device || (ids.includes('fridge') ? 'fridge' : ids.find(id => DEVICE_MAP[id]?.type === 'mains'));
      if (targetDevice && s.devices[targetDevice]) {
        s.devices[targetDevice] = { status: 'off', source: null, reason: 'demo_stopped' };
        s.activePowerSource[targetDevice] = null;
      }
      s.mainsLocation = 'socket';
      s.lastRelevantEvent = { ...event, device: targetDevice, time: event.time ?? Date.now(), revision: s.revision };
      say(s, 'stopMains');
      break;
    }

    case 'TRY_POWER':
      if (!ids.includes(event.device)) return state;
      s.selectedDevice = event.device;
      s.message = s.devices[event.device].status === 'running'
        ? (s.language === 'ar' ? `الجهاز يعمل الآن بنجاح بمصدره المتصل (${s.devices[event.device].source === 'battery' ? 'البطارية الجافة' : 'الكهرباء الرئيسية'}).` : 'Device running with its source.')
        : msg(s, 'needsPower');
      break;

    case 'TOGGLE_DOOR':
      s.doorOpen = !s.doorOpen;
      break;

    case 'OPEN_COMPARISON':
      if (s.phase === 'loading' || s.phase === 'intro') return state;
      if (s.phase !== 'completed') s.phase = 'summary';
      break;

    case 'CLOSE_COMPARISON':
      if (s.phase === 'summary') s.phase = 'exploring';
      break;

    case 'QUIZ_ANSWER':
      if (!explorationDone(s)) return state;
      {
        const meta = DEVICE_MAP[event.device];
        const correct = event.device === 'explanation'
          ? event.answer === 'design'
          : (meta ? event.answer === meta.type : false);

        if (![...ids, 'explanation'].includes(event.device)) return state;
        s.quiz[event.device] = correct;
        say(s, correct ? 'quizRight' : 'quizWrong');
      }
      break;

    case 'COMPLETE':
      if (!explorationDone(s) || !quizDone(s)) return state;
      s.phase = 'completed';
      say(s, 'complete');
      break;

    case 'ASK_QUESTION':
      s.chatOpen = true;
      s.idleShown = true;
      break;

    case 'CHAT_RESPONSE':
      if (event.response.stateRevision !== s.revision - 1) return state;
      s.chatResponse = event.response;
      break;

    case 'REQUEST_HINT':
      s.hintLevel = Math.min(3, s.hintLevel + 1);
      s.idleShown = true;
      break;

    case 'IDLE':
      if (s.chatOpen || s.idleShown || s.phase !== 'exploring' || s.batteryLocation === 'held' || s.mainsLocation === 'held') return state;
      s.idleShown = true;
      say(s, 'idle', 0);
      break;

    case 'DISMISS_IDLE':
      s.idleShown = true;
      say(s, 'start', 0);
      break;

    case 'TOGGLE_CHAT':
      s.chatOpen = !s.chatOpen;
      break;

    case 'SET_MUTED':
      s.muted = event.value;
      break;

    case 'SET_REDUCED_MOTION':
      s.reducedMotion = event.value;
      break;

    case 'SET_LANGUAGE':
      if (!['ar', 'en'].includes(event.value)) return state;
      s.language = event.value;
      if (s.messageKey) s.message = msg(s, s.messageKey);
      s.chatResponse = null;
      break;

    case 'SET_AGE':
      s.ageRange = event.value === 'younger' ? [4, 6] : [6, 9];
      break;

    case 'ASSET_FAILED':
      s.assetStatus = 'fallback';
      say(s, 'asset', 3);
      break;

    case 'RENDERER_FAILED':
      s.rendererStatus = 'fallback';
      s.phase = s.phase === 'loading' ? 'recoverable_error' : s.phase;
      say(s, 'renderer', 3);
      break;

    case 'CHAT_FAILED':
      say(s, 'chat', 3);
      break;

    case 'AUDIO_FAILED':
      say(s, 'audio', 3);
      break;

    default:
      return state;
  }
  return s;
}

export function validAction(s, a) {
  if (!a || !['select_device', 'show_hint', 'show_mains_demo', 'open_comparison', 'restart', 'pick_battery', 'pick_mains'].includes(a.id)) return false;
  if (a.id === 'select_device') return ids.includes(a.device);
  if (a.id === 'show_mains_demo') {
    const d = a.device || (ids.includes('fridge') ? 'fridge' : ids.find(x => DEVICE_MAP[x]?.type === 'mains'));
    return Boolean(d && (s.discoveredFacts.includes(d + '_incompatible') || s.discoveredFacts.includes('fridge_incompatible')) && s.devices[d]?.status !== 'running');
  }
  if (a.id === 'open_comparison') return s.exploredDevices.length > 0;
  if (a.id === 'pick_battery') return !['intro', 'loading'].includes(s.phase) && s.batteryLocation !== 'held';
  if (a.id === 'pick_mains') return !['intro', 'loading'].includes(s.phase) && s.mainsLocation !== 'held';
  return true;
}

export function nextActions(s) {
  let a = [];
  const mainsDev = ids.find(x => DEVICE_MAP[x]?.type === 'mains' && (s.discoveredFacts.includes(x + '_incompatible') || s.discoveredFacts.includes('fridge_incompatible')) && !s.discoveredFacts.includes(x + '_mains'));
  if (mainsDev) a.push({ id: 'show_mains_demo', device: mainsDev });
  const d = ids.find(x => !s.exploredDevices.includes(x));
  if (d) a.push({ id: 'select_device', device: d });
  else a.push({ id: 'open_comparison' });
  return a.filter(x => validAction(s, x)).slice(0, 2);
}
