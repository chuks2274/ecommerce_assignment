import { type ReactNode } from "react"; // Import ReactNode type for typing children props
import { Navigate } from "react-router-dom"; // Import Navigate component to redirect users
import { useAppSelector } from "../redux/hooks"; // Import the typed useAppSelector hook for Redux state

// Define props interface expecting React children nodes
interface Props {
  children: ReactNode;
}

// Define a minimal user interface with role and optional fields
interface UserWithRole {
  role: string;
  email?: string;
  uid?: string;
}

// AdminRoute component protects routes for admin users only
export default function AdminRoute({ children }: Props) {
  
  // Get current user from Redux store
  const rawUser = useAppSelector((state) => state.auth.user);

  // Get current loading state from Redux store
  const loading = useAppSelector((state) => state.auth.loading);

  // Narrow down rawUser type to UserWithRole if valid, else null
  const user =
    rawUser && typeof rawUser === "object" && "role" in rawUser
      ? (rawUser as UserWithRole)
      : null;

  // Show loading message if auth state is still loading
  if (loading) return <div>Loading...</div>;

  // Redirect to login if not authenticated
  if (!user) return <Navigate to="/login" replace />;

  // Redirect to not-authorized if the user is not an admin
  if (user.role !== "admin") return <Navigate to="/not-authorized" replace />;

  // Render protected content if user is an admin
  return <>{children}</>;
}