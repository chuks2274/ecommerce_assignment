import { useEffect, useState } from "react"; // Import React hooks for using state and side effects
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp,
  where,
  orderBy,
} from "firebase/firestore"; // Import Firestore functions to interact with the database
import { db } from "../firebase/firebaseConfig"; // Import the Firestore database configuration

// Define the structure of a review object
interface Review {
  id: string;
  comment: string;
  createdAt: Timestamp | null;
  productId: string;
  rating: number;
  userId: string;
}

// Props expected by the component: productId (required), userId (optional)
interface Props {
  productId: string;
  userId?: string;
}

// Function to render stars for the rating
const renderStars = (rating: number) => {
  const fullStars = "★".repeat(rating);          
  const emptyStars = "☆".repeat(5 - rating);     
  return (
    <span className="text-warning fw-bold">
      {fullStars}
      <span className="text-muted">{emptyStars}</span>
    </span>
  );
};

// Main component to show the list of reviews for a product
export function ProductReviewsList({ productId, userId }: Props) {
 
  // Local state to manage fetched reviews, loading status, error messages, and delete confirmation flow.
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load reviews from Firestore when the component loads or when productId changes
  useEffect(() => {
    if (!productId) return; 

    setLoading(true);  
    setError("");      

    // Reference to the "reviews" collection in Firestore
    const reviewsRef = collection(db, "reviews");

    // Create a query to fetch reviews for the current product, sorted by newest first
    const q = query(
      reviewsRef,
      where("productId", "==", productId),
      orderBy("createdAt", "desc")
    );

    // Listen for real-time updates from Firestore
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Convert Firestore documents into Review objects
        const fetched: Review[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            comment: data.comment,
            createdAt: data.createdAt ?? null,
            productId: data.productId,
            rating: data.rating,
            userId: data.userId,
          };
        });

        // Save the reviews and stop loading
        setReviews(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading reviews:", err);
        setError("Failed to load reviews.");
        setLoading(false);
      }
    );

    // Cleanup listener when component unmounts or productId changes
    return () => unsubscribe();
  }, [productId]); // Run when productId changes

  // Handle review deletion
  const handleDelete = async (reviewId: string) => {

    // Make sure the user is logged in
    if (!userId) {
      setError("You must be logged in to delete a review.");
      return;
    }

    setDeletingId(reviewId);  
    setError("");            

    try {
      // Delete the review from Firestore
      await deleteDoc(doc(db, "reviews", reviewId));
      setConfirmDeleteId(null);  
    } catch (err) {
      console.error("Failed to delete review:", err);
      setError("Could not delete review. Please try again.");
    } finally {
      setDeletingId(null);  
    }
  };

  if (loading) return <p>Loading reviews...</p>;
 
  if (error) return <p className="text-danger">{error}</p>;
 
  if (reviews.length === 0) return <p>No reviews yet.</p>;

  // Render the list of reviews
  return (
    <ul className="list-group mt-3">
      {reviews.map((review) => {
        // Check if the logged-in user wrote the review
        const isOwner = userId && userId === review.userId;  
        const createdAt =
          review.createdAt?.toDate().toLocaleString() || "Unknown date";  

        return (
          <li
            key={review.id}
            className="list-group-item d-flex flex-column align-items-start gap-2"
          >
            <div className="d-flex w-100 justify-content-between align-items-start flex-wrap">
              <div style={{ minWidth: "60%" }}>
                {/* Display star rating and comment */}
                <div>
                  {renderStars(review.rating)} — {review.comment}
                </div>
                {/* Display user ID */}
                <small className="text-muted">
                  By: {review.userId.slice(0, 6)}... on {createdAt}
                </small>
              </div>

              {/* If the user is the review owner, show delete button */}
              {isOwner && (
                <div className="text-end ms-auto">
                  {confirmDeleteId !== review.id ? (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setConfirmDeleteId(review.id)}
                      disabled={deletingId === review.id}
                    >
                      Delete
                    </button>
                  ) : (
                    // Show confirmation buttons if delete is requested
                    <div className="mt-2 text-end">
                      <p className="mb-1 text-danger">Delete this review?</p>
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(review.id)}
                          disabled={deletingId === review.id}
                        >
                          {deletingId === review.id ? "Deleting..." : "Yes"}
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deletingId === review.id}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}