import { createContext } from "react"; // Import createContext function from React library


// Create and export AuthContext with default { loading: true } to indicate initial auth loading state
export const AuthContext = createContext<{ loading: boolean }>({
  loading: true,
});