import React from "react"; // Import React (needed for JSX and typing)

// Define the props interface for this component
interface Props {
  categories: string[];            
  selected: string;                
  onSelect: (category: string) => void;   
  onClear: () => void;             
}

// Main component function for the product category filter
export default function ProductFilter({
  categories,
  selected,
  onSelect,
  onClear,
}: Props) {
  
  // Handle change when the user selects a new category from the dropdown
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      // Trigger the onSelect callback with the selected category value
      onSelect(e.target.value);
    } catch (err) {
      console.error("Failed to select category:", err);
    }
  };

  // Handle when user clicks the Clear Filter button
  const handleClear = () => {
    try {
      // Trigger the onClear callback to reset the selected category
      onClear();
    } catch (err) {
      console.error("Failed to clear filter:", err);
    }
  };
 
  return (
    <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
      {/* Label for the category select dropdown */}
      <label htmlFor="category-filter" className="form-label mb-0">
        Filter by Category:
      </label>

      {/* Dropdown to select category */}
      <select
        id="category-filter"
        className="form-select"
        value={selected}         
        onChange={handleChange}  
        aria-label="Category Filter"   
        style={{ minWidth: "200px", maxWidth: "100%" }}  
      >
        {/* Option to show all categories (no filter) */}
        <option value="">All Categories</option>

        {/* Render options for each category in the categories array */}
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* Show Clear Filter button only if a category is selected */}
      {selected && (
        <button
          className="btn btn-outline-secondary"
          onClick={handleClear}             
          aria-label="Clear category filter"   
        >
          Clear Filter
        </button>
      )}
    </div>
  );
}