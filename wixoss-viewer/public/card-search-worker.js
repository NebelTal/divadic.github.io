const CARD_INDEX_FIELDS = [
  "カード番号",
  "カード名",
  "カード表示名",
  "注記",
  "対応フォーマット",
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
const DECK_FORMAT_ALLSTAR = "allstar";
const isCardAllowedInFormat = (card, deckFormat) =>
  deckFormat === DECK_FORMAT_ALLSTAR ||
  (Array.isArray(card["対応フォーマット"]) && card["対応フォーマット"].includes(deckFormat));
const CARD_PRINTINGS_FIELD = "__printings";
const CARD_MATCHED_PRINTING_FIELD = "__matchedPrintingNumber";
const CARD_EFFECTLESS_LEVEL_ZERO_LRIG_FIELD = "__effectlessLevelZeroLrig";
const getCardPrintings = (card) => card[CARD_PRINTINGS_FIELD] || [card];

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

const isEffectlessLevelZeroLrig = (card) => {
  if (Object.prototype.hasOwnProperty.call(card, CARD_EFFECTLESS_LEVEL_ZERO_LRIG_FIELD)) {
    return card[CARD_EFFECTLESS_LEVEL_ZERO_LRIG_FIELD] === true;
  }

  const cardKind = normalizeCardGroupValue("カード種類", card["カード種類"]);
  const level = normalizeCardGroupValue("レベル", card["レベル"]);
  const effect = normalizeCardGroupValue("効果テキスト", card["効果テキスト"]);
  const lrigType = normalizeCardGroupValue("カードタイプ", card["カードタイプ"]);
  const color = normalizeCardGroupValue("色", card["色"]);

  return (
    cardKind === "ルリグ" &&
    level === "0" &&
    ["", "-", "―"].includes(effect) &&
    Boolean(lrigType) &&
    Boolean(color)
  );
};

const getCardGroupKey = (card) => {
  if (isEffectlessLevelZeroLrig(card)) {
    return [
      "effectless-level-zero-lrig",
      normalizeCardGroupValue("カードタイプ", card["カードタイプ"]),
      normalizeCardGroupValue("色", card["色"]),
    ].join("\u001f");
  }

  return CARD_GROUP_FIELDS.map((field) =>
    normalizeCardGroupValue(
      field,
      field === "カード表示名" ? getCardDisplayName(card) : card[field] || ""
    )
  ).join("\u001f");
};

const groupCardsByDisplayName = (sourceCards) => {
  const grouped = [];
  const indexes = new Map();

  sourceCards.forEach((card) => {
    const groupKey = getCardGroupKey(card);
    if (!indexes.has(groupKey)) {
      indexes.set(groupKey, grouped.length);
      grouped.push({ ...card, [CARD_PRINTINGS_FIELD]: [card] });
      return;
    }

    const index = indexes.get(groupKey);
    const current = grouped[index];
    const printings = [...getCardPrintings(current), card];
    const displayName = getCardDisplayName(card);
    const currentIsPlain = current["カード名"] === getCardDisplayName(current);
    const candidateIsPlain = card["カード名"] === displayName;
    if (candidateIsPlain && !currentIsPlain) {
      grouped[index] = { ...card, [CARD_PRINTINGS_FIELD]: printings };
    } else {
      grouped[index] = { ...current, [CARD_PRINTINGS_FIELD]: printings };
    }
  });

  return grouped;
};

const filterCards = (
  sourceCards,
  query,
  searchFields,
  useRegex,
  filters = {},
  deckFormat = DECK_FORMAT_ALLSTAR,
  cardsAreGrouped = false
) => {
  const keywords = query.trim().split(/\s+/).filter(Boolean);
  const activeFields = Object.keys(searchFields).filter((key) => searchFields[key]);
  const selectedColors = filters["色"] || [];
  const selectedTypes = filters["カード種類"] || [];
  const selectedLevels = filters["レベル"] || [];
  const hasActiveFilters =
    selectedColors.length > 0 || selectedTypes.length > 0 || selectedLevels.length > 0;

  if ((keywords.length === 0 || activeFields.length === 0) && !hasActiveFilters) return [];

  const groupedSource = cardsAreGrouped
    ? sourceCards
    : groupCardsByDisplayName(sourceCards);

  const results = [];
  groupedSource.forEach((groupedCard) => {
    const matchingPrintings = getCardPrintings(groupedCard).filter(
      (card) =>
        isCardAllowedInFormat(card, deckFormat) &&
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
            return useRegex
              ? regex.test(raw)
              : raw.toLowerCase().includes(keyword.toLowerCase());
          });
        })
    );
    if (matchingPrintings.length === 0) return;

    const representativeNumber = groupedCard["カード番号"];
    const matchedPrinting =
      matchingPrintings.find(
        (printing) => printing["カード番号"] === representativeNumber
      ) || matchingPrintings[0];
    results.push({
      ...groupedCard,
      [CARD_MATCHED_PRINTING_FIELD]: matchedPrinting["カード番号"],
    });
  });

  return results;
};

let cards = [];
let groupedCards = [];
let currentResults = [];
let currentRequestId = 0;

self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    try {
      const response = await fetch(data.url);
      if (!response.ok) throw new Error(`Card data request failed: ${response.status}`);
      cards = await response.json();
      groupedCards = groupCardsByDisplayName(cards);
      const cardIndex = cards.map((card) => ({
        ...Object.fromEntries(
          CARD_INDEX_FIELDS.map((field) => [
            field,
            field === "ライフバースト"
              ? card[field] && card[field] !== "―"
                ? "有"
                : "―"
              : field === "対応フォーマット"
                ? Array.isArray(card[field]) ? card[field] : []
                : card[field] || "",
          ])
        ),
        [CARD_EFFECTLESS_LEVEL_ZERO_LRIG_FIELD]: isEffectlessLevelZeroLrig(card),
      }));
      self.postMessage({ type: "ready", cardIndex, cardCount: cards.length });
    } catch (error) {
      self.postMessage({ type: "error", message: error.message });
    }
    return;
  }

  if (data.type === "search") {
    currentRequestId = data.requestId;
    currentResults = filterCards(
      groupedCards,
      data.query,
      data.searchFields,
      data.useRegex,
      data.filters,
      data.deckFormat,
      true
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
