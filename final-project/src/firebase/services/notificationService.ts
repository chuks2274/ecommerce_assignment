import { doc, updateDoc } from "firebase/firestore"; // Import Firestore functions to update a document
import { db } from "../../firebase/firebaseConfig"; // Import Firestore database instance
import { getAuth } from "firebase/auth"; // Import Firebase auth to get current user info

// Async function to mark a notification as read by its ID
export async function markNotificationAsRead(notificationId: string) {

  // Get current Firebase auth instance
  const auth = getAuth();

  // Log current user UID (for debugging)
  console.log("Current user UID:", auth.currentUser?.uid);

  try {
    // Create a reference to the specific notification document
    const ref = doc(db, "notifications", notificationId);

    // Prepare update data: set 'read' field to true
    const updatePayload = { read: true };

    // Log the keys in the update payload (debug info)
    console.log("Update keys:", Object.keys(updatePayload));
    // Log the actual update data (debug info)
    console.log("Update payload:", updatePayload);

    // Perform Firestore update to mark notification as read
    await updateDoc(ref, updatePayload);
 
    console.log(`✅ Marked notification ${notificationId} as read`);
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
  }
}