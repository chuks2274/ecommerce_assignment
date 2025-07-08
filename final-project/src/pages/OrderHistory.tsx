import { useEffect, useState } from "react"; // Import React hooks for using state and running effects (e.g. when component loads)
import { useDispatch } from "react-redux"; // Import hook to trigger Redux actions
import { Link, useNavigate } from "react-router-dom"; // Import React Router tools for linking and navigation
import { type AppDispatch } from "../redux/store"; // Import type for our custom dispatch from Redux store
import { fetchOrdersByUser } from "../redux/slices/orderSlice"; // Import Redux action to fetch all orders for a specific user
import type { OrderState, Order as OrderType } from "../redux/slices/orderSlice"; // Import types for the order slice state and individual Order
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore"; // Import Firebase Firestore functions to read/write data
import { db } from "../firebase/firebaseConfig";// Import Firebase config
import "./pages.css"; // CSS styles for this page
import { useAppSelector } from "../redux/hooks"; // Import custom Redux hook to select data from the store

//Define how many orders to show on each page
const ORDERS_PER_PAGE = 9; 

// Badge styles for different order statuses
const statusBadgeClasses: Record<string, string> = {
  pending: "bg-warning text-dark",
  processing: "bg-info text-dark",
  shipped: "bg-primary",
  delivered: "bg-success",
  cancelled: "bg-danger",
  refunded: "bg-secondary",
};

// Main component to show user's order history
export default function OrderHistory() {

  // Set up dispatch function to send actions to Redux store
  const dispatch = useDispatch<AppDispatch>();

  // Navigate to another page programmatically
  const navigate = useNavigate();

  // Get the currently logged-in user from Redux store
  const user = useAppSelector((state) => state.auth.user);

  // Get the order list, loading state, and error from Redux store
  const { orders, loading, error } = useAppSelector((state) => state.order as OrderState);

  // Local state for pagination, status filter, order cancellation confirmation, and error message display
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // When component mounts (and whenever user ID changes), fetch that user's orders
  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchOrdersByUser(user.uid));
    }
  }, [dispatch, user?.uid]); // Run when the dispatch function or user ID changes

  // Apply status filter to the orders list
  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  // Calculate how many pages of orders exist
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);

  // Get the correct slice of orders for the current page
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE);

  // Function to cancel an order
  async function cancelOrder(order: OrderType) {
    try {
      const { id: orderId, userId, items } = order;
      const orderRef = doc(db, "orders", orderId);

      // Mark the order as "cancelled" in Firestore
      await updateDoc(orderRef, { status: "cancelled" });

      // Prepare a reference to the notifications collection
      const notificationsRef = collection(db, "notifications");

      // Extract product images from the order (filter out missing ones)
      const images = items
        .map((item) => item.image)
        .filter((img): img is string => !!img);

      // Add a notification for the user
      await addDoc(notificationsRef, {
        userId,
        message: `❌ Your order ${orderId} has been cancelled.`,
        status: "cancelled",
        images,
        createdAt: serverTimestamp(),
        read: false,
      });

      // Find all admin users
      const usersRef = collection(db, "users");
      const adminQuery = query(usersRef, where("role", "==", "admin"));
      const adminSnapshot = await getDocs(adminQuery);

      //  Notify each admin that the order was cancelled
      const adminNotifPromises = adminSnapshot.docs.map((adminDoc) =>
        addDoc(notificationsRef, {
          userId: adminDoc.id,
          message: `❌ Order ${orderId} by user ${userId} has been cancelled.`,
          status: "cancelled",
          images,
          createdAt: serverTimestamp(),
          read: false,
        })
      );

      await Promise.all(adminNotifPromises);
    } catch (error) {
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

  // Show error if there was a problem loading orders
  if (error) {
    return (
      <div className="container text-center mt-5">
        <p className="text-danger fw-semibold">⚠️ Failed to load orders: {error}</p>
        <button className="btn btn-outline-primary mt-2" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-5 mb-5 pb-5 custom-container">
      {/* Heading and filter dropdown */}
      <div className="mb-4 position-relative">
        <h2 className="text-center mb-4">🧾 Your Order History</h2>

        {/* Filter orders by status */}
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
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in process">In Process</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
            <option value="delivered">Delivered</option>
          </select>

          {/* Button to reset the filter */}
          {statusFilter !== "all" && (
            <button
              className="btn btn-sm btn-outline-danger mt-2 mt-md-0"
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

      {/* If no orders match the filter, show a message */}
      {filteredOrders.length === 0 ? (
        <p>No orders match the selected filter.</p>
      ) : (
        // Render orders in a grid
        <div className="order-grid">
          {currentOrders.map((order: OrderType) => {
            const orderDate = new Date(order.createdAt).toLocaleString();
            const badgeClass = statusBadgeClasses[order.status.toLowerCase()] || "bg-secondary";
            const status = order.status.toLowerCase();

            return (
              <div key={order.id} className="order-card">
                <div className="card shadow-sm h-100 order-details">
                  {/* Order info header */}
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

                  {/* Show each product in the order */}
                  <ul className="list-group list-group-flush">
                    {order.items.map((item, index) => (
                      <li
                        key={`${item.id ?? index}-${order.id}`}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          width="50"
                          height="50"
                          className="object-fit-contain me-2"
                        />
                        <div className="flex-grow-1">
                          <div className="fw-semibold">{item.title}</div>
                          <small className="text-muted">
                            ${item.price.toFixed(2)} × {item.quantity}
                          </small>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Buttons for order details and cancel */}
                  <div className="card-footer text-end bg-white">
                    <Link
                      to={`/orders/${order.id}`}
                      className="btn btn-sm btn-outline-primary me-2"
                    >
                      Details
                    </Link>

                    {/* Show cancel button for certain statuses */}
                    {(status === "pending" || status === "in process") && (
                      <>
                        {confirmCancelId === order.id ? (
                          <>
                            <span className="me-2">Confirm cancel?</span>
                            <button
                              className="btn btn-sm btn-danger me-2"
                              onClick={async () => {
                                if (!user?.uid) return;
                                try {
                                  await cancelOrder(order);  
                                  await dispatch(fetchOrdersByUser(user.uid));  
                                  setConfirmCancelId(null);
                                  setErrorMessage(null);
                                } catch {
                                  setErrorMessage("❌ Failed to cancel the order. Please try again.");
                                }
                              }}
                            >
                              Yes
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setConfirmCancelId(null);
                                setErrorMessage(null);
                              }}
                            >
                              No
                            </button>
                            {/* Show error if cancel fails */}
                            {errorMessage && confirmCancelId === order.id && (
                              <div className="text-danger mt-2 small">{errorMessage}</div>
                            )}
                          </>
                        ) : (
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

      {/* Pagination controls */}
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

      {/* Back to home button */}
      <div className="text-center mt-5">
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    </div>
  );
}