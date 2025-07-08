import { useCallback, useMemo, useState } from "react";  // React hooks: useCallback for memoizing functions, useMemo for memoizing values, useState for local state
import { useDispatch, useSelector } from "react-redux";  // Import Hooks to get Redux dispatch function and read Redux state
import type { AppDispatch, RootState } from "../redux/store";  // Type imports for Redux dispatch and the whole Redux state shape
import { useNavigate } from "react-router-dom";  // Hook to navigate (redirect) users between routes/pages
import { placeOrder } from "../utils/placeOrder";  // Import reusable placeOrder function that handles order logic and Firestore
 
// React functional component for the checkout page
export default function Checkout() {
   
   // Get Redux dispatch to send actions
  const dispatch = useDispatch<AppDispatch>();
   
 // Setup navigation function for redirecting users
  const navigate = useNavigate();
   
  // Get the logged-in user info from Redux store
  const { user } = useSelector((state: RootState) => state.auth);
   
  // Get the current items in the shopping cart from Redux store
  const cartItems = useSelector((state: RootState) => state.cart.items);
   
 // Local states to manage loading spinner, success message, and error message during order placement
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
 
  // Calculate total price of all cart items, only recomputes when cartItems change
  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );
   
  // Function to handle placing the order, memoized to avoid unnecessary re-creation
  const placeOrderHandler = useCallback(async () => {
     
     // Clear any old success or error messages
    setSuccessMessage(null);
    setErrorMessage(null);
  
    // Show error if user is not logged in
    if (!user) {
      setErrorMessage("⚠️ Please login to place an order.");
      return;
    }
 
     // Show error if cart has no items
    if (cartItems.length === 0) {
      setErrorMessage("🛒 Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      // Call the shared placeOrder function to create order and send notifications
      await placeOrder(user.uid, cartItems, dispatch);
       
      setSuccessMessage("✅ Order placed successfully!");
   
      navigate("/orders");
  
    } catch (error) {
      console.error("Failed to place order:", error);
      
      setErrorMessage("❌ Failed to place order. Please try again.");
    } finally {
      setLoading(false);
  
    }
  }, [user, cartItems, dispatch, navigate]);

  return (
    <div className="container mt-4">

      <h2 className="mb-3">Checkout</h2>

      <div className="border rounded p-3 shadow-sm bg-white">

        <p className="mb-2 fs-5">
          {/* Show total price formatted with 2 decimals */}
          <strong>Total:</strong> ${total.toFixed(2)}  
        </p>

        <button
          className="btn btn-primary"
          onClick={placeOrderHandler}
          disabled={loading || !user || cartItems.length === 0}   
          title={
            !user
              ? "Please sign in to place an order."
              : cartItems.length === 0
              ? "Your cart is empty."
              : ""
          }
        >
          {loading ? "Placing Order..." : "Place Order"}
        </button>

        {successMessage && (
          <div className="alert alert-success mt-3" role="alert">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger mt-3" role="alert">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}