import { signInWithEmailAndPassword } from "firebase/auth"; // Import Firebase function to sign in users with email and password
import { auth, db } from "../firebase/firebaseConfig"; // Import Firebase authentication and database instances
import { doc, getDoc } from "firebase/firestore"; // Import functions to get a user document from Firestore
import { useNavigate, Link } from "react-router-dom"; // Import React Router tools for navigation and linking
import { useDispatch } from "react-redux"; // Import Redux hook to dispatch actions
import { setUser } from "../redux/slices/authSlice"; // Import action to update the user info in the Redux store
import type { UserWithRole } from "../redux/slices/authSlice"; // Import type that includes user role (e.g., "admin" or "user")
import { useState } from "react"; // Import React hook to manage component state

// Login component
export default function Login() {

  // Local state for user credentials, error message, and loading status during login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Function to change pages programmatically
  const navigate = useNavigate();

  // Set up dispatch function to send actions to Redux store
  const dispatch = useDispatch();

  // Function to handle login process
  const handleLogin = async () => {
    setErrorMessage(null);  

    // Check if both fields are filled
    if (!email.trim() || !password) {
      setErrorMessage("Both email and password are required.");
      return;
    }

    setLoading(true);  

    try {
      // Sign in using Firebase auth
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCred.user;

      // Get the user's extra profile info from Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      // If the document doesn't exist, show error
      if (!userDocSnap.exists()) {
        setErrorMessage("User profile data not found.");
        setLoading(false);
        return;
      }

      // Get the user data from Firestore
      const userData = userDocSnap.data();

      // Save the UID in localStorage so we can use it later
      localStorage.setItem("userUid", firebaseUser.uid);

      // Create a full user object including role
      const fullUser: UserWithRole = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: userData.name ?? null,
        role: userData.role ?? "user",  
      };

      // Save the user info in Redux store
      dispatch(setUser(fullUser));
      setLoading(false);  

      // Redirect based on user role
      navigate(fullUser.role === "admin" ? "/admin" : "/");
    } catch (error) {
      // Handle login errors
      if (error instanceof Error) {
        setErrorMessage("Login failed: " + error.message);
      } else {
        setErrorMessage("An unknown error occurred during login.");
      }
      setLoading(false);
    }
  };

  // JSX to render the login form
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh", padding: "1rem" }}
    >
      <div
        className="w-100 rounded shadow-sm p-4"
        style={{ maxWidth: "400px", backgroundColor: "#A3C1AD", border: "1px solid #ddd" }}
      >
        <h2 className="text-center mb-4">Login</h2>

        {/* Show error message if there is one */}
        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Email input field */}
        <div className="mb-3">
          <label htmlFor="emailInput" className="form-label">
            Email address <span className="text-danger">*</span>
          </label>
          <input
            id="emailInput"
            type="email"
            className="form-control"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}  
            disabled={loading}
            autoComplete="username"
          />
        </div>

        {/* Password input field */}
        <div className="mb-3">
          <label htmlFor="passwordInput" className="form-label">
            Password <span className="text-danger">*</span>
          </label>
          <input
            id="passwordInput"
            type="password"
            className="form-control"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}  
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        {/* Link to password reset page */}
        <div className="text-end mb-3">
          <Link to="/forgot-password-email" className="text-decoration-none">
            Forgot Password?
          </Link>
        </div>

        {/* Submit login button */}
        <div className="d-flex justify-content-center mt-3">
          <button
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={loading}
            aria-busy={loading}
          >
            {/* Show spinner while loading */}
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}