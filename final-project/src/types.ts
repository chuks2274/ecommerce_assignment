// Define the shape of a Rating object with two properties
export interface Rating {
  rate: number;    
  count: number;   
}

// Define the shape of a Product object with various properties
export interface Product {
  id: string;               
  title: string;            
  price: number;            
  description?: string;    
  category: string;         
  image: string;           
  rating?: Rating;          
  createdBy?: string;      
  averageRating?: number;   
  reviewCount?: number;     
}