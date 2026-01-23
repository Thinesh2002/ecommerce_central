import { BASE_HTML } from "../template/baseTemplate";
import { BASE_CSS } from "../template/baseStyles";
import { BODY_HTML } from "../template/bodyTemplate";

export function generateHtml(state) {
  let body = BODY_HTML;

  /* ================= 1. DYNAMIC TABLE ROWS GENERATION ================= */
  const tableLabels = [
    { label: "Customer Reviews", key: "reviews" },
    { label: "Price", key: "price" },
    { label: "Material", key: "material" },
    { label: "Light Source", key: "lightSource" },
    { label: "Fixture Type", key: "fixtureType" }
  ];

  let tableRowsHtml = "";
  tableLabels.forEach((item) => {
    tableRowsHtml += `<tr style="border-bottom:1px solid #ddd;">`;
    tableRowsHtml += `<td style="background:#f9f9f9; font-weight:bold; width:20%; padding:10px;"> ${item.label} </td>`;
    
    // Max 5 products mattum table-il kaattuvom
    state.compareProducts.slice(0, 5).forEach((p) => {
      let value = p[item.key] || "—";
      // Star rating logic for image_72cef3 style
      if (item.key === "reviews" && p.reviews) {
        value = `<span style="color:#ffcc00;">⭐⭐⭐⭐⭐</span> ${p.reviews}`;
      }
      tableRowsHtml += `<td style="width:16%; padding:10px;">${value}</td>`;
    });
    tableRowsHtml += `</tr>`;
  });

  /* ================= 2. DYNAMIC NAVIGATION MENU ================= */
  let navHtml = "";
  if (state.header.navLinks && state.header.navLinks.length > 0) {
    state.header.navLinks.forEach((link) => {
      navHtml += `<a href="${link.url || '#'}" style="color:#fff; text-decoration:none; margin-right:25px;">${link.name}</a>`;
    });
  }

  /* ================= 3. CLEAN & REPLACE DYNAMIC LISTS ================= */
  // Image_732c16-la therinja brackets-ai clean panni table-ai sethukom
  body = body
    .replaceAll("{{COMPARE_PRODUCTS_LIST}}", "")
    .replaceAll("{{GRID_CARDS_LIST}}", "")
    .replaceAll("{{SLIDER_LIST}}", "")
    .replaceAll("{{EBAY_DETAILS_LIST}}", "")
    .replaceAll("{{NAVIGATION_MENU_ITEMS}}", navHtml) 
    .replaceAll("{{COMPARE_TABLE_ROWS}}", tableRowsHtml);

  /* ================= 4. HEADER & NAV SETTINGS ================= */
  body = body
    .replaceAll("{{MOBILE_HOME_TEXT}}", state.header.homeText || "HOME")
    .replaceAll("{{MOBILE_CONTACT_TEXT}}", state.header.contactText || "CONTACT")
    .replaceAll("{{LOGO_TEXT_1}}", state.header.logoText1 || "HOME")
    .replaceAll("{{LOGO_TEXT_2}}", state.header.logoText2 || "STYLE")
    .replaceAll("{{LOGO_SUBTEXT}}", state.header.logoSubtext || "LIGHTING")
    .replaceAll("{{NAV_1}}", state.header.nav1Name || "Shop")
    .replaceAll("{{NAV_1_URL}}", state.header.nav1Url || "#")
    .replaceAll("{{NAV_BUTTON}}", state.header.navBtnName || "Contact Us")
    .replaceAll("{{NAV_BUTTON_URL}}", state.header.navBtnUrl || "#");

  /* ================= 5. HERO SECTION ================= */
  body = body
    .replaceAll("{{HERO_BG_IMAGE}}", state.hero.bgImage)
    .replaceAll("{{HERO_BADGE}}", state.hero.badge)
    .replaceAll("{{HERO_TITLE}}", state.hero.title)
    .replaceAll("{{HERO_HIGHLIGHT}}", state.hero.highlight)
    .replaceAll("{{HERO_SUBTITLE}}", state.hero.subtitle)
    .replaceAll("{{HERO_BTN_PRIMARY}}", state.hero.btnPrimary)
    .replaceAll("{{HERO_BTN_PRIMARY_URL}}", state.hero.btnPrimaryUrl || "#")
    .replaceAll("{{HERO_BTN_SECONDARY}}", state.hero.btnSecondary)
    .replaceAll("{{HERO_BTN_SECONDARY_URL}}", state.hero.btnSecondaryUrl || "#");

  /* ================= 6. COMPARE PRODUCTS CARDS ================= */
  state.compareProducts.forEach((p, i) => {
    // Hide card if no image - fixes Image_72ce91 wrap issues
    const cardStyle = p.image ? "display:inline-block; vertical-align:top;" : "display:none;";
    body = body
      .replaceAll(`{{COMPARE_${i}_IMAGE}}`, p.image || "")
      .replaceAll(`{{COMPARE_${i}_TITLE}}`, p.name || "")
      .replaceAll(`{{COMPARE_${i}_BUTTON}}`, p.button || "BUY NOW")
      .replaceAll(`{{COMPARE_${i}_LINK}}`, p.link || "#")
      .replaceAll(`id="compare-card-${i}"`, `style="${cardStyle}"`);
  });
  body = body.replaceAll("{{COMPARE_TITLE}}", state.compareTitle || "Compare with similar items");

  /* ================= 7. GRID CARDS LOOP ================= */
  state.gridCards.forEach((c, i) => {
    const gridStyle = c.image ? "display:block;" : "display:none;";
    body = body
      .replaceAll(`{{GRID_${i}_IMAGE}}`, c.image || "")
      .replaceAll(`{{GRID_${i}_TITLE}}`, c.title || "")
      .replaceAll(`{{GRID_${i}_TEXT}}`, c.text || "")
      .replaceAll(`{{GRID_${i}_BUTTON}}`, c.button || "View More")
      .replaceAll(`{{GRID_${i}_LINK}}`, c.link || "#")
      .replaceAll(`id="grid-card-${i}"`, `style="${gridStyle}"`);
  });

  return BASE_HTML.replaceAll("{{CSS}}", BASE_CSS).replaceAll("{{BODY}}", body);
}