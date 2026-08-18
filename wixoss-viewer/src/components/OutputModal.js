import ModalFrame from "./ModalFrame";

function OutputModal({ outputText, onClose, onCopy, onCreateDeckImage }) {
  return (
    <ModalFrame title="デッキ出力" onClose={onClose}>
      <textarea
        value={outputText}
        readOnly
        style={{ width: "100%", height: "300px", whiteSpace: "pre", fontFamily: "monospace" }}
      />
      <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
        <button
          onClick={onCopy}
          style={{
            padding: "6px 12px",
            fontSize: "1em",
            cursor: "pointer",
          }}
        >
          コピー
        </button>
        <button
          onClick={onCreateDeckImage}
          style={{
            padding: "6px 12px",
            fontSize: "1em",
            cursor: "pointer",
          }}
          className="button button01"
        >
          画像作成
        </button>
      </div>
    </ModalFrame>
  );
}

export default OutputModal;
