import { useState, useEffect, useCallback } from "react"; // React hooks to manage state, side effects, and memoized functions
import {
  collection,   
  query,        
  where,        
  getDocs,      
} from "firebase/firestore"; // Firestore functions to query the database
import { db } from "../firebase/firebaseConfig"; // Firestore database configuration
import StarRating from "./StarRating"; // Star rating component used for selecting a rating
import { submitReview } from "../api/submitReview"; // API function that submits the review to Firestore

// Props the component expects: userId and productId
interface ProductReviewFormProps {
  userId: string;
  productId: string;
}

// Main component for submitting a review
export function ProductReviewForm({ userId, productId }: ProductReviewFormProps) {

 // Local state for rating, comment, submission status, success/error messages, and review check
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);

  // useEffect to check if this user already submitted a review
  useEffect(() => {
    const checkReview = async () => {
      // Skip if missing user or product
      if (!userId || !productId) return;

      try {
        // Go to: products → productId → reviews
        const reviewsRef = collection(db, "products", productId, "reviews");

        // Query for reviews where userId matches
        const q = query(reviewsRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);

        // If at least one review exists, mark as already reviewed
        if (!snapshot.empty) {
          setHasReviewed(true);
        }
      } catch (err) {
        console.error("Error checking existing review:", err);
      }
    };

    checkReview(); // Call the checkReview function.
  }, [userId, productId]); // Run when userId or productId changes

  // Reset success message when rating or comment changes
  useEffect(() => {
    setSuccessMsg("");
  }, [rating, comment]);  // Run when rating or comment changes

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();  
      setErrorMsg("");      
      setSuccessMsg("");    

      // Validate rating is between 1 and 5
      if (rating < 1 || rating > 5) {
        setErrorMsg("Please provide a star rating between 1 and 5.");
        return;
      }

      // Validate comment is not empty
      if (!comment.trim()) {
        setErrorMsg("Please enter a comment.");
        return;
      }

      setSubmitting(true);  

      try {
        // Send review to Firestore
        await submitReview({ userId, productId, rating, comment });

        // Show success message and clear inputs
        setSuccessMsg("Review submitted successfully!");
        setHasReviewed(true);  
        setRating(0);
        setComment("");
      } catch (error) {
        setErrorMsg("Failed to submit review: " + (error as Error).message);
      } finally {
        setSubmitting(false); 
      }
    },
    [userId, productId, rating, comment] // Run when userId, productId, rating, or comment changes
  );

  // If missing either user or product info, show error
  if (!userId || !productId) {
    return <p className="text-muted">Cannot load review form. Missing user or product information.</p>;
  }

  // If user already submitted a review, show a message instead of the form
  if (hasReviewed) {
    return <p className="text-success mt-2">You have already reviewed this product.</p>;
  }

  // Render the review form
  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <h6>Write a review</h6>

      {/* Star rating selector */}
      <StarRating rating={rating} setRating={setRating} />

      {/* Comment box */}
      <textarea
        className="form-control my-2"
        rows={3}
        placeholder="Write your comment here..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}  
        disabled={submitting}  
        aria-label="Write your comment here"
      />

      {/* Show error if there is one */}
      {errorMsg && (
        <div className="text-danger mb-2" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Show success message if available */}
      {successMsg && (
        <div className="text-success mb-2" role="alert">
          {successMsg}
        </div>
      )}

      {/* Submit button */}
      <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}