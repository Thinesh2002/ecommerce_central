/* ---------- ESTIMATED SALES LOGIC ---------- */
exports.estimateSales = (item) => {
  if (Number(item.quantitySold) > 0) return Number(item.quantitySold);
  if (Number(item.watchCount) > 0) return Number(item.watchCount);

  // fallback estimate
  return Math.floor(Math.random() * 20 + 5);
};

/* ---------- KEYWORD EXTRACTION (PARENT + VARIATIONS) ---------- */
/**
 * Expected input:
 * [
 *   { id: "parent", title: "LED Light Bar 12V Waterproof" },
 *   { id: "v1", title: "LED Light Bar 12V 20 Inch Waterproof" },
 *   { id: "v2", title: "LED Light Bar 12V 30 Inch Waterproof" }
 * ]
 */
exports.extractKeywordsByVariation = (items) => {
  const ignore = [
    "for", "with", "and", "the", "of", "to",
    "new", "set", "kit", "pcs", "lot"
  ];

  return items.map(item => {
    const keywordMap = {};

    if (!item.title) {
      return {
        id: item.id,
        title: "",
        keywords: []
      };
    }

    item.title
      .toLowerCase()
      .replace(/[^a-z0-9äöüß ]/g, "")
      .split(/\s+/)
      .forEach(word => {
        if (word.length > 2 && !ignore.includes(word)) {
          keywordMap[word] = (keywordMap[word] || 0) + 1;
        }
      });

    return {
      id: item.id,
      title: item.title,
      keywords: Object.entries(keywordMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([keyword, count]) => ({
          keyword,
          count
        }))
    };
  });
};
