import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./compnents/Layout";
import ProtectedRoute from "./config/ProtectedRoute";

import Login from "./Pages/login";
import Register from "./Pages/user/Register";
import Dashboard from "./Pages/dasboard";
import User from "./Pages/user/user_dashboard";
import TrafficReportAnalysis from "./Pages/Ebay/Ebay _File_Anaysis/eBayTrafficReportComparison";
import EbayKeywordAnalysis from "./Pages/Ebay/Keyword_Research/index"
import EbaySellerRoute from "./Pages/Ebay/Ebay_Seller_analysis/index"

import { getStoredUser, getAuthToken } from "./config/auth";

import "./index.css";

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    const syncAuth = () => setUser(getStoredUser());

    window.addEventListener("auth_change", syncAuth);
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener("auth_change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const isLoggedIn = Boolean(getAuthToken());

  return (
    <Routes>
      {/* PUBLIC */}
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login />}
      />

      {/* PROTECTED */}
      <Route
        path="/register"
        element={
          <ProtectedRoute>
            <Layout>
              <Register />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user-dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <User />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/traffic-report-analysis"
        element={
          <ProtectedRoute>
            <Layout>
              <TrafficReportAnalysis />
            </Layout>
          </ProtectedRoute>
        }
      />

            <Route
        path="/Keyword-analysis"
        element={
          <ProtectedRoute>
            <Layout>
              <EbayKeywordAnalysis />
            </Layout>
          </ProtectedRoute>
        }
      />

                  <Route
        path="/Seller-analysis"
        element={
          <ProtectedRoute>
            <Layout>
              <EbaySellerRoute />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* FALLBACK */}
      <Route
        path="*"
        element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />}
      />
    </Routes>
  );
}
