import React from "react"; // Import React to use React types
import { Navigate } from "react-router-dom"; // Import Navigate component to redirect users
import { useAppSelector } from "../redux/hooks"; // Import the typed useAppSelector hook

// Define props interface with children of any React node type
interface Props {
  children: React.ReactNode;  
}

// PrivateRoute component to protect routes for authenticated users only
export default function PrivateRoute({ children }: Props) {
  
  // Get current user from Redux store
  const user = useAppSelector((state) => state.auth.user);

  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in, render the protected children components
  return <>{children}</>;  
}