import {
  CARD_EFFECTLESS_LEVEL_ZERO_LRIG_FIELD,
  isEffectlessLevelZeroLrig,
} from "./search";

export const CARD_INDEX_FIELDS = [
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

const getIndexValue = (card, field) => {
  if (field === "対応フォーマット") {
    return Array.isArray(card[field]) ? card[field] : [];
  }
  if (field === "ライフバースト") {
    return card[field] && card[field] !== "―" ? "有" : "―";
  }
  return card[field] || "";
};

export const createCardIndex = (cards) =>
  cards.map((card) => ({
    ...Object.fromEntries(CARD_INDEX_FIELDS.map((field) => [field, getIndexValue(card, field)])),
    [CARD_EFFECTLESS_LEVEL_ZERO_LRIG_FIELD]: isEffectlessLevelZeroLrig(card),
  }));
