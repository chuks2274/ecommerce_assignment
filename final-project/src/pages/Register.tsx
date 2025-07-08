import { useState } from "react"; // Import React hook for component state management
import { useNavigate } from "react-router-dom"; // Import navigation hook to programmatically redirect user
import { useDispatch } from "react-redux"; // Import Redux hook to dispatch actions
import { setUser } from "../redux/slices/authSlice"; // Import Redux action to set authenticated user in the store
import { auth, db } from "../firebase/firebaseConfig"; // Import Firebase auth and database configuration
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"; // Import Firebase auth functions to create users and update profiles
import { doc, setDoc, serverTimestamp } from "firebase/firestore"; // Import Firestore functions to set documents and timestamps

// Async function to register a new user in Firebase and Firestore
async function registerUser(
  email: string,
  password: string,
  name: string,
  address: string,
  role: "user" | "admin"
) {
  // Create user with email and password in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // Update user profile displayName with the provided name
  await updateProfile(firebaseUser, { displayName: name });

  // Create a Firestore document for the user with additional info
  await setDoc(doc(db, "users", firebaseUser.uid), {
    name,
    email,
    address,
    role,
    createdAt: serverTimestamp(),  
  });

  // Return the user object including their role
  return { ...firebaseUser, role };
}

// Main Register component for user registration form
export default function Register() {

 // Local states for managing form input values (name, email, password, address, role), handling errors, showing loading state during registration, and displaying success toast
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Function to change pages programmatically
  const navigate = useNavigate();

  // Set up dispatch function to send actions to Redux store
  const dispatch = useDispatch();

  // Handle the registration process on form submission
  const handleRegister = async () => {
    setErrorMessage(null);

    // Validate that all required fields are filled
    if (!name || !email || !password || !address) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    // Password validation regex: 6-8 characters, letters and numbers only, no spaces not only numbers
    const passwordRegex = /^(?=.*[A-Za-z])([A-Za-z0-9]{6,8})$/;
    if (!passwordRegex.test(password)) {
      setErrorMessage(
        "Password must be 6-8 characters, no spaces, only letters and numbers, and cannot be only numbers."
      );
      return;
    }

    try {
      setLoading(true);
      // Register user in Firebase Auth and Firestore
      const firebaseUser = await registerUser(email, password, name, address, role);

      // Update Redux store with user info
      dispatch(
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name,
          role,
        })
      );

      // Show success toast notification and after 2.5 seconds, navigate to home page
      setShowSuccessToast(true);
      setTimeout(() => navigate("/"), 2500);
    } catch (error) {
      const message =
        error instanceof Error
          ? `Registration failed: ${error.message}`
          : "An unknown error occurred.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Center form vertically and horizontally */}
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="container p-4 border rounded shadow-sm" style={{ maxWidth: "500px" }}>
          <h2 className="text-center mb-4">Create Account</h2>

          {/* Show error alert if there's an error */}
          {errorMessage && <div className="alert alert-danger py-2">{errorMessage}</div>}

          {/* Name input field */}
          <div className="mb-3">
            <label className="form-label">Name <span className="text-danger">*</span></label>
            <input
              className="form-control"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          {/* Email input field */}
          <div className="mb-3">
            <label className="form-label">Email <span className="text-danger">*</span></label>
            <input
              className="form-control"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {/* Password input field */}
          <div className="mb-3">
            <label className="form-label">Password <span className="text-danger">*</span></label>
            <input
              className="form-control"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {/* Address input field */}
          <div className="mb-3">
            <label className="form-label">Address <span className="text-danger">*</span></label>
            <input
              className="form-control"
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Role dropdown selector */}
          <div className="mb-4">
            <label className="form-label">Role <span className="text-danger">*</span></label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value as "user" | "admin")}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {/* Note about role selection */}
            <p className="text-muted small mt-1">
              <span className="text-danger">*</span>Role selection is for demo purposes only. In real apps,
              roles should be assigned securely by the backend.<span className="text-danger">*</span>
            </p>
          </div>

          {/* Submit button */}
          <div className="d-flex justify-content-center">
            <button
              className="btn btn-primary"
              onClick={handleRegister}
              disabled={loading}
            >
              {/* Show spinner if loading */}
              {loading && (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
              )}
              {/* Button text changes based on loading state */}
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </div>
      </div>

      {/* Bootstrap Toast for success message */}
      <div
        className={`toast-container position-fixed bottom-0 end-0 p-3`}
        style={{ zIndex: 1055 }}
      >
        <div
          className={`toast align-items-center text-white bg-success border-0 ${
            showSuccessToast ? "show" : "hide"
          }`}
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body">🎉 Registration successful!</div>
            {/* Button to close the toast */}
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              onClick={() => setShowSuccessToast(false)}
              aria-label="Close"
            ></button>
          </div>
        </div>
      </div>
    </>
  );
}