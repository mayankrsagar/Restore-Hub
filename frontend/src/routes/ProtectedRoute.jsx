// src/routes/ProtectedRoute.js
import { useContext } from "react";

import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";

import { UserContext } from "../App";

/**
 * ProtectedRoute — wraps private components.
 * Redirects to /login if no authenticated user.
 * Shows a loading indicator if auth check is still in progress.
 */
function ProtectedRoute({ children, loading }) {
  const { userData } = useContext(UserContext);

  if (loading) {
    // nicer loading UI (tailwind-friendly)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return userData ? children : <Navigate to="/login" replace />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  loading: PropTypes.bool.isRequired,
};

export default ProtectedRoute;
