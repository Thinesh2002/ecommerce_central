/* ================= RELATED (DEMAND) KEYWORDS ================= */
const getRelatedKeywords = (titles, baseKeyword) => {
  const ignoreWords = [
    "for","with","and","the","of","to",
    "new","set","kit","pair","pcs"
  ];

  const baseWords = baseKeyword.toLowerCase().split(" ");
  const wordMap = {};

  titles.forEach(title => {
    const words = title
      .toLowerCase()
      .replace(/[^a-z0-9äöüß ]/g, "")
      .split(" ")
      .filter(Boolean);

    words.forEach(word => {
      const normalized = word.endsWith("s")
        ? word.slice(0, -1)
        : word;

      if (
        normalized.length > 2 &&
        !ignoreWords.includes(normalized) &&
        !baseWords.includes(normalized)
      ) {
        wordMap[normalized] = (wordMap[normalized] || 0) + 1;
      }
    });
  });

  return Object.entries(wordMap)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, count]) => ({
      keyword: word,
      demand: count
    }));
};


/* ================= LONG TAIL KEYWORDS ================= */
const getLongTailKeywords = (titles, baseKeyword) => {
  const stopWords = [
    "for","with","and","the","of","to",
    "new","set","kit","pair","pcs"
  ];

  const phrases = {};
  const base = baseKeyword.toLowerCase();

  titles.forEach(title => {
    const words = title
      .toLowerCase()
      .replace(/[^a-z0-9äöüß ]/g, "")
      .split(" ")
      .filter(w => w.length > 2 && !stopWords.includes(w));

    for (let i = 0; i < words.length; i++) {
      for (let len = 3; len <= 5; len++) {
        const phrase = words.slice(i, i + len).join(" ");
        if (phrase.includes(base)) {
          phrases[phrase] = (phrases[phrase] || 0) + 1;
        }
      }
    }
  });

  return Object.entries(phrases)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([phrase]) => phrase);
};


/* ================= EXPORT (IMPORTANT) ================= */
module.exports = {
  getRelatedKeywords,
  getLongTailKeywords
};
