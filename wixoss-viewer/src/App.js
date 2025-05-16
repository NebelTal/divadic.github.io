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

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/cards.json")
      .then((res) => res.json())
      .then((data) => setCards(data));
  }, []);

  const handleSearch = () => {
    const q = query.toLowerCase();
    const activeFields = Object.entries(searchFields)
      .filter(([_, checked]) => checked)
      .map(([field]) => field);

    const result = cards.filter((card) =>
      activeFields.some((field) =>
        (card[field] || "").toLowerCase().includes(q)
      )
    );
    setFiltered(result);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const toggleField = (field) => {
    setSearchFields({ ...searchFields, [field]: !searchFields[field] });
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
      <button onClick={handleSearch}>検索</button>

      {filtered.length > 0 && (
        <table border="1" cellPadding="4">
          <thead>
            <tr>
              {Object.keys(filtered[0]).map((key, i) => (
                <th key={i}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((card, i) => (
              <tr key={i}>
                {Object.values(card).map((val, j) => (
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