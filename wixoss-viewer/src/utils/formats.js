export const DECK_FORMATS = {
  DIVA: "diva",
  KEY: "key",
  ALLSTAR: "allstar",
};

export const DECK_FORMAT_LABELS = {
  [DECK_FORMATS.DIVA]: "ディーヴァ",
  [DECK_FORMATS.KEY]: "キーセレ",
  [DECK_FORMATS.ALLSTAR]: "オールスター",
};

export const CARD_FORMAT_FIELD = "対応フォーマット";

export const CARD_FORMAT_STATUS = {
  ALLOWED: "allowed",
  UNAVAILABLE: "unavailable",
  UNKNOWN: "unknown",
};

export const getCardFormatStatus = (card, deckFormat) => {
  if (deckFormat === DECK_FORMATS.ALLSTAR) {
    return CARD_FORMAT_STATUS.ALLOWED;
  }

  const formats = card?.[CARD_FORMAT_FIELD];
  if (!Array.isArray(formats)) {
    return CARD_FORMAT_STATUS.UNKNOWN;
  }

  return formats.includes(deckFormat)
    ? CARD_FORMAT_STATUS.ALLOWED
    : CARD_FORMAT_STATUS.UNAVAILABLE;
};

export const isCardAllowedInFormat = (card, deckFormat) =>
  getCardFormatStatus(card, deckFormat) === CARD_FORMAT_STATUS.ALLOWED;
