import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { recipeApi } from "./api/recipes";
import SearchBar from "./components/SearchBar";
import CategoryChips from "./components/CategoryChips";
import RecipeGrid from "./components/RecipeGrid";
import RecipeModal from "./components/RecipeModal";

// PUBLIC_INTERFACE
function App() {
  /** Recipe Explorer single-page application */
  const [theme, setTheme] = useState("light");

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("discover"); // 'discover' | 'search' | 'category'

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [recipes, setRecipes] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
  const [recipeError, setRecipeError] = useState(null);

  const apiBase = useMemo(
    () => (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "").trim(),
    []
  );

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Load categories on first render
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await recipeApi.listCategories();
        if (cancelled) return;
        setCategories(res.items);
      } catch (e) {
        // Non-fatal: the app still supports search without categories
        // eslint-disable-next-line no-console
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    /** Toggle between light and dark theme. */
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  async function runSearch() {
    setMode("search");
    setSelectedCategory(null);
    setListError(null);
    setIsLoadingList(true);

    try {
      const res = await recipeApi.searchRecipes(query);
      setRecipes(res.items);
    } catch (e) {
      setListError("Could not search recipes. Please try again.");
    } finally {
      setIsLoadingList(false);
    }
  }

  async function loadByCategory(name) {
    setMode("category");
    setSelectedCategory(name);
    setListError(null);
    setIsLoadingList(true);

    try {
      const res = name ? await recipeApi.listRecipesByCategory(name) : { items: [] };
      setRecipes(res.items);
    } catch (e) {
      setListError("Could not load this category. Please try again.");
    } finally {
      setIsLoadingList(false);
    }
  }

  async function openRecipe(id) {
    setIsModalOpen(true);
    setActiveRecipeId(id);
    setActiveRecipe(null);
    setRecipeError(null);
    setIsLoadingRecipe(true);

    try {
      const res = await recipeApi.getRecipeById(id);
      setActiveRecipe(res.item);
      if (!res.item) setRecipeError("Recipe not found.");
    } catch (e) {
      setRecipeError("Could not load recipe details. Please try again.");
    } finally {
      setIsLoadingRecipe(false);
    }
  }

  function closeRecipe() {
    setIsModalOpen(false);
    setActiveRecipeId(null);
    setActiveRecipe(null);
    setIsLoadingRecipe(false);
    setRecipeError(null);
  }

  const headerTitle = "Recipe Explorer";
  const headerSubtitle =
    mode === "search"
      ? "Search results"
      : mode === "category"
        ? `Category: ${selectedCategory || "—"}`
        : "Discover recipes by category or search by name";

  return (
    <div className="App">
      <div className="appShell">
        <header className="topbar">
          <div className="brand">
            <div className="brandMark" aria-hidden="true">
              R
            </div>
            <div className="brandText">
              <div className="brandTitle">{headerTitle}</div>
              <div className="brandSub">{headerSubtitle}</div>
            </div>
          </div>

          <div className="topbarActions">
            <button
              className="btn btnGhost"
              type="button"
              onClick={() => {
                setMode("discover");
                setSelectedCategory(null);
                setRecipes([]);
                setListError(null);
              }}
            >
              Home
            </button>

            <button
              className="btn btnGhost"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? "Dark" : "Light"}
            </button>
          </div>
        </header>

        <main className="container">
          <section className="panel heroPanel">
            <div className="heroText">
              <h1 className="h1">Find something delicious.</h1>
              <p className="lead">
                Search recipes instantly and explore curated categories. Click a recipe for full
                instructions and ingredients.
              </p>
            </div>

            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={runSearch}
              isLoading={isLoadingList}
            />

            <div className="hintRow">
              <span className="muted">
                API base:{" "}
                <code className="codeInline">
                  {apiBase || "TheMealDB (default public endpoint)"}
                </code>
              </span>
            </div>
          </section>

          <section className="panel">
            <div className="sectionHeader">
              <h2 className="h2">Categories</h2>
              <div className="muted">Tap a category to browse recipes.</div>
            </div>

            <CategoryChips
              categories={categories}
              selected={selectedCategory}
              onSelect={(nameOrNull) => {
                if (!nameOrNull) {
                  setSelectedCategory(null);
                  setMode("discover");
                  setRecipes([]);
                  setListError(null);
                  return;
                }
                loadByCategory(nameOrNull);
              }}
            />
          </section>

          <section className="panel">
            <div className="sectionHeader">
              <h2 className="h2">Recipes</h2>
              <div className="muted">
                {isLoadingList
                  ? "Loading…"
                  : recipes.length
                    ? `${recipes.length} result${recipes.length === 1 ? "" : "s"}`
                    : "No recipes yet. Search above or pick a category."}
              </div>
            </div>

            {listError ? <div className="alert alertError">{listError}</div> : null}

            {isLoadingList ? (
              <div className="grid" aria-label="Loading recipes">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="card cardSkeleton" aria-hidden="true">
                    <div className="thumbPlaceholder" />
                    <div className="cardBody">
                      <div className="skeleton skeletonLine" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recipes.length ? (
              <RecipeGrid items={recipes} onOpen={openRecipe} />
            ) : (
              <div className="emptyState">
                <div className="emptyTitle">Start exploring</div>
                <div className="muted">
                  Try searching for “Salmon”, “Soup”, or “Pasta” — or browse by category.
                </div>
              </div>
            )}
          </section>
        </main>

        <footer className="footer">
          <div className="muted">
            Data source defaults to TheMealDB unless <code className="codeInline">REACT_APP_API_BASE</code>{" "}
            is provided.
          </div>
        </footer>

        <RecipeModal
          isOpen={isModalOpen}
          recipe={activeRecipe}
          isLoading={isLoadingRecipe}
          error={recipeError}
          onClose={closeRecipe}
          key={activeRecipeId || "recipe-modal"}
        />
      </div>
    </div>
  );
}

export default App;
