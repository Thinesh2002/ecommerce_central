export const BASE_CSS = `
/* ═══════════════════════════════════════════════════════════════
   BASE CSS — Lumina Home Lighting Template
   Sections:
     1.  Custom Properties (Design Tokens)
     2.  Reset & Base
     3.  Typography
     4.  Layout Utilities
     5.  Visibility Helpers
     6.  Buttons
     7.  Header / Nav
     8.  Hero Section
     9.  Banners
    10.  Compare Products & Table
    11.  Grid Cards
    12.  Slider
    13.  Footer
    14.  Animations
    15.  Mobile (≤768px)
    16.  Small Mobile (≤480px)
═══════════════════════════════════════════════════════════════ */

/* ── 1. Custom Properties ─────────────────────────────────────── */
:root {
  /* Brand */
  --color-primary:       #f59e0b;
  --color-primary-dark:  #d97706;
  --color-primary-light: #fde68a;
  --color-accent:        #1e3a5f;
  --color-accent-light:  #2d5282;

  /* Neutrals */
  --color-bg:            #ffffff;
  --color-surface:       #f8fafc;
  --color-border:        #e2e8f0;
  --color-text:          #1a202c;
  --color-text-muted:    #64748b;
  --color-text-light:    #94a3b8;
  --color-white:         #ffffff;

  /* Shadows */
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06);
  --shadow-lg:   0 10px 40px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.08);
  --shadow-card: 0 2px 8px rgba(0,0,0,0.07);

  /* Spacing */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  40px;
  --space-2xl: 64px;

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 999px;

  /* Typography */
  --font-body:    'Segoe UI', system-ui, -apple-system, sans-serif;
  --font-heading: Georgia, 'Times New Roman', serif;

  /* Transitions */
  --ease-out:   cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast:   150ms;
  --duration-base:   250ms;
  --duration-slow:   400ms;
  --duration-slider: 22s;
}

/* ── 2. Reset & Base ──────────────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

img {
  display: block;
  max-width: 100%;
  height: auto;
}

a {
  color: inherit;
  text-decoration: none;
}

ul, ol { list-style: none; }

/* ── 3. Typography ────────────────────────────────────────────── */
h1, h2, h3, h4 {
  font-family: var(--font-heading);
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

h1 { font-size: clamp(28px, 5vw, 56px); }
h2 { font-size: clamp(22px, 3.5vw, 38px); }
h3 { font-size: clamp(18px, 2.5vw, 26px); }
h4 { font-size: clamp(15px, 2vw, 20px); }

p  { font-size: clamp(14px, 1.5vw, 16px); color: var(--color-text-muted); }

/* ── 4. Layout Utilities ──────────────────────────────────────── */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
}

.section {
  padding: var(--space-2xl) 0;
}

.section-title {
  text-align: center;
  margin-bottom: var(--space-xl);
  font-family: var(--font-heading);
  font-size: clamp(22px, 3vw, 34px);
  color: var(--color-text);
  position: relative;
  padding-bottom: var(--space-md);
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background: var(--color-primary);
  border-radius: var(--radius-pill);
}

/* ── 5. Visibility Helpers ────────────────────────────────────── */
.desktop-only  { display: flex; }
.mobile-header { display: none; }
.desktop-img   { display: block; }
.mobile-img    { display: none; }

/* ── 6. Buttons ───────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: 13px 28px;
  background: var(--color-primary);
  color: var(--color-white);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  transition:
    background  var(--duration-base) var(--ease-in-out),
    transform   var(--duration-fast) var(--ease-out),
    box-shadow  var(--duration-base) var(--ease-in-out);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35);
  white-space: nowrap;
}

.btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.45);
}

.btn:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 1px 4px rgba(245, 158, 11, 0.3);
}

.btn-outline {
  background: transparent;
  color: var(--color-white);
  border: 2px solid rgba(255,255,255,0.75);
  box-shadow: none;
}

.btn-outline:hover {
  background: rgba(255,255,255,0.15);
  border-color: var(--color-white);
  box-shadow: none;
}

.btn-dark {
  background: var(--color-accent);
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.35);
}

.btn-dark:hover {
  background: var(--color-accent-light);
  box-shadow: 0 4px 16px rgba(30, 58, 95, 0.45);
}

/* ── 7. Header / Nav ──────────────────────────────────────────── */
.site-header {
  background: var(--color-accent);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-md);
}

.site-header nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  padding: var(--space-md) var(--space-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.nav-logo { display: flex; flex-direction: column; line-height: 1.1; }
.nav-logo .logo-primary { font-size: 22px; font-weight: 900; color: var(--color-primary); letter-spacing: -0.03em; }
.nav-logo .logo-secondary { font-size: 11px; color: rgba(255,255,255,0.55); letter-spacing: 0.15em; text-transform: uppercase; }

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex: 1;
  justify-content: center;
}

.nav-links a {
  color: rgba(255,255,255,0.8);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast), background var(--duration-fast);
}

.nav-links a:hover {
  color: var(--color-white);
  background: rgba(255,255,255,0.1);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

/* ── 8. Hero Section ──────────────────────────────────────────── */
.hero-section {
  min-height: 540px;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
}

/* Gradient overlay */
.hero-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    rgba(10, 25, 50, 0.78) 0%,
    rgba(10, 25, 50, 0.45) 55%,
    rgba(10, 25, 50, 0.10) 100%
  );
  z-index: 1;
}

.hero-text {
  position: relative;
  z-index: 2;
  color: var(--color-white);
  padding: var(--space-2xl) var(--space-lg);
  max-width: 620px;
  margin-left: var(--space-xl);
  animation: heroFadeUp 0.8s var(--ease-out) both;
}

.hero-badge {
  display: inline-block;
  background: var(--color-primary);
  color: var(--color-white);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: var(--radius-pill);
  margin-bottom: var(--space-md);
}

.hero-text h1 {
  font-size: clamp(32px, 6vw, 64px);
  color: var(--color-white);
  line-height: 1.05;
  margin-bottom: var(--space-md);
}

.hero-text h1 .highlight {
  color: var(--color-primary);
  position: relative;
}

.hero-text p {
  font-size: clamp(15px, 1.8vw, 18px);
  color: rgba(255,255,255,0.85);
  margin-bottom: var(--space-xl);
  max-width: 480px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

/* ── 9. Banners ───────────────────────────────────────────────── */
.banner-wrap { display: block; width: 100%; line-height: 0; }

.banner-wrap img {
  width: 100%;
  object-fit: cover;
  transition: opacity var(--duration-slow);
}

/* Multi-banner list carousel */
.banner-list {
  display: flex;
  gap: var(--space-md);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: var(--space-sm);
}

.banner-list::-webkit-scrollbar { display: none; }

.banner-list .banner-wrap {
  flex: 0 0 100%;
  scroll-snap-align: start;
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* ── 10. Compare Products & Table ─────────────────────────────── */
.compare-products {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--space-lg);
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto var(--space-xl);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
  padding-bottom: var(--space-sm);
}

.product-card {
  width: 230px;
  text-align: center;
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
  scroll-snap-align: start;
  background: var(--color-bg);
  box-shadow: var(--shadow-card);
  transition: transform var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.product-card img {
  width: 100%;
  height: 180px;
  object-fit: contain;
  margin-bottom: var(--space-md);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.product-card h3 {
  font-size: 15px;
  margin-bottom: var(--space-sm);
  color: var(--color-text);
}

.product-card .price {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-accent);
  margin-bottom: var(--space-sm);
}

.product-card .reviews {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: var(--space-md);
}

.product-card button,
.compare-products button {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  padding: 10px 22px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background var(--duration-base), transform var(--duration-fast);
}

.product-card button:hover,
.compare-products button:hover {
  background: var(--color-primary-dark);
  transform: scale(1.04);
}

/* Comparison table */
.desktop-compare-table {
  max-width: 1200px;
  margin: 0 auto;
  overflow-x: auto;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.desktop-compare-table table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-bg);
}

.desktop-compare-table th {
  padding: var(--space-md) var(--space-lg);
  background: var(--color-accent);
  color: var(--color-white);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: center;
}

.desktop-compare-table td {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;
  text-align: center;
  color: var(--color-text-muted);
}

.desktop-compare-table tr:last-child td { border-bottom: none; }
.desktop-compare-table tr:nth-child(even) td { background: var(--color-surface); }

.desktop-compare-table td:first-child {
  font-weight: 600;
  color: var(--color-text);
  text-align: left;
}

/* ── 11. Grid Cards ───────────────────────────────────────────── */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
}

.card {
  position: relative;
  height: 300px;
  overflow: hidden;
  cursor: pointer;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-slow) var(--ease-out);
}

.card:hover img {
  transform: scale(1.08);
}

.card .content {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: var(--space-lg);
  color: var(--color-white);
  background: linear-gradient(
    to top,
    rgba(0,0,0,0.72) 0%,
    rgba(0,0,0,0.28) 55%,
    transparent 100%
  );
  transition: background var(--duration-base);
}

.card:hover .content {
  background: linear-gradient(
    to top,
    rgba(0,0,0,0.82) 0%,
    rgba(0,0,0,0.38) 55%,
    rgba(0,0,0,0.05) 100%
  );
}

.card .content h2 {
  font-size: clamp(18px, 2.5vw, 24px);
  color: var(--color-white);
  margin-bottom: var(--space-xs);
}

.card .content p {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  margin-bottom: var(--space-md);
}

.card .content .btn {
  align-self: flex-start;
  padding: 9px 20px;
  font-size: 12px;
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity  var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.card:hover .content .btn {
  opacity: 1;
  transform: translateY(0);
}

/* ── 12. Slider ───────────────────────────────────────────────── */
.slider {
  width: 100%;
  height: 480px;
  overflow: hidden;
  position: relative;
}

.slides {
  display: flex;
  height: 100%;
  animation: slideAnim var(--duration-slider) infinite var(--ease-in-out);
}

/* Dynamically set width based on slide count in generateHtml */
.slide {
  width: 100%;
  flex-shrink: 0;
  position: relative;
  text-decoration: none;
}

.slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    rgba(0,0,0,0.60) 0%,
    rgba(0,0,0,0.20) 60%,
    transparent 100%
  );
}

.slide .content {
  position: absolute;
  top: 50%;
  left: 80px;
  transform: translateY(-50%);
  z-index: 2;
  color: var(--color-white);
  max-width: 480px;
}

.slide .content h1 {
  font-size: clamp(36px, 6vw, 72px);
  color: var(--color-white);
  line-height: 1.0;
  margin-bottom: var(--space-sm);
}

.slide .content h1 span {
  color: var(--color-primary);
}

.slide .content p {
  font-size: clamp(16px, 2vw, 22px);
  color: rgba(255,255,255,0.88);
  margin-bottom: var(--space-lg);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

@keyframes slideAnim {
  0%,  20% { transform: translateX(0%); }
  25%, 45% { transform: translateX(-25%); }
  50%, 70% { transform: translateX(-50%); }
  75%, 95% { transform: translateX(-75%); }
  100%      { transform: translateX(0%); }
}

/* ── 13. Footer ───────────────────────────────────────────────── */
.site-footer {
  background: var(--color-accent);
  color: rgba(255,255,255,0.65);
  text-align: center;
  padding: var(--space-xl) var(--space-lg);
  font-size: 13px;
}

.site-footer a {
  color: var(--color-primary-light);
  text-decoration: underline;
}

/* ── 14. Animations ───────────────────────────────────────────── */
@keyframes heroFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

/* ── 15. Mobile (≤768px) ──────────────────────────────────────── */
@media (max-width: 768px) {
  :root {
    --space-lg: 16px;
    --space-xl: 28px;
    --space-2xl: 44px;
  }

  .desktop-only  { display: none !important; }
  .mobile-header { display: block !important; }
  .desktop-img   { display: none !important; }
  .mobile-img    { display: block !important; }

  /* Grid: 2 columns on tablet */
  .grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-md); }
  .card { height: 240px; }

  /* Hero */
  .hero-section { min-height: 420px; }
  .hero-text {
    margin-left: 0;
    padding: var(--space-xl) var(--space-lg);
    text-align: center;
    max-width: 100%;
  }
  .hero-actions { justify-content: center; }

  /* Products: 2 per row */
  .compare-products { flex-wrap: wrap; justify-content: center; overflow-x: hidden; }
  .product-card { width: calc(50% - var(--space-sm)); }
  .product-card img { height: 140px; }

  /* Slider */
  .slider { height: 360px; }
  .slide .content { left: var(--space-lg); right: var(--space-lg); max-width: 100%; }

  /* Hide comparison table */
  .desktop-compare-table { display: none !important; }
}

/* ── 16. Small Mobile (≤480px) ────────────────────────────────── */
@media (max-width: 480px) {
  .grid { grid-template-columns: 1fr; }
  .card { height: 220px; }

  .compare-products { gap: var(--space-sm); }
  .product-card { width: 100%; max-width: 280px; }

  .slider { height: 300px; }

  .hero-text { padding: var(--space-lg); }

  .btn { padding: 11px 20px; font-size: 13px; }
}
`;