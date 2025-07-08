import { useCallback, useMemo } from "react"; // Import React hooks for performance optimizations
import { FaStar, FaRegStar } from "react-icons/fa"; // Import star icons for displaying product rating
import type { Product } from "../types"; // Import the Product type for type safety
import { useNavigate } from "react-router-dom"; // Import navigation hook to change pages
import "./components.css"; // Import CSS for styling the component

// Define the shape of props the component will receive
interface Props {
  product: Product; 
  onAddToCart: (product: Product) => void;  
  disabled?: boolean; 
}

// Function to capitalize the first letter of the category
const capitalizeCategory = (category: string) =>
  category.charAt(0).toUpperCase() + category.slice(1);

// The main ProductCard component displaying product info and handling actions
export default function ProductCard({ product, onAddToCart, disabled = false }: Props) {

  // Function to programmatically navigate to another page
  const navigate = useNavigate();

  // Destructure product details with default fallback values to prevent errors
  const {
    id = "",
    title = "No title",
    image = "",
    price = 0,
    rating = { rate: 0, count: 0 },
    description = "",
    category = "",
  } = product || {};

  // Memoize the star rating UI so it only recalculates when rating changes
  const stars = useMemo(() => {
    // Round the rating number to a whole number (e.g. 4.7 → 5)
    const filledStars = Math.round(rating?.rate || 0);

    // Generate an array of 5 stars, filled or empty based on the rating
    return Array(5)
      .fill(0)
      .map((_, i) =>
        i < filledStars ? (
          <FaStar key={i} className="text-warning me-1" aria-label="Filled star" />
        ) : (
          <FaRegStar key={i} className="text-warning me-1" aria-label="Empty star" />
        )
      );
  }, [rating?.rate]); // Run when rating changes

  // Function to handle clicking "View Review"
  const handleViewReviews = useCallback(() => {
    if (!id) return;  
    navigate(`/reviews/${id}`); // Navigate to review page for this product
  }, [id, navigate]); // Run when id, navigate changes

  // Function to handle clicking "Add to Cart"
  const handleAddToCart = useCallback(() => {
    if (disabled || !product) return;  
    try {
      onAddToCart(product);  
    } catch (err) {
      console.error("Error adding product to cart:", err);  
      alert("Failed to add product to cart. Please try again.");  
    }
  }, [disabled, onAddToCart, product]); // Run when disabled, onAddToCart, product changes

  return (
    <div className="card h-100 product-card shadow-sm text-center p-2">
      {/* Product image */}
      {image ? (
        <img
          src={image}  
          className="card-img-top product-image"
          alt={title}
          style={{ height: "150px", objectFit: "contain" }}
          loading="lazy"  
          onError={(e) => {
            // If image fails to load, show a placeholder image
            (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
          }}
        />
      ) : (
        // If no image provided, show fallback box
        <div
          className="card-img-top product-image d-flex justify-content-center align-items-center bg-light text-muted"
          style={{ height: "150px" }}
        >
          No Image
        </div>
      )}

      <div className="card-body d-flex flex-column justify-content-between">
        <div>
          <h6 className="card-title fw-semibold" title={title}>
            {title}
          </h6>

          {/* Product price */}
          <p className="card-text text-primary fw-semibold">${price.toFixed(2)}</p>

          {/* Product category - capitalized */}
          <p className="card-text text-muted small">
            {capitalizeCategory(category)}
          </p>

          {/* Product description */}
          <p className="card-text text-muted small" title={description}>
            {description || "No description available."}
          </p>

          {/* Star rating section */}
          <div
            className="d-flex justify-content-center align-items-center mt-2"
            aria-label={`Rating: ${rating.rate} out of 5 stars based on ${rating.count} reviews`}
            role="img"
          >
            <span className="fw-semibold me-1">Rating:</span>
            {stars}
            <small className="text-muted ms-1">
              (
              {rating.count
                ? `${rating.count} review${rating.count > 1 ? "s" : ""}`
                : "No reviews"}
              )
            </small>
          </div>
        </div>

        {/* Button section */}
        <div className="mt-3 text-center">
          {/* Add to Cart button */}
          <button
            className="btn btn-outline-primary btn-sm rounded-pill custom-hover"
            onClick={handleAddToCart}
            disabled={disabled}
            aria-disabled={disabled}
            aria-label={`Add ${title} to cart`}
            type="button"
          >
            Add to Cart
          </button>

          {/* View Review link */}
          <div className="mt-2">
            <button
              type="button"
              onClick={handleViewReviews}
              className="btn btn-link p-0 view-review-link"
              aria-label={`View reviews for ${title}`}
            >
              View Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}