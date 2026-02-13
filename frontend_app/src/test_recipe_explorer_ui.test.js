import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// Mock the API layer so UI tests can focus on interactions + rendering states.
jest.mock("./api/recipes", () => ({
  recipeApi: {
    listCategories: jest.fn(),
    searchRecipes: jest.fn(),
    listRecipesByCategory: jest.fn(),
    getRecipeById: jest.fn(),
  },
}));

// Import the mocked module so we can control per-test behavior.
import { recipeApi } from "./api/recipes";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("Recipe Explorer UI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default categories load (App loads categories on mount; failures are non-fatal).
    recipeApi.listCategories.mockResolvedValue({
      items: [
        { id: "c1", name: "Beef" },
        { id: "c2", name: "Seafood" },
      ],
    });
  });

  test("renders header + loads categories", async () => {
    render(<App />);

    // Header exists immediately.
    expect(screen.getByText(/recipe explorer/i)).toBeInTheDocument();

    // Categories render after async listCategories resolves.
    expect(await screen.findByRole("button", { name: "Beef" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seafood" })).toBeInTheDocument();

    // "All" is always present.
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
  });

  test("search: calls API, shows loading state, then renders results", async () => {
    const user = userEvent.setup();

    // Make search deferred so we can assert loading UI mid-flight.
    const search = deferred();
    recipeApi.searchRecipes.mockReturnValue(search.promise);

    render(<App />);

    // Enter search query and submit
    await user.type(screen.getByRole("textbox", { name: /search recipes/i }), "salmon");
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    // API called with query
    expect(recipeApi.searchRecipes).toHaveBeenCalledTimes(1);
    expect(recipeApi.searchRecipes).toHaveBeenCalledWith("salmon");

    // Loading list state visible
    expect(screen.getByText("Searching…")).toBeDisabled();
    expect(screen.getByLabelText("Loading recipes")).toBeInTheDocument();
    expect(screen.getByText("Loading…")).toBeInTheDocument();

    // Resolve and verify results render
    search.resolve({
      items: [
        { id: "r1", name: "Salmon Pasta", thumbnail: "" },
        { id: "r2", name: "Grilled Salmon", thumbnail: "https://example.test/salmon.jpg" },
      ],
    });

    // Recipe list appears
    const list = await screen.findByRole("list", { name: "Recipes" });
    expect(within(list).getByRole("listitem", { name: /salmon pasta/i })).toBeInTheDocument();
    expect(within(list).getByRole("listitem", { name: /grilled salmon/i })).toBeInTheDocument();

    // Results count in header area should reflect items length
    expect(screen.getByText("2 results")).toBeInTheDocument();
  });

  test("search: shows error message when API rejects", async () => {
    const user = userEvent.setup();

    recipeApi.searchRecipes.mockRejectedValue(new Error("network"));

    render(<App />);

    await user.type(screen.getByRole("textbox", { name: /search recipes/i }), "pasta");
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    expect(recipeApi.searchRecipes).toHaveBeenCalledWith("pasta");

    // Error UI shown
    expect(
      await screen.findByText("Could not search recipes. Please try again.")
    ).toBeInTheDocument();

    // Loading skeleton should be gone after failure settles
    await waitFor(() => {
      expect(screen.queryByLabelText("Loading recipes")).not.toBeInTheDocument();
    });
  });

  test("category filtering: clicking a category calls API, shows loading, then renders recipes", async () => {
    const user = userEvent.setup();

    const byCategory = deferred();
    recipeApi.listRecipesByCategory.mockReturnValue(byCategory.promise);

    render(<App />);

    // Wait for categories to load so we can click them
    const seafoodChip = await screen.findByRole("button", { name: "Seafood" });
    await user.click(seafoodChip);

    expect(recipeApi.listRecipesByCategory).toHaveBeenCalledTimes(1);
    expect(recipeApi.listRecipesByCategory).toHaveBeenCalledWith("Seafood");

    // List loading UI
    expect(screen.getByLabelText("Loading recipes")).toBeInTheDocument();
    expect(screen.getByText("Loading…")).toBeInTheDocument();

    byCategory.resolve({
      items: [
        { id: "s1", name: "Shrimp Curry", thumbnail: "" },
        { id: "s2", name: "Fish Stew", thumbnail: "" },
      ],
    });

    const list = await screen.findByRole("list", { name: "Recipes" });
    expect(within(list).getByRole("listitem", { name: /shrimp curry/i })).toBeInTheDocument();
    expect(within(list).getByRole("listitem", { name: /fish stew/i })).toBeInTheDocument();

    // Subtitle updates for category mode
    expect(screen.getByText("Category: Seafood")).toBeInTheDocument();
  });

  test("category filtering: shows error message when API rejects", async () => {
    const user = userEvent.setup();

    recipeApi.listRecipesByCategory.mockRejectedValue(new Error("bad gateway"));

    render(<App />);

    const beefChip = await screen.findByRole("button", { name: "Beef" });
    await user.click(beefChip);

    expect(recipeApi.listRecipesByCategory).toHaveBeenCalledWith("Beef");

    expect(
      await screen.findByText("Could not load this category. Please try again.")
    ).toBeInTheDocument();
  });

  test("modal: opens from recipe card click, shows loading state, then shows details; closes via close button", async () => {
    const user = userEvent.setup();

    // Seed search results so a card exists to click.
    recipeApi.searchRecipes.mockResolvedValue({
      items: [{ id: "r1", name: "Tomato Soup", thumbnail: "" }],
    });

    // Defer recipe details fetch to assert loading UI inside modal.
    const recipeDetails = deferred();
    recipeApi.getRecipeById.mockReturnValue(recipeDetails.promise);

    render(<App />);

    await user.type(screen.getByRole("textbox", { name: /search recipes/i }), "soup");
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    const list = await screen.findByRole("list", { name: "Recipes" });

    // Click the recipe card (it's a button with accessible name = recipe title).
    await user.click(within(list).getByRole("listitem", { name: /tomato soup/i }));

    expect(recipeApi.getRecipeById).toHaveBeenCalledTimes(1);
    expect(recipeApi.getRecipeById).toHaveBeenCalledWith("r1");

    // Modal opens immediately with loading state.
    const dialog = await screen.findByRole("dialog", { name: "Recipe details" });
    expect(within(dialog).getByText("Loading…")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Loading recipe")).toBeInTheDocument();

    // Resolve details and validate content.
    recipeDetails.resolve({
      item: {
        id: "r1",
        name: "Tomato Soup",
        category: "Soup",
        area: "American",
        tags: ["Comfort"],
        thumbnail: "",
        youtube: "",
        source: "",
        instructions: "Mix. Simmer. Serve.",
        ingredients: ["Tomatoes — 2 cups", "Salt — 1 tsp"],
      },
    });

    // Details appear in dialog
    expect(await within(dialog).findByText("Ingredients")).toBeInTheDocument();
    expect(within(dialog).getByText("Tomatoes — 2 cups")).toBeInTheDocument();
    expect(within(dialog).getByText("Instructions")).toBeInTheDocument();
    expect(within(dialog).getByText("Mix. Simmer. Serve.")).toBeInTheDocument();

    // Close via close button
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Recipe details" })).not.toBeInTheDocument();
    });
  });

  test("modal: closes via Escape key", async () => {
    const user = userEvent.setup();

    recipeApi.searchRecipes.mockResolvedValue({
      items: [{ id: "r1", name: "Chicken Curry", thumbnail: "" }],
    });
    recipeApi.getRecipeById.mockResolvedValue({
      item: {
        id: "r1",
        name: "Chicken Curry",
        category: "Chicken",
        area: "",
        tags: [],
        thumbnail: "",
        youtube: "",
        source: "",
        instructions: "Cook.",
        ingredients: ["Chicken — 1 lb"],
      },
    });

    render(<App />);

    await user.type(screen.getByRole("textbox", { name: /search recipes/i }), "chicken");
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    const list = await screen.findByRole("list", { name: "Recipes" });
    await user.click(within(list).getByRole("listitem", { name: /chicken curry/i }));

    expect(await screen.findByRole("dialog", { name: "Recipe details" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Recipe details" })).not.toBeInTheDocument();
    });
  });

  test("modal: shows error state if getRecipeById fails", async () => {
    const user = userEvent.setup();

    recipeApi.searchRecipes.mockResolvedValue({
      items: [{ id: "r404", name: "Mystery Dish", thumbnail: "" }],
    });
    recipeApi.getRecipeById.mockRejectedValue(new Error("boom"));

    render(<App />);

    await user.type(screen.getByRole("textbox", { name: /search recipes/i }), "mystery");
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    const list = await screen.findByRole("list", { name: "Recipes" });
    await user.click(within(list).getByRole("listitem", { name: /mystery dish/i }));

    const dialog = await screen.findByRole("dialog", { name: "Recipe details" });

    expect(
      await within(dialog).findByText("Could not load recipe details. Please try again.")
    ).toBeInTheDocument();
  });
});
