import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"; // Import Redux Toolkit functions to create slices, async actions, and typed action payloads
import { signOut } from "firebase/auth"; // Import Firebase Auth function to sign out a user
import { auth, db } from "../../firebase/firebaseConfig"; // Import configured Firebase Auth and Firestore database instances
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions to reference a document (doc) and fetch its data (getDoc)
import type { User } from "firebase/auth"; // Import the User type from Firebase Auth for TypeScript typing

// Define a user model that includes role info (admin or user)
export interface UserWithRole {
  uid: string;  
  email: string | null;  
  name?: string | null;  
  role: "admin" | "user";  
}

// Define the shape of authentication state in Redux store
interface AuthState {
  user: UserWithRole | null;  
  loading: boolean;  
  error: string | null;  
}

// Initial state for auth slice
const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

// Async thunk to log out user from Firebase Auth
export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await signOut(auth); // Calls Firebase signOut function
});

// Async thunk to fetch user data and role from Firestore
export const fetchAndSetUser = createAsyncThunk<
  UserWithRole | null,  
  User | null,          
  { rejectValue: string }  
>(
  "auth/fetchAndSetUser",
  async (firebaseUser, thunkAPI) => {
    if (!firebaseUser) return null; // If no user, return null

    try {
      // Reference Firestore doc for this user by UID
      const userDocRef = doc(db, "users", firebaseUser.uid);

      // Get the user document snapshot
      const userDocSnap = await getDoc(userDocRef);

      let role: UserWithRole["role"] = "user"; // Default role is 'user'

      if (userDocSnap.exists()) {

        // Get user data from Firestore doc
        const userData = userDocSnap.data();

        // Check if role is valid and set it
        if (userData.role === "admin" || userData.role === "user") {
          role = userData.role;
        }
      }

      // Return user info with role
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName ?? null,
        role,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch user data";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create the Redux slice for auth management
const authSlice = createSlice({
  name: "auth",  
  initialState,  
  reducers: {
    // Reducer to set user info in state
    setUser: (state, action: PayloadAction<UserWithRole | null>) => {
      state.user = action.payload;
    },
    // Reducer to set loading status
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    // Reducer to set error message
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    // Reducer to clear all auth info (logout state)
    clearAuth: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // When logoutUser starts (pending), set loading true and clear errors
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // When logoutUser completes (fulfilled), clear user and loading
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
      })
      // When logoutUser fails (rejected), set error and stop loading
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Logout failed";
      })
      // When fetchAndSetUser starts, set loading true and clear errors
      .addCase(fetchAndSetUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // When fetchAndSetUser succeeds, save user and stop loading
      .addCase(fetchAndSetUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      // When fetchAndSetUser fails, set error message and stop loading
      .addCase(fetchAndSetUser.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to fetch user data";
        state.loading = false;
      });
  },
});

// Export action creators from auth slice
export const { setUser, setLoading, setError, clearAuth } = authSlice.actions;

// Export the auth reducer for Redux store
export default authSlice.reducer;