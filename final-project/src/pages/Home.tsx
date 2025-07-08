import { useEffect, useState, useCallback } from "react"; // Import React hooks for side effects, state, and memoized functions
import { useAppSelector, useAppDispatch } from "../redux/hooks"; // Import Redux dispatch hook and typed selector hook
import { addToCart } from "../redux/slices/cartSlice"; // Import action creator to add items to the cart
import type { CartItem } from "../redux/slices/cartSlice"; // Import type for cart items from the cart slice
import { collection, getDocs } from "firebase/firestore"; // Import Firestore functions to read data from the database
import { db } from "../firebase/firebaseConfig"; // Import Firestore database instance
import CategorySearch from "../components/CategorySearch"; // Import component for category search filter
import ProductCard from "../components/ProductCard"; // Import component for displaying individual product cards
import { ToastContainer, toast } from "react-toastify"; // Import toast notifications components and styles
import "react-toastify/dist/ReactToastify.css"; // Import default styles for React Toastify notifications
import "./pages.css"; // Import CSS styles for pages
import type { Product } from "../types"; // Import type definition for Product


// Home component shows the product list, allows filtering, and handles adding to cart
export default function Home() {

  // Set up dispatch function to send actions to Redux store
  const dispatch = useAppDispatch();

  // Get the current logged-in user from Redux store  
  const user = useAppSelector((state) => state.auth.user);

  // Get the current cart items from Redux store 
  const cartItems = useAppSelector((state) => state.cart.items);

 // Local states for storing product data, loading status, selected category filter, and any fetch errors
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch product data from Firestore and format it
  const fetchProducts = useCallback(async () => {
    setLoading(true);  
    setError(null);    

    try {
      // Get all documents in the "products" collection
      const productsSnap = await getDocs(collection(db, "products"));

      // Map Firestore data into an array of Product objects
      const productsData: Product[] = productsSnap.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          title: data.title,
          price: data.price,
          image: data.image,
          category: data.category ?? "",
          description: data.description ?? "",
          rating: data.rating
            ? {
                rate: typeof data.rating.rate === "number" ? data.rating.rate : 0,
                count: typeof data.rating.count === "number" ? data.rating.count : 0,
              }
            : undefined,
          createdBy: data.createdBy ?? undefined,
          averageRating: undefined,      
          reviewCount: undefined,       
        };
      });

      // Save fetched products to state
      setProducts(productsData);
    } catch (err) {
      console.error("Error fetching products:", err);

      // Show a toast popup and set error state
      toast.error("Failed to load products.");
      setError("Unable to fetch products. Please try again later.");
    } finally {
      // Stop loading
      setLoading(false);
    }
  }, []); // Run only once on component mount.

  // Run fetchProducts when the component loads
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Apply category filter to product list if selected
  const filteredProducts = categoryFilter
    ? products.filter((product) => product.category === categoryFilter)
    : products;

  // When user clicks "Add to Cart"
  const handleAddToCart = (product: Product) => {
    // If user is not logged in, show warning
    if (!user) {
      toast.warning("You must be logged in to add items to your cart.");
      return;
    }

    // Check if product is already in the cart
    const alreadyInCart = cartItems.some((item) => item.id === product.id);
    if (alreadyInCart) {
      toast.info("This product is already in your cart.");
      return;
    }

    // Build the cart item to add
    const cartItem: CartItem = {
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
      category: product.category,
      rating: product.rating?.rate ?? 0,
    };

    // Dispatch the action to add item to cart
    dispatch(addToCart(cartItem));

    toast.success("Product added to cart!");
  };

  return (
    <div className="container-fluid mt-4 px-3 px-md-4 pb-5">
      {/* Toast message popup container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* Header and welcome message */}
      <div className="text-center mb-4">
        <h1 className="mb-1">Welcome to M.C Boutique</h1>
        <p className="lead text-muted">
          Your one-stop shop for the latest fashion, electronics, and lifestyle essentials.
           
        </p>
      </div>

      {/* Category filter dropdown */}
      <div className="mb-4">
        <CategorySearch onCategoryChange={setCategoryFilter} />
      </div>

      {/* Section title */}
      <h2 className="page-title mb-3">Browse Our Products</h2>

      {/* Show loading message */}
      {loading && <p className="text-center">Loading products...</p>}

      {/* Show error if fetching failed */}
      {error && <p className="text-center text-danger">{error}</p>}

      {/* Show message if no products match the filter */}
      {!loading && !error && filteredProducts.length === 0 && (
        <p className="text-center">No products match your selected category.</p>
      )}

      {/* Display the filtered products in a grid layout */}
      <div className="row g-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
            <ProductCard
              product={product}
              onAddToCart={handleAddToCart}
              disabled={!user}
            />
          </div>
        ))}
      </div>
    </div>
  );
}