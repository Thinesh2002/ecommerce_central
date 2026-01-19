exports.getRelatedKeywords = (titles, baseKeyword) => {
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
      .split(" ");

    words.forEach(word => {
      if (
        word.length > 2 &&
        !ignoreWords.includes(word) &&
        !baseWords.includes(word)
      ) {
        wordMap[word] = (wordMap[word] || 0) + 1;
      }
    });
  });

 
  return Object.entries(wordMap)
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => ({
      keyword: word,
      demand: count
    }));
};
