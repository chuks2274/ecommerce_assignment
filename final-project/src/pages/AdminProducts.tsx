import React, { useEffect, useState } from "react"; // Import React and hooks for managing component state and lifecycle
import { useDispatch, useSelector } from "react-redux"; // Import Redux hooks for dispatching actions and selecting state
import { type RootState, type AppDispatch } from "../redux/store"; // Import types for the Redux store and dispatch
import {
  loadProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../redux/slices/productSlice"; // Import Redux async action creators for products
import { type Product } from "../types"; // Import the Product type for type safety

// Define a form state type like Product but make 'id' optional
interface ProductForm extends Omit<Product, "id"> {
  id?: string;
}

// Define an empty product object as initial form state
const emptyProduct: ProductForm = {
  title: "",
  price: 0,
  category: "",
  image: "",
  description: "",
};

// Function to create a product object without 'id' property
function omitId(product: Product): Omit<Product, "id"> {

  // Return a new object without the 'id' field
  return {
    title: product.title,
    price: product.price,
    category: product.category,
    image: product.image,
    description: product.description,
    createdBy: product.createdBy,
  };
}

// Main component for admin product management
export default function AdminProducts() {

  // Get the dispatch function to send Redux actions
  const dispatch = useDispatch<AppDispatch>();

  // Select the product slice state: items, loading status, and error
  const { items, loading, error } = useSelector(
    (state: RootState) => state.product
  );

 // Local states for managing the product form: current input values, edit/create mode, and validation error messages
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [editMode, setEditMode] = useState(false);
  const [formError, setFormError] = useState("");

  // Load all products when component first mounts
  useEffect(() => {
    dispatch(loadProducts());
  }, [dispatch]);

  // Handle changes in any input fields of the form
  function handleInputChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    // Update form state; convert 'price' to number, others keep as string
    setForm((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
  }

  // Validate form inputs before submission
  function validateForm() {
    if (!form.title.trim()) {
      setFormError("Title is required.");  
      return false;
    }
    if (isNaN(form.price) || form.price <= 0) {
      setFormError("Price must be a positive number.");  
      return false;
    }
    if (!form.category.trim()) {
      setFormError("Category is required.");  
      return false;
    }
    if (!form.image.trim()) {
      setFormError("Image URL is required.");  
      return false;
    }
    setFormError("");  
    return true;
  }

  // Handle form submission to create or update product
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();  

    if (!validateForm()) return;  

    // Prepare product object to save with optional id
    const productToSave: Product = {
      ...form,
      id: form.id ?? "",
    };

    if (editMode && form.id) {
      // If editing, dispatch update action
      dispatch(updateProduct(productToSave));
    } else {
      // If creating, remove 'id' and dispatch create action
      const newProduct = omitId(productToSave);
      dispatch(createProduct(newProduct));
    }

    // Reset form and exit edit mode after submit
    setForm(emptyProduct);
    setEditMode(false);
  }

  // Fill form with product data and enter edit mode
  function handleEdit(product: ProductForm) {
    setForm(product);
    setEditMode(true);
    setFormError("");  
  }

  // Confirm and delete a product by id
  function handleDelete(id?: string) {
    if (id && window.confirm("Are you sure to delete this product?")) {
      dispatch(deleteProduct(id));  
      // If currently editing the deleted product, reset form
      if (editMode && form.id === id) {
        setForm(emptyProduct);
        setEditMode(false);
        setFormError("");
      }
    }
  }

  return (
    <div className="container mt-4">
      {/* Page header */}
      <h2>Admin Product Management</h2>

      {/* Product form */}
      <form onSubmit={handleSubmit} className="mb-4">
        {/* Show form validation error if any */}
        {formError && <div className="alert alert-danger">{formError}</div>}

        {/* Title input */}
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input
            name="title"
            className="form-control"
            value={form.title}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Price input */}
        <div className="mb-3">
          <label className="form-label">Price</label>
          <input
            name="price"
            type="number"
            className="form-control"
            value={form.price}
            onChange={handleInputChange}
            required
            min={0}
            step="0.01"
          />
        </div>

        {/* Category input */}
        <div className="mb-3">
          <label className="form-label">Category</label>
          <input
            name="category"
            className="form-control"
            value={form.category}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Image URL input */}
        <div className="mb-3">
          <label className="form-label">Image URL</label>
          <input
            name="image"
            className="form-control"
            value={form.image}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Description textarea */}
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            className="form-control"
            value={form.description}
            onChange={handleInputChange}
            rows={3}
          />
        </div>

        {/* Submit button, shows different text based on edit mode */}
        <button type="submit" className="btn btn-primary me-2" disabled={loading}>
          {editMode ? "Update Product" : "Add Product"}
        </button>

        {/* Cancel button shown only in edit mode */}
        {editMode && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setForm(emptyProduct);  
              setEditMode(false);     
              setFormError("");       
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {loading && <p>Loading products...</p>}

      {error && <p className="text-danger">{error}</p>}

      {/* Products table */}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Category</th>
            <th>Image</th>
            <th>Description</th>
            <th style={{ width: 150 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Map over products and show each as a table row */}
          {items.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>${p.price.toFixed(2)}</td>
              <td>{p.category}</td>
              <td>
                {/* Show product image as small thumbnail */}
                <img
                  src={p.image}
                  alt={p.title}
                  style={{ width: 50, height: 50, objectFit: "cover" }}
                />
              </td>
              <td>{p.description}</td>
              <td>
                {/* Edit button fills form with product data */}
                <button
                  className="btn btn-sm btn-warning me-2"
                  onClick={() => handleEdit(p)}
                >
                  Edit
                </button>
                {/* Delete button removes product */}
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(p.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}