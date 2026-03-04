// src/pages/Ebay/Template_Generate/template/bodyTemplate.js

export const BODY_HTML = `

  <!-- ╔══════════════════════════════════════════╗
       ║  MOBILE HEADER                           ║
       ╚══════════════════════════════════════════╝ -->
  <header class="mobile-header" role="banner" aria-label="Mobile navigation">

    <nav class="mobile-topbar" aria-label="Mobile quick links">
      <a href="{{NAV_1_URL}}">{{NAV_1}}</a>
      <a href="{{NAV_BTN_URL}}">{{NAV_BTN}}</a>
    </nav>

    <div class="mobile-logo" aria-label="Store logo">
      <div class="logo-wordmark">
        <span class="logo-primary">{{LOGO_TEXT_1}}</span>
        <span class="logo-accent">{{LOGO_TEXT_2}}</span>
      </div>
      <div class="logo-subtext">{{LOGO_SUBTEXT}}</div>
    </div>

  </header>


  <!-- ╔══════════════════════════════════════════╗
       ║  DESKTOP HEADER                          ║
       ╚══════════════════════════════════════════╝ -->
  <header class="desktop-only site-header" role="banner" aria-label="Site navigation">
    <nav aria-label="Primary navigation">

      <a href="/" class="nav-logo" aria-label="{{LOGO_TEXT_1}} {{LOGO_TEXT_2}} — home">
        <span class="logo-primary">{{LOGO_TEXT_1}} <span class="logo-accent">{{LOGO_TEXT_2}}</span></span>
        <span class="logo-secondary">{{LOGO_SUBTEXT}}</span>
      </a>

      <ul class="nav-links" role="list">
        {{NAVIGATION_MENU_ITEMS}}
      </ul>

      <div class="nav-actions">
        <a href="{{NAV_1_URL}}" class="btn btn-outline btn-sm">{{NAV_1}}</a>
        <a href="{{NAV_BTN_URL}}" class="btn btn-sm">{{NAV_BTN}}</a>
      </div>

    </nav>
  </header>


  <!-- ╔══════════════════════════════════════════╗
       ║  HERO                                    ║
       ╚══════════════════════════════════════════╝ -->
  <section
    class="hero-section"
    style="background-image: url('{{HERO_BG_IMAGE}}');"
    aria-label="Hero banner"
  >
    <div class="hero-text">
      <span class="hero-badge">{{HERO_BADGE}}</span>

      <h1>
        {{HERO_TITLE}}
        <span class="highlight">{{HERO_HIGHLIGHT}}</span>
      </h1>

      <p>{{HERO_SUBTITLE}}</p>

      <div class="hero-actions">
        <a href="{{HERO_BTN_PRIMARY_URL}}" class="btn">{{HERO_BTN_PRIMARY}}</a>
        <a href="{{HERO_BTN_SECONDARY_URL}}" class="btn btn-outline">{{HERO_BTN_SECONDARY}}</a>
      </div>
    </div>
  </section>


  <!-- ╔══════════════════════════════════════════╗
       ║  BANNER LIST  (dynamic — via generateHtml)║
       ╚══════════════════════════════════════════╝ -->
  <section class="banner-list" aria-label="Promotional banners">
    {{DYNAMIC_BANNERS}}
  </section>


  <!-- ╔══════════════════════════════════════════╗
       ║  COMPARE PRODUCTS                        ║
       ╚══════════════════════════════════════════╝ -->
  <section class="section" aria-labelledby="compare-heading">
    <div class="container">

      <h2 class="section-title" id="compare-heading">Compare Our Products</h2>

      <div class="compare-products" role="list" aria-label="Product comparison cards">
        {{COMPARE_PRODUCTS_LIST}}
      </div>

    </div>
  </section>


  <!-- ╔══════════════════════════════════════════╗
       ║  COMPARISON TABLE  (desktop only)        ║
       ╚══════════════════════════════════════════╝ -->
  <section class="desktop-compare-table container" aria-label="Product specification table">
    <table role="table" aria-label="Product comparison">
      <thead>
        <tr>{{COMPARE_TABLE_HEADERS}}</tr>
      </thead>
      <tbody>
        {{COMPARE_TABLE_ROWS}}
      </tbody>
    </table>
  </section>


  <!-- ╔══════════════════════════════════════════╗
       ║  GRID CARDS  (category tiles)            ║
       ╚══════════════════════════════════════════╝ -->
  <section class="section" aria-labelledby="categories-heading">
    <div class="container">

      <h2 class="section-title" id="categories-heading">Shop by Category</h2>

      <div class="grid" role="list" aria-label="Product categories">
        {{GRID_CARDS_LIST}}
      </div>

    </div>
  </section>


  <!-- ╔══════════════════════════════════════════╗
       ║  SLIDER                                  ║
       ╚══════════════════════════════════════════╝ -->
  <section
    class="slider"
    aria-label="Featured products slideshow"
    aria-roledescription="carousel"
  >
    <div class="slides" role="list" aria-label="Slides">
      {{SLIDER_LIST}}
    </div>
  </section>


  <!-- ╔══════════════════════════════════════════╗
       ║  FOOTER                                  ║
       ╚══════════════════════════════════════════╝ -->
  <footer class="site-footer" role="contentinfo">
    <p>
      &copy; {{CURRENT_YEAR}} <strong>{{LOGO_TEXT_1}} {{LOGO_TEXT_2}}</strong> &mdash;
      All Rights Reserved.
      <br>
      <small>
        All images and product details are for illustrative purposes.
        Prices and availability are subject to change.
      </small>
    </p>
  </footer>

`;