import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [cards, setCards] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("cards.json")
      .then(res => res.json())
      .then(data => setCards(data));
  }, []);

  const filtered = cards.filter(card =>
    Object.values(card).some(v =>
      (v || "").toLowerCase().includes(query.toLowerCase())
    )
  );

  return (
    <div className="App" style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>WIXOSS カード検索</h1>
      <input
        style={{ marginBottom: "1rem", padding: "0.5em", width: "300px" }}
        type="text"
        placeholder="検索ワードを入力"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <table border="1" cellPadding="4">
        <thead>
          <tr>
            {cards[0] &&
              Object.keys(cards[0]).map((key, i) => <th key={i}>{key}</th>)}
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
    </div>
  );
}

export default App;
