// 修正済みのApp.js（デッキ編集機能を含む、filterCards に修正）
import React, { useState, useEffect } from "react";
import "./App.css";
import { filterCards } from "./utils/search";

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
    カードタイプ: true,
    色: true,
    レベル: true,
    コスト: true,
    パワー: true,
    効果テキスト: true,
    ライフバースト: true,
    使用タイミング: true,
  });
  const [deck, setDeck] = useState({});
  const [showMainDeck, setShowMainDeck] = useState(true);
  const [minimized, setMinimized] = useState(false);

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

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/cards.json?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => setCards(data));
  }, []);

const handleSearch = () => {
  const keywords = query
    .split(" ")
    .map((kw) => kw.trim())
    .filter((kw) => kw); // 空文字列除去
  const result = filterCards(cards, keywords, searchFields, useRegex);
  setFiltered(result);
};


  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const toggleField = (field) => {
    setSearchFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleDisplayField = (field) => {
    setDisplayFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const adjustDeck = (cardName, delta, type, lb) => {
    setDeck((prev) => {
      const prevCount = prev[cardName]?.count || 0;
      const newCount = Math.max(0, prevCount + delta);
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

  const deckEntries = Object.entries(deck);
  const totalCount = deckEntries.reduce((acc, [, v]) => acc + v.count, 0);
  const lbCount = deckEntries.reduce(
    (acc, [, v]) => acc + (v.ライフバースト?.includes("★") ? v.count : 0),
    0
  );

  return (
    <div className="App">
      <div className="header-fixed">
        <h1>WIXOSS カード検索</h1>
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
                    <td key={key}>{card[key]}</td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="deck-box">
        <div className="deck-header">
          <h3>{showMainDeck ? "現在のメインデッキ" : "現在のルリグデッキ"}</h3>
          <div>
            <button onClick={() => setShowMainDeck(!showMainDeck)}>ルリグ</button>
            <button onClick={() => setMinimized(!minimized)}>
              {minimized ? "＋" : "－"}
            </button>
          </div>
        </div>
        <p>
          枚数: {totalCount} / LB: {lbCount}
        </p>
        {!minimized && (
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
                <span>{name}</span>
                <span
                  style={{
                    marginLeft: "0.5em",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() =>
                      adjustDeck(
                        name,
                        -1,
                        info.カード種類,
                        info.ライフバースト
                      )
                    }
                    style={{ marginRight: 4 }}
                  >
                    －
                  </button>
                  <span>×{info.count}</span>
                  {info.カード種類 !== "ルリグ" && info.count < 4 && (
                    <button
                      onClick={() =>
                        adjustDeck(
                          name,
                          1,
                          info.カード種類,
                          info.ライフバースト
                        )
                      }
                      style={{ marginLeft: 4 }}
                    >
                      ＋
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
