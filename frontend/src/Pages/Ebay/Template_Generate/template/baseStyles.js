export const BASE_CSS = `
/* 1. Global Reset & Base Styles */
* {
  box-sizing: border-box;
}

body { 
  margin: 0; 
  font-family: 'Segoe UI', Roboto, Arial, sans-serif; 
  background: #ffffff; 
  line-height: 1.6;
}

/* 2. Layout Container */
.container { 
  max-width: 1200px; 
  margin: 0 auto; 
  padding: 20px; 
}

/* 3. Visibility Helpers */
.desktop-only { display: flex; }
.mobile-header { display: none; }
.desktop-img { display: block; }
.mobile-img { display: none; }

/* 4. Buttons */
.btn { 
  display: inline-block; 
  padding: 12px 24px; 
  background: #ff9f1c; 
  color: #fff; 
  font-size: 14px; 
  text-decoration: none; 
  font-weight: bold; 
  border-radius: 4px;
  text-align: center;
  transition: background 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn:hover {
  background: #e68a00;
}

/* 5. Grid & Hover Cards */
.grid { 
  display: grid; 
  grid-template-columns: repeat(2, 1fr); 
  gap: 20px; 
}

.card { 
  position: relative; 
  height: 280px; 
  overflow: hidden; 
  cursor: pointer; 
  border-radius: 8px;
}

.card img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  transition: transform 0.6s ease; 
}

.card:hover img { 
  transform: scale(1.1); 
}

.card .content { 
  position: absolute; 
  inset: 0; 
  z-index: 2; 
  display: flex; 
  flex-direction: column; 
  justify-content: center; 
  padding: 30px; 
  color: #fff; 
  background: rgba(0,0,0,0.35); 
}

/* 6. Hero Section */
.hero-section { 
  height: 520px; 
  background-size: cover; 
  background-position: center; 
  position: relative; 
  display: flex;
  align-items: center;
}

.hero-text { 
  position: relative; 
  color: #fff; 
  padding: 60px; 
  max-width: 600px;
}

/* 7. Compare Products Section */
.compare-products { 
  display: flex; 
  flex-wrap: nowrap; 
  gap: 20px; 
  justify-content: center; 
  max-width: 1200px; 
  margin: 40px auto; 
  overflow-x: auto;
}

.product-card { 
  width: 220px; 
  text-align: center; 
  padding: 15px;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  flex-shrink: 0;
}

.product-card img { 
  width: 100%; 
  height: 180px; 
  object-fit: contain; 
  margin-bottom: 15px;
}

.compare-products button {
  background: #ffcc00;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  font-size: 13px;
  transition: 0.3s;
}

/* 8. Comparison Table */
.desktop-compare-table table {
  width: 100%;
  border-collapse: collapse;
}

.desktop-compare-table td {
  padding: 15px;
  border-bottom: 1px solid #eeeeee;
}

/* 9. Animated Slider */
.slider { 
  width: 100%; 
  height: 450px; 
  overflow: hidden; 
  position: relative; 
}

.slides { 
  display: flex; 
  width: 400%; 
  height: 100%; 
  animation: slide 20s infinite ease-in-out; 
}

.slide { 
  width: 100%; 
  position: relative; 
  text-decoration: none; 
}

.slide img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
}

.slide .content { 
  position: absolute; 
  top: 50%; 
  left: 80px; 
  transform: translateY(-50%); 
  z-index: 2; 
  color: white;
}

@keyframes slide {
  0%, 20% { transform: translateX(0%); }
  25%, 45% { transform: translateX(-25%); }
  50%, 70% { transform: translateX(-50%); }
  75%, 95% { transform: translateX(-75%); }
  100% { transform: translateX(0%); }
}

/* 10. Mobile Responsiveness FIXES & ADDITIONS */
@media (max-width: 768px) {
  .desktop-only { display: none !important; }
  .mobile-header { display: block !important; }
  .desktop-img { display: none !important; }
  .mobile-img { display: block !important; }
  
  .grid { grid-template-columns: 1fr; }
  
  /* Category Cards Fix */
  .card { height: 220px !important; }
  .card .content h2 { font-size: 22px !important; }

  /* Hero Section Mobile Fix */
  .hero-section { 
    height: 450px !important; 
    background-position: center !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  .hero-text { 
    padding: 20px !important; 
    text-align: center !important; 
    max-width: 100% !important;
    background: rgba(0,0,0,0.2); /* Better readability on mobile */
  }

  .hero-text h1 { font-size: 32px !important; line-height: 1.1 !important; }
  .hero-text p { font-size: 15px !important; margin: 10px 0 !important; }

  /* Comparison Cards Grid Fix (2 per row) */
  .compare-products { 
    flex-wrap: wrap !important; 
    justify-content: center !important;
    gap: 15px !important;
    overflow-x: hidden !important;
  }
  
  .product-card { 
    width: 46% !important; 
    margin-bottom: 10px !important;
    padding: 10px !important;
  }
  
  .product-card img { height: 140px !important; }

  /* Slider Mobile Fix */
  .slider { height: 350px !important; }
  .slide .content { left: 20px !important; width: 90% !important; }
  .slide h1 { font-size: 28px !important; }

  /* Hide table on mobile */
  .desktop-compare-table { display: none !important; }

  /* Mobile Header Logo Center Fix */
  .mobile-header div[style*="text-align:center"] div {
    display: inline-block;
  }
}
`;