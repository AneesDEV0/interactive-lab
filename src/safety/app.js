// ═══════════════════════════════════════════════════════════════════════════
// src/safety/app.js — المنطق التفاعلي لمحطة حارس الأمان والسلامة الكهربائية
// للصف الرابع الأساسي · مع المساعد التعليمي «حارس الأمان» (كابتن أمان)
// ═══════════════════════════════════════════════════════════════════════════

import { items, byId, categories, testClassification, answer, voiceLines, generateSafetyReport } from './data.js';
import { icon, captainAmanMascot } from './icons.js';
import { SafetyVoice } from './audio.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const numbers = new Intl.NumberFormat('ar-u-nu-arab');
const params = new URLSearchParams(location.search);

// حالة النشاط
const state = {
  id: byId(params.get('item'))?.id || 'wet_hands_plug',
  mode: params.get('mode') === 'learn' ? 'learn' : 'play',
  activeCategory: null,
  attempts: 0,
  startTime: Date.now()
};

// استرجاع التقدم المحفوظ من LocalStorage
let discoveries = {};
try {
  const saved = JSON.parse(localStorage.getItem('captain-safety-discoveries-v1') || '{}');
  for (const [id, cat] of Object.entries(saved)) {
    if (byId(id) && categories[cat] && testClassification(id, cat).ok) {
      discoveries[id] = cat;
    }
  }
} catch { }

let scene = null;
let guideKey = 'welcome';
let guideText = voiceLines.welcome;
let soundState = 'idle';
let toastTimer = null;
let modelRevision = 0;

// الشعار والهوية البصرية
const brand = `
  <span class="brand-symbol">${icon('shield')}</span>
  <span>
    <strong>حارس الأمان</strong>
    <small>مع رفيقك «كابتن أمان»</small>
  </span>
`;

// بطاقة العنصر في الرف
const card = d => {
  const isSorted = !!discoveries[d.id];
  return `
    <button class="device-card${d.id === state.id ? ' selected' : ''}" 
            style="--card:${d.color}" 
            data-item="${d.id}" 
            draggable="true" 
            aria-pressed="${d.id === state.id}">
      <i class="device-check">${icon('check')}</i>
      ${isSorted ? `<span class="device-sorted-badge">${icon('check')} مصنّف</span>` : ''}
      <img src="assets/thumbnails/safety/${d.id}.svg" alt="${d.name}" class="device-card-thumb" loading="lazy">
      <span>${d.name}</span>
      <small>${d.origin || d.dangerLevel}</small>
    </button>
  `;
};

// حاوية تصنيف ثلاثية الأبعاد (عمود الجدول الثنائي: آمن أو خطر)
const binCard = cat => {
  const sortedCount = Object.keys(discoveries).filter(id => discoveries[id] === cat.id).length;
  const binImgSrc = cat.id === 'safe' ? 'assets/bins/safe_behavior.svg' : 'assets/bins/hazard_behavior.svg';
  return `
    <div class="bin-card" data-bin="${cat.id}" role="button" tabindex="0" aria-label="${cat.title}">
      <span class="bin-counter" id="counter-${cat.id}">${numbers.format(sortedCount)}</span>
      <div class="bin-3d-visual">
        <img src="${binImgSrc}" alt="${cat.title}" class="bin-3d-img" loading="lazy">
      </div>
      <strong>${cat.name}</strong>
      <small>${cat.badge}</small>
    </div>
  `;
};

const dialogHead = (id, title) => `
  <div class="dialog-head">
    <h2 id="${id}-title">${title}</h2>
    <button data-close="${id}" aria-label="إغلاق">${icon('close')}</button>
  </div>
`;

// بناء واجهة المستخدم الكاملة المتوافقة مع 100vh ومعمارية النشاط 2 و 4
$('#app').innerHTML = `
<div class="shell">
  <!-- الشريط الجانبي الأنيق -->
  <aside class="sidebar" aria-label="التنقل الرئيسي">
    <a href="safety.html" class="brand">${brand}</a>
    
    <nav class="nav-stack">
      <p class="nav-label">محطة السلامة والوقاية</p>
      <button class="nav-item active" data-action="home">${icon('shield')}طاولة الفحص والتقييم<span class="small-dot"></span></button>
      <button class="nav-item" data-open="library">${icon('cube')}كل سلوكيات كتابي (${numbers.format(items.length)})</button>
      <button class="nav-item" data-open="notebook">${icon('book')}سجل الأمان والتقرير</button>
    </nav>

    <nav class="nav-stack">
      <p class="nav-label">مساعدة وكاميرا</p>
      <button class="nav-item" data-open="camera">${icon('camera')}صوّر من كتابك</button>
      <button class="nav-item" data-open="help">${icon('help')}كيف أفرز السلوكيات؟</button>
    </nav>

    <div class="side-mascot">
      ${captainAmanMascot}
      <h3>مع «حارس الأمان» نسلم!</h3>
      <p>افحص السلوك وميّز الخطر من الأمان لحماية نفسك وبيتك.</p>
    </div>
    <p class="side-footer">صُنع لحماة الغد بالصف الرابع ${icon('heart')}</p>
  </aside>

  <!-- المنطقة الرئيسية -->
  <div class="body-area">
    <header class="topbar">
      <div class="breadcrumb">
        <a href="/" style="color:var(--muted);transition:color .2s" title="العودة لبوابة المنصة الرئيسية">المنصة الرئيسية</a> ${icon('chevron')} العلوم ${icon('chevron')} <strong>نشاط ٣: حارس الأمان والسلامة الكهربائية</strong>
      </div>
      <a href="safety.html" class="brand mobile-brand" aria-label="العودة إلى محطة السلامة الكهربائية">${brand}</a>
      
      <div class="top-actions">
        <!-- زر التبديل بين الأنشطة لمنع ازدحام الشاشات -->
        <div class="activity-toggle-wrap">
          <button id="activity-toggle-btn" class="activity-toggle-btn" aria-label="الأنشطة" aria-expanded="false" title="عرض الأنشطة">
            ${icon('bolt')}<span>الأنشطة</span><i class="toggle-arrow">▾</i>
          </button>
          <div id="activity-dropdown" class="activity-dropdown" hidden>
            <div class="dropdown-header">محطات العلوم التفاعلية</div>
            <a href="index.html" class="dropdown-item">
              <span class="dropdown-icon">🏠</span>
              <div><strong>بوابة المنصة الرئيسية</strong><small>التعريف بالمنصة والأنشطة</small></div>
            </a>
            <a href="electricity.html" class="dropdown-item">
              <span class="dropdown-icon">⚡</span>
              <div><strong>نشاط ١: وحدة الكهرباء</strong><small>مختبر مصادر الطاقة مع «شرارة»</small></div>
            </a>
            <a href="materials.html" class="dropdown-item">
              <span class="dropdown-icon">📦</span>
              <div><strong>نشاط ٢: فرز خامات البيئة</strong><small>محطة التصنيف مع «الخبير»</small></div>
            </a>
            <a href="safety.html" class="dropdown-item active">
              <span class="dropdown-icon">🛡️</span>
              <div><strong>نشاط ٣: حارس الأمان والسلامة</strong><small>محطة الوقاية مع «كابتن أمان»</small></div>
            </a>
            <a href="conductors.html" class="dropdown-item">
              <span class="dropdown-icon">💡</span>
              <div><strong>نشاط ٤: الموصلات والعوازل</strong><small>محطة الفحص مع «البروفيسور»</small></div>
            </a>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item disabled">
              <span class="dropdown-icon">🧲</span>
              <div><strong>نشاط ٥: قطبا المغناطيس</strong><small>قريباً</small></div>
            </div>
          </div>
        </div>

        <button id="sound-toggle" class="sound-button on" aria-label="إيقاف الصوت" aria-pressed="true">
          ${icon('sound')}<span>الصوت يعمل</span>
        </button>
        <div class="learner">
          <span class="avatar">${icon('star')}</span>
          <span>بطل الأمان<small>الصف الرابع الأساسي</small></span>
        </div>
        <button class="sound-button" data-open="help" aria-label="تعليمات النشاط">${icon('help')}</button>
      </div>
    </header>

    <main id="main" class="main">
      <!-- مقدمة النشاط -->
      <section class="intro">
        <div class="intro-copy">
          <div class="eyebrow">${icon('sparkles')} الصف الرابع الأساسي · أخطار الكهرباء وقواعد السلامة في المنزل</div>
          <h1>محطة <span>حارس الأمان والسلامة الكهربائية</span></h1>
          <p>اسحب التصرف إلى عمود السلوك الآمن أو السلوك الخطر، أو صوّره من كتابك وتعرّف إلى القواعد الذهبية لحماية الحياة مع «كابتن أمان».</p>
        </div>
        <button class="progress-chip" data-open="notebook">
          ${icon('trophy')}
          <span>
            <strong>إنجازاتي في الأمان</strong>
            <small id="progress-text"></small>
            <span class="progress-track"><i id="progress-bar"></i></span>
          </span>
        </button>
      </section>

      <!-- رف اختيار السلوكيات والمواقف -->
      <section class="device-section" aria-labelledby="choose-title">
        <div class="section-heading">
          <h2 id="choose-title"><span class="step-number">١</span> اختر سلوكاً من كتابك <small>أو اسحبه مباشرة للفرز</small></h2>
          <button class="text-button" data-open="library">كل السلوكيات <span>(${numbers.format(items.length)})</span> ${icon('arrow')}</button>
        </div>
        <div class="devices-row" id="device-shelf">
          ${items.slice(0, 6).map(card).join('')}
          <button class="camera-card" data-open="camera">
            ${icon('camera')}
            <strong>صوّر من كتابك</strong>
            <small>ليظهر الموقف فوراً!</small>
          </button>
        </div>
      </section>

      <!-- طاولة التجربة وعمود حارس الأمان -->
      <div class="experiment">
        <section class="lab-card" aria-label="طاولة فحص السلوكيات">
          <div class="lab-top">
            <div>
              <h2><span class="step-number">٢</span> طاولة الفحص والتقييم</h2>
              <small>شاهد تفاصيل الموقف والمجسم من كل الزوايا ٣٦٠ درجة</small>
            </div>
            <div class="mode-switch" role="group" aria-label="نوع النشاط">
              <button data-mode="learn">${icon('book')}تعرّف</button>
              <button data-mode="play" class="active">${icon('play')}جرّب وصنّف</button>
            </div>
          </div>

          <!-- مسرح Three.js -->
          <div class="stage" id="stage">
            <div id="scene" class="scene-container"></div>
            <div class="stage-badge">${icon('cube')} مجسّم تفاعلي ثلاثي الأبعاد</div>
            <div class="stage-tools">
              <button class="icon-button" data-action="reset-view" aria-label="إعادة زاوية العرض" title="إعادة زاوية العرض">${icon('reset')}</button>
              <button class="icon-button" data-action="zoom-in" aria-label="تقريب" title="تقريب">+</button>
              <button class="icon-button" data-action="zoom-out" aria-label="إبعاد" title="إبعاد">−</button>
            </div>
            
            <div class="drag-prompt-pill" id="drag-pill" draggable="true" title="اسحب من هنا إلى الجدول">
              ${icon('hand')} اسحب السلوك إلى الحاوية
            </div>

            <p id="model-status" class="model-status" role="status">نجهّز مجسم الموقف…</p>
            <h3 class="device-title" id="device-title"></h3>
            
            <div class="stage-caption">
              <span>${icon('hand')} اسحب لتدوير المجسم</span>
              <span id="device-state" class="state-pill">جاهز للفحص</span>
            </div>
          </div>

          <!-- لوحة وضع "جرّب وصنّف" (الجدول الثنائي: آمن وخطر) -->
          <div class="sorting-panel" id="play-panel">
            <h3 class="panel-heading">
              <span class="step-number">٣</span> اسحب إلى العمود المناسب لهذا التصرف:
              <small>أو اضغط على الحاوية لتصنيفه فوراً</small>
            </h3>
            <div class="bins-grid" id="bins-grid">
              ${Object.values(categories).map(binCard).join('')}
            </div>
            <div id="sorting-feedback" class="sorting-feedback" hidden></div>
          </div>

          <!-- لوحة وضع "تعرّف" (بطاقة الموقف وقواعد الحماية) -->
          <div class="learn-panel" id="learn-panel" hidden>
            <h3 class="panel-heading">${icon('info')} بطاقة الموقف التوعوية وقاعدة الحماية</h3>
            <div class="learn-grid">
              <div class="learn-spec"><label>المصدر والسياق</label><strong id="learn-origin"></strong></div>
              <div class="learn-spec"><label>درجة الخطورة</label><strong id="learn-danger"></strong></div>
              <div class="learn-spec"><label>سبب الخطر / الأمان</label><strong id="learn-reason"></strong></div>
              <div class="learn-spec"><label>نوع السلوك</label><strong id="learn-type"></strong></div>
              <div class="learn-spec" style="grid-column:1/-1"><label>نصيحة الأمان الحياتية</label><strong id="learn-safety"></strong></div>
            </div>
            <div class="fact-box">
              <strong style="display:block;margin-bottom:4px;color:var(--green)">شرح كابتن أمان التوعوي:</strong>
              <p id="device-fact"></p>
            </div>
            <div class="golden-box">
              <strong style="display:block;margin-bottom:4px;color:#744210">💡 القاعدة الذهبية لحماية الحياة:</strong>
              <p id="device-golden"></p>
            </div>
            <button class="primary" data-action="fact">${icon('sound')} استمع إلى توجيه «حارس الأمان»</button>
          </div>
        </section>

        <!-- عمود المساعد التعليمي: "حارس الأمان" (كابتن أمان) -->
        <aside class="guide-column" aria-label="المساعد التعليمي حارس الأمان">
          <section class="guide-card">
            <div class="guide-mascot">
              ${captainAmanMascot}
              <div>
                <h3>أهلاً، أنا «حارس الأمان»!</h3>
                <p>مرشدك في الوقاية من الصعق والحرائق</p>
              </div>
            </div>

            <div class="guide-bubble" id="guide-bubble">
              <p id="guide-text" aria-live="polite"></p>
            </div>

            <button class="guide-listen" id="listen">${icon('sound')} استمع إلى حارس الأمان</button>

            <div class="guide-suggestions">
              <button data-question="تلميح">${icon('help')} أعطني تلميحاً للتصنيف</button>
              <button data-question="قاعدة">${icon('shield')} ما هي القاعدة الذهبية؟</button>
              <button data-question="آمن">${icon('bolt')} هل هذا السلوك آمن أم خطر؟</button>
            </div>

            <form class="ask-form" id="ask-form">
              <input id="ask-input" maxlength="180" aria-label="اسأل حارس الأمان" placeholder="اسأل كابتن أمان عن الصعق، البلل، الأسلاك، المقابس…" autocomplete="off">
              <button type="button" id="mic-btn" class="speech-btn" aria-label="تحدث بالصوت" title="تحدث بالصوت">${icon('mic')}</button>
              <button type="button" id="clear-btn" class="clear-btn" aria-label="مسح النص" title="مسح النص">${icon('trash')}</button>
              <button type="submit" aria-label="إرسال السؤال">${icon('send')}</button>
            </form>

            <p class="guide-note">مساعد ذكي للسلامة والوقاية · الصف الرابع</p>
            <p id="sound-status" class="sound-status" role="status"></p>
          </section>

          <div class="safety-card">
            ${icon('shield')}
            <div>
              <strong>قواعد الأمان الذهبية مع «كابتن أمان»</strong>
              <p>الماء والمعادن موصلات سريعة تنقل الكهرباء إلى أجسادنا.<br>لا تلمس مقبساً بيد مبللة، ولا تشد سلكاً بقوة أبداً!</p>
            </div>
          </div>
        </aside>
      </div>

      <!-- إنجازات الرحلة والتقرير النهائي -->
      <section class="journey">
        ${icon('star')}
        <div>
          <h3 id="journey-title">مهمة حماية الأرواح والسلامة بانتظارك!</h3>
          <p id="journey-text">كل تصرف تصنفه بنجاح يضيف وسام أمان جديد، ويفتح تقرير كابتن أمان النهائي المعتمد.</p>
        </div>
        <button data-open="notebook">تقرير التقييم النهائي ${icon('arrow')}</button>
      </section>

      <p class="footer">${icon('heart')} الوعي بالأمان يحمي الحياة، وبالعلم نصنع مجتمعاً آمناً!</p>
    </main>
  </div>
</div>

<!-- النوافذ المنبثقة -->
<dialog id="library" aria-labelledby="library-title">
  ${dialogHead('library', 'سلوكيات وقواعد السلامة في كتاب العلوم')}
  <p class="dialog-description">اختر أي سلوك لمشاهدة مجسمه ثلاثي الأبعاد بزاوية ٣٦٠ درجة وتصنيفه داخل الجدول الثنائي:</p>
  <div class="library-grid" id="library-grid">
    ${items.map(card).join('')}
  </div>
</dialog>

<dialog id="camera" aria-labelledby="camera-title">
  ${dialogHead('camera', 'التعرف البصري بالكاميرا الذكية')}
  <p class="dialog-description">وجّه الكاميرا نحو صورة السلوك في كتاب العلوم، وسيتعرف عليها «حارس الأمان» فوراً:</p>
  <video id="camera-video" class="camera-preview" autoplay playsinline muted hidden></video>
  <img id="photo-preview" class="camera-preview" alt="صورة الموقف الملتقطة" hidden>
  
  <div class="camera-controls">
    <button class="primary" id="start-camera">${icon('camera')} افتح الكاميرا</button>
    <button class="primary" id="capture" hidden>التقط الصورة الآن</button>
    <label class="secondary file-label" for="photo-file">${icon('book')} أو اختر صورة محفوظة</label>
    <input class="visually-hidden" id="photo-file" type="file" accept="image/*" capture="environment">
  </div>
  
  <p id="camera-status" role="status"></p>
  
  <div class="camera-result" id="camera-result" hidden>
    <p id="recognition-text"></p>
    <label for="confirmed-item">تأكيد اسم السلوك:</label>
    <select id="confirmed-item">
      <option value="">اختر السلوك للتأكيد</option>
      ${items.map(d => `<option value="${d.id}">${d.name} (${d.origin})</option>`).join('')}
    </select>
    <button class="primary" id="confirm-photo">افتح السلوك على طاولة الفحص ${icon('arrow')}</button>
  </div>
</dialog>

<dialog id="notebook" aria-labelledby="notebook-title">
  ${dialogHead('notebook', 'تقرير التقييم النهائي وسجل الأمان')}
  <div id="notebook-content"></div>
</dialog>

<dialog id="help" aria-labelledby="help-title">
  ${dialogHead('help', 'كيف أصنف السلوكيات وأحمي نفسي؟')}
  <div class="help-steps">
    <div class="help-step">
      <span class="step-number">١</span>
      <div>
        <h3>اختر السلوك أو صوّره</h3>
        <p>اختر سلوكاً من كتابك من الرف العلوي، أو استخدم الكاميرا لمطابقة صورته في كتاب العلوم.</p>
      </div>
    </div>
    <div class="help-step">
      <span class="step-number">٢</span>
      <div>
        <h3>تأمّل الموقف وقاعدته الذهبية</h3>
        <p>في وضع «تعرّف» دوّر المجسم ثلاثي الأبعاد، واستمع لتوجيه «حارس الأمان» لمعرفة هل يعرضك للصعق والحرائق أم يحميك ويحفظ سلامتك.</p>
      </div>
    </div>
    <div class="help-step">
      <span class="step-number">٣</span>
      <div>
        <h3>اسحب وأفلت في الجدول الثنائي (Drag and Drop)</h3>
        <p>اسحب السلوك إلى عمود "سلوك آمن وصحيح 🛡️✅" أو "سلوك خطر وخاطئ ⚠️❌". إذا أصبت ستكسب وساماً، وإن أخطأت سيعطيك كابتن أمان تنبيهاً ذكياً فورياً!</p>
      </div>
    </div>
  </div>
  <button class="primary" data-close="help" style="margin-top:18px;width:100%">فهمت، لنبدأ تقييم الأمان فوراً! ${icon('arrow')}</button>
</dialog>

<div id="toast" class="toast" role="status" hidden></div>
`;

// تهيئة نظام الصوت لشخصية "حارس الأمان"
const voice = new SafetyVoice(status => {
  soundState = status;
  $('#listen').innerHTML = icon(status === 'playing' ? 'stop' : 'sound') + (status === 'playing' ? ' إيقاف الصوت' : ' استمع إلى حارس الأمان');
  $('#sound-status').textContent = status === 'unavailable' ? 'تعذّر تشغيل الصوت المباشر. يمكنك قراءة توجيه حارس الأمان أعلاه.' : '';
});

function say(key, text = voiceLines[key], success = false, force = false) {
  guideKey = key;
  guideText = text;
  $('#guide-text').textContent = text;
  $('#guide-bubble').classList.toggle('success', success);
  voice.say(key, text, force);
}

function toast(text) {
  clearTimeout(toastTimer);
  $('#toast').textContent = text;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
}

function saveDiscoveries() {
  try {
    localStorage.setItem('captain-safety-discoveries-v1', JSON.stringify(discoveries));
  } catch { }
}

function render() {
  const item = byId(state.id);
  const isPlay = state.mode === 'play';
  const isSorted = !!discoveries[state.id];

  // أزرار الأوضاع (تعرّف / جرّب)
  $$('[data-mode]').forEach(b => {
    const active = b.dataset.mode === state.mode;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', active);
  });

  // تحديد العنصر في الرف
  $$('[data-item]').forEach(b => {
    const selected = b.dataset.item === state.id;
    b.classList.toggle('selected', selected);
    b.setAttribute('aria-pressed', selected);
  });

  // العناوين والحالات
  $('#device-title').textContent = item.name;
  $('#device-state').textContent = isSorted 
    ? `مصنّف (${categories[discoveries[state.id]].shortName})` 
    : isPlay 
    ? 'جاهز للفحص والتقييم' 
    : 'نتعرّف إلى قواعد الحماية';
  $('#device-state').classList.toggle('sorted', isSorted);

  // إظهار وإخفاء اللوحات
  $('#play-panel').hidden = !isPlay;
  $('#learn-panel').hidden = isPlay;
  $('#drag-pill').hidden = !isPlay;

  if (!isPlay) {
    $('#learn-origin').textContent = item.origin;
    $('#learn-danger').textContent = item.dangerLevel;
    $('#learn-reason').textContent = item.hazardReason;
    $('#learn-type').textContent = item.category === 'safe' ? 'سلوك آمن وصحيح 🛡️✅' : 'سلوك خطر وخاطئ ⚠️❌';
    $('#learn-safety').textContent = item.safetyTip;
    $('#device-fact').textContent = item.fact;
    $('#device-golden').textContent = item.goldenRule;
  }

  // تحديث عدادات الحاويات
  for (const catId of Object.keys(categories)) {
    const count = Object.keys(discoveries).filter(id => discoveries[id] === catId).length;
    const counterEl = $(`#counter-${catId}`);
    if (counterEl) counterEl.textContent = numbers.format(count);
  }

  // شريط الإنجاز العام
  const sortedCount = Object.keys(discoveries).length;
  const total = items.length;
  $('#progress-text').textContent = `${numbers.format(sortedCount)} من ${numbers.format(total)} سلوكيات`;
  $('#progress-bar').style.width = `${(sortedCount / total) * 100}%`;

  $('#journey-title').textContent = sortedCount === 0 
    ? 'مهمة حماية الأرواح والسلامة بانتظارك!' 
    : sortedCount === total 
    ? 'مبارك! أتممت تقييم وفرز جميع السلوكيات بنجاح باهر!' 
    : `رائع! قيّمت ${numbers.format(sortedCount)} من سلوكيات كتابك`;

  $('#journey-text').textContent = sortedCount === total
    ? 'اضغط هنا لعرض تقرير كابتن أمان النهائي واستلام وسام حارس الأمان الذهبي المعتمد!'
    : sortedCount > 0
    ? 'تابع تصنيف باقي السلوكيات لتكتمل مجموعتك وتصبح سفيراً معتمداً للسلامة والوقاية.'
    : 'كل تصرف تصنفه بنجاح يضيف وسام أمان جديد، ويفتح تقرير كابتن أمان النهائي.';
}

/**
 * اختيار عنصر معين وتحديث المشهد ثلاثي الأبعاد
 */
async function selectItem(id, initial = false) {
  const item = byId(id);
  if (!item) return;

  voice.stop();
  state.id = id;

  const url = new URL(location.href);
  url.searchParams.set('item', id);
  url.searchParams.set('mode', state.mode);
  history.replaceState(null, '', url);

  // تحديث الرف العلوي إن لم يكن العنصر موجوداً فيه
  if (!items.slice(0, 6).some(x => x.id === id)) {
    $('#device-shelf').innerHTML = [item, ...items.filter(x => x.id !== id).slice(0, 5)].map(card).join('') + `
      <button class="camera-card" data-open="camera">
        ${icon('camera')}
        <strong>صوّر من كتابك</strong>
        <small>ليظهر الموقف فوراً!</small>
      </button>
    `;
  }

  render();

  if (state.mode === 'learn') {
    say(id + '-fact', `${item.name}: ${item.fact} ${item.goldenRule}`);
  } else if (initial) {
    say('welcome');
  } else {
    say(id + '-select', `اخترت: ${item.name}. اسحب المجسم أو اضغط على عمود السلوك الآمن أو الخطر في الجدول.`);
  }

  const rev = ++modelRevision;
  if (scene) {
    $('#model-status').hidden = false;
    $('#model-status').textContent = 'نجهّز مجسم الموقف…';
    try {
      await scene.setItem(item);
      if (rev === modelRevision) {
        $('#model-status').hidden = true;
      }
    } catch {
      if (rev === modelRevision) {
        $('#model-status').textContent = 'تعذّر تجهيز المجسم. يمكنك مواصلة التصنيف بالأزرار.';
      }
    }
  }
}

/**
 * تبديل الوضع (تعرّف / جرّب)
 */
function setMode(mode) {
  voice.stop();
  state.mode = mode;
  render();

  const url = new URL(location.href);
  url.searchParams.set('mode', mode);
  history.replaceState(null, '', url);

  if (mode === 'learn') {
    const item = byId(state.id);
    say(state.id + '-fact', `${item.name}: ${item.fact} ${item.goldenRule}`);
  } else {
    say('play', voiceLines.play);
  }
}

/**
 * تنفيذ فحص وتصنيف السلوك داخل الحاوية المستهدفة (آمن أو خطر)
 */
function handleClassification(itemId, targetCategoryId) {
  if (state.mode !== 'play') return;
  state.attempts++;
  const result = testClassification(itemId, targetCategoryId);
  const binEl = $(`[data-bin="${targetCategoryId}"]`);

  const feedbackEl = $('#sorting-feedback');
  feedbackEl.hidden = false;
  feedbackEl.textContent = result.text;
  feedbackEl.className = `sorting-feedback ${result.ok ? 'success' : 'wrong'}`;

  if (result.ok) {
    if (targetCategoryId === 'hazard') {
      voice.playSfx('shock'); // ⚡ صوت صعق وتفريغ كهربائي واقعي للسلوك الخطر
    } else {
      voice.playSfx('correct'); // 🛡️ نغمة أمان مبهجة للسلوك السليم
    }
    discoveries[itemId] = targetCategoryId;
    saveDiscoveries();
    scene?.celebrateSuccess();

    if (binEl) {
      binEl.classList.add('correct-drop');
      setTimeout(() => binEl.classList.remove('correct-drop'), 700);
    }

    render();
    say(`${itemId}-result`, result.text, true);
    toast(`أحسنت! صنّفت (${result.item.name}) في (${result.target.name})`);

    // في حال اكتمال فرز جميع السلوكيات، عرض التقرير النهائي تلقائياً بعد ثانية ونصف
    if (Object.keys(discoveries).length === items.length) {
      setTimeout(() => {
        openNotebook();
        $('#notebook').showModal();
        const rep = generateSafetyReport({
          totalItems: items.length,
          attempts: state.attempts,
          elapsedSeconds: Math.round((Date.now() - state.startTime) / 1000)
        });
        say('final-complete', `مبارك يا بطل السلامة! لقد أتممت تقييم وفرز جميع السلوكيات وحصلت على رتبة ${rep.rank}. تفضل بقراءة تقييمك النهائي.`, true, true);
      }, 1400);
    }
  } else {
    voice.playSfx('wrong');
    scene?.shakeWrong();

    if (binEl) {
      binEl.classList.add('wrong-drop');
      setTimeout(() => binEl.classList.remove('wrong-drop'), 600);
    }

    say(`${itemId}-hint`, result.text, false);
  }
}

/**
 * نافذة التقرير النهائي التفاعلي لحارس الأمان وسجل السلوكيات
 */
function openNotebook() {
  const ids = Object.keys(discoveries);
  const content = $('#notebook-content');
  const elapsedSeconds = Math.max(1, Math.round((Date.now() - state.startTime) / 1000));

  const report = generateSafetyReport({
    totalItems: ids.length || items.length,
    attempts: Math.max(state.attempts, ids.length),
    elapsedSeconds
  });

  content.innerHTML = `
    <div class="captain-report-card">
      <div class="report-header">
        <div class="report-badge-icon">${report.accuracy >= 90 ? '🛡️🌟' : '🏅'}</div>
        <div>
          <h3>${report.rank}</h3>
          <p class="report-subtitle">${report.badgeTitle}</p>
        </div>
      </div>

      <div class="report-stats-grid">
        <div class="stat-box">
          <label>دقة التصنيف</label>
          <strong>${numbers.format(report.accuracy)}%</strong>
        </div>
        <div class="stat-box">
          <label>السلوكيات المصنفة</label>
          <strong>${numbers.format(ids.length)} / ${numbers.format(items.length)}</strong>
        </div>
        <div class="stat-box">
          <label>المحاولات</label>
          <strong>${numbers.format(report.attempts)}</strong>
        </div>
        <div class="stat-box">
          <label>الوقت المستغرق</label>
          <strong>${report.timeFormatted}</strong>
        </div>
      </div>

      <div class="report-speech-box">
        <div class="report-pro-header">
          ${captainAmanMascot}
          <strong>رسالة «حارس الأمان» لتقييم وعيك وسلامتك:</strong>
        </div>
        <p class="report-evaluation">${report.evaluation}</p>
        <p class="report-advice">💡 <strong>النصيحة الذهبية من كابتن أمان:</strong> ${report.advice}</p>
      </div>

      <div class="report-date"><small>تاريخ التقييم: ${report.date}</small></div>
    </div>

    <h4 style="margin:20px 0 10px;font-size:15px;color:var(--green)">السلوكيات التي صنفتها في الجدول (${numbers.format(ids.length)}):</h4>
    ${ids.length ? `
      <div class="notebook-grid">
        ${ids.map(id => {
          const item = byId(id);
          const cat = categories[discoveries[id]];
          const isSafe = cat.id === 'safe';
          return `
            <div class="notebook-item">
              <div class="notebook-item-icon">
                <img src="assets/thumbnails/safety/${item.id}.svg" alt="${item.name}" style="width:40px;height:40px;object-fit:contain">
              </div>
              <div>
                <strong>${item.name}</strong>
                <small>${isSafe ? '🛡️ سلوك آمن وصحيح' : '⚠️ سلوك خطر وخاطئ'} (${item.origin})</small>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="empty-notebook">
        ${captainAmanMascot}
        <h3>بانتظار تصنيف سلوكك الأول!</h3>
        <p class="dialog-description">اسحب سلوكاً إلى عمود السلوكيات الآمنة أو الخطرة لتسجيل إنجازك واستلام التقرير.</p>
        <button class="primary" data-close="notebook" style="margin:auto">أعود للفحص الآن</button>
      </div>
    `}
  `;
}

function openDialog(id) {
  if (id === 'notebook') {
    openNotebook();
    const count = Object.keys(discoveries).length;
    if (count === items.length) {
      say('report-done', 'مبارك يا بطل! هذا تقريرك النهائي الشامل ورتبتك المعتمدة في الأمان والسلامة الكهربائية.');
    } else {
      say('report-progress', `أهلاً بك في سجل الأمان! لقد صنفت حتى الآن ${numbers.format(count)} من أصل ${numbers.format(items.length)} سلوكيات.`);
    }
  }
  if (id === 'camera') say('camera', voiceLines.camera);
  if (id === 'library') say('library', 'هذه قائمة بجميع سلوكيات الأمان والسلامة في كتاب العلوم. اختر أي سلوك لمشاهدته وتصنيفه.');
  if (id === 'help') say('help', voiceLines.help);
  $('#' + id).showModal();
}

// ═══════════════════════════════════════════════════════════════════════════
// منطق السحب والإفلات (HTML5 Drag & Drop + Click/Touch Support)
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('dragstart', e => {
  const cardEl = e.target.closest('[data-item]');
  const pillEl = e.target.closest('#drag-pill');
  if (cardEl) {
    e.dataTransfer.setData('text/plain', cardEl.dataset.item);
    selectItem(cardEl.dataset.item);
  } else if (pillEl) {
    e.dataTransfer.setData('text/plain', state.id);
  }
});

// استقبال الإفلات على الحاويات (أعمدة الجدول الثنائي: آمن وخطر)
$$('[data-bin]').forEach(bin => {
  bin.addEventListener('dragover', e => {
    if (state.mode === 'play') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      bin.classList.add('drag-over');
    }
  });

  bin.addEventListener('dragleave', () => {
    bin.classList.remove('drag-over');
  });

  bin.addEventListener('drop', e => {
    e.preventDefault();
    bin.classList.remove('drag-over');
    const droppedItemId = e.dataTransfer.getData('text/plain') || state.id;
    handleClassification(droppedItemId, bin.dataset.bin);
  });

  // دعم النقر المباشر (Touch / Click to sort) ممتاز للأجهزة اللوحية والمحمولة
  bin.addEventListener('click', () => {
    if (state.mode === 'play') {
      handleClassification(state.id, bin.dataset.bin);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// إدارة الأحداث والنقرات العامة
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('click', e => {
  const toggleBtn = e.target.closest('#activity-toggle-btn');
  const dropdown = $('#activity-dropdown');
  if (toggleBtn) {
    const isHidden = dropdown.hidden;
    dropdown.hidden = !isHidden;
    toggleBtn.setAttribute('aria-expanded', isHidden);
    return;
  }
  if (dropdown && !dropdown.hidden && !e.target.closest('.activity-toggle-wrap')) {
    dropdown.hidden = true;
    $('#activity-toggle-btn')?.setAttribute('aria-expanded', 'false');
  }

  const b = e.target.closest('button');
  if (!b) return;

  if (b.dataset.item) {
    selectItem(b.dataset.item);
    if ($('#library').open) $('#library').close();
  }
  if (b.dataset.mode) setMode(b.dataset.mode);
  if (b.dataset.open) openDialog(b.dataset.open);
  if (b.dataset.close) $('#' + b.dataset.close).close();

  if (b.dataset.question) {
    const a = answer(b.dataset.question, byId(state.id));
    say(a.key, a.text);
  }

  if (b.dataset.action === 'reset-view') {
    scene?.resetView();
    voice.playSfx('pop');
    toast('تمت إعادة زاوية العرض.');
  }
  if (b.dataset.action === 'zoom-in') {
    scene?.zoom(0.85);
    voice.playSfx('pop');
  }
  if (b.dataset.action === 'zoom-out') {
    scene?.zoom(1.15);
    voice.playSfx('pop');
  }
  if (b.dataset.action === 'fact') {
    const it = byId(state.id);
    say(state.id + '-fact', `${it.name}: ${it.fact} ${it.goldenRule}`, false, true);
  }
});

$('#listen').onclick = () => {
  if (soundState === 'playing') voice.stop();
  else voice.say(guideKey, guideText, true);
};

$('#sound-toggle').onclick = () => {
  voice.enabled = !voice.enabled;
  $('#sound-toggle').classList.toggle('on', voice.enabled);
  $('#sound-toggle').setAttribute('aria-pressed', voice.enabled);
  $('#sound-toggle').setAttribute('aria-label', voice.enabled ? 'إيقاف الصوت' : 'تشغيل الصوت');
  $('#sound-toggle').innerHTML = icon(voice.enabled ? 'sound' : 'mute') + `<span>${voice.enabled ? 'الصوت يعمل' : 'تشغيل الصوت'}</span>`;
  if (voice.enabled) voice.say(guideKey, guideText);
  else voice.stop();
};

// ═══════════════════════════════════════════════════════════════════════════
// تحويل الصوت إلى نص وسؤال كابتن أمان (Web Speech API)
// ═══════════════════════════════════════════════════════════════════════════

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let speechRec = null;
let isRecording = false;

function stopRecording() {
  isRecording = false;
  if (speechRec) { try { speechRec.stop(); } catch { } }
  const micBtn = $('#mic-btn');
  if (micBtn) {
    micBtn.classList.remove('recording');
    micBtn.setAttribute('title', 'تحدث بالصوت');
    micBtn.innerHTML = icon('mic');
  }
  const input = $('#ask-input');
  if (input) input.placeholder = 'اسأل كابتن أمان عن الصعق، البلل، الأسلاك، المقابس…';
}

function startRecording() {
  if (!SpeechRecognition) {
    toast('ميزة التعرف الصوتي غير مدعومة في هذا المتصفح.');
    return;
  }
  if (isRecording) {
    stopRecording();
    return;
  }

  try {
    if (!speechRec) {
      speechRec = new SpeechRecognition();
      speechRec.lang = 'ar-SA';
      speechRec.interimResults = true;
      speechRec.continuous = true;

      speechRec.onstart = () => {
        isRecording = true;
        const micBtn = $('#mic-btn');
        if (micBtn) {
          micBtn.classList.add('recording');
          micBtn.setAttribute('title', 'إيقاف التسجيل');
          micBtn.innerHTML = icon('stop');
        }
        const input = $('#ask-input');
        if (input) input.placeholder = 'جاري الاستماع... تفضل بسؤالك لحارس الأمان 🎙️';
      };

      speechRec.onresult = event => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        const input = $('#ask-input');
        if (input) input.value = text;
      };

      speechRec.onerror = () => stopRecording();
      speechRec.onend = () => stopRecording();
    }
    speechRec.start();
  } catch {
    stopRecording();
  }
}

const micBtn = $('#mic-btn');
if (micBtn) micBtn.onclick = e => { e.preventDefault(); isRecording ? stopRecording() : startRecording(); };

const clearBtn = $('#clear-btn');
if (clearBtn) clearBtn.onclick = e => { e.preventDefault(); const inp = $('#ask-input'); if (inp) { inp.value = ''; inp.focus(); } };

$('#ask-form').onsubmit = e => {
  e.preventDefault();
  if (isRecording) stopRecording();
  const input = $('#ask-input');
  if (!input.value.trim()) return;
  const a = answer(input.value, byId(state.id));
  say(a.key, a.text);
  input.value = '';
};

// ═══════════════════════════════════════════════════════════════════════════
// الكاميرا والتعرف البصري (OpenCV.js)
// ═══════════════════════════════════════════════════════════════════════════

let stream = null;
let photoURL = null;
let photoRevision = 0;

function stopCamera() {
  stream?.getTracks().forEach(t => t.stop());
  stream = null;
  $('#camera-video').srcObject = null;
  $('#camera-video').hidden = true;
  $('#capture').hidden = true;
  $('#start-camera').hidden = false;
}

$('#camera').addEventListener('close', () => {
  stopCamera();
  photoRevision++;
  if (photoURL) URL.revokeObjectURL(photoURL);
  photoURL = null;
  $('#photo-preview').hidden = true;
  $('#camera-result').hidden = true;
  $('#camera-status').textContent = '';
  $('#photo-file').value = '';
});

$('#start-camera').onclick = async () => {
  const rev = ++photoRevision;
  $('#camera-status').textContent = 'نفتح الكاميرا…';
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
    const nextStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });
    if (rev !== photoRevision || !$('#camera').open) {
      nextStream.getTracks().forEach(t => t.stop());
      return;
    }
    stopCamera();
    stream = nextStream;
    $('#camera-video').srcObject = stream;
    $('#camera-video').hidden = false;
    $('#capture').hidden = false;
    $('#start-camera').hidden = true;
    $('#camera-status').textContent = 'وجّه الكاميرا نحو صورة السلوك في كتاب العلوم، ثم اضغط التقط الصورة.';
  } catch {
    if (rev !== photoRevision) return;
    $('#camera-status').textContent = 'تعذّر فتح الكاميرا. يمكنك اختيار صورة محفوظة من جهازك أو اختيار السلوك من القائمة.';
  }
};

$('#capture').onclick = () => {
  const video = $('#camera-video');
  if (!video.videoWidth) return;
  voice.playSfx('camera');
  const c = document.createElement('canvas');
  c.width = video.videoWidth;
  c.height = video.videoHeight;
  c.getContext('2d').drawImage(video, 0, 0);
  stopCamera();
  processPhoto(c.toDataURL('image/jpeg', 0.92));
};

$('#photo-file').onchange = () => {
  const file = $('#photo-file').files[0];
  if (!file) return;
  stopCamera();
  if (photoURL) URL.revokeObjectURL(photoURL);
  photoURL = URL.createObjectURL(file);
  processPhoto(photoURL);
};

async function processPhoto(url) {
  const rev = ++photoRevision;
  $('#photo-preview').src = url;
  $('#photo-preview').hidden = false;
  $('#camera-result').hidden = true;
  $('#confirmed-item').value = '';
  $('#camera-status').textContent = '«حارس الأمان» يفحص الصورة ويطابقها مع كتاب العلوم…';

  try {
    await $('#photo-preview').decode();
    const { recognize } = await import('./recognition.js');
    const result = await recognize(url);
    if (rev !== photoRevision || !$('#camera').open) return;

    $('#camera-status').textContent = '';
    if (result) {
      $('#recognition-text').textContent = `رائع! يتعرف «حارس الأمان» على الصورة: إنها ${byId(result.id).name}. يمكنك تأكيدها أو تغييرها:`;
      $('#confirmed-item').value = result.id;
    } else {
      $('#recognition-text').textContent = 'لم يتأكد حارس الأمان من المطابقة تماماً. اختر اسم السلوك من القائمة لنفحصه معاً:';
    }
  } catch {
    if (rev !== photoRevision || !$('#camera').open) return;
    $('#camera-status').textContent = '';
    $('#recognition-text').textContent = 'تم تجهيز الصورة. اختر اسم السلوك لفتحه على طاولة الفحص:';
  }

  if (rev === photoRevision) $('#camera-result').hidden = false;
}

$('#confirm-photo').onclick = async () => {
  const id = $('#confirmed-item').value;
  if (!id) {
    toast('اختر اسم السلوك أولاً.');
    $('#confirmed-item').focus();
    return;
  }
  $('#camera').close();
  await selectItem(id);
  const it = byId(id);
  say('camera-confirmed', `رائع! فتحنا موقف: (${it.name}). هل تعتقد أنه سلوك آمن يحمينا، أم خطر يسبب الصعق؟`);
  const stage = $('#stage');
  stage.scrollIntoView({ block: 'center', behavior: 'smooth' });
};

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    voice.stop();
    stopCamera();
  }
});

// تهيئة العرض المبدئي
render();
say('welcome');

// تهيئة مشهد Three.js
try {
  const { SafetyScene } = await import('./scene.js');
  scene = new SafetyScene($('#scene'), {
    error: msg => toast(msg)
  });
} catch (err) {
  console.warn('3D not loaded', err);
  $('#model-status').textContent = 'المجسم الثلاثي الأبعاد غير مدعوم في هذا المتصفح. يمكنك إتمام التصنيف عبر البطاقات والأزرار.';
}

await selectItem(state.id, true);

// نافذة الفحص العامة للمتصفح
window.safetyLab = {
  state,
  get scene() { return scene; },
  selectItem,
  setMode,
  handleClassification,
  get discoveries() { return discoveries; },
  generateSafetyReport
};
