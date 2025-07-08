import { useParams, useNavigate } from "react-router-dom"; // Import React Router hooks to get URL params and navigate programmatically
import { useEffect, useState } from "react"; // Import React hooks for lifecycle and state management
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  type DocumentData,
} from "firebase/firestore"; // Import Firestore functions for querying and listening to data
import { db } from "../firebase/firebaseConfig"; // Import Firestore database instance

// Define TypeScript interface for a Review object
interface Review {
  id: string;
  comment: string;
  rating: number;
  createdAt: Timestamp;
  user: string;
}

// Number of reviews to show per page for pagination
const reviewsPerPage = 5;

// Main component to display reviews for a product
const ReviewPage = () => {

  // Get the productId param from the URL
  const { productId } = useParams();

  // Function to change pages programmatically
  const navigate = useNavigate();

  // Local states for managing reviews (all and filtered), loading/error handling, pagination, sorting, and minimum rating filter
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState("date");
  const [minRating, setMinRating] = useState(0);

  // Calculate total pages needed based on filtered reviews count
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);

  // Slice the filtered reviews to get only those for the current page
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );

  // Effect to fetch reviews from Firestore when productId changes
  useEffect(() => {
    // If productId is missing, show error and stop loading
    if (!productId) {
      setError("Invalid product ID.");
      setLoading(false);
      return;
    }

    // Reference the "reviews" collection in Firestore
    const reviewsRef = collection(db, "reviews");

    // Create a query to get reviews for the current productId
    const q = query(reviewsRef, where("productId", "==", productId));

    // Listen in real-time to changes matching the query
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        // Map documents to Review objects including id
        const fetched: Review[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Review, "id">),
        }));
        // Save reviews in state
        setReviews(fetched);
        setLoading(false);
        setError(null);
      },
      (err) => {
        // Handle any errors during fetch
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews.");
        setLoading(false);
      }
    );

    // Cleanup listener when component unmounts or productId changes
    return () => unsubscribe();
  }, [productId]); // Run only when productId changes  

  // Effect to apply sorting and filtering whenever reviews or filters change
  useEffect(() => {
    let sorted = [...reviews];
    sorted = sorted.filter((review) => review.rating >= minRating);

    // Sort reviews by date (newest first) or rating (highest first)
    if (sortOption === "date") {
      sorted.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    } else if (sortOption === "rating") {
      sorted.sort((a, b) => b.rating - a.rating);
    }

    // Update filtered reviews and reset page to 1
    setFilteredReviews(sorted);
    setCurrentPage(1);
  }, [reviews, sortOption, minRating]); // Run when reviews, sortOption, or minRating change

  return (
    <div className="container py-4">
      <h2 className="h4 fw-bold text-center mb-4">Product Reviews</h2>

      {/* Sorting and filtering controls */}
      <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
        {/* Dropdown to select sort option */}
        <select
          className="form-select w-auto"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="date">Sort by Date (Newest)</option>
          <option value="rating">Sort by Rating (High → Low)</option>
        </select>

        {/* Dropdown to select minimum rating filter */}
        <select
          className="form-select w-auto"
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
        >
          <option value={0}>All Ratings</option>
          <option value={4}>4★ and above</option>
          <option value={3}>3★ and above</option>
          <option value={2}>2★ and above</option>
        </select>
      </div>

      {/* Main content: loading, error, no reviews, or reviews list */}
      {loading ? (
        <p className="text-center">Loading reviews...</p>
      ) : error ? (
        <p className="text-danger text-center">{error}</p>
      ) : filteredReviews.length === 0 ? (
        <p className="text-center">No reviews match the criteria.</p>
      ) : (
        <>
          {/* Show paginated reviews */}
          <div className="row justify-content-center">
            {paginatedReviews.map((review) => (
              <div key={review.id} className="col-12 col-md-10 col-lg-8 mb-4">
                <div className="bg-white rounded shadow-sm p-3 border border-light h-100">
                  {/* Show star icon and rating */}
                  <div className="d-flex align-items-center mb-2">
                    <span className="text-warning me-2 fs-5">⭐</span>
                    <span className="fw-medium">{review.rating}/5</span>
                  </div>
                  {/* Show review comment */}
                  <p className="mb-1 text-dark">{review.comment}</p>
                  {/* Show reviewer name or fallback */}
                  <p className="text-muted small mb-0">
                    By: {review.user || "Anonymous"}
                  </p>
                  {/* Show review date formatted nicely */}
                  <p className="text-secondary small">
                    {new Date(review.createdAt.seconds * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ Only show pagination if more than 1 page */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
              <button
                className="btn btn-primary custom-hover"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                ⬅️ Prev
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-primary custom-hover"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next ➡️
              </button>
            </div>
          )}
        </>
      )}

      {/* Button to go back to home page */}
      <div className="text-center pt-4">
        <button
          onClick={() => navigate("/")}
          className="btn btn-primary rounded-pill fw-semibold px-4 py-2"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

// Export ReviewPage component as default
export default ReviewPage;