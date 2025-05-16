import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [cards, setCards] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [deckMain, setDeckMain] = useState({});
  const [deckLrig, setDeckLrig] = useState({});
  const [showMainDeck, setShowMainDeck] = useState(true);
  const [minimized, setMinimized] = useState(false);

  const addToDeck = (card) => {
    const isLrigDeckCard = ["ルリグ", "アシストルリグ", "ピース", "アーツ"].includes(card["カード種類"]);
    const setDeck = isLrigDeckCard ? setDeckLrig : setDeckMain;
    const deck = isLrigDeckCard ? deckLrig : deckMain;
    const name = card["カード名"];
    const count = deck[name]?.count || 0;

    if (isLrigDeckCard && count >= 1) return;
    if (!isLrigDeckCard && count >= 4) return;

    setDeck({
      ...deck,
      [name]: {
        count: count + 1,
        ライフバースト: card["ライフバースト"],
        カード種類: card["カード種類"]
      },
    });
  };

  const adjustMainDeck = (name, delta) => {
    setDeckMain((prev) => {
      const updated = { ...prev };
      const count = updated[name]?.count || 0;
      const newCount = count + delta;
      if (newCount > 0 && newCount <= 4) {
        updated[name].count = newCount;
      } else if (newCount <= 0) {
        delete updated[name];
      }
      return updated;
    });
  };

  const deck = showMainDeck ? deckMain : deckLrig;
  const totalCards = Object.values(deck).reduce((sum, item) => sum + item.count, 0);
  const totalLB = Object.values(deck).reduce(
    (sum, item) => sum + (item.ライフバースト && item.ライフバースト !== "―" ? item.count : 0),
    0
  );

  const sortedDeckEntries = Object.entries(deck).sort(([aName, aData], [bName, bData]) => {
    const aHasLB = aData.ライフバースト && aData.ライフバースト !== "―";
    const bHasLB = bData.ライフバースト && bData.ライフバースト !== "―";
    if (aHasLB === bHasLB) return 0;
    return aHasLB ? -1 : 1;
  });

  return (
    <div>
      <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {/* 検索フォームや検索結果テーブルなどはここに入る */}
      </div>

      <div style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#fff",
        border: "1px solid #ccc",
        padding: "1em",
        borderRadius: "8px",
        width: "300px",
        height: minimized ? "auto" : "400px",
        overflowY: "auto",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        textAlign: "left"
      }}>
        <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            現在の{showMainDeck ? "メインデッキ" : "ルリグデッキ"}
            <button onClick={() => setShowMainDeck(!showMainDeck)} style={{ marginLeft: "0.5em" }}>
              {showMainDeck ? "ルリグ" : "メイン"}
            </button>
          </span>
          <button onClick={() => setMinimized(!minimized)}>
            {minimized ? "＋" : "－"}
          </button>
        </h3>
        {!minimized && (
          <>
            {showMainDeck ? (
              <p>枚数: {totalCards} / LB: {totalLB}</p>
            ) : (
              <p>枚数: {totalCards}</p>
            )}
            {sortedDeckEntries.length > 0 ? (
              <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                {sortedDeckEntries.map(([name, data]) => (
                  <li
                    key={name}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <span>{data.ライフバースト !== "―" ? "★" : ""}{name}</span>
                    <span style={{ marginLeft: "0.5em", display: "flex", alignItems: "center" }}>
                      {showMainDeck && (
                        <>
                          <button onClick={() => adjustMainDeck(name, -1)} style={{ marginRight: "4px" }}>－</button>
                          <span>×{data.count}</span>
                          <button onClick={() => adjustMainDeck(name, 1)} style={{ marginLeft: "4px" }}>＋</button>
                        </>
                      )}
                      {!showMainDeck && <span>×{data.count}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>カードが追加されていません。</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
