import { filterCards, getCardPrintings, groupCardsByDisplayName } from "./search";

const searchFields = {
  カード名: true,
};

const cards = [
  {
    カード番号: "SPDi44-09",
    カード名: "GUMI レベル0（永らえし者　タウィル＝ノル）",
    カード表示名: "永らえし者　タウィル＝ノル",
    注記: "GUMI レベル0",
    カード種類: "ルリグ",
    レベル: "0",
    カードの読み方: "＜ナガラエシモノタウィルノル＞",
  },
  {
    カード番号: "WX24-001",
    カード名: "永らえし者　タウィル＝ノル",
    カード表示名: "永らえし者　タウィル＝ノル",
    注記: "",
    カード種類: "ルリグ",
    レベル: "0",
    カードの読み方: "ナガラエシモノタウィルノル",
  },
];

test("groups print variants by display name and prefers the plain printing", () => {
  const result = filterCards(cards, "タウィル", searchFields, false);

  expect(result).toHaveLength(1);
  expect(result[0]["カード番号"]).toBe("WX24-001");
  expect(getCardPrintings(result[0])).toHaveLength(2);
});

test("can find a printing by its annotation", () => {
  const result = filterCards(cards, "GUMI", searchFields, false);

  expect(result).toHaveLength(1);
  expect(result[0].__matchedPrintingNumber).toBe("SPDi44-09");
  expect(getCardPrintings(result[0])).toHaveLength(2);
});

test("does not group cards that share a display name but have different kinds", () => {
  const sameNameCards = [
    {
      カード番号: "LRIG-01",
      カード名: "白洲アズサ",
      カード表示名: "白洲アズサ",
      カード種類: "ルリグ",
      レベル: "0",
    },
    {
      カード番号: "SIGNI-01",
      カード名: "白洲アズサ",
      カード表示名: "白洲アズサ",
      カード種類: "シグニ",
      レベル: "3",
    },
  ];

  const result = filterCards(sameNameCards, "白洲アズサ", searchFields, false);

  expect(result).toHaveLength(2);
});

test("does not group same-name cards with different colors", () => {
  const sameNameCards = [
    {
      カード番号: "TEST-BLACK",
      カード名: "ウムル",
      カード表示名: "ウムル",
      カード種類: "ルリグ",
      色: "黒",
      レベル: "0",
    },
    {
      カード番号: "TEST-BLUE",
      カード名: "ウムル",
      カード表示名: "ウムル",
      カード種類: "ルリグ",
      色: "青",
      レベル: "0",
    },
  ];

  const result = filterCards(sameNameCards, "ウムル", searchFields, false);

  expect(result).toHaveLength(2);
});

test("groups effectless level zero lrigs by lrig type and color", () => {
  const levelZeroLrigs = [
    {
      カード番号: "NIJI-001",
      カード名: "月ノ美兎",
      カード表示名: "月ノ美兎",
      カード種類: "ルリグ",
      カードタイプ: "にじさんじ",
      色: "白",
      レベル: "0",
      効果テキスト: "―",
    },
    {
      カード番号: "NIJI-002",
      カード名: "笹木咲",
      カード表示名: "笹木咲",
      カード種類: "ルリグ",
      カードタイプ: "にじさんじ",
      色: "白",
      レベル: "0",
      効果テキスト: "―",
    },
    {
      カード番号: "NIJI-003",
      カード名: "樋口楓",
      カード表示名: "樋口楓",
      カード種類: "ルリグ",
      カードタイプ: "にじさんじ",
      色: "赤",
      レベル: "0",
      効果テキスト: "―",
    },
  ];

  const grouped = groupCardsByDisplayName(levelZeroLrigs);
  const result = filterCards(levelZeroLrigs, "笹木咲", searchFields, false);

  expect(grouped).toHaveLength(2);
  expect(result).toHaveLength(1);
  expect(result[0].__matchedPrintingNumber).toBe("NIJI-002");
  expect(getCardPrintings(result[0])).toHaveLength(2);
});

test("does not merge a level zero lrig that has an effect", () => {
  const levelZeroLrigs = [
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
  ];

  expect(groupCardsByDisplayName(levelZeroLrigs)).toHaveLength(2);
});

test("groups cards whose rules text differs only in safe formatting", () => {
  const formattedCards = [
    {
      カード番号: "TEST-01",
      カード名: "同じカード",
      カード表示名: "同じカード",
      カード種類: "シグニ",
      カードタイプ: "精像：天使",
      色: "白",
      レベル: "1",
      コスト: "-",
      パワー: "１０００",
      効果テキスト: "以下から選ぶ。<br>[1]カードを１枚引く。",
      ライフバースト: "カードを１枚引く。",
      使用タイミング: "―",
    },
    {
      カード番号: "TEST-02",
      カード名: "同じカード",
      カード表示名: "同じカード",
      カード種類: "シグニ",
      カードタイプ: "精像：天使",
      色: "白",
      レベル: "1",
      コスト: "-",
      パワー: "1000",
      効果テキスト: "以下から選ぶ。 ①カードを1枚引く。",
      ライフバースト: "ライフバースト：カードを1枚引く。",
      使用タイミング: "―",
    },
  ];

  const result = filterCards(formattedCards, "同じ", searchFields, false);

  expect(result).toHaveLength(1);
});

test("filters grouped search results by the selected format", () => {
  const formatCards = [
    {
      ...cards[0],
      カード番号: "DIVA-001",
      カード名: "フォーマット対象",
      カード表示名: "フォーマット対象",
      注記: "",
      対応フォーマット: ["diva", "key", "allstar"],
    },
    {
      ...cards[0],
      カード番号: "KEY-001",
      カード名: "キー限定",
      カード表示名: "キー限定",
      注記: "",
      対応フォーマット: ["key", "allstar"],
    },
  ];

  expect(filterCards(formatCards, "限定", searchFields, false, {}, "diva")).toHaveLength(0);
  expect(filterCards(formatCards, "限定", searchFields, false, {}, "key")).toHaveLength(1);
  expect(filterCards(formatCards, "限定", searchFields, false, {}, "allstar")).toHaveLength(1);
});
