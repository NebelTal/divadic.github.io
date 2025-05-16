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
        <input
          type="text"
          placeholder="検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ margin: "10px", padding: "5px", width: "80%" }}
        />
        <button
          onClick={() => {
            try {
              const terms = query.trim().split(/\s+/);
              const filteredCards = cards.filter((card) => {
                return terms.every(term => {
                  const regex = useRegex
                    ? new RegExp(term)
                    : new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
                  return (
                    regex.test(card["カード名"]) ||
                    regex.test(card["効果テキスト"]) ||
                    regex.test(card["ライフバースト"]) ||
                    regex.test(card["カード種類"]) ||
                    regex.test(card["カードタイプ"])
                  );
                });
              });
              setFiltered(filteredCards);
            } catch (e) {
              console.error("正規表現エラー:", e);
              setFiltered([]);
            }
          }}
          style={{ padding: "6px 12px", marginBottom: "10px" }}
        >
          検索
        </button>
        <label style={{ marginLeft: "10px" }}>
          <input
            type="checkbox"
            checked={useRegex}
            onChange={() => setUseRegex(!useRegex)}
          /> 正規表現
        </label>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>カード名</th>
              <th>種類</th>
              <th>タイプ</th>
              <th>色</th>
              <th>Lv</th>
              <th>コスト</th>
              <th>パワー</th>
              <th>効果テキスト</th>
              <th>LB</th>
              <th>タイミング</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((card, index) => (
              <tr key={index} onClick={() => addToDeck(card)} style={{ cursor: "pointer" }}>
                <td>{card["カード名"]}</td>
                <td>{card["カード種類"]}</td>
                <td>{card["カードタイプ"]}</td>
                <td>{card["色"]}</td>
                <td>{card["レベル"]}</td>
                <td>{card["コスト"]}</td>
                <td>{card["パワー"]}</td>
                <td>{card["効果テキスト"]}</td>
                <td>{card["ライフバースト"]}</td>
                <td>{card["使用タイミング"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
