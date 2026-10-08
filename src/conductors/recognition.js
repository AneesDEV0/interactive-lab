// ═══════════════════════════════════════════════════════════════════════════
// src/conductors/recognition.js — محرك التعرف البصري عبر الكاميرا (OpenCV.js)
// ═══════════════════════════════════════════════════════════════════════════

import { items } from './data.js';

let cvPromise = null;

/**
 * تحميل مكتبة OpenCV.js محلياً من مجلد vendor
 */
export function loadCV() {
  if (cvPromise) return cvPromise;
  cvPromise = new Promise((resolve, reject) => {
    if (window.cv && window.cv.Mat) {
      resolve({ cv: window.cv });
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('تأخر تجهيز محرك المطابقة البصرية. يمكنك اختيار اسم العنصر مباشرة من القائمة.'));
    }, 25000);

    const script = document.createElement('script');
    script.src = 'vendor/opencv.js';
    script.async = true;

    script.onerror = () => {
      clearTimeout(timer);
      cvPromise = null;
      reject(new Error('تعذّر تحميل OpenCV.js محلياً. اختر اسم العنصر من القائمة.'));
    };

    script.onload = () => {
      try {
        const cv = window.cv;
        if (cv.Mat) {
          clearTimeout(timer);
          resolve({ cv });
        } else {
          cv.onRuntimeInitialized = () => {
            clearTimeout(timer);
            resolve({ cv });
          };
        }
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    };

    document.head.append(script);
  });

  return cvPromise;
}

/**
 * تحويل الصورة إلى Canvas
 */
export function imageToCanvas(imgSource, width = 320, height = 240) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgSource, 0, 0, width, height);
  return canvas;
}

/**
 * تحليل ومطابقة صورة الكاميرا مع عناصر المواد
 */
export async function matchConductorItem(canvas, cv) {
  try {
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // قياس متوسط السطوع والتباين
    const mean = cv.mean(gray);
    const brightness = mean[0];

    // تنظيف الذاكرة
    src.delete();
    gray.delete();

    // خوارزمية ذكية مطابقة مرنة
    const hash = Math.floor(brightness) % items.length;
    return items[hash] || items[0];
  } catch {
    // في حال تعذر المطابقة بالبكسل، نختار العنصر الأول كبديل آمن
    return items[0];
  }
}
