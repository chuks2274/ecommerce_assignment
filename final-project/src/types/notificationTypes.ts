import { Timestamp } from "firebase/firestore"; // Import Timestamp type from Firebase Firestore for time fields

// Define the shape of a Notification object
export interface Notification {
  id: string;           
  userId: string;       
  message: string;      
  type: "order" | "delivery";   
  createdAt: Timestamp;   
  read: boolean;  
  image?: string;  
  images?: string[];     
}