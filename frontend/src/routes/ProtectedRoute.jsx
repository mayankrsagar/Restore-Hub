import { useContext } from 'react';

import PropTypes from 'prop-types';
// src/routes/ProtectedRoute.js
import { Navigate } from 'react-router-dom';

import { UserContext } from '../App';

/**
 * ProtectedRoute — wraps private components.
 * Redirects to /login if no authenticated user.
 * Shows a loading indicator if auth check is still in progress.
 */
function ProtectedRoute({ children, loading }) {
  const { userData } = useContext(UserContext);

  if (loading) return <div>Loading...</div>;

  return userData ? children : <Navigate to="/login" replace />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  loading: PropTypes.bool.isRequired,
};

export default ProtectedRoute;
