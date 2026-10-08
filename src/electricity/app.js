import { devices, byId, sources, trySource, answer, voiceLines } from './data.js';
import { icon, mascot } from './icons.js';
import { GuideVoice } from './audio.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const numbers = new Intl.NumberFormat('ar-u-nu-arab');
const params = new URLSearchParams(location.search);
const state = { id: byId(params.get('device'))?.id || 'car', mode: params.get('mode') === 'learn' ? 'learn' : 'play', source: 'battery', running: false, doorOpen: false };
let discoveries = {}; try { const saved = JSON.parse(localStorage.getItem('sharara-discoveries-v2') || '{}'); for (const [id, list] of Object.entries(saved)) if (byId(id) && Array.isArray(list)) discoveries[id] = list.filter(s => trySource(id, s).ok); } catch { }
let scene, guideKey = 'welcome', guideText = voiceLines.welcome, soundState = 'idle', toastTimer, modelRevision = 0;
const brand = `<span class="brand-symbol">${icon('bolt')}</span><span><strong>مختبر شرارة</strong><small>خطوة صغيرة، اكتشاف كبير</small></span>`;
const card = d => `<button class="device-card${d.id === state.id ? ' selected' : ''}" style="--card:${d.color}" data-device="${d.id}" aria-pressed="${d.id === state.id}"><i class="device-check">${icon('check')}</i><img src="assets/thumbnails/${d.id}.png" alt="" loading="lazy"><span>${d.name}</span></button>`;
const dialogHead = (id, title) => `<div class="dialog-head"><h2 id="${id}-title">${title}</h2><button data-close="${id}" aria-label="إغلاق">${icon('close')}</button></div>`;
$('#app').innerHTML = `<div class="shell">
  <aside class="sidebar" aria-label="التنقل الرئيسي"><a href="index.html" class="brand" title="العودة لبوابة المنصة الرئيسية">${brand}</a>
    <nav class="nav-stack"><p class="nav-label">مختبر الكهرباء</p><button class="nav-item active" data-action="home">${icon('bolt')}طاولة الاستكشاف<span class="small-dot"></span></button><button class="nav-item" data-open="library">${icon('book')}أجهزة كتابي</button><button class="nav-item" data-open="notebook">${icon('trophy')}اكتشافاتي</button></nav>
    <nav class="nav-stack"><p class="nav-label">نكتشف معًا</p><button class="nav-item" data-open="camera">${icon('camera')}صوّر من كتابك</button><button class="nav-item" data-open="help">${icon('help')}كيف ألعب؟</button></nav>
    <div class="side-mascot">${mascot}<h3>كل محاولة… اكتشاف!</h3><p>جرّب براحتك. أنا هنا لأساعدك.</p></div><p class="side-footer">صُنع لمستكشفي الصف الرابع ${icon('heart')}</p>
  </aside>
  <div class="body-area"><header class="topbar"><div class="breadcrumb"><a href="index.html" style="color:var(--muted)">المنصة الرئيسية</a> ${icon('chevron')} العلوم ${icon('chevron')} <strong>نشاط ١: وحدة الكهرباء</strong></div><a href="index.html" class="brand mobile-brand" aria-label="العودة إلى المنصة الرئيسية">${brand}</a><div class="top-actions"><div class="activity-toggle-wrap"><button id="activity-toggle-btn" class="activity-toggle-btn" aria-label="الأنشطة" aria-expanded="false" title="عرض الأنشطة">${icon('bolt')}<span>الأنشطة</span><i class="toggle-arrow">▾</i></button><div id="activity-dropdown" class="activity-dropdown" hidden><div class="dropdown-header">محطات العلوم التفاعلية</div><a href="index.html" class="dropdown-item"><span class="dropdown-icon">🏠</span><div><strong>بوابة المنصة الرئيسية</strong><small>التعريف بالمنصة والأنشطة</small></div></a><a href="electricity.html" class="dropdown-item active"><span class="dropdown-icon">⚡</span><div><strong>نشاط ١: وحدة الكهرباء</strong><small>مختبر مصادر الطاقة مع «شرارة»</small></div></a><a href="materials.html" class="dropdown-item"><span class="dropdown-icon">📦</span><div><strong>نشاط ٢: فرز خامات البيئة</strong><small>محطة التصنيف مع «الخبير»</small></div></a><div class="dropdown-divider"></div><div class="dropdown-item disabled"><span class="dropdown-icon">💡</span><div><strong>نشاط ٣: الدارة الكهربائية</strong><small>قريباً</small></div></div><div class="dropdown-item disabled"><span class="dropdown-icon">🔌</span><div><strong>نشاط ٤: الموصلات والعوازل</strong><small>قريباً</small></div></div><div class="dropdown-item disabled"><span class="dropdown-icon">🧲</span><div><strong>نشاط ٥: المغناطيسية</strong><small>قريباً</small></div></div></div></div><button id="sound-toggle" class="sound-button" aria-label="تشغيل الصوت" aria-pressed="false">${icon('mute')}<span>تشغيل الصوت</span></button><div class="learner"><span class="avatar">${icon('star')}</span><span>مستكشف صغير<small>الصف الرابع الأساسي</small></span></div><button class="sound-button" data-open="help" aria-label="كيف ألعب؟">${icon('help')}</button></div></header>
  <main id="main" class="main"><section class="intro"><div class="intro-copy"><div class="eyebrow">${icon('bolt')} وحدة الكهرباء · نتعلّم بالتجربة</div><h1>كل جهاز… <span>له سرّ!</span></h1><p>من أين تأتي الطاقة؟ اختر، جرّب، واكتشف مع شرارة.</p></div><button class="progress-chip" data-open="notebook">${icon('trophy')}<span><strong>اكتشافاتي الصغيرة</strong><small id="progress-text"></small><span class="progress-track"><i id="progress-bar"></i></span></span></button></section>
  <section class="device-section" aria-labelledby="choose-title"><div class="section-heading"><h2 id="choose-title"><span class="step-number">١</span> اختر جهازًا <small>من صور كتاب العلوم</small></h2><button class="text-button" data-open="library">كل الأجهزة <span>(${numbers.format(devices.length)})</span> ${icon('arrow')}</button></div><div class="devices-row" id="device-shelf">${devices.slice(0, 6).map(card).join('')}<button class="camera-card" data-open="camera">${icon('camera')}<strong>صوّر من كتابك</strong><small>واجعله يظهر أمامك!</small></button></div></section>
  <div class="experiment"><section class="lab-card" aria-label="طاولة الاستكشاف"><div class="lab-top"><div><h2><span class="step-number">٢</span> طاولة الاستكشاف</h2><small>شاهد جهازك من كل الجهات</small></div><div class="mode-switch" role="group" aria-label="نوع النشاط"><button data-mode="learn">${icon('book')}تعرّف</button><button data-mode="play">${icon('play')}جرّب</button></div></div>
  <div class="stage" id="stage"><div id="scene" class="scene-container"></div><div class="stage-badge">${icon('cube')} مجسّم ثلاثي الأبعاد</div><div class="stage-tools"><button class="icon-button" data-action="reset-view" aria-label="إعادة زاوية العرض" title="إعادة زاوية العرض">${icon('reset')}</button><button class="icon-button" data-action="zoom-in" aria-label="تقريب" title="تقريب">+</button><button class="icon-button" data-action="zoom-out" aria-label="إبعاد" title="إبعاد">−</button></div><p id="model-status" class="model-status" role="status">نجهّز جهازك…</p><button id="door" class="door-button" hidden>افتح باب الثلاجة</button><h3 class="device-title" id="device-title"></h3><div class="stage-caption"><span>${icon('hand')} اسحب لتدوير الجهاز</span><span id="device-state" class="state-pill">جاهز للتجربة</span></div></div>
  <div class="xr-row"><button data-xr="ar">${icon('expand')}ضعه على طاولتك <small>AR</small></button><button data-xr="vr">${icon('glasses')}شاهد بالنظارة <small>VR</small></button></div>
  <div class="power-panel" id="play-panel"><h3 class="power-heading"><span class="step-number">٣</span> من أين تأتي طاقته؟ <small>اختر ثم جرّب</small></h3><div class="power-actions"><div class="source-options" id="source-options"></div><button class="primary" id="try-power">${icon('play')}جرّب التشغيل</button></div><div class="source-extra" id="source-extra"></div></div><div class="power-panel" id="learn-panel" hidden><h3 class="power-heading">${icon('info')}هل تعلم؟</h3><p id="device-fact" class="fact-box"></p><button class="text-button" data-action="fact">${icon('sound')}استمع إلى المعلومة</button></div>
  </section><aside class="guide-column" aria-label="مساعدك شرارة"><section class="guide-card"><div class="guide-mascot">${mascot}<div><h3>أهلًا، أنا شرارة!</h3><p>صديقك في كل تجربة</p></div></div><div class="guide-bubble" id="guide-bubble"><p id="guide-text" aria-live="polite"></p></div><button class="guide-listen" id="listen">${icon('sound')}اسمعني</button><div class="guide-suggestions"><button data-question="تلميح">${icon('bolt')}أعطني تلميحًا</button><button data-question="كيف يعمل هذا الجهاز">${icon('help')}كيف يعمل؟</button></div><form class="ask-form" id="ask-form"><input id="ask-input" maxlength="180" aria-label="اسأل شرارة" placeholder="اسألني عن الجهاز…" autocomplete="off"><button type="button" id="mic-btn" class="speech-btn" aria-label="تحدث بالصوت" title="تحدث بالصوت">${icon('mic')}</button><button type="button" id="clear-btn" class="clear-btn" aria-label="مسح النص" title="مسح النص">${icon('trash')}</button><button type="submit" aria-label="إرسال السؤال">${icon('send')}</button></form><p class="guide-note">مساعد تعليمي بإجابات مُعدّة لهذا النشاط</p><p id="sound-status" class="sound-status" role="status"></p></section><div class="safety-card">${icon('shield')}<div><strong>نكتشف بأمان</strong><p>الكهرباء هنا على الشاشة فقط.<br>المقابس الحقيقية للكبار.</p></div></div></aside></div>
  <section class="journey">${icon('star')}<div><h3 id="journey-title">اكتشافك الأول بانتظارك!</h3><p id="journey-text">كل جهاز تفهمه يُضيف نجمة إلى رحلتك.</p></div><button data-open="notebook">دفتر اكتشافاتي ${icon('arrow')}</button></section><p class="footer">${icon('heart')} لا بأس بالمحاولة مرة أخرى. هكذا يتعلّم العلماء!</p></main></div></div>
  <dialog id="library" aria-labelledby="library-title">${dialogHead('library', 'أجهزة من كتابي')}<p class="dialog-description">أيّ جهاز تحب أن تستكشف اليوم؟</p><div class="filter-row" id="filters"><button class="active" data-filter="all">كل الأجهزة</button>${[...new Set(devices.map(d => d.page))].map(p => `<button data-filter="${p}">${p}</button>`).join('')}</div><div class="library-grid" id="library-grid">${devices.map(card).join('')}</div></dialog>
  <dialog id="camera" aria-labelledby="camera-title">${dialogHead('camera', 'من كتابك… إلى مختبرك!')}<p class="dialog-description">صوّر جهازًا واحدًا من الصور المرفقة في كتابك. قرّب الصورة وأبعد الظلال.</p><video id="camera-video" class="camera-preview" autoplay playsinline muted hidden></video><img id="photo-preview" class="camera-preview" alt="الصورة التي اخترتها" hidden><div class="camera-controls"><button class="primary" id="start-camera">${icon('camera')}افتح الكاميرا</button><button class="primary" id="capture" hidden>التقط الصورة</button><label class="secondary file-label" for="photo-file">${icon('book')}اختر صورة</label><input class="visually-hidden" id="photo-file" type="file" accept="image/*" capture="environment"></div><p id="camera-status" role="status"></p><div class="camera-result" id="camera-result" hidden><p id="recognition-text"></p><label for="confirmed-device">هذا هو الجهاز في صورتي:</label><select id="confirmed-device"><option value="">اختر اسم الجهاز</option>${devices.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}</select><button class="primary" id="confirm-photo">افتح الجهاز في المختبر ${icon('arrow')}</button></div><p class="camera-hint"> </p></dialog>
  <dialog id="notebook" aria-labelledby="notebook-title">${dialogHead('notebook', 'دفتر اكتشافاتي')}<div id="notebook-content"></div></dialog>
  <dialog id="help" aria-labelledby="help-title">${dialogHead('help', 'ثلاث خطوات… وتصبح مستكشفًا!')}<div class="help-steps"><div class="help-step"><span class="step-number">١</span><div><h3>اختر جهازًا</h3><p>اضغط على جهاز من الكتاب، أو صوّر صورته وأكّد اسمه.</p></div></div><div class="help-step"><span class="step-number">٢</span><div><h3>تعرّف إليه أو جرّبه</h3><p>في «تعرّف» تتأمل المجسّم وتسمع معلوماته. في «جرّب» تختار مصدر الطاقة وتشاهد ما يحدث.</p></div></div><div class="help-step"><span class="step-number">٣</span><div><h3>اكتشف مصدر الطاقة</h3><p>اضغط «جرّب التشغيل». إن لم يعمل، استمع إلى شرارة وجرّب مصدرًا آخر.</p></div></div></div><p class="camera-hint">AR يضع الجهاز على طاولة حقيقية عبر هاتف يدعمه. VR يفتح المختبر في نظارة تدعمه. داخل النظارة، وجّه المؤشر نحو مصدر واضغط للتجربة. الصوت اختياري والنص متاح دائمًا.</p><button class="primary" data-close="help" style="margin-top:18px;width:100%">فهمت، لنكتشف! ${icon('arrow')}</button></dialog>
  <dialog id="notice" aria-labelledby="notice-title">${dialogHead('notice', 'نكمل الاستكشاف هنا')}<p id="notice-text" class="dialog-description"></p><button class="primary" data-close="notice">حسنًا</button></dialog>
  <div id="toast" class="toast" role="status" hidden></div>
  <div id="xr-ui" class="xr-ui"><div class="xr-guide"><p id="xr-guide-text"></p><button class="secondary" data-action="exit-xr">خروج</button></div><div class="xr-controls"><div class="source-options" id="xr-sources"></div><button class="primary" id="xr-try">جرّب التشغيل</button><button class="text-button" id="xr-listen">${icon('sound')}استمع للتوجيه</button><button class="text-button" id="xr-mode">تعرّف إلى الجهاز</button></div></div>`;

const voice = new GuideVoice(status => { soundState = status; $('#listen').innerHTML = icon(status === 'playing' ? 'stop' : 'sound') + (status === 'playing' ? 'إيقاف الصوت' : 'اسمعني'); $('#sound-status').textContent = status === 'unavailable' ? 'تعذّر تشغيل الصوت. يمكنك قراءة التوجيه هنا.' : ''; });
function say(key, text = voiceLines[key], success = false, force = false) { guideKey = key; guideText = text; $('#guide-text').textContent = text; $('#xr-guide-text').textContent = text; $('#guide-bubble').classList.toggle('success', success); scene?.updateVR(); voice.say(key, text, force); }
function toast(text) { clearTimeout(toastTimer); $('#toast').textContent = text; $('#toast').hidden = false; toastTimer = setTimeout(() => $('#toast').hidden = true, 5500); }
function notice(text) { $('#notice-text').textContent = text; $('#notice').showModal(); }
function save() { try { localStorage.setItem('sharara-discoveries-v2', JSON.stringify(discoveries)); } catch { } }
function currentSources() { const d = byId(state.id); return ['battery', 'mains', ...(['solar', 'wind', 'movement'].includes(d.source) ? [d.source] : [])].map(id => ({ id, ...sources[id] })); }
function sourceButton(s) { const label = state.id === 'street' && s.id === 'mains' ? 'شبكة الكهرباء' : s.name; return `<button class="source-card${state.source === s.id ? ' selected' : ''}" data-source="${s.id}" aria-pressed="${state.source === s.id}" draggable="true">${icon(s.icon)}${label}</button>`; }
function render() {
  $('#power-feedback')?.remove();
  const d = byId(state.id), play = state.mode === 'play';
  $$('[data-mode]').forEach(b => { b.classList.toggle('active', b.dataset.mode === state.mode); b.setAttribute('aria-pressed', b.dataset.mode === state.mode); });
  $$('[data-device]').forEach(b => { b.classList.toggle('selected', b.dataset.device === state.id); b.setAttribute('aria-pressed', b.dataset.device === state.id); });
  $('#device-title').textContent = d.name; $('#device-fact').textContent = d.fact;
  $('#device-state').textContent = state.running ? 'يعمل الآن' : play ? 'جاهز للتجربة' : 'نتعرّف إليه'; $('#device-state').classList.toggle('on', state.running);
  $('#play-panel').hidden = !play; $('#learn-panel').hidden = play;
  const opts = currentSources(); $('#source-options').innerHTML = opts.slice(0, 2).map(sourceButton).join(''); $('#source-extra').innerHTML = opts.slice(2).map(sourceButton).join(''); $('#xr-sources').innerHTML = opts.map(sourceButton).join(''); $('#xr-sources').hidden = !play;
  $('#try-power').innerHTML = icon(state.running ? 'stop' : 'play') + (state.running ? 'أوقف الجهاز' : 'جرّب التشغيل'); $('#try-power').classList.toggle('running', state.running);
  $('#xr-try').textContent = state.running ? 'أوقف الجهاز' : 'جرّب التشغيل'; $('#xr-try').hidden = !play; $('#xr-mode').textContent = play ? 'تعرّف إلى الجهاز' : 'جرّب الجهاز';
  $('#door').hidden = d.id !== 'fridge'; $('#door').textContent = state.doorOpen ? 'أغلق باب الثلاجة' : 'افتح باب الثلاجة';
  const count = Object.keys(discoveries).filter(id => discoveries[id].length).length;
  $('#progress-text').textContent = `${numbers.format(count)} من ${numbers.format(devices.length)} جهازًا`; $('#progress-bar').style.width = `${count / devices.length * 100}%`;
  $('#journey-title').textContent = count === 0 ? 'اكتشافك الأول بانتظارك!' : count === devices.length ? 'أنت مستكشف مصادر الكهرباء!' : `رائع! اكتشفت ${numbers.format(count)} من أجهزة كتابك`;
  $('#journey-text').textContent = count ? 'اختر جهازًا آخر، وواصل رحلة الاكتشاف.' : 'كل جهاز تفهمه يُضيف نجمة إلى رحلتك.';
  scene?.setState(state);
}
async function selectDevice(id, initial = false) {
  if (!byId(id)) return; voice.stop(); state.id = id; state.running = false; state.doorOpen = false; state.source = 'battery';
  const url = new URL(location.href); url.searchParams.set('device', id); url.searchParams.set('mode', state.mode); history.replaceState(null, '', url);
  const d = byId(id); if (!devices.slice(0, 6).some(x => x.id === id)) { $('#device-shelf').innerHTML = [d, ...devices.filter(x => x.id !== id).slice(0, 5)].map(card).join('') + `<button class="camera-card" data-open="camera">${icon('camera')}<strong>صوّر من كتابك</strong><small>واجعله يظهر أمامك!</small></button>`; }
  render();
  if (state.mode === 'learn') say(id + '-fact', d.fact); else if (initial) say('welcome'); else say(id + '-select', `اخترت ${d.name}. اختر مصدرًا للطاقة، ثم اضغط: جرّب التشغيل.`);
  const revision = ++modelRevision;
  if (scene) { $('#model-status').hidden = false; $('#model-status').textContent = 'نجهّز جهازك…'; try { await scene.setDevice(d); if (revision === modelRevision) { $('#model-status').hidden = true; $('#stage').dataset.loaded = id; } } catch { if (revision === modelRevision) fallback('تعذّر عرض المجسّم. جرّب الجهاز بالأزرار أدناه.'); } }
  else if ($('#scene .fallback-image')) $('#scene .fallback-image').src = `assets/book/${id}.jpg`;
}
function setMode(mode) { voice.stop(); state.mode = mode; state.running = false; render(); const url = new URL(location.href); url.searchParams.set('mode', mode); history.replaceState(null, '', url); say(mode === 'learn' ? state.id + '-fact' : 'play', mode === 'learn' ? byId(state.id).fact : voiceLines.play); }
function selectSource(source) { if (!currentSources().some(s => s.id === source) || state.mode !== 'play') return; state.source = source; state.running = false; render(); }
function testPower() {
  if (state.mode !== 'play') return;
  if (scene?.xrMode === 'ar' && !scene.placed) { say('ar'); return; }
  if (state.running) { state.running = false; render(); say('stopped'); return; }
  const result = trySource(state.id, state.source); state.running = result.ok;
  if (result.ok) { discoveries[state.id] ||= []; if (!discoveries[state.id].includes(state.source)) discoveries[state.id].push(state.source); save(); }
  render(); say(`${state.id}-${result.ok ? 'result' : 'wrong'}`, result.text, result.ok);
  let feedback = $('#power-feedback'); if (!feedback) { feedback = document.createElement('p'); feedback.id = 'power-feedback'; feedback.className = 'power-feedback'; $('#play-panel').append(feedback); } feedback.textContent = result.text;
}
function openNotebook() { const ids = Object.keys(discoveries).filter(id => discoveries[id].length); $('#notebook-content').innerHTML = ids.length ? `<p class="dialog-description">هذه مصادر الطاقة التي جرّبتها بنجاح. اكتشافاتك محفوظة على هذا الجهاز.</p><div class="notebook-grid">${ids.map(id => `<div class="notebook-item"><img src="assets/thumbnails/${id}.png" alt=""><div><strong>${byId(id).name}</strong><small>${discoveries[id].map(s => sources[s].name).join(' · ')}</small></div></div>`).join('')}</div>` : `<div class="empty-notebook">${mascot}<h3>لنصنع أول اكتشاف!</h3><p class="dialog-description">جرّب تشغيل جهاز بالمصدر المناسب، وسنحفظ اكتشافك هنا.</p><button class="primary" data-close="notebook" style="margin:auto">أعود للتجربة</button></div>`; }
function openDialog(id) { if (id === 'notebook') openNotebook(); if (id === 'camera') say('camera'); $('#' + id).showModal(); }
document.addEventListener('click', e => {
  const toggleBtn = e.target.closest('#activity-toggle-btn');
  if (toggleBtn) {
    const dropdown = $('#activity-dropdown');
    const isHidden = dropdown.hidden;
    dropdown.hidden = !isHidden;
    toggleBtn.setAttribute('aria-expanded', String(isHidden));
    return;
  }
  const dropdown = $('#activity-dropdown');
  if (dropdown && !dropdown.hidden && !e.target.closest('.activity-toggle-wrap')) {
    dropdown.hidden = true;
    $('#activity-toggle-btn')?.setAttribute('aria-expanded', 'false');
  }

  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.device) { selectDevice(b.dataset.device); if ($('#library').open) $('#library').close(); }
  if (b.dataset.source) selectSource(b.dataset.source);
  if (b.dataset.mode) setMode(b.dataset.mode);
  if (b.dataset.open) openDialog(b.dataset.open);
  if (b.dataset.close) $('#' + b.dataset.close).close();
  if (b.dataset.question) { const a = answer(b.dataset.question, byId(state.id)); say(a.key, a.text); }
  if (b.dataset.filter) { $$('[data-filter]').forEach(el => el.classList.toggle('active', el === b)); $('#library-grid').innerHTML = devices.filter(d => b.dataset.filter === 'all' || d.page === b.dataset.filter).map(card).join(''); }
  if (b.dataset.xr) enterXR(b.dataset.xr);
  if (b.dataset.action === 'home') $('#main').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  if (b.dataset.action === 'reset-view') scene?.reset();
  if (b.dataset.action === 'zoom-in') scene?.zoom(.85);
  if (b.dataset.action === 'zoom-out') scene?.zoom(1.15);
  if (b.dataset.action === 'fact') say(state.id + '-fact', byId(state.id).fact, false, true);
  if (b.dataset.action === 'exit-xr') scene?.exitXR();
});
$('#try-power').onclick = testPower; $('#xr-try').onclick = testPower; $('#xr-mode').onclick = () => setMode(state.mode === 'learn' ? 'play' : 'learn');
$('#listen').onclick = () => { if (soundState === 'playing') voice.stop(); else voice.say(guideKey, guideText, true); }; $('#xr-listen').onclick = () => voice.say(guideKey, guideText, true);
$('#sound-toggle').onclick = () => { voice.enabled = !voice.enabled; $('#sound-toggle').classList.toggle('on', voice.enabled); $('#sound-toggle').setAttribute('aria-pressed', voice.enabled); $('#sound-toggle').setAttribute('aria-label', voice.enabled ? 'إيقاف الصوت' : 'تشغيل الصوت'); $('#sound-toggle').innerHTML = icon(voice.enabled ? 'sound' : 'mute') + `<span>${voice.enabled ? 'الصوت يعمل' : 'تشغيل الصوت'}</span>`; if (voice.enabled) voice.say(guideKey, guideText); else voice.stop(); };
$('#door').onclick = () => { state.doorOpen = !state.doorOpen; render(); };

// Web Speech API - Speech-to-Text (ar-SA)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null, isRecording = false, speechBaseText = '';

function stopRecording() {
  isRecording = false;
  if (recognition) { try { recognition.stop(); } catch { } }
  const micBtn = $('#mic-btn');
  if (micBtn) {
    micBtn.classList.remove('recording');
    micBtn.setAttribute('title', 'تحدث بالصوت');
    micBtn.setAttribute('aria-label', 'تحدث بالصوت');
    micBtn.innerHTML = icon('mic');
  }
  const input = $('#ask-input');
  if (input) input.placeholder = 'اسألني عن الجهاز…';
}

function startRecording() {
  if (!SpeechRecognition) {
    toast('تحويل الصوت إلى نص غير مدعوم في متصفحك.');
    return;
  }
  if (isRecording) {
    stopRecording();
    return;
  }
  try {
    if (!recognition) {
      recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => {
        isRecording = true;
        const micBtn = $('#mic-btn');
        if (micBtn) {
          micBtn.classList.add('recording');
          micBtn.setAttribute('title', 'إيقاف التسجيل');
          micBtn.setAttribute('aria-label', 'إيقاف التسجيل');
          micBtn.innerHTML = icon('stop');
        }
        const input = $('#ask-input');
        if (input) {
          speechBaseText = input.value;
          input.placeholder = 'جاري الاستماع... اتكلم الآن 🎙️';
        }
      };

      recognition.onresult = event => {
        let sessionText = '';
        for (let i = 0; i < event.results.length; i++) {
          sessionText += event.results[i][0].transcript;
        }
        const input = $('#ask-input');
        if (input) {
          const prefix = speechBaseText.trim() ? speechBaseText.trim() + ' ' : '';
          input.value = prefix + sessionText.trimStart();
        }
      };

      recognition.onerror = event => {
        stopRecording();
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast('تعذّر التعرف على الصوت. تحقق من ميكروفون جهازك.');
        }
      };

      recognition.onend = () => {
        stopRecording();
      };
    }
    recognition.start();
  } catch (err) {
    console.warn('Speech recognition error:', err);
    stopRecording();
  }
}

const micBtn = $('#mic-btn');
if (micBtn) micBtn.onclick = e => { e.preventDefault(); if (isRecording) stopRecording(); else startRecording(); };

const clearBtn = $('#clear-btn');
if (clearBtn) clearBtn.onclick = e => { e.preventDefault(); const input = $('#ask-input'); if (input) { input.value = ''; input.focus(); } };

$('#ask-form').onsubmit = e => {
  e.preventDefault();
  if (isRecording) stopRecording();
  const input = $('#ask-input');
  if (!input.value.trim()) return;
  const a = answer(input.value, byId(state.id));
  say(a.key, a.text);
  input.value = '';
};
document.addEventListener('dragstart', e => { const b = e.target.closest('[data-source]'); if (b) e.dataTransfer.setData('text/plain', b.dataset.source); });
$('#stage').addEventListener('dragover', e => { if (state.mode === 'play') e.preventDefault(); }); $('#stage').addEventListener('drop', e => { e.preventDefault(); const s = e.dataTransfer.getData('text/plain'); if (state.mode === 'play' && currentSources().some(x => x.id === s)) { selectSource(s); testPower(); } });
$('#xr-ui').addEventListener('beforexrselect', e => { if (e.target.closest('button')) e.preventDefault(); });
async function enterXR(mode) { if (!scene) { notice('تعذّر تشغيل المجسّم على هذا المتصفح. يمكنك متابعة التجربة بالأزرار.'); return; } try { await scene.enterXR(mode, $('#xr-ui')); if (mode === 'ar') $('#xr-ui').classList.add('xr-active'); say(mode); } catch (error) { $('#xr-ui').classList.remove('xr-active'); notice(error.message || 'تعذّر بدء العرض. يمكنك متابعة التجربة هنا.'); } }
function fallback(message) { $('#model-status').hidden = true; $('#scene').innerHTML = `<img class="fallback-image" src="assets/book/${state.id}.jpg" alt="${byId(state.id).name}">`; $('#stage').dataset.loaded = state.id; toast(message); }
render(); say('welcome');
try {
  const { LabScene } = await import('./scene.js'); scene = new LabScene($('#scene'), {
    guidance: () => guideText, sources: currentSources,
    error: message => { toast(message); }, placed: () => { render(); say('placed'); }, ended: () => { $('#xr-ui').classList.remove('xr-active'); voice.stop(); },
    action: id => { if (id === 'exit') scene.exitXR(); else if (id === 'next') selectDevice(devices[(devices.findIndex(d => d.id === state.id) + 1) % devices.length].id); else if (id === 'mode') setMode(state.mode === 'learn' ? 'play' : 'learn'); else if (id === 'play') setMode('play'); else if (id === 'listen' || id === 'stop') { if (id === 'stop' && state.running) testPower(); else voice.say(guideKey, guideText, true); } else { selectSource(id); testPower(); } },
  });
} catch (error) { console.warn('3D unavailable', error.message); fallback('المجسّم غير متاح في هذا المتصفح. جرّب بالأزرار، وستظهر النتيجة مكتوبة.'); }
await selectDevice(state.id, true);

// Capture is activated only by a child/parent click. No camera or image is uploaded.
let stream, photoURL, photoRevision = 0;
function stopCamera() { stream?.getTracks().forEach(t => t.stop()); stream = null; $('#camera-video').srcObject = null; $('#camera-video').hidden = true; $('#capture').hidden = true; $('#start-camera').hidden = false; }
$('#camera').addEventListener('close', () => { stopCamera(); photoRevision++; if (photoURL) URL.revokeObjectURL(photoURL); photoURL = null; $('#photo-preview').hidden = true; $('#photo-preview').removeAttribute('src'); $('#camera-result').hidden = true; $('#camera-status').textContent = ''; $('#photo-file').value = ''; });
$('#start-camera').onclick = async () => { const revision = ++photoRevision; $('#camera-status').textContent = 'نفتح الكاميرا…'; try { if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported'); const nextStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); if (revision !== photoRevision || !$('#camera').open) { nextStream.getTracks().forEach(t => t.stop()); return; } stopCamera(); stream = nextStream; $('#camera-video').srcObject = stream; $('#camera-video').hidden = false; $('#photo-preview').hidden = true; $('#capture').hidden = false; $('#start-camera').hidden = true; $('#camera-result').hidden = true; $('#camera-status').textContent = 'قرّب جهازًا واحدًا داخل الصورة، ثم اضغط التقط الصورة.'; } catch (error) { if (revision !== photoRevision) return; $('#camera-status').textContent = error.name === 'NotAllowedError' ? 'لم يُسمح بالكاميرا. اختر صورة محفوظة بدلًا منها.' : 'الكاميرا غير متاحة هنا. اختر صورة محفوظة أو افتح الموقع برابط HTTPS.'; } };
$('#capture').onclick = () => { const video = $('#camera-video'); if (!video.videoWidth) { $('#camera-status').textContent = 'انتظر ظهور صورة الكاميرا ثم التقطها.'; return; } const c = document.createElement('canvas'); c.width = video.videoWidth; c.height = video.videoHeight; c.getContext('2d').drawImage(video, 0, 0); stopCamera(); processPhoto(c.toDataURL('image/jpeg', .92)); };
$('#photo-file').onchange = () => { const file = $('#photo-file').files[0]; if (!file) return; if (!file.type.startsWith('image/') || file.size > 15 * 1024 * 1024) { $('#camera-status').textContent = 'اختر صورة بحجم أقل من ١٥ ميغابايت.'; return; } stopCamera(); if (photoURL) URL.revokeObjectURL(photoURL); photoURL = URL.createObjectURL(file); processPhoto(photoURL); };
async function processPhoto(url) { const revision = ++photoRevision; $('#photo-preview').src = url; $('#photo-preview').hidden = false; $('#camera-result').hidden = true; $('#confirmed-device').value = ''; $('#camera-status').textContent = 'نبحث عن صورة الجهاز في كتابك…'; try { await $('#photo-preview').decode(); const { recognize } = await import('./recognition.js'); const result = await recognize(url); if (revision !== photoRevision || !$('#camera').open) return; $('#camera-status').textContent = ''; $('#recognition-text').textContent = result ? `أظنّ أنها ${byId(result.id).name}. هل الاسم صحيح؟ يمكنك تغييره.` : 'لم أتأكد من الجهاز. اختر اسمه من القائمة لنستكشفه معًا.'; if (result) $('#confirmed-device').value = result.id; } catch { if (revision !== photoRevision || !$('#camera').open) return; $('#camera-status').textContent = ''; $('#recognition-text').textContent = 'لم أستطع مطابقة الصورة. اختر اسم الجهاز من القائمة.'; } if (revision === photoRevision) $('#camera-result').hidden = false; }
$('#confirm-photo').onclick = async () => { const id = $('#confirmed-device').value; if (!id) { $('#recognition-text').textContent = 'اختر اسم الجهاز أولًا.'; $('#confirmed-device').focus(); return; } $('#camera').close(); await selectDevice(id); const stage = $('#stage'); stage.tabIndex = -1; stage.setAttribute('aria-label', byId(id).name + ' على طاولة الاستكشاف'); stage.focus({ preventScroll: true }); stage.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); };
document.addEventListener('visibilitychange', () => { if (document.hidden) { voice.stop(); stopCamera(); } });
// Read-only diagnostic hooks for deterministic browser checks and asset thumbnails.
window.lab = { state, get scene() { return scene; }, selectDevice, setMode, testPower, selectSource, get discoveries() { return discoveries; } };
