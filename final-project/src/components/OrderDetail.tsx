import { useEffect, useState } from "react"; // React hooks to manage side effects and component state
import { useNavigate, useParams } from "react-router-dom"; // React Router hooks for navigation and reading route parameters
import { doc, getDoc, deleteDoc, type DocumentData, Timestamp } from "firebase/firestore"; // Firestore functions to read and delete data, and type support
import { db } from "../firebase/firebaseConfig"; // Import Firestore database from your Firebase config
import { useAuth } from "../hooks/useAuth"; // Custom hook to get the currently logged-in user
// Components for displaying and submitting product reviews
import { ProductReviewsList } from "../components/ProductReviewsList";
import { ProductReviewForm } from "../components/ProductReviewForm";

// Type definition for a single product item in the order
interface OrderItem {
  id?: string;
  productId?: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

// Type definition for the whole order
interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: string;
  total: number;
  createdAt: Date | null;
}

// Main component to show order details
export default function OrderDetail() {

  // Get the order ID from the URL (e.g. /orders/:orderId)
  const { orderId } = useParams<{ orderId?: string }>();

  // Function to programmatically navigate to another page
  const navigate = useNavigate();

  // Get the logged-in user
  const { currentUser } = useAuth();

  // Local state for order data, loading/error messages, delete status, confirmation, and review visibility
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteStatus, setDeleteStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reviewsVisible, setReviewsVisible] = useState<Record<string, boolean>>({});

  // Fetch the order when the component loads or orderId changes
  useEffect(() => {
    // If no orderId in the URL, show error
    if (!orderId) {
      setError("No order ID provided.");
      setLoading(false);
      return;
    }

    // Async function to load order data
    async function fetchOrder() {
      setLoading(true);  
      setError("");      

      try {
        // Reference to the specific order document
        const orderDocRef = doc(db, "orders", orderId!);

        // Get the document data
        const docSnap = await getDoc(orderDocRef);

        // If order is found
        if (docSnap.exists()) {
          const data = docSnap.data() as DocumentData;

          // Convert Firestore timestamp to JS Date
          let createdAtDate: Date | null = null;
          if (data.createdAt && data.createdAt instanceof Timestamp) {
            createdAtDate = data.createdAt.toDate();
          }

          // Normalize items array to fill missing fields with defaults
          const normalizedItems: OrderItem[] = (data.items ?? []).map((item: Partial<OrderItem>) => ({
            id: item.id || item.productId || "",
            title: item.title || "",
            price: item.price || 0,
            image: item.image || "",
            quantity: item.quantity || 0,
            productId: item.productId,
          }));

          // Save order to state
          setOrder({
            id: orderId!,
            userId: data.userId,
            items: normalizedItems,
            status: data.status || "",
            total: data.total || 0,
            createdAt: createdAtDate,
          });
        } else {
          setError("Order not found.");  
        }
      } catch (err) {
        setError("Failed to load order.");  
        console.error(err);
      } finally {
        setLoading(false);  
      }
    }

    fetchOrder(); // Call the async function
  }, [orderId]); // Run when orderId changes

  // Show or hide reviews for a specific product
  const toggleReviews = (productId: string) => {
    setReviewsVisible((prev) => ({
      ...prev,
      [productId]: !prev[productId], // Toggle true/false
    }));
  };

  // Delete the current order
  const handleDelete = async () => {
    if (!orderId) return;
    try {
      // Delete order from Firestore
      await deleteDoc(doc(db, "orders", orderId));  
      setSuccessMessage("Order deleted successfully.");  
      setDeleteStatus(true);  

      // Wait 2 seconds before navigating back
      setTimeout(() => {
        navigate("/orders");
      }, 2000);
    } catch (err) {
      setError("Failed to delete order.");  
      console.error(err);
    }
  };

  // If the page is still loading, show a loading message
  if (loading) return <p>Loading order details...</p>;

  // If there's an error, show the error and back button
  if (error)
    return (
      <div>
        <p className="text-danger">{error}</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          Back to Orders
        </button>
      </div>
    );

  // If no order data exists, show a message
  if (!order) return <p>No order details to display.</p>;

  return (
    <div className="container mt-4">
      <h2>Order Details</h2>
      <p><strong>Order ID:</strong> {order.id}</p>
      <p><strong>Status:</strong> {order.status}</p>
      <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
      {order.createdAt && (
        <p><strong>Placed on:</strong> {order.createdAt.toLocaleString()}</p>
      )}

      <table className="table compact-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Price × Qty</th>
            <th>Reviews</th>
          </tr>
        </thead>
        <tbody>
          {order.items.length === 0 ? (
            // If there are no items in the order
            <tr>
              <td colSpan={4} className="text-muted text-center">
                No items found in this order.
              </td>
            </tr>
          ) : (
            // Loop through all items in the order
            order.items.map((item, idx) => {
              const productId = item.id || item.productId || "";
              const showReviews = reviewsVisible[productId] || false;

              return (
                <tr key={productId || idx}>
                  <td>
                    <img
                      src={item.image}
                      alt={item.title}
                      className="img-thumbnail"
                      style={{ width: 40, height: 40, objectFit: "contain" }}
                    />
                  </td>
                  <td>{item.title}</td>
                  <td>${item.price.toFixed(2)} × {item.quantity}</td>
                  <td>
                    {/* If user is logged in and product has an ID */}
                    {currentUser && productId ? (
                      <>
                        {/* Toggle review visibility */}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => toggleReviews(productId)}
                        >
                          {showReviews ? "Hide Reviews" : "Show Reviews"}
                        </button>

                        {/* Show review form and list if toggled */}
                        {showReviews && (
                          <div className="mt-2">
                            <ProductReviewForm
                              userId={currentUser.uid}
                              productId={productId}
                            />
                            <ProductReviewsList
                              productId={productId}
                              userId={currentUser.uid}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <p>Please log in to add a review.</p>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Show success or error messages */}
      {successMessage && (
        <div className="alert alert-success text-center">{successMessage}</div>
      )}
      {error && <div className="alert alert-danger text-center">{error}</div>}

      {/* Action buttons below table */}
      <div className="d-flex justify-content-between align-items-start mt-4">
        {/* Back button if not deleting */}
        {!deleteStatus && !confirmDelete && (
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            Back to Orders
          </button>
        )}

        {/* Delete order button */}
        {!deleteStatus && order && (
          !confirmDelete ? (
            // First step: show delete button
            <button
              className="btn btn-danger"
              onClick={() => setConfirmDelete(true)}
            >
              Delete Order
            </button>
          ) : (
            // Second step: confirm delete
            <div className="text-end ms-auto">
              <p className="text-danger mb-2">
                Are you sure you want to delete this order?
              </p>
              <div className="d-flex gap-2 justify-content-end">
                <button className="btn btn-danger" onClick={handleDelete}>
                  Yes, Delete
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}