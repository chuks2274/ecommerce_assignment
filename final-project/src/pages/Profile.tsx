import { useEffect, useState, useCallback } from "react"; // Import React hooks for running code on load and managing state/memoized functions
import { useAppDispatch, useAppSelector } from "../redux/hooks"; // Import Redux hooks: one to send actions, one to read state
import {
  fetchUserProfile,
  editUserProfile,
  removeUserAccount,
  clearMessages
} from "../redux/slices/userSlice"; // Import actions from the userSlice to manage user profile data
import { useAuth } from "../hooks/useAuth"; // Import custom hook to get the current logged-in Firebase user
import { useNavigate } from "react-router-dom"; // Import hook to programmatically navigate to another route

// Component for showing and editing the user's profile
export default function Profile() {

  // Set up dispatch function to send actions to Redux store
  const dispatch = useAppDispatch();

  // Function to change pages programmatically
  const navigate = useNavigate();

  // Get the current Firebase user and auth loading status
  const { currentUser, loading: authLoading } = useAuth();

  // Get current user profile and status info from the Redux store
  const { profile, loading, error, success } = useAppSelector((state) => state.user);

  // Local states to manage form input values (name and address) and display validation errors
  const [form, setForm] = useState({ name: "", address: "" });
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    address?: string;
  }>({});

  // Local state to toggle inline delete confirmation UI
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch the user profile when component mounts or currentUser changes
  useEffect(() => {
    if (currentUser?.uid) {
      dispatch(fetchUserProfile(currentUser.uid));
    }
  }, [dispatch, currentUser]); // Run when dispatch or currentUser changes

  // When profile data arrives, fill the form fields
  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name || "", address: profile.address || "" });
    }
  }, [profile]); // Run when the profile changes

  // If account is successfully deleted, redirect user to login page
  useEffect(() => {
    if (success === "Account deleted successfully.") {
      navigate("/login");
    }
  }, [success, navigate]); // Run when success status or navigate function changes

  // Function to validate form input (name and address)
  const validateForm = useCallback(() => {
    const errors: { name?: string; address?: string } = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    if (!form.address.trim() || form.address.trim().length < 5)
      errors.address = "Address must be at least 5 characters.";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  // When user types in form fields, update the state and clear related validation errors
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // When user clicks update, validate and send the update request
  const handleUpdate = () => {
    if (!loading && currentUser?.uid && validateForm()) {
      dispatch(editUserProfile({ uid: currentUser.uid, data: form }));
    }
  };

  // Dispatch user account removal when deletion is confirmed and not loading
  const confirmDelete = () => {
    if (!loading && currentUser?.uid) {
      dispatch(removeUserAccount({ uid: currentUser.uid, user: currentUser }));
    }
  };

  // Clear error/success messages when user clicks alert
  const handleClearMessages = () => {
    dispatch(clearMessages());
  };

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="container mt-4">
        <div className="d-flex align-items-center">
          <div className="spinner-border text-primary me-2"></div>
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  // If no user is logged in after auth loaded, show login prompt
  if (!currentUser) {
    return (
      <div className="container mt-4">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Wrapper to center the profile card */}
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "70vh", padding: "1rem" }}
      >
        {/* Card box for the profile */}
        <div className="shadow-sm border rounded p-4 w-100" style={{ maxWidth: "600px" }}>
          <h2 className="mb-4 text-center">User Profile</h2>

          {/* Show loading spinner */}
          {loading && (
            <div className="d-flex align-items-center mb-3">
              <div className="spinner-border text-primary me-2"></div>
              <span>Loading...</span>
            </div>
          )}

          {/* Show error alert (click to dismiss) */}
          {error && (
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
              onClick={handleClearMessages}
              style={{ cursor: "pointer" }}
            >
              {error} <small className="text-muted">(Click to dismiss)</small>
            </div>
          )}

          {/* Show success message (click to dismiss) */}
          {success && (
            <div
              className="alert alert-success alert-dismissible fade show"
              role="alert"
              onClick={handleClearMessages}
              style={{ cursor: "pointer" }}
            >
              {success} <small className="text-muted">(Click to dismiss)</small>
            </div>
          )}

          {/* Profile form for name and address */}
          <form
            onSubmit={(e) => {
              e.preventDefault(); 
              handleUpdate();      
            }}
            noValidate
          >
            {/* Name input field */}
            <div className="mb-3">
              <label htmlFor="nameInput" className="form-label">Name</label>
              <input
                id="nameInput"
                name="name"
                type="text"
                className={`form-control ${validationErrors.name ? "is-invalid" : ""}`}
                value={form.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
              {validationErrors.name && (
                <div className="invalid-feedback">{validationErrors.name}</div>
              )}
            </div>

            {/* Address input field */}
            <div className="mb-3">
              <label htmlFor="addressInput" className="form-label">Address</label>
              <textarea
                id="addressInput"
                name="address"
                className={`form-control ${validationErrors.address ? "is-invalid" : ""}`}
                value={form.address}
                onChange={handleChange}
                rows={3}
                disabled={loading}
                required
                style={{ resize: "none" }}
              />
              {validationErrors.address && (
                <div className="invalid-feedback">{validationErrors.address}</div>
              )}
            </div>

            {/* Buttons: Update and Delete */}
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  "Update"
                )}
              </button>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              ) : (
                <div className="w-100">
                  <p className="text-center mt-3">Are you sure you want to delete your account?</p>
                  <div className="d-flex justify-content-center gap-3">
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={confirmDelete}
                      disabled={loading}
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}