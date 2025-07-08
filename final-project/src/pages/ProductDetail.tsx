import { useEffect, useState } from "react"; // Import React hooks for state and lifecycle management
import { useParams } from "react-router-dom"; // Import route parameters (like product ID from the URL)
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore"; // Import Firestore functions for reading and deleting data
import { useAppSelector } from "../redux/hooks"; // Import a typed Redux selector hook to get product data
import { db } from "../firebase/firebaseConfig"; // Import Firebase database instance
import { useAuth } from "../hooks/useAuth"; // Import custom hook to get the logged-in user
import StarRating from "../components/StarRating"; // Import component to show star ratings
import { ProductReviewForm } from "../components/ProductReviewForm"; // Import component for submitting a new review

// Define the structure of a review object
interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

// Component for showing product details and reviews
export default function ProductDetail() {

  // Get the product ID from the URL
  const { id: productId } = useParams<{ id: string }>();

  // Get the current user (if logged in)
  const { currentUser } = useAuth();

  // Find the matching product from Redux state
  const product = useAppSelector((state) =>
    state.product.items.find((p) => p.id === productId)
  );

  // Local states to manage fetched reviews, error messages, and IDs of reviews currently being deleted
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoadingIds, setDeleteLoadingIds] = useState<string[]>([]);

  // If no product yet, we show a loading spinner
  const isLoading = !product;

  // If productId exists but product not found, it's invalid
  const isInvalid = productId && !product;

  // Load product reviews in real-time whenever productId changes
  useEffect(() => {
    if (!productId) return;

    // Path to reviews subcollection for this product
    const reviewsRef = collection(db, "products", productId, "reviews");

    // Create a query to sort by newest review first
    const q = query(reviewsRef, orderBy("createdAt", "desc"));

    // Listen for real-time changes in reviews
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Convert Firestore snapshot to a list of review objects
        const revs: Review[] = snapshot.docs.map((doc) => {
          const data = doc.data() as Omit<Review, "id">;
          return { id: doc.id, ...data };
        });
        setReviews(revs);   
        setError(null);     
      },
      (err) => {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews.");
      }
    );

    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, [productId]); // Run when productId changes

  // Function to delete a review
  const deleteReview = async (reviewId: string) => {

    // Stop if we don't have both product and logged-in user
    if (!productId || !currentUser) return;

    try {
      // Add review ID to the loading state
      setDeleteLoadingIds((ids) => [...ids, reviewId]);

      // Build path to the review in Firestore
      const reviewRef = doc(db, "products", productId, "reviews", reviewId);

      // Delete the review from Firestore
      await deleteDoc(reviewRef);
    } catch (error) {
      console.error("Failed to delete review:", error);
      alert("Failed to delete review. Try again.");
    } finally {
      // Remove ID from loading list after delete attempt
      setDeleteLoadingIds((ids) => ids.filter((id) => id !== reviewId));
    }
  };

  // Calculate the average rating across all reviews
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Show loading spinner if product is still loading
  if (isLoading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2">Loading product...</p>
      </div>
    );
  }

  // Show error if product ID is invalid
  if (isInvalid) {
    return (
      <div className="container mt-4 text-center">
        <p className="text-danger">Product not found. Please try another item.</p>
      </div>
    );
  }

  // Main UI for product detail and reviews
  return (
    <div className="container mt-4">
      <div className="row">
        {/* Left side: product image */}
        <div className="col-md-6 text-center">
          <img
            src={product.image}
            alt={product.title}
            className="img-fluid"
            style={{ maxHeight: 400, objectFit: "contain" }}
          />
        </div>

        {/* Right side: product title, price, description, and average rating */}
        <div className="col-md-6">
          <h2 className="mb-3">{product.title}</h2>
          <h4 className="text-success mb-3">${product.price.toFixed(2)}</h4>
          <p>{product.description}</p>

          {/* Show average rating if there are any reviews */}
          {reviews.length > 0 && (
            <div className="mt-3">
              <strong>Average Rating:</strong>{" "}
              <StarRating rating={averageRating} readOnly /> ({reviews.length} reviews)
            </div>
          )}
        </div>
      </div>

      <hr />

      {/* Section to display all reviews */}
      <div className="mt-4">
        <h3>Reviews</h3>

        {/* Show error or fallback message */}
        {error && <p className="text-danger">{error}</p>}
        {reviews.length === 0 && <p className="text-muted">No reviews yet.</p>}

        {/* List of review items */}
        <ul className="list-group mb-4">
          {reviews.map((rev) => (
            <li
              key={rev.id}
              className="list-group-item bg-white rounded shadow-sm mb-2"
            >
              <div className="d-flex justify-content-between flex-column flex-md-row">
                <div>
                  {/* Show user and timestamp */}
                  <strong>{rev.userName}</strong> -{" "}
                  {new Date(rev.createdAt.seconds * 1000).toLocaleString()}

                  {/* Show star rating */}
                  <div className="mt-1">
                    <StarRating rating={rev.rating} readOnly />
                  </div>

                  {/* Show user comment */}
                  <p className="mb-0">{rev.comment}</p>
                </div>

                {/* If the review belongs to the logged-in user, show delete button */}
                {currentUser?.uid === rev.userId && (
                  <button
                    className="btn btn-sm btn-outline-danger mt-2 mt-md-0"
                    onClick={() => deleteReview(rev.id)}
                    disabled={deleteLoadingIds.includes(rev.id)}
                  >
                    {deleteLoadingIds.includes(rev.id) ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Show review form only if user is logged in */}
        {currentUser && productId ? (
          <ProductReviewForm userId={currentUser.uid} productId={productId} />
        ) : (
          <p className="text-muted">Please log in to add a review.</p>
        )}
      </div>
    </div>
  );
}