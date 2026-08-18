import ModalFrame from "./ModalFrame";

function ImportSummaryModal({ summary, onClose }) {
  if (!summary) return null;

  return (
    <ModalFrame title="インポート結果" onClose={onClose}>
      <div className="import-summary">
        <p>
          {summary.totalLines}行中 {summary.importedCards}枚を読み込みました。
        </p>
        <div className="import-summary-grid">
          <span>登録済みカード</span>
          <strong>{summary.registeredCards}枚</strong>
          <span>画像のみカード</span>
          <strong>{summary.numberOnlyCards}枚</strong>
          <span>無効な行</span>
          <strong>{summary.invalidLines.length}件</strong>
          <span>上限で省略</span>
          <strong>{summary.limitedCards.length}種類</strong>
          <span>フォーマット外</span>
          <strong>{summary.formatUnavailableCards?.length || 0}種類</strong>
          <span>判定不能</span>
          <strong>{summary.formatUnknownCards?.length || 0}種類</strong>
        </div>

        {summary.invalidLines.length > 0 && (
          <details>
            <summary>無効な行</summary>
            <ul>
              {summary.invalidLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </details>
        )}

        {summary.limitedCards.length > 0 && (
          <details>
            <summary>上限で省略したカード</summary>
            <ul>
              {summary.limitedCards.map((cardNumber) => (
                <li key={cardNumber}>{cardNumber}</li>
              ))}
            </ul>
          </details>
        )}

        {summary.formatUnavailableCards?.length > 0 && (
          <details>
            <summary>選択中のフォーマットでは使用できないカード</summary>
            <ul>
              {summary.formatUnavailableCards.map((cardNumber) => (
                <li key={cardNumber}>{cardNumber}</li>
              ))}
            </ul>
          </details>
        )}

        {summary.formatUnknownCards?.length > 0 && (
          <details>
            <summary>フォーマットを判定できないカード</summary>
            <ul>
              {summary.formatUnknownCards.map((cardNumber) => (
                <li key={cardNumber}>{cardNumber}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </ModalFrame>
  );
}

export default ImportSummaryModal;
