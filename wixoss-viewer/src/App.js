import React, { useState, useEffect, useRef } from "react";
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
  const [displayFields, setDisplayFields] = useState({
    カード種類: true,
    カードタイプ: false,
    色: false,
    レベル: false,
    コスト: false,
    パワー: false,
    効果テキスト: true,
    ライフバースト: false,
    使用タイミング: false,
  });
  const [deckMain, setDeckMain] = useState({});
  const [deckLrig, setDeckLrig] = useState({});
  const [showMainDeck, setShowMainDeck] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const imageRef = useRef(null);


  const displayOrder = [
    "カード種類",
    "カードタイプ",
    "色",
    "レベル",
    "コスト",
    "パワー",
    "効果テキスト",
    "ライフバースト",
    "使用タイミング",
  ];

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
        try {
          const regex = useRegex ? new RegExp(kw, "i") : null;
          return activeFields.some((field) => {
            const value = card[field] || "";
            return useRegex
              ? regex.test(value)
              : value.toLowerCase().includes(kw.toLowerCase());
          });
        } catch (e) {
          console.error("Invalid regex:", kw);
          return false;
        }
      })
    );

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

    // メインデッキのnLBカード名描画
    // 最初の10枚
    x = 352;
    y = 1647;
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
    const cardList = {Lrig:deckLrig, LB:lbCards, nLB:nonLbCards};
    const numList = {Lrig:lrigList, LB:lbList, nLB:nonLbList}

    setOutputText(all.join("\n"));
    setShowModal(true);

    const openImageInNewTab = (imageUrl) => {
      if (!imageUrl) return;
      const newTab = window.open();
      if (newTab) {
        newTab.document.body.innerHTML = `<img src="${imageUrl}" style="max-width:100%">`;
      } else {
        alert("ポップアップブロックが有効かもしれません。");
      }
    };
    const img = imageRef.current;
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

  const toggleDisplayField = (field) => {
    setDisplayFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const adjustDeck = (cardName, delta, type, lb) => {
    const isLrig = isLrigCard(type);
    const setDeck = isLrig ? setDeckLrig : setDeckMain;
    const deck = isLrig ? deckLrig : deckMain;
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
    <div className="App">
      <header><h1>WIXOSS カード検索</h1></header>
      <div className="container">
      <div className="header-fixed">
        <input
          type="text"
          placeholder="検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSearch}>検索</button>
        <label style={{ marginLeft: "10px" }}>
          <input
            type="checkbox"
            checked={useRegex}
            onChange={() => setUseRegex(!useRegex)}
          /> 正規表現
        </label>
<button style={{ marginLeft: "16px" }} onClick={handleAddSaba}>
  鯖＃
</button>
        <button style={{ marginLeft: "16px" }} onClick={handleOutputClick}>
        出力
        </button>
          <button style={{ marginLeft: "8px" }} onClick={() => setShowImportModal(true)}>
  インポート
</button>

        <div className="field-controls">
          <strong>検索対象:</strong>
          {Object.keys(searchFields).map((field) => (
            <label key={field} style={{ marginLeft: "10px" }}>
              <input
                type="checkbox"
                checked={searchFields[field]}
                onChange={() => toggleField(field)}
              /> {fieldLabels[field] || field}
            </label>
          ))}
        </div>
        <div className="field-controls">
          <strong>表示項目:</strong>
          {displayOrder.map((field) => (
            <label key={field} style={{ marginLeft: "10px" }}>
              <input
                type="checkbox"
                checked={displayFields[field]}
                onChange={() => toggleDisplayField(field)}
              /> {fieldLabels[field] || field}
            </label>
          ))}
        </div>
      </div>

      <div className="table-container search-result">
            {filtered.map((card, i) => (
              <div key={i} className="card-item"> 
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      adjustDeck(
                        card["カード名"],
                        1,
                        card["カード種類"],
                        card["ライフバースト"]
                      )
                    }
                    className="cardname"
                  >
                    {card["カード名"]}
                  </span>
                  <a
                    href={`https://www.takaratomy.co.jp/products/wixoss/library/card/card_detail.php?card_no=${card["カード番号"]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: "0.3em", fontSize: "0.8em" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    ❔
                  </a>
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

<div className="deck-box">
  <div className="deck-header" style={{ justifyContent: minimized ? "flex-end" : "space-between" }}>
    {!minimized && (
      <h3>{showMainDeck ? "現在のメインデッキ" : "現在のルリグデッキ"}</h3>
    )}
    <div>
      {!minimized && (
        <button onClick={() => setShowMainDeck(!showMainDeck)} className="deck-toggle-button">
          {showMainDeck ? "ルリグ" : "メイン"}
        </button>
      )}
      <button onClick={() => setMinimized(!minimized)}>
        {minimized ? "▲" : "▼"}
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
      <p>枚数: {totalCount} {showMainDeck && `/ LB: ${lbCount}`}</p>
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {deckEntries.map(([name, info]) => (
          <li
            key={name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{info.ライフバースト && info.ライフバースト !== "―" ? "★" : ""}{name}</span>
            <span style={{ marginLeft: "0.5em", display: "flex", alignItems: "center" }}>
              <button
                onClick={() =>
                  adjustDeck(name, -1, info.カード種類, info.ライフバースト)
                }
                style={{ marginRight: 4 }}
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
                  style={{ marginLeft: 4, opacity: info.count >= 4 ? 0.5 : 1 }}
                >
                  ＋
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </>
  )}
  <img ref={imageRef} src={`${process.env.PUBLIC_URL}/images/template.png`} style={{ display: 'none' }} />
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
      <button
  onClick={handleCopy}
  style={{
    marginTop: "10px",
    padding: "6px 12px",
    fontSize: "1em",
    cursor: "pointer"
  }}
>
  コピー
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
      >
        読み込み
      </button>
    </div>
  </div>
)}


</div>
<footer>nebelTal</footer>
    </div>
  );
}

export default App;
