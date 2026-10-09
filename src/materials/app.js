// ═══════════════════════════════════════════════════════════════════════════
// src/materials/app.js — المنطق التفاعلي لمحطة فرز وتصنيف خامات البيئة
// ═══════════════════════════════════════════════════════════════════════════

import { items, byId, categories, testClassification, answer, voiceLines } from './data.js';
import { icon, expertMascot } from './icons.js';
import { KhabeerVoice } from './audio.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const numbers = new Intl.NumberFormat('ar-u-nu-arab');
const params = new URLSearchParams(location.search);

// حالة النشاط
const state = {
  id: byId(params.get('item'))?.id || 'plasticRuler',
  mode: params.get('mode') === 'learn' ? 'learn' : 'play',
  activeCategory: null
};

// استرجاع التقدم المحفوظ من LocalStorage
let discoveries = {};
try {
  const saved = JSON.parse(localStorage.getItem('khabeer-materials-discoveries-v1') || '{}');
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
  <span class="brand-symbol">${icon('box')}</span>
  <span>
    <strong>محطة فرز الخامات</strong>
    <small>مع رفيقك «الخبير»</small>
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
      <img src="assets/thumbnails/materials/${d.id}.svg" alt="${d.name}" class="device-card-thumb" loading="lazy">
      <span>${d.name}</span>
      <small>${d.material}</small>
    </button>
  `;
};

// حاوية تصنيف ثلاثية الأبعاد (صندوق فرز)
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

// بناء واجهة المستخدم الكاملة المتوافقة مع 100vh
$('#app').innerHTML = `
<div class="shell">
  <!-- الشريط الجانبي الأنيق غير المزدحم -->
  <aside class="sidebar" aria-label="التنقل الرئيسي">
    <a href="materials.html" class="brand">${brand}</a>
    
    <nav class="nav-stack">
      <p class="nav-label">محطة فرز الخامات</p>
      <button class="nav-item active" data-action="home">${icon('box')}طاولة الاستكشاف<span class="small-dot"></span></button>
      <button class="nav-item" data-open="library">${icon('cube')}كل خامات كتابي</button>
      <button class="nav-item" data-open="notebook">${icon('book')}دفتر تصنيفاتي</button>
    </nav>

    <nav class="nav-stack">
      <p class="nav-label">مساعدة وكاميرا</p>
      <button class="nav-item" data-open="camera">${icon('camera')}صوّر من كتابك</button>
      <button class="nav-item" data-open="help">${icon('help')}كيف أفرز المواد؟</button>
    </nav>

    <div class="side-mascot">
      ${expertMascot}
      <h3>مع «الخبير» نتعلّم!</h3>
      <p>فكر في خواص المادة وضعها في مكانها الصحيح.</p>
    </div>
    <p class="side-footer">صُنع لمستكشفي الصف الرابع ${icon('heart')}</p>
  </aside>

  <!-- المنطقة الرئيسية -->
  <div class="body-area">
    <header class="topbar">
      <div class="breadcrumb">
        <a href="/" style="color:var(--muted);transition:color .2s" title="العودة لبوابة المنصة الرئيسية">المنصة الرئيسية</a> ${icon('chevron')} العلوم ${icon('chevron')} <strong>نشاط ٢: فرز وتصنيف خامات البيئة</strong>
      </div>
      <a href="materials.html" class="brand mobile-brand" aria-label="العودة إلى محطة فرز الخامات">${brand}</a>
      
      <div class="top-actions">
        <!-- زر التبديل بين الأنشطة (توقل الأنشطة) لمنع ازدحام الشاشات -->
        <div class="activity-toggle-wrap">
          <button id="activity-toggle-btn" class="activity-toggle-btn" aria-label="الأنشطة" aria-expanded="false" title="عرض الأنشطة">
            ${icon('box')}<span>الأنشطة</span><i class="toggle-arrow">▾</i>
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
            <a href="materials.html" class="dropdown-item active">
              <span class="dropdown-icon">📦</span>
              <div><strong>نشاط ٢: فرز خامات البيئة</strong><small>محطة التصنيف مع «الخبير»</small></div>
            </a>
            <div class="dropdown-divider"></div>
            <a href="conductors.html" class="dropdown-item">
              <span class="dropdown-icon">💡</span>
              <div><strong>نشاط ٤: الموصلات والعوازل</strong><small>محطة الفحص مع «البروفيسور»</small></div>
            </a>
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
          <div class="eyebrow">${icon('sparkles')} الصف الرابع الأساسي · خامات البيئة</div>
          <h1>محطة فرز <span>وتصنيف المواد</span></h1>
          <p>اسحب العنصر إلى الحاوية المناسبة، أو صوّره من كتابك واستكشف أسرار خاماته مع «الخبير».</p>
        </div>
        <button class="progress-chip" data-open="notebook">
          ${icon('trophy')}
          <span>
            <strong>إنجازاتي في الفرز</strong>
            <small id="progress-text"></small>
            <span class="progress-track"><i id="progress-bar"></i></span>
          </span>
        </button>
      </section>

      <!-- رف اختيار العناصر -->
      <section class="device-section" aria-labelledby="choose-title">
        <div class="section-heading">
          <h2 id="choose-title"><span class="step-number">١</span> اختر خامة من كتابك <small>أو اسحبها مباشرة</small></h2>
          <button class="text-button" data-open="library">كل الخامات <span>(${numbers.format(items.length)})</span> ${icon('arrow')}</button>
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

      <!-- طاولة التجربة وعمود الخبير -->
      <div class="experiment">
        <section class="lab-card" aria-label="طاولة الاستكشاف">
          <div class="lab-top">
            <div>
              <h2><span class="step-number">٢</span> طاولة الفرز والاستكشاف</h2>
              <small>شاهد تفاصيل المجسم من كل الزوايا</small>
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
            
            <div class="drag-prompt-pill" id="drag-pill" draggable="true" title="اسحب من هنا إلى الصندوق">
              ${icon('hand')} اسحب العنصر إلى الحاوية
            </div>

            <p id="model-status" class="model-status" role="status">نجهّز مجسم المادة…</p>
            <h3 class="device-title" id="device-title"></h3>
            
            <div class="stage-caption">
              <span>${icon('hand')} اسحب لتدوير المجسم</span>
              <span id="device-state" class="state-pill">جاهز للفرز</span>
            </div>
          </div>

          <!-- لوحة وضع "جرّب وصنّف" (حاويات الفرز والسحب والإفلات) -->
          <div class="sorting-panel" id="play-panel">
            <h3 class="panel-heading">
              <span class="step-number">٣</span> اسحب إلى الحاوية المناسبة لخامة هذا العنصر:
              <small>أو اضغط على الحاوية لتصنيفه فوراً</small>
            </h3>
            <div class="bins-grid" id="bins-grid">
              ${Object.values(categories).map(binCard).join('')}
            </div>
            <div id="sorting-feedback" class="sorting-feedback" hidden></div>
          </div>

          <!-- لوحة وضع "تعرّف" (معلومات تعليمية وشرح الخبير) -->
          <div class="learn-panel" id="learn-panel" hidden>
            <h3 class="panel-heading">${icon('info')} بطاقة المادة التعليمية</h3>
            <div class="learn-grid">
              <div class="learn-spec"><label>الخامة الأساسية</label><strong id="learn-material"></strong></div>
              <div class="learn-spec"><label>أصل الخامة</label><strong id="learn-origin"></strong></div>
              <div class="learn-spec" style="grid-column:1/-1"><label>أهم الخصائص</label><strong id="learn-properties"></strong></div>
            </div>
            <div class="fact-box">
              <strong style="display:block;margin-bottom:4px;color:var(--deep)">معلومة الخبير:</strong>
              <p id="device-fact"></p>
            </div>
            <button class="primary" data-action="fact">${icon('sound')} استمع إلى شرح «الخبير»</button>
          </div>
        </section>

        <!-- عمود المساعد التعليمي: "الخبير" -->
        <aside class="guide-column" aria-label="المساعد التعليمي الخبير">
          <section class="guide-card">
            <div class="guide-mascot">
              ${expertMascot}
              <div>
                <h3>أهلاً، أنا «الخبير»!</h3>
                <p>مرشدك في فرز خامات البيئة</p>
              </div>
            </div>

            <div class="guide-bubble" id="guide-bubble">
              <p id="guide-text" aria-live="polite"></p>
            </div>

            <button class="guide-listen" id="listen">${icon('sound')} استمع إلى الخبير</button>

            <div class="guide-suggestions">
              <button data-question="تلميح">${icon('help')} أعطني تلميحاً للفرز</button>
              <button data-question="مما يصنع">${icon('info')} ما هي خامة هذا العنصر؟</button>
              <button data-question="مغناطيس">${icon('metal')} هل يجذبه المغناطيس؟</button>
            </div>

            <form class="ask-form" id="ask-form">
              <input id="ask-input" maxlength="180" aria-label="اسأل الخبير" placeholder="اسأل الخبير عن خصائص المادة…" autocomplete="off">
              <button type="button" id="mic-btn" class="speech-btn" aria-label="تحدث بالصوت" title="تحدث بالصوت">${icon('mic')}</button>
              <button type="button" id="clear-btn" class="clear-btn" aria-label="مسح النص" title="مسح النص">${icon('trash')}</button>
              <button type="submit" aria-label="إرسال السؤال">${icon('send')}</button>
            </form>

            <p class="guide-note">مساعد تفاعلي ذكي لطلاب الصف الرابع</p>
            <p id="sound-status" class="sound-status" role="status"></p>
          </section>

          <div class="safety-card">
            ${icon('shield')}
            <div>
              <strong>نحافظ على بيئتنا بأمان</strong>
              <p>نصنف النفايات لنعيد تدويرها.<br>ننتبه للزجاج ونغسل أيدينا بعد التجربة.</p>
            </div>
          </div>
        </aside>
      </div>

      <!-- إنجازات الرحلة -->
      <section class="journey">
        ${icon('star')}
        <div>
          <h3 id="journey-title">مهمة الفرز والتصنيف بانتظارك!</h3>
          <p id="journey-text">كل مادة تصنفها بنجاح تضيف نجمة ذهبية إلى إنجازاتك.</p>
        </div>
        <button data-open="notebook">دفتر تصنيفاتي ${icon('arrow')}</button>
      </section>

      <p class="footer">${icon('heart')} بالعلم والاستكشاف نرتقي، وبالتجربة نصنع المستقبل!</p>
    </main>
  </div>
</div>

<!-- النوافذ المنبثقة -->
<dialog id="library" aria-labelledby="library-title">
  ${dialogHead('library', 'خامات ومواد كتاب العلوم')}
  <p class="dialog-description">اختر أي مادة لاستكشاف مجسمها ثلاثي الأبعاد وفرزها داخل حاويتها الصحيحة:</p>
  <div class="library-grid" id="library-grid">
    ${items.map(card).join('')}
  </div>
</dialog>

<dialog id="camera" aria-labelledby="camera-title">
  ${dialogHead('camera', 'التعرف البصري بالكاميرا')}
  <p class="dialog-description">وجّه الكاميرا نحو صورة العنصر في كتاب العلوم للصف الرابع، وسيتعرف عليها «الخبير» فوراً:</p>
  <video id="camera-video" class="camera-preview" autoplay playsinline muted hidden></video>
  <img id="photo-preview" class="camera-preview" alt="صورة العنصر الملتقطة" hidden>
  
  <div class="camera-controls">
    <button class="primary" id="start-camera">${icon('camera')} افتح الكاميرا</button>
    <button class="primary" id="capture" hidden>التقط الصورة الآن</button>
    <label class="secondary file-label" for="photo-file">${icon('book')} أو اختر صورة محفوظة</label>
    <input class="visually-hidden" id="photo-file" type="file" accept="image/*" capture="environment">
  </div>
  
  <p id="camera-status" role="status"></p>
  
  <div class="camera-result" id="camera-result" hidden>
    <p id="recognition-text"></p>
    <label for="confirmed-item">تأكيد اسم العنصر:</label>
    <select id="confirmed-item">
      <option value="">اختر العنصر للتأكيد</option>
      ${items.map(d => `<option value="${d.id}">${d.name} (${d.material})</option>`).join('')}
    </select>
    <button class="primary" id="confirm-photo">افتح العنصر في المختبر ${icon('arrow')}</button>
  </div>
</dialog>

<dialog id="notebook" aria-labelledby="notebook-title">
  ${dialogHead('notebook', 'دفتر تصنيفاتي وإنجازاتي')}
  <div id="notebook-content"></div>
</dialog>

<dialog id="help" aria-labelledby="help-title">
  ${dialogHead('help', 'كيف ألعب وأصنف خامات البيئة؟')}
  <div class="help-steps">
    <div class="help-step">
      <span class="step-number">١</span>
      <div>
        <h3>اختر العنصر أو صوّره</h3>
        <p>اختر مادة من كتابك من الرف العلوي، أو استخدم الكاميرا لمطابقة صورتها.</p>
      </div>
    </div>
    <div class="help-step">
      <span class="step-number">٢</span>
      <div>
        <h3>تعرّف إلى خواص الخامة</h3>
        <p>في وضع «تعرّف» دوّر المجسم ثلاثي الأبعاد، واستمع إلى شرح «الخبير» حول نوع الخامة وخصائصها.</p>
      </div>
    </div>
    <div class="help-step">
      <span class="step-number">٣</span>
      <div>
        <h3>اسحب وأفلت في الحاوية (Drag and Drop)</h3>
        <p>اسحب العنصر إلى حاويته المناسبة (زجاج، بلاستيك، خشب، صوف، معادن..). إذا أصبت ستحصل على نجمة تشجيعية، وإن أخطأت سيعطيك الخبير تلميحاً!</p>
      </div>
    </div>
  </div>
  <button class="primary" data-close="help" style="margin-top:18px;width:100%">فهمت، لنبدأ الفرز! ${icon('arrow')}</button>
</dialog>

<div id="toast" class="toast" role="status" hidden></div>
`;

// تهيئة نظام الصوت لشخصية "الخبير"
const voice = new KhabeerVoice(status => {
  soundState = status;
  $('#listen').innerHTML = icon(status === 'playing' ? 'stop' : 'sound') + (status === 'playing' ? ' إيقاف الصوت' : ' استمع إلى الخبير');
  $('#sound-status').textContent = status === 'unavailable' ? 'تعذّر تشغيل الصوت المباشر. يمكنك قراءة توجيه الخبير أعلاه.' : '';
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
    localStorage.setItem('khabeer-materials-discoveries-v1', JSON.stringify(discoveries));
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
  $('#device-state').textContent = isSorted ? `مصنّف (${categories[discoveries[state.id]].name})` : isPlay ? 'جاهز للفرز' : 'نتعرّف إلى الخامة';
  $('#device-state').classList.toggle('sorted', isSorted);

  // إظهار وإخفاء اللوحات
  $('#play-panel').hidden = !isPlay;
  $('#learn-panel').hidden = isPlay;
  $('#drag-pill').hidden = !isPlay;

  if (!isPlay) {
    $('#learn-material').textContent = item.material;
    $('#learn-origin').textContent = item.origin;
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
  $('#progress-text').textContent = `${numbers.format(sortedCount)} من ${numbers.format(total)} خامات`;
  $('#progress-bar').style.width = `${(sortedCount / total) * 100}%`;

  $('#journey-title').textContent = sortedCount === 0 
    ? 'مهمة الفرز والتصنيف بانتظارك!' 
    : sortedCount === total 
    ? 'مبارك! أنت خبير خامات البيئة الأول!' 
    : `رائع! صنّفت ${numbers.format(sortedCount)} من خامات كتابك`;

  $('#journey-text').textContent = sortedCount 
    ? 'تابع فرز باقي المواد لتكتمل مجموعتك في دفتر التصنيفات.' 
    : 'كل مادة تصنفها بنجاح تضيف نجمة ذهبية إلى إنجازاتك.';
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
    say(id + '-select', `اخترت ${item.name}. اسحب المجسم أو اضغط على الحاوية المناسبة لخامته.`);
  }

  const rev = ++modelRevision;
  if (scene) {
    $('#model-status').hidden = false;
    $('#model-status').textContent = 'نجهّز مجسم الخامة…';
    try {
      await scene.setItem(item);
      if (rev === modelRevision) {
        $('#model-status').hidden = true;
      }
    } catch (err) {
      if (rev === modelRevision) {
        $('#model-status').textContent = 'تعذّر تجهيز المجسم. يمكنك مواصلة الفرز بالأزرار.';
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
    toast(`أحسنت! أضيفت ${result.item.name} إلى ${result.target.name}`);
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
 * دفتر التصنيفات والإنجازات
 */
function openNotebook() {
  const ids = Object.keys(discoveries);
  const content = $('#notebook-content');

  if (ids.length) {
    content.innerHTML = `
      <p class="dialog-description">هذه الخامات التي صنفتها بنجاح في مختبرك. إنجازاتك محفوظة دائماً:</p>
      <div class="notebook-grid">
        ${ids.map(id => {
          const item = byId(id);
          const cat = categories[discoveries[id]];
          return `
            <div class="notebook-item">
              <div class="notebook-item-icon">
                <img src="assets/thumbnails/materials/${item.id}.svg" alt="${item.name}" style="width:40px;height:40px;object-fit:contain">
              </div>
              <div>
                <strong>${item.name}</strong>
                <small>${icon('check')} في ${cat.name} (${item.material})</small>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    content.innerHTML = `
      <div class="empty-notebook">
        ${expertMascot}
        <h3>دفتر التصنيفات بانتظار أول إنجاز!</h3>
        <p class="dialog-description">اسحب عنصراً إلى حاويته المناسبة لتسجيل اكتشافك الأول هنا.</p>
        <button class="primary" data-close="notebook" style="margin:auto">أعود للفرز الآن</button>
      </div>
    `;
  }
}

function openDialog(id) {
  if (id === 'notebook') openNotebook();
  if (id === 'camera') say('camera');
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

// استقبال الإفلات على الحاويات
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

  // دعم النقر المباشر (Touch / Click to place) مناسب جداً للأجهزة اللوحية
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

  if (b.dataset.action === 'reset-view') scene?.resetView();
  if (b.dataset.action === 'zoom-in') scene?.zoom(0.85);
  if (b.dataset.action === 'zoom-out') scene?.zoom(1.15);
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
// تحويل الصوت إلى نص وسؤال الخبير (Web Speech API)
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
  if (input) input.placeholder = 'اسأل الخبير عن خصائص المادة…';
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
        if (input) input.placeholder = 'جاري الاستماع... تفضل بالسؤال 🎙️';
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
    $('#camera-status').textContent = 'وجّه الكاميرا نحو صورة الخامة في كتاب العلوم، ثم اضغط التقط الصورة.';
  } catch {
    if (rev !== photoRevision) return;
    $('#camera-status').textContent = 'تعذّر فتح الكاميرا. يمكنك اختيار صورة محفوظة من جهازك أو اختيار العنصر من القائمة.';
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
  $('#camera-status').textContent = 'الخبير يبحث عن الصورة في كتاب العلوم ويطابقها…';

  try {
    await $('#photo-preview').decode();
    const { recognize } = await import('./recognition.js');
    const result = await recognize(url);
    if (rev !== photoRevision || !$('#camera').open) return;

    $('#camera-status').textContent = '';
    if (result) {
      $('#recognition-text').textContent = `رائع! يتعرف «الخبير» على الصورة: إنها ${byId(result.id).name}. يمكنك تأكيدها أو تغييرها:`;
      $('#confirmed-item').value = result.id;
    } else {
      $('#recognition-text').textContent = 'لم يتأكد الخبير من المطابقة تماماً. اختر اسم العنصر من القائمة لنستكشفه معاً:';
    }
  } catch {
    if (rev !== photoRevision || !$('#camera').open) return;
    $('#camera-status').textContent = '';
    $('#recognition-text').textContent = 'تم تجهيز الصورة. اختر اسم العنصر لفتحه على طاولة الاستكشاف:';
  }

  if (rev === photoRevision) $('#camera-result').hidden = false;
}

$('#confirm-photo').onclick = async () => {
  const id = $('#confirmed-item').value;
  if (!id) {
    toast('اختر اسم العنصر أولاً.');
    $('#confirmed-item').focus();
    return;
  }
  $('#camera').close();
  await selectItem(id);
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
  const { MaterialsScene } = await import('./scene.js');
  scene = new MaterialsScene($('#scene'), {
    error: msg => toast(msg)
  });
} catch (err) {
  console.warn('3D not loaded', err);
  $('#model-status').textContent = 'المجسم الثلاثي الأبعاد غير مدعوم في هذا المتصفح. يمكنك إتمام الفرز عبر البطاقات والأزرار.';
}

await selectItem(state.id, true);

// نافذة الفحص العامة للمتصفح
window.materialsLab = {
  state,
  get scene() { return scene; },
  selectItem,
  setMode,
  handleClassification,
  get discoveries() { return discoveries; }
};
