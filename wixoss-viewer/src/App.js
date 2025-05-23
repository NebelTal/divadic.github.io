import React, { useState, useEffect } from "react";
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

  const handleOutputClick = () => {
    const getCardNumbers = (deck) =>
     Object.entries(deck).flatMap(([name, info]) =>
        Array(info.count).fill(
         cards.find((c) => c["カード名"] === name)?.["カード番号"] || "UNKNOWN"
       )
      );

    const lrigList = getCardNumbers(deckLrig);

    const mainList = Object.entries(deckMain);
    const lbCards = mainList.filter(([, info]) => info.ライフバースト && info.ライフバースト !== "―");
    const nonLbCards = mainList.filter(([, info]) => !info.ライフバースト || info.ライフバースト === "―");

    const lbList = getCardNumbers(Object.fromEntries(lbCards));
    const nonLbList = getCardNumbers(Object.fromEntries(nonLbCards));

    const all = [...lrigList, ...lbList, ...nonLbList];
    setOutputText(all.join("\n"));
    setShowModal(true);
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
        <table className="fixed-header-table">
          <thead>
            <tr>
              <th>カード名</th>
              {displayOrder
                .filter((key) => displayFields[key])
                .map((key) => (
                  <th key={key}>{fieldLabels[key]}</th>
                ))}
            </tr>
          </thead>
        </table>
      </div>

      <div className="table-container">
        <table className="fixed-header-table">
          <tbody>
            {filtered.map((card, i) => (
              <tr key={i}>
                <td>
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
                </td>
{displayOrder
  .filter((key) => displayFields[key])
  .map((key) => (
    <td
      key={key}
      dangerouslySetInnerHTML={{
        __html: (card[key] || "").replace(/\n/g, "<br>")
      }}
    />
  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

<div className="deck-box">
  <div className="deck-header" style={{ justifyContent: minimized ? "flex-end" : "space-between" }}>
    {!minimized && (
      <h3>{showMainDeck ? "現在のメインデッキ" : "現在のルリグデッキ"}</h3>
    )}
    <div>
      {!minimized && (
        <button onClick={() => setShowMainDeck(!showMainDeck)}>
          {showMainDeck ? "ルリグ" : "メイン"}
        </button>
      )}
      <button onClick={() => setMinimized(!minimized)}>
        {minimized ? "＋" : "－"}
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
  );
}

export default App;
