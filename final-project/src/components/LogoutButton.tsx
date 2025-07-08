import { useState } from "react"; // Import useState hook to manage local component state
import { signOut } from "firebase/auth"; // Import Firebase's signOut function to log the user out
import { auth } from "../firebase/firebaseConfig"; // Import the Firebase authentication instance
import { useDispatch } from "react-redux"; // Import Redux's dispatch hook to send actions
import { setUser } from "../redux/slices/authSlice"; // Import the setUser action to update the Redux store after logout

// Define the LogoutButton component
export default function LogoutButton() {

  // Get the Redux dispatch function to send actions
  const dispatch = useDispatch();

 // Local states for handling logout loading state and error message
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define the function to handle user logout
  const handleLogout = async () => {
    setError(null);         
    setLoading(true);      

    try {
      // Call Firebase's signOut method
      await signOut(auth);  
      dispatch(setUser(null));  
    } catch (err) {
      console.error("Logout failed:", err);  
      setError("Failed to logout. Please try again.");  
    } finally {
      setLoading(false);  
    }
  };

  
  return (
    <>
      {/* Logout button */}
      <button
        type="button"
        className="btn btn-outline-danger"    
        onClick={handleLogout}               
        disabled={loading}                   
        aria-disabled={loading}             
        aria-live="polite"                  
      >
        {/* Show different text depending on loading state */}
        {loading ? "Logging out..." : "Logout"}
      </button>

      {/* Show error message if logout fails */}
      {error && (
        <div
          className="mt-2 text-danger"       
          role="alert"                       
          aria-live="assertive"              
          aria-atomic="true"                 
        >
          {error}
        </div>
      )}
    </>
  );
}