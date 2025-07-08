import { useEffect, useState } from "react"; // Import React hooks to handle side effects and component state
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"; // Import Firestore tools to read/write data from the database
import { db } from "../../firebase/firebaseConfig"; // Import the Firestore database configuration
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Import Firebase Authentication tools to check if user is logged in
import type { FirebaseError } from "firebase/app"; // Import Type used to handle Firebase errors in a structured way
import "../pages.css"; // Import global CSS styling for the page
import { toLocalDatetimeInputString } from "../../utils/dateUtils"; // Import Utility function to format dates

// Type for an individual product in an order
interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;  
}

// Type for a full order (used for state and props)
interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: string;
  trackingNumber: string;
  courier: string;
  estimatedDelivery: Timestamp | null;
  createdAt: Timestamp;
  total: number;
}

// Initialize Firebase Auth instance for authentication operations
const auth = getAuth();

// Main component to manage all admin order operations
export function AdminOrderManagement() {

 // Local state for orders, loading/errors, pagination, filters, saving, delete confirm, and current user
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [user, setUser] = useState<{ uid: string; isAdmin?: boolean } | null>(null);

  // Number of orders per page for pagination
  const ordersPerPage = 5;

  // Run this when component first loads
  useEffect(() => {
    // Watch for auth changes (login/logout)
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Set current user and fetch orders
        setUser({ uid: firebaseUser.uid, isAdmin: true });
        fetchOrders();
      } else {
        // No user logged in
        setUser(null);
        setLoading(false);
        setError("You must be logged in to view orders.");
      }
    });

    // Fetch all orders from Firestore and map each document to an Order object, spreading all fields except 'id' which is added separately
    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);

        const snapshot = await getDocs(collection(db, "orders"));
        const data: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Order, "id">),  
        }));

        // Sort orders by newest first (most recent createdAt first)
        setOrders(data.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));
      } catch (err) {
        const error = err as FirebaseError;
        setError("Failed to load orders.");
        console.error("Error fetching orders:", error.code, error.message);
      } finally {
        setLoading(false);
      }
    }

    // Cleanup auth listener when component unmounts
    return () => unsubscribeAuth();
  }, []); // Run only once on component mount.

  // Function to update a specific order in the database
  async function updateOrder(orderId: string, updatedFields: Partial<Order>) {
    try {
      setSavingOrderId(orderId);  
      setUpdateError(null);
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, updatedFields);

      // Update local state with new order data
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, ...updatedFields } : order
        )
      );
    } catch (error) {
      setUpdateError("Failed to update order");
      console.error("Update order error:", error);
    } finally {
      setSavingOrderId(null);
    }
  }

  // Shortcut function to update status and estimated delivery at once
  async function updateStatusAndEstimatedDelivery(
    orderId: string,
    status: string,
    estimatedDelivery: Timestamp | null
  ) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Update the order in Firestore
    await updateOrder(orderId, { status, estimatedDelivery });

    // Set notification message
    let message = "";
    const statusLower = status.toLowerCase();

    if (statusLower === "delivered") {
      message = `🎉 Your order ${orderId} has been delivered!`;
    } else if (statusLower === "refunded") {
      message = `💸 Your order ${orderId} has been refunded.`;
    } else if (estimatedDelivery) {
      // Format date nicely with time included
      const fullDateStr = new Date(estimatedDelivery.seconds * 1000).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const lastCommaIndex = fullDateStr.lastIndexOf(",");
      const datePart = fullDateStr.slice(0, lastCommaIndex);
      const timePart = fullDateStr.slice(lastCommaIndex + 1).trim();

      const dateStr = `${datePart} at ${timePart}`;

      message = `📦 Your order ${orderId} is now ${statusLower} and estimated for delivery on ${dateStr}.`;
    } else {
      message = `📦 Your order ${orderId} is now ${statusLower}.`;
    }

    // Create a new notification in Firestore
    try {
      await addDoc(collection(db, "notifications"), {
        userId: order.userId,
        message,
        createdAt: serverTimestamp(),
        read: false,
      });
    } catch (err) {
      console.error("Notification error:", err);
    }
  }

  // Delete an order from Firestore
  async function deleteOrder(orderId: string) {
    try {
      setSavingOrderId(orderId);
      const orderRef = doc(db, "orders", orderId);
      await deleteDoc(orderRef);

      // Remove order from local state
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } catch (error) {
      setUpdateError("Failed to delete order");
      console.error("Delete order error:", error);
    } finally {
      setSavingOrderId(null);
      setConfirmDeleteId(null);
    }
  }

  if (loading) return <p>Loading orders...</p>;
 
  if (error) return <p className="text-danger">{error}</p>;

  // Filter orders by selected status
  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((order) => order.status === filterStatus);

  // Calculate which orders to show for current page
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (
    <div className="admin-order-container container mt-4">
      <h2 className="mb-4 text-center">Admin Order Management</h2>

      {/* Show error if update failed */}
      {updateError && (
        <div className="alert alert-danger" role="alert">
          {updateError}
        </div>
      )}

      {/* Dropdown to filter by status */}
      <div className="mb-3">
        <h5>Filter by status</h5>
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select"
            style={{ maxWidth: "200px", minWidth: "150px" }}
            value={filterStatus}
            onChange={(e) => {
              setCurrentPage(1);
              setFilterStatus(e.target.value);
            }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in process">In Process</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>

          {/* Show "Clear Filter" button if a filter is active */}
          {filterStatus !== "all" && (
            <button
              onClick={() => setFilterStatus("all")}
              className="btn btn-outline-danger btn-sm"
              style={{ whiteSpace: "nowrap" }}
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Orders table */}
      <div className="table-responsive">
        <table className="table table-striped table-bordered admin-order-table">
          <thead className="table-dark text-center">
            <tr>
              <th>Order ID</th>
              <th>User</th>
              <th>Item Count</th>
              <th>Created At</th>
              <th>Status</th>
              <th>Estimated Delivery (Edit)</th>
              <th>Estimated Delivery (Display)</th>
              <th>Total</th>
              <th>Actions</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {/* Render each order row */}
            {currentOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td className="text-nowrap">{order.userId}</td>
                <td>{order.items.length}</td>
                <td>{new Date(order.createdAt.seconds * 1000).toLocaleString()}</td>

                {/* Status dropdown */}
                <td>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateStatusAndEstimatedDelivery(
                        order.id,
                        e.target.value,
                        order.estimatedDelivery
                      )
                    }
                    disabled={savingOrderId === order.id}
                    className="form-select form-select-sm"
                    style={{ minWidth: "130px" }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in process">In Process</option>
                    <option value="refunded">Refunded</option>
                    {user?.isAdmin && (
                      <>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </>
                    )}
                  </select>
                </td>

                {/* Estimated delivery input (editable) */}
                <td>
                  <input
                    type="datetime-local"
                    value={
                      order.estimatedDelivery
                        ? toLocalDatetimeInputString(new Date(order.estimatedDelivery.seconds * 1000))
                        : ""
                    }
                    onChange={(e) => {
                      const newDate = e.target.value
                        ? Timestamp.fromDate(new Date(e.target.value))
                        : null;

                      updateStatusAndEstimatedDelivery(order.id, order.status, newDate);
                    }}
                    disabled={savingOrderId === order.id}
                    className="form-control form-control-sm"
                  />
                </td>

                {/* Estimated delivery display */}
                <td>
                  {order.estimatedDelivery
                    ? new Date(order.estimatedDelivery.seconds * 1000).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "Not set"}
                </td>

                {/* Total cost */}
                <td>${order.total.toFixed(2)}</td>

                {/* Actions: Mark as Shipped/Delivered */}
                <td>
                  {savingOrderId === order.id && (
                    <span className="text-muted d-block mb-1">Saving...</span>
                  )}
                  <div className="d-flex flex-column gap-2">
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={savingOrderId === order.id || order.status === "shipped"}
                      onClick={() =>
                        updateStatusAndEstimatedDelivery(
                          order.id,
                          "shipped",
                          order.estimatedDelivery
                        )
                      }
                      style={{ whiteSpace: "nowrap" }}
                    >
                      Mark as Shipped
                    </button>
                    <button
                      className="btn btn-sm btn-success"
                      disabled={savingOrderId === order.id || order.status === "delivered"}
                      onClick={() =>
                        updateStatusAndEstimatedDelivery(
                          order.id,
                          "delivered",
                          order.estimatedDelivery
                        )
                      }
                      style={{ whiteSpace: "nowrap" }}
                    >
                      Mark as Delivered
                    </button>
                  </div>
                </td>

                {/* Delete order with confirmation */}
                <td className="text-center">
                  {confirmDeleteId === order.id ? (
                    <div className="d-flex flex-column gap-1">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteOrder(order.id)}
                        disabled={savingOrderId === order.id}
                      >
                        Yes, Delete
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setConfirmDeleteId(order.id)}
                      disabled={savingOrderId === order.id}
                      onMouseEnter={(e) => {
                        e.currentTarget.classList.remove("btn-outline-danger");
                        e.currentTarget.classList.add("btn-danger");
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.classList.remove("btn-danger");
                        e.currentTarget.classList.add("btn-outline-danger");
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="d-flex justify-content-center gap-3 my-3">
        <button
          className="btn btn-primary"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          ⬅️ Prev
        </button>
        <span className="align-self-center">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="btn btn-primary"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next ➡️
        </button>
      </div>
    </div>
  );
}