import { useEffect, useState, useCallback, useRef } from "react"; // Import state, side effects, memoization, and references
import {
  doc,
  deleteDoc,
  updateDoc,
  QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"; // Import Firestore functions for database operations
import { db } from "../../firebase/firebaseConfig"; // Import the Firestore database configuration
import { Button, Modal, Form, Spinner, Alert } from "react-bootstrap"; // Import Bootstrap components for UI
import { fetchProductsByPage, type Product } from "../../services/fetchProductsByPage"; // Import a function to fetch products by page and its type

// Main component that displays, edits, deletes, and paginates products
export default function ManageProductsPage() {
 
  // Local state for product list, loading status, and error handling
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep track of the start document for each page to enable Firestore pagination
  const pageStartDocsRef = useRef<QueryDocumentSnapshot<DocumentData>[]>([]);

   // Local state for pagination, delete confirmation, loading states, and editing modal handling
  const [currentPage, setCurrentPage] = useState(0);  
  const [hasNextPage, setHasNextPage] = useState(false);  
  const [deletingId, setDeletingId] = useState<string | null>(null);  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);  
  const [showEditModal, setShowEditModal] = useState(false); 
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);  

  // Function to load a specific page of products
  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(page);  
      fetchProductsByPage(
        page,
        pageStartDocsRef,
        setProducts,
        setHasNextPage,
        setLoading,
        setError
      );  
    },
    // Dependency array with stable state setter functions (safe to include)
    [setProducts, setHasNextPage, setLoading, setError]
  );

  // Load first page when component mounts
  useEffect(() => {
    goToPage(0);
  }, [goToPage]);

  // Function to delete a product
  const handleDelete = async (id: string) => {
    setDeletingId(id);  
    setError(null);  
    try {
      await deleteDoc(doc(db, "products", id)); // Delete from Firestore

     // If only one product remains on a non-first page, go back one page; otherwise, reload current page
       if (products.length === 1 && currentPage > 0) {
        pageStartDocsRef.current.splice(currentPage, 1);  
        goToPage(currentPage - 1);  
      } else {
        goToPage(currentPage);  
      }

      setConfirmDeleteId(null);  
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete product. Please try again.");  
    } finally {
      setDeletingId(null);  
    }
  };

  // Function to update product data
  const handleUpdate = async () => {
    if (!editingProduct) return;

    // Validate input fields before sending update
    if (!editingProduct.title.trim()) {
      setError("Title cannot be empty.");
      return;
    }
    if (editingProduct.price < 0) {
      setError("Price cannot be negative.");
      return;
    }
    if (!editingProduct.image.trim()) {
      setError("Image URL cannot be empty.");
      return;
    }
    if (!editingProduct.category.trim()) {
      setError("Category cannot be empty.");
      return;
    }

    setLoading(true);  
    setError(null);  
    try {
      // Update product in Firestore
      await updateDoc(doc(db, "products", editingProduct.id), {
        title: editingProduct.title.trim(),
        description: editingProduct.description?.trim() ?? "",
        price: editingProduct.price,
        image: editingProduct.image.trim(),
        category: editingProduct.category.trim(),
        rating: {
          rate: editingProduct.rating?.rate ?? 0,
          count: editingProduct.rating?.count ?? 0,
        },
      });

      setShowEditModal(false);  
      goToPage(currentPage);  
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to update product. Please try again.");
    } finally {
      setLoading(false);  
    }
  };

  // Open edit modal and load selected product
  const openModal = (product: Product) => {
    setEditingProduct({ ...product }); // Clone product
    setError(null);
    setShowEditModal(true);  
  };

  // Close modal and reset state
  const closeModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    setError(null);
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Manage Products</h2>

      {/* Show error alert if there's any */}
      {error && (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
          dismissible
          className="mb-3"
        >
          {error}
        </Alert>
      )}

      {/* Show loading spinner while fetching */}
      {loading && !products.length ? (
        <div className="d-flex justify-content-center my-5">
          <Spinner animation="border" role="status" />
        </div>
      ) : products.length === 0 ? (
        // No products found
        <p className="text-center text-muted">No products found.</p>
      ) : (
        <>
          {/* Table of products */}
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Image</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => (
                  <tr key={prod.id}>
                    <td>{prod.title}</td>
                    <td style={{ maxWidth: "300px", whiteSpace: "normal", color: "#555", fontSize: "0.9rem" }}>
                      {prod.description || "—"}
                    </td>
                    <td>${prod.price.toFixed(2)}</td>
                    <td>{prod.category}</td>
                    <td>
                      <img src={prod.image} alt={prod.title} height={50} style={{ objectFit: "contain" }} />
                    </td>
                    <td>
                      {prod.rating && prod.rating.rate > 0
                        ? `${prod.rating.rate.toFixed(1)} (${prod.rating.count})`
                        : "N/A"}
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-2">
                        {/* Edit Button */}
                        <Button
                          variant="primary"
                          size="sm"
                          className="py-0 px-1"
                          onClick={() => openModal(prod)}
                          disabled={loading}
                        >
                          Edit
                        </Button>

                        {/* Delete confirmation */}
                        {confirmDeleteId === prod.id ? (
                          <>
                            <div className="text-danger small">Confirm delete?</div>
                            <div className="d-flex gap-2">
                              <Button
                                variant="danger"
                                size="sm"
                                className="py-0 px-1"
                                onClick={() => handleDelete(prod.id)}
                                disabled={deletingId === prod.id || loading}
                              >
                                {deletingId === prod.id ? (
                                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                ) : (
                                  "Yes"
                                )}
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="py-0 px-1"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </>
                        ) : (
                          // Show delete button if not confirming
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="py-0 px-1"
                            onClick={() => setConfirmDeleteId(prod.id)}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination buttons */}
          <div className="d-flex justify-content-center align-items-center gap-2 my-4 flex-wrap">
            <Button
              className="me-2"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0 || loading}
              variant="primary"
            >
              ⬅️ Prev
            </Button>

            <Button variant="secondary" disabled>
              Page {currentPage + 1}
            </Button>

            <Button
              className="ms-2"
              onClick={() => goToPage(currentPage + 1)}
              disabled={!hasNextPage || loading}
              variant="primary"
            >
              Next ➡️
            </Button>
          </div>
        </>
      )}

      {/* Modal for editing product */}
      <Modal show={showEditModal} onHide={closeModal} centered contentClassName="custom-modal-content">
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>

        {editingProduct && (
          <Modal.Body>
            <Form>
              {/* Title Field */}
              <Form.Group className="mb-3" controlId="editProductTitle">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  autoFocus
                  required
                  maxLength={100}
                />
              </Form.Group>

              {/* Description Field */}
              <Form.Group className="mb-3" controlId="editProductDescription">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  maxLength={1000}
                  style={{ resize: "none" }}
                />
              </Form.Group>

              {/* Price Field */}
              <Form.Group className="mb-3" controlId="editProductPrice">
                <Form.Label>Price</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step="0.01"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  required
                />
              </Form.Group>

              {/* Image Field */}
              <Form.Group className="mb-3" controlId="editProductImage">
                <Form.Label>Image URL</Form.Label>
                <Form.Control
                  type="url"
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  required
                />
              </Form.Group>

              {/* Category Field */}
              <Form.Group className="mb-3" controlId="editProductCategory">
                <Form.Label>Category</Form.Label>
                <Form.Control
                  type="text"
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  required
                  maxLength={50}
                />
              </Form.Group>

              {/* Rating Rate */}
              <Form.Group className="mb-3" controlId="editProductRatingRate">
                <Form.Label>Rating (0 to 5)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.1"
                  min={0}
                  max={5}
                  value={editingProduct.rating?.rate ?? 0}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      rating: {
                        count: editingProduct.rating?.count ?? 0,
                        rate: Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)),
                      },
                    })
                  }
                />
              </Form.Group>

              {/* Rating Count */}
              <Form.Group className="mb-3" controlId="editProductRatingCount">
                <Form.Label>Rating Count</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  value={editingProduct.rating?.count ?? 0}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      rating: {
                        rate: editingProduct.rating?.rate ?? 0,
                        count: Math.max(0, parseInt(e.target.value) || 0),
                      },
                    })
                  }
                />
              </Form.Group>
            </Form>
          </Modal.Body>
        )}

        {/* Modal footer with action buttons */}
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal} disabled={loading}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleUpdate} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" role="status" aria-hidden="true" /> Updating...
              </>
            ) : (
              "Update Product"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}