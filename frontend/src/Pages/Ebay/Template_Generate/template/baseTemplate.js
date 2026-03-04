export const BASE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- ── Meta & Identity ────────────────────────── -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">

  <!-- SEO & Social -->
  <meta name="description" content="Premium home and garden lighting — ceiling lights, floor lamps, lampshades & more. Free 48hr tracked delivery.">
  <meta name="robots" content="noindex, nofollow">
  <meta property="og:type"  content="website">
  <meta property="og:title" content="Lumina Home | Premium Lighting">
  <meta property="og:description" content="Transform every room with our curated lighting collection.">

  <!-- ── Performance Hints ──────────────────────── -->
  <!-- Preconnect to image CDNs used in the template -->
  <link rel="preconnect" href="https://images.unsplash.com" crossorigin>
  <link rel="preconnect" href="https://sin1.contabostorage.com" crossorigin>

  <!-- Font Awesome (icons) — deferred so it never blocks paint -->
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
    media="print"
    onload="this.media='all'"
  >
  <noscript>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  </noscript>

  <title>Lumina Home | Premium Lighting & Home Decor</title>

  <!-- ── Template Styles ────────────────────────── -->
  <style>{{CSS}}</style>
</head>

<body>

  <!-- Skip-to-content for keyboard / screen-reader users -->
  
    href="#main-content"
    style="
      position:absolute; top:-999px; left:-999px;
      z-index:9999; padding:10px 18px;
      background:#1e3a5f; color:#fff;
      font-weight:700; border-radius:4px;
      transition:top .15s;
    "
    onfocus="this.style.top='8px'; this.style.left='8px';"
    onblur="this.style.top='-999px'; this.style.left='-999px';"
  >
    Skip to content
  </a>

  <!-- Template output -->
  <div id="root">
    <main id="main-content">
      {{BODY}}
    </main>
  </div>

  <!-- ── Runtime Scripts ────────────────────────── -->
  <script>
    (function () {
      "use strict";

      /* ── Lazy-load all images ──────────────────── */
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const img = entry.target;
              if (img.dataset.src) img.src = img.dataset.src;
              if (img.dataset.srcset) img.srcset = img.dataset.srcset;
              img.removeAttribute("data-src");
              img.removeAttribute("data-srcset");
              obs.unobserve(img);
            });
          },
          { rootMargin: "200px 0px" }
        );
        document.querySelectorAll("img[data-src]").forEach((img) => io.observe(img));
      } else {
        /* Fallback: load all immediately */
        document.querySelectorAll("img[data-src]").forEach((img) => {
          img.src = img.dataset.src || "";
        });
      }

      /* ── Banner / Slider pause on hidden tab ──── */
      document.addEventListener("visibilitychange", () => {
        const sliders = document.querySelectorAll(".slides");
        sliders.forEach((el) => {
          el.style.animationPlayState =
            document.hidden ? "paused" : "running";
        });
      });

      /* ── Smooth anchor scrolling (Safari fallback) */
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
          const target = document.querySelector(a.getAttribute("href"));
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });

    })();
  </script>

</body>
</html>
`;