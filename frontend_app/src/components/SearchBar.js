import React from "react";

/**
 * @param {{
 *  value: string,
 *  onChange: (next: string) => void,
 *  onSubmit: () => void,
 *  placeholder?: string,
 *  isLoading?: boolean,
 * }} props
 */
export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search recipes (e.g., chicken, pasta, curry)…",
  isLoading = false,
}) {
  return (
    <form
      className="searchBar"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      role="search"
      aria-label="Recipe search"
    >
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search recipes"
      />
      <button className="btn btnPrimary" type="submit" disabled={isLoading}>
        {isLoading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
