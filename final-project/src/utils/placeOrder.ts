import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"; // Import Firestore functions to read/write data
import { db } from "../firebase/firebaseConfig"; // Import Firestore database instance
import { type AppDispatch } from "../redux/store"; // Import type for Redux dispatch function
import {
  clearCart,
  saveCart,
  type CartItem,
} from "../redux/slices/cartSlice"; // Import Redux actions and CartItem type
import { createOrderAndNotify } from "../firebase/services/orderService"; // Import reusable function to create order & notify user

// Async function to place an order with cart items and user ID
export const placeOrder = async (
  uid: string,             
  cartItems: CartItem[],   
  dispatch: AppDispatch    
): Promise<void> => {
  try {
    // Calculate total price by summing price * quantity for each cart item
    const total = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate total quantity by summing quantities of all items
    const totalQuantity = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Collect all images from cart items, filtering out any empty or undefined
    const images = cartItems
      .map((item) => item.image)
      .filter((img): img is string => !!img);

    // Call reusable function to create order in Firestore and notify user
    // Pass order details, user ID, and product images
    const orderId = await createOrderAndNotify(
      {
        items: cartItems.map((item) => ({
          productId: item.id,      
          title: item.title,       
          image: item.image,       
          quantity: item.quantity, 
          price: item.price,       
        })),
        total,                    
      },
      uid,
      images                     // Pass images to notification
    );

    // Notify all admin users about the new order
    try {
      // Create a summary string for each item in the order
      const itemSummaries = cartItems.map(
        (item) => `${item.title} $${item.price.toFixed(2)} × ${item.quantity}`
      );

      // Compose a message with order details for admins
      const adminMessage = `📦 New order ${orderId} placed by user ${uid}. Status: pending. Items: ${cartItems.length}, Quantity: ${totalQuantity}, Total: $${total.toFixed(
        2
      )}. Order details: ${itemSummaries.join(" | ")}`;

      // Reference to users collection to find admins
      const usersRef = collection(db, "users");

      // Query to get only admin users
      const adminQuery = query(usersRef, where("role", "==", "admin"));

      // Get admin users snapshot from Firestore
      const adminSnapshot = await getDocs(adminQuery);

      // For each admin user, add a notification about the new order
      const adminNotifications = adminSnapshot.docs.map((adminDoc) =>
        addDoc(collection(db, "notifications"), {
          userId: adminDoc.id,       
          message: adminMessage,     
          images,                   
          createdAt: serverTimestamp(),  
          read: false,              
        })
      );

      // Wait until all admin notifications have been created
      await Promise.all(adminNotifications);
    } catch (err) {
      // Log error if admin notifications fail but don't block main flow
      console.error("Failed to create admin notifications:", err);
    }

    // Clear the cart state in Redux store (empty cart locally)
    dispatch(clearCart());

    // Clear the saved cart data in Firestore for the user (empty cart remotely)
    await dispatch(saveCart({ userId: uid, items: [] }));

    // Log success message to console
    console.log("✅ Order placed, notifications sent, and cart cleared.");
  } catch (error) {
    console.error("❌ Failed to place order:", error);
    throw error;  
  }
};