// ═══════════════════════════════════════════════════════════════════════════
// scripts/generate-materials-graphics.mjs
// توليد رسمات واقعية وثلاثية الأبعاد لعناصر خامات البيئة وصناديق الفرز
// ═══════════════════════════════════════════════════════════════════════════

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

await mkdir('assets/thumbnails/materials', { recursive: true });
await mkdir('assets/bins', { recursive: true });

// 1. توليد صور العناصر (Items Thumbnails)
const itemsGraphics = {
  plasticRuler: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rulerGrad" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0%" stop-color="#fff8d6" stop-opacity="0.95"/>
      <stop offset="50%" stop-color="#fed64e" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#f8b825" stop-opacity="0.85"/>
    </linearGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="3" dy="6" stdDeviation="5" flood-color="#403310" flood-opacity="0.22"/>
    </filter>
  </defs>
  <g transform="rotate(-18 100 80)" filter="url(#dropShadow)">
    <!-- جسم المسطرة الشفاف -->
    <rect x="15" y="60" width="170" height="42" rx="4" fill="url(#rulerGrad)" stroke="#d99f18" stroke-width="1.5"/>
    <!-- لمعان بلاستيكي علوي -->
    <rect x="17" y="62" width="166" height="6" rx="2" fill="#ffffff" fill-opacity="0.6"/>
    <!-- تدريجات السنتيمتر -->
    ${Array.from({ length: 17 }).map((_, i) => {
      const x = 24 + i * 9.5;
      const isMajor = i % 5 === 0;
      const h = isMajor ? 16 : 9;
      return `<line x1="${x}" y1="60" x2="${x}" y2="${60 + h}" stroke="#785007" stroke-width="${isMajor ? 1.5 : 1}"/>
              ${isMajor ? `<text x="${x}" y="86" font-size="8" font-family="Arial,sans-serif" font-weight="bold" fill="#785007" text-anchor="middle">${i}</text>` : ''}`;
    }).join('')}
    <!-- ثقب التعليق في المسطرة -->
    <circle cx="174" cy="81" r="4.5" fill="#f8f7fc" stroke="#c59014" stroke-width="1.5"/>
  </g>
</svg>
`,

  woolBall: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="woolGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#5be3d0"/>
      <stop offset="50%" stop-color="#24a696"/>
      <stop offset="85%" stop-color="#147568"/>
      <stop offset="100%" stop-color="#0b4e45"/>
    </radialGradient>
    <radialGradient id="pinkWool" cx="40%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ff8ebc"/>
      <stop offset="60%" stop-color="#e24584"/>
      <stop offset="100%" stop-color="#9d1c50"/>
    </radialGradient>
    <filter id="ballShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="4" dy="8" stdDeviation="6" flood-color="#113e37" flood-opacity="0.25"/>
    </filter>
  </defs>
  <!-- ظل الكرة على الأرض -->
  <ellipse cx="102" cy="132" rx="48" ry="14" fill="#1b413a" opacity="0.18"/>
  <g filter="url(#ballShadow)">
    <!-- جسم كرة الصوف الرئيسي -->
    <circle cx="98" cy="78" r="50" fill="url(#woolGrad)"/>
    <!-- لفات خيوط الصوف المتشابكة -->
    <path d="M60 62 Q95 40 135 65" fill="none" stroke="#68efdc" stroke-width="6" stroke-linecap="round"/>
    <path d="M52 82 Q98 105 142 78" fill="none" stroke="#168073" stroke-width="5" stroke-linecap="round"/>
    <path d="M68 98 Q100 125 130 95" fill="none" stroke="#4be1cd" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M75 52 Q60 90 85 118" fill="none" stroke="#1c8c7f" stroke-width="5" stroke-linecap="round"/>
    <path d="M120 50 Q140 85 115 115" fill="none" stroke="#75f8e5" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M85 45 Q115 75 92 112" fill="none" stroke="#229e8f" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M65 72 Q105 60 138 92" fill="none" stroke="#156d61" stroke-width="4.5" stroke-linecap="round"/>
    <!-- لمعان بارز على ألياف الصوف -->
    <ellipse cx="82" cy="58" rx="14" ry="7" fill="#ffffff" opacity="0.32" transform="rotate(-25 82 58)"/>
  </g>
  <!-- طرف الخيط المتدلي المنسدل -->
  <path d="M138 95 Q165 110 148 132 Q130 142 165 145" fill="none" stroke="#24a696" stroke-width="5" stroke-linecap="round"/>
</svg>
`,

  glassJar: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="jarBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="15%" stop-color="#bce8f5" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="85%" stop-color="#a4def0" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.8"/>
    </linearGradient>
    <linearGradient id="lidGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#e0a92b"/>
      <stop offset="45%" stop-color="#ffec94"/>
      <stop offset="70%" stop-color="#ffd55c"/>
      <stop offset="100%" stop-color="#ab7a10"/>
    </linearGradient>
    <filter id="jarShadow">
      <feDropShadow dx="3" dy="7" stdDeviation="6" flood-color="#194857" flood-opacity="0.2"/>
    </filter>
  </defs>
  <ellipse cx="100" cy="144" rx="44" ry="10" fill="#1b414f" opacity="0.15"/>
  <g filter="url(#jarShadow)">
    <!-- قاع المرطبان الزجاجي السميك -->
    <rect x="62" y="128" width="76" height="12" rx="4" fill="#aee2f2" fill-opacity="0.65" stroke="#79bfd4" stroke-width="1.2"/>
    <!-- جسم المرطبان -->
    <rect x="62" y="52" width="76" height="82" rx="10" fill="url(#jarBody)" stroke="#88ccdf" stroke-width="1.5"/>
    <!-- انعكاس لمعان الضوء على الزجاج -->
    <path d="M70 58 L70 128" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.75"/>
    <path d="M78 64 L78 122" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <path d="M130 58 L130 128" stroke="#7dc3d6" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
    <!-- عنق المرطبان والغطاء المعدني الذهبي -->
    <rect x="68" y="44" width="64" height="12" rx="3" fill="#b9e7f5" stroke="#7abfd4" stroke-width="1"/>
    <rect x="64" y="32" width="72" height="15" rx="4" fill="url(#lidGrad)" stroke="#9c7112" stroke-width="1.5"/>
    <!-- حافة الغطاء المحززة -->
    <line x1="66" y1="42" x2="134" y2="42" stroke="#946b0d" stroke-width="1.5"/>
  </g>
</svg>
`,

  glassCup: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cupGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="18%" stop-color="#c1ebf8" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="82%" stop-color="#aee1f2" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.8"/>
    </linearGradient>
  </defs>
  <ellipse cx="100" cy="144" rx="38" ry="8" fill="#1b414f" opacity="0.15"/>
  <g>
    <!-- قاع الكأس الزجاجي السميك الشفاف -->
    <path d="M72 124 L128 124 L124 140 L76 140 Z" fill="#b1e6f7" stroke="#7abfd4" stroke-width="1.5" opacity="0.75"/>
    <!-- جسم الكأس المنحوت -->
    <path d="M66 35 L134 35 L128 124 L72 124 Z" fill="url(#cupGrad)" stroke="#89ccdf" stroke-width="1.5"/>
    <!-- الحافة العلوية البيضاوية -->
    <ellipse cx="100" cy="35" rx="34" ry="7" fill="#e7f8fd" stroke="#7abfd4" stroke-width="1.5"/>
    <!-- لمعان عمودي ساطع على الزجاج -->
    <path d="M74 42 L77 120" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    <path d="M82 46 L84 116" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
    <!-- انعكاس الحافة المقابلة -->
    <path d="M124 42 L121 120" stroke="#8ecde0" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
  </g>
</svg>
`,

  ironNail: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ironGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d6dde5"/>
      <stop offset="35%" stop-color="#a0abb7"/>
      <stop offset="65%" stop-color="#707a86"/>
      <stop offset="100%" stop-color="#3d444d"/>
    </linearGradient>
    <filter id="nailShadow">
      <feDropShadow dx="4" dy="7" stdDeviation="4" flood-color="#1e242b" flood-opacity="0.3"/>
    </filter>
  </defs>
  <g transform="rotate(-32 100 80)" filter="url(#nailShadow)">
    <!-- رأس المسمار المسطح -->
    <ellipse cx="48" cy="80" rx="6" ry="18" fill="#c3ccd5" stroke="#505963" stroke-width="1.5"/>
    <!-- ساق المسمار المعدني -->
    <path d="M48 74 L146 76 L146 84 L48 86 Z" fill="url(#ironGrad)" stroke="#4a535c" stroke-width="1"/>
    <!-- سن المسمار المدبب الحاد -->
    <polygon points="146,75 165,80 146,85" fill="url(#ironGrad)" stroke="#4a535c" stroke-width="1"/>
    <!-- لمعان معدني لامع بطول المسمار -->
    <line x1="52" y1="77" x2="152" y2="78" stroke="#ffffff" stroke-width="2" opacity="0.85"/>
  </g>
</svg>
`,

  woodStick: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="barkGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#a06e3b"/>
      <stop offset="40%" stop-color="#7c4e23"/>
      <stop offset="85%" stop-color="#553313"/>
      <stop offset="100%" stop-color="#3b2108"/>
    </linearGradient>
    <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f0d5a8"/>
      <stop offset="40%" stop-color="#dfbe88"/>
      <stop offset="75%" stop-color="#c1995d"/>
      <stop offset="100%" stop-color="#805527"/>
    </radialGradient>
    <filter id="woodShadow">
      <feDropShadow dx="4" dy="6" stdDeviation="5" flood-color="#2a1605" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g transform="rotate(22 100 80)" filter="url(#woodShadow)">
    <!-- جذع وفرع الخشب الطبيعي -->
    <path d="M40 68 Q100 66 150 70 L150 94 Q100 96 40 92 Z" fill="url(#barkGrad)" stroke="#3f230a" stroke-width="1.5"/>
    <!-- خطوط لحاء الخشب والشقوق الطبيعية -->
    <path d="M60 74 Q85 76 110 74" stroke="#48280d" stroke-width="2" fill="none"/>
    <path d="M80 84 Q115 85 140 82" stroke="#48280d" stroke-width="2" fill="none"/>
    <path d="M55 86 Q75 88 95 86" stroke="#48280d" stroke-width="1.8" fill="none"/>
    <!-- عقدة شجرية صغيرة بارزة -->
    <ellipse cx="98" cy="78" rx="8" ry="5" fill="#442509" stroke="#683d16" stroke-width="1.5"/>
    <!-- مقطع الخشب المقطوع مع حلقات النمو الطبيعية -->
    <ellipse cx="40" cy="80" rx="8" ry="12" fill="url(#ringGrad)" stroke="#4d2c0e" stroke-width="1.5"/>
    <ellipse cx="40" cy="80" rx="4" ry="6" fill="none" stroke="#996e38" stroke-width="1.2"/>
    <circle cx="40" cy="80" r="1.5" fill="#5c3814"/>
  </g>
</svg>
`,

  metalSpoon: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="chromeGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="25%" stop-color="#e3e8ee"/>
      <stop offset="50%" stop-color="#9da9b5"/>
      <stop offset="75%" stop-color="#cbd5e0"/>
      <stop offset="100%" stop-color="#606973"/>
    </linearGradient>
    <filter id="spoonShadow">
      <feDropShadow dx="5" dy="7" stdDeviation="5" flood-color="#1a222a" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g transform="rotate(-35 100 80)" filter="url(#spoonShadow)">
    <!-- مقبض الملعقة الفولاذي اللامع -->
    <path d="M40 76 Q85 77 115 78 L115 82 Q85 83 40 84 Z" fill="url(#chromeGrad)" stroke="#535c66" stroke-width="1"/>
    <!-- تجويف الملعقة البيضاوي اللامع -->
    <ellipse cx="140" cy="80" rx="28" ry="18" fill="url(#chromeGrad)" stroke="#535c66" stroke-width="1.5"/>
    <!-- انعكاس اللمعان الداخلي للملعقة -->
    <ellipse cx="138" cy="79" rx="20" ry="11" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.85"/>
    <ellipse cx="142" cy="81" rx="14" ry="7" fill="#4d555e" opacity="0.3"/>
    <!-- بريق فضي ساطع -->
    <path d="M50 78 L110 79" stroke="#ffffff" stroke-width="2.5" opacity="0.9"/>
  </g>
</svg>
`,

  fabricCloth: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="clothShadow">
      <feDropShadow dx="3" dy="6" stdDeviation="5" flood-color="#3d1e2e" flood-opacity="0.2"/>
    </filter>
  </defs>
  <g filter="url(#clothShadow)">
    <!-- طبقة القماش السفلية (صفراء/بيج) -->
    <path d="M50 85 L145 75 L155 125 L60 135 Z" fill="#fed672" stroke="#d5aa3d" stroke-width="1.2" rx="6"/>
    <!-- طبقة القماش الوسطى (وردية ناعمة) -->
    <path d="M42 70 L140 60 L148 112 L50 122 Z" fill="#fca5c6" stroke="#d67198" stroke-width="1.2"/>
    <!-- طبقة القماش العلوية (سماوية تركوازية) -->
    <path d="M35 55 L132 45 L140 98 L43 108 Z" fill="#91e1d2" stroke="#5cbfae" stroke-width="1.2"/>
    <!-- درزات وثنيات الأقمشة الواقعية -->
    <path d="M43 108 Q90 102 140 98" stroke="#ffffff" stroke-width="2.5" fill="none" opacity="0.7"/>
    <path d="M50 122 Q98 116 148 112" stroke="#f686af" stroke-width="2" fill="none"/>
    <path d="M60 135 Q105 130 155 125" stroke="#deb548" stroke-width="2" fill="none"/>
  </g>
</svg>
`,

  paperEnvelope: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="envGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff4dc"/>
      <stop offset="100%" stop-color="#e8caa0"/>
    </linearGradient>
    <filter id="envShadow">
      <feDropShadow dx="4" dy="6" stdDeviation="5" flood-color="#4a361c" flood-opacity="0.2"/>
    </filter>
  </defs>
  <g transform="rotate(-8 100 80)" filter="url(#envShadow)">
    <!-- جسم المغلف الكرتوني/الورقي -->
    <rect x="42" y="45" width="116" height="74" rx="5" fill="url(#envGrad)" stroke="#be9862" stroke-width="1.5"/>
    <!-- طيات المغلف المتقاطعة -->
    <path d="M42 119 L100 82 L158 119" fill="none" stroke="#ba935d" stroke-width="1.8"/>
    <!-- مثلث غطاء المغلف العلوي -->
    <polygon points="42,45 158,45 100,85" fill="#f5dbb2" stroke="#ba935d" stroke-width="1.5"/>
    <!-- لمعان حافة الورق -->
    <line x1="45" y1="47" x2="155" y2="47" stroke="#ffffff" stroke-width="2" opacity="0.8"/>
  </g>
</svg>
`,

  eraser: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="eraserShadow">
      <feDropShadow dx="4" dy="6" stdDeviation="5" flood-color="#2a203b" flood-opacity="0.22"/>
    </filter>
  </defs>
  <g transform="rotate(18 100 80)" filter="url(#eraserShadow)">
    <!-- النصف الوردي من الممحاة المطاطية -->
    <path d="M45 60 L105 60 L105 100 L45 100 Z" fill="#f87171" stroke="#dc2626" stroke-width="1.5"/>
    <!-- النصف الأزرق من الممحاة المطاطية مع الشطفة المميزة -->
    <path d="M105 60 L145 60 L160 80 L145 100 L105 100 Z" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/>
    <!-- حواف الشطفة الثلاثية الأبعاد (Bevel) -->
    <polygon points="45,60 145,60 152,52 52,52" fill="#fca5a5" stroke="#dc2626" stroke-width="1"/>
    <polygon points="145,60 160,80 168,72 152,52" fill="#93c5fd" stroke="#2563eb" stroke-width="1"/>
    <!-- لمعان مطاطي نظيف -->
    <line x1="55" y1="64" x2="135" y2="64" stroke="#ffffff" stroke-width="2" opacity="0.65"/>
  </g>
</svg>
`,

  paperClip: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="clipShadow">
      <feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#1e293b" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g transform="rotate(35 100 80)" filter="url(#clipShadow)">
    <!-- سلك المشبك المعدني المتداخل بدقة -->
    <path d="M60 85 L60 55 A18 18 0 0 1 96 55 L96 110 A16 16 0 0 1 64 110 L64 70 A10 10 0 0 1 84 70 L84 100" 
          fill="none" stroke="#94a3b8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- لمعان الكروم الفضي الساطع على السلك -->
    <path d="M60 85 L60 55 A18 18 0 0 1 96 55 L96 110 A16 16 0 0 1 64 110 L64 70 A10 10 0 0 1 84 70 L84 100" 
          fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  </g>
</svg>
`,

  goldRing: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff8db"/>
      <stop offset="30%" stop-color="#f5c23a"/>
      <stop offset="60%" stop-color="#d99912"/>
      <stop offset="85%" stop-color="#ffd863"/>
      <stop offset="100%" stop-color="#996404"/>
    </linearGradient>
    <filter id="ringShadow">
      <feDropShadow dx="4" dy="8" stdDeviation="6" flood-color="#4a3304" flood-opacity="0.3"/>
    </filter>
  </defs>
  <ellipse cx="100" cy="132" rx="42" ry="12" fill="#3b2700" opacity="0.18"/>
  <g filter="url(#ringShadow)">
    <!-- حلقة الخاتم الذهبي البيضاوية المنحوتة -->
    <ellipse cx="100" cy="82" rx="45" ry="32" fill="none" stroke="url(#goldGrad)" stroke-width="16"/>
    <!-- نقش وزخرفة التاج الذهبي الملكي -->
    <path d="M88 48 Q100 32 112 48 Q118 42 124 54 Q100 48 76 54 Q82 42 88 48 Z" fill="url(#goldGrad)" stroke="#a16b06" stroke-width="1.2"/>
    <!-- بريق اللمعان الذهبي الساطع -->
    <circle cx="82" cy="62" r="3.5" fill="#ffffff" opacity="0.95"/>
    <path d="M82 54 L82 70 M74 62 L90 62" stroke="#ffffff" stroke-width="2" opacity="0.9"/>
    <circle cx="118" cy="100" r="2.5" fill="#ffffff" opacity="0.8"/>
  </g>
</svg>
`,

  brassMortar: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="brassGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#e8be66"/>
      <stop offset="25%" stop-color="#fff1b5"/>
      <stop offset="55%" stop-color="#c99534"/>
      <stop offset="85%" stop-color="#ffd878"/>
      <stop offset="100%" stop-color="#8a5e14"/>
    </linearGradient>
    <filter id="mortarShadow">
      <feDropShadow dx="4" dy="7" stdDeviation="6" flood-color="#382506" flood-opacity="0.25"/>
    </filter>
  </defs>
  <ellipse cx="100" cy="142" rx="48" ry="11" fill="#2d1c02" opacity="0.18"/>
  <g filter="url(#mortarShadow)">
    <!-- قاعدة الهاون النحاسي الصلبة -->
    <path d="M68 132 L132 132 L128 140 L72 140 Z" fill="url(#brassGrad)" stroke="#784e09" stroke-width="1.5"/>
    <!-- خصر وجسم الهاون المقعر -->
    <path d="M54 58 Q72 98 68 132 L132 132 Q128 98 146 58 Z" fill="url(#brassGrad)" stroke="#784e09" stroke-width="1.5"/>
    <!-- الفوهة العلوية البيضاوية -->
    <ellipse cx="100" cy="58" rx="46" ry="12" fill="#8f6013" stroke="#ffd878" stroke-width="2"/>
    <!-- تجويف الهاون الداخلي -->
    <ellipse cx="100" cy="60" rx="38" ry="8" fill="#4d3106"/>
    <!-- مدقة الهاون النحاسية المائلة -->
    <path d="M85 30 L115 105 L125 102 L95 27 Z" fill="url(#brassGrad)" stroke="#6e4605" stroke-width="1.5" rx="3"/>
    <!-- رأس المدقة الكروي العلوي -->
    <circle cx="90" cy="28" r="8" fill="url(#brassGrad)" stroke="#6e4605" stroke-width="1.2"/>
  </g>
</svg>
`,

  keys: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="silverKey" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
    <linearGradient id="brassKey" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffec99"/>
      <stop offset="50%" stop-color="#d99b1c"/>
      <stop offset="100%" stop-color="#7a4f04"/>
    </linearGradient>
    <filter id="keysShadow">
      <feDropShadow dx="4" dy="7" stdDeviation="5" flood-color="#1e293b" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#keysShadow)">
    <!-- حلقة المفاتيح المعدنية الدائرية -->
    <circle cx="85" cy="52" r="22" fill="none" stroke="url(#silverKey)" stroke-width="5"/>
    <!-- المفتاح الفضي الأول -->
    <g transform="rotate(22 85 52)">
      <circle cx="85" cy="52" r="14" fill="none" stroke="url(#silverKey)" stroke-width="6"/>
      <rect x="82" y="66" width="6" height="58" rx="2" fill="url(#silverKey)" stroke="#475569" stroke-width="1"/>
      <!-- أسنان المفتاح -->
      <rect x="88" y="104" width="8" height="5" fill="url(#silverKey)"/>
      <rect x="88" y="114" width="10" height="6" fill="url(#silverKey)"/>
    </g>
    <!-- المفتاح الذهبي النحاسي الثاني المائل -->
    <g transform="rotate(-30 85 52)">
      <circle cx="85" cy="52" r="14" fill="none" stroke="url(#brassKey)" stroke-width="6"/>
      <rect x="82" y="66" width="6" height="62" rx="2" fill="url(#brassKey)" stroke="#7a4f04" stroke-width="1"/>
      <rect x="74" y="108" width="8" height="5" fill="url(#brassKey)"/>
      <rect x="72" y="118" width="10" height="6" fill="url(#brassKey)"/>
    </g>
  </g>
</svg>
`,

  chalk: `
<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="chalkShadow">
      <feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#334155" flood-opacity="0.2"/>
    </filter>
  </defs>
  <g filter="url(#chalkShadow)">
    <!-- طبشورة بيضاء مائلة -->
    <g transform="rotate(-20 100 80)">
      <rect x="80" y="45" width="14" height="75" rx="3" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
      <ellipse cx="87" cy="45" rx="7" ry="2.5" fill="#ffffff"/>
    </g>
    <!-- طبشورة زرقاء سماوية -->
    <g transform="rotate(-5 100 80)">
      <rect x="94" y="48" width="14" height="72" rx="3" fill="#7dd3fc" stroke="#0284c7" stroke-width="1.5"/>
      <ellipse cx="101" cy="48" rx="7" ry="2.5" fill="#bae6fd"/>
    </g>
    <!-- طبشورة وردية ناعمة -->
    <g transform="rotate(12 100 80)">
      <rect x="108" y="52" width="14" height="70" rx="3" fill="#f472b6" stroke="#db2777" stroke-width="1.5"/>
      <ellipse cx="115" cy="52" rx="7" ry="2.5" fill="#fbcfe8"/>
    </g>
    <!-- طبشورة صفراء -->
    <g transform="rotate(28 100 80)">
      <rect x="122" y="56" width="14" height="68" rx="3" fill="#fde047" stroke="#ca8a04" stroke-width="1.5"/>
      <ellipse cx="129" cy="56" rx="7" ry="2.5" fill="#fef08a"/>
    </g>
  </g>
</svg>
`
};

// 2. توليد صور الصناديق والحاويات ثلاثية الأبعاد (3D Bins)
const binsGraphics = {
  plastic: `
<svg viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="binYellowTop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff5c0"/>
      <stop offset="100%" stop-color="#fed64e"/>
    </linearGradient>
    <linearGradient id="binYellowFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5ba22"/>
      <stop offset="100%" stop-color="#c98d08"/>
    </linearGradient>
    <linearGradient id="binYellowSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#dba114"/>
      <stop offset="100%" stop-color="#a46f04"/>
    </linearGradient>
    <filter id="binShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="3" dy="8" stdDeviation="6" flood-color="#4a3504" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#binShadow)">
    <!-- صندوق بلاستيكي مجسم Isometric -->
    <!-- الوجه الأمامي -->
    <polygon points="30,60 105,60 105,120 30,120" fill="url(#binYellowFront)" stroke="#9e6e06" stroke-width="1.5"/>
    <!-- الوجه الجانبي الأيمن ثلاثي الأبعاد -->
    <polygon points="105,60 135,42 135,102 105,120" fill="url(#binYellowSide)" stroke="#9e6e06" stroke-width="1.5"/>
    <!-- الوجه العلوي المفتوح -->
    <polygon points="30,60 60,42 135,42 105,60" fill="url(#binYellowTop)" stroke="#9e6e06" stroke-width="1.5"/>
    <!-- تجويف الحاوية الداخلي -->
    <polygon points="34,60 62,45 131,45 103,60" fill="#755005" opacity="0.65"/>
    <!-- شعار إعادة التدوير البلاستيكي على مقدمة الصندوق -->
    <circle cx="67" cy="90" r="15" fill="#ffffff" opacity="0.9"/>
    <path d="M67 80 L73 90 L61 90 Z" fill="#9e6e06"/>
    <text x="67" y="93" font-size="8" font-family="Arial,sans-serif" font-weight="bold" fill="#9e6e06" text-anchor="middle">PET</text>
  </g>
</svg>
`,

  glass: `
<svg viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="glassTop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#c6effb" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="glassFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#93e0f5" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#3baec9" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="glassSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#55c1db" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#218fa8" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="glassShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="3" dy="8" stdDeviation="6" flood-color="#124f5e" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#glassShadow)">
    <!-- صندوق زجاجي بلوري شفاف ثلاثي الأبعاد -->
    <polygon points="30,60 105,60 105,120 30,120" fill="url(#glassFront)" stroke="#1a768c" stroke-width="1.5"/>
    <polygon points="105,60 135,42 135,102 105,120" fill="url(#glassSide)" stroke="#1a768c" stroke-width="1.5"/>
    <polygon points="30,60 60,42 135,42 105,60" fill="url(#glassTop)" stroke="#1a768c" stroke-width="1.5"/>
    <polygon points="34,60 62,45 131,45 103,60" fill="#135261" opacity="0.6"/>
    <!-- لمعان بلوري زجاجي مشع -->
    <path d="M38 68 L50 114" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/>
    <circle cx="67" cy="90" r="15" fill="#ffffff" opacity="0.9"/>
    <!-- أيقونة الكأس الزجاجي على الصندوق -->
    <path d="M62 82 L72 82 L70 93 L64 93 Z" fill="#1a768c"/>
    <rect x="66" y="93" width="2" height="6" fill="#1a768c"/>
    <line x1="63" y1="99" x2="71" y2="99" stroke="#1a768c" stroke-width="1.5"/>
  </g>
</svg>
`,

  fabric: `
<svg viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fabFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f68cb6"/>
      <stop offset="100%" stop-color="#c93e76"/>
    </linearGradient>
    <linearGradient id="fabSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#df548d"/>
      <stop offset="100%" stop-color="#a02456"/>
    </linearGradient>
    <linearGradient id="fabTop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fed6e6"/>
      <stop offset="100%" stop-color="#f9a3c5"/>
    </linearGradient>
    <filter id="fabShadow">
      <feDropShadow dx="3" dy="8" stdDeviation="6" flood-color="#4a0f27" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#fabShadow)">
    <!-- سلة نسيج وقماش ثلاثية الأبعاد -->
    <polygon points="30,60 105,60 105,120 30,120" fill="url(#fabFront)" stroke="#8e1b4a" stroke-width="1.5"/>
    <polygon points="105,60 135,42 135,102 105,120" fill="url(#fabSide)" stroke="#8e1b4a" stroke-width="1.5"/>
    <polygon points="30,60 60,42 135,42 105,60" fill="url(#fabTop)" stroke="#8e1b4a" stroke-width="1.5"/>
    <polygon points="34,60 62,45 131,45 103,60" fill="#691135" opacity="0.6"/>
    <!-- زخرفة نسيجية متقاطعة -->
    <line x1="30" y1="80" x2="105" y2="80" stroke="#fbcfe0" stroke-width="2" stroke-dasharray="4,4"/>
    <line x1="30" y1="100" x2="105" y2="100" stroke="#fbcfe0" stroke-width="2" stroke-dasharray="4,4"/>
    <circle cx="67" cy="90" r="15" fill="#ffffff" opacity="0.9"/>
    <!-- كرة صوف صغيرة على واجهة الصندوق -->
    <circle cx="67" cy="90" r="9" fill="#c93e76"/>
    <path d="M61 88 Q67 82 73 88" stroke="#ffffff" stroke-width="1.5" fill="none"/>
  </g>
</svg>
`,

  metal: `
<svg viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="metalFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#9d8fd4"/>
      <stop offset="100%" stop-color="#554494"/>
    </linearGradient>
    <linearGradient id="metalSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6955a8"/>
      <stop offset="100%" stop-color="#3d2c75"/>
    </linearGradient>
    <linearGradient id="metalTop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ded8f8"/>
      <stop offset="100%" stop-color="#b6aae6"/>
    </linearGradient>
    <filter id="metalShadow">
      <feDropShadow dx="3" dy="8" stdDeviation="6" flood-color="#241457" flood-opacity="0.3"/>
    </filter>
  </defs>
  <g filter="url(#metalShadow)">
    <!-- صندوق معدني فولاذي مع مسامير زوايا -->
    <polygon points="30,60 105,60 105,120 30,120" fill="url(#metalFront)" stroke="#302161" stroke-width="1.5"/>
    <polygon points="105,60 135,42 135,102 105,120" fill="url(#metalSide)" stroke="#302161" stroke-width="1.5"/>
    <polygon points="30,60 60,42 135,42 105,60" fill="url(#metalTop)" stroke="#302161" stroke-width="1.5"/>
    <polygon points="34,60 62,45 131,45 103,60" fill="#22144d" opacity="0.6"/>
    <!-- زوايا فولاذية مدعمة ببراغي -->
    <circle cx="36" cy="66" r="2.5" fill="#ded8f8"/>
    <circle cx="99" cy="66" r="2.5" fill="#ded8f8"/>
    <circle cx="36" cy="114" r="2.5" fill="#ded8f8"/>
    <circle cx="99" cy="114" r="2.5" fill="#ded8f8"/>
    <circle cx="67" cy="90" r="15" fill="#ffffff" opacity="0.95"/>
    <!-- حدوة مغناطيس على الصندوق -->
    <path d="M60 85 A7 7 0 0 1 74 85 L74 95 L70 95 L70 85 A3 3 0 0 0 64 85 L64 95 L60 95 Z" fill="#d93855"/>
  </g>
</svg>
`,

  wood: `
<svg viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="woodFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b8844f"/>
      <stop offset="100%" stop-color="#78491c"/>
    </linearGradient>
    <linearGradient id="woodSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8f5924"/>
      <stop offset="100%" stop-color="#552f08"/>
    </linearGradient>
    <linearGradient id="woodTop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#dfb788"/>
      <stop offset="100%" stop-color="#c1915c"/>
    </linearGradient>
    <filter id="woodBoxShadow">
      <feDropShadow dx="3" dy="8" stdDeviation="6" flood-color="#301804" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#woodBoxShadow)">
    <!-- صندوق خشبي طبيعي بألواح الخشب -->
    <polygon points="30,60 105,60 105,120 30,120" fill="url(#woodFront)" stroke="#4a2503" stroke-width="1.5"/>
    <polygon points="105,60 135,42 135,102 105,120" fill="url(#woodSide)" stroke="#4a2503" stroke-width="1.5"/>
    <polygon points="30,60 60,42 135,42 105,60" fill="url(#woodTop)" stroke="#4a2503" stroke-width="1.5"/>
    <polygon points="34,60 62,45 131,45 103,60" fill="#361a02" opacity="0.6"/>
    <!-- ألواح الخشب الأفقية والمسامير -->
    <line x1="30" y1="80" x2="105" y2="80" stroke="#502a06" stroke-width="2"/>
    <line x1="30" y1="100" x2="105" y2="100" stroke="#502a06" stroke-width="2"/>
    <circle cx="67" cy="90" r="15" fill="#fdf6ec" opacity="0.95"/>
    <!-- ورقة شجر خضراء ترمز للأخشاب والطبيعة -->
    <path d="M67 78 Q76 86 67 100 Q58 86 67 78 Z" fill="#2d8753"/>
    <line x1="67" y1="80" x2="67" y2="98" stroke="#ffffff" stroke-width="1.2"/>
  </g>
</svg>
`,

  paper: `
<svg viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#dfbb86"/>
      <stop offset="100%" stop-color="#a67c42"/>
    </linearGradient>
    <linearGradient id="cardSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#b88c52"/>
      <stop offset="100%" stop-color="#785320"/>
    </linearGradient>
    <linearGradient id="cardTop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8e5c8"/>
      <stop offset="100%" stop-color="#e2c8a2"/>
    </linearGradient>
    <filter id="cardShadow">
      <feDropShadow dx="3" dy="8" stdDeviation="6" flood-color="#3d280b" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#cardShadow)">
    <!-- صندوق كرتون ورقي ثلاثي الأبعاد -->
    <polygon points="30,60 105,60 105,120 30,120" fill="url(#cardFront)" stroke="#664312" stroke-width="1.5"/>
    <polygon points="105,60 135,42 135,102 105,120" fill="url(#cardSide)" stroke="#664312" stroke-width="1.5"/>
    <polygon points="30,60 60,42 135,42 105,60" fill="url(#cardTop)" stroke="#664312" stroke-width="1.5"/>
    <polygon points="34,60 62,45 131,45 103,60" fill="#4d3008" opacity="0.6"/>
    <!-- طيات أجنحة الكرتون المفتوحة -->
    <polygon points="30,60 10,48 45,36 60,42" fill="#e8cfad" stroke="#664312" stroke-width="1"/>
    <polygon points="105,60 130,48 152,56 135,70" fill="#c49a62" stroke="#664312" stroke-width="1"/>
    <circle cx="67" cy="90" r="15" fill="#ffffff" opacity="0.95"/>
    <!-- رمز الورقة المطوية -->
    <path d="M61 80 L70 80 L74 84 L74 100 L61 100 Z" fill="#9e6e22"/>
    <polygon points="70,80 74,84 70,84" fill="#664312"/>
  </g>
</svg>
`,

  rubber: `
<svg viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rubFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5eead4"/>
      <stop offset="100%" stop-color="#14b8a6"/>
    </linearGradient>
    <linearGradient id="rubSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2dd4bf"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
    <linearGradient id="rubTop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ccfbf1"/>
      <stop offset="100%" stop-color="#99f6e4"/>
    </linearGradient>
    <filter id="rubShadow">
      <feDropShadow dx="3" dy="8" stdDeviation="6" flood-color="#0a3d38" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#rubShadow)">
    <!-- حاوية مطاطية مرنة خضراء زمردية ثلاثية الأبعاد -->
    <polygon points="30,60 105,60 105,120 30,120" fill="url(#rubFront)" stroke="#0d5953" stroke-width="1.5"/>
    <polygon points="105,60 135,42 135,102 105,120" fill="url(#rubSide)" stroke="#0d5953" stroke-width="1.5"/>
    <polygon points="30,60 60,42 135,42 105,60" fill="url(#rubTop)" stroke="#0d5953" stroke-width="1.5"/>
    <polygon points="34,60 62,45 131,45 103,60" fill="#083834" opacity="0.6"/>
    <!-- لمعان مطاطي مقوس ومرن -->
    <path d="M36 68 Q67 76 98 68" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.8"/>
    <circle cx="67" cy="90" r="15" fill="#ffffff" opacity="0.95"/>
    <!-- ممحاة مطاطية صغيرة على الواجهة -->
    <rect x="59" y="84" width="16" height="12" rx="2" fill="#0f766e"/>
    <rect x="59" y="84" width="6" height="12" fill="#f43f5e"/>
  </g>
</svg>
`
};

for (const [id, svg] of Object.entries(itemsGraphics)) {
  await writeFile(`assets/thumbnails/materials/${id}.svg`, svg.trim());
}
console.log(`Generated ${Object.keys(itemsGraphics).length} material item graphics`);

for (const [id, svg] of Object.entries(binsGraphics)) {
  await writeFile(`assets/bins/${id}.svg`, svg.trim());
}
console.log(`Generated ${Object.keys(binsGraphics).length} 3D bins graphics`);
