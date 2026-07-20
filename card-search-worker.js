const CARD_INDEX_FIELDS = [
  "カード番号",
  "カード名",
  "カード種類",
  "カードタイプ",
  "色",
  "レベル",
  "ライフバースト",
  "カードの読み方",
];

const toHiragana = (str = "") =>
  str.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );

const normalizeFilterValue = (value = "") => value.toString().trim();

const matchesSelectedValues = (card, field, selectedValues, matcher) => {
  if (!selectedValues || selectedValues.length === 0) return true;
  const raw = normalizeFilterValue(card[field] || "");
  return selectedValues.some((value) => matcher(raw, value));
};

const matchesAllSelectedValues = (card, field, selectedValues, matcher) => {
  if (!selectedValues || selectedValues.length === 0) return true;
  const raw = normalizeFilterValue(card[field] || "");
  return selectedValues.every((value) => matcher(raw, value));
};

const filterCards = (sourceCards, query, searchFields, useRegex, filters = {}) => {
  const keywords = query.trim().split(/\s+/).filter(Boolean);
  const activeFields = Object.keys(searchFields).filter((key) => searchFields[key]);
  const selectedColors = filters["色"] || [];
  const selectedTypes = filters["カード種類"] || [];
  const selectedLevels = filters["レベル"] || [];
  const hasActiveFilters =
    selectedColors.length > 0 || selectedTypes.length > 0 || selectedLevels.length > 0;

  if ((keywords.length === 0 || activeFields.length === 0) && !hasActiveFilters) return [];

  const result = sourceCards.filter((card) =>
    matchesAllSelectedValues(card, "色", selectedColors, (raw, value) => raw.includes(value)) &&
    matchesSelectedValues(card, "カード種類", selectedTypes, (raw, value) => raw === value) &&
    matchesSelectedValues(card, "レベル", selectedLevels, (raw, value) => raw === value) &&
    keywords.every((keyword) => {
      const normalizedKeyword = toHiragana(keyword.toLowerCase());
      let regex = null;
      if (useRegex) {
        try {
          regex = new RegExp(keyword, "i");
        } catch (error) {
          return false;
        }
      }

      return activeFields.some((field) => {
        const raw = (card[field] || "").toString();
        if (field === "カード名") {
          const reading = card["カードの読み方"] || "";
          return useRegex
            ? regex.test(raw) || regex.test(reading)
            : raw.toLowerCase().includes(keyword.toLowerCase()) ||
                toHiragana(reading.toLowerCase()).includes(normalizedKeyword);
        }
        return useRegex ? regex.test(raw) : raw.toLowerCase().includes(keyword.toLowerCase());
      });
    })
  );

  const seen = new Set();
  return result.filter((card) => {
    const name = card["カード名"];
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
};

let cards = [];
let currentResults = [];
let currentRequestId = 0;

self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    try {
      const response = await fetch(data.url);
      if (!response.ok) throw new Error(`Card data request failed: ${response.status}`);
      cards = await response.json();
      const cardIndex = cards.map((card) =>
        Object.fromEntries(
          CARD_INDEX_FIELDS.map((field) => [
            field,
            field === "ライフバースト"
              ? card[field] && card[field] !== "―"
                ? "有"
                : "―"
              : card[field] || "",
          ])
        )
      );
      self.postMessage({ type: "ready", cardIndex, cardCount: cards.length });
    } catch (error) {
      self.postMessage({ type: "error", message: error.message });
    }
    return;
  }

  if (data.type === "search") {
    currentRequestId = data.requestId;
    currentResults = filterCards(
      cards,
      data.query,
      data.searchFields,
      data.useRegex,
      data.filters
    );
    self.postMessage({
      type: "search-result",
      requestId: data.requestId,
      cards: currentResults.slice(0, data.limit),
      total: currentResults.length,
    });
    return;
  }

  if (data.type === "load-more" && data.requestId === currentRequestId) {
    self.postMessage({
      type: "more-results",
      requestId: data.requestId,
      cards: currentResults.slice(data.offset, data.offset + data.limit),
      total: currentResults.length,
    });
  }
};
