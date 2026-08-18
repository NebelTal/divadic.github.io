import { useState } from "react";
import { FiExternalLink, FiImage } from "react-icons/fi";
import { isLrigCard } from "../utils/deck";
import { DECK_FORMATS, isCardAllowedInFormat } from "../utils/formats";
import {
  CARD_MATCHED_PRINTING_FIELD,
  getCardDisplayName,
  getCardGroupKey,
  getCardPrintings,
} from "../utils/search";
import CardPrintingGallery from "./CardPrintingGallery";

const getPrintingLabel = (printing, hasMultipleDisplayNames) => {
  const cardNumber = printing["カード番号"];
  const annotation = printing["注記"] || "";
  const officialName = printing["カード名"] || "";
  const printingDisplayName = getCardDisplayName(printing);
  const details = [];

  if (hasMultipleDisplayNames && printingDisplayName) {
    details.push(printingDisplayName);
  }
  if (annotation) {
    details.push(annotation);
  } else if (officialName && officialName !== printingDisplayName) {
    details.push(officialName);
  }

  return details.length > 0 ? `${cardNumber} - ${details.join(" / ")}` : cardNumber;
};

function CardResultList({
  cards,
  total,
  loading,
  deckFormat = DECK_FORMATS.ALLSTAR,
  deckCounts,
  canAddCard,
  onAdjustDeck,
  onLoadMore,
}) {
  const [selectedPrintings, setSelectedPrintings] = useState({});
  const [printingGallery, setPrintingGallery] = useState(null);
  const hasMore = cards.length < total;

  return (
    <div className="table-container search-result">
      {total > 0 && (
        <div className="search-result-summary" aria-live="polite">
          {total}件中 {cards.length}件を表示
        </div>
      )}
      {cards.map((groupedCard, index) => {
        const groupKey = getCardGroupKey(groupedCard);
        const allPrintings = [...getCardPrintings(groupedCard)].sort((a, b) =>
          (a["カード番号"] || "").localeCompare(b["カード番号"] || "")
        );
        const printings = allPrintings.filter((printing) =>
          isCardAllowedInFormat(printing, deckFormat)
        );
        const hasMultipleDisplayNames =
          new Set(printings.map((printing) => getCardDisplayName(printing))).size > 1;
        const selectedCardNumber =
          selectedPrintings[groupKey] || groupedCard[CARD_MATCHED_PRINTING_FIELD];
        const card =
          printings.find((printing) => printing["カード番号"] === selectedCardNumber) ||
          printings[0] || groupedCard;
        const cardNumber = card["カード番号"];
        const displayName = getCardDisplayName(card);
        const currentCount = deckCounts[cardNumber] || 0;
        const groupCount = allPrintings.reduce(
          (count, printing) => count + (deckCounts[printing["カード番号"]] || 0),
          0
        );
        const maxCount = isLrigCard(card["カード種類"]) ? 1 : 4;
        const reachedLimit = groupCount >= maxCount || !canAddCard(card);
        const canDecrease = currentCount > 0;
        const printingSelectId = `printing-select-${index}`;

        return (
        <div key={groupKey} className="card-item">
          <a
            href={`https://www.takaratomy.co.jp/products/wixoss/library/card/card_detail.php?card_no=${cardNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="cardname"
          >
            {displayName}
            <FiExternalLink style={{ verticalAlign: "baseline", fontSize: 14, marginLeft: 4 }} />
          </a>
          <span className={reachedLimit ? "card-count-chip card-count-chip-limit" : "card-count-chip"}>
            採用 {groupCount}/{maxCount}
          </span>
          <button
            type="button"
            style={{ marginLeft: 8, verticalAlign: "middle" }}
            disabled={!canDecrease}
            onClick={() =>
              canDecrease &&
              onAdjustDeck(
                cardNumber,
                -1,
                card["カード種類"],
                card["ライフバースト"],
                displayName,
                groupKey
              )
            }
            className={canDecrease ? "button button03" : "button button03 button-disabled"}
          >
            -1
          </button>
          <button
            type="button"
            style={{ marginLeft: 4, verticalAlign: "middle" }}
            disabled={reachedLimit}
            onClick={() =>
              !reachedLimit &&
              onAdjustDeck(
                cardNumber,
                1,
                card["カード種類"],
                card["ライフバースト"],
                displayName,
                groupKey
              )
            }
            className={reachedLimit ? "button button02 button-disabled" : "button button02"}
          >
            +1
          </button>
          {maxCount > 1 && (
            <button
              type="button"
              style={{ marginLeft: 4, verticalAlign: "middle" }}
              disabled={reachedLimit}
              onClick={() =>
                !reachedLimit &&
                onAdjustDeck(
                  cardNumber,
                  maxCount - groupCount,
                  card["カード種類"],
                  card["ライフバースト"],
                  displayName,
                  groupKey
                )
              }
              className={reachedLimit ? "button button02 button-disabled" : "button button02"}
            >
              +4
            </button>
          )}
          <div
            className={
              printings.length > 1
                ? "printing-selector"
                : "printing-selector printing-selector-single"
            }
          >
            {printings.length > 1 && (
              <>
                <label htmlFor={printingSelectId}>版を選択</label>
                <select
                  id={printingSelectId}
                  value={cardNumber}
                  onChange={(event) =>
                    setSelectedPrintings((current) => ({
                      ...current,
                      [groupKey]: event.target.value,
                    }))
                  }
                >
                  {printings.map((printing) => (
                    <option key={printing["カード番号"]} value={printing["カード番号"]}>
                      {getPrintingLabel(printing, hasMultipleDisplayNames)}
                    </option>
                  ))}
                </select>
              </>
            )}
            <button
              type="button"
              className="printing-gallery-trigger"
              onClick={() =>
                setPrintingGallery({
                  groupKey,
                  cardName: displayName,
                  printings,
                  initialSelectedCardNumber: cardNumber,
                })
              }
            >
              <FiImage aria-hidden="true" />
              {printings.length > 1 ? `全${printings.length}種を見る` : "画像を見る"}
            </button>
          </div>
          <div className="attr" style={{ marginTop: "0.3em" }}>
            <div className="row">
              <div className="type">
                <strong>種類:</strong> {card["カード種類"]}
              </div>
              <div className="color">
                <strong>色:</strong> {card["色"]}
              </div>
              <div>
                <strong>レベル:</strong> {card["レベル"]}
              </div>
              <div>
                <strong>コスト:</strong>
                <span
                  dangerouslySetInnerHTML={{
                    __html: (card["コスト"] || "").replace(/<br>/g, " "),
                  }}
                />
              </div>
              <div>
                <strong>パワー:</strong> {card["パワー"]}
              </div>
              <div>
                <strong>タイプ:</strong>
                <span
                  dangerouslySetInnerHTML={{
                    __html: (card["カードタイプ"] || "").replace(/<br>/g, " "),
                  }}
                />
              </div>

              <div>
                <strong>タイミング:</strong>
                <span
                  dangerouslySetInnerHTML={{
                    __html: (card["使用タイミング"] || "").replace(/<br>/g, " "),
                  }}
                />
              </div>
            </div>
            <div className="LB">
              <div>
                <strong>LB:</strong> {card["ライフバースト"]}
              </div>
            </div>
            <div className="text">
              <span
                dangerouslySetInnerHTML={{
                  __html: (card["効果テキスト"] || "").replace(/\n/g, "<br>"),
                }}
              />
            </div>
          </div>
        </div>
        );
      })}
      {hasMore && (
        <div className="search-result-more">
          <button
            type="button"
            className="button search-result-more-button"
            disabled={loading}
            onClick={onLoadMore}
          >
            {loading ? "読み込み中..." : `さらに表示（残り${total - cards.length}件）`}
          </button>
        </div>
      )}
      {printingGallery && (
        <CardPrintingGallery
          cardName={printingGallery.cardName}
          printings={printingGallery.printings}
          selectedCardNumber={
            selectedPrintings[printingGallery.groupKey] ||
            printingGallery.initialSelectedCardNumber
          }
          onSelect={(cardNumber) =>
            setSelectedPrintings((current) => ({
              ...current,
              [printingGallery.groupKey]: cardNumber,
            }))
          }
          onClose={() => setPrintingGallery(null)}
        />
      )}
    </div>
  );
}

export default CardResultList;
