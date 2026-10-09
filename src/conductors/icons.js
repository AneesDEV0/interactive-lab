// ═══════════════════════════════════════════════════════════════════════════
// src/conductors/icons.js — أيقونات وشخصية «البروفيسور» لمختبر الموصلات والعوازل
// ═══════════════════════════════════════════════════════════════════════════

const paths = {
  bolt: 'm13 2-9 12h7l-1 8 10-12h-7l1-8Z',
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  book: 'M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1m0-15c3-2 6-2 10-1v15c-4-1-7-1-10 1V5Z',
  cube: 'm12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10 9-5M12 12 3 7m9 5v10M7.5 4.5l9 5',
  play: 'm9 5 11 7-11 7V5Z',
  camera: 'M8 5 9 2h6l1 3h5v16H3V5h5Zm9 8a5 5 0 1 0-10 0 5 5 0 0 0 10 0Z',
  sound: 'm11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  mute: 'm11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6',
  star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z',
  arrow: 'M20 12H4m6-6-6 6 6 6',
  chevron: 'm15 5-7 7 7 7',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  help: 'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4m0 3v1M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0Z',
  trophy: 'M7 3h10v6a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4m-4 2v7m-5 0h10',
  shield: 'm12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Zm-5 9 3 3 7-7',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  hand: 'M8 12V5a2 2 0 0 1 4 0v6-2a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v5c0 4-3 6-7 6-3 0-4-2-6-4l-4-5a2 2 0 0 1 3-2l2 2',
  send: 'm22 2-7 20-4-9-9-4 20-7Zm0 0L11 13',
  heart: 'M12 21 3 12C-3 5 6-2 12 6c6-8 15-1 9 6l-9 9Z',
  reset: 'M3 10a9 9 0 1 1 1 7M3 3v7h7',
  search: 'M17 10a7 7 0 1 0-14 0 7 7 0 0 0 14 0Zm-2 5 7 7',
  stop: 'M6 6h12v12H6Z',
  info: 'M12 10v7m0-11v1M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0Z',
  mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3 M8 22h8',
  trash: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  box: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8ZM3.3 7 12 12l8.7-5M12 22V12',
  sparkles: 'm12 3 2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3Z',
  sort: 'M3 6h18M6 12h12m-9 6h6',
  drag: 'M8 6h.01M16 6h.01M8 12h.01M16 12h.01M8 18h.01M16 18h.01',

  // مصباح مضيء (موصل)
  bulbOn: 'M9 21h6m-4 3h2M12 2a7 7 0 0 0-4 12.8V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.2A7 7 0 0 0 12 2Z',
  // مصباح مطفأ / درع أمان (عازل)
  bulbOff: 'm12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Zm-1 5v4h2V7h-2Zm0 6v2h2v-2h-2Z'
};

export const icon = (name, cls = '') => {
  const d = paths[name] || paths.bolt;
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
};

/**
 * شخصية المساعد التعليمي: «البروفيسور»
 * رسم SVG كرتوني مع قبعة التخرج، النظارات الذكية، والابتسامة المشجعة
 */
export const professorMascot = `
<svg class="mascot professor-mascot" viewBox="0 0 120 130" aria-hidden="true">
  <!-- هالة الاكتشاف الذكية المضيئة -->
  <circle cx="60" cy="55" r="50" fill="#f8f4ff" stroke="#d5c8f2" stroke-width="2"/>
  
  <!-- شرارات علمية مضيئة -->
  <path d="M22 22 L24 27 L29 29 L24 31 L22 36 L20 31 L15 29 L20 27 Z" fill="#ffdb76"/>
  <path d="M96 24 L98 28 L102 30 L98 32 L96 36 L94 32 L90 30 L94 28 Z" fill="#ffdb76"/>

  <!-- المعطف العلمي الأنيق -->
  <path d="M30 115 C30 85 40 80 60 80 C80 80 90 85 90 115 Z" fill="#55408e"/>
  <!-- الياقة وربطة العنق -->
  <polygon points="60,80 50,96 70,96" fill="#ffffff"/>
  <polygon points="56,96 64,96 62,112 58,112" fill="#df9e19"/>

  <!-- الرأس والوجه البشوش -->
  <ellipse cx="60" cy="58" rx="28" ry="26" fill="#ffeaa7"/>
  <!-- الأذنان -->
  <circle cx="31" cy="58" r="6" fill="#fcd982"/>
  <circle cx="89" cy="58" r="6" fill="#fcd982"/>

  <!-- قبعة التخرج والأكاديميا -->
  <polygon points="60,18 20,32 60,44 100,32" fill="#2d2845"/>
  <rect x="42" y="36" width="36" height="12" rx="4" fill="#3d3659"/>
  <!-- حبل وشراشيب القبعة الذهبية -->
  <path d="M60 32 Q92 34 94 48" stroke="#df9e19" stroke-width="2.5" fill="none"/>
  <circle cx="94" cy="50" r="3.5" fill="#df9e19"/>

  <!-- النظارات الذكية الكبيرة للبروفيسور -->
  <circle cx="48" cy="56" r="10" fill="#ffffff" fill-opacity="0.85" stroke="#2d2845" stroke-width="2.5"/>
  <circle cx="72" cy="56" r="10" fill="#ffffff" fill-opacity="0.85" stroke="#2d2845" stroke-width="2.5"/>
  <line x1="58" y1="56" x2="62" y2="56" stroke="#2d2845" stroke-width="2.5"/>

  <!-- العينان الذكيتان -->
  <circle cx="48" cy="56" r="4.5" fill="#2d2845"/>
  <circle cx="50" cy="54" r="1.5" fill="#ffffff"/>
  <circle cx="72" cy="56" r="4.5" fill="#2d2845"/>
  <circle cx="74" cy="54" r="1.5" fill="#ffffff"/>

  <!-- الحواجب المفكرة -->
  <path d="M40 43 Q48 40 56 44" stroke="#2d2845" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M64 44 Q72 40 80 43" stroke="#2d2845" stroke-width="2.5" stroke-linecap="round" fill="none"/>

  <!-- الابتسامة اللطيفة المشجعة -->
  <path d="M52 68 Q60 76 68 68" stroke="#c0392b" stroke-width="2.5" stroke-linecap="round" fill="none"/>

  <!-- شنب أبيض/رمادي أكاديمي خفيف لطيف -->
  <path d="M47 66 Q54 68 59 65 Q60 67 61 65 Q66 68 73 66" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>

  <!-- وجنتان مورّدتان خجولتان -->
  <ellipse cx="38" cy="64" rx="4" ry="2.5" fill="#fab1a0" opacity="0.6"/>
  <ellipse cx="82" cy="64" rx="4" ry="2.5" fill="#fab1a0" opacity="0.6"/>
</svg>
`;
