const CARD_INDEX_FIELDS = [
  "カード番号",
  "カード名",
  "カード表示名",
  "注記",
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

const getCardDisplayName = (card) => card["カード表示名"] || card["カード名"] || "";

const CARD_GROUP_FIELDS = [
  "カード表示名",
  "カード種類",
  "カードタイプ",
  "色",
  "レベル",
  "コスト",
  "パワー",
  "効果テキスト",
  "ライフバースト",
  "使用タイミング",
];

const normalizeCardGroupValue = (field, value = "") => {
  let normalized = value
    .toString()
    .trim()
    .replace(/<br\s*\/?>/gi, "")
    .normalize("NFKC");

  if (field === "ライフバースト") {
    normalized = normalized.replace(/^ライフバースト:/, "");
  }
  if (field === "効果テキスト" || field === "ライフバースト") {
    normalized = normalized.replace(/\[([1-9])\]/g, "$1");
  }
  return normalized.replace(/\s+/g, "");
};

const getCardGroupKey = (card) =>
  CARD_GROUP_FIELDS.map((field) =>
    normalizeCardGroupValue(
      field,
      field === "カード表示名" ? getCardDisplayName(card) : card[field] || ""
    )
  ).join("\u001f");

const groupCardsByDisplayName = (sourceCards) => {
  const grouped = [];
  const indexes = new Map();

  sourceCards.forEach((card) => {
    const groupKey = getCardGroupKey(card);
    if (!indexes.has(groupKey)) {
      indexes.set(groupKey, grouped.length);
      grouped.push(card);
      return;
    }

    const index = indexes.get(groupKey);
    const current = grouped[index];
    const displayName = getCardDisplayName(card);
    const currentIsPlain = current["カード名"] === getCardDisplayName(current);
    const candidateIsPlain = card["カード名"] === displayName;
    if (candidateIsPlain && !currentIsPlain) grouped[index] = card;
  });

  return grouped;
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
          const nameValues = [
            raw,
            card["カード表示名"] || "",
            card["注記"] || "",
          ];
          return useRegex
            ? nameValues.some((value) => regex.test(value)) || regex.test(reading)
            : nameValues.some((value) =>
                value.toLowerCase().includes(keyword.toLowerCase())
              ) ||
                toHiragana(reading.toLowerCase()).includes(normalizedKeyword);
        }
        return useRegex ? regex.test(raw) : raw.toLowerCase().includes(keyword.toLowerCase());
      });
    })
  );

  return groupCardsByDisplayName(result);
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
