import { fireEvent, render, screen } from "@testing-library/react";
import CardResultList from "./CardResultList";
import { groupCardsByDisplayName } from "../utils/search";

const baseCard = {
  カード名: "テストカード",
  カード表示名: "テストカード",
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

test("adds the printing selected from a grouped search result", () => {
  const cards = groupCardsByDisplayName([
    { ...baseCard, カード番号: "TEST-001" },
    { ...baseCard, カード番号: "TEST-001P", 注記: "別イラスト" },
  ]);
  const onAdjustDeck = jest.fn();

  render(
    <CardResultList
      cards={cards}
      total={1}
      loading={false}
      deckCounts={{}}
      canAddCard={() => true}
      onAdjustDeck={onAdjustDeck}
      onLoadMore={() => {}}
    />
  );

  fireEvent.change(screen.getByLabelText("版を選択"), {
    target: { value: "TEST-001P" },
  });
  fireEvent.click(screen.getByRole("button", { name: "+1" }));

  expect(onAdjustDeck).toHaveBeenCalledWith(
    "TEST-001P",
    1,
    "シグニ",
    "―",
    "テストカード",
    expect.any(String)
  );
});

test("shows every printing as an image and selects one from the gallery", () => {
  const cards = groupCardsByDisplayName([
    { ...baseCard, カード番号: "TEST-001" },
    { ...baseCard, カード番号: "TEST-001P", 注記: "別イラスト" },
  ]);
  const onAdjustDeck = jest.fn();

  render(
    <CardResultList
      cards={cards}
      total={1}
      loading={false}
      deckCounts={{}}
      canAddCard={() => true}
      onAdjustDeck={onAdjustDeck}
      onLoadMore={() => {}}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "全2種を見る" }));

  expect(screen.getByRole("dialog", { name: "テストカードのカード画像" })).toBeInTheDocument();
  expect(screen.getByAltText("テストカード TEST-001")).toBeInTheDocument();
  expect(screen.getByAltText("テストカード TEST-001P")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "TEST-001Pを選択" }));
  fireEvent.click(screen.getByLabelText("閉じる"));
  fireEvent.click(screen.getByRole("button", { name: "+1" }));

  expect(onAdjustDeck).toHaveBeenCalledWith(
    "TEST-001P",
    1,
    "シグニ",
    "―",
    "テストカード",
    expect.any(String)
  );
});

test("counts all printings toward the shared copy limit", () => {
  const cards = groupCardsByDisplayName([
    { ...baseCard, カード番号: "TEST-001" },
    { ...baseCard, カード番号: "TEST-001P" },
  ]);

  render(
    <CardResultList
      cards={cards}
      total={1}
      loading={false}
      deckCounts={{ "TEST-001": 2, "TEST-001P": 2 }}
      canAddCard={() => true}
      onAdjustDeck={() => {}}
      onLoadMore={() => {}}
    />
  );

  expect(screen.getByText("採用 4/4")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "+1" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "+4" })).toBeDisabled();
});

test("offers only printings available in the selected format", () => {
  const cards = groupCardsByDisplayName([
    {
      ...baseCard,
      カード番号: "TEST-DIVA",
      対応フォーマット: ["diva", "key", "allstar"],
    },
    {
      ...baseCard,
      カード番号: "TEST-ALLSTAR",
      対応フォーマット: ["allstar"],
    },
  ]);
  const onAdjustDeck = jest.fn();

  render(
    <CardResultList
      cards={cards}
      total={1}
      loading={false}
      deckFormat="diva"
      deckCounts={{}}
      canAddCard={() => true}
      onAdjustDeck={onAdjustDeck}
      onLoadMore={() => {}}
    />
  );

  expect(screen.queryByLabelText("版を選択")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "+1" }));
  expect(onAdjustDeck).toHaveBeenCalledWith(
    "TEST-DIVA",
    1,
    "シグニ",
    "―",
    "テストカード",
    expect.any(String)
  );
});

test("shows each card name when differently named lrigs share a printing group", () => {
  const cards = groupCardsByDisplayName([
    {
      ...baseCard,
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
      ...baseCard,
      カード番号: "NIJI-002",
      カード名: "笹木咲",
      カード表示名: "笹木咲",
      カード種類: "ルリグ",
      カードタイプ: "にじさんじ",
      色: "白",
      レベル: "0",
      効果テキスト: "―",
    },
  ]);

  render(
    <CardResultList
      cards={cards}
      total={1}
      loading={false}
      deckCounts={{}}
      canAddCard={() => true}
      onAdjustDeck={() => {}}
      onLoadMore={() => {}}
    />
  );

  expect(screen.getByRole("option", { name: "NIJI-001 - 月ノ美兎" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "NIJI-002 - 笹木咲" })).toBeInTheDocument();
});
