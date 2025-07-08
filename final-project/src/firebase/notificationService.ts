import { collection, addDoc, Timestamp } from "firebase/firestore"; // Import functions to work with Firestore
import { db } from "./firebaseConfig"; // Import your Firestore database instance
import { getAuth } from "firebase/auth"; // Import the function to get the currently logged-in user

// Define an async function to send notifications based on order status and optional delivery date
export async function sendNotification(
  status: "in process" | "delivery" | "refunded" | "cancelled" | "pending",  
  estimatedDeliveryDate?: string  
) {
  // Get the Firebase Auth service
  const auth = getAuth();

  // Get the currently logged-in user
  const user = auth.currentUser;

  if (!user) {
    console.error("❌ Cannot send notification: no authenticated user.");
    return null;
  }

  // Set up empty values for the message and type of notification
  let message = "";
  let type: "order" | "delivery" | "refund" | "cancel" | "info" = "order";

  // Choose the right message and type based on the order status
  switch (status) {
    case "in process":
      // If a delivery date is provided, add it to the message
      message = `📦 Your order is being processed${
        estimatedDeliveryDate ? ` and estimated for delivery on ${estimatedDeliveryDate}` : ""
      }.`;
      type = "order";
      break;

    case "delivery":
      // Delivered messages should NOT include delivery date even if one is passed
      message = "🎉 Your order has been delivered!";
      type = "delivery";

      // Optionally warn if a date is passed (helps debug later)
      if (estimatedDeliveryDate) {
        console.warn("ℹ️ Estimated delivery date was passed for a 'delivery' status but was ignored.");
      }
      break;

    case "refunded":
      message = "💸 Your order has been refunded.";
      type = "refund";
      break;

    case "cancelled":
      message = "❌ Your order has been cancelled.";
      type = "cancel";
      break;

    case "pending":
      // For pending status, include delivery date if provided
      message = `⏳ Your order is pending confirmation${
        estimatedDeliveryDate ? ` and estimated for delivery on ${estimatedDeliveryDate}` : ""
      }.`;
      type = "info";
      break;

    default:
      // If the status is not recognized, show a warning and stop the function
      console.warn("⚠️ Unknown status. No notification sent.");
      return null;
  }

  try {
    // Try to add a new document in the "notifications" collection in Firestore
    const docRef = await addDoc(collection(db, "notifications"), {
      userId: user.uid,          
      read: false,              
      type,                     
      message,                  
      createdAt: Timestamp.now()  
    });

    // Log a success message with the user ID and the message sent
    console.log(`✅ Notification sent to ${user.uid}: ${message}`);

    // Return the ID of the new notification document
    return docRef.id;
  } catch (error) {
    console.error("❌ Failed to send notification:", error);
    return null;
  }
}