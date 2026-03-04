// src/pages/Ebay/Template_Generate/template/generateHtml.js

import { BASE_HTML } from "../template/baseTemplate";
import { BASE_CSS }  from "../template/baseStyles";
import { BODY_HTML } from "../template/bodyTemplate";

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Escape user-supplied strings so they're safe inside HTML attributes & text. */
const esc = (str) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Replace every occurrence of a token in a string. */
const replace = (html, token, value) =>
  html.replaceAll(`{{${token}}}`, value ?? "");

/** Replace a list of [token, value] pairs in one pass. */
const replaceAll = (html, pairs) =>
  pairs.reduce((acc, [token, value]) => replace(acc, token, value), html);

/** Warn in dev when a token is still present after generation. */
const warnLeftover = (html) => {
  if (process.env.NODE_ENV !== "production") {
    const leftovers = [...html.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((m) => m[1]);
    if (leftovers.length) {
      console.warn("[generateHtml] Unresolved tokens:", [...new Set(leftovers)]);
    }
  }
};

// ─── Section builders (pure functions → HTML strings) ─────────────────────────

/**
 * Builds <li> nav items for the desktop header.
 * Matches the <ul class="nav-links"> in BODY_HTML.
 */
function buildNavItems(navLinks = []) {
  if (!navLinks.length) return "";
  return navLinks
    .map(
      (link) =>
        `<li><a href="${esc(link.url || "#")}">${esc(link.name)}</a></li>`
    )
    .join("\n");
}

/**
 * Builds the promotional banner list.
 * Renders desktop/mobile <picture> elements for responsive images.
 */
function buildBanners(bannerList = []) {
  if (!bannerList.length) return "";
  return bannerList
    .map(
      (b) => `
    <a href="${esc(b.link || "#")}" class="banner-wrap" target="_blank" rel="noopener noreferrer">
      <picture>
        <source media="(max-width: 768px)" srcset="${esc(b.mobile || b.desktop)}">
        <img
          src="${esc(b.desktop)}"
          alt="Promotional banner"
          loading="lazy"
          width="1400"
          height="400"
        >
      </picture>
    </a>`
    )
    .join("\n");
}

/**
 * Builds the compare product cards row.
 */
function buildCompareCards(products = []) {
  if (!products.length) return "";
  return products
    .map(
      (p) => `
    <div class="product-card" role="listitem">
      <img
        src="${esc(p.image)}"
        alt="${esc(p.name)}"
        loading="lazy"
        width="220"
        height="180"
      >
      <h3>${esc(p.name)}</h3>
      ${p.price    ? `<p class="price">${esc(p.price)}</p>`   : ""}
      ${p.reviews  ? `<p class="reviews">⭐ ${esc(p.reviews)}</p>` : ""}
      <a href="${esc(p.link || "#")}" target="_blank" rel="noopener noreferrer">
        <button aria-label="Buy ${esc(p.name)}">${esc(p.button || "BUY NOW")}</button>
      </a>
    </div>`
    )
    .join("\n");
}

/**
 * Builds the <thead> header row for the comparison table.
 */
function buildCompareTableHeaders(products = []) {
  const cells = [
    `<th scope="col"></th>`,
    ...products
      .slice(0, 5)
      .map((p) => `<th scope="col">${esc(p.name)}</th>`),
  ];
  return cells.join("\n");
}

/**
 * Builds the <tbody> rows for the comparison table.
 */
function buildCompareTableRows(products = []) {
  const TABLE_SPECS = [
    { label: "Customer Reviews", key: "reviews",     render: (v) => `⭐ ${esc(v)}` },
    { label: "Price",            key: "price",        render: (v) => `<strong>${esc(v)}</strong>` },
    { label: "Material",         key: "material",     render: (v) => esc(v) },
    { label: "Light Source",     key: "lightSource",  render: (v) => esc(v) },
    { label: "Fixture Type",     key: "fixtureType",  render: (v) => esc(v) },
  ];

  const capped = products.slice(0, 5);

  return TABLE_SPECS.map(({ label, key, render }) => {
    const cells = capped.map((p) => {
      const raw = p[key];
      return `<td>${raw ? render(raw) : "—"}</td>`;
    });
    return `
    <tr>
      <td>${esc(label)}</td>
      ${cells.join("\n      ")}
    </tr>`;
  }).join("\n");
}

/**
 * Builds the category grid cards.
 */
function buildGridCards(gridCards = []) {
  if (!gridCards.length) return "";
  return gridCards
    .map(
      (c) => `
    <div class="card" role="listitem">
      <img
        src="${esc(c.image)}"
        alt="${esc(c.title)}"
        loading="lazy"
        width="400"
        height="300"
      >
      <div class="content">
        <h2>${esc(c.title)}</h2>
        <p>${esc(c.text)}</p>
        <a href="${esc(c.link || "#")}" class="btn">${esc(c.button || "View More")}</a>
      </div>
    </div>`
    )
    .join("\n");
}

/**
 * Builds the auto-playing image slider.
 * Sets --slide-count so CSS can calculate the correct translateX steps.
 */
function buildSlider(slides = []) {
  if (!slides.length) return "";

  const count = slides.length;

  // Inject slide count as CSS custom property so animation steps are dynamic
  const styleOverride = `
    <style>
      .slides {
        width: ${count * 100}%;
        --slide-count: ${count};
      }
      .slide { width: ${100 / count}%; }
    </style>`;

  const slideItems = slides
    .map(
      (s, i) => `
    
      href="${esc(s.link || "#")}"
      class="slide"
      role="listitem"
      aria-label="Slide ${i + 1}: ${esc(s.heading)}"
    >
      <img
        src="${esc(s.image)}"
        alt="${esc(s.heading)} — ${esc(s.text)}"
        loading="${i === 0 ? "eager" : "lazy"}"
        width="1200"
        height="480"
      >
      <div class="content">
        <h1><span>${esc(s.heading)}</span></h1>
        <p>${esc(s.text)}</p>
        <span class="btn">${esc(s.button || "Shop Now")}</span>
      </div>
    </a>`
    )
    .join("\n");

  return styleOverride + slideItems;
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function generateHtml(state) {
  const h = state.header;
  const currentYear = new Date().getFullYear();

  // 1. Build all dynamic HTML fragments
  const navItems         = buildNavItems(h.navLinks);
  const banners          = buildBanners(state.bannerList);
  const compareCards     = buildCompareCards(state.compareProducts);
  const compareHeaders   = buildCompareTableHeaders(state.compareProducts);
  const compareRows      = buildCompareTableRows(state.compareProducts);
  const gridCards        = buildGridCards(state.gridCards);
  const slider           = buildSlider(state.slider);

  // 2. Token replacement map — [token, value]
  const tokens = [
    // Dynamic lists
    ["NAVIGATION_MENU_ITEMS", navItems],
    ["DYNAMIC_BANNERS",       banners],
    ["COMPARE_PRODUCTS_LIST", compareCards],
    ["COMPARE_TABLE_HEADERS", compareHeaders],
    ["COMPARE_TABLE_ROWS",    compareRows],
    ["GRID_CARDS_LIST",       gridCards],
    ["SLIDER_LIST",           slider],

    // Header
    ["LOGO_TEXT_1",   esc(h.logoText1  || "LUMINA")],
    ["LOGO_TEXT_2",   esc(h.logoText2  || "HOME")],
    ["LOGO_SUBTEXT",  esc(h.logoSubtext || "Lighting & Decor")],
    ["NAV_1",         esc(h.nav1Name   || "View Our Shop")],
    ["NAV_1_URL",     esc(h.nav1Url    || "#")],
    ["NAV_BTN",       esc(h.navBtnName || "Contact Us")],
    ["NAV_BTN_URL",   esc(h.navBtnUrl  || "#")],

    // Hero
    ["HERO_BG_IMAGE",         esc(state.hero.bgImage)],
    ["HERO_BADGE",            esc(state.hero.badge)],
    ["HERO_TITLE",            esc(state.hero.title)],
    ["HERO_HIGHLIGHT",        esc(state.hero.highlight)],
    ["HERO_SUBTITLE",         esc(state.hero.subtitle)],
    ["HERO_BTN_PRIMARY",      esc(state.hero.btnPrimary)],
    ["HERO_BTN_PRIMARY_URL",  esc(state.hero.btnPrimaryUrl  || "#")],
    ["HERO_BTN_SECONDARY",    esc(state.hero.btnSecondary)],
    ["HERO_BTN_SECONDARY_URL",esc(state.hero.btnSecondaryUrl || "#")],

    // Footer / misc
    ["CURRENT_YEAR", String(currentYear)],

    // Legacy tokens — kept for backward compat with older BODY_HTML snapshots
    ["MOBILE_HOME_TEXT",    esc(h.homeText    || "HOME")],
    ["MOBILE_CONTACT_TEXT", esc(h.contactText || "CONTACT")],
    ["NAV_BUTTON",          esc(h.navBtnName  || "Contact Us")],
    ["NAV_BUTTON_URL",      esc(h.navBtnUrl   || "#")],
    ["COMPARE_TITLE",       esc(state.compareTitle || "Compare Our Products")],
    ["CART_URL",            "#"],
  ];

  // 3. Replace tokens in body
  let body = replaceAll(BODY_HTML, tokens);

  // 4. Warn about any tokens we missed (dev only)
  warnLeftover(body);

  // 5. Assemble final HTML
  return BASE_HTML
    .replace("{{CSS}}",  BASE_CSS)
    .replace("{{BODY}}", body);
}