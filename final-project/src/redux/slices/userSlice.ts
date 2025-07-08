import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"; // Import functions to create Redux slice and async thunks
import type { PayloadAction } from "@reduxjs/toolkit"; // Import type for Redux action payloads
import {
  getAuth,
  updateProfile,
  deleteUser,
  type User,  
} from "firebase/auth"; // Import Firebase Auth functions and User type
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getFirestore,
} from "firebase/firestore"; // Import Firestore functions

// Define the shape of user profile data
interface ProfileData {
  name: string;
  address: string;
  email?: string;
  createdAt?: string;  
}

// Define the state shape for user slice
interface UserState {
  profile: ProfileData | null;  
  loading: boolean;             
  error: string | null;        
  success: string | null;       
}

// Initial state setup
const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
  success: null,
};

// Get Firestore database instance
const db = getFirestore();

// Get Firebase Auth instance
const auth = getAuth();

// Async thunk to fetch user profile from Firestore
export const fetchUserProfile = createAsyncThunk<
  ProfileData,
  string,                
  { rejectValue: string }
>(
  "user/fetchUserProfile",
  async (uid, { rejectWithValue }) => {
    try {
      // Reference the user document by uid
      const docRef = doc(db, "users", uid);

      // Get the document snapshot
      const docSnap = await getDoc(docRef);

      // If document doesn't exist, reject with error
      if (!docSnap.exists()) {
        return rejectWithValue("Profile does not exist.");
      }
      // Extract data from snapshot
      const data = docSnap.data();

      // Return profile data with createdAt serialized to ISO string
      return {
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : undefined,
      } as ProfileData;
    } catch {
      return rejectWithValue("Failed to fetch profile.");
    }
  }
);

// Async thunk to update user profile in Firebase Auth and Firestore
export const editUserProfile = createAsyncThunk<
  ProfileData,
  { uid: string; data: ProfileData },    
  { rejectValue: string }
>(
  "user/editUserProfile",
  async ({ uid, data }, { rejectWithValue }) => {
    try {
      // Get currently authenticated user from Firebase Auth
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      // Update Firebase Auth displayName if it differs from data.name
      if (data.name !== user.displayName) {
        await updateProfile(user, { displayName: data.name });
      }

      // Reference user doc in Firestore
      const userDocRef = doc(db, "users", uid);

      // Update user doc data with merge to avoid overwriting
      await setDoc(userDocRef, data, { merge: true });

      // Return updated profile data
      return data;
    } catch {
      return rejectWithValue("Failed to update profile.");
    }
  }
);

// Async thunk to delete user account from Firebase Auth and Firestore
export const removeUserAccount = createAsyncThunk<
  void,
  { uid: string; user: User },    
  { rejectValue: string }
>(
  "user/removeUserAccount",
  async ({ uid, user }, { rejectWithValue }) => {
    try {
      // Delete user document from Firestore
      await deleteDoc(doc(db, "users", uid));

      // Delete user from Firebase Authentication
      await deleteUser(user);
    } catch {
      return rejectWithValue("Failed to delete account. You may need to re-login.");
    }
  }
);

// Create Redux slice for user profile state management
const userSlice = createSlice({
  name: "user",          
  initialState,           
  reducers: {
    // Clear any error or success messages
    clearMessages(state) {
      state.error = null;
      state.success = null;
    },
    // Clear user profile and reset status flags
    clearUser(state) {
      state.profile = null;
      state.error = null;
      state.success = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // When fetching profile starts
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;      
        state.error = null;       
        state.success = null;     
      })
      // When fetching profile succeeds
      .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<ProfileData>) => {
        state.loading = false;     
        state.profile = action.payload;  
      })
      // When fetching profile fails
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;     
        state.error = action.payload || "Failed to load profile";  
      })

      // When editing profile starts
      .addCase(editUserProfile.pending, (state) => {
        state.loading = true;      
        state.error = null;       
        state.success = null;     
      })
      // When editing profile succeeds
      .addCase(editUserProfile.fulfilled, (state, action: PayloadAction<ProfileData>) => {
        state.loading = false;     
        state.profile = action.payload;  
        state.success = "Profile updated successfully.";  
      })
      // When editing profile fails
      .addCase(editUserProfile.rejected, (state, action) => {
        state.loading = false;     
        state.error = action.payload || "Failed to update profile";  
      })

      // When removing user account starts
      .addCase(removeUserAccount.pending, (state) => {
        state.loading = true;      
        state.error = null;       
        state.success = null;      
      })
      // When removing user account succeeds
      .addCase(removeUserAccount.fulfilled, (state) => {
        state.loading = false;     
        state.profile = null;     
        state.success = "Account deleted successfully.";  
      })
      // When removing user account fails
      .addCase(removeUserAccount.rejected, (state, action) => {
        state.loading = false;     
        state.error = action.payload || "Failed to delete account";  
      });
  },
});

// Export actions for clearing messages and user profile
export const { clearMessages, clearUser } = userSlice.actions;

// Export the reducer for Redux store
export default userSlice.reducer;