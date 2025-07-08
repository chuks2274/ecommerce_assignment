import { useState, useEffect } from "react"; // Import React hooks for state and side effects
import { useNavigate } from "react-router-dom"; // Import navigation hook to change pages programmatically
import { getAuth, sendPasswordResetEmail } from "firebase/auth"; // Import Firebase Authentication functions for password reset

// Component for "Forgot Password" email form
export default function ForgotPasswordEmail() {

// Local states for managing email input, success/error messages, loading state, and redirect countdown
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(false);

  // Get Firebase Auth instance
  const auth = getAuth();

  // Function to redirect user to another page
  const navigate = useNavigate();

  // Handler for form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();  

    // Clear previous messages
    setMessage("");
    setError("");

    // Check if email is empty or only spaces
    if (!email.trim()) {
      setError("Please enter your email.");
      return;  
    }

    // Start loading state to disable inputs
    setLoading(true);

    try {
      // Send password reset email using Firebase
      await sendPasswordResetEmail(auth, email.trim());

      // Show success message if email sent
      setMessage("Password reset email sent! Check your inbox.");

      // Start countdown to redirect user
      setRedirectCountdown(true);
    } catch (err: unknown) {
      // Handle errors from Firebase
      if (err instanceof Error) {
        setError(err.message);  
      } else {
        setError("An unexpected error occurred.");  
      }
    } finally {
      // Stop loading state (enable inputs again)
      setLoading(false);
    }
  };

  // Effect to redirect user after 5 seconds if redirectCountdown is true
  useEffect(() => {
    if (redirectCountdown) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 5000);

      // Cleanup: clear timer if component unmounts or redirectCountdown changes
      return () => clearTimeout(timer);
    }
  }, [redirectCountdown, navigate]); // Run only when redirectCountdown or navigate changes

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      {/* Form container with some styling */}
      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: "400px", width: "100%", backgroundColor: "#A3C1AD" }}
        className="p-4 border rounded shadow-sm"
      >
        {/* Form heading */}
        <h2 className="mb-4 text-center">Forgot Password</h2>

        {/* Show error alert if there is an error */}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Show success alert with countdown info */}
        {message && (
          <div className="alert alert-success">
            {message} Redirecting to login in 5 seconds...
          </div>
        )}

        {/* Email input field */}
        <div className="mb-3">
          <label htmlFor="emailInput" className="form-label">
            Email address
          </label>
          <input
            id="emailInput"
            type="email"
            className="form-control"
            placeholder="Enter your email"
            value={email}  
            onChange={(e) => setEmail(e.target.value)}  
            disabled={loading}  
            required
            autoComplete="email"
          />
        </div>

        {/* Submit button */}
        <div className="d-flex justify-content-center">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {/* Show loading text or button text */}
            {loading ? "Sending..." : "Send Reset Email"}
          </button>
        </div>
      </form>
    </div>
  );
}