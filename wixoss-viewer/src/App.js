import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [cards, setCards] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");

  // 初回だけデータ読み込み（検索時にフィルタ）
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/cards.json")
      .then((res) => res.json())
      .then((data) => setCards(data));
  }, []);

  const handleSearch = () => {
    const q = query.toLowerCase();
    const result = cards.filter((card) =>
      Object.values(card).some((val) =>
        (val || "").toLowerCase().includes(q)
      )
    );
    setFiltered(result);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
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
