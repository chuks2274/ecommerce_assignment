import {
  collection,              
  getDocs,                 
  query,                  
  orderBy,                
  limit,                  
  startAfter,              
  QueryDocumentSnapshot,   
  type DocumentData,       
} from "firebase/firestore"; // Import Firestore functions used for fetching and organizing data
import { db } from "../firebase/firebaseConfig"; // Import the Firestore database configuration

// Define the structure of a product's rating
interface Rating {
  rate: number;   
  count: number;  
}

// Define the structure of a product
export interface Product {
  id: string;              
  title: string;           
  description?: string;    
  price: number;           
  image: string;           
  category: string;        
  rating?: Rating;         
}

// Number of products to show per page
const PRODUCTS_PER_PAGE = 10;

 
// Fetch products from Firestore with pagination support
export const fetchProductsByPage = async (
  page: number, 
  pageStartDocsRef: React.MutableRefObject<QueryDocumentSnapshot<DocumentData>[]>,  
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>,  
  setHasNextPage: React.Dispatch<React.SetStateAction<boolean>>,  
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,  
  setError: React.Dispatch<React.SetStateAction<string | null>>  
): Promise<void> => {
  setLoading(true);
  setError(null);

  try {
    // Get a reference to the "products" collection in Firestore
    const productRef = collection(db, "products");
    let q;  

    // If we're on the first page, get the first 11 products sorted by title
    if (page === 0) {
      q = query(productRef, orderBy("title"), limit(PRODUCTS_PER_PAGE + 1));
    } else {
      // Get the last document from the previous page
      const lastDoc = pageStartDocsRef.current[page - 1];
      // If we have a last document, start after it (for pagination)
      q = lastDoc
        ? query(productRef, orderBy("title"), startAfter(lastDoc), limit(PRODUCTS_PER_PAGE + 1))
        : query(productRef, orderBy("title"), limit(PRODUCTS_PER_PAGE + 1));
    }

    // Get paginated products and check if there's a next page
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;  
    const hasNext = docs.length === PRODUCTS_PER_PAGE + 1;  
    const productsToShow = hasNext ? docs.slice(0, PRODUCTS_PER_PAGE) : docs;  

    // Save the last document on this page for pagination
    if (productsToShow.length > 0) {
      pageStartDocsRef.current[page] = productsToShow[productsToShow.length - 1];
    }

    // Convert Firestore documents to product data objects using map
    const newProducts = productsToShow.map((doc) => {
      const data = doc.data(); 

      // Get the rating info if available, otherwise default to 0
      const ratingFromData = data.rating ?? {};
      const rating: Rating = {
        rate: typeof ratingFromData.rate === "number" ? ratingFromData.rate : 0,
        count: typeof ratingFromData.count === "number" ? ratingFromData.count : 0,
      };

      // Return product with id and data
      return {
        id: doc.id,
        ...data,
        rating,
      };
    }) as Product[]; // Force TypeScript to treat this as a Product array

    // Update state with new products and next page info
    setProducts(newProducts);
    setHasNextPage(hasNext);
  } catch (error) {
    console.error("Error fetching products:", error);
    setError("Failed to load products. Please try again.");
  } finally {
    setLoading(false);
  }
};