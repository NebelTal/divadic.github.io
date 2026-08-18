import ModalFrame from "./ModalFrame";

function PrintModal({ templates, templateKey, onTemplateChange, onPrint, onClose }) {
  return (
    <ModalFrame title="プリント設定" onClose={onClose}>
      {Object.entries(templates).map(([key]) => (
        <label key={key} style={{ display: "block", marginBottom: "4px" }}>
          <input
            type="radio"
            name="template"
            value={key}
            checked={templateKey === key}
            onChange={(e) => onTemplateChange(e.target.value)}
          />
          {key === "default" ? "デフォルトテンプレート" : `テンプレート ${key.toUpperCase()}`}
        </label>
      ))}
      <button
        onClick={onPrint}
        style={{
          marginTop: "10px",
          padding: "6px 12px",
          fontSize: "1em",
          cursor: "pointer",
        }}
      >
        印刷
      </button>
    </ModalFrame>
  );
}

export default PrintModal;
