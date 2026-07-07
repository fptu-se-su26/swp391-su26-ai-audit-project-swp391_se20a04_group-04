import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { normalizeRole } from '../constants/roles';

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = authService.getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = normalizeRole(user.role);
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
