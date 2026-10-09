// ═══════════════════════════════════════════════════════════════════════════
// src/safety/icons.js — أيقونات وشخصية «حارس الأمان» (كابتن أمان) لمختبر السلامة الكهربائية
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

  // شارات الأمان والخطر المخصصة
  safeCheck: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z m-3-10 2 2 4-4',
  hazardAlert: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01'
};

export const icon = (name, cls = '') => {
  const d = paths[name] || paths.shield;
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
};

/**
 * شخصية المساعد التعليمي: «حارس الأمان» (كابتن أمان)
 * رسم SVG كرتوني ودود بخوذة السلامة الصفراء، سترة الأمان العاكسة، والابتسامة المشجعة
 */
export const captainAmanMascot = `
<svg class="mascot safety-mascot" viewBox="0 0 120 130" aria-hidden="true">
  <!-- هالة الأمان الخضراء المضيئة -->
  <circle cx="60" cy="55" r="50" fill="#f0fff4" stroke="#9ae6b4" stroke-width="2"/>

  <!-- درع الحماية في الخلفية -->
  <path d="M60,10 C75,10 95,20 95,45 C95,78 60,95 60,95 C60,95 25,78 25,45 C25,20 45,10 60,10 Z" fill="#e6fffa" fill-opacity="0.6"/>

  <!-- جسم الحارس وسترة السلامة العاكسة -->
  <path d="M32,118 C32,88 42,84 60,84 C78,84 88,88 88,118 Z" fill="#2b6cb0"/>
  <!-- سترة السلامة البرتقالية الفوسفورية -->
  <path d="M40,86 L50,118 L70,118 L80,86 Z" fill="#dd6b20"/>
  <!-- أشرطة عاكسة صفراء فسفورية -->
  <line x1="44" y1="98" x2="76" y2="98" stroke="#f6e05e" stroke-width="3.5"/>
  <line x1="46" y1="108" x2="74" y2="108" stroke="#ffffff" stroke-width="3"/>

  <!-- الرأس والوجه البشوش -->
  <ellipse cx="60" cy="60" rx="26" ry="24" fill="#feebc8"/>
  <circle cx="34" cy="60" r="5.5" fill="#fbd38d"/>
  <circle cx="86" cy="60" r="5.5" fill="#fbd38d"/>

  <!-- خوذة السلامة الهندسية الصفراء -->
  <path d="M30,50 C30,24 90,24 90,50 Z" fill="#ecc94b"/>
  <!-- حافة الخوذة البارزة -->
  <ellipse cx="60" cy="50" rx="33" ry="6" fill="#d69e2e"/>
  <!-- ضوء / شارة أمان في مقدمة الخوذة -->
  <circle cx="60" cy="36" r="6" fill="#ffffff" stroke="#d69e2e" stroke-width="1.5"/>
  <!-- علامة صاعقة أمان خضراء داخل شارة الخوذة -->
  <path d="M60,32 L58,36 L61,36 L59,40 L63,35 L60,35 Z" fill="#38a169"/>

  <!-- نظارات الأمان الشفافة اللطيفة -->
  <rect x="42" y="52" width="16" height="11" rx="4" fill="#ffffff" fill-opacity="0.8" stroke="#4a5568" stroke-width="1.8"/>
  <rect x="62" y="52" width="16" height="11" rx="4" fill="#ffffff" fill-opacity="0.8" stroke="#4a5568" stroke-width="1.8"/>
  <line x1="58" y1="57" x2="62" y2="57" stroke="#4a5568" stroke-width="2"/>

  <!-- العينان الذكيتان -->
  <circle cx="50" cy="57" r="3.5" fill="#2d3748"/>
  <circle cx="51.5" cy="55.5" r="1.2" fill="#ffffff"/>
  <circle cx="70" cy="57" r="3.5" fill="#2d3748"/>
  <circle cx="71.5" cy="55.5" r="1.2" fill="#ffffff"/>

  <!-- حواجب ودودة مشجعة -->
  <path d="M44,48 Q49,46 54,48" stroke="#744210" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M66,48 Q71,46 76,48" stroke="#744210" stroke-width="2" stroke-linecap="round" fill="none"/>

  <!-- الابتسامة الواثقة المشجعة -->
  <path d="M52,69 Q60,76 68,69" stroke="#c53030" stroke-width="2.2" stroke-linecap="round" fill="none"/>

  <!-- بريق ولمعان النجوم -->
  <polygon points="18,25 20,29 25,31 20,33 18,37 16,33 11,31 16,29" fill="#48bb78"/>
  <polygon points="102,28 104,32 108,33 104,35 102,39 100,35 96,33 100,32" fill="#ecc94b"/>
</svg>
`;
