// ═══════════════════════════════════════════════════════════════════════════
// static-main.js — المحرك المركزي للنشاط التقويمي الثابت (100vh Responsive Module)
// مدعوم بمدخل الواقع المعزز الحقيقي (True AR)، والتوجيه الصوتي، والبطاقات ثلاثية الأبعاد
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { launchArGateway, launchARGateway } from './ar.js';
import { speak, stopAudio } from './audio.js';
import { ALL_DEVICES } from './config.js';

// ─── بنك رسومات SVG الـ 24 عالية الدقة والتباين والوضوح (High-Contrast 3D Skeuomorphic) ───
const SVG_MAP = {
  remote: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-rem-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#475569"/><stop offset="50%" stop-color="#1E293B"/><stop offset="100%" stop-color="#0F172A"/></linearGradient><linearGradient id="g-rem-btn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0284C7"/></linearGradient><radialGradient id="g-ir" cx="30%" cy="30%" r="70%"><stop offset="0%" stop-color="#FF6B6B"/><stop offset="100%" stop-color="#DC2626"/></radialGradient><filter id="sh-rem-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.35"/></filter></defs><g filter="url(#sh-rem-3d)"><rect x="18" y="7" width="28" height="51" rx="13" fill="url(#g-rem-b)" stroke="#64748B" stroke-width="1.8"/><rect x="22" y="11" width="20" height="43" rx="9" fill="#090D16"/><circle cx="32" cy="7.5" r="2.5" fill="url(#g-ir)"/><circle cx="32" cy="18" r="5" fill="#EF4444" stroke="#DC2626" stroke-width="1"/><circle cx="32" cy="18" r="2" fill="#FFFFFF"/><circle cx="26" cy="28" r="2.8" fill="url(#g-rem-btn)"/><circle cx="38" cy="28" r="2.8" fill="url(#g-rem-btn)"/><circle cx="26" cy="36" r="2.8" fill="url(#g-rem-btn)"/><circle cx="38" cy="36" r="2.8" fill="url(#g-rem-btn)"/><rect x="25" y="43" width="14" height="4" rx="2" fill="#F59E0B"/></g></svg>`,
  flashlight: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-fl-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#64748B"/><stop offset="60%" stop-color="#334155"/><stop offset="100%" stop-color="#1E293B"/></linearGradient><linearGradient id="g-fl-head" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FDE047"/><stop offset="50%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#D97706"/></linearGradient><radialGradient id="g-beam" cx="0%" cy="50%" r="100%"><stop offset="0%" stop-color="#FEF08A" stop-opacity="0.95"/><stop offset="100%" stop-color="#FDE047" stop-opacity="0"/></radialGradient><filter id="sh-fl-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#1E293B" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-fl-3d)"><path d="M12 24 L25 18 L25 46 L12 40 Z" fill="url(#g-fl-head)" stroke="#B45309" stroke-width="1.6"/><rect x="25" y="21" width="28" height="22" rx="5" fill="url(#g-fl-body)" stroke="#1E293B" stroke-width="1.6"/><rect x="53" y="25" width="6" height="14" rx="3" fill="#1E293B"/><rect x="33" y="18" width="9" height="4" rx="2" fill="#EF4444"/><polygon points="12,24 2,16 2,48 12,40" fill="url(#g-beam)"/></g></svg>`,
  wallClock: `<svg viewBox="0 0 64 64"><defs><radialGradient id="g-clk-dial" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="70%" stop-color="#F8FAFC"/><stop offset="100%" stop-color="#E2E8F0"/></radialGradient><linearGradient id="g-clk-wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F59E0B"/><stop offset="50%" stop-color="#D97706"/><stop offset="100%" stop-color="#92400E"/></linearGradient><filter id="sh-clk-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#1E293B" flood-opacity="0.25"/></filter></defs><circle cx="32" cy="32" r="27" fill="url(#g-clk-wood)" filter="url(#sh-clk-3d)" stroke="#78350F" stroke-width="2"/><circle cx="32" cy="32" r="21" fill="url(#g-clk-dial)" stroke="#94A3B8" stroke-width="1.8"/><circle cx="32" cy="14" r="1.8" fill="#0F172A"/><circle cx="50" cy="32" r="1.8" fill="#0F172A"/><circle cx="32" cy="50" r="1.8" fill="#0F172A"/><circle cx="14" cy="32" r="1.8" fill="#0F172A"/><line x1="32" y1="32" x2="32" y2="17" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/><line x1="32" y1="32" x2="44" y2="32" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="32" r="3.5" fill="#0F172A"/></svg>`,
  car: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-car-paint" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EF4444"/><stop offset="50%" stop-color="#DC2626"/><stop offset="100%" stop-color="#991B1B"/></linearGradient><radialGradient id="g-car-tire" cx="35%" cy="30%" r="65%"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#0F172A"/></radialGradient><filter id="sh-car-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-car-3d)"><path d="M13 25 L21 14 L43 14 L51 25 Z" fill="#991B1B"/><rect x="6" y="24" width="52" height="23" rx="8" fill="url(#g-car-paint)" stroke="#B91C1C" stroke-width="1.4"/><polygon points="22,16 42,16 48,24 16,24" fill="#38BDF8" opacity="0.85"/><circle cx="17" cy="47" r="8" fill="url(#g-car-tire)" stroke="#0F172A" stroke-width="1"/><circle cx="17" cy="47" r="4" fill="#E2E8F0"/><circle cx="47" cy="47" r="8" fill="url(#g-car-tire)" stroke="#0F172A" stroke-width="1"/><circle cx="47" cy="47" r="4" fill="#E2E8F0"/><circle cx="56" cy="33" r="3" fill="#FDE047"/></g></svg>`,
  calculator: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-calc-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#1E293B"/></linearGradient><filter id="sh-calc-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.3"/></filter></defs><rect x="14" y="7" width="36" height="50" rx="9" fill="url(#g-calc-body)" filter="url(#sh-calc-3d)" stroke="#64748B" stroke-width="1.8"/><rect x="18" y="11" width="28" height="6" rx="2" fill="#0F172A"/><rect x="20" y="12" width="24" height="4" rx="1" fill="#1E293B" stroke="#475569" stroke-width="0.8"/><rect x="18" y="19" width="28" height="11" rx="3" fill="#0F172A"/><text x="42" y="28" font-size="7.5" font-weight="900" fill="#4ADE80" text-anchor="end" font-family="monospace">1234</text><circle cx="22" cy="36" r="2.8" fill="#E2E8F0"/><circle cx="29" cy="36" r="2.8" fill="#E2E8F0"/><circle cx="36" cy="36" r="2.8" fill="#E2E8F0"/><circle cx="43" cy="36" r="2.8" fill="#F97316"/><circle cx="22" cy="43" r="2.8" fill="#E2E8F0"/><circle cx="29" cy="43" r="2.8" fill="#E2E8F0"/><circle cx="36" cy="43" r="2.8" fill="#E2E8F0"/><circle cx="43" cy="43" r="2.8" fill="#38BDF8"/><circle cx="22" cy="50" r="2.8" fill="#E2E8F0"/><circle cx="29" cy="50" r="2.8" fill="#E2E8F0"/><circle cx="36" cy="50" r="2.8" fill="#E2E8F0"/><circle cx="43" cy="50" r="2.8" fill="#22C55E"/></svg>`,
  radio: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-rad-mint" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#14B8A6"/><stop offset="60%" stop-color="#0D9488"/><stop offset="100%" stop-color="#115E59"/></linearGradient><radialGradient id="g-rad-spk" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="#134E4A"/><stop offset="100%" stop-color="#042F2E"/></radialGradient><filter id="sh-rad-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#042F2E" flood-opacity="0.35"/></filter></defs><line x1="15" y1="17" x2="39" y2="4" stroke="#64748B" stroke-width="3" stroke-linecap="round"/><circle cx="39" cy="4" r="2.8" fill="#EF4444"/><rect x="8" y="17" width="48" height="38" rx="10" fill="url(#g-rad-mint)" filter="url(#sh-rad-3d)" stroke="#042F2E" stroke-width="1.8"/><circle cx="23" cy="37" r="12" fill="url(#g-rad-spk)" stroke="#2DD4BF" stroke-width="1.5"/><circle cx="23" cy="37" r="4" fill="#99F6E4"/><circle cx="45" cy="30" r="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/><circle cx="45" cy="43" r="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/><rect x="42" y="29.5" width="6" height="1.5" fill="#0F172A"/></svg>`,
  smokeDetector: `<svg viewBox="0 0 64 64"><defs><radialGradient id="g-smk-base" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#F1F5F9"/><stop offset="60%" stop-color="#CBD5E1"/><stop offset="100%" stop-color="#94A3B8"/></radialGradient><radialGradient id="g-smk-dome" cx="35%" cy="30%" r="65%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="50%" stop-color="#E2E8F0"/><stop offset="100%" stop-color="#64748B"/></radialGradient><radialGradient id="g-smk-led" cx="30%" cy="30%" r="70%"><stop offset="0%" stop-color="#FF6B6B"/><stop offset="50%" stop-color="#EF4444"/><stop offset="100%" stop-color="#991B1B"/></radialGradient><filter id="sh-smk-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#1E293B" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-smk-3d)"><circle cx="32" cy="32" r="27" fill="url(#g-smk-base)" stroke="#334155" stroke-width="2"/><circle cx="32" cy="32" r="22" fill="#475569" stroke="#1E293B" stroke-width="1.2"/><circle cx="32" cy="32" r="16" fill="url(#g-smk-dome)" stroke="#1E293B" stroke-width="1.4"/><circle cx="32" cy="32" r="10" fill="#1E293B"/><circle cx="32" cy="32" r="5" fill="url(#g-smk-led)" stroke="#B91C1C" stroke-width="0.8"/><circle cx="30.5" cy="30.5" r="1.5" fill="#FFFFFF"/></g></svg>`,
  laserPointer: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-lzr-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3B82F6"/><stop offset="50%" stop-color="#1D4ED8"/><stop offset="100%" stop-color="#1E3A8A"/></linearGradient><linearGradient id="g-lzr-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FCD34D"/><stop offset="100%" stop-color="#D97706"/></linearGradient><filter id="sh-lzr-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#1E3A8A" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-lzr-3d)"><rect x="8" y="26" width="42" height="14" rx="6" fill="url(#g-lzr-body)" stroke="#1E3A8A" stroke-width="1.6"/><rect x="50" y="28" width="7" height="10" rx="2" fill="url(#g-lzr-brass)" stroke="#B45309" stroke-width="1"/><rect x="18" y="21" width="16" height="5" rx="2.5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1"/><circle cx="38" cy="33" r="2.8" fill="#EF4444"/><circle cx="59" cy="33" r="2" fill="#EF4444"/><line x1="59" y1="33" x2="64" y2="33" stroke="#EF4444" stroke-width="2.5" stroke-dasharray="2 1"/></g></svg>`,
  hearingAid: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-hear-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FDE68A"/><stop offset="40%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#B45309"/></linearGradient><linearGradient id="g-hear-tube" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0284C7"/></linearGradient><filter id="sh-hear-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#78350F" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-hear-3d)"><path d="M25 10 C12 16, 10 36, 23 48 C30 54, 38 49, 38 41 C38 33, 31 36, 27 28 C24 22, 27 16, 36 15" stroke="url(#g-hear-gold)" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M25 10 C12 16, 10 36, 23 48 C30 54, 38 49, 38 41 C38 33, 31 36, 27 28 C24 22, 27 16, 36 15" stroke="#78350F" stroke-width="1.4" stroke-linecap="round" fill="none"/><path d="M36 15 C44 14, 50 20, 50 28 L50 36" stroke="url(#g-hear-tube)" stroke-width="3.5" stroke-linecap="round" fill="none"/><circle cx="50" cy="38" r="6" fill="#F8FAFC" stroke="#0284C7" stroke-width="2"/><circle cx="50" cy="38" r="2.5" fill="#0284C7"/><circle cx="38" cy="41" r="5" fill="#FDE68A" stroke="#B45309" stroke-width="1.5"/></g></svg>`,
  digitalScale: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-scl-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="50%" stop-color="#E0F2FE"/><stop offset="100%" stop-color="#BAE6FD"/></linearGradient><filter id="sh-scl-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.25"/></filter></defs><rect x="8" y="10" width="48" height="48" rx="12" fill="url(#g-scl-glass)" filter="url(#sh-scl-3d)" stroke="#0284C7" stroke-width="2.2"/><rect x="18" y="16" width="28" height="13" rx="4" fill="#0F172A"/><text x="32" y="26" font-size="7.5" font-weight="900" fill="#38BDF8" text-anchor="middle" font-family="monospace">0.0 kg</text><circle cx="32" cy="43" r="8" fill="#94A3B8" stroke="#334155" stroke-width="1.6"/><circle cx="32" cy="43" r="4" fill="#F8FAFC"/></svg>`,
  robotToy: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-rob-cyan" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#22D3EE"/><stop offset="50%" stop-color="#06B6D4"/><stop offset="100%" stop-color="#0E7490"/></linearGradient><filter id="sh-rob-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0E7490" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-rob-3d)"><line x1="32" y1="12" x2="32" y2="17" stroke="#334155" stroke-width="3"/><circle cx="32" cy="9" r="4" fill="#EF4444"/><rect x="14" y="17" width="36" height="30" rx="9" fill="url(#g-rob-cyan)" stroke="#083344" stroke-width="2"/><circle cx="23" cy="27" r="4" fill="#FDE047" stroke="#CA8A04" stroke-width="1.2"/><circle cx="41" cy="27" r="4" fill="#FDE047" stroke="#CA8A04" stroke-width="1.2"/><rect x="22" y="36" width="20" height="4" rx="2" fill="#FFFFFF"/><rect x="8" y="24" width="6" height="14" rx="3" fill="#0E7490" stroke="#083344" stroke-width="1"/><rect x="50" y="24" width="6" height="14" rx="3" fill="#0E7490" stroke="#083344" stroke-width="1"/></g></svg>`,
  electricToothbrush: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-tb-handle" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F0F9FF"/><stop offset="50%" stop-color="#BAE6FD"/><stop offset="100%" stop-color="#38BDF8"/></linearGradient><linearGradient id="g-tb-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0284C7"/><stop offset="100%" stop-color="#0369A1"/></linearGradient><filter id="sh-tb-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0284C7" flood-opacity="0.25"/></filter></defs><g filter="url(#sh-tb-3d)"><rect x="25" y="20" width="14" height="41" rx="7" fill="url(#g-tb-handle)" stroke="#0284C7" stroke-width="1.8"/><rect x="27" y="28" width="10" height="14" rx="4" fill="url(#g-tb-blue)"/><circle cx="32" cy="35" r="2.5" fill="#FFFFFF"/><rect x="29" y="5" width="6" height="16" rx="2.5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1"/><circle cx="32" cy="9" r="4.8" fill="#0284C7"/><circle cx="32" cy="9" r="2.5" fill="#FFFFFF"/></g></svg>`,
  
  fridge: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-frg-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#93C5FD"/><stop offset="40%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#2563EB"/></linearGradient><filter id="sh-frg-3d"><feDropShadow dx="0" dy="5" stdDeviation="3.5" flood-color="#1E3A8A" flood-opacity="0.35"/></filter></defs><g filter="url(#sh-frg-3d)"><rect x="15" y="5" width="34" height="54" rx="8" fill="url(#g-frg-metal)" stroke="#1E3A8A" stroke-width="2"/><rect x="18" y="8" width="28" height="16" rx="4" fill="#DBEAFE" stroke="#3B82F6" stroke-width="1"/><rect x="18" y="27" width="28" height="29" rx="4" fill="#DBEAFE" stroke="#3B82F6" stroke-width="1"/><rect x="41" y="12" width="3.5" height="8" rx="1.5" fill="#1E293B"/><rect x="41" y="32" width="3.5" height="16" rx="1.5" fill="#1E293B"/><circle cx="24" cy="16" r="2" fill="#22C55E"/><text x="28" y="44" font-size="10" fill="#3B82F6" font-weight="900" opacity="0.6">❄</text></g></svg>`,
  microwave: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-mcw-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#1E293B"/></linearGradient><filter id="sh-mcw-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-mcw-3d)"><rect x="6" y="13" width="52" height="38" rx="8" fill="url(#g-mcw-body)" stroke="#0F172A" stroke-width="2"/><rect x="11" y="18" width="31" height="28" rx="5" fill="#090D16" stroke="#334155" stroke-width="1.2"/><rect x="14" y="21" width="25" height="22" rx="3" fill="#F59E0B" opacity="0.25"/><circle cx="49" cy="24" r="3.5" fill="#E2E8F0"/><circle cx="49" cy="34" r="3.5" fill="#E2E8F0"/><circle cx="49" cy="43" r="2" fill="#38BDF8"/></g></svg>`,
  washer: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-wsh-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#CBD5E1"/><stop offset="60%" stop-color="#94A3B8"/><stop offset="100%" stop-color="#64748B"/></linearGradient><radialGradient id="g-wsh-drum" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="60%" stop-color="#0284C7"/><stop offset="100%" stop-color="#0369A1"/></radialGradient><filter id="sh-wsh-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#1E293B" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-wsh-3d)"><rect x="10" y="6" width="44" height="52" rx="10" fill="url(#g-wsh-body)" stroke="#1E293B" stroke-width="2"/><circle cx="32" cy="36" r="17" fill="#1E293B"/><circle cx="32" cy="36" r="14" fill="url(#g-wsh-drum)" stroke="#0284C7" stroke-width="1.8"/><circle cx="30" cy="33" r="4.5" fill="#E0F2FE" opacity="0.8"/><rect x="15" y="11" width="14" height="7" rx="2" fill="#F8FAFC"/><circle cx="43" cy="14" r="3" fill="#0284C7"/></g></svg>`,
  airConditioner: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-ac-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F0F9FF"/><stop offset="50%" stop-color="#BAE6FD"/><stop offset="100%" stop-color="#7DD3FC"/></linearGradient><filter id="sh-ac-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0369A1" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-ac-3d)"><rect x="5" y="16" width="54" height="28" rx="7" fill="url(#g-ac-body)" stroke="#0284C7" stroke-width="2.2"/><line x1="9" y1="36" x2="55" y2="36" stroke="#0369A1" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="24" r="2.8" fill="#22C55E"/><path d="M14 48 C18 43, 24 51, 30 46 C36 41, 42 49, 50 44" stroke="#0284C7" stroke-width="3" stroke-linecap="round" fill="none"/></g></svg>`,
  vacuum: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-vac-orange" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FB923C"/><stop offset="50%" stop-color="#F97316"/><stop offset="100%" stop-color="#C2410C"/></linearGradient><filter id="sh-vac-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#9A3412" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-vac-3d)"><rect x="26" y="22" width="28" height="24" rx="11" fill="url(#g-vac-orange)" stroke="#7C2D12" stroke-width="2"/><circle cx="43" cy="46" r="7.5" fill="#1E293B" stroke="#0F172A" stroke-width="1.4"/><circle cx="43" cy="46" r="3" fill="#E2E8F0"/><path d="M28 28 C16 28, 10 16, 10 24 L10 50" stroke="#334155" stroke-width="5" stroke-linecap="round" fill="none"/></g></svg>`,
  lamp: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-lmp-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FCD34D"/><stop offset="50%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#B45309"/></linearGradient><filter id="sh-lmp-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#1E293B" flood-opacity="0.25"/></filter></defs><g filter="url(#sh-lmp-3d)"><path d="M17 26 L47 26 L40 10 L24 10 Z" fill="url(#g-lmp-gold)" stroke="#78350F" stroke-width="1.8"/><line x1="32" y1="26" x2="32" y2="50" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/><ellipse cx="32" cy="51" rx="14" ry="4.5" fill="#1E293B"/><circle cx="32" cy="29" r="4.5" fill="#FEF08A"/></g></svg>`,
  electricOven: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-ovn-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#1E293B"/></linearGradient><filter id="sh-ovn-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.3"/></filter></defs><rect x="9" y="8" width="46" height="48" rx="9" fill="url(#g-ovn-dark)" filter="url(#sh-ovn-3d)" stroke="#0F172A" stroke-width="2"/><rect x="14" y="24" width="36" height="26" rx="5" fill="#0A0F1D"/><path d="M18 31 L46 31" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round"/><path d="M18 43 L46 43" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round"/><circle cx="19" cy="16" r="3" fill="#F8FAFC"/><circle cx="32" cy="16" r="3" fill="#F8FAFC"/><circle cx="45" cy="16" r="3" fill="#F8FAFC"/></svg>`,
  iron: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-irn-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38BDF8"/><stop offset="60%" stop-color="#0284C7"/><stop offset="100%" stop-color="#0369A1"/></linearGradient><filter id="sh-irn-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0369A1" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-irn-3d)"><path d="M9 43 L52 43 C57 43, 59 38, 53 32 L38 19 C31 17, 18 17, 13 23 Z" fill="url(#g-irn-blue)" stroke="#082F49" stroke-width="1.8"/><rect x="9" y="43" width="45" height="5" rx="2" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1"/><circle cx="30" cy="32" r="4" fill="#F59E0B"/></g></svg>`,
  hairDryer: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-hd-pink" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FB7185"/><stop offset="50%" stop-color="#F43F5E"/><stop offset="100%" stop-color="#BE123C"/></linearGradient><filter id="sh-hd-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#9F1239" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-hd-3d)"><rect x="12" y="14" width="30" height="19" rx="8" fill="url(#g-hd-pink)" stroke="#4C0519" stroke-width="1.8"/><rect x="42" y="18" width="11" height="11" rx="2.5" fill="#1E293B"/><rect x="18" y="32" width="12" height="23" rx="5" fill="#881337" stroke="#4C0519" stroke-width="1.4"/></g></svg>`,
  electricWaterHeater: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-ewh-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#E2E8F0"/><stop offset="50%" stop-color="#CBD5E1"/><stop offset="100%" stop-color="#94A3B8"/></linearGradient><radialGradient id="g-gauge" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0284C7"/></radialGradient><filter id="sh-ewh-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#1E293B" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-ewh-3d)"><rect x="15" y="7" width="34" height="48" rx="17" fill="url(#g-ewh-body)" stroke="#1E293B" stroke-width="2.2"/><circle cx="32" cy="27" r="7" fill="url(#g-gauge)" stroke="#0369A1" stroke-width="1.4"/><line x1="32" y1="27" x2="35.5" y2="23.5" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="46" r="3" fill="#EF4444"/><line x1="23" y1="55" x2="23" y2="61" stroke="#3B82F6" stroke-width="4" stroke-linecap="round"/><line x1="41" y1="55" x2="41" y2="61" stroke="#EF4444" stroke-width="4" stroke-linecap="round"/></g></svg>`,
  electricHeater: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-eht-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EF4444"/><stop offset="50%" stop-color="#DC2626"/><stop offset="100%" stop-color="#991B1B"/></linearGradient><filter id="sh-eht-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#7F1D1D" flood-opacity="0.3"/></filter></defs><rect x="10" y="12" width="44" height="42" rx="8" fill="url(#g-eht-body)" filter="url(#sh-eht-3d)" stroke="#7F1D1D" stroke-width="2"/><line x1="16" y1="22" x2="48" y2="22" stroke="#FDE047" stroke-width="4.5" stroke-linecap="round"/><line x1="16" y1="33" x2="48" y2="33" stroke="#FDE047" stroke-width="4.5" stroke-linecap="round"/><line x1="16" y1="44" x2="48" y2="44" stroke="#FDE047" stroke-width="4.5" stroke-linecap="round"/></svg>`,
  blender: `<svg viewBox="0 0 64 64"><defs><linearGradient id="g-bln-pitcher" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FED7AA"/><stop offset="60%" stop-color="#FB923C"/><stop offset="100%" stop-color="#F97316"/></linearGradient><linearGradient id="g-bln-base" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0284C7"/><stop offset="100%" stop-color="#0369A1"/></linearGradient><filter id="sh-bln-3d"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0369A1" flood-opacity="0.3"/></filter></defs><g filter="url(#sh-bln-3d)"><path d="M18 10 L46 10 L40 39 L24 39 Z" fill="url(#g-bln-pitcher)" stroke="#0369A1" stroke-width="1.8"/><rect x="22" y="39" width="20" height="20" rx="6" fill="url(#g-bln-base)" stroke="#082F49" stroke-width="1.5"/><circle cx="32" cy="49" r="3.5" fill="#F8FAFC"/><rect x="16" y="8" width="32" height="3.5" rx="1.5" fill="#0F172A"/></g></svg>`
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

// التوجيه الصوتي العربي الموحد (نبرة أنثوية ناعمة ومخارج حروف واضحة)
function speakArabic(text) {
  if (!speechEnabled) return;
  speak(text, 'ar', { pitch: 1.0, rate: 0.92 });
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
          <a href="./index.html" class="static-nav-btn btn-home" id="home-link" title="العودة للبوابة الرئيسية">
            🏠 <span class="nav-text">الرئيسية</span>
          </a>
          <button type="button" id="btn-voice-toggle" class="static-nav-btn icon-only" title="تفعيل/تعطيل التوجيه الصوتي">
            🗣️
          </button>
          <button type="button" id="btn-sound-toggle" class="static-nav-btn icon-only" title="تفعيل/تعطيل المؤثرات الصوتية">
            🔊
          </button>
          <button type="button" id="btn-cert-open" class="static-nav-btn" title="شهادة الإنجاز">
            🎓 <span class="nav-text">الشهادة</span>
          </button>
          <a href="./dynamic-lab.html" class="static-nav-btn btn-dynamic" id="dynamic-link" title="الانتقال للمختبر المتحرك">
            🧪 <span class="nav-text">المتحرك</span>
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

      <!-- 2. شريط المهمة والتحدي (HUD) المتجاوب -->
      <section class="static-mission-hud">
        <div class="static-mission-top-row">
          <div class="static-target-chip" id="target-chip">
            <span id="target-icon">🔋</span>
            <span id="target-title">تحدي البطاريات الجافة</span>
          </div>

          <div class="static-mission-stats">
            <div class="static-stat-pill">
              <span>🏆</span>
              <span class="stat-label">النقاط:</span>
              <span class="val" id="stat-score">0</span>
            </div>
            <div class="static-stat-pill">
              <span>🎯</span>
              <span class="stat-label">التحديات:</span>
              <span class="val" id="stat-challenges">0</span>
            </div>
            <div class="static-stat-pill">
              <span>✔️</span>
              <span class="stat-label">المحددة:</span>
              <span class="val" id="stat-selected">0 / 2</span>
            </div>
          </div>
        </div>

        <div class="static-mission-instruction-row">
          <div class="static-mission-instruction" id="mission-instruction">
            حَدِّدْ جهازين يعملان بهذا المصدر، واضغط فحص 3D لكشف الدليل!
          </div>
          <button type="button" class="static-btn-listen" id="btn-listen-mission" title="استمع للتعليمات صوتياً">
            📢 <span class="listen-text">استمع للتوجيه</span>
          </button>
        </div>
      </section>

      <!-- 3. ساحة البطاقات التفاعلية 3D -->
      <main class="static-cards-stage" id="cards-stage"></main>

      <!-- 4. شريط الأوامر التقويمية السفلي -->
      <footer class="static-actions-bar">
        <div class="static-actions-center">
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

  // ضبط الروابط وفق موضع الملف (public أو root) لدعم الدخول والخروج والتحويل بسلاسة
  const isInsidePublic = window.location.pathname.includes('/public/');
  const brandLink = document.getElementById('brand-link');
  const homeLink = document.getElementById('home-link');
  const dynamicLink = document.getElementById('dynamic-link');

  const homeHref = isInsidePublic ? '../index.html' : './index.html';
  const dynamicHref = isInsidePublic ? './dynamic-lab.html' : './dynamic-lab.html';

  if (brandLink) brandLink.href = homeHref;
  if (homeLink) homeLink.href = homeHref;
  if (dynamicLink) dynamicLink.href = dynamicHref;
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

  devices.forEach((dev, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'card-3d-wrap';

    const svgIcon = SVG_MAP[dev.id] || `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#FFB703"/></svg>`;

    wrap.innerHTML = `
      <div class="card-3d-inner" id="card-inner-${dev.id}">
        <!-- الوجه الأمامي: تصميم مبهج وتفاعلي لطلاب الصف الرابع -->
        <div class="card-face card-face-front" data-id="${dev.id}">
          <div class="card-header-bar">
            <span class="card-tag-pill">🔎 جهاز ${idx + 1}</span>
            <div class="card-select-badge" id="badge-${dev.id}" title="حدد هذا الجهاز">○</div>
          </div>
          <div class="card-visual-box">
            ${svgIcon}
          </div>
          <div class="card-device-name">${dev.name}</div>
          <button type="button" class="btn-flip-inspect" data-inspect="${dev.id}" title="فحص الجهاز ثلاثي الأبعاد والبحث عن الدليل">
            🔍 <span>فحص 3D للمجسم</span>
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
    if (id === 'car') {
      // 🚗 سيارة ألعاب للأطفال: هيكل سيارة أحمر، كابينة زجاجية، 4 عجلات
      const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 1.4), new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.3, roughness: 0.3 }));
      group.add(carBody);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 1.2), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, transparent: true, opacity: 0.8 }));
      cabin.position.set(-0.15, 0.65, 0);
      group.add(cabin);
      // 4 عجلات
      for (let x of [-0.75, 0.75]) {
        for (let z of [-0.75, 0.75]) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }));
          wheel.rotation.x = Math.PI / 2;
          wheel.position.set(x, -0.22, z);
          group.add(wheel);
        }
      }
    } else if (id === 'radio') {
      // 📻 راديو محمول: هيكل فيروزي، هوائي مائل، مكبر صوت شبكي، ومقبض
      const rBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 0.8), new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.3 }));
      group.add(rBody);
      const speaker = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 24), new THREE.MeshStandardMaterial({ color: 0x134e4a }));
      speaker.rotation.x = Math.PI / 2;
      speaker.position.set(-0.45, 0, 0.41);
      group.add(speaker);
      // مقبض ضبط التردد
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
      dial.rotation.x = Math.PI / 2;
      dial.position.set(0.55, 0.2, 0.42);
      group.add(dial);
      // هوائي فضي
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 12), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 }));
      ant.rotation.z = -0.3;
      ant.position.set(-0.6, 1.2, 0);
      group.add(ant);
    } else if (id === 'flashlight') {
      // 🔦 كشاف الجيب: أسطوانة معدنية بمقدمة مضيئة مع حجرة خلفية مفتوحة
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 2.2, 24), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 }));
      group.add(tube);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.42, 0.8, 24), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 }));
      head.position.y = 1.3;
      group.add(head);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.65, 24), new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 0.6 }));
      lens.rotation.x = -Math.PI / 2;
      lens.position.y = 1.71;
      group.add(lens);
    } else if (id === 'wallClock') {
      // ⏰ ساعة حائط جدارية: قرص دائري أبيض بإطار ذهبي وعقارب
      const frame = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 32), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6 }));
      frame.rotation.x = Math.PI / 2;
      group.add(frame);
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.22, 32), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
      dial.rotation.x = Math.PI / 2;
      group.add(dial);
      // عقارب الساعة
      const handH = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.02), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      handH.position.set(0, 0.22, 0.12);
      group.add(handH);
      const handM = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.02), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      handM.rotation.z = -1.2;
      handM.position.set(0.3, 0.1, 0.13);
      group.add(handM);
    } else if (id === 'remote') {
      // 📱 ريموت التلفاز: لوح تحكم رفيع مع أزرار مطاطية ومصباح أحمر
      const rBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 0.35), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }));
      group.add(rBody);
      // مصباح إشارة بالأعلى
      const ir = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.6 }));
      ir.position.set(0, 1.23, 0);
      group.add(ir);
      // شبكة أزرار
      for (let y = -0.6; y <= 0.8; y += 0.35) {
        for (let x of [-0.22, 0.22]) {
          const btn = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.08), new THREE.MeshStandardMaterial({ color: 0x64748b }));
          btn.position.set(x, y, 0.2);
          group.add(btn);
        }
      }
    } else if (id === 'digitalScale') {
      // ميزان رقمي: لوح زجاجي مقوى وقاعدة سفلية وشاشة
      const plate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 2.2), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.1, transparent: true, opacity: 0.9 }));
      group.add(plate);
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.26, 1.8), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 }));
      base.position.y = -0.2;
      group.add(base);
      const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      lcd.rotation.x = -Math.PI / 2;
      lcd.position.set(0, 0.08, -0.6);
      group.add(lcd);
    } else if (id === 'calculator') {
      // 🔢 آلة حاسبة إلكترونية: جسم رمادي مائل، شاشة خضراء، خلية شمسية وشبكة مفاتيح
      const cBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.25), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 }));
      group.add(cBody);
      const lcd = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.04), new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.2 }));
      lcd.position.set(0, 0.65, 0.13);
      group.add(lcd);
      const solar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.04), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1, metalness: 0.8 }));
      solar.position.set(0, 0.92, 0.13);
      group.add(solar);
      for (let y = -0.7; y <= 0.3; y += 0.28) {
        for (let x of [-0.45, -0.15, 0.15, 0.45]) {
          const btnCol = (y === 0.3 && x === 0.45) ? 0xf97316 : (x === 0.45 ? 0x0284c7 : 0x94a3b8);
          const btn = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.06), new THREE.MeshStandardMaterial({ color: btnCol }));
          btn.position.set(x, y, 0.13);
          group.add(btn);
        }
      }
    } else if (id === 'smokeDetector') {
      // 🚨 إنذار الدخان: قرص سقفي أبيض مع فتحات تهوية دائرية ولمبة وميض حمراء
      const sBody = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.25, 0.35, 32), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
      sBody.rotation.x = Math.PI / 2;
      group.add(sBody);
      const innerDome = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.15, 24), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
      innerDome.rotation.x = Math.PI / 2;
      innerDome.position.z = 0.22;
      group.add(innerDome);
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.8 }));
      led.position.set(0, 0, 0.32);
      group.add(led);
    } else if (id === 'laserPointer') {
      // 🔴 مؤشر ليزر قلم: أسطوانة معدنية زرقاء، مشبك فضي، رأس نحاسي وزر تشغيل
      const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.4, 20), new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.8, roughness: 0.2 }));
      group.add(pen);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.35, 20), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 }));
      tip.position.y = 1.35;
      group.add(tip);
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.12), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 }));
      clip.position.set(0.19, -0.2, 0);
      group.add(clip);
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      btn.rotation.z = Math.PI / 2;
      btn.position.set(0.18, 0.4, 0);
      group.add(btn);
    } else if (id === 'hearingAid') {
      // 🦻 سماعة أذن طبية: غلاف منحني بلون بيج ناعم، وسدادة سيليكون
      const aidBody = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.2, 16, 24, Math.PI * 0.8), new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.3 }));
      group.add(aidBody);
      const earTip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.85 }));
      earTip.position.set(0.65, -0.65, 0);
      group.add(earTip);
    } else if (id === 'robotToy') {
      // 🤖 روبوت ألعاب للأطفال: رأس وجذع كروي/مربع مع عينين مضيئتين وهوائي
      const botBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.7, 1.2), new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.35 }));
      group.add(botBody);
      for (let x of [-0.4, 0.4]) {
        const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xfde047, emissiveIntensity: 0.7 }));
        eye.rotation.x = Math.PI / 2;
        eye.position.set(x, 0.35, 0.61);
        group.add(eye);
      }
      const antPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 }));
      antPole.position.set(0, 1.15, 0);
      group.add(antPole);
      const antBall = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.6 }));
      antBall.position.set(0, 1.48, 0);
      group.add(antBall);
      for (let x of [-0.95, 0.95]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), new THREE.MeshStandardMaterial({ color: 0x0e7490 }));
        arm.position.set(x, -0.1, 0);
        group.add(arm);
      }
    } else if (id === 'electricToothbrush') {
      // 🪥 فرشاة أسنان كهربائية: مقبض أسطواني أبيض/أزرق، زر تشغيل، وعنق ورأس بشعيرات
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 1.8, 24), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
      group.add(handle);
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.8, 24), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
      grip.position.set(0, 0, 0);
      group.add(grip);
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, 0.15, 0.31);
      group.add(btn);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 }));
      neck.position.y = 1.35;
      group.add(neck);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 16), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
      head.rotation.x = Math.PI / 2;
      head.position.set(0, 1.85, 0.08);
      group.add(head);
    } else {
      // مجسم جهاز بطارية قياسي
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 0.9), new THREE.MeshStandardMaterial({ color: 0x2b4c7e, roughness: 0.35, metalness: 0.2 }));
      group.add(body);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.8), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 }));
      screen.position.set(0, 0, 0.46);
      group.add(screen);
    }

    // حجرة البطاريات المفتوحة في الخلف (Visual Clue)
    const bay = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.85, 0.3), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 }));
    bay.position.set(0, -0.05, -0.32);
    group.add(bay);

    // بطاريتان جافتان AA مع أقطاب ذهبية وزلزنبركات
    for (let i = -1; i <= 1; i += 2) {
      const batt = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.05, 20), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.75, roughness: 0.25 }));
      batt.rotation.z = Math.PI / 2;
      batt.position.set(0, -0.05 + i * 0.22, -0.32);
      group.add(batt);

      // رأس القطب الموجب (+)
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9 }));
      cap.rotation.z = Math.PI / 2;
      cap.position.set(i === -1 ? 0.58 : -0.58, -0.05 + i * 0.22, -0.32);
      group.add(cap);

      // زنبرك القطب السالب (-)
      const spring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 16), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85 }));
      spring.rotation.y = Math.PI / 2;
      spring.position.set(i === -1 ? -0.55 : 0.55, -0.05 + i * 0.22, -0.32);
      group.add(spring);
    }
  } else {
    // ══════════════════════════════════════════════════════════
    // أجهزة كهرباء المنزل (مع سلك كهرباء قوي وقابس جداري ثنائي)
    // ══════════════════════════════════════════════════════════
    if (id === 'electricWaterHeater') {
      // ♨ سخان ماء أسطواني رأسي أبيض مع مقياس حرارة ومواسير ماء
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.2, 32), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.25 }));
      group.add(tank);
      for (let y of [1.1, -1.1]) {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 }));
        cap.position.y = y;
        if (y < 0) cap.rotation.x = Math.PI;
        group.add(cap);
      }
      const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 20), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
      gauge.rotation.x = Math.PI / 2;
      gauge.position.set(0, 0.3, 0.86);
      group.add(gauge);
      const coldPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
      coldPipe.position.set(-0.35, -1.3, 0);
      const hotPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      hotPipe.position.set(0.35, -1.3, 0);
      group.add(coldPipe);
      group.add(hotPipe);
    } else if (id === 'fridge') {
      // 🧊 ثلاجة منزلية قائمة: بابان (فريزر وثلاجة) ومقابض طويلة
      const fBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 1.4), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.2, roughness: 0.25 }));
      group.add(fBody);
      const divider = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.06, 0.04), new THREE.MeshStandardMaterial({ color: 0x64748b }));
      divider.position.set(0, 0.4, 0.7);
      group.add(divider);
      const handle1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 }));
      handle1.position.set(-0.65, 0.75, 0.75);
      const handle2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 }));
      handle2.position.set(-0.65, -0.2, 0.75);
      group.add(handle1);
      group.add(handle2);
    } else if (id === 'microwave') {
      // 🍲 فرن ميكروويف: شاشة زجاجية داكنة، مفاتيح لمس، ولوحة أرقام
      const mBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 1.3), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4 }));
      group.add(mBody);
      const windowGlass = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 0.04), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 }));
      windowGlass.position.set(-0.35, 0, 0.66);
      group.add(windowGlass);
      const ctrl = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.9, 0.04), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      ctrl.position.set(0.7, 0, 0.66);
      group.add(ctrl);
    } else if (id === 'washer') {
      // 🧺 غسالة أوتوماتيكية: باب دائري زجاجي مع إطار فضي ودرج مسحوق
      const wBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.1, 1.7), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 }));
      group.add(wBody);
      const doorRim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.09, 16, 32), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 }));
      doorRim.position.set(0, -0.15, 0.86);
      group.add(doorRim);
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.57, 24), new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.65 }));
      glass.position.set(0, -0.15, 0.87);
      group.add(glass);
      const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.04), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      drawer.position.set(-0.5, 0.8, 0.86);
      group.add(drawer);
    } else if (id === 'lamp') {
      // 💡 مصباح مكتب سلكي: قاعدة مستديرة، ذراع معدني منحني، ومظلّة إنارة
      const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.15, 24), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      lBase.position.y = -0.9;
      group.add(lBase);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 16), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 }));
      stem.position.set(0, 0, 0);
      group.add(stem);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.9, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xf59e0b, side: THREE.DoubleSide }));
      shade.rotation.x = Math.PI;
      shade.position.set(0, 1.1, 0);
      group.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 0.8 }));
      bulb.position.set(0, 0.9, 0);
      group.add(bulb);
    } else if (id === 'iron') {
      // 👔 مكواة ملابس: قاعدة مسطحة مدببة، مقبض مقوس، ومفتاح بخار
      const iBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 0.9), new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9 }));
      iBase.position.y = -0.4;
      group.add(iBase);
      const iBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.8), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
      iBody.position.y = -0.1;
      group.add(iBody);
      const iHandle = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 12, 24, Math.PI), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      iHandle.position.set(0, 0.35, 0);
      group.add(iHandle);
    } else if (id === 'vacuum') {
      // 🧹 مكنسة كهربائية: خزان كروي، عجلتان جانبيتان، وخرطوم
      const vBody = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 18), new THREE.MeshStandardMaterial({ color: 0xea580c }));
      group.add(vBody);
      for (let z of [-0.95, 0.95]) {
        const vWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.15, 18), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
        vWheel.rotation.x = Math.PI / 2;
        vWheel.position.set(-0.2, -0.2, z);
        group.add(vWheel);
      }
    } else if (id === 'airConditioner') {
      // ❄️ مكيف هواء سبليت: وحدة جدارية بيضاء عريضة، ريش توزيع هواء، وشاشة رقمية
      const acBody = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.1, 0.85), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 }));
      group.add(acBody);
      const louver = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 0.15), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      louver.position.set(0, -0.42, 0.38);
      group.add(louver);
      const display = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.2), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.6 }));
      display.position.set(0.85, 0.1, 0.44);
      group.add(display);
    } else if (id === 'electricOven') {
      // 🍳 فرن كهربائي منزلي: كابينة متينة، باب زجاجي داكن، سخانات حرارية حمراء مضيئة
      const oBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 1.5), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 }));
      group.add(oBody);
      const oGlass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.05), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 }));
      oGlass.position.set(0, -0.15, 0.76);
      group.add(oGlass);
      for (let y of [0.2, -0.5]) {
        const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 12), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.8 }));
        coil.rotation.z = Math.PI / 2;
        coil.position.set(0, y, 0.77);
        group.add(coil);
      }
      for (let x of [-0.5, 0, 0.5]) {
        const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8 }));
        knob.rotation.x = Math.PI / 2;
        knob.position.set(x, 0.75, 0.76);
        group.add(knob);
      }
    } else if (id === 'hairDryer') {
      // 💨 مجفف شعر (استشوار): فوهة أسطوانية أفقية، مقبض مريح، وشبكة تهوية خلفية
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 1.6, 24), new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.3 }));
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(0, 0.45, 0);
      group.add(barrel);
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.5, 20), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      nozzle.rotation.z = Math.PI / 2;
      nozzle.position.set(-0.95, 0.45, 0);
      group.add(nozzle);
      const dHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 1.4, 20), new THREE.MeshStandardMaterial({ color: 0x9f1239 }));
      dHandle.position.set(0.3, -0.3, 0);
      group.add(dHandle);
      const rearMesh = new THREE.Mesh(new THREE.CircleGeometry(0.46, 20), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      rearMesh.rotation.y = Math.PI / 2;
      rearMesh.position.set(0.81, 0.45, 0);
      group.add(rearMesh);
    } else if (id === 'electricHeater') {
      // 🔥 مدفأة كهربائية: جسم أحمر مع قضبان تسخين مشعة باللون البرتقالي الساطع
      const hBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.75), new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 }));
      group.add(hBody);
      for (let y of [-0.35, 0, 0.35]) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 16), new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf97316, emissiveIntensity: 1.0 }));
        rod.rotation.z = Math.PI / 2;
        rod.position.set(0, y, 0.39);
        group.add(rod);
      }
      for (let x of [-0.85, 0.85]) {
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.9), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
        foot.position.set(x, -0.85, 0);
        group.add(foot);
      }
    } else if (id === 'blender') {
      // 🥤 خلاط عصائر منزلي: قاعدة محرك زرقاء بمفتاح دوران، وإبريق زجاجي شفاف بغطاء ومقبض
      const mBase = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 1.0, 24), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.3 }));
      mBase.position.y = -0.55;
      group.add(mBase);
      const speedKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
      speedKnob.rotation.x = Math.PI / 2;
      speedKnob.position.set(0, -0.45, 0.75);
      group.add(speedKnob);
      const pitcher = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.52, 1.4, 20), new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.65, roughness: 0.1 }));
      pitcher.position.y = 0.65;
      group.add(pitcher);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.2, 20), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      lid.position.y = 1.4;
      group.add(lid);
      const pHandle = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 }));
      pHandle.rotation.z = -Math.PI / 2;
      pHandle.position.set(0.75, 0.65, 0);
      group.add(pHandle);
    } else {
      // مجسم جهاز كهرباء منزلي عام
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.2, 1.4), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.35, roughness: 0.2 }));
      group.add(body);
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.8), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5 }));
      panel.position.set(0, 0, 0.71);
      group.add(panel);
    }

    // سلك كهرباء أسود ممتد بوضوح من خلف الجهاز إلى الأسفل
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.7, -0.6),
      new THREE.Vector3(0.5, -1.1, -0.8),
      new THREE.Vector3(0.9, -1.3, -0.3),
      new THREE.Vector3(1.3, -1.45, 0.2)
    ]);
    const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.075, 12, false), new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 }));
    group.add(cable);

    // رأس الفيشة الكهربائية المنزلية (Plug Head)
    const plug = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.38), new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 }));
    plug.position.set(1.3, -1.45, 0.2);
    group.add(plug);

    // مسمارا الفيشة المعدنيان البارزان (Prongs)
    for (let p of [-0.08, 0.08]) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 12), new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.95, roughness: 0.1 }));
      pin.rotation.x = Math.PI / 2;
      pin.position.set(1.3 + p, -1.45, 0.48);
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
