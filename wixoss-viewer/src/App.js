import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { MdChangeCircle } from "react-icons/md";
import { LuMinimize2 } from "react-icons/lu";
import { LuMaximize2 } from "react-icons/lu";
import { FiExternalLink } from "react-icons/fi";
import "./App.css";

function App() {
  const [cards, setCards] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [searchFields, setSearchFields] = useState({
    カード名: true,
    効果テキスト: true,
    ライフバースト: false,
    カード種類: false,
    カードタイプ: false,
  });
  const [deckMain, setDeckMain] = useState({});
  const [deckLrig, setDeckLrig] = useState({});
  const [showMainDeck, setShowMainDeck] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [templateKey, setTemplateKey] = useState("Ceremony");
  const templates = {
  Ceremony: "/images/template.png",
  WC2025: "/images/template_wc2025.png",
};

const toHiragana = (str = "") =>
  str.replace(/[\u30a1-\u30f6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );

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

  const isLrigCard = (type) =>
    ["ルリグ", "アシストルリグ", "ピース", "アーツ"].includes(type);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/cards.json?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => setCards(data));
  }, []);

const handleSearch = () => {
  const keywords = query.trim().split(/\s+/).filter(Boolean);
  const activeFields = Object.keys(searchFields).filter((key) => searchFields[key]);

  const result = cards.filter((card) =>
    keywords.every((kw) => {
      const normalizedKw = toHiragana(kw.toLowerCase());
      const regex = useRegex ? new RegExp(kw, "i") : null;

      return activeFields.some((field) => {
        const raw = (card[field] || "").toString();

        // 「カード名」フィールドのときだけ、カード名＋読み方を両方チェック
        if (field === "カード名" && !useRegex) {
          // ① 元のカード名（部分一致、大文字小文字無視）
          const hitName = raw.toLowerCase().includes(kw.toLowerCase());
          // ② カードの読み方（カタカナ→ひらがな化して、ひらがな検索を可能に）
          const reading = card["カードの読み方"] || "";
          const hira = toHiragana(reading.toLowerCase());
          const hitReading = hira.includes(normalizedKw);
          return hitName || hitReading;
        }

        // 正規表現モードなら、カード名／読み方いずれも regex.test でチェック
        if (field === "カード名" && useRegex) {
          const reading = card["カードの読み方"] || "";
          return regex.test(raw) || regex.test(reading);
        }

        // その他フィールドは従来通り
        return useRegex
          ? regex.test(raw)
          : raw.toLowerCase().includes(kw.toLowerCase());
      });
    })
  );

  // 重複カード名を除いてセット
  const seen = new Set();
  const unique = result.filter((c) => {
    if (seen.has(c["カード名"])) return false;
    seen.add(c["カード名"]);
    return true;
  });
  setFiltered(unique);
};


  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const toggleField = (field) => {
    setSearchFields((prev) => ({ ...prev, [field]: !prev[field] }));
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
    const lrigKeys = Object.keys(cardList.Lrig);
    for (let i = 0; i < 6; i++) {
      const text = `${lrigKeys[i]}`;
      ctx.fillText(text, x, y + i * lineHeight);
    }
    // 次の6枚
    x = 1026;
    for (let i = 6; i < lrigKeys.length; i++) {
      const text = `${lrigKeys[i]}`;
      ctx.fillText(text, x, y + (i - 6) * lineHeight);
    }

    // メインデッキのLBカード名描画
    // 最初の10枚
    let expandedLBList = [];
    let expandedNLBList = [];
    if (diff === 0){
      x = 450;
      y = 1040;
      const lbList = cardList.LB.flatMap(([name, attr]) => Array(attr.count).fill(name));
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
      expandedLBList = cardList.LB.flatMap(([name, info]) =>
        Array(info.count).fill([name, info])
      );
      expandedNLBList = cardList.nLB.flatMap(([name, info]) =>
        Array(info.count).fill([name, info])
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
      const nlbList = cardList.nLB.flatMap(([name, attr]) => Array(attr.count).fill(name));
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
    const getCardNumbers = (deck) =>
     Object.entries(deck).flatMap(([name, info]) =>
        Array(info.count).fill(
         cards.find((c) => c["カード名"] === name)?.["カード番号"] || "UNKNOWN"
       )
      );

    // ルリグデッキのカード番号リスト取得
    const lrigList = getCardNumbers(deckLrig);

    const mainList = Object.entries(deckMain);
    const lbCards = mainList.filter(([, info]) => info.ライフバースト && info.ライフバースト !== "―");
    const nonLbCards = mainList.filter(([, info]) => !info.ライフバースト || info.ライフバースト === "―");

    // メインデッキ・LBありのカード番号リスト取得
    const lbList = getCardNumbers(Object.fromEntries(lbCards));
    // メインデッキ・LBなしのカード番号リスト取得
    const nonLbList = getCardNumbers(Object.fromEntries(nonLbCards));

    const all = [...lrigList, ...lbList, ...nonLbList];

    setOutputText(all.join("\n"));
    setShowModal(true);
  };

  const handlePrintClick = () => {
    const getCardNumbers = (deck) =>
     Object.entries(deck).flatMap(([name, info]) =>
        Array(info.count).fill(
         cards.find((c) => c["カード名"] === name)?.["カード番号"] || "UNKNOWN"
       )
      );

    // ルリグデッキのカード番号リスト取得
    const lrigList = getCardNumbers(deckLrig);

    const mainList = Object.entries(deckMain);
    const lbCards = mainList.filter(([, info]) => info.ライフバースト && info.ライフバースト !== "―");
    const nonLbCards = mainList.filter(([, info]) => !info.ライフバースト || info.ライフバースト === "―");

    // メインデッキ・LBありのカード番号リスト取得
    const lbList = getCardNumbers(Object.fromEntries(lbCards));
    // メインデッキ・LBなしのカード番号リスト取得
    const nonLbList = getCardNumbers(Object.fromEntries(nonLbCards));

    const cardList = {Lrig:deckLrig, LB:lbCards, nLB:nonLbCards};
    const numList = {Lrig:lrigList, LB:lbList, nLB:nonLbList}

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

    setDeckMain((prev) => ({
      ...prev,
      [card["カード名"]]: {
        count: 4,
        ライフバースト: card["ライフバースト"],
        カード種類: card["カード種類"]
      }
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

  // カード番号から画像URLを生成
  const getCardImageUrl = (cardNumber) => {
    if (!cardNumber || cardNumber === "UNKNOWN") return null;
    // カード番号の形式例: WX25-CP1-046, WXDi-D03-010
    // URL形式: https://www.takaratomy.co.jp/products/wixoss/library/images/card/WX25/WX25-CP1-046.jpg
    const parts = cardNumber.split("-");
    if (parts.length < 2) return null;
    const prefix = parts[0]; // WX25, WXDi など
    return `https://www.takaratomy.co.jp/products/wixoss/library/images/card/${prefix}/${cardNumber}.jpg`;
  };

  // デッキリスト画像を作成
  const createDeckImage = async () => {
    try {
      // デッキが空の場合
      const totalCards = Object.values(deckMain).reduce((acc, v) => acc + v.count, 0) +
                        Object.values(deckLrig).reduce((acc, v) => acc + v.count, 0);
      if (totalCards === 0) {
        alert("デッキが空です。");
        return;
      }

      // カード情報を取得（カード名からカード番号などを取得）
      const getCardInfo = (cardName) => {
        return cards.find((c) => c["カード名"] === cardName);
      };

      // ルリグデッキのカード情報を取得
      const lrigEntries = Object.entries(deckLrig).map(([name, info]) => {
        const card = getCardInfo(name);
        return {
          name,
          count: info.count,
          cardNumber: card?.["カード番号"] || null,
          card,
        };
      });

      // メインデッキのカード情報を取得
      const mainEntries = Object.entries(deckMain).map(([name, info]) => {
        const card = getCardInfo(name);
        return {
          name,
          count: info.count,
          cardNumber: card?.["カード番号"] || null,
          card,
          cardType: info.カード種類,
          level: card?.["レベル"] || "0",
        };
      });

      // メインデッキをシグニ（レベルごと）とスペルに分類
      const signiByLevel = {};
      const spells = [];

      mainEntries.forEach((entry) => {
        if (entry.cardType === "シグニ") {
          const level = entry.level || "0";
          if (!signiByLevel[level]) {
            signiByLevel[level] = [];
          }
          signiByLevel[level].push(entry);
        } else if (entry.cardType === "スペル") {
          spells.push(entry);
        }
      });

      // レベルでソート（数値として）
      const sortedLevels = Object.keys(signiByLevel).sort((a, b) => {
        const numA = parseInt(a) || 0;
        const numB = parseInt(b) || 0;
        return numA - numB;
      });

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
      if (signiTotalCount > 0 || spells.length > 0) {
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

  const adjustDeck = (cardName, delta, type, lb) => {
    const isLrig = isLrigCard(type);
    const setDeck = isLrig ? setDeckLrig : setDeckMain;
    const maxCount = isLrig ? 1 : 4;

    setDeck((prev) => {
      const prevCount = prev[cardName]?.count || 0;
      const newCount = Math.max(0, Math.min(maxCount, prevCount + delta));
      if (newCount === 0) {
        const copy = { ...prev };
        delete copy[cardName];
        return copy;
      }
      return {
        ...prev,
        [cardName]: { count: newCount, ライフバースト: lb, カード種類: type },
      };
    });
  };

  const currentDeck = showMainDeck ? deckMain : deckLrig;
  const deckEntries = Object.entries(currentDeck);
  const totalCount = deckEntries.reduce((acc, [, v]) => acc + v.count, 0);
  const lbCount = deckEntries.reduce(
  (acc, [, v]) =>
    (v.ライフバースト && v.ライフバースト !== "―") ? acc + v.count : acc,
  0
);


  return (
    <div className="App" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/bg.jpg)` }}>
      <div className="container">
      <div className="header-fixed">
        <h1><img src={`${process.env.PUBLIC_URL}/images/logo.png`} alt="WIXOSS カード検索" className="logo" /></h1>
        <div className="search-row">
          <input
            type="text"
            placeholder="検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="search-textbox"
          />
          <button onClick={handleSearch} className="search-button"><FaSearch /></button>
        </div>
        <div>
        <label className="toggle-regex">
          <input
            type="checkbox"
            checked={useRegex}
            onChange={() => setUseRegex(!useRegex)}
          /> 正規表現を使う
        </label>
        </div>

        <div className="field-controls searchfield-check">
          {Object.keys(searchFields).map((field) => (
            <>
            <input
                id={field}
                type="checkbox"
                checked={searchFields[field]}
                onChange={() => toggleField(field)}
              />
            <label key={field} htmlFor={field}className="searchfield-checkbox">
              {fieldLabels[field] || field}
            </label>
            </>
          ))}
        </div>
        <div className="deck-box">
  <div className="deck-header" style={{ justifyContent: minimized ? "flex-end" : "space-between",marginBottom: minimized ? 0 : 20 }}>
    {!minimized && (
      <h3 className="deck-title">{showMainDeck ? "現在のメインデッキ" : "現在のルリグデッキ"}</h3>
    )}
    <div>
      {!minimized && (
        <button onClick={() => setShowMainDeck(!showMainDeck)} className="deck-toggle-button icon-button">
          <MdChangeCircle />
        </button>
      )}
      <button onClick={() => setMinimized(!minimized)} className="icon-button">
        {minimized ? <LuMaximize2 /> : <LuMinimize2 />}
      </button>
    </div>
  </div>

  {!minimized && (
    <>
      <p style={{ margin: 0, fontSize: "1em" }}>
        {showMainDeck
          ? `ルリグデッキ：${Object.values(deckLrig).reduce((acc, v) => acc + v.count, 0)}枚`
          : `メインデッキ：${Object.values(deckMain).reduce((acc, v) => acc + v.count, 0)}枚`}
      </p>
      <p style={{margin: 0}}>枚数: {totalCount} {showMainDeck && `/ LB: ${lbCount}`}</p>
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {deckEntries.map(([name, info]) => (
          <li
            key={name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4
            }}
          >
            <span>{info.ライフバースト && info.ライフバースト !== "―" ? "★" : ""}{name}</span>
            <span style={{ marginLeft: "0.5em", display: "flex", alignItems: "center" }}>
              <button
                onClick={() =>
                  adjustDeck(name, -1, info.カード種類, info.ライフバースト)
                }
                style={{ marginRight: 4,paddingLeft: 6, paddingRight: 6, paddingTop: 3, paddingBottom: 3 , fontSize: 13}}
                className="button button03"
              >
                －
              </button>
              <span>×{info.count}</span>
              {!isLrigCard(info.カード種類) && (
                <button
                  onClick={() =>
                    adjustDeck(name, 1, info.カード種類, info.ライフバースト)
                  }
                  disabled={info.count >= 4}
                  style={{ marginLeft: 4, opacity: info.count >= 4 ? 0.5 : 1 ,paddingLeft: 6, paddingRight: 6, paddingTop: 3, paddingBottom: 3, fontSize: 13}}
                  className="button button02"
                >
                  ＋
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="button-container">
        <button onClick={handleAddSaba} className="button button02">
          鯖＃追加
        </button>
        <div>
          <button onClick={() => setShowPrintModal(true)}className="button button01">
            印刷
          </button>
          <button style={{ marginLeft: "8px" }} onClick={handleOutputClick} className="button button01">
            出力
          </button>
          <button style={{ marginLeft: "8px" }} onClick={() => setShowImportModal(true)} className="button button01">
            インポート
          </button>
        </div>
      </div>
    </>
  )}
</div>
      </div>

      <div className="table-container search-result">
            {filtered.map((card, i) => (
              <div key={i} className="card-item"> 
                  <a
                    href={`https://www.takaratomy.co.jp/products/wixoss/library/card/card_detail.php?card_no=${card["カード番号"]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="cardname"
                  >
                    {card["カード名"]}<FiExternalLink style={{verticalAlign: "baseline",fontSize: 14, marginLeft: 4}}/>
                  </a>
                  <span
                    style={{ marginLeft: 8, verticalAlign:"middle" }}
                    onClick={() =>
                      adjustDeck(
                        card["カード名"],
                        1,
                        card["カード種類"],
                        card["ライフバースト"]
                      )
                    }
                    className="button button02"
                  >
                    +1
                  </span>
                  <span
                    style={{ marginLeft: 4,verticalAlign:"middle" }}
                    onClick={() =>
                      adjustDeck(
                        card["カード名"],
                        +4,
                        card["カード種類"],
                        card["ライフバースト"]
                      )
                    }
                    className="button button02"
                  >
                    +4
                  </span>
                <div className="attr" style={{ marginTop: "0.3em" }}>
      <div className="row">
        <div className="type"><strong>種類:</strong> {card["カード種類"]}</div>
        <div className="color"><strong>色:</strong> {card["色"]}</div>
        <div><strong>レベル:</strong> {card["レベル"]}</div>
        <div><strong>コスト:</strong><span dangerouslySetInnerHTML={{
            __html: (card["コスト"] || "").replace(/<br>/g, " "),
          }}></span></div>
        <div><strong>パワー:</strong> {card["パワー"]}</div>
        <div><strong>タイプ:</strong><span dangerouslySetInnerHTML={{
            __html: (card["カードタイプ"] || "").replace(/<br>/g, " "),
          }}></span></div>

        <div><strong>タイミング:</strong><span dangerouslySetInnerHTML={{
            __html: (card["使用タイミング"] || "").replace(/<br>/g, " "),
          }}></span></div>
      </div>
      <div className="LB">
        <div><strong>LB:</strong> {card["ライフバースト"]}</div>
      </div>
      <div className="text">
        <span
          dangerouslySetInnerHTML={{
            __html: (card["効果テキスト"] || "").replace(/\n/g, "<br>"),
          }}
        />
      </div>
      </div>
    </div>
  ))}
</div>


{showModal && (
  <div style={{
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "8px",
      width: "80%",
      maxWidth: "500px",
      position: "relative"
    }}>
      <button onClick={() => setShowModal(false)} style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        background: "none",
        border: "none",
        fontSize: "1.2em",
        cursor: "pointer"
      }}>×</button>
      <h3>デッキ出力</h3>
      <textarea
        value={outputText}
        readOnly
        style={{ width: "100%", height: "300px", whiteSpace: "pre", fontFamily: "monospace" }}
      />
      <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
        <button
          onClick={handleCopy}
          style={{
            padding: "6px 12px",
            fontSize: "1em",
            cursor: "pointer"
          }}
        >
          コピー
        </button>
        <button
          onClick={createDeckImage}
          style={{
            padding: "6px 12px",
            fontSize: "1em",
            cursor: "pointer"
          }}
          className="button button01"
        >
          画像作成
        </button>
      </div>
    </div>
  </div>
)}

{showPrintModal && (
  <div style={{
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "8px",
      width: "80%",
      maxWidth: "500px",
      position: "relative"
    }}>
      <button onClick={() => setShowPrintModal(false)} style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        background: "none",
        border: "none",
        fontSize: "1.2em",
        cursor: "pointer"
      }}>×</button>
      <h3>プリント設定</h3>
      {Object.entries(templates).map(([key, path]) => (
        <label key={key} style={{ display: "block", marginBottom: "4px" }}>
          <input
            type="radio"
            name="template"
            value={key}
            checked={templateKey === key}
            onChange={(e) => setTemplateKey(e.target.value)}
          />
          {key === "default" ? "デフォルトテンプレート" : `テンプレート ${key.toUpperCase()}`}
        </label>
      ))}
      <button
  onClick={handlePrintClick}
  style={{
    marginTop: "10px",
    padding: "6px 12px",
    fontSize: "1em",
    cursor: "pointer"
  }}
>
  印刷
</button>
    </div>
  </div>
)}

{showImportModal && (
  <div style={{
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "8px",
      width: "80%",
      maxWidth: "500px",
      position: "relative"
    }}>
      <button onClick={() => setShowImportModal(false)} style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        background: "none",
        border: "none",
        fontSize: "1.2em",
        cursor: "pointer"
      }}>×</button>
      <h3>デッキインポート</h3>
      <textarea
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        placeholder="カード番号を1行ずつ貼り付けてください"
        style={{ width: "100%", height: "300px", whiteSpace: "pre", fontFamily: "monospace" }}
      />
      <div style={{textAlign:"center"}}>
      <button
        onClick={() => {
          const lines = importText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

          const newMain = {};
          const newLrig = {};

          for (const cardNumber of lines) {
            const card = cards.find((c) => c["カード番号"] === cardNumber);
            if (!card) continue;

            const name = card["カード名"];
            const isLrig = isLrigCard(card["カード種類"]);

            const target = isLrig ? newLrig : newMain;
            const max = isLrig ? 1 : 4;
            const prevCount = target[name]?.count || 0;
            if (prevCount < max) {
              target[name] = {
                count: prevCount + 1,
                ライフバースト: card["ライフバースト"],
                カード種類: card["カード種類"]
              };
            }
          }

          setDeckMain(newMain);
          setDeckLrig(newLrig);
          setShowImportModal(false);
        }}
        style={{ marginTop: "10px", padding: "6px 12px", fontSize: "1em", cursor: "pointer" }}
        className="button button01"
      >
        読み込み
      </button>
      </div>
    </div>
  </div>
)}


</div>
    </div>
  );
}

export default App;
