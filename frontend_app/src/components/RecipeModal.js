import React, { useEffect } from "react";

/**
 * @param {{
 *  isOpen: boolean,
 *  recipe: any | null,
 *  isLoading: boolean,
 *  error: string | null,
 *  onClose: () => void
 * }} props
 */
export default function RecipeModal({ isOpen, recipe, isLoading, error, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modalOverlay"
      role="dialog"
      aria-modal="true"
      aria-label="Recipe details"
      onMouseDown={(e) => {
        // Close when clicking backdrop, not content.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modalHeader">
          <div className="modalTitle">
            {isLoading ? "Loading…" : recipe?.name || "Recipe"}
          </div>
          <button type="button" className="iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error ? <div className="alert alertError">{error}</div> : null}

        {isLoading ? (
          <div className="skeletonStack" aria-label="Loading recipe">
            <div className="skeleton skeletonHero" />
            <div className="skeleton skeletonLine" />
            <div className="skeleton skeletonLine" />
            <div className="skeleton skeletonLine" />
          </div>
        ) : recipe ? (
          <div className="modalBody">
            <div className="modalHero">
              {recipe.thumbnail ? (
                <img className="heroImg" src={recipe.thumbnail} alt={recipe.name} />
              ) : null}
              <div className="meta">
                <div className="badgeRow">
                  {recipe.category ? <span className="badge">{recipe.category}</span> : null}
                  {recipe.area ? <span className="badge badgeSoft">{recipe.area}</span> : null}
                  {Array.isArray(recipe.tags)
                    ? recipe.tags.slice(0, 3).map((t) => (
                        <span key={t} className="badge badgeSoft">
                          {t}
                        </span>
                      ))
                    : null}
                </div>

                <div className="actionRow">
                  {recipe.source ? (
                    <a className="btn btnGhost" href={recipe.source} target="_blank" rel="noreferrer">
                      Source
                    </a>
                  ) : null}
                  {recipe.youtube ? (
                    <a
                      className="btn btnPrimary"
                      href={recipe.youtube}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Watch
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="twoCol">
              <section className="panel">
                <h3 className="h3">Ingredients</h3>
                {recipe.ingredients?.length ? (
                  <ul className="list">
                    {recipe.ingredients.map((ing) => (
                      <li key={ing}>{ing}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="muted">No ingredients listed.</div>
                )}
              </section>

              <section className="panel">
                <h3 className="h3">Instructions</h3>
                <p className="instructions">{recipe.instructions || "No instructions provided."}</p>
              </section>
            </div>
          </div>
        ) : (
          <div className="muted">No recipe found.</div>
        )}
      </div>
    </div>
  );
}
