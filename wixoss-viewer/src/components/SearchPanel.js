import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { DECK_FORMAT_LABELS } from "../utils/deck";

function SearchPanel({
  query,
  useRegex,
  searchFields,
  fieldLabels,
  filterOptions,
  attributeFilters,
  onQueryChange,
  onSearch,
  onKeyDown,
  onUseRegexChange,
  onToggleField,
  onToggleAttributeFilter,
  onClearAttributeFilters,
  deckFormat,
  onDeckFormatChange,
}) {
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);
  const hasActiveFilters = Object.values(attributeFilters).some((values) => values.length > 0);
  const activeFilterCount = Object.values(attributeFilters).reduce(
    (count, values) => count + values.length,
    0
  );

  return (
    <>
      <h1>
        <img
          src={`${process.env.PUBLIC_URL}/images/logo.png`}
          alt="WIXOSS カード検索"
          className="logo"
        />
      </h1>
      <div className="search-row">
        <input
          type="text"
          placeholder="検索..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="search-textbox"
        />
        <button onClick={onSearch} className="search-button">
          <FaSearch />
        </button>
      </div>

      <fieldset className="format-selector">
        <legend className="format-selector-label">フォーマット</legend>
        <div className="format-segmented-control">
          {Object.entries(DECK_FORMAT_LABELS).map(([value, label]) => (
            <label
              key={value}
              className={
                deckFormat === value
                  ? "format-segment format-segment-active"
                  : "format-segment"
              }
            >
              <input
                type="radio"
                name="deck-format"
                value={value}
                checked={deckFormat === value}
                onChange={() => onDeckFormatChange(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        className="mobile-filter-toggle"
        onClick={() => setMobileOptionsOpen((open) => !open)}
      >
        <span>検索条件</span>
        {activeFilterCount > 0 && <span className="mobile-filter-count">{activeFilterCount}</span>}
      </button>

      <div className={mobileOptionsOpen ? "search-options search-options-open" : "search-options"}>
        <div>
          <label className="toggle-regex">
            <input
              type="checkbox"
              checked={useRegex}
              onChange={() => onUseRegexChange(!useRegex)}
            />{" "}
            正規表現を使う
          </label>
        </div>

        <div className="field-controls searchfield-check">
          {Object.keys(searchFields).map((field) => (
            <React.Fragment key={field}>
              <input
                id={field}
                type="checkbox"
                checked={searchFields[field]}
                onChange={() => onToggleField(field)}
              />
              <label htmlFor={field} className="searchfield-checkbox">
                {fieldLabels[field] || field}
              </label>
            </React.Fragment>
          ))}
        </div>

        <div className="attribute-filter-panel">
          <div className="attribute-filter-header">
            <span>絞り込み</span>
            {hasActiveFilters && (
              <button type="button" onClick={onClearAttributeFilters} className="filter-clear-button">
                クリア
              </button>
            )}
          </div>

          <div className="attribute-filter-group">
            <span className="attribute-filter-label">色</span>
            <div className="attribute-filter-options">
              {(filterOptions["色"] || []).map((value) => {
                const selected = attributeFilters["色"].includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onToggleAttributeFilter("色", value)}
                    className={selected ? "attribute-filter-chip attribute-filter-chip-active" : "attribute-filter-chip"}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="attribute-filter-group">
            <span className="attribute-filter-label">種類</span>
            <div className="attribute-filter-options">
              {(filterOptions["カード種類"] || []).map((value) => {
                const selected = attributeFilters["カード種類"].includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onToggleAttributeFilter("カード種類", value)}
                    className={selected ? "attribute-filter-chip attribute-filter-chip-active" : "attribute-filter-chip"}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="attribute-filter-group">
            <span className="attribute-filter-label">レベル</span>
            <div className="attribute-filter-options">
              {(filterOptions["レベル"] || []).map((value) => {
                const selected = attributeFilters["レベル"].includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onToggleAttributeFilter("レベル", value)}
                    className={selected ? "attribute-filter-chip attribute-filter-chip-active" : "attribute-filter-chip"}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SearchPanel;
