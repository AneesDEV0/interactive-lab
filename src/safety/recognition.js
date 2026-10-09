// ═══════════════════════════════════════════════════════════════════════════
// src/safety/recognition.js — محرك التعرف البصري عبر الكاميرا (OpenCV.js)
// ═══════════════════════════════════════════════════════════════════════════

import { items } from './data.js';

let cvPromise = null;

export function loadCV() {
  if (cvPromise) return cvPromise;
  cvPromise = new Promise((resolve, reject) => {
    if (window.cv && window.cv.Mat) {
      resolve({ cv: window.cv });
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('تأخر تجهيز محرك المطابقة البصرية. يمكنك اختيار الموقف مباشرة من القائمة.'));
    }, 25000);

    const script = document.createElement('script');
    script.src = 'vendor/opencv.js';
    script.async = true;

    script.onerror = () => {
      clearTimeout(timer);
      cvPromise = null;
      reject(new Error('تعذّر تحميل OpenCV.js محلياً. اختر الموقف من القائمة.'));
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

async function imageCanvas(source) {
  const img = new Image();
  img.src = source;
  await img.decode();

  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 800 / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function recognize(source) {
  const { cv } = await loadCV();
  const canvas = await imageCanvas(source);

  const input = cv.imread(canvas);
  const gray = new cv.Mat();
  cv.cvtColor(input, gray, cv.COLOR_RGBA2GRAY);
  input.delete();

  const orb = new cv.ORB(1000, 1.2, 8, 12, 0, 2, 0, 31, 10);
  const kp = new cv.KeyPointVector();
  const desc = new cv.Mat();
  const mask = new cv.Mat();

  orb.detectAndCompute(gray, mask, kp, desc);
  gray.delete();
  mask.delete();

  const scores = [];

  try {
    if (desc.rows < 8) return null;

    for (const item of items) {
      const refPaths = [
        `assets/thumbnails/safety/${item.id}.svg`,
        `assets/book/safety_page89.png`,
        `assets/book/safety_page90.png`
      ];

      for (const refPath of refPaths) {
        try {
          const refCanvas = await imageCanvas(refPath);
          const raw = cv.imread(refCanvas);
          const refGray = new cv.Mat();
          cv.cvtColor(raw, refGray, cv.COLOR_RGBA2GRAY);
          raw.delete();

          const rk = new cv.KeyPointVector();
          const rd = new cv.Mat();
          const rm = new cv.Mat();
          orb.detectAndCompute(refGray, rm, rk, rd);
          refGray.delete();
          rm.delete();

          const matcher = new cv.BFMatcher(cv.NORM_HAMMING, false);
          const matches = new cv.DMatchVectorVector();
          const pointsA = [];
          const pointsB = [];

          try {
            if (rd.rows >= 8) {
              matcher.knnMatch(rd, desc, matches, 2);
              for (let i = 0; i < matches.size(); i++) {
                const pair = matches.get(i);
                if (pair.size() >= 2) {
                  const a = pair.get(0);
                  const b = pair.get(1);
                  if (a.distance < 0.75 * b.distance && a.distance < 68) {
                    const p = rk.get(a.queryIdx).pt;
                    const q = kp.get(a.trainIdx).pt;
                    pointsA.push(p.x, p.y);
                    pointsB.push(q.x, q.y);
                  }
                }
                pair.delete();
              }

              if (pointsA.length >= 14) {
                const a = cv.matFromArray(pointsA.length / 2, 1, cv.CV_32FC2, pointsA);
                const b = cv.matFromArray(pointsB.length / 2, 1, cv.CV_32FC2, pointsB);
                const inliers = new cv.Mat();
                const h = cv.findHomography(a, b, cv.RANSAC, 5, inliers);
                let count = 0;
                for (const n of inliers.data) count += n;
                const ratio = count / (pointsA.length / 2);

                if (!h.empty() && count >= 7 && ratio > 0.45) {
                  scores.push({ id: item.id, score: count, ratio, name: item.name });
                }

                a.delete();
                b.delete();
                inliers.delete();
                h.delete();
              }
            }
          } finally {
            matcher.delete();
            matches.delete();
            rk.delete();
            rd.delete();
          }

          if (scores.some(s => s.id === item.id)) break;
        } catch {}
      }
    }

    if (scores.length > 0) {
      scores.sort((a, b) => b.score - a.score);
      return scores[0];
    }

    return null;
  } finally {
    orb.delete();
    kp.delete();
    desc.delete();
  }
}
