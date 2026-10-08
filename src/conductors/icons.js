// ═══════════════════════════════════════════════════════════════════════════
// src/conductors/icons.js — أيقونات المتجهات (SVG) لمحطة الموصلات والعوازل
// ═══════════════════════════════════════════════════════════════════════════

export const icons = {
  // مسمار حديدي
  nail: `
    <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 12h24v4H12z" fill="#95a5a6"/>
      <path d="M22 16v22l2 4 2-4V16z" fill="#7f8c8d"/>
      <line x1="20" y1="22" x2="28" y2="22" stroke="#bdc3c7"/>
      <line x1="20" y1="28" x2="28" y2="28" stroke="#bdc3c7"/>
    </svg>
  `,
  // قلم رصاص خشب
  pencil: `
    <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 38l4-16L34 6l8 8-16 20-16 4z" fill="#f39c12"/>
      <path d="M10 38l4-4 4 4-8 0z" fill="#2c3e50"/>
      <path d="M34 6l8 8" stroke="#d35400"/>
      <line x1="18" y1="18" x2="26" y2="26" stroke="#e67e22"/>
    </svg>
  `,
  // ملعقة معدنية
  spoon: `
    <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="24" cy="15" rx="10" ry="12" fill="#ecf0f1"/>
      <path d="M22 27v15a2 2 0 0 0 4 0V27" fill="#bdc3c7"/>
      <path d="M20 12c0 4 2 7 4 7s4-3 4-7" stroke="#95a5a6"/>
    </svg>
  `,
  // مسطرة بلاستيكية
  ruler: `
    <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="8" y="16" width="32" height="16" rx="3" fill="#3498db" fill-opacity="0.8"/>
      <line x1="14" y1="16" x2="14" y2="23" stroke="#fff"/>
      <line x1="20" y1="16" x2="20" y2="21" stroke="#fff"/>
      <line x1="26" y1="16" x2="26" y2="23" stroke="#fff"/>
      <line x1="32" y1="16" x2="32" y2="21" stroke="#fff"/>
      <line x1="38" y1="16" x2="38" y2="23" stroke="#fff"/>
    </svg>
  `,
  // سلك نحاسي
  wire: `
    <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 32c8 0 8-16 16-16s8 16 16 16" stroke="#e67e22"/>
      <circle cx="8" cy="32" r="3" fill="#d35400"/>
      <circle cx="40" cy="32" r="3" fill="#d35400"/>
      <path d="M12 28l4-4" stroke="#f39c12"/>
    </svg>
  `,
  // ممحاة مطاطية
  eraser: `
    <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 34l8 8 20-14-8-8-20 14z" fill="#ff7675"/>
      <path d="M22 24l8 8-10 7-8-8 10-7z" fill="#74b9ff"/>
      <line x1="12" y1="34" x2="20" y2="42" stroke="#2d3436"/>
    </svg>
  `,
  // مشبك ورق معدني
  clip: `
    <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 20v14a8 8 0 0 0 16 0V14a6 6 0 0 0-12 0v18a4 4 0 0 0 8 0V18" stroke="#7f8c8d" fill="none"/>
    </svg>
  `,
  // كرة زجاجية
  marble: `
    <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="24" cy="24" r="16" fill="#a8e6cf" fill-opacity="0.85" stroke="#2ecc71"/>
      <ellipse cx="20" cy="18" rx="4" ry="2" fill="#fff" fill-opacity="0.9" transform="rotate(-30 20 18)"/>
      <path d="M16 26c4 6 12 6 16 0" stroke="#27ae60" stroke-dasharray="2 2"/>
    </svg>
  `,
  // بروفيسور
  professor: `
    <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <!-- قبعة التخرج -->
      <path d="M24 6L6 16l18 10 18-10L24 6z" fill="#55408e"/>
      <path d="M42 16v10" stroke="#df9e19" stroke-width="3"/>
      <circle cx="42" cy="28" r="2" fill="#df9e19"/>
      <!-- الوجه والنظارة -->
      <circle cx="24" cy="28" r="10" fill="#ffeaa7"/>
      <!-- النظارة -->
      <circle cx="20" cy="27" r="3.5" stroke="#2d3436" fill="none"/>
      <circle cx="28" cy="27" r="3.5" stroke="#2d3436" fill="none"/>
      <line x1="23.5" y1="27" x2="24.5" y2="27" stroke="#2d3436"/>
      <!-- الابتسامة -->
      <path d="M21 33c1.5 1.5 4.5 1.5 6 0" stroke="#d63031"/>
    </svg>
  `
};

export function renderIcon(name) {
  return icons[name] || icons.nail;
}
