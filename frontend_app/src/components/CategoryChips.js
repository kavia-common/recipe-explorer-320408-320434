import React from "react";

/**
 * @param {{
 *  categories: Array<{id: string, name: string}>,
 *  selected: string | null,
 *  onSelect: (name: string | null) => void
 * }} props
 */
export default function CategoryChips({ categories, selected, onSelect }) {
  return (
    <div className="chipRow" aria-label="Recipe categories">
      <button
        type="button"
        className={`chip ${!selected ? "chipActive" : ""}`}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id || c.name}
          type="button"
          className={`chip ${selected === c.name ? "chipActive" : ""}`}
          onClick={() => onSelect(c.name)}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
