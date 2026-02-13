const DEFAULT_BASE_URL = "https://www.themealdb.com/api/json/v1/1";

/**
 * Resolve the backend/API base URL from environment variables.
 * We support both REACT_APP_API_BASE and REACT_APP_BACKEND_URL.
 */
function getApiBaseUrl() {
  const fromEnv =
    (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "").trim();
  return fromEnv || DEFAULT_BASE_URL;
}

/**
 * Normalize a URL join between base and path.
 * @param {string} base
 * @param {string} path
 */
function joinUrl(base, path) {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

/**
 * @param {Response} res
 */
async function parseJsonOrThrow(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Request failed (${res.status})`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return res.json();
}

/**
 * Convert TheMealDB meal payload into an app-friendly shape.
 * @param {any} meal
 */
function mapMeal(meal) {
  if (!meal) return null;

  // Ingredients in TheMealDB are strIngredient1..20 with measures in strMeasure1..20.
  const ingredients = [];
  for (let i = 1; i <= 20; i += 1) {
    const ing = (meal[`strIngredient${i}`] || "").trim();
    const meas = (meal[`strMeasure${i}`] || "").trim();
    if (ing) {
      ingredients.push(meas ? `${ing} — ${meas}` : ing);
    }
  }

  return {
    id: meal.idMeal,
    name: meal.strMeal,
    category: meal.strCategory || "",
    area: meal.strArea || "",
    tags: meal.strTags ? meal.strTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    thumbnail: meal.strMealThumb || "",
    youtube: meal.strYoutube || "",
    source: meal.strSource || "",
    instructions: meal.strInstructions || "",
    ingredients,
  };
}

/**
 * Map category payload into app-friendly shape.
 * @param {any} cat
 */
function mapCategory(cat) {
  if (!cat) return null;
  return {
    id: cat.idCategory,
    name: cat.strCategory,
    thumbnail: cat.strCategoryThumb || "",
    description: cat.strCategoryDescription || "",
  };
}

/**
 * A small API client for recipe data.
 * Defaults to TheMealDB public API if no env URL is provided.
 */
export const recipeApi = {
  // PUBLIC_INTERFACE
  async searchRecipes(query) {
    /** Search recipes by name. Returns { items: Recipe[] } */
    const q = (query || "").trim();
    if (!q) return { items: [] };

    const url = joinUrl(getApiBaseUrl(), `search.php?s=${encodeURIComponent(q)}`);
    const res = await fetch(url, { method: "GET" });
    const data = await parseJsonOrThrow(res);

    const meals = Array.isArray(data?.meals) ? data.meals : [];
    return { items: meals.map(mapMeal).filter(Boolean) };
  },

  // PUBLIC_INTERFACE
  async listCategories() {
    /** List recipe categories. Returns { items: Category[] } */
    const url = joinUrl(getApiBaseUrl(), "categories.php");
    const res = await fetch(url, { method: "GET" });
    const data = await parseJsonOrThrow(res);

    const cats = Array.isArray(data?.categories) ? data.categories : [];
    return { items: cats.map(mapCategory).filter(Boolean) };
  },

  // PUBLIC_INTERFACE
  async listRecipesByCategory(categoryName) {
    /** List recipes within a category. Returns { items: RecipeSummary[] } */
    const name = (categoryName || "").trim();
    if (!name) return { items: [] };

    const url = joinUrl(getApiBaseUrl(), `filter.php?c=${encodeURIComponent(name)}`);
    const res = await fetch(url, { method: "GET" });
    const data = await parseJsonOrThrow(res);

    const meals = Array.isArray(data?.meals) ? data.meals : [];
    return {
      items: meals.map((m) => ({
        id: m.idMeal,
        name: m.strMeal,
        thumbnail: m.strMealThumb || "",
      })),
    };
  },

  // PUBLIC_INTERFACE
  async getRecipeById(id) {
    /** Get full recipe details by id. Returns { item: Recipe | null } */
    const rid = (id || "").toString().trim();
    if (!rid) return { item: null };

    const url = joinUrl(getApiBaseUrl(), `lookup.php?i=${encodeURIComponent(rid)}`);
    const res = await fetch(url, { method: "GET" });
    const data = await parseJsonOrThrow(res);

    const meal = Array.isArray(data?.meals) ? data.meals[0] : null;
    return { item: mapMeal(meal) };
  },
};
