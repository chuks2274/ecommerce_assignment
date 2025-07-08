import { useEffect, useState } from "react"; // Import React hooks for state and lifecycle management
import { useDispatch } from "react-redux"; // Import Redux hooks for dispatching actions
import { Link, useNavigate } from "react-router-dom"; // Import React Router Link and navigate hook for navigation
import { type AppDispatch } from "../redux/store"; // Import types for Redux store and dispatch
import { fetchOrdersByUser } from "../redux/slices/orderSlice"; // Import thunk action to fetch orders by user from Redux slice
import type { OrderState, Order as OrderType } from "../redux/slices/orderSlice"; // Import types for order state and individual orders
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore"; // Import Firestore functions to read and update documents
import { db } from "../firebase/firebaseConfig"; // Import Firestore database instance
import "./pages.css"; // Import custom CSS styles for the component
import { useAppSelector } from "../redux/hooks"; // Import typed selector hook for Redux

// Number of orders to show per page for pagination
const ORDERS_PER_PAGE = 9;

// Map order statuses to Bootstrap badge classes for styling
const statusBadgeClasses: Record<string, string> = {
  pending: "bg-warning text-dark",
  processing: "bg-info text-dark",
  shipped: "bg-primary",
  delivered: "bg-success",
  cancelled: "bg-danger",
  refunded: "bg-secondary",
};

// Main component for order history page
export default function OrderHistory() {
  
  // Set up dispatch function to send actions to Redux store
  const dispatch = useDispatch<AppDispatch>();

  // Function to change pages programmatically
  const navigate = useNavigate();

  // Get the current logged-in user from Redux store
  const user = useAppSelector((state) => state.auth.user);

  // Get orders, loading status, and error from order slice in Redux store 
  const { orders, loading, error } = useAppSelector(
    (state) => state.order as OrderState
  );

  // Local states for pagination page, order status filter, cancel confirmation ID, and cancellation error messages
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch user orders when user ID becomes available or when user/dispatch changes
  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchOrdersByUser(user.uid));
    }
  }, [dispatch, user?.uid]); // Run only when dispatch or user ID changes

  // Filter orders based on selected status or show all if 'all' selected
  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  // Calculate total number of pages based on orders per page
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);

  // Calculate the start index of orders for current page
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;

  // Slice the filtered orders array to get only the orders for current page
  const currentOrders = filteredOrders.slice(
    startIndex,
    startIndex + ORDERS_PER_PAGE
  );

  // Async function to cancel an order and notify user and admins
  async function cancelOrder(orderId: string, userId: string) {
    try {
      // Reference to specific order document in Firestore
      const orderRef = doc(db, "orders", orderId);

      // Update order status to "cancelled"
      await updateDoc(orderRef, { status: "cancelled" });

      // Reference to notifications collection
      const notificationsRef = collection(db, "notifications");

      // Add notification for the user about cancellation
      await addDoc(notificationsRef, {
        userId,
        message: `Your order ${orderId} has been cancelled.`,
        createdAt: serverTimestamp(),
        read: false,
      });

      // Get all admin users for notification
      const usersRef = collection(db, "users");
      const adminQuery = query(usersRef, where("role", "==", "admin"));
      const adminSnapshot = await getDocs(adminQuery);

      // Create notifications for each admin about the cancellation
      const adminNotificationsPromises = adminSnapshot.docs.map((adminDoc) =>
        addDoc(notificationsRef, {
          userId: adminDoc.id,
          message: `Order ${orderId} by user ${userId} has been cancelled.`,
          createdAt: serverTimestamp(),
          read: false,
        })
      );

      // Wait for all admin notifications to be added
      await Promise.all(adminNotificationsPromises);
    } catch (error) {
      // Log error and rethrow so caller knows cancellation failed
      console.error("Failed to cancel order:", error);
      throw error;
    }
  }

  // Show loading spinner while fetching orders
  if (loading) {
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Loading your orders...</p>
      </div>
    );
  }

  // Show error message and retry button if loading orders failed
  if (error) {
    return (
      <div className="container text-center mt-5">
        <p className="text-danger fw-semibold">⚠️ Failed to load orders: {error}</p>
        <button
          className="btn btn-outline-primary mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-5 mb-5 pb-5 custom-container">
      {/* Header section with title and filter */}
      <div className="mb-4 position-relative">
        <h2 className="text-center mb-4">🧾 Your Order History</h2>

        {/* Filter dropdown and clear filter button */}
        <div className="px-3 px-md-0 d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2">
          <label htmlFor="statusFilter" className="form-label fw-semibold mb-0">
            Filter by Status:
          </label>
          <select
            id="statusFilter"
            className="form-select"
            style={{ maxWidth: "200px", minWidth: "150px", width: "100%" }}
            value={statusFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            {/* Options for filtering orders by status */}
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in process">In Process</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
            <option value="delivered">Delivered</option>
          </select>

          {/* Show clear filter button only if a filter is active */}
          {statusFilter !== "all" && (
            <button
              className="btn btn-sm btn-outline-danger mt-2 mt-md-0 "
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Show message if no orders match the filter */}
      {filteredOrders.length === 0 ? (
        <p>No orders match the selected filter.</p>
      ) : (
        // Display list of orders for current page
        <div className="order-grid">
          {currentOrders.map((order: OrderType) => {
            // Format order date as a readable string
            const orderDate = new Date(order.createdAt).toLocaleString();

            // Determine badge class based on order status
            const badgeClass =
              statusBadgeClasses[order.status.toLowerCase()] || "bg-secondary";

            // Normalize order status string
            const status = order.status.toLowerCase();

            return (
              <div key={order.id} className="order-card">
                <div className="card shadow-sm h-100 order-details">
                  {/* Order summary in header */}
                  <div className="card-header bg-light">
                    <strong>Order ID:</strong> {order.id} <br />
                    <strong>Status:</strong>{" "}
                    <span className={`badge ${badgeClass} text-uppercase`}>
                      {order.status}
                    </span>
                    <br />
                    <strong>Date:</strong> {orderDate} <br />
                    <strong>Total:</strong> ${order.total.toFixed(2)}
                  </div>

                  {/* List of items in the order */}
                  <ul className="list-group list-group-flush">
                    {order.items.map((item, index) => (
                      <li
                        key={`${item.id ?? index}-${order.id}`} // fallback to index if item.id is undefined
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        {/* Product image */}
                        <img
                          src={item.image}
                          alt={item.title}
                          width="50"
                          height="50"
                          className="object-fit-contain me-2"
                        />
                        {/* Product title and price info */}
                        <div className="flex-grow-1">
                          <div className="fw-semibold">{item.title}</div>
                          <small className="text-muted">
                            ${item.price.toFixed(2)} × {item.quantity}
                          </small>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Footer with order details link and cancel button */}
                  <div className="card-footer text-end bg-white">
                    <Link
                      to={`/orders/${order.id}`}
                      className="btn btn-sm btn-outline-primary me-2"
                    >
                      Details
                    </Link>

                    {/* Show cancel button only if order is pending or in process */}
                    {(status === "pending" || status === "in process") && (
                      <>
                        {/* If user clicked cancel, show confirmation buttons */}
                        {confirmCancelId === order.id ? (
                          <>
                            <span className="me-2">Confirm cancel?</span>
                            <button
                              className="btn btn-sm btn-danger me-2"
                              onClick={async () => {
                                if (!user?.uid) return;
                                try {
                                  // Attempt to cancel the order
                                  await cancelOrder(order.id, user.uid);

                                  // Refresh orders after cancellation
                                  await dispatch(fetchOrdersByUser(user.uid));

                                  // Reset confirmation and error states
                                  setConfirmCancelId(null);
                                  setErrorMessage(null);
                                } catch {
                                  // Show error message if cancellation fails
                                  setErrorMessage(
                                    "❌ Failed to cancel the order. Please try again."
                                  );
                                }
                              }}
                            >
                              Yes
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                // Cancel confirmation prompt
                                setConfirmCancelId(null);
                                setErrorMessage(null);
                              }}
                            >
                              No
                            </button>

                            {/* Show error message related to cancellation */}
                            {errorMessage && confirmCancelId === order.id && (
                              <div className="text-danger mt-2 small">
                                {errorMessage}
                              </div>
                            )}
                          </>
                        ) : (
                          // Initial cancel button before confirmation
                          <button
                            className="btn btn-sm btn-outline-secondary cancel-order-btn"
                            onClick={() => setConfirmCancelId(order.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination buttons if more orders than fit on one page */}
      {filteredOrders.length > ORDERS_PER_PAGE && (
        <div className="d-flex justify-content-center align-items-center gap-3 my-4">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((prev) => prev - 1)}
            disabled={currentPage === 1}
          >
            ⬅️ Prev
          </button>

          <span className="fw-semibold">
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === totalPages}
          >
            Next ➡️
          </button>
        </div>
      )}

      {/* Button to go back to the home page */}
      <div className="text-center mt-5">
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    </div>
  );
}