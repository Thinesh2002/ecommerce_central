export const initialState = {

  /* ═══════════════════════════════════════════
     HEADER
  ═══════════════════════════════════════════ */
  header: {
    // Logo branding
    logoText1:  "LUMINA",
    logoText2:  "HOME",
    logoSubtext: "Lighting & Home Decor",

    // Desktop category nav
    navLinks: [
      { name: "Ceiling Lights",      url: "https://www.ebay.co.uk/sch/i.html?_nkw=ceiling+lights" },
      { name: "Floor & Table Lamps", url: "https://www.ebay.co.uk/sch/i.html?_nkw=floor+table+lamps" },
      { name: "Lampshades",          url: "https://www.ebay.co.uk/sch/i.html?_nkw=lampshades" },
      { name: "Ceiling Fans",        url: "https://www.ebay.co.uk/sch/i.html?_nkw=ceiling+fans" },
      { name: "Outdoor Lighting",    url: "https://www.ebay.co.uk/sch/i.html?_nkw=outdoor+lighting" },
    ],

    // Secondary nav
    nav1Name:   "View Our eBay Shop",
    nav1Url:    "https://www.ebay.co.uk/usr/luminahome",
    navBtnName: "Contact Us",
    navBtnUrl:  "https://www.ebay.co.uk/usr/luminahome#contact",

    // Legacy fields kept for backward compat
    homeText:    "HOME",
    contactText: "CONTACT",
  },

  /* ═══════════════════════════════════════════
     HERO
  ═══════════════════════════════════════════ */
  hero: {
    badge:        "⚡ FREE 48HR TRACKED DELIVERY ON ALL ORDERS",
    title:        "HOME & GARDEN",
    highlight:    "LIGHTING",
    subtitle:     "Transform every room — discover our full range of premium lighting solutions.",
    bgImage:      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&q=80",
    btnPrimary:   "Shop All Lighting",
    btnSecondary: "New Arrivals",
  },

  /* ═══════════════════════════════════════════
     SINGLE BANNER (hero banner below nav)
  ═══════════════════════════════════════════ */
  banner: {
    desktop: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=80",
    mobile:  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
    link:    "https://www.ebay.co.uk/sch/i.html?_nkw=ceiling+lights",
  },

  /* ═══════════════════════════════════════════
     COMPARE PRODUCTS
  ═══════════════════════════════════════════ */
  compareProducts: [
    {
      image:       "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
      name:        "Curvy Arch Floor Lamp",
      button:      "BUY NOW",
      link:        "https://www.ebay.co.uk/itm/001",
      price:       "£34.99",
      reviews:     "4.8 ★ (214 reviews)",
      material:    "Brushed Steel & Linen",
      lightSource: "E27 LED Compatible",
      fixtureType: "Floor Lamp",
    },
    {
      image:       "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80",
      name:        "Barn Pendant Lamp Shade",
      button:      "BUY NOW",
      link:        "https://www.ebay.co.uk/itm/002",
      price:       "£18.99",
      reviews:     "4.6 ★ (189 reviews)",
      material:    "Woven Natural Rattan",
      lightSource: "E27 / ES Bulb",
      fixtureType: "Ceiling Pendant",
    },
    {
      image:       "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=600&q=80",
      name:        "Black Cone Desk Lamp",
      button:      "BUY NOW",
      link:        "https://www.ebay.co.uk/itm/003",
      price:       "£24.99",
      reviews:     "4.7 ★ (302 reviews)",
      material:    "Powder-Coated Steel",
      lightSource: "GU10 LED Included",
      fixtureType: "Table / Desk Lamp",
    },
    {
      image:       "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      name:        "Emerald Glass Table Lamp",
      button:      "BUY NOW",
      link:        "https://www.ebay.co.uk/itm/004",
      price:       "£42.50",
      reviews:     "4.9 ★ (97 reviews)",
      material:    "Mouth-Blown Glass & Brass",
      lightSource: "E14 SES LED",
      fixtureType: "Table Lamp",
    },
  ],

  /* ═══════════════════════════════════════════
     GRID CARDS  (category tiles)
  ═══════════════════════════════════════════ */
  gridCards: [
    {
      image:  "https://images.unsplash.com/photo-1513506003901-1e6a35598b84?w=800&q=80",
      title:  "Ceiling Fans",
      text:   "Stay cool in style — remote-control, reversible & energy-efficient models.",
      button: "Browse Ceiling Fans",
    },
    {
      image:  "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&q=80",
      title:  "Ceiling Lights",
      text:   "From flush mounts to statement pendants — lights for every ceiling.",
      button: "Explore Ceiling Lights",
    },
    {
      image:  "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80",
      title:  "Floor & Table Lamps",
      text:   "Add warmth and personality to any room with our curated lamp collection.",
      button: "Shop Lamps",
    },
    {
      image:  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      title:  "Lampshades",
      text:   "Refresh your existing lamps — drum, empire, coolie & designer shades.",
      button: "View Lampshades",
    },
    {
      image:  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
      title:  "Outdoor Lighting",
      text:   "Weather-proof wall lights, post lanterns & solar path lights.",
      button: "Shop Outdoor",
    },
    {
      image:  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80",
      title:  "Smart Lighting",
      text:   "App & voice-controlled bulbs and fixtures for the modern home.",
      button: "Discover Smart",
    },
  ],

  /* ═══════════════════════════════════════════
     SLIDER  (hero product carousel)
  ═══════════════════════════════════════════ */
  slider: [
    {
      image:   "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80",
      heading: "HUGE",
      text:    "Range of lighting styles for every home",
      button:  "Shop Now",
    },
    {
      image:   "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=1200&q=80",
      heading: "MODERN",
      text:    "Contemporary ceiling lights — delivered in 48hrs",
      button:  "View Collection",
    },
    {
      image:   "https://images.unsplash.com/photo-1513506003901-1e6a35598b84?w=1200&q=80",
      heading: "STYLISH",
      text:    "Premium shades from just £12.99",
      button:  "Explore",
    },
    {
      image:   "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200&q=80",
      heading: "NEW IN",
      text:    "Fresh arrivals — floor lamps, pendants & more",
      button:  "See New Arrivals",
    },
  ],

  /* ═══════════════════════════════════════════
     BANNER LIST  (scrollable promotional banners)
  ═══════════════════════════════════════════ */
  bannerList: [
    {
      desktop: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=80",
      mobile:  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
      link:    "https://www.ebay.co.uk/sch/i.html?_nkw=ceiling+lights",
    },
    {
      desktop: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=80",
      mobile:  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
      link:    "https://www.ebay.co.uk/sch/i.html?_nkw=floor+lamps",
    },
    {
      desktop: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80",
      mobile:  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      link:    "https://www.ebay.co.uk/sch/i.html?_nkw=lampshades",
    },
  ],
};