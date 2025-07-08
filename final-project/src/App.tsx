import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"; // Import React Router components for routing and navigation
// Import route guards for private and admin routes
import PrivateRoute from "./routes/PrivateRoute";
import AdminRoute from "./routes/AdminRoute";
// Import main components and pages used in the app
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import OrderHistory from "./pages/OrderHistory";
import ProductDetail from "./pages/ProductDetail";
import AdminProducts from "./pages/AdminProducts";
import ManageProductsPage from "./pages/admin/ManageProductsPage";
import AddProductPage from "./pages/admin/AddProductPage";
import OrderDetail from "./components/OrderDetail";
import OrderSuccess from "./pages/OrderSuccess";
import ReviewPage from "./pages/ReviewPage";
import Footer from "./components/Footer";
import { AdminOrderManagement } from "./pages/admin/AdminOrderManagement";
import UserNotificationPage from "./pages/UserNotificationPage";
import ForgotPasswordEmail from "./pages/ForgotPasswordEmail";
// Import custom hooks and components for app-wide features
import { useUnreadNotifications } from "./hooks/useUnreadNotifications";
import AuthListener from "./components/AuthListener";
import CartAutoSave from "./components/CartAutoSave";
import "./App.css"; // Import global CSS styles for the app

// Main App component that defines routing and layout
function App() {
  // Get the number of unread notifications for the user
  const unreadCount = useUnreadNotifications();

  return (
    // Router enables client-side routing
    <Router>
      <div className="app-container d-flex flex-column min-vh-100">
        {/* Component to listen to Firebase authentication changes */}
        <AuthListener />

        {/* Component to auto-save cart changes to Firestore */}
        <CartAutoSave />

        {/* Navbar shows at the top with unread notification count */}
        <Navbar unreadCount={unreadCount} />

        <main className="flex-grow-1 main-content" style={{ paddingTop: "70px" }}>
          {/* Define all routes in the app */}
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password-email" element={<ForgotPasswordEmail />} />
            <Route path="/reviews/:productId" element={<ReviewPage />} />

            {/* Protected routes that require user login */}
            <Route
              path="/cart"
              element={
                <PrivateRoute>
                  <Cart />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <PrivateRoute>
                  <OrderHistory />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders/:orderId"
              element={
                <PrivateRoute>
                  <OrderDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/product/:id"
              element={
                <PrivateRoute>
                  <ProductDetail />
                </PrivateRoute>
              }
            />
             
            <Route
              path="/order-success"
              element={
                <PrivateRoute>
                  <OrderSuccess />
                </PrivateRoute>
              }
            />

            {/* Other protected user routes */}
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <UserNotificationPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            {/* Redirect "/admin" to manage products page */}
            <Route path="/admin" element={<Navigate to="/admin/manage-products" replace />} />

            {/* Admin-only routes - require admin role */}
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminProducts />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/manage-products"
              element={
                <AdminRoute>
                  <ManageProductsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/add-product"
              element={
                <AdminRoute>
                  <AddProductPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <AdminOrderManagement />
                </AdminRoute>
              }
            />
          </Routes>
        </main>

        {/* Footer always at bottom of the page */}
        <Footer />
      </div>
    </Router>
  );
}

// Export App as the default export of the module
export default App;