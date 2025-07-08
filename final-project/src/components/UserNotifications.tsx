import { useEffect, useState } from "react"; // Import React hooks for managing side effects and state
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore"; // Import Firestore functions to query, listen, order, and delete documents
import { db } from "../firebase/firebaseConfig"; // Import Firestore database configuration
import { useAuth } from "../hooks/useAuth"; // Import custom hook to get currently logged-in user
import type { Notification } from "../types/notificationTypes"; // Import Notification type definition
import { markNotificationAsRead } from "../firebase/services/notificationService"; // Import service to mark a notification as read
import { useNavigate } from "react-router-dom"; // For navigation
import "./components.css"; // Import CSS styles for components

// Defines the UserNotifications component
export default function UserNotifications() {

  // Local states: notifications list, error message, and current pagination page
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Get the currently logged-in user from custom auth hook
  const { currentUser } = useAuth();

  // Function to programmatically navigate between routes
  const navigate = useNavigate();

  // Define how many notifications to show per page
  const itemsPerPage = 8;

  // Run this effect when the component mounts or when currentUser changes
  useEffect(() => {
    if (!currentUser) return;

    try {
      // Create a Firestore query: get notifications for current user, ordered by newest first
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );

      // Listen to real-time updates from Firestore
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          // Map Firestore documents into Notification objects with IDs
          const notifs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Notification, "id">), // get all other data except id
          }));

          // Update the state with fetched notifications
          setNotifications(notifs);
          setError(null);
          setCurrentPage(1);
        },
        (err) => {
          console.error("Error fetching notifications:", err);
          setError("Failed to load notifications.");
        }
      );

      // Clean up the listener when component unmounts or currentUser changes
      return () => unsubscribe();
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong.");
    }
  }, [currentUser]); // Run when currentUser changes

  // Function to delete a notification by its ID
  async function handleDelete(id: string) {
    try {
      // Remove the notification from Firestore
      await deleteDoc(doc(db, "notifications", id));

      setError(null);
    } catch (err) {
      console.error("Error deleting notification:", err);
      setError("Failed to delete notification. Please try again.");
    }
  }

  // If no user is logged in, don’t show anything
  if (!currentUser) return null;

  // Calculate total number of pages based on notifications count and items per page
  const totalPages = Math.ceil(notifications.length / itemsPerPage);

  // Calculate the starting index of the notifications to show for the current page
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Slice the notifications array to get only those that should be shown on the current page
  const currentNotifications = notifications.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="container mt-4">
      {/* Page heading */}
      <h4 className="notification-heading">📬 Notifications</h4>

      {/* Show an error message if something went wrong */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* List of notifications */}
      <ul className="list-group">
        {/* Loop through and show each notification */}
        {currentNotifications.map((notif) => (
          <li
            key={notif.id} // unique key for each list item
            className={`list-group-item d-flex justify-content-between align-items-start ${
              notif.read ? "" : "bg-light"
            }`}
            style={{
              fontWeight: notif.read ? "normal" : "bold",
              cursor: "pointer",
            }}
            onClick={() => {
              // Mark as read if not already
              if (!notif.read && notif.id) {
                markNotificationAsRead(notif.id);
              }
            }}
          >
            {/* Left side: image(s) + message + timestamp */}
            <div className="me-auto d-flex flex-column">
              {/* Multiple images */}
              {(notif.images && notif.images.length > 0
                ? notif.images
                : notif.image
                ? [notif.image]
                : []
              ).length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  {(notif.images && notif.images.length > 0
                    ? notif.images
                    : notif.image
                    ? [notif.image]
                    : []
                  ).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Product ${i + 1}`}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Message */}
              <div>{notif.message}</div>

              {/* Timestamp */}
              <small className="text-muted">
                {notif.createdAt
                  ? new Date(notif.createdAt.seconds * 1000).toLocaleString()
                  : ""}
              </small>
            </div>

            {/* Delete button */}
            <button
              className="btn btn-sm btn-outline-danger notif-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(notif.id);
              }}
              title="Delete notification"
            >
              ❌
            </button>
          </li>
        ))}
      </ul>

      {/* Pagination controls if more than one page */}
      {totalPages > 1 && (
        <div className="mt-3 d-flex justify-content-center">
          <div className="d-flex align-items-center gap-3">
            {/* Previous page button */}
            <button
              className="btn btn-primary"
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
            >
              ⬅️ Prev
            </button>

            {/* Page number display */}
            <span className="fw-semibold">
              Page {currentPage} of {totalPages}
            </span>

            {/* Next page button */}
            <button
              className="btn btn-primary"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage >= totalPages}
            >
              Next ➡️
            </button>
          </div>
        </div>
      )}

      {/* Back to home button */}
      <div className="mt-4 d-flex justify-content-center">
        <button className="btn btn-primary mb-4" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    </div>
  );
}