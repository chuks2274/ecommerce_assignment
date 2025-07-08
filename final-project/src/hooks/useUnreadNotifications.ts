import { useEffect, useState, useRef } from "react"; // Import React hooks: useEffect, useState, useRef
import { collection, query, where, onSnapshot } from "firebase/firestore"; // Import Firestore functions for queries and realtime updates
import { db } from "../firebase/firebaseConfig"; // Import initialized Firestore database instance
import { useAuth } from "./useAuth"; // Import custom hook to get current authenticated user

// Custom hook to get the count of unread notifications for current user
export function useUnreadNotifications() {
   
  // Local state and context: get current user and track unread notifications count
  const { currentUser } = useAuth();  
  const [unreadCount, setUnreadCount] = useState(0);  
 
  // Ref to store debounce timer
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);  

  // Set up Firestore listener to update unread notification count whenever currentUser changes.
  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);  
      return;  
    }

    // Create a Firestore query to get unread notifications for the current user.
    const q = query(
      collection(db, "notifications"),  
      where("userId", "==", currentUser.uid),  
      where("read", "==", false)  
    );

    // Subscribe to real-time updates for this query
    const unsubscribe = onSnapshot(q, (snapshot) => {
      
      // If a debounce timer exists, clear it
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

      // Set a new debounce timer to update unread count after 300ms delay
      debounceTimeout.current = setTimeout(() => {
        setUnreadCount(snapshot.size);  
      }, 300);
    });

    // Cleanup function to clear timer and unsubscribe listener when component unmounts or currentUser changes
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      unsubscribe();
    };
  }, [currentUser]); // Run when currentUser changes

  // Return the current count of unread notifications
  return unreadCount;
}