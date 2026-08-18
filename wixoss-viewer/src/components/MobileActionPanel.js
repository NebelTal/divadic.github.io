import { DECK_FORMAT_LABELS } from "../utils/deck";

function MobileActionPanel({
  mainCount,
  lrigCount,
  lbCount,
  deckFormat,
  lrigDeckLimit,
  onAddSaba,
  onOpenPrint,
  onOutput,
  onOpenCardImages,
  onOpenImport,
  onClearDeck,
}) {
  return (
    <section className="mobile-action-panel" aria-label="デッキ操作">
      <div className="mobile-action-header">
        <h2>操作</h2>
        <p>
          {DECK_FORMAT_LABELS[deckFormat] || "ディーヴァ"} / メイン {mainCount}枚 / LB {lbCount}枚 / ルリグ {lrigCount}/{lrigDeckLimit}枚
        </p>
      </div>

      <div className="mobile-action-grid">
        <button type="button" onClick={onOpenImport} className="mobile-action-card">
          <strong>インポート</strong>
          <span>カード番号からデッキを読み込みます</span>
        </button>
        <button type="button" onClick={onOutput} className="mobile-action-card">
          <strong>出力</strong>
          <span>デッキのカード番号をコピー用に表示します</span>
        </button>
        <button type="button" onClick={onOpenCardImages} className="mobile-action-card">
          <strong>画像DL</strong>
          <span>採用カード画像の一覧を開きます</span>
        </button>
        <button type="button" onClick={onOpenPrint} className="mobile-action-card">
          <strong>印刷</strong>
          <span>デッキリスト用テンプレートを作成します</span>
        </button>
        <button type="button" onClick={onAddSaba} className="mobile-action-card">
          <strong>鯖＃追加</strong>
          <span>サーバント ＃を4枚追加します</span>
        </button>
        <button type="button" onClick={onClearDeck} className="mobile-action-card mobile-action-card-danger">
          <strong>デッキをクリア</strong>
          <span>保存されている現在のデッキを空にします</span>
        </button>
      </div>
    </section>
  );
}

export default MobileActionPanel;
