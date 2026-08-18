import { useState } from "react";
import { FiExternalLink } from "react-icons/fi";
import {
  getCardImageUrl,
  getHighQualityCardImageUrl,
} from "../utils/deck";
import { getCardDisplayName } from "../utils/search";
import ModalFrame from "./ModalFrame";

function PrintingImage({ printing }) {
  const cardNumber = printing["カード番号"];
  const sources = [
    getHighQualityCardImageUrl(cardNumber),
    getCardImageUrl(cardNumber),
  ].filter(Boolean);
  const [sourceIndex, setSourceIndex] = useState(0);

  if (!sources[sourceIndex]) {
    return <span className="printing-gallery-image-missing">画像を取得できません</span>;
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt={`${getCardDisplayName(printing)} ${cardNumber}`}
      loading="lazy"
      onError={() => setSourceIndex((current) => current + 1)}
    />
  );
}

function CardPrintingGallery({
  cardName,
  printings,
  selectedCardNumber,
  onSelect,
  onClose,
}) {
  return (
    <ModalFrame
      title={`${cardName}のカード画像`}
      onClose={onClose}
      surfaceClassName="printing-gallery-modal"
    >
      <p className="printing-gallery-summary">
        全{printings.length}種。画像を選ぶと、検索結果で使用する版が切り替わります。
      </p>
      <div className="printing-gallery-grid">
        {printings.map((printing) => {
          const cardNumber = printing["カード番号"];
          const annotation = printing["注記"] || "";
          const selected = cardNumber === selectedCardNumber;

          return (
            <article
              key={cardNumber}
              className={
                selected
                  ? "printing-gallery-card printing-gallery-card-selected"
                  : "printing-gallery-card"
              }
            >
              <button
                type="button"
                className="printing-gallery-image-button"
                aria-label={`${cardNumber}を選択`}
                aria-pressed={selected}
                onClick={() => onSelect(cardNumber)}
              >
                <PrintingImage printing={printing} />
                {selected && <span className="printing-gallery-selected">選択中</span>}
              </button>
              <div className="printing-gallery-card-details">
                <strong>{cardNumber}</strong>
                {annotation && <span>{annotation}</span>}
                <a
                  href={`https://www.takaratomy.co.jp/products/wixoss/library/card/card_detail.php?card_no=${cardNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  公式詳細
                  <FiExternalLink aria-hidden="true" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </ModalFrame>
  );
}

export default CardPrintingGallery;
