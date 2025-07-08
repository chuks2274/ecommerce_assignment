import { useEffect, useMemo } from "react"; // Import React hooks for side effects and memoization (performance)
import { useAppDispatch, useAppSelector } from "../redux/hooks"; // Import custom Redux hooks to read and update state
import {
  loadProducts,
  setSearch,
  clearSearch,
  setCategory,
  clearCategory,
} from "../redux/slices/productSlice"; // Import actions to load products and manage filters
import { addToCart } from "../redux/slices/cartSlice"; // Import the action to add a product to the cart
import type { Product } from "../types"; // Import the Product type so we can use it for type safety
import ProductCard from "../components/ProductCard"; // Import the reusable ProductCard component

// Main component to show a list of products
export default function ProductList() {

  // Set up dispatch function to send actions to Redux store
  const dispatch = useAppDispatch();

  // Read product-related state from Redux: product list, search text, selected category
  const { items, search, category } = useAppSelector((state) => state.product);

   // Run this effect when the component loads to fetch product data
  useEffect(() => {
    try {
      dispatch(loadProducts()); // Dispatch action to fetch products
    } catch (error) {
      console.error("Failed to load products:", error);  
    }
  }, [dispatch]); // Run this only once when component mounts

  // Tell TypeScript to treat the items as an array of Product
  const typedItems = items as Product[];

  // Filter the products based on selected category and search text
  const filtered = useMemo(() => {
    return typedItems.filter((product) => {
      // Check if the category matches or is set to "all"
      const matchCategory = category === "all" || product.category === category;

      // Check if the search term is found in the product title
      const matchSearch = product.title.toLowerCase().includes(search.toLowerCase());

      return matchCategory && matchSearch; // Only show products that match both
    });
  }, [typedItems, search, category]); //Run only when typedItems, search, or category changes 

  // Create a list of unique categories for the dropdown
  const categories = useMemo(
    () => Array.from(new Set(typedItems.map((product) => product.category))),
    [typedItems]
  );

  // Function to handle when "Add to Cart" is clicked
  const handleAddToCart = (product: Product) => {
    dispatch(
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        category: product.category,
        image: product.image,
        quantity: 1,  
        rating: product.rating?.rate ?? 0,  
      })
    );
  };

  return (
    <div className="container mt-4">
      {/* Search and category filter row */}
      <div className="row mb-3 g-3 align-items-end">

        {/* Search input field */}
        <div className="col-md-6 col-lg-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search product title..."
            value={search}  
            onChange={(e) => dispatch(setSearch(e.target.value))}  
          />

          {/* Show clear button if user has typed something */}
          {search && (
            <button
              className="btn btn-sm btn-outline-secondary mt-1"
              onClick={() => dispatch(clearSearch())}  
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Category dropdown filter */}
        <div className="col-md-6 col-lg-4">
          <select
            className="form-select"
            value={category}  
            onChange={(e) => dispatch(setCategory(e.target.value))}  
          >
            <option value="all">All Categories</option>
            {/* Show all unique categories as options */}
            {categories.map((cat, i) => (
              <option key={i} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Show clear button if a category is selected */}
          {category !== "all" && (
            <button
              className="btn btn-sm btn-outline-secondary mt-1"
              onClick={() => dispatch(clearCategory())}  
            >
              Clear Category
            </button>
          )}
        </div>
      </div>

      {/* Product grid */}
      <div className="row">
        {/* If no products match the filters, show a message */}
        {filtered.length === 0 ? (
          <div className="col-12 text-center text-muted">
            <p>No products found. Try a different search or category.</p>
          </div>
        ) : (
          // Otherwise, show each product card
          filtered.map((product) => (
            <div
              key={product.id}  
              className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4"  
            >
              {/* Use the ProductCard component and pass the product and addToCart handler */}
              <ProductCard product={product} onAddToCart={handleAddToCart} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}