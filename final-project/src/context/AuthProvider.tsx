import { useEffect, useState } from "react"; // Import React hooks for lifecycle and state management
import { onAuthStateChanged } from "firebase/auth"; // Import Firebase auth listener to track user sign-in state changes
import { auth, db } from "../firebase/firebaseConfig"; // Import Firebase auth and Firestore database instances
import { useDispatch, useSelector } from "react-redux"; // Import Redux hooks for dispatching actions and selecting state slices
import { setUser, clearAuth } from "../redux/slices/authSlice"; // Import Redux actions to set or clear user authentication info
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions to get user document data
import { fetchCart, saveCart } from "../redux/slices/cartSlice"; // Import Redux actions for fetching and saving cart data
import type { RootState, AppDispatch } from "../redux/store"; // Import types for Redux store state and dispatch
import { AuthContext } from "./AuthContext"; // Import React context to provide auth loading state

// Component to provide authentication context and manage user state
export function AuthProvider({ children }: { children: React.ReactNode }) {

  // Get the Redux dispatch function to send actions
  const dispatch = useDispatch<AppDispatch>();

  // Get current user data from Redux store
  const user = useSelector((state: RootState) => state.auth.user);

  // Get current cart items from Redux store
  const cartItems = useSelector((state: RootState) => state.cart.items);
  
  // Local state to track loading status of auth check
  const [loading, setLoading] = useState(true);

  // Effect runs once on component mount to listen for auth state changes
  useEffect(() => {
    
    // Subscribe to Firebase authentication state changes (user sign-in/sign-out)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
       
        try {
           // Reference the Firestore user document using the user's UID
          const userDocRef = doc(db, "users", firebaseUser.uid);
          
          // Fetch the user document snapshot from Firestore
          const userSnap = await getDoc(userDocRef);

          if (!userSnap.exists()) {
            // If user doc not found, log error and stop loading
            console.error("User document not found in Firestore.");
            setLoading(false);
            return;
          }

          // Extract user data from the Firestore document
          const userData = userSnap.data();
          console.log("Loaded user data:", userData);

          // Dispatch Redux action to save user info in store
          dispatch(
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.name,
              role: userData.role,
            })
          );

          // Fetch user's cart data from backend/store
          await dispatch(fetchCart(firebaseUser.uid));
        } catch (err) {
          console.error("Error fetching user profile:", err);

          // Still set user with basic info if Firestore doc fails
          dispatch(
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName ?? "User",
              role: "user",
            })
          );
          // Attempt to fetch cart even if user profile failed
          await dispatch(fetchCart(firebaseUser.uid));
        }
      } else {
        // If user signed out, clear auth state from Redux store
        dispatch(clearAuth());
      }

      setLoading(false);
    });

    // Cleanup listener on unmount or auth change
    return () => unsubscribe();
  }, [dispatch]); // Run when dispatch changes

  // Effect to save cart items to backend whenever user or cart items change
  useEffect(() => {
    if (user?.uid) {

      // Dispatch action to save current cart state for logged in user
      dispatch(saveCart({ userId: user.uid, items: cartItems }));
    }
  }, [dispatch, user?.uid, cartItems]); // Runs when dispatch, user ID, or cart items change

  if (loading) return <p className="text-center mt-5">Checking login...</p>;

  // Provide loading state to children components via AuthContext
  return (
    <AuthContext.Provider value={{ loading }}>
      {children}
    </AuthContext.Provider>
  );
}