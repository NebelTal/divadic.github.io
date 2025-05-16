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

  const fieldList = ["カード名", "効果テキスト", "ライフバースト", "カード種類", "カードタイプ"];
  const [searchFields, setSearchFields] = useState({
    カード名: true,
    効果テキスト: true,
    ライフバースト: false,
    カード種類: false,
    カードタイプ: false,
  });

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/cards.json?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => setCards(data));
  }, []);

  const handleSearch = () => {
    const keywords = query.trim().split(/\s+/).filter(Boolean);
    const activeFields = fieldList.filter((field) => searchFields[field]);

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

    console.log("検索結果のカード番号:", unique.map(c => c["カード番号"]));
    setFiltered(unique);
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
        <button onClick={handleSearch} style={{ padding: "6px 12px", marginBottom: "10px" }}>
          検索
        </button>
        <label style={{ marginLeft: "10px" }}>
          <input
            type="checkbox"
            checked={useRegex}
            onChange={() => setUseRegex(!useRegex)}
          /> 正規表現
        </label>
        <div style={{ margin: "10px 0" }}>
          <strong>検索対象:</strong>
          {fieldList.map((field) => (
            <label key={field} style={{ marginLeft: "10px" }}>
              <input
                type="checkbox"
                checked={searchFields[field]}
                onChange={() => setSearchFields({ ...searchFields, [field]: !searchFields[field] })}
              /> {field}
            </label>
          ))}
        </div>
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
