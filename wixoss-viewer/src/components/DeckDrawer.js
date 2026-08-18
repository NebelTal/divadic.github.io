import { useEffect, useMemo, useRef, useState } from "react";
import { LuGripVertical, LuMaximize2, LuMinimize2 } from "react-icons/lu";
import {
  DECK_FORMAT_LABELS,
  getDeckItemName,
  isLrigCard,
  isNumberOnlyDeckItem,
} from "../utils/deck";
import {
  CARD_FORMAT_STATUS,
  DECK_FORMATS,
  getCardFormatStatus,
} from "../utils/formats";

function DeckDrawer({
  minimized,
  allowCollapse = true,
  showActions = true,
  showMainDeck,
  deckEntries,
  deckMain,
  deckLrig,
  cards,
  totalCount,
  lbCount,
  deckFormat,
  lrigDeckLimit,
  onMinimizedChange,
  onShowMainDeckChange,
  onAdjustDeck,
  onReorderDeck,
  onAddSaba,
  onOpenPrint,
  onOutput,
  onOpenCardImages,
  onOpenImport,
  onClearDeck,
}) {
  const [draggingCardNumber, setDraggingCardNumber] = useState("");
  const draggingCardNumberRef = useRef("");
  const activePointerIdRef = useRef(null);
  const reorderDeckRef = useRef(onReorderDeck);
  const isCollapsed = allowCollapse && minimized;

  useEffect(() => {
    reorderDeckRef.current = onReorderDeck;
  }, [onReorderDeck]);

  useEffect(() => {
    const stopReordering = (event) => {
      if (!draggingCardNumberRef.current) return;
      if (
        event?.pointerId !== undefined &&
        activePointerIdRef.current !== null &&
        event.pointerId !== activePointerIdRef.current
      ) {
        return;
      }

      activePointerIdRef.current = null;
      draggingCardNumberRef.current = "";
      setDraggingCardNumber("");
    };
    const handlePointerMove = (event) => {
      if (!draggingCardNumberRef.current) return;
      if (event.pointerId !== activePointerIdRef.current) return;
      if (event.pointerType === "mouse" && event.buttons === 0) {
        stopReordering(event);
        return;
      }

      event.preventDefault();
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-deck-card-number]");
      const targetCardNumber = target?.dataset.deckCardNumber;
      if (targetCardNumber && targetCardNumber !== draggingCardNumberRef.current) {
        reorderDeckRef.current?.(draggingCardNumberRef.current, targetCardNumber);
      }
    };
    const stopForNewPointer = () => {
      if (draggingCardNumberRef.current) stopReordering();
    };

    window.addEventListener("pointermove", handlePointerMove, true);
    window.addEventListener("pointerup", stopReordering, true);
    window.addEventListener("pointercancel", stopReordering, true);
    window.addEventListener("pointerdown", stopForNewPointer, true);
    window.addEventListener("blur", stopReordering);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove, true);
      window.removeEventListener("pointerup", stopReordering, true);
      window.removeEventListener("pointercancel", stopReordering, true);
      window.removeEventListener("pointerdown", stopForNewPointer, true);
      window.removeEventListener("blur", stopReordering);
    };
  }, []);

  const cardByNumber = useMemo(
    () => new Map(cards.map((card) => [card["カード番号"], card])),
    [cards]
  );
  const getItemFormatStatus = (cardNumber, info) => {
    if (isNumberOnlyDeckItem(info) && deckFormat !== DECK_FORMATS.ALLSTAR) {
      return CARD_FORMAT_STATUS.UNKNOWN;
    }
    return getCardFormatStatus(cardByNumber.get(cardNumber) || info, deckFormat);
  };
  const allDeckEntries = [...Object.entries(deckMain), ...Object.entries(deckLrig)];
  const unavailableFormatCount = allDeckEntries.filter(
    ([cardNumber, info]) =>
      getItemFormatStatus(cardNumber, info) === CARD_FORMAT_STATUS.UNAVAILABLE
  ).length;
  const unknownFormatCount = allDeckEntries.filter(
    ([cardNumber, info]) =>
      getItemFormatStatus(cardNumber, info) === CARD_FORMAT_STATUS.UNKNOWN
  ).length;

  const handleReorderKeyDown = (event, cardNumber, index) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    const targetIndex = event.key === "ArrowUp" ? index - 1 : index + 1;
    const targetCardNumber = deckEntries[targetIndex]?.[0];
    if (targetCardNumber) {
      onReorderDeck(cardNumber, targetCardNumber);
    }
  };

  return (
    <section
      className={`deck-box ${isCollapsed ? "deck-box-minimized" : ""}`}
      aria-label="デッキ"
    >
      <div className="deck-header">
        {!isCollapsed && (
          <>
            <div className="deck-heading">
              <h3 className="deck-title">
                {showMainDeck ? "メインデッキ" : "ルリグデッキ"}
              </h3>
              <p className="deck-summary">
                {showMainDeck
                  ? `枚数: ${totalCount} / LB: ${lbCount}`
                  : `枚数: ${totalCount} / ${lrigDeckLimit}`}
              </p>
              <p className="deck-format-summary">
                {DECK_FORMAT_LABELS[deckFormat] || "ディーヴァ"}
              </p>
            </div>
            <div className="deck-tabs" aria-label="表示するデッキ">
              <button
                type="button"
                onClick={() => onShowMainDeckChange(true)}
                className={showMainDeck ? "deck-tab deck-tab-active" : "deck-tab"}
              >
                メイン
              </button>
              <button
                type="button"
                onClick={() => onShowMainDeckChange(false)}
                className={!showMainDeck ? "deck-tab deck-tab-active" : "deck-tab"}
              >
                ルリグ
              </button>
            </div>
          </>
        )}
        {allowCollapse && (
          <button
            type="button"
            onClick={() => onMinimizedChange(!minimized)}
            className="icon-button deck-minimize-button"
            aria-label={minimized ? "デッキを開く" : "デッキを畳む"}
          >
            {minimized ? <LuMaximize2 /> : <LuMinimize2 />}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="deck-content">
          <p style={{ margin: 0, fontSize: "1em" }}>
            {showMainDeck
              ? `ルリグデッキ：${Object.values(deckLrig).reduce((acc, v) => acc + v.count, 0)} / ${lrigDeckLimit}枚`
              : `メインデッキ：${Object.values(deckMain).reduce((acc, v) => acc + v.count, 0)}枚`}
          </p>
          {(unavailableFormatCount > 0 || unknownFormatCount > 0) && (
            <div className="deck-format-alert" role="status">
              {unavailableFormatCount > 0 && (
                <span>フォーマット外 {unavailableFormatCount}種</span>
              )}
              {unknownFormatCount > 0 && (
                <span>判定不能 {unknownFormatCount}種</span>
              )}
            </div>
          )}
          <ul className="deck-list">
            {deckEntries.map(([cardNumber, info], index) => {
              const name = getDeckItemName(cardNumber, info, cards);
              const itemGroupKey = info.groupKey || cardNumber;
              const groupCount = deckEntries.reduce(
                (count, [entryCardNumber, item]) =>
                  count +
                  ((item.groupKey || entryCardNumber) === itemGroupKey ? item.count : 0),
                0
              );
              const formatStatus = getItemFormatStatus(cardNumber, info);
              const formatUnavailable = formatStatus === CARD_FORMAT_STATUS.UNAVAILABLE;
              const formatUnknown = formatStatus === CARD_FORMAT_STATUS.UNKNOWN;
              const canIncrease = groupCount < 4 && !formatUnavailable;
              const isDragging = draggingCardNumber === cardNumber;
              return (
              <li
                key={cardNumber}
                data-deck-card-number={cardNumber}
                className={[
                  "deck-list-item",
                  formatUnavailable ? "deck-item-format-unavailable" : "",
                  isDragging ? "deck-list-item-dragging" : "",
                ].filter(Boolean).join(" ")}
              >
                <button
                  type="button"
                  className="deck-sort-handle"
                  aria-label={`${name}を並べ替え。上下キーでも移動できます`}
                  title="ドラッグして並べ替え"
                  onPointerDown={(event) => {
                    if (event.pointerType === "mouse" && event.button !== 0) return;
                    event.preventDefault();
                    activePointerIdRef.current = event.pointerId;
                    draggingCardNumberRef.current = cardNumber;
                    setDraggingCardNumber(cardNumber);
                  }}
                  onKeyDown={(event) => handleReorderKeyDown(event, cardNumber, index)}
                >
                  <LuGripVertical aria-hidden="true" />
                </button>
                <span className="deck-item-name">
                  <span>
                    {info.ライフバースト && info.ライフバースト !== "―" ? "★" : ""}
                    {name}
                    {isNumberOnlyDeckItem(info) && <span className="deck-item-badge">画像のみ</span>}
                    {formatUnavailable && <span className="deck-item-format-badge">フォーマット外</span>}
                    {formatUnknown && <span className="deck-item-format-badge deck-item-format-unknown">判定不能</span>}
                  </span>
                </span>
                <span className="deck-item-meta-row">
                  {!isNumberOnlyDeckItem(info) && (
                    <small className="deck-item-number">{cardNumber}</small>
                  )}
                  <span className="deck-item-actions">
                    <button
                      onClick={() =>
                        onAdjustDeck(
                          cardNumber,
                          -1,
                          info.カード種類,
                          info.ライフバースト,
                          name,
                          itemGroupKey
                        )
                      }
                      style={{
                        marginRight: 4,
                        paddingLeft: 6,
                        paddingRight: 6,
                        paddingTop: 3,
                        paddingBottom: 3,
                        fontSize: 13,
                      }}
                      className="button button03"
                    >
                      －
                    </button>
                    <span>×{info.count}</span>
                    {!isLrigCard(info.カード種類) && (
                      <button
                        onClick={() =>
                          onAdjustDeck(
                            cardNumber,
                            1,
                            info.カード種類,
                            info.ライフバースト,
                            name,
                            itemGroupKey
                          )
                        }
                        disabled={!canIncrease}
                        style={{
                          marginLeft: 4,
                          opacity: canIncrease ? 1 : 0.35,
                          paddingLeft: 6,
                          paddingRight: 6,
                          paddingTop: 3,
                          paddingBottom: 3,
                          fontSize: 13,
                        }}
                        className="button button02"
                      >
                        ＋
                      </button>
                    )}
                  </span>
                </span>
              </li>
              );
            })}
          </ul>
          {showActions && (
            <div className="button-container">
              <button type="button" onClick={onAddSaba} className="button button02">
                鯖＃追加
              </button>
              <div>
                <button type="button" onClick={onOpenPrint} className="button button01">
                  印刷
                </button>
                <button style={{ marginLeft: "8px" }} type="button" onClick={onOutput} className="button button01">
                  出力
                </button>
                <button
                  style={{ marginLeft: "8px" }}
                  type="button"
                  onClick={onOpenCardImages}
                  className="button button01"
                >
                  画像DL
                </button>
                <button
                  style={{ marginLeft: "8px" }}
                  type="button"
                  onClick={onOpenImport}
                  className="button button01"
                >
                  インポート
                </button>
                <button
                  style={{ marginLeft: "8px" }}
                  type="button"
                  onClick={onClearDeck}
                  className="button deck-clear-button"
                >
                  クリア
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default DeckDrawer;
