import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [cards, setCards] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [searchFields, setSearchFields] = useState({
    カード名: true,
    効果テキスト: true,
    ライフバースト: false,
    カード種類: false,
    カードタイプ: false,
  });
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

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/cards.json?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => setCards(data));
  }, []);

  const handleSearch = () => {
    const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
    const activeFields = Object.entries(searchFields)
      .filter(([_, checked]) => checked)
      .map(([field]) => field);

    const result = cards.filter((card) =>
      keywords.every((keyword) =>
        activeFields.some((field) =>
          (card[field] || "").toLowerCase().includes(keyword)
        )
      )
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

  return (
    <div className="App" style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>WIXOSS カード検索</h1>
      <input
        style={{ marginBottom: "1rem", padding: "0.5em", width: "300px" }}
        type="text"
        placeholder="検索ワードを入力"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div style={{ marginBottom: "1rem" }}>
        <strong>検索対象:</strong>
        {Object.keys(searchFields).map((field) => (
          <label key={field} style={{ marginRight: "1em" }}>
            <input
              type="checkbox"
              checked={searchFields[field]}
              onChange={() => toggleField(field)}
            />
            {field}
          </label>
        ))}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <strong>表示項目:</strong>
        {Object.keys(displayFields).map((field) => (
          <label key={field} style={{ marginRight: "1em" }}>
            <input
              type="checkbox"
              checked={displayFields[field]}
              onChange={() => toggleDisplayField(field)}
            />
            {field}
          </label>
        ))}
      </div>

      <button onClick={handleSearch}>検索</button>

      {filtered.length > 0 && (
        <table border="1" cellPadding="4">
          <thead>
            <tr>
              <th>カード名</th>
              {Object.keys(filtered[0])
                .filter((key) => key !== "カード番号" && key !== "カード名" && displayFields[key])
                .map((key, i) => (
                  <th key={i}>{key}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((card, i) => (
              <tr key={i}>
                <td>
                  {card["カード名"]} {" "}
                  <a
                    href={`https://www.takaratomy.co.jp/products/wixoss/library/card/card_detail.php?card_no=${card["カード番号"]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: "0.3em", fontSize: "0.8em" }}
                  >
                    ❔
                  </a>
                </td>
                {Object.entries(card)
                  .filter(([key]) => key !== "カード番号" && key !== "カード名" && displayFields[key])
                  .map(([_, val], j) => (
                    <td key={j}>{val}</td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
