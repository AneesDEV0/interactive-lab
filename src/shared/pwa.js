import { icon } from '../electricity/icons.js';
import { modal } from './components.js';

let deferredPrompt = window.__deferredPwaPrompt || null;
const promptWaiters = new Set();

function refreshManifestLink() {
  let link = document.querySelector('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }
  link.href = 'manifest.webmanifest?v=' + Date.now();
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    window.__deferredPwaPrompt = e;
    for (const resolve of promptWaiters) resolve(e);
    promptWaiters.clear();
    const directBtn = document.getElementById('pwa-direct-install');
    if (directBtn) directBtn.hidden = false;
  });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready).then(() => {
      if (!deferredPrompt && !window.__deferredPwaPrompt) {
        refreshManifestLink();
      }
    }).catch(() => {});
  }
}

function waitForDeferredPrompt(timeoutMs = 800) {
  if (deferredPrompt || window.__deferredPwaPrompt) {
    return Promise.resolve(deferredPrompt || window.__deferredPwaPrompt);
  }
  refreshManifestLink();
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      promptWaiters.delete(onPrompt);
      resolve(deferredPrompt || window.__deferredPwaPrompt);
    }, timeoutMs);
    function onPrompt(p) {
      clearTimeout(timer);
      resolve(p);
    }
    promptWaiters.add(onPrompt);
  });
}

export function detectInstallPlatform(ua = navigator.userAgent || '', platform = navigator.platform || '', maxTouch = navigator.maxTouchPoints || 0) {
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouch > 1);
  if (isIOS) {
    const isCriOS = /CriOS|EdgiOS|FxiOS|OPiOS/.test(ua);
    return isCriOS ? 'ios-other' : 'ios-safari';
  }
  if (/Android/i.test(ua)) return 'android';
  if (/Firefox/i.test(ua)) return 'desktop-firefox';
  if (/Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua)) return 'macos-safari';
  return 'desktop';
}

const GUIDES = {
  'ios-safari': {
    badge: 'آيفون وآيباد · متصفح Safari',
    note: 'نظام iOS في آيفون وآيباد لا يسمح بالتثبيت التلقائي؛ ثبّت التطبيق في ٣ خطوات سريعة:',
    steps: [
      `اضغط على زر <strong>المشاركة (Share)</strong> ${icon('share')} في شريط Safari بالأسفل (أو أعلى الشاشة في آيباد).`,
      'مرّر القائمة إلى الأسفل واختر <strong>«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)</strong>.',
      'اضغط <strong>«إضافة» (Add)</strong> في الزاوية العلوية ليظهر التطبيق بأيقونته على شاشتك.'
    ]
  },
  'ios-other': {
    badge: 'آيفون وآيباد · متصفح Chrome',
    note: 'لتثبيت التطبيق على الشاشة الرئيسية في آيفون أو آيباد من متصفحك الحالي:',
    steps: [
      `اضغط على زر <strong>المشاركة (Share)</strong> ${icon('share')} بجانب شريط العنوان في الأعلى.`,
      'اختر <strong>«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)</strong> من القائمة.',
      'اضغط <strong>«إضافة» (Add)</strong> ليظهر التطبيق بأيقونته على جهازك.'
    ]
  },
  android: {
    badge: 'الجوال والتابلت · أندرويد',
    note: 'لتثبيت التطبيق على شاشة هاتفك أو التابلت:',
    steps: [
      'اضغط على قائمة المتصفح <strong>(⋮)</strong> في أعلى الشاشة.',
      'اختر <strong>«تثبيت التطبيق» (Install app)</strong> أو <strong>«الإضافة إلى الشاشة الرئيسية»</strong>.',
      'اضغط <strong>«تثبيت»</strong> ليظهر التطبيق بأيقونته مع تطبيقاتك.'
    ]
  },
  'macos-safari': {
    badge: 'حاسوب ماك · متصفح Safari',
    note: 'لتثبيت التطبيق على جهاز Mac من متصفح Safari:',
    steps: [
      `اضغط على زر <strong>المشاركة</strong> ${icon('share')} أو قائمة <strong>ملف (File)</strong> في الأعلى.`,
      'اختر <strong>«إضافة إلى شريط Dock» (Add to Dock)</strong>.',
      'اضغط <strong>«إضافة» (Add)</strong> لتشغيل المختبر كتطبيق مستقل.'
    ]
  },
  'desktop-firefox': {
    badge: 'اللابتوب والحاسوب · متصفح Firefox',
    note: 'متصفح Firefox على الحاسوب لا يدعم تثبيت تطبيقات الويب مباشرة:',
    steps: [
      'افتح هذا الرابط في متصفح <strong>Google Chrome</strong> أو <strong>Microsoft Edge</strong>.',
      `اضغط على زر <strong>تنزيل</strong> ${icon('download')} في أعلى المنصة ليظهر لك خيار التثبيت المباشر.`,
      'أكّد الضغط على <strong>«تثبيت»</strong> لينزل التطبيق مباشرة على سطح المكتب.'
    ]
  },
  desktop: {
    badge: 'اللابتوب والحاسوب · Chrome / Edge',
    note: 'التطبيق مثبّت مسبقًا على متصفحك، أو يمكنك فتحه/تثبيته من شريط العنوان أعلى المتصفح:',
    steps: [
      `اضغط على أيقونة <strong>التطبيق / التثبيت</strong> ${icon('download')} في شريط العنوان أعلى المتصفح، أو افتح القائمة <strong>(⋮)</strong>.`,
      'اختر <strong>«تثبيت مختبر الكهرباء والمغناطيسية» (Install app)</strong>.',
      'اضغط <strong>«تثبيت»</strong> ليفتح التطبيق بأيقونته الخاصة على جهازك.'
    ]
  }
};

export function pwaDialogMarkup() {
  return modal(
    'pwa-install-dialog',
    'تثبيت تطبيق المختبر على جهازك',
    `<div class="pwa-dialog-card">
      <img src="public/icon-192.png" alt="أيقونة مختبر شرارة" width="56" height="56" class="pwa-app-icon">
      <div>
        <strong>مختبر الكهرباء والمغناطيسية</strong>
        <small>مختبر شرارة · يعمل كتطبيق مستقل على الجوال واللابتوب</small>
      </div>
    </div>
    <button id="pwa-direct-install" class="primary pwa-direct-btn" hidden>${icon('download')}<span>تثبيت مباشر الآن</span></button>
    <div class="pwa-platform-tabs" role="tablist" aria-label="اختر نوع جهازك">
      <button type="button" data-pwa-tab="ios-safari" class="pwa-tab">آيفون / آيباد</button>
      <button type="button" data-pwa-tab="android" class="pwa-tab">جوال أندرويد</button>
      <button type="button" data-pwa-tab="desktop" class="pwa-tab">لابتوب / حاسوب</button>
    </div>
    <div id="pwa-guide-box" class="pwa-guide-box" aria-live="polite"></div>`
  );
}

function renderGuide(platformKey) {
  const guide = GUIDES[platformKey] || GUIDES.desktop;
  const box = document.getElementById('pwa-guide-box');
  if (!box) return;
  box.innerHTML = `<span class="pwa-badge">${guide.badge}</span><p class="pwa-note">${guide.note}</p><ol class="help-steps pwa-steps">${guide.steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
  const activeTab = platformKey.startsWith('ios') ? 'ios-safari' : platformKey === 'android' ? 'android' : 'desktop';
  document.querySelectorAll('[data-pwa-tab]').forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.dataset.pwaTab === activeTab));
  });
}

function isStandalone() {
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator?.standalone === true
  );
}

export function mountPWA() {
  if (!document.getElementById('pwa-install-dialog')) {
    document.body.insertAdjacentHTML('beforeend', pwaDialogMarkup());
  }

  const updateInstallButtons = () => {
    const installed = isStandalone();
    const headerBtn = document.getElementById('pwa-install');
    const directBtn = document.getElementById('pwa-direct-install');
    if (headerBtn) headerBtn.hidden = installed;
    if (directBtn) directBtn.hidden = !(deferredPrompt || window.__deferredPwaPrompt) || installed;
  };

  const detected = detectInstallPlatform();
  renderGuide(detected);
  updateInstallButtons();

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.__deferredPwaPrompt = null;
    updateInstallButtons();
    const dlg = document.getElementById('pwa-install-dialog');
    if (dlg?.open) dlg.close();
  });

  document.addEventListener('click', async e => {
    const tab = e.target.closest('[data-pwa-tab]');
    if (tab) {
      const targetKey = tab.dataset.pwaTab === 'ios-safari' && detected === 'ios-other'
        ? 'ios-other'
        : tab.dataset.pwaTab === 'desktop' && (detected === 'macos-safari' || detected === 'desktop-firefox')
          ? detected
          : tab.dataset.pwaTab;
      renderGuide(targetKey);
      return;
    }

    const trigger = e.target.closest('#pwa-install, #pwa-direct-install');
    if (!trigger) return;

    let promptEvent = deferredPrompt || window.__deferredPwaPrompt;
    if (!promptEvent && !detected.startsWith('ios')) {
      promptEvent = await waitForDeferredPrompt(800);
    }

    if (promptEvent) {
      deferredPrompt = null;
      window.__deferredPwaPrompt = null;
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome !== 'accepted') {
          setTimeout(refreshManifestLink, 300);
        }
      } catch {
        setTimeout(refreshManifestLink, 300);
      }
      updateInstallButtons();
      return;
    }

    renderGuide(detectInstallPlatform());
    const dlg = document.getElementById('pwa-install-dialog');
    if (dlg && !dlg.open) dlg.showModal();
  });
}
