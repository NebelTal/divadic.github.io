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

  const displayOrder = [
    "カード種類",
    "カードタイプ",
    "色",
    "レベル",
    "コスト",
    "パワー",
    "効果テキスト",
    "ライフバースト",
    "使用タイミング"
  ];
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

  const toggleDisplayField = (field) => {
    setDisplayFields({ ...displayFields, [field]: !displayFields[field] });
  };

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

  const removeFromLrigDeck = (name) => {
    setDeckLrig((prev) => {
      const updated = { ...prev };
      delete updated[name];
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
      <div style={{ maxHeight: "90vh", overflowY: "auto", padding: "1em" }}>
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
        <div style={{ margin: "10px 0" }}>
          <strong>表示項目:</strong>
          {displayOrder.map((field) => (
            <label key={field} style={{ marginLeft: "10px" }}>
              <input
                type="checkbox"
                checked={displayFields[field]}
                onChange={() => toggleDisplayField(field)}
              /> {field}
            </label>
          ))}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ccc" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc" }}>カード名</th>
              {displayOrder.filter(f => displayFields[f]).map((f, i) => (
                <th key={i} style={{ border: "1px solid #ccc" }}>{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((card, index) => (
              <tr key={index} onClick={() => addToDeck(card)} style={{ cursor: "pointer" }}>
                <td style={{ border: "1px solid #ccc" }}>{card["カード名"]}</td>
                {displayOrder.filter(f => displayFields[f]).map((f, j) => (
                  <td key={j} style={{ border: "1px solid #ccc" }}>{card[f]}</td>
                ))}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>
            現在の{showMainDeck ? "メインデッキ" : "ルリグデッキ"}
          </h3>
          <div>
            <button onClick={() => setShowMainDeck(!showMainDeck)} style={{ marginLeft: "0.5em" }}>
              {showMainDeck ? "ルリグ" : "メイン"}
            </button>
            <button onClick={() => setMinimized(!minimized)} style={{ marginLeft: "0.5em" }}>
              {minimized ? "＋" : "－"}
            </button>
          </div>
        </div>
        <p>枚数: {totalCards} {showMainDeck && !minimized && `/ LB: ${totalLB}`}</p>
        {!minimized && (
          sortedDeckEntries.length > 0 ? (
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {sortedDeckEntries.map(([name, data]) => (
                <li
                  key={name}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span>{data.ライフバースト !== "―" ? "★" : ""}{name}</span>
                  <span style={{ marginLeft: "0.5em", display: "flex", alignItems: "center" }}>
                    {showMainDeck ? (
                      <>
                        <button onClick={() => adjustMainDeck(name, -1)} style={{ marginRight: "4px" }}>－</button>
                        <span>×{data.count}</span>
                        <button onClick={() => adjustMainDeck(name, 1)} style={{ marginLeft: "4px" }}>＋</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => removeFromLrigDeck(name)} style={{ marginRight: "4px" }}>－</button>
                        <span>×{data.count}</span>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>カードが追加されていません。</p>
          )
        )}
      </div>
    </div>
  );
}

export default App;
