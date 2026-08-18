import ModalFrame from "./ModalFrame";

function ImportModal({ importText, onImportTextChange, onImport, onClose }) {
  const readDeckFile = (file) => {
    const fileName = file.name.toLowerCase();
    const isSupported = fileName.endsWith(".txt") || fileName.endsWith(".deck");

    if (!isSupported) {
      alert(".txt または .deck 形式のテキストファイルを選択してください。");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onImportTextChange(reader.result || "");
    };
    reader.onerror = () => {
      alert("ファイルの読み込みに失敗しました。");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      readDeckFile(file);
    }
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      readDeckFile(file);
    }
  };

  const preventDefault = (event) => {
    event.preventDefault();
  };

  return (
    <ModalFrame title="デッキインポート" onClose={onClose}>
      <label
        className="import-file-dropzone"
        onDragOver={preventDefault}
        onDragEnter={preventDefault}
        onDrop={handleDrop}
      >
        <span>ファイルを選択、またはここにドラッグ&ドロップ</span>
        <small>.txt / .deck に対応</small>
        <input
          type="file"
          accept=".txt,.deck,text/plain"
          onChange={handleFileChange}
        />
      </label>
      <textarea
        value={importText}
        onChange={(e) => onImportTextChange(e.target.value)}
        placeholder="カード番号を1行ずつ貼り付けてください"
        style={{ width: "100%", height: "300px", whiteSpace: "pre", fontFamily: "monospace" }}
      />
      <div style={{ textAlign: "center" }}>
        <button
          onClick={onImport}
          style={{ marginTop: "10px", padding: "6px 12px", fontSize: "1em", cursor: "pointer" }}
          className="button button01"
        >
          読み込み
        </button>
      </div>
    </ModalFrame>
  );
}

export default ImportModal;
