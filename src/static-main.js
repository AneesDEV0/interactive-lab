// ═══════════════════════════════════════════════════════════════════════════
// static-main.js — المحرك المركزي للنشاط التقويمي الثابت (100vh Responsive Module)
// مدعوم بمدخل الواقع المعزز الحقيقي (True AR)، والتوجيه الصوتي، والبطاقات ثلاثية الأبعاد
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { launchArGateway, launchARGateway } from './ar.js';
import { speak, stopAudio } from './audio.js';
import { ALL_DEVICES } from './config.js';

// ─── بنك رسومات SVG الـ 24 عالية الدقة ───
const SVG_MAP = {
  remote: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-rem" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#1E293B"/></linearGradient><linearGradient id="g-btn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0284C7"/></linearGradient><filter id="sh-rem"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity="0.3"/></filter></defs><rect x="18" y="6" width="28" height="52" rx="12" fill="url(#g-rem)" filter="url(#sh-rem)" stroke="#64748B" stroke-width="1.5"/><rect x="22" y="10" width="20" height="44" rx="8" fill="#0F172A"/><circle cx="32" cy="7" r="2.5" fill="#EF4444"/><circle cx="32" cy="22" r="7" fill="#EF4444"/><circle cx="32" cy="22" r="3.5" fill="#FFFFFF"/><circle cx="26" cy="35" r="2.8" fill="url(#g-btn)"/><circle cx="38" cy="35" r="2.8" fill="url(#g-btn)"/><circle cx="26" cy="43" r="2.8" fill="url(#g-btn)"/><circle cx="38" cy="43" r="2.8" fill="url(#g-btn)"/></svg>`,
  flashlight: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-fl1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FCD34D"/><stop offset="100%" stop-color="#D97706"/></linearGradient><linearGradient id="g-fl2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#64748B"/><stop offset="100%" stop-color="#334155"/></linearGradient><filter id="sh-fl"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-fl)"><path d="M14 24 L26 20 L26 44 L14 40 Z" fill="url(#g-fl1)" stroke="#B45309" stroke-width="1.2"/><rect x="26" y="22" width="26" height="20" rx="5" fill="url(#g-fl2)" stroke="#1E293B" stroke-width="1.2"/><rect x="52" y="26" width="6" height="12" rx="3" fill="#1E293B"/><rect x="33" y="19" width="8" height="3.5" rx="1.5" fill="#EF4444"/><path d="M12 24 L2 18 L2 46 L12 40 Z" fill="#FEF08A" opacity="0.75"/></g></svg>`,
  wallClock: `<svg viewBox="0 0 64 64"><defs><radialGradient id="g-clk" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#E2E8F0"/></radialGradient><linearGradient id="g-clk-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#B45309"/></linearGradient><filter id="sh-clk"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/></filter></defs><circle cx="32" cy="32" r="26" fill="url(#g-clk-rim)" filter="url(#sh-clk)"/><circle cx="32" cy="32" r="21" fill="url(#g-clk)" stroke="#CBD5E1" stroke-width="1.5"/><circle cx="32" cy="32" r="3.5" fill="#0F172A"/><line x1="32" y1="32" x2="32" y2="17" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/><line x1="32" y1="32" x2="44" y2="32" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  car: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-car" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EF4444"/><stop offset="100%" stop-color="#991B1B"/></linearGradient><radialGradient id="g-whl" cx="35%" cy="35%" r="60%"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#0F172A"/></radialGradient><filter id="sh-car"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-car)"><path d="M14 24 L22 13 L42 13 L50 24 Z" fill="#B91C1C"/><rect x="6" y="24" width="52" height="22" rx="8" fill="url(#g-car)"/><polygon points="23,16 41,16 47,23 17,23" fill="#E0F2FE" opacity="0.85"/><circle cx="17" cy="46" r="7.5" fill="url(#g-whl)"/><circle cx="17" cy="46" r="3.5" fill="#F8FAFC"/><circle cx="47" cy="46" r="7.5" fill="url(#g-whl)"/><circle cx="47" cy="46" r="3.5" fill="#F8FAFC"/></g></svg>`,
  calculator: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-calc" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#64748B"/><stop offset="100%" stop-color="#334155"/></linearGradient><filter id="sh-calc"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-opacity="0.25"/></filter></defs><rect x="14" y="8" width="36" height="48" rx="9" fill="url(#g-calc)" filter="url(#sh-calc)" stroke="#94A3B8" stroke-width="1.5"/><rect x="18" y="13" width="28" height="12" rx="4" fill="#0F172A"/><rect x="20" y="15" width="24" height="8" rx="2" fill="#86EFAC" opacity="0.85"/><circle cx="22" cy="32" r="2.8" fill="#CBD5E1"/><circle cx="29" cy="32" r="2.8" fill="#CBD5E1"/><circle cx="36" cy="32" r="2.8" fill="#CBD5E1"/><circle cx="43" cy="32" r="2.8" fill="#F97316"/><circle cx="22" cy="40" r="2.8" fill="#CBD5E1"/><circle cx="29" cy="40" r="2.8" fill="#CBD5E1"/><circle cx="36" cy="40" r="2.8" fill="#CBD5E1"/><circle cx="43" cy="40" r="2.8" fill="#38BDF8"/><circle cx="22" cy="48" r="2.8" fill="#CBD5E1"/><circle cx="29" cy="48" r="2.8" fill="#CBD5E1"/><circle cx="36" cy="48" r="2.8" fill="#CBD5E1"/><circle cx="43" cy="48" r="2.8" fill="#22C55E"/></svg>`,
  radio: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-rad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#14B8A6"/><stop offset="100%" stop-color="#0F766E"/></linearGradient><filter id="sh-rad"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.3"/></filter></defs><line x1="14" y1="18" x2="38" y2="5" stroke="#64748B" stroke-width="3" stroke-linecap="round"/><circle cx="38" cy="5" r="2.8" fill="#EF4444"/><rect x="8" y="18" width="48" height="36" rx="9" fill="url(#g-rad)" filter="url(#sh-rad)" stroke="#5EEAD4" stroke-width="1.5"/><circle cx="23" cy="36" r="11" fill="#134E4A" stroke="#2DD4BF" stroke-width="1.5"/><circle cx="23" cy="36" r="4" fill="#99F6E4"/><circle cx="44" cy="30" r="4.5" fill="#F8FAFC"/><circle cx="44" cy="42" r="4.5" fill="#F8FAFC"/></svg>`,
  smokeDetector: `<svg viewBox="0 0 64 64"><defs><radialGradient id="g-smk" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#CBD5E1"/></radialGradient><filter id="sh-smk"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/></filter></defs><circle cx="32" cy="32" r="25" fill="url(#g-smk)" filter="url(#sh-smk)" stroke="#94A3B8" stroke-width="2"/><circle cx="32" cy="32" r="14" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="1.5"/><circle cx="32" cy="32" r="4" fill="#EF4444"/></svg>`,
  laserPointer: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-lzr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#1D4ED8"/></linearGradient><filter id="sh-lzr"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity="0.25"/></filter></defs><g filter="url(#sh-lzr)"><rect x="12" y="27" width="38" height="11" rx="4.5" fill="url(#g-lzr)" stroke="#60A5FA" stroke-width="1.2"/><rect x="50" y="29" width="6" height="7" rx="2" fill="#64748B"/><circle cx="22" cy="32.5" r="2.5" fill="#EF4444"/><line x1="56" y1="32.5" x2="63" y2="32.5" stroke="#EF4444" stroke-width="3" stroke-dasharray="2 1"/></g></svg>`,
  hearingAid: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-hear" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FDBA74"/><stop offset="100%" stop-color="#EA580C"/></linearGradient><filter id="sh-hear"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity="0.25"/></filter></defs><path d="M26 14 C16 18, 14 36, 26 46 C32 52, 38 48, 38 42 C38 36, 32 38, 28 32 C26 28, 28 22, 36 20" stroke="url(#g-hear)" stroke-width="7" stroke-linecap="round" fill="none" filter="url(#sh-hear)"/><circle cx="38" cy="42" r="5.5" fill="#F97316"/></svg>`,
  digitalScale: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-scl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#E2E8F0"/></linearGradient><filter id="sh-scl"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.2"/></filter></defs><rect x="10" y="12" width="44" height="44" rx="10" fill="url(#g-scl)" filter="url(#sh-scl)" stroke="#94A3B8" stroke-width="2"/><rect x="18" y="18" width="28" height="12" rx="3.5" fill="#0F172A"/><text x="32" y="27" font-size="7" font-weight="900" fill="#38BDF8" text-anchor="middle" font-family="monospace">0.0 kg</text><circle cx="32" cy="42" r="7.5" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1.5"/></svg>`,
  robotToy: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-rob" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#06B6D4"/><stop offset="100%" stop-color="#0E7490"/></linearGradient><filter id="sh-rob"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/></filter></defs><g filter="url(#sh-rob)"><rect x="16" y="18" width="32" height="28" rx="8" fill="url(#g-rob)" stroke="#67E8F9" stroke-width="1.5"/><circle cx="25" cy="28" r="3.5" fill="#FDE047"/><circle cx="39" cy="28" r="3.5" fill="#FDE047"/><rect x="23" y="36" width="18" height="4" rx="2" fill="#FFFFFF"/><circle cx="32" cy="9" r="3.5" fill="#EF4444"/><line x1="32" y1="12" x2="32" y2="18" stroke="#475569" stroke-width="2.5"/></g></svg>`,
  electricToothbrush: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0284C7"/></linearGradient><filter id="sh-tb"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity="0.25"/></filter></defs><g filter="url(#sh-tb)"><rect x="25" y="22" width="14" height="38" rx="7" fill="url(#g-tb)" stroke="#7DD3FC" stroke-width="1.2"/><rect x="28" y="5" width="8" height="17" rx="3" fill="#F8FAFC"/><rect x="30" y="6" width="4" height="7" rx="1.5" fill="#0284C7"/><circle cx="32" cy="30" r="2.5" fill="#F8FAFC"/></g></svg>`,
  
  fridge: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-frg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#CBD5E1"/></linearGradient><filter id="sh-frg"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/></filter></defs><g filter="url(#sh-frg)"><rect x="16" y="6" width="32" height="52" rx="7" fill="url(#g-frg)" stroke="#94A3B8" stroke-width="1.8"/><rect x="18" y="8" width="28" height="17" rx="4" fill="#F1F5F9"/><rect x="18" y="28" width="28" height="28" rx="4" fill="#F1F5F9"/><rect x="41" y="14" width="3.5" height="7" rx="1.5" fill="#475569"/><rect x="41" y="34" width="3.5" height="14" rx="1.5" fill="#475569"/></g></svg>`,
  microwave: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-mcw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#64748B"/><stop offset="100%" stop-color="#334155"/></linearGradient><filter id="sh-mcw"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/></filter></defs><g filter="url(#sh-mcw)"><rect x="6" y="13" width="52" height="38" rx="8" fill="url(#g-mcw)" stroke="#94A3B8" stroke-width="1.5"/><rect x="12" y="20" width="30" height="24" rx="4" fill="#0F172A"/><circle cx="49" cy="27" r="3.5" fill="#CBD5E1"/><circle cx="49" cy="37" r="3.5" fill="#CBD5E1"/><circle cx="49" cy="44" r="2" fill="#38BDF8"/></g></svg>`,
  washer: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-wsh" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#E2E8F0"/></linearGradient><radialGradient id="g-wsh-drum" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0369A1"/></radialGradient><filter id="sh-wsh"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/></filter></defs><g filter="url(#sh-wsh)"><rect x="11" y="7" width="42" height="50" rx="9" fill="url(#g-wsh)" stroke="#94A3B8" stroke-width="2"/><circle cx="32" cy="36" r="16" fill="#94A3B8"/><circle cx="32" cy="36" r="13" fill="url(#g-wsh-drum)" stroke="#0284C7" stroke-width="1.5"/><rect x="16" y="12" width="14" height="6" rx="2" fill="#CBD5E1"/><circle cx="43" cy="15" r="2.5" fill="#0284C7"/></g></svg>`,
  airConditioner: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-ac" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#F1F5F9"/></linearGradient><filter id="sh-ac"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.2"/></filter></defs><rect x="6" y="17" width="52" height="26" rx="6" fill="url(#g-ac)" filter="url(#sh-ac)" stroke="#CBD5E1" stroke-width="2"/><line x1="10" y1="36" x2="54" y2="36" stroke="#94A3B8" stroke-width="2.5"/><circle cx="48" cy="24" r="2" fill="#22C55E"/></svg>`,
  vacuum: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-vac" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FB923C"/><stop offset="100%" stop-color="#C2410C"/></linearGradient><filter id="sh-vac"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/></filter></defs><g filter="url(#sh-vac)"><rect x="28" y="23" width="26" height="22" rx="10" fill="url(#g-vac)" stroke="#EA580C" stroke-width="1.5"/><circle cx="43" cy="45" r="6.5" fill="#1E293B"/><path d="M30 30 C18 30, 12 18, 12 26 L12 48" stroke="#64748B" stroke-width="4" stroke-linecap="round" fill="none"/></g></svg>`,
  lamp: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-lmp" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#D97706"/></linearGradient><filter id="sh-lmp"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/></filter></defs><g filter="url(#sh-lmp)"><path d="M18 27 L46 27 L39 12 L25 12 Z" fill="url(#g-lmp)" stroke="#B45309" stroke-width="1.5"/><line x1="32" y1="27" x2="32" y2="49" stroke="#475569" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="32" cy="50" rx="13" ry="4" fill="#334155"/></g></svg>`,
  electricOven: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-ovn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#1E293B"/></linearGradient><filter id="sh-ovn"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/></filter></defs><rect x="10" y="9" width="44" height="46" rx="8" fill="url(#g-ovn)" filter="url(#sh-ovn)" stroke="#64748B" stroke-width="1.5"/><rect x="15" y="26" width="34" height="24" rx="4" fill="#0F172A"/><path d="M19 33 L45 33" stroke="#EF4444" stroke-width="2.5"/><path d="M19 43 L45 43" stroke="#EF4444" stroke-width="2.5"/><circle cx="20" cy="18" r="2.5" fill="#F8FAFC"/><circle cx="32" cy="18" r="2.5" fill="#F8FAFC"/><circle cx="44" cy="18" r="2.5" fill="#F8FAFC"/></svg>`,
  iron: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-irn" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0284C7"/></linearGradient><filter id="sh-irn"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-opacity="0.25"/></filter></defs><path d="M10 44 L50 44 C55 44, 57 39, 52 33 L38 21 C32 19, 20 19, 15 25 Z" fill="url(#g-irn)" filter="url(#sh-irn)" stroke="#0369A1" stroke-width="1.5"/><rect x="10" y="44" width="42" height="4.5" rx="2" fill="#CBD5E1"/><circle cx="30" cy="34" r="3.5" fill="#F59E0B"/></svg>`,
  hairDryer: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-hd" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F43F5E"/><stop offset="100%" stop-color="#BE123C"/></linearGradient><filter id="sh-hd"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-opacity="0.25"/></filter></defs><g filter="url(#sh-hd)"><rect x="13" y="15" width="29" height="17" rx="7" fill="url(#g-hd)"/><rect x="42" y="19" width="10" height="9" rx="2" fill="#334155"/><rect x="19" y="32" width="11" height="21" rx="4" fill="#9F1239"/></g></svg>`,
  electricWaterHeater: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-ewh" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#CBD5E1"/></linearGradient><radialGradient id="g-gug" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0284C7"/></radialGradient><filter id="sh-ewh"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/></filter></defs><g filter="url(#sh-ewh)"><rect x="16" y="8" width="32" height="46" rx="16" fill="url(#g-ewh)" stroke="#94A3B8" stroke-width="2"/><circle cx="32" cy="28" r="6" fill="url(#g-gug)" stroke="#0369A1" stroke-width="1.2"/><line x1="32" y1="28" x2="35" y2="25" stroke="#EF4444" stroke-width="1.8" stroke-linecap="round"/><circle cx="32" cy="46" r="2.5" fill="#EF4444"/><line x1="24" y1="54" x2="24" y2="60" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="40" y1="54" x2="40" y2="60" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/></g></svg>`,
  electricHeater: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-eht" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#DC2626"/><stop offset="100%" stop-color="#991B1B"/></linearGradient><filter id="sh-eht"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/></filter></defs><rect x="11" y="13" width="42" height="40" rx="7" fill="url(#g-eht)" filter="url(#sh-eht)" stroke="#F87171" stroke-width="1.5"/><line x1="17" y1="23" x2="47" y2="23" stroke="#FDE047" stroke-width="3.5" stroke-linecap="round"/><line x1="17" y1="33" x2="47" y2="33" stroke="#FDE047" stroke-width="3.5" stroke-linecap="round"/><line x1="17" y1="43" x2="47" y2="43" stroke="#FDE047" stroke-width="3.5" stroke-linecap="round"/></svg>`,
  blender: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-bln" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0284C7"/></linearGradient><filter id="sh-bln"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/></filter></defs><path d="M19 11 L45 11 L39 39 L25 39 Z" fill="#E0F2FE" opacity="0.8" stroke="#38BDF8" stroke-width="1.5"/><rect x="23" y="39" width="18" height="19" rx="5" fill="url(#g-bln)" filter="url(#sh-bln)"/><circle cx="32" cy="48" r="2.8" fill="#F8FAFC"/></svg>`
};

// ─── المؤثرات الصوتية الخفيفة المدمجة (Web Audio API) ───
let audioCtx = null;
let soundEnabled = true;
let speechEnabled = true;

function initAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, type = 'sine', duration = 0.12) {
  if (!soundEnabled) return;
  initAudioContext();
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {}
}

function playSelectSound() {
  playTone(587.33, 'triangle', 0.1); // D5
}

function playFlipSound() {
  playTone(440, 'sine', 0.14); // A4
}

function playWinSound() {
  if (!soundEnabled) return;
  initAudioContext();
  if (!audioCtx) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 'triangle', 0.22), idx * 110);
  });
}

function playErrorSound() {
  playTone(220, 'sawtooth', 0.25);
}

// التوجيه الصوتي العربي الموحد (نبرة طفولية ناعمة تحفيزية لطلاب الصف الرابع)
function speakArabic(text) {
  if (!speechEnabled) return;
  speak(text, 'ar', { pitch: 1.22, rate: 0.94 });
}

// ─── إدارة حالة النشاط ───
let totalScore = 0;
let totalChallenges = 0;
let currentTargetType = 'battery'; // 'battery' أو 'mains'
let currentDevices = []; // الأجهزة الـ 4 المعروضة حالياً
let selectedIds = new Set();
let isAnswerChecked = false;

// اختيار 4 أجهزة ذكية متوازنة (2 بطارية + 2 كهرباء منزل)
function pickChallengeDevices() {
  const batteries = ALL_DEVICES.filter(d => d.type === 'battery').sort(() => Math.random() - 0.5);
  const mains = ALL_DEVICES.filter(d => d.type === 'mains').sort(() => Math.random() - 0.5);
  
  const picked = [batteries[0], batteries[1], mains[0], mains[1]];
  return picked.sort(() => Math.random() - 0.5);
}

// ─── بناء واجهة المستخدم 100vh ───
export function initStaticLab() {
  const app = document.getElementById('app') || document.body;
  app.innerHTML = `
    <div class="static-app-root">
      <!-- 1. الترويسة الرئيسية -->
      <header class="static-header">
        <a href="./index.html" class="static-brand" id="brand-link">
          <div class="static-brand-icon">⚡</div>
          <div class="static-brand-title">
            <h1>متحري مصادر الكهرباء</h1>
            <span>مادة العلوم — الصف الرابع الابتدائي</span>
          </div>
        </a>

        <nav class="static-header-nav">
          <button type="button" id="btn-ar-launch" class="static-nav-btn btn-ar" title="فتح كاميرا الواقع المعزز الحقيقي">
            📷 <span>الواقع المعزز AR</span>
          </button>
          <button type="button" id="btn-voice-toggle" class="static-nav-btn icon-only" title="تفعيل/تعطيل التوجيه الصوتي">
            🗣️
          </button>
          <button type="button" id="btn-sound-toggle" class="static-nav-btn icon-only" title="تفعيل/تعطيل المؤثرات الصوتية">
            🔊
          </button>
          <button type="button" id="btn-cert-open" class="static-nav-btn" title="شهادة الإنجاز">
            🎓 <span>الشهادة</span>
          </button>
          <a href="./dynamic-lab.html" class="static-nav-btn" id="dynamic-link" title="الانتقال للمختبر المتحرك">
            🧪 <span>المتحرك</span>
          </a>
        </nav>
      </header>

      <!-- لافتة الفوز المدمجة الفورية -->
      <div class="static-victory-overlay" id="victory-banner">
        <div class="victory-text-group">
          <span class="victory-trophy">🏆🌟</span>
          <div>
            <div class="victory-title" id="victory-title">كفو يا بطل العلوم! إجابة صحيحة 100%!</div>
            <div class="victory-sub">كشفت جميع الأجهزة المطلوبة وتجنبت الفخاخ ببراعة!</div>
          </div>
        </div>
        <button type="button" class="static-btn btn-verify" id="btn-next-challenge">
          <span>خوض تحدٍ جديد ➔</span>
        </button>
      </div>

      <!-- 2. شريط المهمة والتحدي (HUD) -->
      <section class="static-mission-hud">
        <div class="static-mission-info">
          <div class="static-target-chip" id="target-chip">
            <span id="target-icon">🔋</span>
            <span id="target-title">تحدي البطاريات الجافة</span>
          </div>
          <div class="static-mission-instruction" id="mission-instruction">
            حَدِّدْ جهازين يعملان بهذا المصدر، واضغط فحص 3D لكشف الدليل!
          </div>
          <button type="button" class="static-btn-listen" id="btn-listen-mission" title="استمع للتعليمات صوتياً">
            📢 <span>استمع للتوجيه</span>
          </button>
        </div>

        <div class="static-mission-stats">
          <div class="static-stat-pill">
            <span>🏆 النقاط:</span>
            <span class="val" id="stat-score">0</span>
          </div>
          <div class="static-stat-pill">
            <span>🎯 التحديات:</span>
            <span class="val" id="stat-challenges">0</span>
          </div>
          <div class="static-stat-pill">
            <span>✔️ المحددة:</span>
            <span class="val" id="stat-selected">0 / 2</span>
          </div>
        </div>
      </section>

      <!-- 3. ساحة البطاقات التفاعلية 3D -->
      <main class="static-cards-stage" id="cards-stage"></main>

      <!-- 4. شريط الأوامر التقويمية السفلي -->
      <footer class="static-actions-bar">
        <div class="static-actions-right">
          <button type="button" class="static-btn btn-verify" id="btn-validate">
            <span>🔍 تحقق من إجابتي</span>
          </button>
          <button type="button" class="static-btn btn-secondary" id="btn-hint">
            <span>💡 تلميح المحقق</span>
          </button>
          <button type="button" class="static-btn btn-secondary" id="btn-refresh">
            <span>🔄 أجهزة أخرى</span>
          </button>
        </div>

        <button type="button" class="static-btn btn-secondary" id="btn-summary">
          <span>📋 كشف التصنيف والمقارنة</span>
        </button>
      </footer>

      <!-- 5. نافذة كشف المقارنة والتصنيف العلمي الموحدة -->
      <dialog class="static-dialog" id="summary-dialog">
        <div class="dialog-header">
          <h3>📋 كشف التحقيق: المقارنة العلمية لمصادر الطاقة</h3>
          <button type="button" class="dialog-close-btn" id="summary-close-btn">✕</button>
        </div>
        <div class="summary-table-container">
          <div class="summary-col battery-col">
            <h4>🔋 أجهزة تعمل بالبطارية الجافة:</h4>
            <div id="battery-summary-list"></div>
          </div>
          <div class="summary-col house-col">
            <h4>⚡ أجهزة تعمل بكهرباء المنزل 220V:</h4>
            <div id="house-summary-list"></div>
          </div>
        </div>
      </dialog>

      <!-- 6. نافذة شهادة الإنجاز الفخمة -->
      <dialog class="static-dialog" id="cert-dialog">
        <div class="dialog-header">
          <h3>🎓 شهادة تميّز متحرّي العلوم</h3>
          <button type="button" class="dialog-close-btn" id="cert-close-btn">✕</button>
        </div>
        <div style="text-align: center; padding: 10px 0;">
          <div style="font-size: 2.5rem; margin-bottom: 6px;">🎖️📜🎖️</div>
          <h2 style="font-size: 1.25rem; font-weight: 900; color: var(--frog-dark); margin-bottom: 4px;">مبارك اجتياز تحديات مصادر الكهرباء!</h2>
          <p style="font-size: 0.88rem; color: var(--frog); margin-bottom: 14px;">مادة العلوم — الصف الرابع الابتدائي</p>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 0.82rem; font-weight: 800; margin-bottom: 6px;">ادخل اسمك يا بطل العلوم:</label>
            <input type="text" id="cert-name-input" value="البطل الصغير" style="border: 2px solid var(--gold); border-radius: 12px; padding: 8px 16px; font-size: 1rem; font-weight: 900; text-align: center; font-family: inherit; width: 80%; max-width: 280px;" />
          </div>

          <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 20px;">
            <div class="static-stat-pill">🏆 مجموع النقاط: <strong class="val" id="cert-score-val">0</strong></div>
            <div class="static-stat-pill">🎯 التحديات: <strong class="val" id="cert-challenges-val">0</strong></div>
          </div>

          <button type="button" class="static-btn btn-verify" onclick="window.print()" style="margin: 0 auto;">
            <span>🖨️ طباعة الشهادة</span>
          </button>
        </div>
      </dialog>
    </div>
  `;

  // ربط أحداث أزرار الترويسة والتحكم
  bindEvents();

  // بدء التحدي الأول
  startNewChallenge();
}

// ─── فتح مدخل الواقع المعزز الحقيقي (True AR Gateway) ───
function openArGateway() {
  launchArGateway({
    title: 'النشاط التقويمي الثابت | مصادر الكهرباء',
    mode: 'static',
    onContinue: () => {
      speakArabic(
        'مرحباً بك يا بطل العلوم في النشاط التقويمي! حَدِّدْ جهازين يعملان بالمصدر المطلوب وتجنب الفخاخ. اضغط على الأجهزة لاختيارها، واضغط فحص ثري دي لكشف أسرارها!'
      );
    }
  });
}

// ─── ربط الأحداث الرئيسية ───
function bindEvents() {
  // زر AR
  document.getElementById('btn-ar-launch')?.addEventListener('click', openArGateway);

  // تبديل الصوت
  const voiceBtn = document.getElementById('btn-voice-toggle');
  voiceBtn?.addEventListener('click', () => {
    speechEnabled = !speechEnabled;
    voiceBtn.textContent = speechEnabled ? '🗣️' : '🔇';
    if (!speechEnabled) stopAudio();
    else speakArabic('تم تفعيل التوجيه الصوتي');
  });

  const soundBtn = document.getElementById('btn-sound-toggle');
  soundBtn?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? '🔊' : '🔈';
  });

  // أزرار الشهادة والمقارنة
  const certDialog = document.getElementById('cert-dialog');
  document.getElementById('btn-cert-open')?.addEventListener('click', () => {
    document.getElementById('cert-score-val').textContent = totalScore;
    document.getElementById('cert-challenges-val').textContent = totalChallenges;
    certDialog?.showModal();
  });
  document.getElementById('cert-close-btn')?.addEventListener('click', () => certDialog?.close());

  const summaryDialog = document.getElementById('summary-dialog');
  document.getElementById('btn-summary')?.addEventListener('click', () => {
    populateSummaryModal();
    summaryDialog?.showModal();
  });
  document.getElementById('summary-close-btn')?.addEventListener('click', () => summaryDialog?.close());

  // أزرار الأوامر
  document.getElementById('btn-validate')?.addEventListener('click', validateSelection);
  document.getElementById('btn-hint')?.addEventListener('click', giveDetectiveHint);
  document.getElementById('btn-refresh')?.addEventListener('click', startNewChallenge);
  document.getElementById('btn-next-challenge')?.addEventListener('click', startNewChallenge);
  document.getElementById('btn-listen-mission')?.addEventListener('click', speakCurrentMission);

  // ضبط الروابط وفق موضع الملف (public أو root)
  const isInsidePublic = window.location.pathname.includes('/public/');
  const brandLink = document.getElementById('brand-link');
  const dynamicLink = document.getElementById('dynamic-link');
  if (brandLink) brandLink.href = isInsidePublic ? '../index.html' : './index.html';
  if (dynamicLink) dynamicLink.href = isInsidePublic ? './dynamic-lab.html' : './dynamic-lab.html';
}

// ─── بدء جولة تحدٍّ جديدة ───
function startNewChallenge() {
  isAnswerChecked = false;
  selectedIds.clear();
  document.getElementById('victory-banner').style.display = 'none';

  // التبديل الدوري بين تحدي البطاريات وكهرباء المنزل
  currentTargetType = Math.random() > 0.5 ? 'battery' : 'mains';

  const chip = document.getElementById('target-chip');
  const targetIcon = document.getElementById('target-icon');
  const targetTitle = document.getElementById('target-title');

  if (currentTargetType === 'battery') {
    chip.className = 'static-target-chip chip-battery';
    targetIcon.textContent = '🔋';
    targetTitle.textContent = 'تحدي البطاريات الجافة';
  } else {
    chip.className = 'static-target-chip chip-house';
    targetIcon.textContent = '⚡';
    targetTitle.textContent = 'تحدي كهرباء المنزل 220V';
  }

  updateSelectionCounter();

  // اختيار 4 أجهزة وعرضها في الساحة
  currentDevices = pickChallengeDevices();
  renderCards(currentDevices);

  // نطق التعليمات باللغة العربية الواضحة
  speakCurrentMission();
}

// ─── نطق مهمة التحدي بصوت تشجيعي طفولي دون حرق الإجابة ───
function speakCurrentMission() {
  if (currentTargetType === 'battery') {
    speakArabic('هيا يا بطل العلوم! ابحث عن جهازين يعملان بالبطاريات، واضغط فحص 3D لتكتشف حجرة البطاريات أو سلك الكهرباء!');
  } else {
    speakArabic('هيا يا ذكي! ابحث عن جهازين يحتاجان كهرباء المنزل القوية، واضغط فحص 3D لتفحص الجهاز بنفسك!');
  }
}

// ─── رسم البطاقات التفاعلية 3D بدون أي حرق نصي ───
function renderCards(devices) {
  const stage = document.getElementById('cards-stage');
  if (!stage) return;
  stage.innerHTML = '';

  devices.forEach((dev) => {
    const wrap = document.createElement('div');
    wrap.className = 'card-3d-wrap';

    const svgIcon = SVG_MAP[dev.id] || `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#FFB703"/></svg>`;

    wrap.innerHTML = `
      <div class="card-3d-inner" id="card-inner-${dev.id}">
        <!-- الوجه الأمامي: نظيف بدون أي تلميحات نصية محروقة -->
        <div class="card-face card-face-front" data-id="${dev.id}">
          <div class="card-select-badge" id="badge-${dev.id}">○</div>
          <div class="card-visual-box">
            ${svgIcon}
          </div>
          <div class="card-device-name">${dev.name}</div>
          <button type="button" class="btn-flip-inspect" data-inspect="${dev.id}" title="فحص الجهاز ثلاثي الأبعاد والبحث عن الدليل">
            🔍 <span>فحص 3D</span>
          </button>
        </div>

        <!-- الوجه الخلفي (3D Flip) -->
        <div class="card-face card-face-back">
          <div class="back-header">
            <strong style="font-size:0.85rem;">🔍 دليل الفحص والملاحظة</strong>
          </div>
          <div class="back-reason-box">
            <div class="back-reason-title">${dev.name}</div>
            <div class="back-reason-text">${dev.reason}</div>
            <button type="button" class="static-btn-listen" data-speak-reason="${dev.id}" style="align-self:center; margin-top:4px;">
              📢 <span>استمع للتوجيه</span>
            </button>
          </div>
          <button type="button" class="btn-flip-back" data-flipback="${dev.id}">
            ↩️ عودة للبطاقة
          </button>
        </div>
      </div>
    `;

    // تفاعل النقر للتحديد (على الوجه الأمامي)
    const front = wrap.querySelector('.card-face-front');
    front.addEventListener('click', (e) => {
      // إذا نقر زر الفحص لا نحدد
      if (e.target.closest('.btn-flip-inspect')) return;
      toggleDeviceSelection(dev.id);
    });

    // تفاعل فتح فحص 3D عبر الواقع المعزز (AR on Demand)
    const inspectBtn = wrap.querySelector(`[data-inspect="${dev.id}"]`);
    const flipBackBtn = wrap.querySelector(`[data-flipback="${dev.id}"]`);
    const speakReasonBtn = wrap.querySelector(`[data-speak-reason="${dev.id}"]`);
    const inner = wrap.querySelector(`#card-inner-${dev.id}`);

    inspectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeviceArInspector(dev);
    });

    flipBackBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      inner.classList.remove('is-flipped');
      playFlipSound();
    });

    speakReasonBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      speakArabic(`تفحص ${dev.name} جيداً! انظر هل يمتلك حجرة بطاريات صغيرة، أم سلكاً ينتهي بفيشة كهرباء؟`);
    });

    // تأثير الإمالة ثلاثي الأبعاد بالماوس أو اللمس (3D Perspective Tilt)
    wrap.addEventListener('pointermove', (e) => {
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotX = -(y / (rect.height / 2)) * 7;
      const rotY = (x / (rect.width / 2)) * 7;
      if (!inner.classList.contains('is-flipped')) {
        inner.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
      }
    });

    wrap.addEventListener('pointerleave', () => {
      if (!inner.classList.contains('is-flipped')) {
        inner.style.transform = '';
      }
    });

    stage.appendChild(wrap);
  });
}

// ─── محاكي فحص الواقع المعزز عند الطلب (AR Inspector on Demand) ───
let arActiveStream = null;
let arAnimationId = null;

function openDeviceArInspector(dev) {
  playFlipSound();

  // تشجيع صوتي دون حرق الإجابة
  speakArabic(`هيا يا محقق! تفحص ${dev.name} من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟`);

  // إزالة أي شاشة سابقة إن وجدت
  document.getElementById('ar-inspector-overlay')?.remove();

  const isBattery = dev.type === 'battery';
  const clueTitle = isBattery ? 'تلميح بصري: تفحص خلف الجهاز وأسفله 🔍' : 'تلميح بصري: تفحص كابل الطاقة والمقبس 🔍';
  const clueDesc = isBattery
    ? 'لاحظ فتحة البطارية والزنبرك المعدني (+ / -) المصمم لخلايا الطاقة الجافة.'
    : 'لاحظ سلك الكهرباء المتين الذي ينتهي بفيشة ثنائية جاهزة للتوصيل بالجدار.';

  const overlay = document.createElement('div');
  overlay.id = 'ar-inspector-overlay';
  overlay.className = 'ar-inspector-overlay';
  overlay.innerHTML = `
    <video class="ar-inspector-camera" id="ar-cam-video" autoplay playsinline muted></video>
    <div class="ar-inspector-canvas-wrap" id="ar-three-container"></div>

    <div class="ar-inspector-header">
      <div class="ar-inspector-title-group">
        <div class="ar-inspector-badge-icon">${isBattery ? '🔋' : '⚡'}</div>
        <div class="ar-inspector-title-text">
          <strong>فحص 3D: ${dev.name}</strong>
          <small>ابحث عن الدليل البصري لمصدر الطاقة</small>
        </div>
      </div>
      <button type="button" class="ar-inspector-close-btn" id="btn-close-ar" title="إغلاق الفحص">✕</button>
    </div>

    <div class="ar-clue-guidance-box">
      <div class="ar-clue-icon">${isBattery ? '🔋' : '⚡'}</div>
      <div class="ar-clue-text">
        <strong>${clueTitle}</strong>
        <p>${clueDesc} — حرك إصبعك لتدوير المجسم 360 درجة!</p>
      </div>
    </div>

    <div class="ar-inspector-footer">
      <button type="button" class="ar-cam-toggle-btn" id="btn-toggle-cam">
        📷 <span>الكاميرا: جاري التشغيل...</span>
      </button>
      <button type="button" class="ar-return-btn" id="btn-done-ar">
        <span>✔️ فهمت الدليل! عودة للحل</span>
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // تشغيل الكاميرا الحقيقية في الخلفية
  const videoEl = document.getElementById('ar-cam-video');
  const camToggleBtn = document.getElementById('btn-toggle-cam');
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    .then(stream => {
      arActiveStream = stream;
      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.play().catch(() => {});
      }
      if (camToggleBtn) camToggleBtn.innerHTML = '📷 <span>الكاميرا تعمل (واقع معزز)</span>';
    })
    .catch(() => {
      if (camToggleBtn) camToggleBtn.innerHTML = '🖼️ <span>وضع المعاينة ثلاثية الأبعاد</span>';
    });
  } else {
    if (camToggleBtn) camToggleBtn.innerHTML = '🖼️ <span>وضع المعاينة ثلاثية الأبعاد</span>';
  }

  // بناء مشهد Three.js
  const container = document.getElementById('ar-three-container');
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.35, 5.2);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // إضاءة واقعية
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.3);
  dirLight.position.set(4, 7, 5);
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(isBattery ? 0x22c55e : 0x3b82f6, 1.8, 12);
  pointLight.position.set(0, -0.5, 2.5);
  scene.add(pointLight);

  // بناء مجسم الجهاز مع التلميح البصري الواقعي
  const deviceGroup = buildClueDeviceMesh(dev);
  scene.add(deviceGroup);

  // التحكم التفاعلي باللمس والماوس للتدوير الحر (360° Rotation)
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };

  const onPointerDown = (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;
    deviceGroup.rotation.y += deltaX * 0.012;
    deviceGroup.rotation.x += deltaY * 0.012;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = () => {
    isDragging = false;
  };

  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  // حلقة التصيير والتحريك الطافي
  let clock = 0;
  const animate = () => {
    arAnimationId = requestAnimationFrame(animate);
    clock += 0.02;
    if (!isDragging) {
      deviceGroup.rotation.y += 0.006;
      deviceGroup.position.y = Math.sin(clock) * 0.08;
    }
    renderer.render(scene, camera);
  };
  animate();

  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);

  // إغلاق المعاينة والعودة للنشاط
  const closeInspector = () => {
    if (arAnimationId) cancelAnimationFrame(arAnimationId);
    if (arActiveStream) {
      arActiveStream.getTracks().forEach(track => track.stop());
      arActiveStream = null;
    }
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('resize', handleResize);
    overlay.remove();
    renderer.dispose();
  };

  document.getElementById('btn-close-ar')?.addEventListener('click', closeInspector);
  document.getElementById('btn-done-ar')?.addEventListener('click', closeInspector);
}

// ─── بناء مجسم ثلاثي الأبعاد واقعي لكل جهاز يحتوي على التلميح البصري ───
function buildClueDeviceMesh(dev) {
  const group = new THREE.Group();
  const isBattery = dev.type === 'battery';
  const id = dev.id || '';

  if (isBattery) {
    // ══════════════════════════════════════════════════════════
    // أجهزة البطارية الجافة (مع حجرة بطارية مفتوحة وزوج بطاريات AA)
    // ══════════════════════════════════════════════════════════
    if (id === 'flashlight') {
      // كشاف الجيب: أسطوانة معدنية بمقدمة مضيئة مع حجرة خلفية مفتوحة
      const tubeGeo = new THREE.CylinderGeometry(0.4, 0.45, 2.2, 24);
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      group.add(tube);

      const headGeo = new THREE.CylinderGeometry(0.7, 0.45, 0.8, 24);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.3;
      group.add(head);

      const lensGeo = new THREE.CircleGeometry(0.65, 24);
      const lensMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 0.6 });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.rotation.x = -Math.PI / 2;
      lens.position.y = 1.71;
      group.add(lens);
    } else if (id === 'digitalScale') {
      // ميزان رقمي: لوح زجاجي مقوى وقاعدة سفلية
      const plateGeo = new THREE.BoxGeometry(2.4, 0.15, 2.4);
      const plateMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.1, transparent: true, opacity: 0.9 });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      group.add(plate);

      const baseGeo = new THREE.BoxGeometry(2.0, 0.3, 2.0);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = -0.22;
      group.add(base);

      const lcdGeo = new THREE.PlaneGeometry(0.8, 0.35);
      const lcdMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const lcd = new THREE.Mesh(lcdGeo, lcdMat);
      lcd.rotation.x = -Math.PI / 2;
      lcd.position.set(0, 0.08, -0.6);
      group.add(lcd);
    } else {
      // مجسم جهاز بطارية قياسي (سيارة، راديو، ريموت، ساعة)
      const bodyGeo = new THREE.BoxGeometry(2.0, 1.4, 0.9);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2b4c7e, roughness: 0.35, metalness: 0.2 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(body);

      const screenGeo = new THREE.PlaneGeometry(1.5, 0.8);
      const screenMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 0, 0.46);
      group.add(screen);
    }

    // حجرة البطاريات المفتوحة في الخلف (Visual Clue)
    const bayGeo = new THREE.BoxGeometry(1.4, 0.85, 0.3);
    const bayMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const bay = new THREE.Mesh(bayGeo, bayMat);
    bay.position.set(0, 0, -0.32);
    group.add(bay);

    // بطاريتان جافتان AA مع أقطاب ذهبية وزلزنبركات
    for (let i = -1; i <= 1; i += 2) {
      const battGeo = new THREE.CylinderGeometry(0.16, 0.16, 1.05, 20);
      const battMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.75, roughness: 0.25 });
      const batt = new THREE.Mesh(battGeo, battMat);
      batt.rotation.z = Math.PI / 2;
      batt.position.set(0, i * 0.22, -0.32);
      group.add(batt);

      // رأس القطب الموجب (+)
      const capGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.1, 16);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.rotation.z = Math.PI / 2;
      cap.position.set(i === -1 ? 0.58 : -0.58, i * 0.22, -0.32);
      group.add(cap);

      // زنبرك القطب السالب (-)
      const springGeo = new THREE.TorusGeometry(0.1, 0.025, 8, 16);
      const springMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85 });
      const spring = new THREE.Mesh(springGeo, springMat);
      spring.rotation.y = Math.PI / 2;
      spring.position.set(i === -1 ? -0.55 : 0.55, i * 0.22, -0.32);
      group.add(spring);
    }
  } else {
    // ══════════════════════════════════════════════════════════
    // أجهزة كهرباء المنزل (مع سلك كهرباء قوي وقابس جداري ثنائي)
    // ══════════════════════════════════════════════════════════
    if (id === 'electricWaterHeater') {
      // سخان ماء أسطواني رأسي أبيض مع مقياس حرارة ومواسير
      const tankGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.2, 32);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.25 });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      group.add(tank);

      // غطاءان علوي وسفلي
      for (let y of [1.1, -1.1]) {
        const capGeo = new THREE.SphereGeometry(0.85, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = y;
        if (y < 0) cap.rotation.x = Math.PI;
        group.add(cap);
      }

      // مقياس درجة الحرارة الدائري في الأمام
      const gaugeGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 20);
      const gaugeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      const gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
      gauge.rotation.x = Math.PI / 2;
      gauge.position.set(0, 0.3, 0.86);
      group.add(gauge);

      // مؤشر أحمر للمقياس
      const needleGeo = new THREE.BoxGeometry(0.04, 0.2, 0.04);
      const needleMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const needle = new THREE.Mesh(needleGeo, needleMat);
      needle.position.set(0, 0.3, 0.91);
      group.add(needle);

      // أنبوب ماء أزرق وأحمر في الأسفل
      const pipeGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.4, 12);
      const coldPipe = new THREE.Mesh(pipeGeo, new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
      coldPipe.position.set(-0.35, -1.3, 0);
      const hotPipe = new THREE.Mesh(pipeGeo, new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      hotPipe.position.set(0.35, -1.3, 0);
      group.add(coldPipe);
      group.add(hotPipe);
    } else if (id === 'washer') {
      // غسالة أوتوماتيكية مع نافذة دائرية زجاجية وباب
      const bodyGeo = new THREE.BoxGeometry(1.9, 2.2, 1.8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.25 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(body);

      // حوض الغسالة الزجاجي
      const doorRimGeo = new THREE.TorusGeometry(0.65, 0.09, 16, 32);
      const doorRimMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
      const doorRim = new THREE.Mesh(doorRimGeo, doorRimMat);
      doorRim.position.set(0, -0.15, 0.91);
      group.add(doorRim);

      const glassGeo = new THREE.CircleGeometry(0.6, 24);
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.65 });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(0, -0.15, 0.92);
      group.add(glass);

      // درج المسحوق وشاشة التحكم
      const drawerGeo = new THREE.BoxGeometry(0.6, 0.25, 0.04);
      const drawer = new THREE.Mesh(drawerGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      drawer.position.set(-0.55, 0.85, 0.91);
      group.add(drawer);
    } else {
      // جسم جهاز منزلي معدني قياسي (ثلاجة، فرن، ميكروويف...)
      const bodyGeo = new THREE.BoxGeometry(1.9, 2.2, 1.4);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.35, roughness: 0.2 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(body);

      const panelGeo = new THREE.PlaneGeometry(1.5, 1.8);
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5 });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(0, 0, 0.71);
      group.add(panel);
    }

    // سلك كهرباء أسود ممتد بوضوح من خلف الجهاز إلى الأسفل
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.8, -0.6),
      new THREE.Vector3(0.5, -1.2, -0.8),
      new THREE.Vector3(0.9, -1.4, -0.3),
      new THREE.Vector3(1.3, -1.5, 0.2)
    ]);
    const cableGeo = new THREE.TubeGeometry(curve, 24, 0.075, 12, false);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    group.add(cable);

    // رأس الفيشة الكهربائية المنزلية (Plug Head)
    const plugGeo = new THREE.BoxGeometry(0.32, 0.24, 0.38);
    const plugMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 });
    const plug = new THREE.Mesh(plugGeo, plugMat);
    plug.position.set(1.3, -1.5, 0.2);
    group.add(plug);

    // مسمارا الفيشة المعدنيان البارزان (Prongs)
    for (let p of [-0.08, 0.08]) {
      const pinGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.28, 12);
      const pinMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.95, roughness: 0.1 });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.rotation.x = Math.PI / 2;
      pin.position.set(1.3 + p, -1.5, 0.48);
      group.add(pin);
    }
  }

  // زاوية مبدئية توضح التلميح بوضوح
  group.rotation.y = Math.PI * 0.2;
  group.rotation.x = 0.08;

  return group;
}

// ─── تبديل تحديد الجهاز ───
function toggleDeviceSelection(devId) {
  if (isAnswerChecked) return;

  const dev = currentDevices.find(d => d.id === devId);
  if (!dev) return;

  const cardFront = document.querySelector(`.card-face-front[data-id="${devId}"]`);
  const badge = document.getElementById(`badge-${devId}`);

  if (selectedIds.has(devId)) {
    selectedIds.delete(devId);
    cardFront?.classList.remove('is-selected');
    if (badge) badge.textContent = '○';
    playSelectSound();
    speakArabic(`ألغيتَ تحديد ${dev.name}! اخْتَرْ جهازاً آخر.`);
  } else {
    if (selectedIds.size >= 2) {
      speakArabic('حَدِّدْ جهازين فقط يا بطل، أو ألغِ تحديد أحدهما أولاً!');
      return;
    }
    selectedIds.add(devId);
    cardFront?.classList.add('is-selected');
    if (badge) badge.textContent = '✔️';
    playSelectSound();
    if (selectedIds.size === 2) {
      speakArabic(`حَدَّدْتَ ${dev.name}! رائع، اكتمل جهازان! اضغط الآن زر: تحقق من إجابتي.`);
    } else {
      speakArabic(`حَدَّدْتَ ${dev.name}! اخْتَرْ جهازاً ثانياً يا بطل.`);
    }
  }

  updateSelectionCounter();
}

function updateSelectionCounter() {
  const el = document.getElementById('stat-selected');
  if (el) el.textContent = `${selectedIds.size} / 2`;
}

// ─── التحقق من الإجابة التقويمية ───
function validateSelection() {
  if (selectedIds.size === 0) {
    speakArabic('اخْتَرْ جهازين أولاً يا بطل العلوم!');
    return;
  }

  if (selectedIds.size < 2) {
    speakArabic('اخْتَرْ جهازين لتكتمل إجابتك، متبقٍ جهاز واحد يا بطل!');
    return;
  }

  // الأجهزة الصحيحة في هذا التحدي
  const targetDevices = currentDevices.filter(d => d.type === currentTargetType);
  const targetIds = new Set(targetDevices.map(d => d.id));

  // مطابقة الاختيار
  let isCorrect = true;
  selectedIds.forEach(id => {
    if (!targetIds.has(id)) isCorrect = false;
  });

  if (isCorrect) {
    // 🏆 إجابة صحيحة 100%
    isAnswerChecked = true;
    totalScore += 100;
    totalChallenges += 1;
    document.getElementById('stat-score').textContent = totalScore;
    document.getElementById('stat-challenges').textContent = totalChallenges;

    playWinSound();
    showVictoryBanner();

    speakArabic('رائع جداً! أحسنت عملاً يا بطل العلوم! إجابتك صحيحة مئة بالمئة! كشفت جميع الأجهزة وتجنبت الفخاخ ببراعة!');
  } else {
    // ❌ إجابة تحتوي على فخ
    playErrorSound();

    // البحث عن الجهاز الخاطئ الذي تم اختياره لتقديم تعليل فوري
    const wrongChosenId = Array.from(selectedIds).find(id => !targetIds.has(id));
    const wrongDev = currentDevices.find(d => d.id === wrongChosenId);

    if (wrongDev) {
      speakArabic(`حاول مرة أخرى يا بطل! تفحص جهاز ${wrongDev.name} عبر زر فحص ثري دي واكتشف مصدر طاقته بنفسك!`);
    } else {
      speakArabic('حاول مرة أخرى يا بطل! تفحص الأجهزة ثلاثية الأبعاد واكتشف الدليل البصري!');
    }
  }
}

function showVictoryBanner() {
  const banner = document.getElementById('victory-banner');
  if (banner) {
    banner.style.display = 'flex';
  }
}

// ─── تلميح المحقق الذكي (تحفيزي واستكشافي دون حرق الإجابة) ───
function giveDetectiveHint() {
  playSelectSound();
  if (currentTargetType === 'battery') {
    speakArabic(
      'تلميح المحقق: اضغط زر فحص ثري دي على الأجهزة، وابحث عن الجهاز الذي يحتوي على حجرة بطاريات صغيرة وزوج من الأقطاب!'
    );
  } else {
    speakArabic(
      'تلميح المحقق: اضغط زر فحص ثري دي على الأجهزة، وابحث عن الجهاز الذي يمتد منه سلك كهربائي قوي ينتهي بفيشة جدارية!'
    );
  }
}

// ─── تعبئة جدول المقارنة العلمية الشامل ───
function populateSummaryModal() {
  const batteryList = document.getElementById('battery-summary-list');
  const houseList = document.getElementById('house-summary-list');
  if (!batteryList || !houseList) return;

  batteryList.innerHTML = '';
  houseList.innerHTML = '';

  currentDevices.forEach(d => {
    const item = document.createElement('div');
    item.className = 'summary-device-item';
    item.innerHTML = `
      <strong>${d.name} (${d.voltage || (d.type === 'battery' ? '1.5V' : '220V')})</strong>
      <p>${d.reason}</p>
    `;

    if (d.type === 'battery') {
      batteryList.appendChild(item);
    } else {
      houseList.appendChild(item);
    }
  });
}

// ─── التشغيل التلقائي عند اكتمال تحميل DOM ───
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStaticLab);
  } else {
    initStaticLab();
  }
}
