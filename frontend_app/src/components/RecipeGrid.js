import React from "react";

/**
 * @param {{
 *  items: Array<{id: string, name: string, thumbnail?: string}>,
 *  onOpen: (id: string) => void,
 * }} props
 */
export default function RecipeGrid({ items, onOpen }) {
  return (
    <div className="grid" role="list" aria-label="Recipes">
      {items.map((r) => (
        <button
          key={r.id}
          type="button"
          className="card"
          onClick={() => onOpen(r.id)}
          role="listitem"
        >
          <div className="thumbWrap">
            {r.thumbnail ? (
              <img className="thumb" src={r.thumbnail} alt={r.name} loading="lazy" />
            ) : (
              <div className="thumbPlaceholder" aria-hidden="true" />
            )}
          </div>
          <div className="cardBody">
            <div className="cardTitle">{r.name}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
