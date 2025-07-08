import { useDispatch } from "react-redux"; // Import a hook to dispatch actions to the Redux store
import { useAppSelector } from "../redux/hooks"; // Import a custom hook to get data from the Redux store
import {
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
} from "../redux/slices/cartSlice"; // Import cart actions to remove, increase, or decrease item quantity
import { useNavigate } from "react-router-dom"; // Import navigation hook to change pages
import { useState } from "react"; // Import React state hook to manage local component state
import { placeOrder } from "../utils/placeOrder"; // Import a helper function to handle placing the order in Firestore
import "./pages.css"; // Import CSS file for custom page styles

// Define the main Cart component
export default function Cart() {

  // Set up dispatch function to send actions to Redux store
  const dispatch = useDispatch();  

  // Set up navigation to other pages
  const navigate = useNavigate();  

  // Get all items in the cart from Redux store
  const items = useAppSelector((state) => state.cart.items); 
  
    // Get the currently logged-in user from Redux store
  const user = useAppSelector((state) => state.auth.user);    

  // Local states for managing order confirmation, loading status, and error messages
  const [showConfirm, setShowConfirm] = useState(false);  
  const [loading, setLoading] = useState(false);          
  const [errorMsg, setErrorMsg] = useState("");           

   // Calculate total number of items in the cart
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate the total price of all items in the cart
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Called when user clicks "Place Order"
  const handlePlaceOrderClick = () => {
    if (!user) {
      // If not logged in, show error
      setErrorMsg("You must be logged in to place an order.");
      return;
    }
    // Clear error and show confirmation box
    setErrorMsg("");           
    setShowConfirm(true);      
  };

  // Called when user confirms the order
  const handleConfirmOrder = async () => {
    setLoading(true);         
    setErrorMsg("");          

    try {
      // Call helper function to save order to Firestore and clear cart
      await placeOrder(user!.uid, items, dispatch);

      // Navigate to order success page
      navigate("/order-success");
    } catch (error) {
      // If there's an error, show message
      console.error("Order placement failed:", error);
      setErrorMsg("Failed to place order. Please try again.");
    } finally {
      // Reset UI state
      setLoading(false);
      setShowConfirm(false);
    }
  };

  // When user cancels the confirmation box
  const handleCancelOrder = () => {
    setShowConfirm(false);   
    setErrorMsg("");         
  };

  // When user clicks "-" button
  const handleDecrease = (id: string, quantity: number) => {
    if (quantity <= 1) {
      // If only 1 left, remove item from cart
      dispatch(removeFromCart(id));
    } else {
      // Otherwise, just reduce quantity
      dispatch(decreaseQuantity(id));
    }
  };

  return (
    <div className="container-fluid mt-4 cart-page">
      {/* Page title */}
      <h2 className="text-center mb-4">Shopping Cart</h2>

      {/* If cart is empty */}
      {items.length === 0 ? (
        <div className="text-center">
          <p>Your cart is empty.</p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/")}
            disabled={loading}
          >
            Back to Home
          </button>
        </div>
      ) : (
        <>
          {/* List all items in the cart */}
          <div className="cart-products-container d-flex flex-wrap gap-3 justify-content-center">
            {items.map((item) => (
              <div
                key={item.id}
                className="product-card-wrapper"
                style={{ flex: "0 0 auto", maxWidth: "280px", width: "100%" }}
              >
                <div className="card h-100 shadow-sm product-card">
                  {/* Product image */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="card-img-top p-3"
                    style={{ height: "180px", objectFit: "contain" }}
                  />

                  {/* Card body with item details */}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{item.title}</h5>
                    <p className="card-text fw-bold text-primary">
                      ${item.price.toFixed(2)}
                    </p>

                    {/* Quantity controls */}
                    <div className="d-flex align-items-center justify-content-between mt-auto">
                      <div className="btn-group" role="group">
                        {/* Decrease quantity or remove item */}
                        <button
                          className="btn btn-sm btn-outline-primary square-btn"
                          onClick={() => handleDecrease(item.id, item.quantity)}
                        >
                          −
                        </button>
                        <span className="px-2 align-self-center">{item.quantity}</span>
                        {/* Increase quantity */}
                        <button
                          className="btn btn-sm btn-outline-primary square-btn"
                          onClick={() => dispatch(increaseQuantity(item.id))}
                        >
                          +
                        </button>
                      </div>

                      {/* Remove item button */}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => dispatch(removeFromCart(item.id))}
                      >
                        Remove
                      </button>
                    </div>

                    {/* Total price for this item */}
                    <p className="mt-2 text-end fw-semibold">
                      Total: ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart totals section */}
          <div className="text-center mt-4 cart-total mb-3">
            <h5 className="fw-bold">Total Items: {totalItems}</h5>
            <h4 className="fw-bold">Total Price: ${total.toFixed(2)}</h4>
          </div>

          {/* Buttons for placing or canceling order */}
          <div className="d-flex justify-content-center gap-3 flex-wrap cart-actions mb-5">
            {/* Back to home */}
            <button
              className="btn btn-primary"
              onClick={() => navigate("/")}
              disabled={loading}
            >
              Back to Home
            </button>

            {/* Show Place Order or Confirm Box */}
            {!showConfirm ? (
              <button
                className="btn btn-success"
                onClick={handlePlaceOrderClick}
                disabled={loading}
              >
                Place Order
              </button>
            ) : (
              <div className="confirm-box d-flex gap-2 align-items-center flex-wrap">
                <span className="fw-semibold">Confirm placing order?</span>
                <button
                  className="btn btn-success"
                  onClick={handleConfirmOrder}
                  disabled={loading}
                >
                  {loading ? "Placing..." : "Yes"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleCancelOrder}
                  disabled={loading}
                >
                  No
                </button>
              </div>
            )}
          </div>

          {/* Show error if any */}
          {errorMsg && (
            <div className="alert alert-danger text-center" role="alert">
              {errorMsg}
            </div>
          )}
        </>
      )}
    </div>
  );
}