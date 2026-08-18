import React, { useMemo, useRef, useState, useEffect } from "react";
import CardResultList from "./components/CardResultList";
import DeckDrawer from "./components/DeckDrawer";
import ImportModal from "./components/ImportModal";
import ImportSummaryModal from "./components/ImportSummaryModal";
import MobileActionPanel from "./components/MobileActionPanel";
import OutputModal from "./components/OutputModal";
import PrintModal from "./components/PrintModal";
import SearchPanel from "./components/SearchPanel";
import { createCardIndex } from "./utils/cardIndex";
import { filterCards, normalizeFilterValue } from "./utils/search";
import {
  adjustDeckState,
  buildDeckNumberLists,
  createDeckItem,
  getCardImageUrl,
  getHighQualityCardImageUrl,
  getDeckCount,
  getLifeBurstCount,
  getDeckItemName,
  getLrigDeckLimit,
  getLrigDeckLimitForAddition,
  DECK_FORMATS,
  importDeckFromCardNumbers,
  isLrigCard,
  prepareDeckImageEntries,
  reorderDeckState,
} from "./utils/deck";
import { isCardAllowedInFormat } from "./utils/formats";
import "./App.css";

const MOBILE_LAYOUT_QUERY = "(max-width: 980px)";
const SAVED_DECK_STORAGE_KEY = "wixoss-viewer.deck.v2";
const SEARCH_PAGE_SIZE = 50;
const CARD_SEARCH_WORKER_VERSION = "5";

const matchesMobileLayout = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(MOBILE_LAYOUT_QUERY).matches;

const loadSavedDeck = () => {
  if (typeof window === "undefined") {
    return { deckMain: {}, deckLrig: {}, format: DECK_FORMATS.DIVA };
  }

  try {
    const savedDeck = window.localStorage.getItem(SAVED_DECK_STORAGE_KEY);
    if (!savedDeck) return { deckMain: {}, deckLrig: {}, format: DECK_FORMATS.DIVA };

    const parsed = JSON.parse(savedDeck);
    return {
      deckMain: parsed?.deckMain || {},
      deckLrig: parsed?.deckLrig || {},
      format: parsed?.format || DECK_FORMATS.DIVA,
    };
  } catch (error) {
    console.warn("Failed to restore saved deck", error);
    return { deckMain: {}, deckLrig: {}, format: DECK_FORMATS.DIVA };
  }
};

function App() {
  const [initialDeck] = useState(loadSavedDeck);
  const [cards, setCards] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardsError, setCardsError] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [searchFields, setSearchFields] = useState({
    カード名: true,
    効果テキスト: true,
    ライフバースト: false,
    カード種類: false,
    カードタイプ: false,
  });
  const [attributeFilters, setAttributeFilters] = useState({
    色: [],
    カード種類: [],
    レベル: [],
  });
  const [deckMain, setDeckMain] = useState(() => initialDeck.deckMain);
  const [deckLrig, setDeckLrig] = useState(() => initialDeck.deckLrig);
  const [deckFormat, setDeckFormat] = useState(() => initialDeck.format);
  const [showMainDeck, setShowMainDeck] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(matchesMobileLayout);
  const [showModal, setShowModal] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importSummary, setImportSummary] = useState(null);
  const [mobileView, setMobileView] = useState("search");
  const [templateKey, setTemplateKey] = useState("Ceremony");
  const searchWorkerRef = useRef(null);
  const searchRequestRef = useRef(0);
  const fallbackCardsRef = useRef([]);
  const fallbackResultsRef = useRef([]);
  const templates = {
  Ceremony: "/images/template.png",
  WC2025: "/images/template_wc2025.png",
};

  const fieldLabels = {
    カード名: "カード名",
    効果テキスト: "効果テキスト",
    ライフバースト: "LB",
    カード種類: "種類",
    カードタイプ: "タイプ",
    色: "色",
    レベル: "Lv",
    コスト: "コスト",
    パワー: "パワー",
    使用タイミング: "タイミング",
  };

  useEffect(() => {
    let active = true;
    let worker = null;

    const handleWorkerMessage = ({ data }) => {
      if (!active) return;

      if (data.type === "ready") {
        setCards(data.cardIndex);
        setCardsLoading(false);
        return;
      }

      if (data.type === "error") {
        setCardsError(data.message || "カードデータを読み込めませんでした。");
        setCardsLoading(false);
        setSearchLoading(false);
        return;
      }

      if (data.requestId !== searchRequestRef.current) return;

      if (data.type === "search-result") {
        setFiltered(data.cards);
        setFilteredTotal(data.total);
        setSearchLoading(false);
      } else if (data.type === "more-results") {
        setFiltered((current) => [...current, ...data.cards]);
        setFilteredTotal(data.total);
        setSearchLoading(false);
      }
    };

    const initializeCards = async () => {
      try {
        const manifestResponse = await fetch(
          `${process.env.PUBLIC_URL}/cards-manifest.json`,
          { cache: "no-cache" }
        );
        if (!manifestResponse.ok) {
          throw new Error(`Card manifest request failed: ${manifestResponse.status}`);
        }
        const manifest = await manifestResponse.json();
        const cardsUrl = `${process.env.PUBLIC_URL}/${manifest.file}?v=${manifest.version}`;

        if (typeof Worker !== "undefined") {
          worker = new Worker(
            `${process.env.PUBLIC_URL}/card-search-worker.js?v=${CARD_SEARCH_WORKER_VERSION}`
          );
          searchWorkerRef.current = worker;
          worker.onmessage = handleWorkerMessage;
          worker.onerror = () => {
            if (!active) return;
            setCardsError("検索処理を開始できませんでした。");
            setCardsLoading(false);
          };
          worker.postMessage({ type: "init", url: cardsUrl });
          return;
        }

        const cardsResponse = await fetch(cardsUrl);
        if (!cardsResponse.ok) {
          throw new Error(`Card data request failed: ${cardsResponse.status}`);
        }
        const fullCards = await cardsResponse.json();
        if (!active) return;
        fallbackCardsRef.current = fullCards;
        setCards(createCardIndex(fullCards));
        setCardsLoading(false);
      } catch (error) {
        if (!active) return;
        setCardsError(error.message || "カードデータを読み込めませんでした。");
        setCardsLoading(false);
      }
    };

    initializeCards();
    return () => {
      active = false;
      worker?.terminate();
      searchWorkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SAVED_DECK_STORAGE_KEY,
        JSON.stringify({ deckMain, deckLrig, format: deckFormat })
      );
    } catch (error) {
      console.warn("Failed to save deck", error);
    }
  }, [deckMain, deckLrig, deckFormat]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_LAYOUT_QUERY);
    const syncMobileLayout = () => setIsMobileLayout(mediaQuery.matches);
    syncMobileLayout();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncMobileLayout);
      return () => mediaQuery.removeEventListener("change", syncMobileLayout);
    }

    mediaQuery.addListener(syncMobileLayout);
    return () => mediaQuery.removeListener(syncMobileLayout);
  }, []);

const runSearch = (selectedFormat) => {
  const requestId = searchRequestRef.current + 1;
  searchRequestRef.current = requestId;
  setSearchLoading(true);

  if (searchWorkerRef.current) {
    searchWorkerRef.current.postMessage({
      type: "search",
      requestId,
      query,
      searchFields,
      useRegex,
      filters: attributeFilters,
      deckFormat: selectedFormat,
      limit: SEARCH_PAGE_SIZE,
    });
    return;
  }

  const results = filterCards(
    fallbackCardsRef.current,
    query,
    searchFields,
    useRegex,
    attributeFilters,
    selectedFormat
  );
  fallbackResultsRef.current = results;
  setFiltered(results.slice(0, SEARCH_PAGE_SIZE));
  setFilteredTotal(results.length);
  setSearchLoading(false);
};

  const handleSearch = () => runSearch(deckFormat);

  const handleDeckFormatChange = (nextFormat) => {
    setDeckFormat(nextFormat);
    runSearch(nextFormat);
  };

  const handleLoadMoreResults = () => {
    if (searchLoading || filtered.length >= filteredTotal) return;
    setSearchLoading(true);

    if (searchWorkerRef.current) {
      searchWorkerRef.current.postMessage({
        type: "load-more",
        requestId: searchRequestRef.current,
        offset: filtered.length,
        limit: SEARCH_PAGE_SIZE,
      });
      return;
    }

    const nextCards = fallbackResultsRef.current.slice(
      filtered.length,
      filtered.length + SEARCH_PAGE_SIZE
    );
    setFiltered((current) => [...current, ...nextCards]);
    setSearchLoading(false);
  };


  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const toggleField = (field) => {
    setSearchFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const filterOptions = useMemo(() => {
    const colorOrder = ["白", "青", "赤", "緑", "黒", "無色"];
    const collect = (field) =>
      Array.from(
        new Set(
          cards
            .map((card) => normalizeFilterValue(card[field] || ""))
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "ja"));

    return {
      色: colorOrder.filter((color) =>
        cards.some((card) => (card["色"] || "").toString().includes(color))
      ),
      カード種類: collect("カード種類"),
      レベル: collect("レベル").sort((a, b) => {
        const numA = Number.parseInt(a, 10);
        const numB = Number.parseInt(b, 10);

        if (Number.isNaN(numA) || Number.isNaN(numB)) {
          return a.localeCompare(b, "ja");
        }

        return numA - numB;
      }),
    };
  }, [cards]);

  const toggleAttributeFilter = (field, value) => {
    setAttributeFilters((prev) => {
      const selected = prev[field] || [];
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];

      return { ...prev, [field]: next };
    });
  };

  const clearAttributeFilters = () => {
    setAttributeFilters({ 色: [], カード種類: [], レベル: [] });
  };

  const drawDeckOnTemplate = (
    img,
    cardList,
    numList
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 背景画像描画
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // テキスト設定
    ctx.font = `16px sans-serif`;
    ctx.fillStyle = "black";

    const lineHeight = 46;

    // ルリグデッキのカードナンバー描画
    // 最初の6枚
    let x = 200;
    let y = 619;
    for (let i = 0; i < 6; i++) {
      const text = `${numList.Lrig[i]}`;
      ctx.fillText(text, x, y + i * lineHeight);
    }
    // 次の6枚
    x = 875;
    for (let i = 6; i < numList.Lrig.length; i++) {
      const text = `${numList.Lrig[i]}`;
      ctx.fillText(text, x, y + (i - 6) * lineHeight);
    }

    // LBのカードナンバー描画
    const diff = 20 - numList.LB.length;
    if (diff === 0){
      // 最初の10枚
      x = 200;
      y = 1040;
      for (let i = 0; i < 10; i++) {
        const text = `${numList.LB[i]}`;
        ctx.fillText(text, x, y + i * lineHeight);
      }
      // 次の10枚
      x = 875;
      for (let i = 10; i < 20; i++) {
        const text = `${numList.LB[i]}`;
        ctx.fillText(text, x, y + (i - 10) * lineHeight);
      }
    } else {
      const fromNLB = numList.nLB.splice(0, diff);
      numList.LB = numList.LB.concat(fromNLB);
      console.log(numList.LB.length);
      // 最初の10枚
      x = 200;
      y = 1040;
      for (let i = 0; i < 10; i++) {
        const text = `${numList.LB[i]}`;
        ctx.fillText(text, x, y + i * lineHeight);
      }
      // 次の10枚
      x = 875;
      for (let i = 10; i < 20; i++) {
        const text = `${numList.LB[i]}`;
        ctx.fillText(text, x, y + (i - 10) * lineHeight);
      }
    }

    // nLBのカードナンバー描画
    // 最初の10枚
    x = 200;
    y = 1647;
    for (let i = 0; i < 10; i++) {
      const text = `${numList.nLB[i]}`;
      ctx.fillText(text, x, y + i * lineHeight);
    }
    // 次の10枚
    x = 875;
    for (let i = 10; i < 20; i++) {
      const text = `${numList.nLB[i]}`;
      ctx.fillText(text, x, y + (i - 10) * lineHeight);
    }

    // ルリグデッキのカード名描画
    // 最初の6枚
    x = 352;
    y = 619;
    const lrigNames = Object.entries(cardList.Lrig).map(([cardNumber, info]) =>
      getDeckItemName(cardNumber, info, cards)
    );
    for (let i = 0; i < 6; i++) {
      const text = `${lrigNames[i]}`;
      ctx.fillText(text, x, y + i * lineHeight);
    }
    // 次の6枚
    x = 1026;
    for (let i = 6; i < lrigNames.length; i++) {
      const text = `${lrigNames[i]}`;
      ctx.fillText(text, x, y + (i - 6) * lineHeight);
    }

    // メインデッキのLBカード名描画
    // 最初の10枚
    let expandedLBList = [];
    let expandedNLBList = [];
    if (diff === 0){
      x = 450;
      y = 1040;
      const lbList = cardList.LB.flatMap(([cardNumber, attr]) =>
        Array(attr.count).fill(getDeckItemName(cardNumber, attr, cards))
      );
      for (let i = 0; i < 10; i++) {
        const text = `${lbList[i]}`;
        ctx.fillText(text, x, y + i * lineHeight);
      }
      // 次の10枚
      x = 1124;
      for (let i = 10; i < lbList.length; i++) {
        const text = `${lbList[i]}`;
        ctx.fillText(text, x, y + (i - 10) * lineHeight);
      }
    } else {
      x = 450;
      y = 1040;
      expandedLBList = cardList.LB.flatMap(([cardNumber, info]) =>
        Array(info.count).fill([getDeckItemName(cardNumber, info, cards), info])
      );
      expandedNLBList = cardList.nLB.flatMap(([cardNumber, info]) =>
        Array(info.count).fill([getDeckItemName(cardNumber, info, cards), info])
      );
      const moveNLBs = expandedNLBList.splice(0,diff);
      expandedLBList.push(...moveNLBs);
      for (let i = 0; i < 10; i++) {
        const text = `${expandedLBList[i][0]}`;
        ctx.fillText(text, x, y + i * lineHeight);
        if (expandedLBList[i][1].ライフバースト === "―") {
          ctx.fillText("✓",x - 64,y + i * lineHeight,)
        }
      }
      // 次の10枚
      x = 1124;
      for (let i = 10; i < expandedLBList.length; i++) {
        const text = `${expandedLBList[i][0]}`;
        ctx.fillText(text, x, y + (i - 10) * lineHeight);
        if (expandedLBList[i][1].ライフバースト === "―") {
          ctx.fillText("✓",x - 64,y + (i - 10) * lineHeight,)
        }
      }
    }

    // メインデッキのnLBカード名描画
    x = 352;
    y = 1647;
    if (diff === 0) {
      // 最初の10枚
      const nlbList = cardList.nLB.flatMap(([cardNumber, attr]) =>
        Array(attr.count).fill(getDeckItemName(cardNumber, attr, cards))
      );
      for (let i = 0; i < 10; i++) {
        const text = `${nlbList[i]}`;
        ctx.fillText(text, x, y + i * lineHeight);
      }
      // 次の10枚
      x = 1026;
      for (let i = 10; i < nlbList.length; i++) {
        const text = `${nlbList[i]}`;
        ctx.fillText(text, x, y + (i - 10) * lineHeight);
      }
    } else {
      for (let i = 0; i < 10; i++) {
        const text = `${expandedNLBList[i][0]}`;
        ctx.fillText(text, x, y + i * lineHeight);
      }
      // 次の10枚
      x = 1026;
      for (let i = 10; i < expandedNLBList.length; i++) {
        const text = `${expandedNLBList[i][0]}`;
        ctx.fillText(text, x, y + (i - 10) * lineHeight);
      }
    }

    return canvas.toDataURL("image/png");
  };

  // デッキリストからカード名でカード番号を引き当てる関数
  const handleOutputClick = () => {
    const { numList } = buildDeckNumberLists(deckLrig, deckMain, cards);
    const all = [...numList.Lrig, ...numList.LB, ...numList.nLB];

    setOutputText(all.join("\n"));
    setShowModal(true);
  };

  const handlePrintClick = () => {
    const { cardList, numList } = buildDeckNumberLists(deckLrig, deckMain, cards);

    const openImageInNewTab = (imageUrl) => {
      if (!imageUrl) return;
      const newTab = window.open();
      if (newTab) {
        newTab.document.body.innerHTML = `<img src="${imageUrl}" style="max-width:100%">`;
      } else {
        alert("ポップアップブロックが有効かもしれません。");
      }
    };
    const img = new Image();
    img.src = `${process.env.PUBLIC_URL}${templates[templateKey]}`;
    if (!img) return;

    if (!img.complete) {
      img.onload = () => {
      const imageUrl = drawDeckOnTemplate(img, cardList, numList);
      openImageInNewTab(imageUrl);
      };
    } else {
      const imageUrl = drawDeckOnTemplate(img, cardList, numList);
      openImageInNewTab(imageUrl);
    }
  };

  const handleAddSaba = () => {
    const card = cards.find((c) => c["カード番号"] === "WXDi-D03-020");
    if (!card) {
      alert("カード WXDi-D03-020 が見つかりませんでした。");
      return;
    }
    if (!isCardAllowedInFormat(card, deckFormat)) {
      alert("選択中のフォーマットでは使用できないカードです。");
      return;
    }

    setDeckMain((prev) => ({
      ...prev,
      [card["カード番号"]]: createDeckItem(card, 4)
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText)
    .then(() => {
      alert("コピーしました！");
    })
    .catch(() => {
      alert("コピーに失敗しました。");
    });
  };

  const escapeHtml = (value = "") =>
    value
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const createDeckCardImagePage = () => {
    const deckEntries = [
      ...Object.entries(deckLrig),
      ...Object.entries(deckMain),
    ];

    const uniqueCards = [];
    const seen = new Set();

    for (const [cardNumber, info] of deckEntries) {
      const imageUrl = getHighQualityCardImageUrl(cardNumber);
      if (!imageUrl || seen.has(cardNumber)) continue;

      seen.add(cardNumber);
      uniqueCards.push({
        name: getDeckItemName(cardNumber, info, cards),
        cardNumber,
        imageUrl,
      });
    }

    if (uniqueCards.length === 0) {
      alert("デッキにカードがありません。");
      return;
    }
    const imageCards = uniqueCards
      .map(
        ({ name, cardNumber, imageUrl }) => `
          <article class="card">
            <a href="${imageUrl}" download="${escapeHtml(cardNumber)}.jpg" target="_blank" rel="noopener noreferrer">
              <img src="${imageUrl}" alt="${escapeHtml(name)}" loading="lazy" />
            </a>
            <div class="meta">
              <strong>${escapeHtml(name)}</strong>
              <span>${escapeHtml(cardNumber)}</span>
              <a href="${imageUrl}" download="${escapeHtml(cardNumber)}.jpg" target="_blank" rel="noopener noreferrer">画像を開く / 保存</a>
            </div>
          </article>`
      )
      .join("");

    const linkList = uniqueCards
      .map(
        ({ name, cardNumber, imageUrl }) =>
          `<li><a href="${imageUrl}" download="${escapeHtml(cardNumber)}.jpg" target="_blank" rel="noopener noreferrer">${escapeHtml(cardNumber)} ${escapeHtml(name)}</a></li>`
      )
      .join("");

    const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>デッキ採用カード画像</title>
  <style>
    body {
      margin: 0;
      padding: 24px;
      background: #eef3f8;
      color: #172033;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    header {
      max-width: 1120px;
      margin: 0 auto 20px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 24px;
    }
    p {
      margin: 0 0 8px;
      color: #5c6b80;
      line-height: 1.6;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      max-width: 1120px;
      margin: 0 auto;
    }
    .card {
      padding: 12px;
      border: 1px solid #dce5ef;
      border-radius: 8px;
      background: rgba(255,255,255,0.92);
      box-shadow: 0 8px 24px rgba(22, 37, 62, 0.08);
    }
    img {
      display: block;
      width: 100%;
      border-radius: 6px;
    }
    .meta {
      display: grid;
      gap: 4px;
      margin-top: 10px;
      font-size: 13px;
      line-height: 1.35;
    }
    .meta span {
      color: #5c6b80;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    }
    a {
      color: #2563c9;
      font-weight: 700;
      text-decoration: none;
    }
    details {
      max-width: 1120px;
      margin: 18px auto 0;
      color: #5c6b80;
    }
  </style>
</head>
<body>
  <header>
    <h1>デッキ採用カード画像</h1>
    <p>同じカードが複数枚入っていても、カード番号ごとに1枚だけ表示しています。</p>
    <p>ブラウザの制限により自動ZIP化はできないため、画像または「画像を開く / 保存」から保存してください。</p>
    <p>対象: ${uniqueCards.length} 種類</p>
  </header>
  <main class="grid">
    ${imageCards}
  </main>
  <details>
    <summary>画像URL一覧</summary>
    <ol>${linkList}</ol>
  </details>
</body>
</html>`;

    const newTab = window.open();
    if (newTab) {
      newTab.document.open();
      newTab.document.write(htmlContent);
      newTab.document.close();
    } else {
      alert("ポップアップブロックが有効かもしれません。");
    }
  };

  const handleImportDeck = () => {
    const lines = importText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const imported = importDeckFromCardNumbers(lines, cards, deckFormat);
    setDeckMain(imported.deckMain);
    setDeckLrig(imported.deckLrig);
    setShowImportModal(false);
    setImportSummary(imported.summary);
  };

  const handleClearDeck = () => {
    setDeckMain({});
    setDeckLrig({});
    setMobileView("search");
  };

  // デッキリスト画像を作成
  const createDeckImage = async () => {
    try {
      const {
        lrigEntries,
        signiByLevel,
        spells,
        others,
        sortedLevels,
        totalCards,
      } = prepareDeckImageEntries(deckLrig, deckMain, cards);

      if (totalCards === 0) {
        alert("デッキが空です。");
        return;
      }

      // プレースホルダー画像を生成する関数
      const createPlaceholderImage = (cardName) => {
        const canvas = document.createElement("canvas");
        canvas.width = 240;
        canvas.height = 336;
        const ctx = canvas.getContext("2d");
        
        // 背景色
        ctx.fillStyle = "#ccc";
        ctx.fillRect(0, 0, 240, 336);
        
        // カード名を描画
        ctx.fillStyle = "#333";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // テキストを複数行に分割
        const maxWidth = 220;
        const lineHeight = 18;
        const chars = cardName.split("");
        const lines = [];
        let currentLine = "";
        
        for (let i = 0; i < chars.length; i++) {
          const testLine = currentLine + chars[i];
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = chars[i];
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
        
        // 中央に配置して描画
        const startY = 168 - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, index) => {
          ctx.fillText(line, 120, startY + index * lineHeight);
        });
        
        // 枠線
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 240, 336);
        
        return canvas.toDataURL("image/png");
      };

      // カード情報からHTML要素を生成する関数
      const createCardHtml = (entry, url) => {
        const cardName = entry.name || "カード名不明";
        const countHtml = entry.count > 1 ? `<div class="card-count">×${entry.count}</div>` : "";
        
        if (url) {
          // 画像URLがある場合
          const placeholderDataUrl = createPlaceholderImage(cardName);
          return `<div class="card-wrapper"><img src="${url}" onerror="this.onerror=null; this.src='${placeholderDataUrl}';" />${countHtml}</div>`;
        } else {
          // 画像URLがない場合、プレースホルダー画像を使用
          const placeholderDataUrl = createPlaceholderImage(cardName);
          return `<div class="card-wrapper"><img src="${placeholderDataUrl}" />${countHtml}</div>`;
        }
      };

      // HTMLを構築
      let htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>デッキリスト画像</title>
  <style>
    body {
      margin: 20px;
      background: #f5f5f5;
      font-family: sans-serif;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #000;
    }
    .cards-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .card-wrapper {
      position: relative;
      display: inline-block;
    }
    .card-wrapper img {
      width: 240px;
      height: 336px;
      display: block;
      border: 1px solid #ddd;
    }
    .card-count {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: rgba(255, 255, 255, 0.9);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 24px;
      color: #000;
    }
    .card-placeholder {
      width: 240px;
      height: 336px;
      background: #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
      border: 1px solid #ddd;
      padding: 10px;
      box-sizing: border-box;
      text-align: center;
      font-size: 14px;
      word-break: break-word;
      line-height: 1.4;
      position: relative;
    }
  </style>
</head>
<body>
`;

      // ルリグデッキ
      if (lrigEntries.length > 0) {
        htmlContent += '<div class="section">';
        htmlContent += '<div class="section-title">ルリグデッキ</div>';
        htmlContent += '<div class="cards-container">';
        for (const entry of lrigEntries) {
          const url = entry.cardNumber ? getCardImageUrl(entry.cardNumber) : null;
          htmlContent += createCardHtml(entry, url);
        }
        htmlContent += '</div></div>';
      }

      // メインデッキ（シグニとスペルをまとめる）
      const signiTotalCount = Object.values(signiByLevel).reduce((acc, arr) => acc + arr.length, 0);
      if (signiTotalCount > 0 || spells.length > 0 || others.length > 0) {
        htmlContent += '<div class="section">';
        htmlContent += '<div class="section-title">メインデッキ</div>';
        htmlContent += '<div class="cards-container">';
        
        // シグニを表示（レベルごと）
        for (const level of sortedLevels) {
          for (const entry of signiByLevel[level]) {
            const url = entry.cardNumber ? getCardImageUrl(entry.cardNumber) : null;
            htmlContent += createCardHtml(entry, url);
          }
        }
        
        // スペルを表示
        for (const entry of spells) {
          const url = entry.cardNumber ? getCardImageUrl(entry.cardNumber) : null;
          htmlContent += createCardHtml(entry, url);
        }

        for (const entry of others) {
          const url = entry.cardNumber ? getCardImageUrl(entry.cardNumber) : null;
          htmlContent += createCardHtml(entry, url);
        }
        
        htmlContent += '</div></div>';
      }

      htmlContent += '</body></html>';

      // 新しいタブで開く
      const newTab = window.open();
      if (newTab) {
        newTab.document.open();
        newTab.document.write(htmlContent);
        newTab.document.close();
      } else {
        alert("ポップアップブロックが有効かもしれません。");
      }
    } catch (error) {
      console.error("画像作成エラー:", error);
      alert("画像の作成に失敗しました。");
    }
  };

  const adjustDeck = (cardNumber, delta, type, lb, name, groupKey) => {
    const card = cardByNumber.get(cardNumber);
    if (delta > 0 && card && !isCardAllowedInFormat(card, deckFormat)) {
      return;
    }

    const isLrig = isLrigCard(type);
    const setDeck = isLrig ? setDeckLrig : setDeckMain;

    setDeck((prev) => {
      if (delta > 0 && isLrig && !prev[cardNumber]) {
        const limit = getLrigDeckLimitForAddition(prev, type);
        if (getDeckCount(prev) >= limit) {
          return prev;
        }
      }

      return adjustDeckState(prev, cardNumber, delta, type, lb, name, groupKey);
    });
  };

  const reorderDeck = (sourceCardNumber, targetCardNumber) => {
    const setDeck = showMainDeck ? setDeckMain : setDeckLrig;
    setDeck((current) =>
      reorderDeckState(current, sourceCardNumber, targetCardNumber)
    );
  };

  const currentDeck = showMainDeck ? deckMain : deckLrig;
  const deckEntries = Object.entries(currentDeck);
  const totalCount = getDeckCount(currentDeck);
  const lbCount = getLifeBurstCount(currentDeck);
  const mainCount = getDeckCount(deckMain);
  const lrigCount = getDeckCount(deckLrig);
  const lrigDeckLimit = getLrigDeckLimit(deckLrig);
  const deckCounts = useMemo(() => {
    const counts = {};

    for (const [cardNumber, info] of [...Object.entries(deckMain), ...Object.entries(deckLrig)]) {
      counts[cardNumber] = (counts[cardNumber] || 0) + info.count;
    }

    return counts;
  }, [deckMain, deckLrig]);
  const cardByNumber = useMemo(
    () => new Map(cards.map((card) => [card["カード番号"], card])),
    [cards]
  );

  const switchMobileView = (view) => {
    setMobileView(view);
  };

  const canAddCardToDeck = (card) => {
    if (!isCardAllowedInFormat(card, deckFormat)) {
      return false;
    }

    if (!isLrigCard(card["カード種類"])) {
      return true;
    }

    if (deckLrig[card["カード番号"]]) {
      return true;
    }

    const limit = getLrigDeckLimitForAddition(deckLrig, card["カード種類"]);
    return lrigCount < limit;
  };


  return (
    <div className="App" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/bg.jpg)` }}>
      <div className={`container mobile-view-${mobileView}`}>
        <div className="header-fixed">
          <SearchPanel
            query={query}
            useRegex={useRegex}
            searchFields={searchFields}
          fieldLabels={fieldLabels}
          filterOptions={filterOptions}
          attributeFilters={attributeFilters}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          onKeyDown={handleKeyDown}
          onUseRegexChange={setUseRegex}
          onToggleField={toggleField}
          onToggleAttributeFilter={toggleAttributeFilter}
          onClearAttributeFilters={clearAttributeFilters}
          deckFormat={deckFormat}
          onDeckFormatChange={handleDeckFormatChange}
        />
        </div>

        <DeckDrawer
          minimized={isMobileLayout ? false : minimized}
          allowCollapse={!isMobileLayout}
          showActions={!isMobileLayout}
          showMainDeck={showMainDeck}
          deckEntries={deckEntries}
          deckMain={deckMain}
          deckLrig={deckLrig}
          cards={cards}
          totalCount={totalCount}
          lbCount={lbCount}
          deckFormat={deckFormat}
          lrigDeckLimit={lrigDeckLimit}
          onMinimizedChange={setMinimized}
          onShowMainDeckChange={setShowMainDeck}
          onAdjustDeck={adjustDeck}
          onReorderDeck={reorderDeck}
          onAddSaba={handleAddSaba}
          onOpenPrint={() => setShowPrintModal(true)}
          onOutput={handleOutputClick}
          onOpenCardImages={createDeckCardImagePage}
          onOpenImport={() => setShowImportModal(true)}
          onClearDeck={handleClearDeck}
        />

      <CardResultList
        cards={filtered}
        total={filteredTotal}
        loading={searchLoading}
        deckFormat={deckFormat}
        deckCounts={deckCounts}
        canAddCard={canAddCardToDeck}
        onAdjustDeck={adjustDeck}
        onLoadMore={handleLoadMoreResults}
      />

      {cardsLoading && <div className="card-data-status">カードデータを読み込んでいます...</div>}
      {cardsError && <div className="card-data-status card-data-error">{cardsError}</div>}

      <MobileActionPanel
        mainCount={mainCount}
        lrigCount={lrigCount}
        deckFormat={deckFormat}
        lrigDeckLimit={lrigDeckLimit}
        lbCount={getLifeBurstCount(deckMain)}
        onAddSaba={handleAddSaba}
        onOpenPrint={() => setShowPrintModal(true)}
        onOutput={handleOutputClick}
        onOpenCardImages={createDeckCardImagePage}
        onOpenImport={() => setShowImportModal(true)}
        onClearDeck={handleClearDeck}
      />

      <footer className="mobile-bottom-nav" aria-label="スマートフォン用フッター">
        <button
          type="button"
          className={mobileView === "search" ? "mobile-nav-item mobile-nav-item-active" : "mobile-nav-item"}
          onClick={() => switchMobileView("search")}
        >
          <span>検索</span>
          <small>{filteredTotal}件</small>
        </button>
        <button
          type="button"
          className={mobileView === "deck" ? "mobile-nav-item mobile-nav-item-active" : "mobile-nav-item"}
          onClick={() => switchMobileView("deck")}
        >
          <span>デッキ</span>
          <small>{mainCount + lrigCount}枚</small>
        </button>
        <button
          type="button"
          className={mobileView === "actions" ? "mobile-nav-item mobile-nav-item-active" : "mobile-nav-item"}
          onClick={() => switchMobileView("actions")}
        >
          <span>操作</span>
          <small>出力</small>
        </button>
      </footer>


{showModal && (
  <OutputModal
    outputText={outputText}
    onClose={() => setShowModal(false)}
    onCopy={handleCopy}
    onCreateDeckImage={createDeckImage}
  />
)}

{showPrintModal && (
  <PrintModal
    templates={templates}
    templateKey={templateKey}
    onTemplateChange={setTemplateKey}
    onPrint={handlePrintClick}
    onClose={() => setShowPrintModal(false)}
  />
)}

{showImportModal && (
  <ImportModal
    importText={importText}
    onImportTextChange={setImportText}
    onImport={handleImportDeck}
    onClose={() => setShowImportModal(false)}
  />
)}

{importSummary && (
  <ImportSummaryModal
    summary={importSummary}
    onClose={() => setImportSummary(null)}
  />
)}


</div>
    </div>
  );
}

export default App;
