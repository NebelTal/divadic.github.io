import { fireEvent, render, screen } from "@testing-library/react";
import DeckDrawer from "./DeckDrawer";

test("keeps format unavailable deck cards visible and disables increasing them", () => {
  const card = {
    カード番号: "OLD-001",
    カード名: "旧カード",
    カード表示名: "旧カード",
    カード種類: "シグニ",
    ライフバースト: "―",
    対応フォーマット: ["allstar"],
  };
  const deckMain = {
    "OLD-001": {
      count: 1,
      name: "旧カード",
      カード種類: "シグニ",
      ライフバースト: "―",
      groupKey: "OLD-001",
      source: "cards-json",
    },
  };

  render(
    <DeckDrawer
      minimized={false}
      allowCollapse={false}
      showActions={false}
      showMainDeck
      deckEntries={Object.entries(deckMain)}
      deckMain={deckMain}
      deckLrig={{}}
      cards={[card]}
      totalCount={1}
      lbCount={0}
      deckFormat="diva"
      lrigDeckLimit={10}
      onShowMainDeckChange={() => {}}
      onAdjustDeck={() => {}}
    />
  );

  expect(screen.getByText("フォーマット外 1種")).toBeInTheDocument();
  expect(screen.getAllByText("フォーマット外")).toHaveLength(1);
  expect(screen.getByRole("button", { name: "＋" })).toBeDisabled();
  expect(screen.getByText("旧カード")).toBeInTheDocument();
});

test("moves a deck card with the reorder handle keyboard controls", () => {
  const deckMain = {
    "CARD-A": { count: 1, name: "カードA", カード種類: "シグニ" },
    "CARD-B": { count: 1, name: "カードB", カード種類: "シグニ" },
  };
  const onReorderDeck = jest.fn();

  render(
    <DeckDrawer
      minimized={false}
      allowCollapse={false}
      showActions={false}
      showMainDeck
      deckEntries={Object.entries(deckMain)}
      deckMain={deckMain}
      deckLrig={{}}
      cards={[]}
      totalCount={2}
      lbCount={0}
      deckFormat="allstar"
      lrigDeckLimit={10}
      onShowMainDeckChange={() => {}}
      onAdjustDeck={() => {}}
      onReorderDeck={onReorderDeck}
    />
  );

  fireEvent.keyDown(screen.getByRole("button", { name: /カードAを並べ替え/ }), {
    key: "ArrowDown",
  });

  expect(onReorderDeck).toHaveBeenCalledWith("CARD-A", "CARD-B");
});

test("stops pointer reordering when the pointer is released outside the handle", () => {
  const deckMain = {
    "CARD-A": { count: 1, name: "カードA", カード種類: "シグニ" },
    "CARD-B": { count: 1, name: "カードB", カード種類: "シグニ" },
  };
  const onReorderDeck = jest.fn();

  render(
    <DeckDrawer
      minimized={false}
      allowCollapse={false}
      showActions={false}
      showMainDeck
      deckEntries={Object.entries(deckMain)}
      deckMain={deckMain}
      deckLrig={{}}
      cards={[]}
      totalCount={2}
      lbCount={0}
      deckFormat="allstar"
      lrigDeckLimit={10}
      onShowMainDeckChange={() => {}}
      onAdjustDeck={() => {}}
      onReorderDeck={onReorderDeck}
    />
  );

  const handle = screen.getByRole("button", { name: /カードAを並べ替え/ });
  fireEvent.pointerDown(handle, { button: 0, pointerId: 1, pointerType: "mouse" });
  fireEvent.pointerUp(window, { pointerId: 1, pointerType: "mouse" });
  fireEvent.pointerMove(window, {
    buttons: 1,
    clientX: 10,
    clientY: 10,
    pointerId: 1,
    pointerType: "mouse",
  });

  expect(onReorderDeck).not.toHaveBeenCalled();
});

test("continues pointer reordering across multiple deck rows", () => {
  const deckMain = {
    "CARD-A": { count: 1, name: "カードA", カード種類: "シグニ" },
    "CARD-B": { count: 1, name: "カードB", カード種類: "シグニ" },
    "CARD-C": { count: 1, name: "カードC", カード種類: "シグニ" },
  };
  const onReorderDeck = jest.fn();

  render(
    <DeckDrawer
      minimized={false}
      allowCollapse={false}
      showActions={false}
      showMainDeck
      deckEntries={Object.entries(deckMain)}
      deckMain={deckMain}
      deckLrig={{}}
      cards={[]}
      totalCount={3}
      lbCount={0}
      deckFormat="allstar"
      lrigDeckLimit={10}
      onShowMainDeckChange={() => {}}
      onAdjustDeck={() => {}}
      onReorderDeck={onReorderDeck}
    />
  );

  const handle = screen.getByRole("button", { name: /カードAを並べ替え/ });
  const cardBRow = screen.getByText("カードB").closest("[data-deck-card-number]");
  const cardCRow = screen.getByText("カードC").closest("[data-deck-card-number]");
  const originalElementFromPoint = document.elementFromPoint;
  document.elementFromPoint = jest
    .fn()
    .mockReturnValueOnce(cardBRow)
    .mockReturnValueOnce(cardCRow);

  fireEvent.pointerDown(handle, { button: 0, pointerId: 1, pointerType: "mouse" });
  fireEvent.pointerMove(window, {
    buttons: 1,
    clientX: 10,
    clientY: 20,
    pointerId: 1,
    pointerType: "mouse",
  });
  fireEvent.pointerMove(window, {
    buttons: 1,
    clientX: 10,
    clientY: 30,
    pointerId: 1,
    pointerType: "mouse",
  });
  fireEvent.pointerUp(window, { pointerId: 1, pointerType: "mouse" });
  document.elementFromPoint = originalElementFromPoint;

  expect(onReorderDeck).toHaveBeenNthCalledWith(1, "CARD-A", "CARD-B");
  expect(onReorderDeck).toHaveBeenNthCalledWith(2, "CARD-A", "CARD-C");
});
