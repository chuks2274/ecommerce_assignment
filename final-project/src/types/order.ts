import { Timestamp } from "firebase/firestore"; // Import Timestamp type from Firebase Firestore for time fields
import { type CartItem } from "./cart"; // Import CartItem type from cart file for items in the order

// Define the shape of an Order object
export interface Order {
  id?: string;                  
  userId: string;               
  createdAt: Timestamp | Date | string;  
  items: CartItem[];            
  total: number;               
}