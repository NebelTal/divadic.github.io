import {
  CARD_FORMAT_STATUS,
  getCardFormatStatus,
  isCardAllowedInFormat,
} from "./formats";

test("uses official format metadata for card legality", () => {
  const card = { 対応フォーマット: ["key", "allstar"] };

  expect(isCardAllowedInFormat(card, "key")).toBe(true);
  expect(isCardAllowedInFormat(card, "diva")).toBe(false);
  expect(getCardFormatStatus(card, "diva")).toBe(CARD_FORMAT_STATUS.UNAVAILABLE);
});

test("treats missing metadata as unknown outside allstar", () => {
  expect(getCardFormatStatus({}, "key")).toBe(CARD_FORMAT_STATUS.UNKNOWN);
  expect(getCardFormatStatus({}, "allstar")).toBe(CARD_FORMAT_STATUS.ALLOWED);
});
