import { useEffect } from "react"; // Import useEffect hook from React for side effects
import { useNavigate } from "react-router-dom"; // Import navigate function from React Router for page navigation

// Component to show order success message and redirect user
export default function OrderSuccess() {
  
  // Function to change routes programmatically
  const navigate = useNavigate();

  // useEffect runs once after component mounts
  useEffect(() => {
    // Set a timer to redirect user after 4 seconds (4000 ms)
    const timer = setTimeout(() => {
      try {
        navigate("/");
      } catch (error) {
        console.error("Navigation error:", error);
      }
    }, 4000);

    // Cleanup function to clear the timer if the component unmounts before timeout completes
    return () => clearTimeout(timer);
  }, [navigate]); // Run only when the navigate function changes

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center text-center mt-5 p-4">
      {/* Success message with aria-live for accessibility */}
      <div className="text-success mb-3" role="status" aria-live="polite">
        <h2 className="fw-bold">✅ Order Confirmed!</h2>
        <h5 className="mb-3">
          Thank you for shopping with us! You’ll receive a confirmation shortly.
        </h5>
      </div>

      {/* Inform user about cart clearance and redirect */}
      <div className="mb-3">
        <p className="text-muted">
          Your cart has been cleared. Redirecting to the home...
        </p>
        {/* Spinner to indicate loading/waiting */}
        <div className="spinner-border text-success" role="status" aria-hidden="true" />
      </div>
    </div>
  );
}