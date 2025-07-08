import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"; // Import necessary functions from Redux Toolkit
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  type DocumentData,
  updateDoc,
  doc,
} from "firebase/firestore"; // Import Firestore functions to interact with the database
import { db } from "../../firebase/firebaseConfig"; // Import the Firestore database configuration

// Define the shape of each item in an order
export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

// Define how order items are originally stored in Firestore
interface RawOrderItem {
  id?: string;
  productId?: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

// Define the full order structure
export interface Order {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  total: number;
  items: OrderItem[];
  deliveryStatus: "Pending" | "Shipped" | "Delivered" | "Cancelled";
  deliveryDate?: string;
}

// Define what the Redux state will look like for orders
export interface OrderState {
  orders: Order[];          
  loading: boolean;         
  error: string | null;     
}

// Initial state for the orders slice
const initialState: OrderState = {
  orders: [],
  loading: false,
  error: null,
};

// Thunk to fetch all orders for a specific user
export const fetchOrdersByUser = createAsyncThunk(
  "orders/fetchOrdersByUser",
  async (userId: string) => {
    // Build a query to get orders by userId, ordered by date (newest first)
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    // Execute the query and get the documents
    const snapshot = await getDocs(q);

    // Convert raw data into a usable Order object
    return snapshot.docs.map((doc) => {
      const data = doc.data() as DocumentData;

      // Normalize the item structure
      const normalizedItems: OrderItem[] = (data.items ?? []).map(
        (item: RawOrderItem) => ({
          id: item.id || item.productId || "",   
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image || "",
        })
      );

      // Return the formatted order
      return {
        id: doc.id,
        userId: data.userId,
        createdAt: data.createdAt?.seconds
          ? new Date(data.createdAt.seconds * 1000).toISOString()
          : "",
        total: data.total,
        items: normalizedItems,
        status: data.status ?? "Pending",
        deliveryStatus: data.deliveryStatus ?? "Pending",
        deliveryDate: data.deliveryDate?.seconds
          ? new Date(data.deliveryDate.seconds * 1000).toISOString()
          : undefined,
      } as Order;
    });
  }
);

// Thunk to create a new order
export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (payload: { userId: string; items: OrderItem[]; total: number }) => {
    const { userId, items, total } = payload;

    // Create a new order object to store in Firestore
    const newOrder = {
      userId,
      items,
      total,
      status: "Pending",
      createdAt: serverTimestamp(),
      deliveryStatus: "Pending",
    };

    // Add the order to Firestore
    const docRef = await addDoc(collection(db, "orders"), newOrder);

    // Return the new order to be added to Redux state
    return {
      id: docRef.id,
      userId,
      items,
      total,
      status: "Pending",
      createdAt: new Date().toISOString(),
      deliveryStatus: "Pending",
    } as Order;
  }
);

// Thunk to update the delivery status of an existing order
export const updateDeliveryStatus = createAsyncThunk(
  "orders/updateDeliveryStatus",
  async (payload: { orderId: string; status: Order["deliveryStatus"] }) => {
    const { orderId, status } = payload;

    // Only set deliveryDate if status is "Delivered"
    const deliveryDate = status === "Delivered" ? serverTimestamp() : null;

    // Update the document in Firestore
    await updateDoc(doc(db, "orders", orderId), {
      deliveryStatus: status,
      deliveryDate,
    });

    // Return the new data so Redux can update state
    return {
      orderId,
      deliveryStatus: status,
      deliveryDate: deliveryDate ? new Date().toISOString() : undefined,
    };
  }
);

// Create the Redux slice for orders
const orderSlice = createSlice({
  name: "orders",       
  initialState,         
  reducers: {},         
  extraReducers: (builder) => {
    builder
      // Handle loading state when fetching orders
      .addCase(fetchOrdersByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Store fetched orders on success
      .addCase(fetchOrdersByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      // Set error if fetch fails
      .addCase(fetchOrdersByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch orders";
      })

      // Handle loading when creating an order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Add the new order to the state
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.push(action.payload);
      })
      // Handle error if create fails
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create order";
      })

      // Update delivery status of an order
      .addCase(updateDeliveryStatus.fulfilled, (state, action) => {
        const { orderId, deliveryStatus, deliveryDate } = action.payload;
        const order = state.orders.find((o) => o.id === orderId);
        if (order) {
          order.deliveryStatus = deliveryStatus;
          if (deliveryDate) order.deliveryDate = deliveryDate;
        }
      });
  },
});

// Export the reducer so we can use it in the store
export default orderSlice.reducer;