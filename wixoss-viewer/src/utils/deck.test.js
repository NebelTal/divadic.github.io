import {
  buildDeckNumberLists,
  getLrigDeckLimit,
  getLrigDeckLimitForAddition,
  getHighQualityCardImageUrl,
  importDeckFromCardNumbers,
  isLrigCard,
  reorderDeckState,
} from "./deck";
import { createCardIndex } from "./cardIndex";

const registeredCard = {
  カード番号: "WXDi-P16-088",
  カード名: "混天　A・アロー",
  カード種類: "シグニ",
  ライフバースト: "―",
};

test("imports unknown card numbers as image-only deck entries", () => {
  const imported = importDeckFromCardNumbers(
    ["WXDi-P16-088", "WX01-001", "WX01-001"],
    [registeredCard]
  );

  expect(imported.deckLrig).toEqual({});
  expect(imported.deckMain["WXDi-P16-088"]).toMatchObject({
    count: 1,
    name: "混天　A・アロー",
    cardNumber: "WXDi-P16-088",
    source: "cards-json",
  });
  expect(imported.deckMain["WX01-001"]).toMatchObject({
    count: 2,
    name: "WX01-001",
    カード種類: "未登録",
    ライフバースト: "―",
    cardNumber: "WX01-001",
    source: "number-only",
  });
  expect(imported.summary).toMatchObject({
    totalLines: 3,
    importedCards: 3,
    registeredCards: 1,
    numberOnlyCards: 2,
    invalidLines: [],
    limitedCards: [],
  });
});

test("reorders deck entries without changing their data", () => {
  const deck = {
    "CARD-A": { count: 1 },
    "CARD-B": { count: 2 },
    "CARD-C": { count: 3 },
  };

  const reordered = reorderDeckState(deck, "CARD-A", "CARD-C");

  expect(Object.keys(reordered)).toEqual(["CARD-B", "CARD-C", "CARD-A"]);
  expect(reordered["CARD-A"]).toBe(deck["CARD-A"]);
  expect(reordered["CARD-B"]).toBe(deck["CARD-B"]);
  expect(reordered["CARD-C"]).toBe(deck["CARD-C"]);
});

test("uses stored card numbers when exporting deck numbers", () => {
  const imported = importDeckFromCardNumbers(["WX01-001"], []);
  const { numList } = buildDeckNumberLists(imported.deckLrig, imported.deckMain, []);

  expect(numList.nLB).toEqual(["WX01-001"]);
});

test("ignores unknown import lines that cannot become image URLs", () => {
  const imported = importDeckFromCardNumbers(["not a card number"], []);

  expect(imported.deckMain).toEqual({});
  expect(imported.deckLrig).toEqual({});
  expect(imported.summary.invalidLines).toEqual(["not a card number"]);
});

test("builds high quality official image URLs from old card numbers", () => {
  expect(getHighQualityCardImageUrl("WX01-001")).toBe(
    "https://www.takaratomy.co.jp/products/wixoss/img/card/WX01/WX01-001.jpg"
  );
});

test("treats key cards as lrig deck cards", () => {
  expect(isLrigCard("キー")).toBe(true);
});

test("expands lrig deck limit to 12 when a piece is included", () => {
  expect(getLrigDeckLimit({})).toBe(10);
  expect(getLrigDeckLimitForAddition({}, "ピース")).toBe(12);
  expect(
    getLrigDeckLimit({
      "WXDi-P00-001": {
        count: 1,
        カード種類: "ピース",
      },
    })
  ).toBe(12);
});

test("limits imported lrig deck to 10 unless a piece extends it", () => {
  const lrigCards = Array.from({ length: 11 }, (_, index) => ({
    カード番号: `LRIG-${index + 1}`,
    カード名: `ルリグ${index + 1}`,
    カード種類: "ルリグ",
    ライフバースト: "―",
  }));
  const pieceCard = {
    カード番号: "PIECE-1",
    カード名: "ピース1",
    カード種類: "ピース",
    ライフバースト: "―",
  };

  const tenOnly = importDeckFromCardNumbers(
    lrigCards.map((card) => card.カード番号),
    lrigCards
  );
  expect(Object.keys(tenOnly.deckLrig)).toHaveLength(10);
  expect(tenOnly.summary.limitedCards).toEqual(["LRIG-11"]);

  const withPiece = importDeckFromCardNumbers(
    [...lrigCards.slice(0, 10).map((card) => card.カード番号), "PIECE-1", "LRIG-11"],
    [...lrigCards, pieceCard]
  );
  expect(Object.keys(withPiece.deckLrig)).toHaveLength(12);
  expect(withPiece.summary.limitedCards).toEqual([]);
});

test("limits alternate printings to four copies in total", () => {
  const sharedFields = {
    カード名: "同じカード",
    カード表示名: "同じカード",
    カード種類: "シグニ",
    カードタイプ: "精元",
    色: "白",
    レベル: "1",
    コスト: "―",
    パワー: "1000",
    効果テキスト: "効果",
    ライフバースト: "―",
    使用タイミング: "―",
  };
  const printings = [
    { ...sharedFields, カード番号: "TEST-001" },
    { ...sharedFields, カード番号: "TEST-001P" },
  ];

  const imported = importDeckFromCardNumbers(
    ["TEST-001", "TEST-001", "TEST-001", "TEST-001P", "TEST-001P"],
    printings
  );

  expect(imported.deckMain["TEST-001"].count).toBe(3);
  expect(imported.deckMain["TEST-001P"].count).toBe(1);
  expect(imported.summary.limitedCards).toEqual(["TEST-001P"]);
});

test("uses the precomputed group identity when importing indexed lrig cards", () => {
  const indexedCards = createCardIndex([
    {
      カード番号: "LRIG-PLAIN",
      カード名: "効果なしルリグ",
      カード表示名: "効果なしルリグ",
      カード種類: "ルリグ",
      カードタイプ: "テスト",
      色: "白",
      レベル: "0",
      効果テキスト: "―",
    },
    {
      カード番号: "LRIG-EFFECT",
      カード名: "効果ありルリグ",
      カード表示名: "効果ありルリグ",
      カード種類: "ルリグ",
      カードタイプ: "テスト",
      色: "白",
      レベル: "0",
      効果テキスト: "ゲーム開始時にカードを１枚引く。",
    },
  ]);

  const imported = importDeckFromCardNumbers(
    ["LRIG-PLAIN", "LRIG-EFFECT"],
    indexedCards
  );

  expect(Object.keys(imported.deckLrig)).toHaveLength(2);
  expect(imported.summary.limitedCards).toEqual([]);
});

test("reports format unavailable and unknown imports without deleting them", () => {
  const divaOnly = {
    ...registeredCard,
    対応フォーマット: ["diva", "key", "allstar"],
  };
  const imported = importDeckFromCardNumbers(
    ["WXDi-P16-088", "WX01-001"],
    [divaOnly],
    "allstar"
  );

  expect(imported.summary.formatUnavailableCards).toEqual([]);
  expect(imported.summary.formatUnknownCards).toEqual(["WX01-001"]);
  expect(imported.deckMain["WX01-001"]).toBeDefined();

  const keyImported = importDeckFromCardNumbers(
    ["WXDi-P16-088"],
    [{ ...registeredCard, 対応フォーマット: ["allstar"] }],
    "key"
  );
  expect(keyImported.summary.formatUnavailableCards).toEqual(["WXDi-P16-088"]);
  expect(keyImported.deckMain["WXDi-P16-088"]).toBeDefined();
});
