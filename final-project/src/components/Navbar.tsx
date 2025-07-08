import { useMemo, useState, useRef } from "react"; // Import React hooks to handle memoized values, state, and DOM references
import { Link, useNavigate } from "react-router-dom"; // Import React Router components to handle navigation
import { useSelector, useDispatch } from "react-redux"; // Import Redux hooks to read global state and dispatch actions
import { type RootState, type AppDispatch } from "../redux/store"; // Import types for global state and dispatch function
import { logoutUser } from "../redux/slices/authSlice"; // Import logout action from auth slice
import { FaShoppingCart } from "react-icons/fa"; // Import shopping cart icon
import { NavDropdown } from "react-bootstrap"; // Import Bootstrap's NavDropdown component
import "./components.css"; // Import CSS for styling the component

// Define the props type for this component (unread notifications count)
interface NavbarProps {
  unreadCount: number;
}

// Main component definition
export default function Navbar({ unreadCount }: NavbarProps) {

  // Get current user info from Redux store
  const user = useSelector((state: RootState) => state.auth.user);

  // Get items in cart from Redux store
  const cartItems = useSelector((state: RootState) => state.cart.items);

  // Calculate total items in cart using useMemo to optimize performance
  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems] // Run when cartItems changes
  );

  // Get the Redux dispatch function to send actions
  const dispatch = useDispatch<AppDispatch>();

  // Hook to navigate programmatically
  const navigate = useNavigate();

  // Local state to track logout error message
  const [logoutError, setLogoutError] = useState("");

  // Ref to the collapsible menu element (used to programmatically close it)
  const collapseRef = useRef<HTMLDivElement>(null);

  // Function to handle user logout
  const handleLogout = async () => {
    setLogoutError("");  
    try {
      // Dispatch logout and unwrap promise
      await dispatch(logoutUser()).unwrap();  
      navigate("/login");  
      closeCollapse(); 
    } catch (error) {
      console.error("Logout failed:", error);
      setLogoutError("Logout failed. Please try again.");  
    }
  };

  // Function to close the collapsible navbar (mobile view)
  const closeCollapse = () => {
    const collapseEl = collapseRef.current;
    if (collapseEl && collapseEl.classList.contains("show")) {
      collapseEl.classList.remove("show");
      collapseEl.setAttribute("aria-expanded", "false");
    }
  };

  // Call this function whenever a nav link is clicked (to close the menu)
  const handleNavLinkClick = () => {
    closeCollapse();
  };

  return (
    <nav
      className="navbar fixed-top navbar-expand-lg navbar-light shadow-sm"
      role="navigation"
    >
      <div className="container-fluid px-3">
        {/* Logo / Home Link */}
        <Link
          to="/"
          className="navbar-brand fw-bold text-primary nav-hover"
          aria-label="M.C Boutique Home"
          onClick={handleNavLinkClick}
        >
          🛍️ M.C Boutique
        </Link>

        {/* Button to toggle mobile menu */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavAltMarkup"
          aria-controls="navbarNavAltMarkup"
          aria-expanded="false"
          aria-label="Toggle navigation menu"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Collapsible menu container */}
        <div
          className="collapse navbar-collapse"
          id="navbarNavAltMarkup"
          ref={collapseRef}
        >
          <div className="navbar-nav ms-auto align-items-lg-center">
            {/* Home link */}
            <Link
              to="/"
              className="nav-link nav-hover"
              aria-current="page"
              onClick={handleNavLinkClick}
            >
              Home
            </Link>

            {/* Links shown only when user is logged in */}
            {user && (
              <>
                {/* Profile link */}
                <Link
                  to="/profile"
                  className="nav-link nav-hover"
                  onClick={handleNavLinkClick}
                >
                  Profile
                </Link>

                {/* Cart link with icon and badge */}
                <Link
                  to="/cart"
                  className="nav-link nav-hover position-relative d-inline-flex align-items-center mx-lg-2"
                  aria-label={`Cart with ${cartCount} items`}
                  style={{ minWidth: "auto" }}
                  onClick={handleNavLinkClick}
                >
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <FaShoppingCart size={18} />
                    {cartCount > 0 && (
                      <span
                        className="badge rounded-pill bg-danger"
                        style={{
                          fontSize: "0.9rem",
                          position: "absolute",
                          top: "-6px",
                          right: "-10px",
                          lineHeight: "1",
                          padding: "2px 6px",
                        }}
                      >
                        {cartCount}
                        <span className="visually-hidden">items in cart</span>
                      </span>
                    )}
                  </div>
                  <span className="ms-2 d-none d-sm-inline">Cart</span>
                </Link>

                {/* Orders link */}
                <Link
                  to="/orders"
                  className="nav-link nav-hover"
                  onClick={handleNavLinkClick}
                >
                  My Orders
                </Link>

                {/* Notifications link with badge */}
                <Link
                  to="/notifications"
                  className="nav-link nav-hover notification-link"
                  aria-label={`Notifications (${unreadCount} unread)`}
                  onClick={handleNavLinkClick}
                >
                  <div className="position-relative d-inline-flex align-items-center">
                    <span className="notification-icon" aria-hidden="true">
                      🔔
                    </span>
                    <span className="notification-text d-none d-sm-inline">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="badge rounded-pill bg-danger notification-badge">
                        {unreadCount}
                        <span className="visually-hidden">unread notifications</span>
                      </span>
                    )}
                  </div>
                </Link>
              </>
            )}

            {/* Admin dropdown shown only if user is admin */}
            {user?.role === "admin" && (
              <NavDropdown
                title="Admin"
                id="admin-dropdown"
                className="nav-hover text-danger"
              >
                <NavDropdown.Item
                  as={Link}
                  to="/admin/add-product"
                  onClick={handleNavLinkClick}
                >
                  ➕ Add Product
                </NavDropdown.Item>
                <NavDropdown.Item
                  as={Link}
                  to="/admin/manage-products"
                  onClick={handleNavLinkClick}
                >
                  🛠️ Manage Products
                </NavDropdown.Item>
                <NavDropdown.Item
                  as={Link}
                  to="/admin/orders"
                  onClick={handleNavLinkClick}
                >
                  📦 Manage Orders
                </NavDropdown.Item>
              </NavDropdown>
            )}

            {/* Show user greeting and logout if logged in */}
            {user ? (
              <>
                <span
                  className="nav-link"
                  aria-label={`Hello, ${user.name || "Admin"}`}
                >
                  Hello, {user.name || "Admin"} 👋
                </span>
                <button
                  onClick={() => {
                    handleLogout();
                    closeCollapse();
                  }}
                  className="btn btn-outline-danger btn-sm mt-2 mt-lg-0 ms-lg-2"
                  style={{
                    maxWidth: "100px",
                    fontSize: "0.85rem",
                    padding: "4px 8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Show Login and Register links if not logged in */}
                <Link
                  to="/login"
                  className="nav-link nav-hover"
                  onClick={handleNavLinkClick}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="nav-link nav-hover"
                  onClick={handleNavLinkClick}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Show logout error if exists */}
      {logoutError && (
        <div className="alert alert-danger m-3" role="alert">
          {logoutError}
        </div>
      )}
    </nav>
  );
}