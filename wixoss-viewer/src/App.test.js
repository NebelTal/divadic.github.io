import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

const cards = [
  ...Array.from({ length: 60 }, (_, index) => ({
  カード番号: `TEST-${String(index + 1).padStart(3, "0")}`,
  カード名: `検索対象 ${index + 1}`,
  カード種類: "シグニ",
  カードタイプ: "精元",
  色: "白",
  レベル: "1",
  コスト: "―",
  パワー: "1000",
  効果テキスト: "検索対象",
  ライフバースト: "―",
  使用タイミング: "―",
  カードの読み方: `ケンサクタイショウ${index + 1}`,
  対応フォーマット: ["diva", "key", "allstar"],
  })),
  {
    カード番号: "KEY-ONLY-001",
    カード名: "キー専用カード",
    カード種類: "シグニ",
    カードタイプ: "精元",
    色: "白",
    レベル: "1",
    コスト: "―",
    パワー: "1000",
    効果テキスト: "―",
    ライフバースト: "―",
    使用タイミング: "―",
    カードの読み方: "キーセンヨウカード",
    対応フォーマット: ["key", "allstar"],
  },
];

beforeEach(() => {
  window.localStorage.clear();
  delete global.Worker;
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ version: "test-version", file: "cards.json" }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(cards),
    });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("renders card search input", async () => {
  render(<App />);
  expect(screen.getByPlaceholderText("検索...")).toBeInTheDocument();
  expect(screen.getByAltText("WIXOSS カード検索")).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "ディーヴァ" })).toBeChecked();
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  expect(global.fetch.mock.calls[1][0]).toContain("cards.json?v=test-version");
});

test("format selection is an exclusive radio group", async () => {
  render(<App />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

  const diva = screen.getByRole("radio", { name: "ディーヴァ" });
  const keySelection = screen.getByRole("radio", { name: "キーセレ" });

  fireEvent.click(keySelection);

  expect(keySelection).toBeChecked();
  expect(diva).not.toBeChecked();
});

test("shows search results 50 at a time", async () => {
  render(<App />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

  const input = screen.getByPlaceholderText("検索...");
  fireEvent.change(input, { target: { value: "検索対象" } });
  fireEvent.keyDown(input, { key: "Enter" });

  expect(await screen.findByText("60件中 50件を表示")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "さらに表示（残り10件）" }));
  expect(await screen.findByText("60件中 60件を表示")).toBeInTheDocument();
});

test("reruns the current search when the format changes", async () => {
  render(<App />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

  const input = screen.getByPlaceholderText("検索...");
  fireEvent.change(input, { target: { value: "キー専用カード" } });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(screen.queryByText("キー専用カード")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("radio", { name: "キーセレ" }));
  expect(await screen.findByText("キー専用カード")).toBeInTheDocument();
});
