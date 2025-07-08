import { initializeApp } from "firebase/app"; // Import function to initialize Firebase app
import { getAuth } from "firebase/auth"; // Import function to get Firebase Authentication instance
import { getFirestore } from "firebase/firestore"; // Import function to get Firestore instance

// Firebase project configuration object—replace with your own config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyD8fv6YtWERjBu4ycA9S1QsJEP7LuykgME",          
  authDomain: "ecommerce-cbc5b.firebaseapp.com",              
  projectId: "ecommerce-cbc5b",                                
  storageBucket: "ecommerce-cbc5b.firebasestorage.app",        
  messagingSenderId: "541541381507",                           
  appId: "1:541541381507:web:9de222a996b47cb96df2b6"         
};

// Initialize the Firebase app using the config above
const app = initializeApp(firebaseConfig);

// Export the Firebase Authentication instance to use in the app
export const auth = getAuth(app);

// Export the Firestore database instance to use in the app
export const db = getFirestore(app);