export function filterCards(cards, keywords, fields, useRegex) {
  const result = cards.filter((card) =>
    keywords.every((kw) => {
      try {
        const isRegex = !!useRegex;
        const regex = isRegex ? new RegExp(kw, "i") : null;
        return fields.some((field) => {
          const value = card[field] || "";
          return isRegex
            ? regex.test(value)
            : value.toLowerCase().includes(kw.toLowerCase());
        });
      } catch (e) {
        console.error("Invalid regex:", kw);
        return false;
      }
    })
  );

  const seen = new Set();
  return result.filter((card) => {
    if (seen.has(card["カード名"])) return false;
    seen.add(card["カード名"]);
    return true;
  });
}
