import { useEffect, useState } from "react"; // Import React hooks for side effects and state
import { onAuthStateChanged, type User } from "firebase/auth"; // Import Firebase Auth function to listen to auth state changes and User type for typing
import { auth } from "../firebase/firebaseConfig"; // Import initialized Firebase Auth instance

// Custom React hook to track current authenticated user and loading state
export function useAuth() {
  
  // Local state for auth: user and loading status
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // useEffect to subscribe to Firebase auth state changes on component mount
  useEffect(() => {

    // Set up a listener for Firebase auth state changes and get the current user.
    const unsubscribe = onAuthStateChanged(auth, (user) => {

      // Update state with the current user info and mark loading as complete.
      setCurrentUser(user);
      setLoading(false);
    });

    // Unsubscribe from auth state changes when component unmounts.
    return unsubscribe;
  }, []); // Run only once on component mount

  // Return the current user and loading status from the hook
  return { currentUser, loading };
}