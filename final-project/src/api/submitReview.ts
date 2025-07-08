import { db } from "../firebase/firebaseConfig"; // Import the Firestore database instance from your Firebase configuration file
import {
  doc,              
  collection,       
  runTransaction,   
  Timestamp,        
} from "firebase/firestore"; // Import functions from Firestore to work with documents and run database transactions

// Define the shape of the data we expect for a review
interface ReviewInput {
  userId: string;      
  productId: string;   
  rating: number;      
  comment: string;     
}

// This function handles saving a review to Firestore
export async function submitReview({
  userId,
  productId,
  rating,
  comment,
}: ReviewInput) {
  // Check if the userId is missing or not a string
  if (!userId || typeof userId !== "string") {
    throw new Error("Invalid userId");  
  }

  // Check if the productId is missing or not a string
  if (!productId || typeof productId !== "string") {
    throw new Error("Invalid productId");  
  }

  // Check if the rating is not a number between 1 and 5
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    throw new Error("Rating must be a number between 1 and 5");  
  }

  // Check if the comment is missing, not a string, or just empty spaces
  if (!comment || typeof comment !== "string" || !comment.trim()) {
    throw new Error("Comment must be a non-empty string");  
  }

  // Get a reference to the product document in Firestore
  const productRef = doc(db, "products", productId);

  // Get a reference to the "reviews" subcollection under the specific product
  const reviewsCollectionRef = collection(db, "products", productId, "reviews");

  // Use a transaction to safely update the product's average rating and add the new review
  await runTransaction(db, async (transaction) => {

    // Get the current product document snapshot (its data)
    const productSnap = await transaction.get(productRef);

    // If the product doesn't exist in the database, stop and throw an error
    if (!productSnap.exists()) {
      throw new Error("Product not found");
    }

    // Get the current data inside the product document
    const productData = productSnap.data();

    // Get the current number of ratings (or 0 if missing)
    const currentCount = productData.rating?.count || 0;

    // Get the current average rating (or 0 if missing)
    const currentRate = productData.rating?.rate || 0;

    // Add 1 to the number of reviews
    const newCount = currentCount + 1;

    // Calculate the new average rating with the new rating included
    const newRate = (currentRate * currentCount + rating) / newCount;

    // Create a new review document with a random ID in the "reviews" subcollection
    const newReviewRef = doc(reviewsCollectionRef);

    // Save the new review data to Firestore
    transaction.set(newReviewRef, {
      userId,             
      productId,          
      rating,             
      comment,            
      createdAt: Timestamp.now(),  
    });

    // Update the product's rating stats with the new count and average
    transaction.update(productRef, {
      rating: {
        count: newCount,
        rate: newRate,
      },
    });
  });
}