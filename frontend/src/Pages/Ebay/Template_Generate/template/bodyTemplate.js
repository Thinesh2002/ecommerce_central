// src/pages/Ebay/Template_Generate/template/bodyTemplate.js

export const BODY_HTML = `

<div class="mobile-header" style="display:none;">
  <div style="background:#ff9f2f; padding:12px 30px; display:flex; justify-content:space-between; align-items:center; font-weight:bold; font-family: Arial, sans-serif;">
    <a href="index.html" style="text-decoration:none; color:#000; font-size:14px; letter-spacing:1px;">{{MOBILE_HOME_TEXT}}</a>
    <a href="contact.html" style="text-decoration:none; color:#000; font-size:14px; letter-spacing:1px;">{{MOBILE_CONTACT_TEXT}}</a>
  </div>

  <div style="text-align:center; padding:25px 0; background:#ffffff;">
    <div style="font-family: Arial, sans-serif; line-height: 1;">
      <div style="font-size:32px; font-weight:bold; letter-spacing: 1px;">
        <span style="color:#000000;">{{LOGO_TEXT_1}}</span>
        <span style="color:#ff9f2f; margin-left: 5px;">{{LOGO_TEXT_2}}</span>
      </div>
      <div style="font-size:14px; letter-spacing:6px; color:#ff9f2f; text-transform:uppercase; margin-top:8px; font-weight: 500;">
        {{LOGO_SUBTEXT}}
      </div>
    </div>
  </div>
</div>

<div class="desktop-only" style="background:#000; color:#fff; padding:12px 40px; display:flex; justify-content:space-between; align-items:center; font-size:14px;">
  <div style="display:flex; gap:25px; flex-wrap:wrap;">
    {{NAVIGATION_MENU_ITEMS}}
  </div>
  <a href="{{CART_URL}}" style="color:#fff; font-size:20px; text-decoration:none;">🛒</a>
</div>

<div class="desktop-only" style="padding:25px 40px; display:flex; justify-content:space-between; align-items:center; background:#fff; border-bottom:1px solid #eee;">
  <div style="font-size:34px; font-weight:bold; line-height:1.1;">
    <span style="color:#000;">{{LOGO_TEXT_1}}</span>
    <span style="color:#ff9f2f;">{{LOGO_TEXT_2}}</span><br>
    <span style="font-size:14px; letter-spacing:3px; color:#ff9f2f; text-transform:uppercase;">
      {{LOGO_SUBTEXT}}
    </span>
  </div>

  <div style="display:flex; gap:30px; align-items:center; font-size:16px;">
    <a href="{{NAV_1_URL}}" style="text-decoration:none; color:#000; font-weight:500;">{{NAV_1}}</a>
    <a href="{{NAV_2_URL}}" style="text-decoration:none; color:#000; font-weight:500;">{{NAV_2}}</a>
    <a href="{{NAV_3_URL}}" style="text-decoration:none; color:#000; font-weight:500;">{{NAV_3}}</a>
    <a href="{{NAV_4_URL}}" style="text-decoration:none; color:#000; font-weight:500;">{{NAV_4}}</a>
    <a href="{{NAV_BUTTON_URL}}" style="text-decoration:none;">
      <button style="background:#ff9f2f; border:none; color:#fff; padding:12px 22px; font-size:15px; font-weight:bold; cursor:pointer;">
        {{NAV_BUTTON}}
      </button>
    </a>
  </div>
</div>

<div class="hero-section" style="background-image:url('{{HERO_BG_IMAGE}}');">
  <div style="position:absolute; inset:0; background:rgba(0,0,0,0.45);"></div>
  <div class="hero-text">
    <div style="letter-spacing:4px; font-size:14px; margin-bottom:15px; text-transform:uppercase;">
      {{HERO_BADGE}}
    </div>
    <h1 style="font-size:48px; margin:0; line-height:1.2;">
      {{HERO_TITLE}} <span style="color:#ff9f2f;">{{HERO_HIGHLIGHT}}</span>
    </h1>
    <p style="margin:20px 0; font-size:18px; letter-spacing:1px; opacity:0.9;">
      {{HERO_SUBTITLE}}
    </p>
    <div style="margin-top:30px; display:flex; gap:15px; flex-wrap:wrap;">
      <a href="{{HERO_BTN_PRIMARY_URL}}" style="text-decoration:none;">
        <button class="btn" style="border:none; padding:16px 32px;">{{HERO_BTN_PRIMARY}}</button>
      </a>
      <a href="{{HERO_BTN_SECONDARY_URL}}" style="text-decoration:none;">
        <button class="btn" style="background:#000; border:none; padding:16px 32px;">{{HERO_BTN_SECONDARY}}</button>
      </a>
    </div>
  </div>
</div>

<div class="banners-container" style="width:100%; overflow:hidden; line-height:0; font-size:0;">
  {{DYNAMIC_BANNERS}}
</div>

<div class="container">
  <h2 style="text-align:center; font-size:28px; margin:40px 0;">{{COMPARE_TITLE}}</h2>
  <div class="compare-products" style="display:flex; gap:20px; justify-content:center; flex-wrap:nowrap; overflow-x:auto;">
    {{COMPARE_PRODUCTS_LIST}}
    
    <div class="product-card" id="compare-card-0" style="width:200px; text-align:center; flex-shrink:0;">
      <img src="{{COMPARE_0_IMAGE}}" style="width:100%; height:auto;">
      <p style="font-weight:bold; margin:10px 0;">{{COMPARE_0_TITLE}}</p>
      <a href="{{COMPARE_0_LINK}}" target="_blank" style="text-decoration:none;">
        <button style="background:#ffcc00; border:none; padding:8px 18px; border-radius:20px; cursor:pointer;">{{COMPARE_0_BUTTON}}</button>
      </a>
    </div>

    <div class="product-card" id="compare-card-1" style="width:200px; text-align:center; flex-shrink:0;">
      <img src="{{COMPARE_1_IMAGE}}" style="width:100%; height:auto;">
      <p style="font-weight:bold; margin:10px 0;">{{COMPARE_1_TITLE}}</p>
      <a href="{{COMPARE_1_LINK}}" target="_blank" style="text-decoration:none;">
        <button style="background:#ffcc00; border:none; padding:8px 18px; border-radius:20px; cursor:pointer;">{{COMPARE_1_BUTTON}}</button>
      </a>
    </div>

    <div class="product-card" id="compare-card-2" style="width:200px; text-align:center; flex-shrink:0;">
      <img src="{{COMPARE_2_IMAGE}}" style="width:100%; height:auto;">
      <p style="font-weight:bold; margin:10px 0;">{{COMPARE_2_TITLE}}</p>
      <a href="{{COMPARE_2_LINK}}" target="_blank" style="text-decoration:none;">
        <button style="background:#ffcc00; border:none; padding:8px 18px; border-radius:20px; cursor:pointer;">{{COMPARE_2_BUTTON}}</button>
      </a>
    </div>

    <div class="product-card" id="compare-card-3" style="width:200px; text-align:center; flex-shrink:0;">
      <img src="{{COMPARE_3_IMAGE}}" style="width:100%; height:auto;">
      <p style="font-weight:bold; margin:10px 0;">{{COMPARE_3_TITLE}}</p>
      <a href="{{COMPARE_3_LINK}}" target="_blank" style="text-decoration:none;">
        <button style="background:#ffcc00; border:none; padding:8px 18px; border-radius:20px; cursor:pointer;">{{COMPARE_3_BUTTON}}</button>
      </a>
    </div>
  </div>
</div>

<div class="desktop-compare-table" style="max-width:1200px; margin:30px auto; overflow-x:auto;">
  <table width="100%" cellspacing="0" cellpadding="10" border="0" style="border-collapse:collapse; font-size:14px;">
    <tbody>
      {{COMPARE_TABLE_ROWS}}
    </tbody>
  </table>
</div>

<div class="container">
  <div class="grid">
    {{GRID_CARDS_LIST}}
    <div class="card" id="grid-card-0">
      <img src="{{GRID_0_IMAGE}}">
      <div class="content">
        <h2>{{GRID_0_TITLE}}</h2>
        <p>{{GRID_0_TEXT}}</p>
        <a href="{{GRID_0_LINK}}" style="text-decoration:none;"><span class="btn">{{GRID_0_BUTTON}}</span></a>
      </div>
    </div>
    <div class="card" id="grid-card-1">
      <img src="{{GRID_1_IMAGE}}">
      <div class="content">
        <h2>{{GRID_1_TITLE}}</h2>
        <p>{{GRID_1_TEXT}}</p>
        <a href="{{GRID_1_LINK}}" style="text-decoration:none;"><span class="btn">{{GRID_1_BUTTON}}</span></a>
      </div>
    </div>
  </div>
</div>

<div class="ebay-container">
  {{EBAY_DETAILS_LIST}}
</div>

<div class="slider">
  <div class="slides">
    {{SLIDER_LIST}}
    <a href="{{SLIDE_0_LINK}}" class="slide" id="slide-item-0">
      <img src="{{SLIDE_0_IMAGE}}">
      <div class="content">
        <h1>{{SLIDE_0_TITLE}}</h1>
        <p>{{SLIDE_0_TEXT}}</p>
        <span class="btn">{{SLIDE_0_BUTTON}}</span>
      </div>
    </a>
  </div>
</div>

`;