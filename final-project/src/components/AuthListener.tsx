import { useEffect } from "react"; // Import useEffect hook to run code when the component mounts or updates
import { useDispatch } from "react-redux"; // Import useDispatch to send actions to the Redux store
import { fetchCart, setCart } from "../redux/slices/cartSlice"; // Import actions for fetching and setting the cart from Redux slice
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Import Firebase auth methods to check login status
import type { AppDispatch } from "../redux/store"; // Import the type for a correctly typed dispatch function

// Create a React component that listens to authentication changes
const AuthListener = () => {

  // Get the Redux dispatch function to send actions
  const dispatch = useDispatch<AppDispatch>();   

  // Get the Firebase authentication instance
  const auth = getAuth();

  // Run this effect once when the component is mounted
  useEffect(() => {

    // Listen to authentication state changes (user login/logout)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      
      if (user) {
        // Fetch the user's cart using their ID
        const cartItems = await dispatch(fetchCart(user.uid)).unwrap();

        // Save the fetched cart items to the Redux store
        dispatch(setCart(cartItems));
      } else {
        // If the user is logged out, clear the cart in Redux
        dispatch(setCart([]));

        // Also remove the cart from localStorage
        localStorage.removeItem("cart");
      }
    });

    // Stop listening to auth changes when the component unmounts
    return () => unsubscribe();
  }, [auth, dispatch]);  // Run the effect only when auth or dispatch change

  // This component does not render anything
  return null;
};

// Export the component so it can be used in other files
export default AuthListener;