import { useEffect, useState } from "react"; // Import React hooks to manage component state and side effects
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore"; // Import functions for collections, queries, live updates, deleting docs, etc.
import { db } from "../firebase/firebaseConfig"; // Import firestore database configuration

// Type for a single review
interface Review {
  id: string;
  comment: string;
  createdAt: Timestamp | null;
  productId: string;
  rating: number;
  userId: string;
}

// Props for this component: productId is required, userId optional
interface Props {
  productId: string;
  userId?: string;
}

// Component to show the list of reviews for a product
export function ProductReviewsList({ productId, userId }: Props) {

// Local state for reviews data, loading/error status, and delete confirmation tracking
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Effect to load and listen for review changes when productId changes
  useEffect(() => {
    // If no productId, do nothing
    if (!productId) return;

    setLoading(true);   
    setError("");       

    // Reference to the reviews subcollection under this product
    const reviewsRef = collection(db, "products", productId, "reviews");

    // Create a query for all reviews of this product
    const q = query(reviewsRef);

    // Subscribe to real-time updates for reviews
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Map documents to Review objects
        const fetched: Review[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            comment: data.comment,
            createdAt: data.createdAt ?? null,
            productId: productId,  
            rating: data.rating,
            userId: data.userId,
          };
        });

        setReviews(fetched);   
        setLoading(false);     
      },
      (err) => {
        console.error("Error loading reviews:", err);
        setError("Failed to load reviews.");
        setLoading(false);
      }
    );

    // Cleanup subscription on component unmount or productId change
    return () => unsubscribe();
  }, [productId]); //Run when productId changes

  // Function to delete a review by its ID
  const handleDelete = async (reviewId: string) => {
    // Require user to be logged in to delete
    if (!userId) {
      setError("You must be logged in to delete a review.");
      return;
    }

    setDeletingId(reviewId);   
    setError("");              

    try {
      // Delete the review doc inside the product's reviews subcollection
      await deleteDoc(doc(db, "products", productId, "reviews", reviewId));
      setConfirmDeleteId(null);  
    } catch (err) {
      console.error("Failed to delete review:", err);
      setError("Could not delete review. Please try again.");
    } finally {
      setDeletingId(null);   
    }
  };

  // Show loading message while fetching reviews
  if (loading) return <p>Loading reviews...</p>;

  // Show error if any problem happened
  if (error) return <p className="text-danger">{error}</p>;

  // Show message if no reviews exist yet
  if (reviews.length === 0) return <p>No reviews yet.</p>;

  // Render the list of reviews
  return (
    <ul className="list-group mt-3">
      {reviews.map((review) => {
        // Check if current user owns this review
        const isOwner = userId && userId === review.userId;

        // Format the creation date or show fallback text
        const createdAt = review.createdAt?.toDate().toLocaleString() || "Unknown date";

        return (
          <li
            key={review.id}
            className="list-group-item d-flex flex-column align-items-start gap-2"
          >
            <div className="d-flex w-100 justify-content-between align-items-start flex-wrap">
              <div style={{ minWidth: "60%" }}>
                {/* Show rating with stars and comment */}
                <strong className="text-warning">{review.rating} ★</strong> — {review.comment}
                <br />
                {/* Show the date in small, muted text */}
                <small className="text-muted">{createdAt}</small>
              </div>

              {/* Show delete controls only if user owns this review */}
              {isOwner && (
                <div className="text-end ms-auto">
                  {/* If not confirming deletion, show Delete button */}
                  {confirmDeleteId !== review.id ? (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setConfirmDeleteId(review.id)}  
                      disabled={deletingId === review.id}            
                      aria-label="Delete review"
                    >
                      Delete
                    </button>
                  ) : (
                    // Confirmation UI to ask user if they really want to delete
                    <div className="mt-2 text-end">
                      <p className="mb-1 text-danger">Delete this review?</p>
                      <div className="d-flex justify-content-end gap-2">
                        {/* Confirm delete button */}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(review.id)}
                          disabled={deletingId === review.id}
                        >
                          {deletingId === review.id ? "Deleting..." : "Yes"}
                        </button>
                        {/* Cancel button to hide confirmation */}
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