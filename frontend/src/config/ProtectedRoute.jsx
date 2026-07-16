import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken } from "./auth";
import { getStoredUser } from "./auth";
import { hasAnyPermission, isAdmin } from "./permissions";

export default function ProtectedRoute({ children, permissions = [], adminOnly = false }) {
  const token = getAuthToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = getStoredUser();

  if (adminOnly && !isAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permissions.length && !hasAnyPermission(user, permissions)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
