import { useEffect } from "react"; // Import useEffect hook to run code when data changes
import { useSelector, useDispatch } from "react-redux"; // Import useSelector to read data from Redux and useDispatch to send actions
import { saveCart } from "../redux/slices/cartSlice"; // Import the saveCart action to save the cart to the database
import type { AppDispatch, RootState } from "../redux/store"; // Import types for correctly typing the dispatch and state

// Define the CartAutoSave component
const CartAutoSave = () => {

  // Get the Redux dispatch function to send actions
  const dispatch = useDispatch<AppDispatch>();

  // Get the current cart items from Redux store
  const items = useSelector((state: RootState) => state.cart.items);

  // Get the current user's ID from Redux store
  const userId = useSelector((state: RootState) => state.auth.user?.uid);

  // Run this effect whenever cart items or userId change
  useEffect(() => {
    // If the user is logged in, save the cart
    if (userId) {
      dispatch(saveCart({ userId, items }));
    }
  }, [items, userId, dispatch]); // Run when items, userId, or dispatch changes

  // This component does not render anything
  return null;
};

// Export the component to use it in other parts of the app
export default CartAutoSave;