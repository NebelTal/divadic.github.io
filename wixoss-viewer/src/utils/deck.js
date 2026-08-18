import { getCardGroupKey } from "./search";
import {
  CARD_FORMAT_FIELD,
  CARD_FORMAT_STATUS,
  DECK_FORMATS,
  getCardFormatStatus,
} from "./formats";

export { DECK_FORMATS, DECK_FORMAT_LABELS } from "./formats";

export const LRIG_CARD_TYPES = ["ルリグ", "アシストルリグ", "ピース", "アーツ", "キー"];
export const NUMBER_ONLY_CARD_TYPE = "未登録";
export const NUMBER_ONLY_SOURCE = "number-only";
export const DEFAULT_LRIG_DECK_LIMIT = 10;
export const PIECE_LRIG_DECK_LIMIT = 12;

export const isLrigCard = (type) => LRIG_CARD_TYPES.includes(type);

export const isLifeBurstCard = (info) =>
  Boolean(info?.ライフバースト && info.ライフバースト !== "―");

const normalizeCardNumber = (cardNumber = "") => cardNumber.trim();

const canBuildCardImageUrl = (cardNumber) =>
  Boolean(cardNumber && cardNumber !== "UNKNOWN" && cardNumber.includes("-"));

export const getCardNumber = (card) => card?.["カード番号"] || "";

export const getDeckItemName = (cardNumber, info, cards = []) => {
  const card = cards.find((c) => c["カード番号"] === cardNumber);
  return card?.["カード表示名"] || card?.["カード名"] || info?.name || info?.cardName || cardNumber;
};

export const isNumberOnlyDeckItem = (info) => info?.source === NUMBER_ONLY_SOURCE;

export const createDeckItem = (card, count) => ({
  count,
  name: card["カード表示名"] || card["カード名"],
  ライフバースト: card["ライフバースト"],
  カード種類: card["カード種類"],
  cardNumber: card["カード番号"],
  groupKey: getCardGroupKey(card),
  [CARD_FORMAT_FIELD]: card[CARD_FORMAT_FIELD],
  source: "cards-json",
});

export const createNumberOnlyDeckItem = (cardNumber, count) => ({
  count,
  name: cardNumber,
  ライフバースト: "―",
  カード種類: NUMBER_ONLY_CARD_TYPE,
  cardNumber,
  groupKey: cardNumber,
  source: NUMBER_ONLY_SOURCE,
});

export const getDeckCount = (deck) =>
  Object.values(deck).reduce((acc, v) => acc + v.count, 0);

export const getLifeBurstCount = (deck) =>
  Object.values(deck).reduce((acc, v) => (isLifeBurstCard(v) ? acc + v.count : acc), 0);

export const getDeckCardCount = (deck, cardNumber) => deck[cardNumber]?.count || 0;

export function reorderDeckState(deck, sourceCardNumber, targetCardNumber) {
  if (
    sourceCardNumber === targetCardNumber ||
    !Object.prototype.hasOwnProperty.call(deck, sourceCardNumber) ||
    !Object.prototype.hasOwnProperty.call(deck, targetCardNumber)
  ) {
    return deck;
  }

  const entries = Object.entries(deck);
  const sourceIndex = entries.findIndex(([cardNumber]) => cardNumber === sourceCardNumber);
  const targetIndex = entries.findIndex(([cardNumber]) => cardNumber === targetCardNumber);
  const [movedEntry] = entries.splice(sourceIndex, 1);
  entries.splice(targetIndex, 0, movedEntry);

  return Object.fromEntries(entries);
}

export const hasPieceInLrigDeck = (deckLrig) =>
  Object.values(deckLrig).some((item) => item.カード種類 === "ピース");

export const getLrigDeckLimit = (deckLrig) =>
  hasPieceInLrigDeck(deckLrig) ? PIECE_LRIG_DECK_LIMIT : DEFAULT_LRIG_DECK_LIMIT;

export const getLrigDeckLimitForAddition = (deckLrig, cardType) =>
  cardType === "ピース" || hasPieceInLrigDeck(deckLrig)
    ? PIECE_LRIG_DECK_LIMIT
    : DEFAULT_LRIG_DECK_LIMIT;

export function adjustDeckState(prev, cardNumber, delta, type, lb, name, groupKey) {
  const normalizedCardNumber = normalizeCardNumber(cardNumber);
  if (!normalizedCardNumber) return prev;

  const maxCount = isLrigCard(type) ? 1 : 4;
  const prevItem = prev[normalizedCardNumber];
  const prevCount = prevItem?.count || 0;
  const newCount = Math.max(0, Math.min(maxCount, prevCount + delta));

  if (newCount === 0) {
    const copy = { ...prev };
    delete copy[normalizedCardNumber];
    return copy;
  }

  return {
    ...prev,
    [normalizedCardNumber]: {
      ...prevItem,
      count: newCount,
      name: name || prevItem?.name || normalizedCardNumber,
      ライフバースト: lb ?? prevItem?.ライフバースト ?? "―",
      カード種類: type || prevItem?.カード種類 || NUMBER_ONLY_CARD_TYPE,
      cardNumber: normalizedCardNumber,
      groupKey: groupKey || prevItem?.groupKey || normalizedCardNumber,
      source: prevItem?.source || "cards-json",
    },
  };
}

export function splitMainDeck(deckMain) {
  const mainList = Object.entries(deckMain);
  return {
    lbCards: mainList.filter(([, info]) => isLifeBurstCard(info)),
    nonLbCards: mainList.filter(([, info]) => !isLifeBurstCard(info)),
  };
}

export function getCardNumbers(deck) {
  return Object.entries(deck).flatMap(([cardNumber, info]) =>
    Array(info.count).fill(info.cardNumber || cardNumber || "UNKNOWN")
  );
}

export function buildDeckNumberLists(deckLrig, deckMain) {
  const { lbCards, nonLbCards } = splitMainDeck(deckMain);

  return {
    cardList: { Lrig: deckLrig, LB: lbCards, nLB: nonLbCards },
    numList: {
      Lrig: getCardNumbers(deckLrig),
      LB: getCardNumbers(Object.fromEntries(lbCards)),
      nLB: getCardNumbers(Object.fromEntries(nonLbCards)),
    },
  };
}

export function importDeckFromCardNumbers(cardNumbers, cards, deckFormat = DECK_FORMATS.ALLSTAR) {
  const newMain = {};
  const newLrig = {};
  const summary = {
    totalLines: cardNumbers.length,
    importedCards: 0,
    registeredCards: 0,
    numberOnlyCards: 0,
    invalidLines: [],
    limitedCards: [],
    formatUnavailableCards: [],
    formatUnknownCards: [],
  };

  for (const rawCardNumber of cardNumbers) {
    const cardNumber = normalizeCardNumber(rawCardNumber);
    const card = cards.find((c) => c["カード番号"] === cardNumber);

    if (!card && !canBuildCardImageUrl(cardNumber)) {
      summary.invalidLines.push(rawCardNumber);
      continue;
    }

    const formatStatus = card
      ? getCardFormatStatus(card, deckFormat)
      : CARD_FORMAT_STATUS.UNKNOWN;
    if (
      formatStatus === CARD_FORMAT_STATUS.UNAVAILABLE &&
      !summary.formatUnavailableCards.includes(cardNumber)
    ) {
      summary.formatUnavailableCards.push(cardNumber);
    }
    if (
      formatStatus === CARD_FORMAT_STATUS.UNKNOWN &&
      !summary.formatUnknownCards.includes(cardNumber)
    ) {
      summary.formatUnknownCards.push(cardNumber);
    }

    const type = card ? card["カード種類"] : NUMBER_ONLY_CARD_TYPE;
    const isLrig = isLrigCard(type);
    const target = isLrig ? newLrig : newMain;
    const max = isLrig ? 1 : 4;
    const prevCount = target[cardNumber]?.count || 0;
    const itemGroupKey = card ? getCardGroupKey(card) : cardNumber;
    const groupCount = Object.values(target).reduce(
      (count, item) => count + (item.groupKey === itemGroupKey ? item.count : 0),
      0
    );

    const lrigLimit = getLrigDeckLimitForAddition(newLrig, type);
    if (
      prevCount >= max ||
      groupCount >= max ||
      (isLrig && getDeckCount(newLrig) >= lrigLimit)
    ) {
      if (!summary.limitedCards.includes(cardNumber)) {
        summary.limitedCards.push(cardNumber);
      }
      continue;
    }

    target[cardNumber] = card
      ? createDeckItem(card, prevCount + 1)
      : createNumberOnlyDeckItem(cardNumber, prevCount + 1);

    summary.importedCards += 1;
    if (card) {
      summary.registeredCards += 1;
    } else {
      summary.numberOnlyCards += 1;
    }
  }

  return { deckMain: newMain, deckLrig: newLrig, summary };
}

export function getCardImageUrl(cardNumber) {
  if (!canBuildCardImageUrl(cardNumber)) return null;
  const parts = cardNumber.split("-");
  const prefix = parts[0];
  return `https://www.takaratomy.co.jp/products/wixoss/library/images/card/${prefix}/${cardNumber}.jpg`;
}

export function getHighQualityCardImageUrl(cardNumber) {
  if (!canBuildCardImageUrl(cardNumber)) return null;
  const parts = cardNumber.split("-");
  const prefix = parts[0];
  return `https://www.takaratomy.co.jp/products/wixoss/img/card/${prefix}/${cardNumber}.jpg`;
}

export function prepareDeckImageEntries(deckLrig, deckMain, cards) {
  const toEntry = ([cardNumber, info]) => {
    const card = cards.find((c) => c["カード番号"] === cardNumber);
    return {
      name: getDeckItemName(cardNumber, info, cards),
      count: info.count,
      cardNumber: info.cardNumber || cardNumber,
      card,
      cardType: info.カード種類,
      level: card?.["レベル"] || "0",
      source: info.source,
    };
  };

  const lrigEntries = Object.entries(deckLrig).map(toEntry);
  const mainEntries = Object.entries(deckMain).map(toEntry);

  const signiByLevel = {};
  const spells = [];
  const others = [];

  mainEntries.forEach((entry) => {
    if (entry.cardType === "シグニ") {
      const level = entry.level || "0";
      if (!signiByLevel[level]) {
        signiByLevel[level] = [];
      }
      signiByLevel[level].push(entry);
    } else if (entry.cardType === "スペル") {
      spells.push(entry);
    } else {
      others.push(entry);
    }
  });

  const sortedLevels = Object.keys(signiByLevel).sort((a, b) => {
    const numA = parseInt(a, 10) || 0;
    const numB = parseInt(b, 10) || 0;
    return numA - numB;
  });

  return {
    lrigEntries,
    signiByLevel,
    spells,
    others,
    sortedLevels,
    totalCards: getDeckCount(deckMain) + getDeckCount(deckLrig),
  };
}
