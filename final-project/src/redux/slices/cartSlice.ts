import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"; // Import Redux Toolkit tools for creating slices, async actions, and typed action payloads
import { doc, getDoc, setDoc } from "firebase/firestore"; // Import Firestore functions to reference, read, and write documents
import { db } from "../../firebase/firebaseConfig"; // Import configured Firestore database instance
import type { Product } from "../../types"; // Import TypeScript type definition for Product objects

// Define CartItem type based on Product but override rating as number (not object)
export interface CartItem extends Omit<Product, "rating"> {
  quantity: number;  
  rating: number;    
}

// Define state shape for cart slice
interface CartState {
  items: CartItem[];       
  loading: boolean;       
  error: string | null;    
}

// Load cart items from localStorage if available
const storedCart = localStorage.getItem("cart");
const initialState: CartState = {

  // Use saved cart or start empty
  items: storedCart ? JSON.parse(storedCart) : [],  
  loading: false,
  error: null,
};

// Async thunk to fetch cart data from Firestore by user ID
export const fetchCart = createAsyncThunk<CartItem[], string, { rejectValue: string }>(
  "cart/fetchCart",
  async (userId, { rejectWithValue }) => {
    try {
      // Reference to user's cart doc
      const docRef = doc(db, "carts", userId);     
      const snapshot = await getDoc(docRef);       
      if (snapshot.exists()) {
        // Extract cart items
        const items = snapshot.data().items as CartItem[];  
        localStorage.setItem("cart", JSON.stringify(items));  
        return items;   // Return cart items                            
      }
      return [];   // Return empty if no cart found                               
    } catch {
      return rejectWithValue("Failed to load cart");  
    }
  }
);

// Async thunk to save cart data to Firestore for a given user ID
export const saveCart = createAsyncThunk<
  CartItem[],
  { userId: string; items: CartItem[] },
  { rejectValue: string }
>(
  "cart/saveCart",
  async ({ userId, items }, { rejectWithValue }) => {
    try {
      // Reference to user's cart doc
      const cartRef = doc(db, "carts", userId);  
      await setDoc(cartRef, { items });           
      localStorage.setItem("cart", JSON.stringify(items));  
      return items;  // Return saved items                           
    } catch {
      return rejectWithValue("Failed to save cart");  
    }
  }
);

// Create Redux slice for cart state and reducers
const cartSlice = createSlice({
  name: "cart",        
  initialState,        
  reducers: {
    // Add item to cart or increase quantity if already present
    addToCart(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find(item => item.id === action.payload.id);
      if (existing) {
        existing.quantity += action.payload.quantity;  
      } else {
        state.items.push({ ...action.payload });      
      }
      localStorage.setItem("cart", JSON.stringify(state.items));  
    },
    // Remove item from cart by ID
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter(item => item.id !== action.payload);
      localStorage.setItem("cart", JSON.stringify(state.items));  
    },
    // Clear all items from cart
    clearCart(state) {
      state.items = [];
      localStorage.removeItem("cart");  
    },
    // Update quantity of a specific cart item by ID
    updateQuantity(state, action: PayloadAction<{ id: string; quantity: number }>) {
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;       
        localStorage.setItem("cart", JSON.stringify(state.items));  
      }
    },
    // Replace the entire cart items with a new list
    setCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      localStorage.setItem("cart", JSON.stringify(state.items));  
    },
    // Increase quantity of a cart item by 1
    increaseQuantity(state, action: PayloadAction<string>) {
      const item = state.items.find(i => i.id === action.payload);
      if (item) {
        item.quantity += 1;
        localStorage.setItem("cart", JSON.stringify(state.items));  
      }
    },
    // Decrease quantity of a cart item by 1 but not below 1
    decreaseQuantity(state, action: PayloadAction<string>) {
      const item = state.items.find(i => i.id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        localStorage.setItem("cart", JSON.stringify(state.items));  
      }
    },
  },
  // Handle async thunks states for fetchCart and saveCart
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;     
        state.error = null;       
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;  
        state.loading = false;         
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;         
        state.error = action.payload ?? "Error loading cart";  
      })
      .addCase(saveCart.rejected, (state, action) => {
        state.loading = false;         
        state.error = action.payload ?? "Error saving cart";   
      });
  },
});

// Export action creators to use in components
export const {
  addToCart,
  removeFromCart,
  clearCart,
  updateQuantity,
  setCart,
  increaseQuantity,
  decreaseQuantity,
} = cartSlice.actions;

// Export the reducer to configure Redux store
export default cartSlice.reducer;