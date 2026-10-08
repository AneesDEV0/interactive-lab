// ═══════════════════════════════════════════════════════════════════════════
// src/materials/icons.js — أيقونات وشخصية «الخبير» لمختبر خامات البيئة
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

  // أيقونات خاصة بخامات البيئة والتصنيف
  plastic: 'M10 2h4v3h-4V2ZM7 6h10l-1 15H8L7 6Zm3 4h4m-4 4h4', // قارورة بلاستيكية
  glass: 'M6 3h12l-2 16a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2L6 3Zm2 5h8', // كأس زجاجي شفاف
  fabric: 'M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm-5 9a5 5 0 0 1 9-3m-9 3a5 5 0 0 0 7 4', // كرة صوف ونسيج
  metal: 'M4 8l4-4 8 8-4 4-8-8Zm10-4l6 6-2 2-6-6 2-2ZM3 21l6-2-4-4-2 6Z', // مغناطيس ومعدن صلب
  wood: 'M12 2a4 4 0 0 0-4 4v12a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z', // جذع خشب طبيعي
  paper: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8M8 17h5', // ورقة وكرتون
  rubber: 'M7 16.5 14.5 9 18 12.5l-7.5 7.5H7v-3.5ZM17 4l3 3-2 2-3-3 2-2Z', // ممحاة مطاطية
  box: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8ZM3.3 7 12 12l8.7-5M12 22V12', // صندوق/حاوية فرز
  sparkles: 'm12 3 2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3Z', // بريق الاكتشاف
  sort: 'M3 6h18M6 12h12m-9 6h6', // فرز وتصنيف
  drag: 'M8 6h.01M16 6h.01M8 12h.01M16 12h.01M8 18h.01M16 18h.01' // مؤشر السحب
};

export const icon = (name, cls = '') => {
  const d = paths[name] || paths.box;
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
};

/**
 * شخصية المساعد التعليمي: "الخبير"
 * مجسم كرتوني لطيف ومميز بنظارات العالم الذكي والابتسامة المشجعة
 */
export const expertMascot = `
<svg class="mascot expert-mascot" viewBox="0 0 120 130" aria-hidden="true">
  <!-- هالة الاكتشاف الذكية -->
  <circle cx="60" cy="55" r="50" fill="#fdf7e3" stroke="#f1dc98" stroke-width="2"/>
  
  <!-- لمعان الأفكار أعلى الرأس -->
  <path d="M60 4v8M36 12l5 6M84 12l-5 6" stroke="#eab32a" stroke-width="3.5" stroke-linecap="round"/>

  <!-- الرأس -->
  <ellipse cx="60" cy="56" rx="38" ry="36" fill="#ffe28a" stroke="#e0b53d" stroke-width="2.5"/>
  
  <!-- خصلات شعر الخبير المرتبة -->
  <path d="M35 34q12-14 25-14t25 14" fill="#6d5843" stroke="#4d3e30" stroke-width="2"/>
  <path d="M42 24q18-8 36 0" stroke="#8d7256" stroke-width="4" stroke-linecap="round"/>

  <!-- نظارات الخبير المستديرة الذكية -->
  <circle cx="45" cy="54" r="14" fill="#ffffff" fill-opacity="0.85" stroke="#483569" stroke-width="3.5"/>
  <circle cx="75" cy="54" r="14" fill="#ffffff" fill-opacity="0.85" stroke="#483569" stroke-width="3.5"/>
  <path d="M59 54h2" stroke="#483569" stroke-width="4" stroke-linecap="round"/>
  <path d="M31 54h-5m63 0h-5" stroke="#483569" stroke-width="3" stroke-linecap="round"/>

  <!-- عيون الخبير الذكية من وراء النظارات -->
  <ellipse cx="46" cy="54" rx="4" ry="5.5" fill="#322247"/>
  <circle cx="44.5" cy="52" r="1.6" fill="#ffffff"/>
  <ellipse cx="74" cy="54" rx="4" ry="5.5" fill="#322247"/>
  <circle cx="72.5" cy="52" r="1.6" fill="#ffffff"/>

  <!-- حواجب التركيز واللطف -->
  <path d="M36 40q8-5 16 0" fill="none" stroke="#483569" stroke-width="2.8" stroke-linecap="round"/>
  <path d="M68 40q8-5 16 0" fill="none" stroke="#483569" stroke-width="2.8" stroke-linecap="round"/>

  <!-- ابتسامة الخبير الودودة -->
  <path d="M50 72q10 9 20 0" fill="none" stroke="#483569" stroke-width="3.2" stroke-linecap="round"/>
  
  <!-- حمرة الخدين الوردية اللطيفة -->
  <ellipse cx="32" cy="65" rx="6" ry="3.5" fill="#f79e84" opacity="0.8"/>
  <ellipse cx="88" cy="65" rx="6" ry="3.5" fill="#f79e84" opacity="0.8"/>

  <!-- معطف المختبر وربطة العنق الأنيقة (الخبير) -->
  <path d="M34 92c0-8 12-14 26-14s26 6 26 14v18H34V92Z" fill="#7560af" stroke="#5d4797" stroke-width="2"/>
  <path d="M47 92l13 14 13-14" fill="#ffffff" stroke="#e5dfef" stroke-width="1.5"/>
  <!-- ربطة عنق الفراشة (Bowtie) خبير أنيق -->
  <polygon points="53,95 67,95 60,101" fill="#ffdb76"/>
  <polygon points="53,107 67,107 60,101" fill="#ffdb76"/>
  <circle cx="60" cy="101" r="3" fill="#eaad25"/>

  <!-- عدسة مكبرة في يده للاستكشاف -->
  <path d="M22 88l-9 12" stroke="#8d7256" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="17" cy="84" r="8" fill="#d2edff" stroke="#483569" stroke-width="2.5"/>
  <path d="M14 82q4-4 7 0" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
</svg>
`;
