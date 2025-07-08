# E-commerce App Project
Note: Firestore security rules are crucial for properly using or testing this app. I’ve included the rules from lines 513 to 634—simply copy, paste, and publish them in your Firebase console to ensure secure and accurate functionality.

Select Role During Registration
Admin: Register as an Admin to post and manage your products.
User: Register as a User to explore the shopping experience and other app functionalities.
This role selection determines what features you’ll be able to access within the app.
Role selection is for demo purposes only. In real apps, roles should be assigned securely by the backend.

## submitReview.ts
### What This File Does
Checks if the product exists in the Firestore database.
Calculates the new average rating based on existing ratings.
Creates a new review document with the user’s comment and rating.
Updates the product’s rating stats (average rating and review count).

## AuthListener.tsx
### What This File Does
Detects when a user logs in or logs out using Firebase Authentication.
If the user logs in:
Fetches the user's cart from Firestore via a Redux action.
Stores the cart items in the Redux store.
If the user logs out:
Clears the cart from Redux state.
Removes cart data from `localStorage`.
This ensures that the cart state is always in sync with the authenticated user's session.

## CartAutoSave.tsx
### What This File Does
Watches the cart (`items`) and user ID (`userId`) from the Redux store.
Automatically saves the cart to the backend (e.g., Firestore) whenever the user changes cart contents or logs in.
Does nothing if the user is not logged in.
Works silently in the background — no visible UI is rendered.

## CategorySearch.tsx
### What This File Does
Fetches product categories from Firebase on initial render.
Displays a dropdown menu of categories (plus an "All" option).
Calls a provided `onCategoryChange()` function when a category is selected.
Includes a "Clear Filter" button to reset the filter back to "All".
Shows a loading spinner while fetching data.
Displays an error message if fetching fails.

## Checkout.tsx
### What This File Does
Places an order when the user clicks the "Place Order" button.
Requires user login to proceed with checkout.
Creates an order document in Firestore with items, total amount, and a pending status.
Sends notifications:
To the user: confirming the order.
To all admins: informing them of the new order.
Clears the Redux cart and redirects the user to the `/orders` page.
Displays success or error messages based on result.

## Footer.tsx
### What This File Does
Dynamically shows the current year using JavaScript's `Date` object.
Optimized with `React.memo` to prevent unnecessary re-renders.

## LogoutButton.tsx
### What This File Does
Logs the user out using Firebase's `signOut()` method.
Updates the global Redux auth state by dispatching `setUser(null)`.
Displays an error message if logout fails.
Shows a loading state while logout is in progress.

## Navbar.tsx
### What This File Does
Cart icon with real-time badge showing item count
Notifications link with unread count
User authentication support
Logged-in users see Profile, Orders, Notifications, and Logout
Guests see Login and Register links
Admin dropdown for managing products and orders
Responsive collapsible mobile nav
Logout functionality using Redux and Firebase
Accessible: includes ARIA attributes for better screen reader support

## OrderDetail.tsx
### What This File Does
View full order info including:
Order ID, status, creation date, estimated delivery
Item list with:
Product image, title, price, quantity
Review form (`ProductReviewForm`)
Reviews display (`ProductReviewsList`)
Delete order (if owned by the logged-in user)
Loading state
Error handling
Navigation using React Router
Authentication-aware (user must be logged in to delete or review)

## ProductCard.tsx
### What This File Does
Displays product image with fallback placeholder if image fails to load.
Shows product title, price, and description.
Renders star rating visually using filled and empty stars with accessible labels.
Displays total number of reviews.
Includes an Add to Cart button, with optional disabling.
Includes a View Review button to navigate to the product’s reviews page.
Accessible with appropriate ARIA labels.
Uses React hooks like `useMemo` and `useCallback` for performance optimizations.

## ProductDetail.tsx
### What This File Does
Fetches and displays product data from Firestore.
Real-time subscription to product reviews with live updates.
Shows average star rating and total review count.
Allows logged-in users to submit a new star rating and text review.
Prevents users from submitting multiple reviews per product.
Enables users to delete their own reviews.
Handles loading states, errors, and input validation.
Uses Firestore's `Timestamp` for date management.
Responsive and accessible UI with Bootstrap styling.
Uses a reusable `StarRating` component for visual ratings.

## ProductFilter.tsx
### What This File Does
Displays a dropdown menu populated with product categories.
Allows the user to select a category to filter products.
Provides a "Clear Filter" button to reset the selection.
Supports accessibility with appropriate labels and ARIA attributes.
Responsive styling with Bootstrap classes.
Handles errors gracefully during selection and clearing actions.

## ProductReviewForm.tsx
### What This File Does
Displays a star rating input (1 to 5 stars) using a `StarRating` component.
Provides a textarea for writing a comment.
Validates the rating and comment before submission.
Checks Firestore if the current user has already reviewed the product.
Shows success or error messages based on submission status.
Disables the form inputs while submitting.
Prevents multiple reviews by the same user on the same product.

## ProductReviewsList.tsx
### What This File Does
Fetches reviews for a specified product from Firestore.
Listens to real-time updates to reviews.
Displays star rating, comment, and creation date for each review.
Allows logged-in users to delete their own reviews with confirmation.
Handles loading and error states gracefully.

## StarRating.tsx
### What This File Does
Displays up to 5 stars representing the rating value.
Supports half stars for fractional ratings.
Optional editable mode allowing users to set a rating by click or keyboard.
Shows the number of reviews or a fallback message if none.
Accessible via keyboard and screen readers.
Memoized for performance to prevent unnecessary re-renders.

## UserNotifications.tsx
### What This File Does
Real-time updates of user notifications from Firestore.
Displays notifications with message and formatted timestamp.
Highlights unread notifications visually.
Allows marking notifications as read by clicking on them.
Allows deleting individual notifications.
Handles errors gracefully and displays error messages.
Automatically updates when the logged-in user changes.
Uses a custom auth hook to get current user info.

## AuthContext.ts
### What This File Does
Uses React's `createContext` to create a context for authentication state.
Holds an object with a single property: `loading` (boolean).
Default value for `loading` is `true`, indicating the authentication status is initially loading.
Exporting only the context (without a provider or consumer here) helps avoid Fast Refresh issues during React development.

## AuthProvider.tsx
### What This File Does
Listens for Firebase authentication state changes (`onAuthStateChanged`).
Fetches user profile data from Firestore upon sign-in.
Dispatches Redux actions to store user info and fetch cart data.
Saves updated cart data whenever the cart or user changes.
Provides an authentication loading state via `AuthContext`.
Shows a loading message while authentication status is being determined.
Handles cleanup of Firebase listeners on unmount.

## notificationService.ts
### What This File Does
Authenticates the current user using Firebase Auth.
Creates a document reference to the target notification in the "notifications" Firestore collection.
Updates the read field of the specified document to true.

## orderService.ts
### What This File Does
Adds a new document to the Firestore "orders" collection with user-specific data.
Automatically generates a notification in the "notifications" collection.
Utilizes Firebase timestamps and default status handling.
Provides strong typing with TypeScript interfaces for better maintainability.

## firebaseConfig.ts
### What This File Does
To initialize Firebase app and export the auth and db instances for use throughout the project.
Firebase Authentication – for handling user sign-in, sign-up, and auth state.
Firestore Database – for storing and retrieving structured data.

## notificationService.ts
### What This File Does
Sends a notification to the currently authenticated user.
Stores the notification in the Firestore notifications collection.

## productService.ts
### What This File Does
Adds a new product document to the products collection in Firestore.
Fetches all products stored in the Firestore products collection.
Fetches and returns a list of unique, lowercase product categories.

## userService.ts
### What This File Does
Retrieve a user profile by UID
Create a new user profile
Update user profile fields (name, address)
Delete both the Firestore profile and Firebase Auth user

## useAuth.ts
### What This File Does
Subscribes to Firebase Authentication state changes using onAuthStateChanged.
Updates local state with the authenticated user (User) or null.
Tracks whether the auth state is still being resolved (loading).

## useUnreadNotifications.ts
### What This File Does
Uses Firebase Firestore to query the notifications collection.
Filters notifications where:
userId matches the current user’s UID.
read is false.
Sets up a real-time listener with onSnapshot to monitor updates.
Applies a 300ms debounce to reduce frequent UI updates.
Automatically cleans up listeners and timers on unmount or user switch.

## AddProductPage.tsx
### What This File Does
Client-side input validation
Admin-only access check 
Form input with rating fields
Loading state during submission
Success message on completion
Error display for failed or invalid submissions
Auto-redirect to /admin/manage-products after submission

## AdminOrderManagement.tsx
### What This File Does
Admin-only view via Firebase Auth
Fetch and display all orders from Firestore
Update order status and estimated delivery
Realtime-like interaction with update feedback
Filter by order status
Pagination for better data handling
Secure order deletion with confirmation
Auto-notification to users on status update

## ManageProductsPage.tsx
### What This File Does
Fetching products with Firestore pagination
Editing product details (title, description, price, image URL, category, rating)
Deleting products with confirmation
Responsive UI with React Bootstrap components
Error handling and loading states

## AdminProducts.tsx
### What This File Does
Load and display product list from Redux store
Add new products with a form
Edit existing products inline via the same form
Delete products with confirmation prompt
Form input validation with user feedback
Responsive UI with Bootstrap styles

## Cart.tsx
### What This File Does
View items in their cart
Adjust item quantities or remove items
Place an order if logged in
Receive visual feedback during order confirmation
Generate order and notification documents in Firestore
Notify both the user and all admins of the order status

## CartPage.tsx
### What This File Does
Displays all items currently in the user's cart.
Calculates and shows the total order price.
Allows users to submit their cart as an order.
Handles basic validation (e.g., user must be logged in, cart must not be empty).
Shows success or error messages based on the result of the order submission.

## ForgotPasswordEmail.tsx
### What This File Does
Provides a form for users to enter their email address.
Uses Firebase Auth to send a password reset email.
Displays success or error messages based on the result.
Automatically redirects users to the login page 5 seconds after a successful request.

## Home.tsx
### What This File Does
Fetches product data from Firestore (products collection).
Displays products in a responsive grid layout using Bootstrap.
Supports product filtering by category.
Integrates with Redux to manage cart state and user auth.
Provides user-friendly toast notifications for actions like adding to cart or error states.

## Login.tsx
### What This File Does
Email & password authentication via Firebase Auth
Firestore lookup for extended user profile (name, role)
Role-based navigation (e.g., admin → /admin)
Redux integration with setUser action
Loading and error state handling
Client-side form validation
Forgot Password redirect

## OrderHistory.tsx 
### What This File Does
Fetches user orders from Firestore using Redux fetchOrdersByUser
Filter orders by status: all, pending, processing, cancelled, delivered
Paginate results (5 orders per page)
Cancel order with confirmation prompt
Sends notification to user and admins on cancellation
Shows order details like date, total, and line items
Navigates to detailed order view (/orders/:id)
Navigation back to home

## OrderSuccess.tsx
### What This File Does
Displays a success message confirming the order
Informs the user that their cart has been cleared
Shows a loading spinner during the short wait
Automatically redirects the user to the home page after 4 seconds
Includes ARIA accessibility roles and live regions for screen readers

## ProductDetail.tsx
### What This File Does
Displays detailed product info using the product ID from the URL.
Uses React Router to read the id parameter from the route.
Fetches product data from the Redux store.
Shows a star rating using a reusable StarRating component.
Displays a loading spinner while the product is being retrieved.
Handles and displays error if product is not found.

## ProductList.tsx
### What This File Does
Load and list products on initial render.
Let users filter by product category.
Allow users to add items to their cart.
Provide a responsive, pageless product browsing experience.

## Profile.tsx
### What This File Does
Fetch authenticated user profile from the backend
Edit and update user name and address
Client-side validation with inline feedback
Delete account with confirmation prompt
Displays loading, success, and error messages
Auto-redirects to login after account deletion

## Register.tsx
### What This File Does
Registers a new user with email and password using Firebase Authentication.
Updates user profile with display name.
Saves additional user data (name, address, role, creation timestamp) in Firestore.
Provides form validation including custom password rules.
Shows loading spinner and error messages during registration.
Displays a success toast on successful registration.
Redirects to home page after registration.
Uses Redux to store authenticated user data.

## ReviewPage.tsx
### What This File Does
Fetches reviews for a specific product from Firestore in real-time.
Sort reviews by date (newest first) or rating (highest first).
Filter reviews by minimum rating (e.g., 4 stars and above).
Paginate reviews with configurable reviews per page (default 3).
Display reviewer name, rating, comment, and formatted date.
Error handling and loading indicators.
Navigate back to the home page.

## UserNotificationPage.tsx
### What This File Does
Imports the UserNotifications component from the components folder.
Exports a default functional component UserNotificationPage that simply renders UserNotifications.
Acts as a dedicated page to display user notifications in the app.

## hooks.ts
### What This File Does
useAppDispatch
A typed version of useDispatch() that knows your app's dispatch type (AppDispatch).
Ensures proper types for dispatching thunks or actions.
useAppSelector
A typed version of useSelector() that understands your app’s state shape (RootState).
Helps catch errors when accessing state slices.

## store.ts
### What This File Does
Imports individual slice reducers from their respective files:
authSlice — handles authentication state
cartSlice — handles shopping cart state
orderSlice — manages order-related state
productSlice — manages product data and filters
userSlice — manages user profile data and state

## AdminRoute.tsx
### What This File Does
Uses React Router's Navigate to redirect unauthorized users.
Accesses the authentication state from the Redux store using useSelector.
Checks if the user is:
Loading — shows a loading message.
Not logged in — redirects to the login page.
Logged in but not an admin — redirects to a "not authorized" page.
Logged in as admin — renders the protected child components passed as children.

## PrivateRoute.tsx
### What This File Does
Uses React Router's Navigate component to redirect unauthorized users.
Reads the current authenticated user from the Redux store using useSelector.
If no user is logged in, redirects to /login.
If a user is authenticated, renders the wrapped child components.

## fetchProductsByPage.ts
### What This File Does
It reads product documents from the products collection in your Firestore database.
It only fetches 10 products at a time (PRODUCTS_PER_PAGE = 10) and remembers where it left off so you can load the next page.
Products are sorted alphabetically by their title.
Updates React State
setProducts: sets the current page’s products.
setHasNextPage: tells if there is another page to fetch.
setLoading: shows/hides loading indicator.
setError: shows an error message if something goes wrong.
It uses a Ref to store the last document from each page, which is required to fetch the next set using startAfter.

## cart.ts
### What This File Does
Provides a strongly-typed structure to represent cart items in Redux state or component props.
Enables tracking of product quantities alongside standard product details.

## notificationTypes.ts
### What This File Does
Provides a strongly-typed structure for managing user notifications in state management or Firestore documents.
Supports filtering, displaying, and marking notifications as read within the app.

## order.ts
### What This File Does
Provides a clear, typed structure for handling orders in state management and database interactions.
Supports various timestamp formats for flexibility with Firestore and other date handling.
Ensures consistency when managing order data throughout the app.

## dateUtils.ts
### What This File Does
Takes a JavaScript Date object (like new Date()) and turns it into a formatted string in the YYYY-MM-DDTHH:mm format, suitable for use in <input type="datetime-local" />

## placeOrder.ts
### What This File Does
Add a new order document
Notify the user of their order status
Notify all admin users about the new order
Clear the user's cart both locally (Redux store) and remotely (Firestore)

## types.ts
### What This File Does
It ensures consistent data structure for product info across your app.
Helps TypeScript catch errors if you try to use product data with missing or incorrectly typed fields.
Makes your code easier to maintain and understand by clearly documenting the shape of product and rating data.

## App.tsx
### What This File Does
Client-side routing: Uses React Router (react-router-dom) to handle navigation between pages.
Route protection: Implements route guards with PrivateRoute and AdminRoute components to restrict access to authenticated users and admin users, respectively.
Global UI components: Includes a Navbar showing unread notifications count, and a Footer at the bottom.
App-wide features:
AuthListener: Listens to Firebase authentication state changes.
CartAutoSave: Automatically saves cart changes to Firestore.
useUnreadNotifications: Custom hook to track unread user notifications.

## main.tsx
### What This File Does
React Root Rendering:
Uses React 18's createRoot API to mount the app into the HTML element with the id root.
Strict Mode:
Wraps the app with React's StrictMode component to enable additional checks and warnings during development for potential problems.
Redux Store Provider:
Wraps the app with Redux's Provider to make the centralized Redux store available throughout the component tree.
Authentication Context Provider:
Wraps the app with a custom AuthProvider component to manage and provide authentication state and logic across the app.
Global CSS Imports:
Imports Bootstrap CSS and JS bundle for styling and interactive UI components. Also imports custom global CSS stles.
Main App Component:
Renders the main App component, which defines the app’s UI, routing, and logic.

## components.CSS
### What This File Does
Enhance user experience with smooth hover animations.
Achieve responsive product grid layouts.
Style buttons, links, and forms consistently.
Provide clear visual cues for notifications and navigation.
Maintain a sticky header and clean footer across pages.

## pages.CSS
### What This File Does
Use .product-grid and .product-card to build product listing pages.
Style cart items with .cart-card, .cart-img, and quantity controls.
Apply .custom-hover to interactive buttons for consistent hover feedback.
Use pagination button styles for paginated lists.
Use .btn-cancel-order for cancel order or destructive actions with clear visual cues.
Combine utility classes for page layout and spacing.

## index.CSS
### What This File Does
Use this CSS file as a global stylesheet to reset browser defaults and unify app styling.
Apply .app-wrapper and .app-container as wrappers for the main app structure to ensure consistent background and sticky footer support.
Use .product-grid for displaying product listings in a responsive grid.
Utilize star icon and rating classes for consistent display of product ratings.
Style modals with .custom-modal-content for a cohesive look.
Enjoy custom thin scrollbars on supported browsers for a subtle modern UI touch.

## Firestore Security Rules File For This Project
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAdmin() {
      return request.auth != null &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }

    function isOrderOwner() {
      return request.auth != null &&
             resource.data.userId == request.auth.uid;
    }

    // USERS
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // ORDERS
    match /orders/{orderId} {
      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;

      allow read: if request.auth != null;

      allow delete: if request.auth != null && (isAdmin() || isOrderOwner());

      allow update: if request.auth != null && (
        (isAdmin()
          && request.resource.data.diff(resource.data).changedKeys().hasOnly(['status', 'estimatedDelivery'])
          && (
            !('status' in request.resource.data) ||
            (
              request.resource.data.status is string &&
              request.resource.data.status in ['pending', 'in process', 'refunded', 'shipped', 'delivered']
            )
          )
          && (
            !('estimatedDelivery' in request.resource.data) ||
            request.resource.data.estimatedDelivery == null ||
            request.resource.data.estimatedDelivery is timestamp
          )
        )
        ||
        (isOrderOwner()
          && request.resource.data.diff(resource.data).changedKeys().hasOnly(['status'])
          && request.resource.data.status == "cancelled"
        )
      );
    }

    // PRODUCTS
    match /products/{productId} {
      allow read: if true;

      allow create, delete, update: if request.auth != null && isAdmin();

      allow update: if request.auth != null &&
        request.resource.data.diff(resource.data).changedKeys().hasOnly(['rating']) &&
        request.resource.data.rating.count is number &&
        request.resource.data.rating.rate is number;
    }

    // CARTS
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // REVIEWS (top-level)
    match /reviews/{reviewId} {
      allow read: if true;

      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;

      allow update, delete: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // REVIEWS (nested in products)
    match /products/{productId}/reviews/{reviewId} {
      allow read: if true;

      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;

      allow update, delete: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // NOTIFICATIONS
    match /notifications/{notificationId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;

      allow create: if request.auth != null && (
        // Notification is for self
        request.auth.uid == request.resource.data.userId

        // Sender is admin
        || (
          exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin"
        )

        // Receiver is admin
        || (
          exists(/databases/$(database)/documents/users/$(request.resource.data.userId)) &&
          get(/databases/$(database)/documents/users/$(request.resource.data.userId)).data.role == "admin"
        )
      );
    }

    // Fallback: deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}

### Rules Breakdown
Users (/users/{userId})
Read: Any authenticated user.
Write: Only the user themselves can write to their user document.
Orders (/orders/{orderId})
Create: Authenticated user creating an order with their UID.
Read: Authenticated users can read all orders (limit client-side by filtering).
Delete: Allowed for order owner or admins.
Update:
Admins can change status and estimatedDelivery.
Users can only set the order status to "cancelled".
Products (/products/{productId})
Read: Public (anyone).
Create/Update/Delete: Only admins.
Update rating: Anyone can update the rating field specifically if it contains valid count and rate numbers.
Carts (/carts/{userId})
Only the owner of the cart (authenticated user) can read and write.
Reviews
Top-Level (/reviews/{reviewId}) and Nested (/products/{productId}/reviews/{reviewId})
Read: Public.
Create: Only the user who authored it.
Update/Delete: Only the original author.
Notifications (/notifications/{notificationId})
Create: Allowed if the notification is about the user themselves, or if the sender or receiver is an admin.
Read/Update/Delete: Only the user the notification is addressed to.
Fallback Rule
Everything else is denied by default.

## How to Add and Publish These Rules in Firestore
Step-by-Step Guide
Go to Firebase Console:
Navigate to https://console.firebase.google.com
Select project.
Open Firestore Rules Editor:
Click Build → Firestore Database.
Go to the Rules tab.
Replace Default Rules:
Remove the existing rules.
Paste the entire content of the above security rules file.
Click “Publish”:
At the top right, click the Publish button to apply changes.

## How This App Solves Real User Problems.
Here are the problems users face when shopping online, and here is how this app solves them:
I forgot what's in my cart               | Cart is auto-saved to your account                 
I want to cancel my order                | One-click cancellation for pending orders          
I don’t know if a product is good        | Check average rating and real user reviews         
I want to know when my order is shipped  | Get instant notification updates                   
I'm an admin and need alerts             | Real-time notifications for all new orders         

This app is built with the end user in mind—making shopping secure, transparent, and enjoyable.

##  Installation & Setup
Clone the Repository
npm install
### Firebase Setup
You need a Firebase project with Authentication, Firestore, and optionally Storage enabled.
Go to Firebase Console
Create a project and enable Email/Password Auth
Create a Firestore database
Set up the following collections: users, products, orders, carts, notifications, reviews
Add your Firebase config to /src/firebase/firebaseConfig.ts:
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "XXXXXXX",
  appId: "YOUR_APP_ID"
};
export const app = initializeApp(firebaseConfig);
Publish above security rules
npm run dev
Navigate to http://localhost:5173 in your browser.

## Contributing:
Feedback and contributions to this project are greatly appreciated.
































