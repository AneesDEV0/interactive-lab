// ═══════════════════════════════════════════════════════════════════════════
// src/conductors/app.js — التطبيق الرئيسي لمحطة تصنيف المواد الموصلة والعازلة
// المساعد التعليمي «البروفيسور» · الصف الرابع الأساسي
// ═══════════════════════════════════════════════════════════════════════════

import { items, categories, professorDialogs, generateProfessorReport } from './data.js';
import { icons, renderIcon } from './icons.js';
import { ProfessorVoice } from './audio.js';
import { ConductorsScene } from './scene.js';
import { loadCV, imageToCanvas, matchConductorItem } from './recognition.js';

class ConductorsApp {
  constructor() {
    this.mode = 'learn'; // 'learn' | 'play'
    this.selectedItem = items[0];
    this.trayItems = [...items];
    this.classified = {
      conductive: [],
      insulating: []
    };
    this.attempts = 0;
    this.startTime = Date.now();
    this.activeDragItem = null;
    this.lastReport = null;

    // استعادة الإعدادات السابقة من LocalStorage
    this.loadSavedProgress();

    // تهيئة الصوت
    this.voice = new ProfessorVoice((status) => {
      this.updateProfessorStatus(status);
    });

    // بناء الواجهة والربط
    this.initDOM();
    this.initScene();
    this.initEvents();
    this.render();
  }

  loadSavedProgress() {
    try {
      const saved = localStorage.getItem('conductors_lab_progress');
      if (saved) {
        this.savedData = JSON.parse(saved);
      }
    } catch {
      this.savedData = null;
    }
  }

  saveProgress(report) {
    try {
      const record = {
        completedAt: new Date().toISOString(),
        accuracy: report.accuracy,
        rank: report.rank,
        attempts: report.attempts,
        totalItems: report.totalItems
      };
      localStorage.setItem('conductors_lab_progress', JSON.stringify(record));
    } catch {}
  }

  initDOM() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    appEl.innerHTML = `
      <!-- الشريط العلوي -->
      <header class="topbar">
        <div class="brand-area">
          <div class="brand-symbol">⚡</div>
          <div class="brand-text">
            <strong>محطة تصنيف المواد الموصلة والعازلة</strong>
            <small>الصف الرابع الأساسي · المنهاج الفلسطيني</small>
          </div>
        </div>

        <div class="top-actions">
          <button type="button" class="activity-toggle-btn" id="activity-toggle-btn" aria-expanded="false" aria-haspopup="true">
            <span>📚 الأنشطة</span>
            <span aria-hidden="true">▾</span>
          </button>
          <button type="button" class="sound-btn" id="sound-btn" aria-label="تشغيل/كتم الصوت" title="تشغيل/كتم الصوت">
            🔊
          </button>
          <a href="/" class="help-btn" title="العودة للصفحة الرئيسية">
            🏠
          </a>
        </div>

        <!-- قائمة الأنشطة المنسدلة -->
        <div class="activity-dropdown" id="activity-dropdown" hidden>
          <span class="dropdown-header">أنشطة منصة مختبر العلوم</span>
          <a href="/electricity.html" class="dropdown-item">
            <span class="dropdown-icon">⚡</span>
            <div>
              <strong>النشاط 1: مختبر الكهرباء</strong>
              <small>مصادر الطاقة ومجسمات 3D مع شرارة</small>
            </div>
          </a>
          <a href="/materials.html" class="dropdown-item">
            <span class="dropdown-icon">📦</span>
            <div>
              <strong>النشاط 2: فرز خامات البيئة</strong>
              <small>سحب وإفلات مع الخبير</small>
            </div>
          </a>
          <a href="/conductors.html" class="dropdown-item active">
            <span class="dropdown-icon">🔌</span>
            <div>
              <strong>النشاط 3: الموصلات والعوازل</strong>
              <small>الجدول الثنائي مع البروفيسور</small>
            </div>
          </a>
          <a href="/" class="dropdown-item">
            <span class="dropdown-icon">🏠</span>
            <div>
              <strong>بوابة المنصة الرئيسية</strong>
              <small>استعراض جميع الأنشطة وفريق البحث</small>
            </div>
          </a>
        </div>
      </header>

      <!-- مساحة العمل -->
      <main class="main-content" id="main">
        <!-- شريط التبديل والتقدم -->
        <div class="subbar">
          <div class="mode-switch">
            <button type="button" class="mode-btn ${this.mode === 'learn' ? 'active' : ''}" id="btn-mode-learn">
              <span>🔍</span>
              <span>وضع "تعرّف" (3D)</span>
            </button>
            <button type="button" class="mode-btn ${this.mode === 'play' ? 'active' : ''}" id="btn-mode-play">
              <span>🎮</span>
              <span>وضع "جرّب" (الجدول الثنائي)</span>
            </button>
          </div>

          <div class="stats-chip" id="progress-chip">
            <span>📊 الإنجاز:</span>
            <span id="progress-text">${this.getClassifiedCount()} من ${items.length} عناصر</span>
          </div>
        </div>

        <!-- بطاقة البروفيسور التعليمية والتفاعلية -->
        <section class="professor-card" aria-live="polite">
          <div class="professor-avatar-wrap">
            <div class="professor-avatar" aria-hidden="true">👨‍🏫</div>
            <div class="professor-status-dot" id="prof-status-dot" title="حالة البروفيسور"></div>
          </div>
          <div class="professor-body">
            <div class="professor-header">
              <span class="professor-name">البروفيسور</span>
              <span class="professor-badge">المساعد العلمي الذكي</span>
            </div>
            <p class="professor-speech" id="prof-speech">
              ${professorDialogs.welcome.text}
            </p>
          </div>
          <button type="button" class="professor-listen-btn" id="btn-prof-listen" title="استمع للبروفيسور">
            <span>🔊</span>
            <span>استمع</span>
          </button>
        </section>

        <!-- مساحة وضع "تعرّف" -->
        <div class="learn-view" id="learn-view">
          <div class="stage-wrapper">
            <div class="three-stage" id="three-stage"></div>
            <div class="stage-badge" id="stage-badge">
              <span>⚡</span>
              <span id="stage-badge-text">${this.selectedItem.name}</span>
            </div>
            <div class="stage-controls">
              <button type="button" class="stage-btn" id="btn-stage-reset" title="إعادة الكاميرا">
                <span>🔄</span>
                <span>توسيط</span>
              </button>
              <button type="button" class="stage-btn" id="btn-stage-rotate" title="إيقاف/تشغيل الدوران">
                <span>⏯️</span>
                <span>دوران</span>
              </button>
            </div>
          </div>

          <!-- شريط تصفح العناصر -->
          <div class="items-ribbon" id="items-ribbon">
            ${items.map(it => `
              <button type="button" class="item-chip ${it.id === this.selectedItem.id ? 'active' : ''}" data-item-id="${it.id}">
                <span class="chip-icon">${renderIcon(it.icon)}</span>
                <span>${it.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- مساحة وضع "جرّب" -->
        <div class="play-view" id="play-view" hidden>
          <div class="play-toolbar">
            <button type="button" class="camera-trigger-btn" id="btn-camera-open">
              <span>📷</span>
              <span>مطابقة بالكاميرا من كتاب العلوم</span>
            </button>
            <button type="button" class="reset-challenge-btn" id="btn-reset-challenge">
              <span>🔄</span>
              <span>إعادة توزيع العناصر</span>
            </button>
          </div>

          <!-- صينية العناصر المطلوب فرزها بالسحب والإفلات -->
          <section class="tray-box">
            <div class="tray-header">
              <span class="tray-title">
                <span>📦</span>
                <span>العناصر المطلوب فرزها (اسحب كل عنصر وأفلته في عموده المناسب):</span>
              </span>
            </div>
            <div class="tray-items" id="tray-items">
              <!-- تُحقن البطاقات برمجياً -->
            </div>
          </section>

          <!-- الجدول الثنائي -->
          <section class="two-column-table" id="two-column-table">
            <!-- عمود المواد الموصلة -->
            <div class="table-column conductive-col" id="col-conductive" data-category="conductive">
              <div class="col-header">
                <div class="col-icon">⚡</div>
                <div class="col-meta">
                  <h3>مواد موصلة للكهرباء</h3>
                  <small>تسمح بمرور التيار وتضيء المصباح</small>
                </div>
                <span class="col-count" id="count-conductive">0</span>
              </div>
              <div class="col-drop-zone" id="drop-conductive">
                <!-- العناصر المصنفة في الموصلات -->
              </div>
            </div>

            <!-- عمود المواد العازلة -->
            <div class="table-column insulating-col" id="col-insulating" data-category="insulating">
              <div class="col-header">
                <div class="col-icon">🛡️</div>
                <div class="col-meta">
                  <h3>مواد عازلة للكهرباء</h3>
                  <small>تمنع مرور التيار وتحمينا من الصدمات</small>
                </div>
                <span class="col-count" id="count-insulating">0</span>
              </div>
              <div class="col-drop-zone" id="drop-insulating">
                <!-- العناصر المصنفة في العوازل -->
              </div>
            </div>
          </section>
        </div>
      </main>

      <!-- نافذة التقرير النهائي للبروفيسور (Modal) -->
      <div class="report-modal" id="report-modal" hidden>
        <div class="report-card" role="dialog" aria-labelledby="report-title">
          <div class="report-header">
            <span class="report-medal">🏅</span>
            <h2 id="report-title">تقرير التقييم النهائي من البروفيسور</h2>
            <span class="report-rank-badge" id="rep-rank">عبقري الدارات الكهربائية 🌟</span>
          </div>

          <div class="report-stats-grid">
            <div class="report-stat-box">
              <strong id="rep-accuracy">100%</strong>
              <small>دقة التصنيف</small>
            </div>
            <div class="report-stat-box">
              <strong id="rep-attempts">8</strong>
              <small>عدد المحاولات</small>
            </div>
            <div class="report-stat-box">
              <strong id="rep-time">45 ثانية</strong>
              <small>وقت الإنجاز</small>
            </div>
          </div>

          <div class="report-letter-box">
            <span class="report-prof-avatar">👨‍🏫</span>
            <div class="report-letter-text">
              <strong>رسالة البروفيسور لعلماء المستقبل:</strong>
              <p id="rep-eval"></p>
              <p id="rep-advice" style="margin-top: 6px; font-weight: 700; color: var(--green);"></p>
            </div>
          </div>

          <div class="report-actions">
            <button type="button" class="report-btn report-btn-primary" id="btn-rep-listen">
              <span>🔊</span>
              <span>استمع لتقرير البروفيسور</span>
            </button>
            <button type="button" class="report-btn report-btn-secondary" id="btn-rep-restart">
              <span>🔄</span>
              <span>إعادة التحدي</span>
            </button>
            <button type="button" class="report-btn report-btn-secondary" id="btn-rep-close">
              <span>✕</span>
              <span>إغلاق</span>
            </button>
          </div>
        </div>
      </div>

      <!-- نافذة الكاميرا للتعرف البصري -->
      <div class="camera-modal" id="camera-modal" hidden>
        <div class="camera-card">
          <div class="camera-header">
            <h3>📷 الرؤية الحاسوبية (OpenCV.js)</h3>
            <button type="button" class="camera-close-btn" id="btn-camera-close">✕</button>
          </div>
          <div class="video-container">
            <video class="video-preview" id="camera-video" playsinline autoplay muted></video>
            <div class="scanner-frame"></div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button type="button" class="camera-trigger-btn" id="btn-camera-capture">
              <span>📸</span>
              <span>التقاط ومطابقة</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  initScene() {
    const stageEl = document.getElementById('three-stage');
    if (!stageEl) return;
    this.scene = new ConductorsScene(stageEl);
    this.scene.setItem(this.selectedItem);
  }

  initEvents() {
    // التبديل بين الوضعين
    const btnLearn = document.getElementById('btn-mode-learn');
    const btnPlay = document.getElementById('btn-mode-play');
    btnLearn?.addEventListener('click', () => this.setMode('learn'));
    btnPlay?.addEventListener('click', () => this.setMode('play'));

    // الصوت
    const soundBtn = document.getElementById('sound-btn');
    soundBtn?.addEventListener('click', () => {
      this.voice.enabled = !this.voice.enabled;
      soundBtn.classList.toggle('muted', !this.voice.enabled);
      soundBtn.innerHTML = this.voice.enabled ? '🔊' : '🔇';
    });

    // استمع للبروفيسور
    const btnListen = document.getElementById('btn-prof-listen');
    btnListen?.addEventListener('click', () => {
      const speechEl = document.getElementById('prof-speech');
      if (speechEl) {
        this.voice.speak(speechEl.textContent.trim(), true);
      }
    });

    // قائمة الأنشطة المنسدلة
    const toggleBtn = document.getElementById('activity-toggle-btn');
    const dropdown = document.getElementById('activity-dropdown');
    toggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = dropdown.hasAttribute('hidden');
      if (isHidden) {
        dropdown.removeAttribute('hidden');
        toggleBtn.setAttribute('aria-expanded', 'true');
      } else {
        dropdown.setAttribute('hidden', '');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('click', (e) => {
      if (!dropdown?.contains(e.target) && e.target !== toggleBtn) {
        dropdown?.setAttribute('hidden', '');
        toggleBtn?.setAttribute('aria-expanded', 'false');
      }
    });

    // تحكم طاولة 3D
    document.getElementById('btn-stage-reset')?.addEventListener('click', () => this.scene?.resetView());
    document.getElementById('btn-stage-rotate')?.addEventListener('click', () => this.scene?.toggleAutoRotate());

    // أزرار شريط العناصر
    const ribbon = document.getElementById('items-ribbon');
    ribbon?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-item-id]');
      if (!btn) return;
      const itemId = btn.getAttribute('data-item-id');
      const item = items.find(it => it.id === itemId);
      if (item) this.selectItem(item);
    });

    // إعادة التحدي
    document.getElementById('btn-reset-challenge')?.addEventListener('click', () => this.resetPlayMode());

    // أزرار التقرير النهائي
    document.getElementById('btn-rep-restart')?.addEventListener('click', () => {
      this.closeReport();
      this.resetPlayMode();
    });
    document.getElementById('btn-rep-close')?.addEventListener('click', () => this.closeReport());
    document.getElementById('btn-rep-listen')?.addEventListener('click', () => {
      if (this.lastReport) {
        const fullSpeech = `${this.lastReport.badgeTitle}. دقة التصنيف ${this.lastReport.accuracy} بالمئة. ${this.lastReport.evaluation} ${this.lastReport.advice}`;
        this.voice.speak(fullSpeech, true);
      }
    });

    // الكاميرا
    this.initCameraEvents();

    // إعداد مناطق الإسقاط للجدول الثنائي
    this.initDropZones();
  }

  setMode(mode) {
    this.mode = mode;
    const learnView = document.getElementById('learn-view');
    const playView = document.getElementById('play-view');
    const btnLearn = document.getElementById('btn-mode-learn');
    const btnPlay = document.getElementById('btn-mode-play');

    if (mode === 'learn') {
      learnView?.removeAttribute('hidden');
      playView?.setAttribute('hidden', '');
      btnLearn?.classList.add('active');
      btnPlay?.classList.remove('active');
      this.scene?.resize();
      this.updateProfessorSpeech(this.selectedItem.fact);
    } else {
      learnView?.setAttribute('hidden', '');
      playView?.removeAttribute('hidden');
      btnLearn?.classList.remove('active');
      btnPlay?.classList.add('active');
      this.startTime = Date.now();
      this.renderPlayMode();
      this.updateProfessorSpeech(professorDialogs.playIntro.text);
    }
  }

  selectItem(item) {
    this.selectedItem = item;
    // تحديث الأزرار
    document.querySelectorAll('.item-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-item-id') === item.id);
    });

    // تحديث المشهد ثلاثي الأبعاد
    this.scene?.setItem(item);

    // تحديث الشارة
    const badgeText = document.getElementById('stage-badge-text');
    if (badgeText) badgeText.textContent = item.name;

    // تحديث كلام البروفيسور ونطقه
    this.updateProfessorSpeech(item.fact);
    this.voice.speak(item.fact);
  }

  updateProfessorSpeech(text) {
    const speechEl = document.getElementById('prof-speech');
    if (speechEl) speechEl.textContent = text;
  }

  updateProfessorStatus(status) {
    const dot = document.getElementById('prof-status-dot');
    if (dot) {
      dot.classList.toggle('speaking', status === 'speaking');
    }
  }

  getClassifiedCount() {
    return this.classified.conductive.length + this.classified.insulating.length;
  }

  updateProgressText() {
    const txt = document.getElementById('progress-text');
    if (txt) {
      txt.textContent = `${this.getClassifiedCount()} من ${items.length} عناصر`;
    }
    const countCond = document.getElementById('count-conductive');
    const countIns = document.getElementById('count-insulating');
    if (countCond) countCond.textContent = this.classified.conductive.length;
    if (countIns) countIns.textContent = this.classified.insulating.length;
  }

  renderPlayMode() {
    this.renderTray();
    this.renderColumns();
    this.updateProgressText();
  }

  renderTray() {
    const trayEl = document.getElementById('tray-items');
    if (!trayEl) return;

    if (this.trayItems.length === 0) {
      trayEl.innerHTML = `
        <div class="tray-empty-hint">
          <span>✨</span>
          <span>أحسنت! تم نقل جميع العناصر إلى الجدول الثنائي بنجاح.</span>
        </div>
      `;
      return;
    }

    trayEl.innerHTML = this.trayItems.map(item => `
      <div class="drag-card" draggable="true" data-item-id="${item.id}" id="card-${item.id}">
        <span class="drag-card-icon">${renderIcon(item.icon)}</span>
        <span>${item.name}</span>
      </div>
    `).join('');

    // تفعيل أحداث السحب على البطاقات
    this.trayItems.forEach(item => {
      const card = document.getElementById(`card-${item.id}`);
      if (!card) return;

      // سحب بالماوس (HTML5 Drag)
      card.addEventListener('dragstart', (e) => {
        this.activeDragItem = item;
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.table-column').forEach(c => c.classList.remove('drop-active'));
        this.activeDragItem = null;
      });

      // سحب باللمس (Touch/Pointer) للشاشات الذكية
      this.initPointerDrag(card, item);
    });
  }

  renderColumns() {
    const dropCond = document.getElementById('drop-conductive');
    const dropIns = document.getElementById('drop-insulating');

    if (dropCond) {
      if (this.classified.conductive.length === 0) {
        dropCond.innerHTML = `<div class="col-empty-placeholder">اسحب المواد الموصلة (كالحديد والنحاس) هنا ⚡</div>`;
      } else {
        dropCond.innerHTML = this.classified.conductive.map(item => `
          <div class="classified-item">
            <div class="classified-item-info">
              <span class="classified-item-icon">${renderIcon(item.icon)}</span>
              <div>
                <strong>${item.name}</strong>
                <small>${item.material}</small>
              </div>
            </div>
            <span class="classified-item-check" title="تصنيف صحيح">✓</span>
          </div>
        `).join('');
      }
    }

    if (dropIns) {
      if (this.classified.insulating.length === 0) {
        dropIns.innerHTML = `<div class="col-empty-placeholder">اسحب المواد العازلة (كالخشب والبلاستيك) هنا 🛡️</div>`;
      } else {
        dropIns.innerHTML = this.classified.insulating.map(item => `
          <div class="classified-item">
            <div class="classified-item-info">
              <span class="classified-item-icon">${renderIcon(item.icon)}</span>
              <div>
                <strong>${item.name}</strong>
                <small>${item.material}</small>
              </div>
            </div>
            <span class="classified-item-check" title="تصنيف صحيح">✓</span>
          </div>
        `).join('');
      }
    }
  }

  initDropZones() {
    ['conductive', 'insulating'].forEach(cat => {
      const col = document.getElementById(`col-${cat}`);
      if (!col) return;

      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.classList.add('drop-active');
      });

      col.addEventListener('dragleave', (e) => {
        if (!col.contains(e.relatedTarget)) {
          col.classList.remove('drop-active');
        }
      });

      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drop-active');
        const itemId = e.dataTransfer.getData('text/plain') || this.activeDragItem?.id;
        if (!itemId) return;
        const item = items.find(it => it.id === itemId);
        if (item) this.classifyItem(item, cat);
      });
    });
  }

  initPointerDrag(card, item) {
    let clone = null;
    let startX = 0, startY = 0;

    const onPointerMove = (e) => {
      if (!clone) return;
      clone.style.left = `${e.clientX - 30}px`;
      clone.style.top = `${e.clientY - 20}px`;

      // تسليط الضوء على العمود المستهدف
      const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
      const targetCol = elemBelow?.closest('.table-column');
      document.querySelectorAll('.table-column').forEach(c => c.classList.remove('drop-active'));
      if (targetCol) targetCol.classList.add('drop-active');
    };

    const onPointerUp = (e) => {
      if (clone) {
        clone.remove();
        clone = null;
      }
      card.style.opacity = '1';
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);

      const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
      const targetCol = elemBelow?.closest('.table-column');
      document.querySelectorAll('.table-column').forEach(c => c.classList.remove('drop-active'));

      if (targetCol) {
        const cat = targetCol.getAttribute('data-category');
        if (cat) this.classifyItem(item, cat);
      }
    };

    card.addEventListener('pointerdown', (e) => {
      // تجنب تنشيط السحب عند لمس الأزرار
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      startX = e.clientX;
      startY = e.clientY;

      clone = card.cloneNode(true);
      clone.style.position = 'fixed';
      clone.style.pointerEvents = 'none';
      clone.style.zIndex = '9999';
      clone.style.opacity = '0.85';
      clone.style.transform = 'scale(1.06)';
      clone.style.left = `${e.clientX - 30}px`;
      clone.style.top = `${e.clientY - 20}px`;
      document.body.appendChild(clone);
      card.style.opacity = '0.35';

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    });
  }

  classifyItem(item, targetCategory) {
    this.attempts++;

    // التحقق من صحة التصنيف
    if (item.category === targetCategory) {
      // نجاح!
      this.voice.playSuccess();
      this.trayItems = this.trayItems.filter(it => it.id !== item.id);
      this.classified[targetCategory].push(item);

      const quote = professorDialogs.successQuotes[Math.floor(Math.random() * professorDialogs.successQuotes.length)];
      const feedback = `${quote} «${item.name}» ${targetCategory === 'conductive' ? 'موصل ممتاز للكهرباء' : 'عازل متين للأمان'}.`;
      this.updateProfessorSpeech(feedback);
      this.voice.speak(feedback);

      this.renderPlayMode();

      // هل اكتمل فرز جميع العناصر؟
      if (this.trayItems.length === 0) {
        setTimeout(() => this.showFinalReport(), 800);
      }
    } else {
      // محاولة غير صحيحة
      this.voice.playHint();
      const card = document.getElementById(`card-${item.id}`);
      if (card) {
        card.classList.add('shaking');
        setTimeout(() => card.classList.remove('shaking'), 500);
      }

      const retryQuote = professorDialogs.retryQuotes[Math.floor(Math.random() * professorDialogs.retryQuotes.length)];
      const feedback = `${retryQuote} تلميح: ${item.hint}`;
      this.updateProfessorSpeech(feedback);
      this.voice.speak(feedback);
    }
  }

  resetPlayMode() {
    this.trayItems = [...items];
    this.classified = { conductive: [], insulating: [] };
    this.attempts = 0;
    this.startTime = Date.now();
    this.renderPlayMode();
    this.updateProfessorSpeech(professorDialogs.playIntro.text);
    this.voice.speak(professorDialogs.playIntro.text);
  }

  showFinalReport() {
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
    const report = generateProfessorReport({
      totalItems: items.length,
      attempts: this.attempts,
      elapsedSeconds
    });

    this.lastReport = report;
    this.saveProgress(report);

    // تحديث عناصر النافذة
    document.getElementById('rep-rank').textContent = report.rank;
    document.getElementById('rep-accuracy').textContent = `${report.accuracy}%`;
    document.getElementById('rep-attempts').textContent = report.attempts;
    document.getElementById('rep-time').textContent = report.timeFormatted;
    document.getElementById('rep-eval').textContent = report.evaluation;
    document.getElementById('rep-advice').textContent = `💡 توجيه البروفيسور: ${report.advice}`;

    const modal = document.getElementById('report-modal');
    modal?.removeAttribute('hidden');

    this.voice.playFanfare();
    const congratulation = `مبارك يا بطل العلوم! لقد أنجزت التحدي بدقة ${report.accuracy} بالمئة. ${report.evaluation}`;
    this.voice.speak(congratulation);
  }

  closeReport() {
    const modal = document.getElementById('report-modal');
    modal?.setAttribute('hidden', '');
  }

  // ══ الكاميرا والتعرف البصري ══
  initCameraEvents() {
    const btnOpen = document.getElementById('btn-camera-open');
    const btnClose = document.getElementById('btn-camera-close');
    const btnCapture = document.getElementById('btn-camera-capture');
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-video');

    let stream = null;

    btnOpen?.addEventListener('click', async () => {
      try {
        modal?.removeAttribute('hidden');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (video) video.srcObject = stream;
        this.updateProfessorSpeech(professorDialogs.cameraReady.text);
      } catch (err) {
        alert('تعذّر الوصول إلى الكاميرا: ' + (err.message || 'الرجاء السماح بالوصول للكاميرا في المتصفح.'));
        modal?.setAttribute('hidden', '');
      }
    });

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
      }
      modal?.setAttribute('hidden', '');
    };

    btnClose?.addEventListener('click', stopCamera);

    btnCapture?.addEventListener('click', async () => {
      if (!video) return;
      const canvas = imageToCanvas(video);
      let matchedItem = items[0];

      try {
        const { cv } = await loadCV();
        matchedItem = await matchConductorItem(canvas, cv);
      } catch {
        // بديل تلقائي
        matchedItem = items[Math.floor(Math.random() * items.length)];
      }

      stopCamera();

      // تنبيه الطالب بالعنصر المطابق
      const foundMsg = `الرؤية الحاسوبية تعرّفت على «${matchedItem.name}» من كتاب العلوم! اسحبه إلى العمود المناسب.`;
      this.updateProfessorSpeech(foundMsg);
      this.voice.speak(foundMsg);

      // وميض بطاقة العنصر في الصينية
      const card = document.getElementById(`card-${matchedItem.id}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.transform = 'scale(1.2)';
        card.style.borderColor = 'var(--purple)';
        setTimeout(() => {
          card.style.transform = '';
          card.style.borderColor = '';
        }, 1200);
      }
    });
  }

  render() {
    this.setMode('learn');
  }
}

// تشغيل التطبيق بمجرد اكتمال تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
  window.conductorsApp = new ConductorsApp();
});
