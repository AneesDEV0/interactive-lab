// ═══════════════════════════════════════════════════════════════════════════
// src/conductors/app.js — المنطق التفاعلي لمحطة تصنيف المواد الموصلة والعازلة
// للصف الرابع الأساسي · مع المساعد التعليمي «البروفيسور»
// ═══════════════════════════════════════════════════════════════════════════

import { items, byId, categories, testClassification, answer, voiceLines, generateProfessorReport } from './data.js';
import { icon, professorMascot } from './icons.js';
import { ProfessorVoice } from './audio.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const numbers = new Intl.NumberFormat('ar-u-nu-arab');
const params = new URLSearchParams(location.search);

// حالة النشاط
const state = {
  id: byId(params.get('item'))?.id || 'ironNail',
  mode: params.get('mode') === 'learn' ? 'learn' : 'play',
  activeCategory: null,
  attempts: 0,
  startTime: Date.now()
};

// استرجاع التقدم المحفوظ من LocalStorage
let discoveries = {};
try {
  const saved = JSON.parse(localStorage.getItem('professor-conductors-discoveries-v1') || '{}');
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
  <span class="brand-symbol">${icon('bolt')}</span>
  <span>
    <strong>محطة فحص المواد</strong>
    <small>مع رفيقك «البروفيسور»</small>
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
      <img src="assets/thumbnails/conductors/${d.id}.svg" alt="${d.name}" class="device-card-thumb" loading="lazy">
      <span>${d.name}</span>
      <small>${d.material}</small>
    </button>
  `;
};

// حاوية تصنيف ثلاثية الأبعاد (عمود الجدول الثنائي)
const binCard = cat => {
  const sortedCount = Object.keys(discoveries).filter(id => discoveries[id] === cat.id).length;
  return `
    <div class="bin-card" data-bin="${cat.id}" role="button" tabindex="0" aria-label="${cat.title}">
      <span class="bin-counter" id="counter-${cat.id}">${numbers.format(sortedCount)}</span>
      <div class="bin-3d-visual">
        <img src="assets/bins/${cat.id}.svg" alt="${cat.title}" class="bin-3d-img" loading="lazy">
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

// بناء واجهة المستخدم الكاملة المتوافقة مع 100vh ومعمارية النشاط 2
$('#app').innerHTML = `
<div class="shell">
  <!-- الشريط الجانبي الأنيق -->
  <aside class="sidebar" aria-label="التنقل الرئيسي">
    <a href="conductors.html" class="brand">${brand}</a>
    
    <nav class="nav-stack">
      <p class="nav-label">محطة فحص وتصنيف المواد</p>
      <button class="nav-item active" data-action="home">${icon('box')}طاولة الاستكشاف<span class="small-dot"></span></button>
      <button class="nav-item" data-open="library">${icon('cube')}كل مواد كتابي (${numbers.format(items.length)})</button>
      <button class="nav-item" data-open="notebook">${icon('book')}دفتر التصنيف والتقرير</button>
    </nav>

    <nav class="nav-stack">
      <p class="nav-label">مساعدة وكاميرا</p>
      <button class="nav-item" data-open="camera">${icon('camera')}صوّر من كتابك</button>
      <button class="nav-item" data-open="help">${icon('help')}كيف أصنف المواد؟</button>
    </nav>

    <div class="side-mascot">
      ${professorMascot}
      <h3>مع «البروفيسور» نتعلّم!</h3>
      <p>افحص موصلية المادة وضعها في مكانها الصحيح في الجدول.</p>
    </div>
    <p class="side-footer">صُنع لمستكشفي الصف الرابع ${icon('heart')}</p>
  </aside>

  <!-- المنطقة الرئيسية -->
  <div class="body-area">
    <header class="topbar">
      <div class="breadcrumb">
        <a href="/" style="color:var(--muted);transition:color .2s" title="العودة لبوابة المنصة الرئيسية">المنصة الرئيسية</a> ${icon('chevron')} العلوم ${icon('chevron')} <strong>نشاط ٤: تصنيف المواد الموصلة والعازلة</strong>
      </div>
      <a href="conductors.html" class="brand mobile-brand" aria-label="العودة إلى محطة تصنيف المواد">${brand}</a>
      
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
            <a href="safety.html" class="dropdown-item">
              <span class="dropdown-icon">🛡️</span>
              <div><strong>نشاط ٣: حارس الأمان والسلامة</strong><small>محطة الوقاية مع «كابتن أمان»</small></div>
            </a>
            <a href="conductors.html" class="dropdown-item active">
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
          <span>عالم صغير<small>الصف الرابع الأساسي</small></span>
        </div>
        <button class="sound-button" data-open="help" aria-label="تعليمات النشاط">${icon('help')}</button>
      </div>
    </header>

    <main id="main" class="main">
      <!-- مقدمة النشاط -->
      <section class="intro">
        <div class="intro-copy">
          <div class="eyebrow">${icon('sparkles')} الصف الرابع الأساسي · دارة فحص المواد والمصباح</div>
          <h1>محطة تصنيف <span>المواد الموصلة والعازلة</span></h1>
          <p>اسحب المادة إلى عمود الموصلات أو العوازل، أو صوّرها من كتابك واستكشف أسرار سريان التيار مع «البروفيسور».</p>
        </div>
        <button class="progress-chip" data-open="notebook">
          ${icon('trophy')}
          <span>
            <strong>إنجازاتي في التصنيف</strong>
            <small id="progress-text"></small>
            <span class="progress-track"><i id="progress-bar"></i></span>
          </span>
        </button>
      </section>

      <!-- رف اختيار العناصر -->
      <section class="device-section" aria-labelledby="choose-title">
        <div class="section-heading">
          <h2 id="choose-title"><span class="step-number">١</span> اختر مادة من كتابك <small>أو اسحبها مباشرة</small></h2>
          <button class="text-button" data-open="library">كل المواد <span>(${numbers.format(items.length)})</span> ${icon('arrow')}</button>
        </div>
        <div class="devices-row" id="device-shelf">
          ${items.slice(0, 6).map(card).join('')}
          <button class="camera-card" data-open="camera">
            ${icon('camera')}
            <strong>صوّر من كتابك</strong>
            <small>ليظهر المجسم فوراً!</small>
          </button>
        </div>
      </section>

      <!-- طاولة التجربة وعمود البروفيسور -->
      <div class="experiment">
        <section class="lab-card" aria-label="طاولة الاستكشاف والفحص">
          <div class="lab-top">
            <div>
              <h2><span class="step-number">٢</span> طاولة الفحص والاستكشاف</h2>
              <small>شاهد تفاصيل المجسم من كل الزوايا ٣٦٠ درجة</small>
            </div>
            <div class="mode-switch" role="group" aria-label="نوع النشاط">
              <button data-mode="learn">${icon('book')}تعرّف</button>
              <button data-mode="play" class="active">${icon('play')}جرّب وصنّف</button>
            </div>
          </div>

          <!-- مسرح Three.js -->
          <div class="stage" id="stage">
            <div id="scene" class="scene-container"></div>
            <div class="stage-badge">${icon('cube')} مجسّم ثلاثي الأبعاد</div>
            <div class="stage-tools">
              <button class="icon-button" data-action="reset-view" aria-label="إعادة زاوية العرض" title="إعادة زاوية العرض">${icon('reset')}</button>
              <button class="icon-button" data-action="zoom-in" aria-label="تقريب" title="تقريب">+</button>
              <button class="icon-button" data-action="zoom-out" aria-label="إبعاد" title="إبعاد">−</button>
            </div>
            
            <div class="drag-prompt-pill" id="drag-pill" draggable="true" title="اسحب من هنا إلى الجدول">
              ${icon('hand')} اسحب العنصر إلى الحاوية
            </div>

            <p id="model-status" class="model-status" role="status">نجهّز مجسم المادة…</p>
            <h3 class="device-title" id="device-title"></h3>
            
            <div class="stage-caption">
              <span>${icon('hand')} اسحب لتدوير المجسم</span>
              <span id="device-state" class="state-pill">جاهز للفحص</span>
            </div>
          </div>

          <!-- لوحة وضع "جرّب وصنّف" (الجدول الثنائي: موصلات وعوازل) -->
          <div class="sorting-panel" id="play-panel">
            <h3 class="panel-heading">
              <span class="step-number">٣</span> اسحب إلى العمود المناسب لخامة هذا العنصر:
              <small>أو اضغط على الحاوية لتصنيفه فوراً</small>
            </h3>
            <div class="bins-grid" id="bins-grid">
              ${Object.values(categories).map(binCard).join('')}
            </div>
            <div id="sorting-feedback" class="sorting-feedback" hidden></div>
          </div>

          <!-- لوحة وضع "تعرّف" (بطاقة المادة التعليمية وشرح البروفيسور) -->
          <div class="learn-panel" id="learn-panel" hidden>
            <h3 class="panel-heading">${icon('info')} بطاقة المادة التعليمية والفحص العلمي</h3>
            <div class="learn-grid">
              <div class="learn-spec"><label>الخامة الأساسية</label><strong id="learn-material"></strong></div>
              <div class="learn-spec"><label>الموصلية الكهربائية والمصباح</label><strong id="learn-conduction"></strong></div>
              <div class="learn-spec"><label>توصيل الحرارة</label><strong id="learn-thermal"></strong></div>
              <div class="learn-spec"><label>قاعدة السلامة والأمان</label><strong id="learn-safety"></strong></div>
              <div class="learn-spec" style="grid-column:1/-1"><label>أهم الخصائص الفيزيائية</label><strong id="learn-properties"></strong></div>
            </div>
            <div class="fact-box">
              <strong style="display:block;margin-bottom:4px;color:var(--deep)">شرح البروفيسور العلمي:</strong>
              <p id="device-fact"></p>
            </div>
            <button class="primary" data-action="fact">${icon('sound')} استمع إلى شرح «البروفيسور»</button>
          </div>
        </section>

        <!-- عمود المساعد التعليمي: "البروفيسور" -->
        <aside class="guide-column" aria-label="المساعد التعليمي البروفيسور">
          <section class="guide-card">
            <div class="guide-mascot">
              ${professorMascot}
              <div>
                <h3>أهلاً، أنا «البروفيسور»!</h3>
                <p>مرشدك في فحص الموصلات والعوازل</p>
              </div>
            </div>

            <div class="guide-bubble" id="guide-bubble">
              <p id="guide-text" aria-live="polite"></p>
            </div>

            <button class="guide-listen" id="listen">${icon('sound')} استمع إلى البروفيسور</button>

            <div class="guide-suggestions">
              <button data-question="تلميح">${icon('help')} أعطني تلميحاً للتصنيف</button>
              <button data-question="مصباح">${icon('bulbOn')} هل يضيء المصباح عند وصله؟</button>
              <button data-question="سلامة">${icon('shield')} كيف أتعامل بأمان مع الكهرباء؟</button>
            </div>

            <form class="ask-form" id="ask-form">
              <input id="ask-input" maxlength="180" aria-label="اسأل البروفيسور" placeholder="اسأل البروفيسور عن التوصيل والعزل والمصباح…" autocomplete="off">
              <button type="button" id="mic-btn" class="speech-btn" aria-label="تحدث بالصوت" title="تحدث بالصوت">${icon('mic')}</button>
              <button type="button" id="clear-btn" class="clear-btn" aria-label="مسح النص" title="مسح النص">${icon('trash')}</button>
              <button type="submit" aria-label="إرسال السؤال">${icon('send')}</button>
            </form>

            <p class="guide-note">مساعد ذكي لطلاب الصف الرابع الأساسي</p>
            <p id="sound-status" class="sound-status" role="status"></p>
          </section>

          <div class="safety-card">
            ${icon('shield')}
            <div>
              <strong>قواعد الأمان الكهربائي مع البروفيسور</strong>
              <p>المعادن موصلة لذا تُعزل بالبلاستيك.<br>لا نلمس المقابس بأيدٍ مبللة، ونحذر خطورة الصعق الكهربائي.</p>
            </div>
          </div>
        </aside>
      </div>

      <!-- إنجازات الرحلة والتقرير النهائي -->
      <section class="journey">
        ${icon('star')}
        <div>
          <h3 id="journey-title">مهمة فحص المواد وتصنيفها بانتظارك!</h3>
          <p id="journey-text">كل مادة تصنفها بنجاح في الجدول تضيف نجمة ذهبية إلى إنجازاتك، وتفتح تقرير البروفيسور النهائي.</p>
        </div>
        <button data-open="notebook">تقرير التقييم النهائي ${icon('arrow')}</button>
      </section>

      <p class="footer">${icon('heart')} بالعلم والاستكشاف نرتقي، وبالتجربة نصنع المستقبل!</p>
    </main>
  </div>
</div>

<!-- النوافذ المنبثقة -->
<dialog id="library" aria-labelledby="library-title">
  ${dialogHead('library', 'مواد وخامات كتاب العلوم المدرسي')}
  <p class="dialog-description">اختر أي مادة لاستكشاف مجسمها ثلاثي الأبعاد بزاوية ٣٦٠ درجة وتصنيفها داخل الجدول الثنائي:</p>
  <div class="library-grid" id="library-grid">
    ${items.map(card).join('')}
  </div>
</dialog>

<dialog id="camera" aria-labelledby="camera-title">
  ${dialogHead('camera', 'التعرف البصري بالكاميرا الذكية')}
  <p class="dialog-description">وجّه الكاميرا نحو صورة المادة في كتاب العلوم، وسيتعرف عليها «البروفيسور» فوراً:</p>
  <video id="camera-video" class="camera-preview" autoplay playsinline muted hidden></video>
  <img id="photo-preview" class="camera-preview" alt="صورة المادة الملتقطة" hidden>
  
  <div class="camera-controls">
    <button class="primary" id="start-camera">${icon('camera')} افتح الكاميرا</button>
    <button class="primary" id="capture" hidden>التقط الصورة الآن</button>
    <label class="secondary file-label" for="photo-file">${icon('book')} أو اختر صورة محفوظة</label>
    <input class="visually-hidden" id="photo-file" type="file" accept="image/*" capture="environment">
  </div>
  
  <p id="camera-status" role="status"></p>
  
  <div class="camera-result" id="camera-result" hidden>
    <p id="recognition-text"></p>
    <label for="confirmed-item">تأكيد اسم المادة:</label>
    <select id="confirmed-item">
      <option value="">اختر المادة للتأكيد</option>
      ${items.map(d => `<option value="${d.id}">${d.name} (${d.material})</option>`).join('')}
    </select>
    <button class="primary" id="confirm-photo">افتح المادة على طاولة الفحص ${icon('arrow')}</button>
  </div>
</dialog>

<dialog id="notebook" aria-labelledby="notebook-title">
  ${dialogHead('notebook', 'تقرير التقييم النهائي ودفتر التصنيف')}
  <div id="notebook-content"></div>
</dialog>

<dialog id="help" aria-labelledby="help-title">
  ${dialogHead('help', 'كيف أفحص وأصنف المواد الموصلة والعازلة؟')}
  <div class="help-steps">
    <div class="help-step">
      <span class="step-number">١</span>
      <div>
        <h3>اختر المادة أو صوّرها</h3>
        <p>اختر مادة من كتابك من الرف العلوي، أو استخدم الكاميرا لمطابقة صورتها في كتاب العلوم.</p>
      </div>
    </div>
    <div class="help-step">
      <span class="step-number">٢</span>
      <div>
        <h3>تعرّف إلى خواص التوصيل والعزل</h3>
        <p>في وضع «تعرّف» دوّر المجسم ثلاثي الأبعاد، واستمع لشرح «البروفيسور» حول ما إذا كانت المادة تسمح بمرور الكهرباء وتضيء المصباح أم تعزلها وتحمينا.</p>
      </div>
    </div>
    <div class="help-step">
      <span class="step-number">٣</span>
      <div>
        <h3>اسحب وأفلت في الجدول الثنائي (Drag and Drop)</h3>
        <p>اسحب المادة إلى عمود "المواد الموصلة" أو "المواد العازلة". إذا أصبت ستضيء شعلة النجاح، وإن أخطأت سيرشدك البروفيسور بتلميح ذكي!</p>
      </div>
    </div>
  </div>
  <button class="primary" data-close="help" style="margin-top:18px;width:100%">فهمت، لنبدأ الفحص والتصنيف! ${icon('arrow')}</button>
</dialog>

<div id="toast" class="toast" role="status" hidden></div>
`;

// تهيئة نظام الصوت لشخصية "البروفيسور"
const voice = new ProfessorVoice(status => {
  soundState = status;
  $('#listen').innerHTML = icon(status === 'playing' ? 'stop' : 'sound') + (status === 'playing' ? ' إيقاف الصوت' : ' استمع إلى البروفيسور');
  $('#sound-status').textContent = status === 'unavailable' ? 'تعذّر تشغيل الصوت المباشر. يمكنك قراءة توجيه البروفيسور أعلاه.' : '';
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
    localStorage.setItem('professor-conductors-discoveries-v1', JSON.stringify(discoveries));
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
    ? 'جاهز للفحص والتصنيف' 
    : 'نتعرّف إلى المادة';
  $('#device-state').classList.toggle('sorted', isSorted);

  // إظهار وإخفاء اللوحات
  $('#play-panel').hidden = !isPlay;
  $('#learn-panel').hidden = isPlay;
  $('#drag-pill').hidden = !isPlay;

  if (!isPlay) {
    $('#learn-material').textContent = item.material;
    $('#learn-conduction').textContent = item.category === 'conductive' ? 'موصل ممتاز (يضيء المصباح ⚡💡)' : 'عازل تام (لا يضيء المصباح 🛡️🔒)';
    $('#learn-thermal').textContent = item.thermalConductivity;
    $('#learn-safety').textContent = item.safetyTip;
    $('#learn-properties').textContent = item.properties;
    $('#device-fact').textContent = item.fact;
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
  $('#progress-text').textContent = `${numbers.format(sortedCount)} من ${numbers.format(total)} مواد`;
  $('#progress-bar').style.width = `${(sortedCount / total) * 100}%`;

  $('#journey-title').textContent = sortedCount === 0 
    ? 'مهمة فحص المواد وتصنيفها بانتظارك!' 
    : sortedCount === total 
    ? 'مبارك! أتممت تصنيف جميع المواد بنجاح باهر!' 
    : `رائع! صنّفت ${numbers.format(sortedCount)} من مواد كتابك`;

  $('#journey-text').textContent = sortedCount === total
    ? 'اضغط هنا لعرض تقرير البروفيسور النهائي ووسام التميز لطلاب الصف الرابع!'
    : sortedCount > 0
    ? 'تابع تصنيف باقي المواد لتكتمل مجموعتك وتستلم وسام عبقري الدارات الكهربائية.'
    : 'كل مادة تصنفها بنجاح تضيف نجمة ذهبية إلى إنجازاتك وتفتح تقرير البروفيسور.';
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
        <small>ليظهر المجسم فوراً!</small>
      </button>
    `;
  }

  render();

  if (state.mode === 'learn') {
    say(id + '-fact', `${item.name}: مصنوع من ${item.material}. ${item.fact}`);
  } else if (initial) {
    say('welcome');
  } else {
    say(id + '-select', `اخترت ${item.name}. اسحب المجسم أو اضغط على العمود المناسب لخامته في الجدول.`);
  }

  const rev = ++modelRevision;
  if (scene) {
    $('#model-status').hidden = false;
    $('#model-status').textContent = 'نجهّز مجسم المادة…';
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
    say(state.id + '-fact', item.fact);
  } else {
    say('play', voiceLines.play);
  }
}

/**
 * تنفيذ فحص وتصنيف العنصر داخل الحاوية المستهدفة
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
    voice.playSfx('correct');
    discoveries[itemId] = targetCategoryId;
    saveDiscoveries();
    scene?.celebrateSuccess();

    if (binEl) {
      binEl.classList.add('correct-drop');
      setTimeout(() => binEl.classList.remove('correct-drop'), 700);
    }

    render();
    say(`${itemId}-result`, result.text, true);
    toast(`أحسنت! صنّفت ${result.item.name} في ${result.target.name}`);

    // في حال اكتمال فرز جميع المواد، عرض التقرير النهائي تلقائياً بعد ثانية ونصف
    if (Object.keys(discoveries).length === items.length) {
      voice.playSfx('correct');
      say('celebrate-all', 'مبارك يا بطل! لقد أكملت تصنيف جميع المواد في جدول الموصلات والعوازل واستحققت وسام البروفيسور!', true);
      setTimeout(() => {
        openNotebook();
        $('#notebook').showModal();
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
 * نافذة التقرير النهائي التفاعلي للبروفيسور ودفتر التصنيفات
 */
function openNotebook() {
  const ids = Object.keys(discoveries);
  const content = $('#notebook-content');
  const elapsedSeconds = Math.max(1, Math.round((Date.now() - state.startTime) / 1000));
  const isComplete = ids.length === items.length;

  const report = generateProfessorReport({
    totalItems: ids.length || items.length,
    attempts: Math.max(state.attempts, ids.length),
    elapsedSeconds
  });

  content.innerHTML = `
    <div class="professor-report-card">
      <div class="report-header">
        <div class="report-badge-icon">${report.accuracy >= 90 ? '🌟' : '🏅'}</div>
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
          <label>المواد المصنفة</label>
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
          ${professorMascot}
          <strong>رسالة «البروفيسور» لتقييم استيعابك:</strong>
        </div>
        <p class="report-evaluation">${report.evaluation}</p>
        <p class="report-advice">💡 <strong>نصيحة البروفيسور الذهبية:</strong> ${report.advice}</p>
      </div>

      <div class="report-date"><small>تاريخ التقييم: ${report.date}</small></div>
    </div>

    <h4 style="margin:20px 0 10px;font-size:15px;color:var(--deep)">المواد التي صنفتها في الجدول (${numbers.format(ids.length)}):</h4>
    ${ids.length ? `
      <div class="notebook-grid">
        ${ids.map(id => {
          const item = byId(id);
          const cat = categories[discoveries[id]];
          const isCond = cat.id === 'conductive';
          return `
            <div class="notebook-item">
              <div class="notebook-item-icon">
                <img src="assets/thumbnails/conductors/${item.id}.svg" alt="${item.name}" style="width:40px;height:40px;object-fit:contain">
              </div>
              <div>
                <strong>${item.name}</strong>
                <small>${isCond ? '⚡ تضيء المصباح' : '🛡️ مادة عازلة'} (${item.material})</small>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="empty-notebook">
        ${professorMascot}
        <h3>بانتظار تصنيف مادتك الأولى!</h3>
        <p class="dialog-description">اسحب مادة إلى عمود الموصلات أو العوازل لتسجيل إنجازك واستلام التقرير.</p>
        <button class="primary" data-close="notebook" style="margin:auto">أعود للفحص الآن</button>
      </div>
    `}
  `;
}

function openDialog(id) {
  if (id === 'notebook') {
    openNotebook();
    say('notebook', 'هذا تقريرك النهائي التفاعلي ودفتر تصنيف المواد الموصلة والعازلة!');
  }
  if (id === 'camera') say('camera');
  if (id === 'library') say('library', 'تفضل باستعراض كافة المواد في كتاب العلوم للصف الرابع!');
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

// استقبال الإفلات على الحاويات (أعمدة الجدول الثنائي)
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

  if (b.dataset.action === 'reset-view') { voice.playSfx('pop'); scene?.resetView(); }
  if (b.dataset.action === 'zoom-in') { voice.playSfx('pop'); scene?.zoom(0.85); }
  if (b.dataset.action === 'zoom-out') { voice.playSfx('pop'); scene?.zoom(1.15); }
  if (b.dataset.action === 'fact') say(state.id + '-fact', byId(state.id).fact, false, true);
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
// تحويل الصوت إلى نص وسؤال البروفيسور (Web Speech API)
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
  if (input) input.placeholder = 'اسأل البروفيسور عن التوصيل والعزل والمصباح…';
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
        if (input) input.placeholder = 'جاري الاستماع... تفضل بسؤالك للبروفيسور 🎙️';
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
    $('#camera-status').textContent = 'وجّه الكاميرا نحو صورة المادة في كتاب العلوم، ثم اضغط التقط الصورة.';
  } catch {
    if (rev !== photoRevision) return;
    $('#camera-status').textContent = 'تعذّر فتح الكاميرا. يمكنك اختيار صورة محفوظة من جهازك أو اختيار المادة من القائمة.';
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
  $('#camera-status').textContent = '«البروفيسور» يفحص الصورة ويطابقها مع كتاب العلوم…';

  try {
    await $('#photo-preview').decode();
    const { recognize } = await import('./recognition.js');
    const result = await recognize(url);
    if (rev !== photoRevision || !$('#camera').open) return;

    $('#camera-status').textContent = '';
    if (result) {
      $('#recognition-text').textContent = `رائع! يتعرف «البروفيسور» على الصورة: إنها ${byId(result.id).name}. يمكنك تأكيدها أو تغييرها:`;
      $('#confirmed-item').value = result.id;
    } else {
      $('#recognition-text').textContent = 'لم يتأكد البروفيسور من المطابقة تماماً. اختر اسم المادة من القائمة لنفحصها معاً:';
    }
  } catch {
    if (rev !== photoRevision || !$('#camera').open) return;
    $('#camera-status').textContent = '';
    $('#recognition-text').textContent = 'تم تجهيز الصورة. اختر اسم المادة لفتحها على طاولة الفحص:';
  }

  if (rev === photoRevision) $('#camera-result').hidden = false;
}

$('#confirm-photo').onclick = async () => {
  const id = $('#confirmed-item').value;
  if (!id) {
    toast('اختر اسم المادة أولاً.');
    $('#confirmed-item').focus();
    return;
  }
  $('#camera').close();
  await selectItem(id);
  say(id + '-select', `رائع! تعرفنا على ${byId(id).name}. لنكتشف الآن هل يوصل الكهرباء أم يعزلها!`);
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
  const { ConductorsScene } = await import('./scene.js');
  scene = new ConductorsScene($('#scene'), {
    error: msg => toast(msg)
  });
} catch (err) {
  console.warn('3D not loaded', err);
  $('#model-status').textContent = 'المجسم الثلاثي الأبعاد غير مدعوم في هذا المتصفح. يمكنك إتمام التصنيف عبر البطاقات والأزرار.';
}

await selectItem(state.id, true);

// نافذة الفحص العامة للمتصفح
window.conductorsLab = {
  state,
  get scene() { return scene; },
  selectItem,
  setMode,
  handleClassification,
  get discoveries() { return discoveries; },
  generateProfessorReport
};
