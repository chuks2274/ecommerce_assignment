import { useParams, useNavigate } from "react-router-dom"; // Import React Router hooks to get URL params and navigate programmatically
import { useEffect, useState } from "react"; // Import React hooks for side effects and state management
import {
  collection,  
  onSnapshot,  
  Timestamp,  
  QuerySnapshot,  
  type DocumentData,  
  getDoc,  
  doc,  
} from "firebase/firestore"; // Import Firestore functions for querying and listening to data
import { db } from "../firebase/firebaseConfig"; // Import Firestore database instance

// Define the shape of a review object
interface Review {
  id: string;  
  comment: string;  
  rating: number;  
  createdAt: Timestamp;  
  userId: string;  
  helpfulCount?: number;  
}

// How many reviews to show per page
const reviewsPerPage = 5;  

// Main component to display reviews for a product
const ReviewPage = () => {

   // Get the productId param from the URL
  const { productId } = useParams(); 
  
   // Function to change pages programmatically
  const navigate = useNavigate();  

  // Local state variables to manage reviews data, loading/error states, pagination, sorting, rating filter, and mapping of user IDs to usernames.
  const [reviews, setReviews] = useState<Review[]>([]);  
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);  
  const [loading, setLoading] = useState(true);  
  const [error, setError] = useState<string | null>(null);  
  const [currentPage, setCurrentPage] = useState(1);  
  const [sortOption, setSortOption] = useState("date");  
  const [minRating, setMinRating] = useState(0);  
  const [usernames, setUsernames] = useState<Record<string, string>>({});  

  // Calculate how many pages there are based on filtered reviews
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);

  // Slice reviews to only show those on the current page
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );

  // Fetch reviews whenever the productId changes
  useEffect(() => {
    // If no productId in URL, show error and stop loading
    if (!productId) {
      setError("Invalid product ID.");
      setLoading(false);
      return;
    }

    // Reference to the reviews subcollection of the product
    const reviewsRef = collection(db, "products", productId, "reviews");

    // Listen for real-time updates from Firestore
    const unsubscribe = onSnapshot(
      reviewsRef,
      async (snapshot: QuerySnapshot<DocumentData>) => {

        // Convert each Firestore doc into Review object
        const fetched: Review[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Review, "id">), // Cast data to Review without id
        }));

        // Get unique userIds from reviews
        const uniqueUserIds = Array.from(
          new Set(fetched.map((review) => review.userId))
        );

        const newUsernames: Record<string, string> = {};

        // For each userId, fetch the username from users collection
        for (const userId of uniqueUserIds) {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            // Use username or displayName or default to "User"
            newUsernames[userId] = data.username || data.displayName || "User";
          } else {
            // If user document missing, default to "Anonymous"
            newUsernames[userId] = "Anonymous";
          }
        }

        setUsernames(newUsernames);  
        setReviews(fetched);  
        setLoading(false);  
        setError(null);  
      },
      (err) => {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews.");
        setLoading(false);
      }
    );

    // Cleanup listener on unmount or productId change
    return () => unsubscribe();
  }, [productId]); // Run when productId changes  

  // Whenever reviews, sort option, or rating filter change, update filtered reviews
  useEffect(() => {

    // Filter reviews by minimum rating
    const sorted = [...reviews].filter((review) => review.rating >= minRating);

    // Sort filtered reviews based on chosen option
    if (sortOption === "date") {

      // Newest first by createdAt timestamp
      sorted.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    } else if (sortOption === "rating") {

      // Highest rating first
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === "helpful") {

      // Most helpful first
      sorted.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
    }
    // Update filtered list
    setFilteredReviews(sorted);  
    setCurrentPage(1); 
  }, [reviews, sortOption, minRating]); // Run when reviews, sort option, or minimum rating changes  

  return (
    <div className="container py-4">
      {/* Page title */}
      <h2 className="h4 fw-bold text-center mb-4">Product Reviews</h2>

      {/* Filter and sort controls */}
      <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
        {/* Sort dropdown */}
        <select
          className="form-select w-auto"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="date">Sort by Date (Newest)</option>
          <option value="rating">Sort by Rating (High → Low)</option>
          <option value="helpful">Sort by Most Helpful</option>
        </select>

        {/* Minimum rating dropdown */}
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

      {/* Display loading, error, or reviews */}
      {loading ? (
        <p className="text-center">Loading reviews...</p>
      ) : error ? (
        <p className="text-danger text-center">{error}</p>
      ) : filteredReviews.length === 0 ? (
        <p className="text-center">No reviews match the criteria.</p>
      ) : (
        <>
          {/* List of reviews for current page */}
          <div className="row justify-content-center">
            {paginatedReviews.map((review) => (
              <div key={review.id} className="col-12 col-md-10 col-lg-8 mb-4">
                <div className="bg-white rounded shadow-sm p-3 border border-light h-100">
                  {/* Star rating */}
                  <div className="d-flex align-items-center mb-2">
                    <span className="text-warning me-2 fs-5">⭐</span>
                    <span className="fw-medium">{review.rating}/5</span>
                  </div>

                  {/* Review comment */}
                  <p className="mb-1 text-dark">{review.comment}</p>

                  {/* Reviewer username or short userId */}
                  <p className="text-muted small mb-0">
                    By:{" "}
                    {usernames[review.userId]
                      ? usernames[review.userId]
                      : review.userId.slice(0, 6)}
                  </p>

                  {/* Review date */}
                  <p className="text-secondary small">
                    {new Date(review.createdAt.seconds * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination controls if more than 1 page */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
              {/* Previous page button */}
              <button
                className="btn btn-primary"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                ⬅️ Prev
              </button>

              {/* Page indicator */}
              <span>
                Page {currentPage} of {totalPages}
              </span>

              {/* Next page button */}
              <button
                className="btn btn-primary"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next ➡️
              </button>
            </div>
          )}
        </>
      )}

      {/* Back to home button */}
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
// Export the ReviewPage component as the default export so it can be imported and used in other files.
export default ReviewPage;