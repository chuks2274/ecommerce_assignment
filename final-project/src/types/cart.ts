import { type Product } from "../types"; // Import the Product type from the types file

// Define CartItem interface that extends Product with an added quantity field
export interface CartItem extends Product {
  quantity: number;  
}