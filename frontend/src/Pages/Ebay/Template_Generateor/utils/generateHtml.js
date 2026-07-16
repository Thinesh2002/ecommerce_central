// Single source of truth for the A+ template HTML. The live preview renders this
// exact string (via iframe), so what you see in the editor/PC/mobile views is
// always byte-identical to what Copy/Download produce - no more drift between a
// separate "preview" implementation and the exported markup.
export default function generateHtml({ styles = {}, headerData = {}, modules = [], faqs = [] }) {
  const safeHeaderData = headerData || { storeName: "My Store", storeLink: "#", shopLinks: [] };
  const safeStyles = styles || {};
  const safeModules = modules || [];
  const safeFaqs = faqs || [];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeHeaderData.storeName || 'Store Description'}</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${safeStyles.backgroundColor || '#ffffff'}; color: ${safeStyles.textColor || '#111111'}; font-family: ${safeStyles.fontFamily || 'sans-serif'}; line-height: 1.5; -webkit-font-smoothing: antialiased; }
    .ap-container { width: 100%; box-sizing: border-box; }

    /* Header layout */
    .ap-header { background-color: ${safeStyles.headerBg || '#131921'}; color: ${safeStyles.headerText || '#ffffff'}; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; }
    .ap-header a { color: ${safeStyles.headerText || '#ffffff'}; text-decoration: none; font-weight: 600; font-size: 14px; margin-left: 20px; transition: opacity 0.2s; }
    .ap-header a:hover { opacity: 0.8; text-decoration: underline; }
    .ap-header .ap-logo { color: ${safeStyles.primaryColor || '#ff9900'} !important; font-size: 18px; font-weight: 800; margin-left: 0; text-decoration: none !important; }

    /* Global Module Structuring rules */
    .ap-module { width: 100%; position: relative; box-sizing: border-box; background-color: #ffffff; overflow: hidden; }

    /* Hero layout configuration */
    .ap-hero-wrap { width: 100%; overflow: hidden; display: block; }
    .ap-hero-wrap img { width: 100%; display: block; object-fit: cover; }
    @media (min-width: 769px) { .ap-hero-wrap { aspect-ratio: 1464 / 600; } }
    @media (max-width: 768px) { .ap-hero-wrap { aspect-ratio: 600 / 450; } }

    /* Background layout configuration */
    .ap-bgtext { width: 100%; relative; display: flex; align-items: center; box-sizing: border-box; background-size: cover; background-position: center; background-repeat: no-repeat; }
    @media (min-width: 769px) { .ap-bgtext { aspect-ratio: 1464 / 600; padding: 32px; } }
    .ap-bgtext-card { padding: 24px; box-sizing: border-box; border-radius: 4px; display: flex; flex-direction: column; justify-content: center; word-wrap: break-word; overflow: hidden; }
    .ap-bgtext-card.theme-dark { background-color: rgba(0,0,0,0.75); color: #ffffff; }
    .ap-bgtext-card.theme-light { background-color: rgba(255,255,255,0.95); color: #111111; border: 1px solid #e2e8f0; }
    .ap-bgtext-card h3 { margin: 0 0 8px 0; font-size: 18px; font-weight: 900; line-height: 1.2; text-transform: uppercase; }
    .ap-bgtext-card p { margin: 0; font-size: 13px; line-height: 1.5; font-weight: 500; }

    /* Single Item Layout config */
    .ap-single { padding: 24px; display: flex; flex-direction: column; box-sizing: border-box; gap: 24px; }
    .ap-single-img-wrap { width: 100%; aspect-ratio: 1 / 1; overflow: hidden; display: flex; align-items: center; justify-content: center; border-radius: 8px; box-sizing: border-box; shrink: 0; }
    .ap-single-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
    .ap-single:hover .ap-single-img-wrap img { transform: scale(1.03); }
    .ap-single-content { width: 100%; box-sizing: border-box; }
    .ap-single-content h3 { margin: 0 0 10px 0; font-size: 18px; font-weight: 800; border-bottom: 2px solid ${safeStyles.primaryColor || '#ea580c'}; padding-bottom: 6px; color: #111111; }
    .ap-single-content p { margin: 0; font-size: 13px; color: #475569; line-height: 1.6; }
    @media (min-width: 769px) {
      .ap-single { flex-direction: row; align-items: center; gap: 32px; }
      .ap-single-img-wrap { width: 50%; max-width: 500px; }
      .ap-single-content { width: 50%; }
    }

    /* Dual grid items config */
    .ap-dual-container { padding: 24px; display: grid; gap: 24px; box-sizing: border-box; width: 100%; background-color: #ffffff; }
    @media (min-width: 769px) { .ap-dual-container { grid-template-columns: repeat(2, 1fr); } }
    .ap-dual-item { display: flex; flex-direction: column; align-items: center; text-align: center; box-sizing: border-box; background: transparent; }
    .ap-dual-img-wrap { width: 100%; aspect-ratio: 1 / 1; overflow: hidden; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
    .ap-dual-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
    .ap-dual-item:hover .ap-dual-img-wrap img { transform: scale(1.03); }
    .ap-dual-info { margin-top: 12px; width: 100%; }
    .ap-dual-info h4 { margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #0f172a; }
    .ap-dual-info p { margin: 0; font-size: 11px; color: #64748b; line-height: 1.4; }

    /* Four grid items layout configuration */
    .ap-four-container { padding: 24px; box-sizing: border-box; width: 100%; background-color: #ffffff; }
    .ap-four-header { text-align: center; margin-bottom: 24px; }
    .ap-four-header h2 { margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #1e293b; }
    .ap-four-header p { margin: 0; font-size: 13px; color: #64748b; max-width: 600px; margin: 0 auto; }
    .ap-four-grid { display: grid; gap: 24px; box-sizing: border-box; }
    @media (min-width: 769px) { .ap-four-grid { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 768px) { .ap-four-grid { grid-template-columns: repeat(2, 1fr); } }
    .ap-four-item { display: flex; flex-direction: column; align-items: center; text-align: center; box-sizing: border-box; background: transparent; }
    .ap-four-img-wrap { width: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .ap-four-img-wrap img { width: 100%; height: auto; object-fit: contain; max-height: 180px; transition: transform 0.3s ease; }
    .ap-four-item:hover .ap-four-img-wrap img { transform: scale(1.05); }
    .ap-four-info { margin-top: 12px; width: 100%; }
    .ap-four-info h4 { margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #0f172a; }
    .ap-four-info p { margin: 0; font-size: 11px; color: #64748b; line-clamp: 3; }

    /* Matrix layout comparison specifications */
    .ap-table-wrapper { padding: 24px; box-sizing: border-box; background-color: #ffffff; }
    .ap-table-desktop { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
    .ap-table-desktop th, .ap-table-desktop td { padding: 14px; border-bottom: 1px solid #e2e8f0; text-align: center; box-sizing: border-box; }
    .ap-table-desktop th { font-weight: 700; vertical-align: bottom; background: transparent; color: #0f172a; }
    .ap-table-desktop td:first-child, .ap-table-desktop th:first-child { text-align: left; font-weight: 700; color: #475569; width: 18%; background-color: #f8fafc; border-right: 1px solid #e2e8f0; }

    .ap-table-img-box { height: 144px; width: 128px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border: 1px solid #edf2f7; padding: 10px; border-radius: 12px; margin: 0 auto 12px auto; overflow: hidden; }
    .ap-table-img-box img { max-height: 100%; max-width: 100%; object-fit: contain; mix-blend-multiply: true; }

    .ap-table-btn { display: inline-block; width: 100%; max-width: 120px; color: #000000; font-weight: 700; padding: 6px 12px; border-radius: 9999px; text-decoration: none; font-size: 10px; border: 1px solid #d97706; background: #fbbf24; text-align: center; margin-top: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .ap-table-btn:hover { background: #f59e0b; }
    .ap-badge-yes { color: #10b981; font-weight: 900; font-size: 16px; }
    .ap-badge-no { color: #ef4444; font-weight: 900; font-size: 14px; }
    .ap-badge-text { color: #475569; font-weight: 500; }

    /* MOBILE CARD LAYOUT (IMAGE -> NAME -> BUTTON) */
    .ap-table-mobile { display: none; flex-direction: column; width: 100%; box-sizing: border-box; gap: 24px; padding: 8px 0; }
    .ap-mob-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; box-sizing: border-box; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 16px; }

    /* Vertical alignment for product info */
    .ap-mob-header { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
    .ap-mob-img-box { height: 140px; width: 140px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border: 1px solid #edf2f7; padding: 10px; border-radius: 12px; overflow: hidden; }
    .ap-mob-img-box img { max-height: 100%; max-width: 100%; object-fit: contain; mix-blend-multiply: true; }
    .ap-mob-title { font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.4; margin: 2px 0; }

    .ap-mob-details-grid { display: flex; flex-direction: column; gap: 10px; }
    .ap-mob-detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #f1f5f9; }
    .ap-mob-detail-row:last-child { border-bottom: none; }
    .ap-mob-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .ap-mob-val { font-size: 13px; font-weight: 600; color: #334155; }

    @media (max-width: 768px) {
      .ap-table-desktop { display: none; }
      .ap-table-mobile { display: flex; }
    }

    /* Shared FAQ Layout configurations */
    .ap-faq { padding: 24px; border-top: 1px solid #e2e8f0; background-color: #f8fafc; box-sizing: border-box; }
    .ap-faq-title { text-align: center; font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; color: ${safeStyles.primaryColor || '#ea580c'}; letter-spacing: 1px; }
    .ap-faq-grid { max-width: 768px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
    .ap-faq-node { padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; box-sizing: border-box; }
    .ap-faq-q { font-weight: 700; color: #0f172a; margin: 0; font-size: 13px; display: flex; gap: 6px; }
    .ap-faq-q span { color: ${safeStyles.primaryColor || '#ea580c'}; }
    .ap-faq-a { margin: 8px 0 0 0; font-size: 12px; color: #475569; padding-left: 12px; border-left: 2px solid ${safeStyles.primaryColor || '#ea580c'}; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="ap-container">
    <div class="ap-header">
      <a href="${safeHeaderData.storeLink || '#'}" class="ap-logo" target="_blank">${safeHeaderData.storeName || 'Store'}</a>
      <div>
        ${(safeHeaderData.shopLinks || []).map(l => `<a href="${l.url}">${l.label}</a>`).join('')}
      </div>
    </div>

    <div class="ap-stream">
      ${safeModules.map((m) => {
        if (m.type === 'hero') {
          return `
          <div class="ap-module">
            <div class="ap-hero-wrap">
              <picture>
                <source media="(max-width: 768px)" srcset="${m.mobileImage || m.pcImage}">
                <img src="${m.pcImage}" alt="${m.altText || 'Hero Banner Asset'}">
              </picture>
            </div>
          </div>`;
        }

        if (m.type === 'bgText') {
          const settings = m.extraData || { boxTheme: 'dark', boxPosition: 'right', altText: '' };
          const posStyle = settings.boxPosition === 'left' ? 'justify-content: flex-start;' : settings.boxPosition === 'center' ? 'justify-content: center;' : 'justify-content: flex-end;';
          return `
          <div class="ap-module ap-bgtext" style="background-image: url('${m.pcImage}'); ${posStyle}">
            <div class="ap-bgtext-card theme-${settings.boxTheme || 'dark'}">
              ${m.title ? `<h3>${m.title}</h3>` : ''}
              ${m.description ? `<p>${m.description}</p>` : ''}
            </div>
          </div>`;
        }

        if (m.type === 'singleImage') {
          return `
          <div class="ap-module ap-single">
            <div class="ap-single-img-wrap">
              <img src="${m.pcImage}" alt="${m.altText || 'Single core layout variant structure'}">
            </div>
            <div class="ap-single-content">
              ${m.title ? `<h3>${m.title}</h3>` : ''}
              ${m.description ? `<p>${m.description}</p>` : ''}
            </div>
          </div>`;
        }

        if (m.type === 'dualImage') {
          const state = m.extraData || { title: '', description: '', items: [] };
          return `
          <div class="ap-module" style="padding-top:24px;">
            ${state.title ? `<h2 style="text-align:center; margin:0 0 4px 0; font-size:20px; color:#1e293b;">${state.title}</h2>` : ''}
            ${state.description ? `<p style="text-align:center; margin:0 0 16px 0; font-size:13px; color:#64748b; padding:0 16px;">${state.description}</p>` : ''}
            <div class="ap-dual-container">
              ${(state.items || []).map((item) => `
                <div class="ap-dual-item">
                  <div class="ap-dual-img-wrap">
                    <img src="${item.img}" alt="${item.altText || 'Dual layout structural vector configuration'}">
                  </div>
                  <div class="ap-dual-info">
                    <h4>${item.text || ''}</h4>
                    <p>${item.desc || ''}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>`;
        }

        if (m.type === 'fourImage') {
          const state = m.extraData || { title: '', description: '', items: [] };
          return `
          <div class="ap-module ap-four-container">
            ${state.title || state.description ? `
              <div class="ap-four-header">
                ${state.title ? `<h2>${state.title}</h2>` : ''}
                ${state.description ? `<p>${state.description}</p>` : ''}
              </div>
            ` : ''}
            <div class="ap-four-grid">
              ${(state.items || []).map((item) => `
                <div class="ap-four-item">
                  <div class="ap-four-img-wrap">
                    <img src="${item.img}" alt="${item.altText || 'Core specifications structural icon list focus'}">
                  </div>
                  <div class="ap-four-info">
                    <h4>${item.text || ''}</h4>
                    <p>${item.desc || ''}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>`;
        }

        if (m.type === 'table') {
          const state = m.extraData || { title: '', currency: '$', headers: ['Features'], images: [], altTexts: [], cartLinks: [], rows: [] };
          const safeHeaders = state.headers || ['Features'];
          const safeImages = state.images || [];
          const safeAltTexts = state.altTexts || [];
          const safeCartLinks = state.cartLinks || [];
          const safeRows = state.rows || [];
          const safeCurrency = state.currency || '$';

          const minWidth = Math.max(700, safeHeaders.length * 150);

          return `
          <div class="ap-module ap-table-wrapper" id="ap-table-mod-${m.id}">
            ${state.title ? `<h2 style="text-align:center; margin:0 0 20px 0; font-size:20px; color:#1e293b;">${state.title}</h2>` : ''}

            <table class="ap-table-desktop" style="min-width: ${minWidth}px;">
              <thead>
                <tr>
                  <th>${safeHeaders[0] || 'Features'}</th>
                  ${safeHeaders.slice(1).map((h, i) => `
                    <th>
                      <div class="ap-table-img-box">
                        <img src="${safeImages[i] || ''}" alt="${safeAltTexts[i] || 'Specification matrix asset.'}">
                      </div>
                      <div style="font-weight:700; font-size:12px; margin-bottom:6px; color:#0f172a;">${h}</div>
                      <a href="${safeCartLinks[i] || '#'}" class="ap-table-btn">Buy Now</a>
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${safeRows.map((row, rIdx) => `
                  <tr>
                    <td>${row[0] || ''}</td>
                    ${row.slice(1).map((cell) => {
                      const clean = cell.trim();
                      if (rIdx === 0) return `<td><span style="font-family:monospace; font-weight:700; color:#0f172a;">${safeCurrency}${clean}</span></td>`;
                      if (clean === '✓' || clean.toLowerCase() === 'yes') return `<td><span class="ap-badge-yes">✓</span></td>`;
                      if (clean === '✕' || clean.toLowerCase() === 'no') return `<td><span class="ap-badge-no">✕</span></td>`;
                      return `<td><span class="ap-badge-text">${cell}</span></td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="ap-table-mobile">
              ${safeHeaders.slice(1).map((h, colIdx) => `
                <div class="ap-mob-card">
                  <div class="ap-mob-header">
                    <div class="ap-mob-img-box">
                      <img src="${safeImages[colIdx] || ''}" alt="${safeAltTexts[colIdx] || 'Asset'}">
                    </div>
                    <div class="ap-mob-title">${h}</div>
                    <a href="${safeCartLinks[colIdx] || '#'}" class="ap-table-btn" style="width:100%; max-width:140px; padding: 8px 12px; font-size:11px; margin-top:4px;">Buy Now</a>
                  </div>

                  <div class="ap-mob-details-grid">
                    ${safeRows.map((row, rIdx) => {
                      const cellValue = (row[colIdx + 1] || '').trim();
                      let displayBadge = '<span class="ap-badge-text">' + cellValue + '</span>';

                      if (rIdx === 0) {
                        displayBadge = '<span style="font-family:monospace; font-weight:700; color:#0f172a;">' + safeCurrency + cellValue + '</span>';
                      } else if (cellValue === '✓' || cellValue.toLowerCase() === 'yes') {
                        displayBadge = '<span class="ap-badge-yes">✓</span>';
                      } else if (cellValue === '✕' || cellValue.toLowerCase() === 'no') {
                        displayBadge = '<span class="ap-badge-no">✕</span>';
                      }

                      return `
                        <div class="ap-mob-detail-row">
                          <span class="ap-mob-label">${row[0] || ''}</span>
                          <span class="ap-mob-val">${displayBadge}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>`;
        }
        return '';
      }).join('')}
    </div>

    ${safeFaqs.length > 0 ? `
    <div class="ap-faq">
      <div class="ap-faq-title">Frequently Asked Questions</div>
      <div class="ap-faq-grid">
        ${safeFaqs.map(f => `
          <div class="ap-faq-node">
            <p class="ap-faq-q"><span>Q:</span> ${f.question}</p>
            <p class="ap-faq-a">${f.answer}</p>
          </div>
        `).join('')}
      </div>
    </div>` : ''}
  </div>
</body>
</html>`;
}
