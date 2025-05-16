import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [cards, setCards] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [deck, setDeck] = useState({});
  const [searchFields, setSearchFields] = useState({
    カード名: true,
    効果テキスト: true,
    ライフバースト: false,
    カード種類: false,
    カードタイプ: false,
  });
  const displayOrder = [
    "効果テキスト",
    "ライフバースト",
    "カード種類",
    "カードタイプ",
    "色",
    "レベル",
    "コスト",
    "パワー",
    "使用タイミング"
  ];
  const [displayFields, setDisplayFields] = useState({
    効果テキスト: true,
    ライフバースト: true,
    カード種類: true,
    カードタイプ: true,
    色: true,
    レベル: true,
    コスト: true,
    パワー: true,
    使用タイミング: true,
  });

  const fieldLabels = {
    カード名: "カード名",
    効果テキスト: "効果テキスト",
    ライフバースト: "LB",
    カード種類: "種類",
    カードタイプ: "タイプ",
    色: "色",
    レベル: "レベル",
    コスト: "コスト",
    パワー: "パワー",
    使用タイミング: "使用タイミング",
  };

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/cards.json?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => setCards(data));
  }, []);

  const handleSearch = () => {
    const keywords = query.split(/\s+/).filter(Boolean);
    const activeFields = Object.entries(searchFields)
      .filter(([_, checked]) => checked)
      .map(([field]) => field);

    const result = cards.filter((card) =>
      keywords.every((keyword) => {
        try {
          const pattern = useRegex ? new RegExp(keyword, "i") : null;
          return activeFields.some((field) => {
            const text = card[field] || "";
            return useRegex ? pattern.test(text) : text.toLowerCase().includes(keyword.toLowerCase());
          });
        } catch (e) {
          console.error("Invalid regex:", keyword);
          return false;
        }
      })
    );

    const uniqueByCardName = [];
    const seen = new Set();
    for (const card of result) {
      if (!seen.has(card["カード名"])) {
        seen.add(card["カード名"]);
        uniqueByCardName.push(card);
      }
    }

    console.log("検索結果のカード番号:", uniqueByCardName.map(c => c["カード番号"]));

    setFiltered(uniqueByCardName);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const toggleField = (field) => {
    setSearchFields({ ...searchFields, [field]: !searchFields[field] });
  };

  const toggleDisplayField = (field) => {
    setDisplayFields({ ...displayFields, [field]: !displayFields[field] });
  };

  const addToDeck = (card) => {
    setDeck((prev) => {
      const name = card["カード名"];
      const count = prev[name]?.count || 0;
      if (count >= 4) return prev;
      return {
        ...prev,
        [name]: {
          count: count + 1,
          ライフバースト: card["ライフバースト"],
          カード種類: card["カード種類"]
        },
      };
    });
  };

  const removeFromDeck = (name) => {
    setDeck((prev) => {
      const updated = { ...prev };
      if (updated[name].count > 1) {
        updated[name].count--;
      } else {
        delete updated[name];
      }
      return updated;
    });
  };

  const totalCards = Object.values(deck).reduce((sum, item) => sum + item.count, 0);
  const totalLB = Object.values(deck).reduce(
    (sum, item) => sum + (item.ライフバースト && item.ライフバースト !== "―" ? item.count : 0),
    0
  );

  return (
    <div className="App" style={{ padding: "2rem", fontFamily: "sans-serif", position: "relative" }}>
      <h1>WIXOSS カード検索</h1>
      <input
        style={{ marginBottom: "1rem", padding: "0.5em", width: "300px" }}
        type="text"
        placeholder="検索ワードを入力"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <label style={{ marginLeft: "1em" }}>
        <input
          type="checkbox"
          checked={useRegex}
          onChange={() => setUseRegex(!useRegex)}
        /> 正規表現
      </label>

      <div style={{ marginBottom: "1rem" }}>
        <strong>検索対象:</strong>
        {Object.keys(searchFields).map((field) => (
          <label key={field} style={{ marginRight: "1em" }}>
            <input
              type="checkbox"
              checked={searchFields[field]}
              onChange={() => toggleField(field)}
            />
            {fieldLabels[field] || field}
          </label>
        ))}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <strong>表示項目:</strong>
        {displayOrder.map((field) => (
          <label key={field} style={{ marginRight: "1em" }}>
            <input
              type="checkbox"
              checked={displayFields[field]}
              onChange={() => toggleDisplayField(field)}
            />
            {fieldLabels[field] || field}
          </label>
        ))}
      </div>

      <button onClick={handleSearch}>検索</button>

      {filtered.length > 0 && (
        <table border="1" cellPadding="4">
          <thead>
            <tr>
              <th>カード名</th>
              {displayOrder.filter((key) => displayFields[key]).map((key, i) => (
                <th key={i}>{fieldLabels[key] || key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((card, i) => (
              <tr key={i}>
                <td onClick={() => addToDeck(card)} style={{ cursor: "pointer" }}>
                  {card["カード名"]} {" "}
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
                {displayOrder.filter((key) => displayFields[key]).map((key, j) => (
                  <td key={j}>{card[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Deck Modal - Always visible */}
      <div style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#fff",
        border: "1px solid #ccc",
        padding: "1em",
        borderRadius: "8px",
        maxWidth: "300px",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        textAlign: "left"
      }}>
        <h3>現在のデッキ</h3>
        <p>枚数: {totalCards} / LB: {totalLB}</p>
        {Object.keys(deck).length > 0 ? (
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {Object.entries(deck).map(([name, data]) => (
              <li
                key={name}
                onClick={() => removeFromDeck(name)}
                style={{ cursor: "pointer" }}
              >
                {data.ライフバースト !== "―" ? "★" : ""}{name} ×{data.count} ({data.ライフバースト !== "―" ? "LB" : "―"}, {data.カード種類})
              </li>
            ))}
          </ul>
        ) : (
          <p>カードが追加されていません。</p>
        )}
      </div>
    </div>
  );
}

export default App;
