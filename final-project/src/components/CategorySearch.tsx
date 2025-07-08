import { useEffect, useState, useCallback } from "react"; // Import React hooks for state, side effects, and memoized functions
import { fetchCategories } from "../firebase/productService"; // Import a function to get product categories from Firebase
import { Form, Button, Spinner } from "react-bootstrap"; // Import Bootstrap UI components

// Define props the component expects. It receives a function to call when the category changes.
interface Props {
  onCategoryChange: (category: string) => void;
}

// Create the CategorySearch component and receive props
export default function CategorySearch({ onCategoryChange }: Props) {

  // Local states for managing category list, selected category, loading status, and fetch error
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useEffect runs once when the component mounts
  useEffect(() => {

    // Define an async function to load categories
    const loadCategories = async () => {
      setLoading(true);       
      setError(null);        

      try {
        // Try fetching categories from the server
        const cats = await fetchCategories();
        setCategories(cats);  
      } catch (err) {
        // Log and show an error message if something goes wrong
        console.error("Error loading categories:", err);
        setError("Failed to load categories");
      } finally {
        setLoading(false);    
      }
    };

    loadCategories();  // Call the async function
  }, []);  // Only run on initial mount

  // Function to handle selecting a new category from the dropdown
  const handleSelectCategory = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;       
      setSelectedCategory(value);         

      // If "All" is selected, pass empty string to parent; otherwise, pass the category
      onCategoryChange(value === "All" ? "" : value);
    },
    [onCategoryChange]  // Run when onCategoryChange changes
  );

  // Function to clear the selected category and reset to "All"
  const clearFilter = useCallback(() => {
    setSelectedCategory("All");   
    onCategoryChange("");         
  }, [onCategoryChange]);  // Run when onCategoryChange changes

  
  return (
    <div className="mb-3">
      {/* Section heading */}
      <h5 className="mb-2">Filter Product by Category</h5>

      {/* Show an error message if one exists */}
      {error && (
        <div className="alert alert-danger py-1 px-2 mb-2" role="alert">
          {error}
        </div>
      )}

      {/* Category dropdown and buttons container */}
      <div className="d-flex align-items-center gap-3 flex-wrap">
        {/* Dropdown select input for choosing category */}
        <Form.Select
          aria-label="Select product category"
          value={selectedCategory}
          onChange={handleSelectCategory}
          disabled={loading}  // Disable dropdown while loading
          style={{ maxWidth: "300px", minWidth: "180px" }}
        >
          {/* Default option to show all products */}
          <option value="All">All</option>

          {/* Dynamically create an option for each category */}
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {/* Capitalize the first letter of each category */}
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </Form.Select>

        {/* Show spinner while categories are loading */}
        {loading && <Spinner animation="border" size="sm" role="status" />}

        {/* Show Clear Filter button only if a category other than "All" is selected */}
        {selectedCategory !== "All" && (
          <Button variant="outline-danger" onClick={clearFilter}>
            Clear Filter
          </Button>
        )}
      </div>
    </div>
  );
}