import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./compnents/Layout";
import ProtectedRoute from "./config/ProtectedRoute";
import { PERMISSIONS } from "./config/permissions";

import Login from "./Pages/login";
import Register from "./Pages/user/Register";
import Dashboard from "./Pages/dasboard";
import User from "./Pages/user/user_dashboard";
import AccessControl from "./Pages/user/AccessControl";

import TrafficReportAnalysis from "./Pages/Ebay/Ebay _File_Anaysis/eBayTrafficReportComparison";
import EbayKeywordAnalysis from "./Pages/Ebay/Keyword_Research/index";
import AdvancedKeywordResearch from "./Pages/Ebay/Advanced_Keyword_Research/index";
import EbaySellerRoute from "./Pages/Ebay/Ebay_Seller_analysis/index";
import TemplateRoute from "./Pages/Ebay/Template_Generateor/views/TemplateGeneratorView";
import ListingAudit from "./Pages/Ebay/Listing_Audit/index";
import PerformanceCategory from "./Pages/Ebay/Performance tracker/index";
import TrafficReportCompare from "./Pages/Ebay/traffic_data_analysis/index";
import TaskRoute from "./Route/task_route/index";
import TeamRoute from "./Route/team_route/index";
import EbayRoute from "./Route/ebay_route/index";

import { getAuthToken } from "./config/auth";
import "./index.css";

function ProtectedPage({ children, permissions = [], adminOnly = false }) {
  return (
    <ProtectedRoute permissions={permissions} adminOnly={adminOnly}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  const isLoggedIn = Boolean(getAuthToken());

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />

      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route
        path="/register"
        element={
          <ProtectedPage permissions={[PERMISSIONS.USER_CREATE]}>
            <Register />
          </ProtectedPage>
        }
      />

      <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />

      <Route
        path="/access-control"
        element={
          <ProtectedPage adminOnly>
            <AccessControl />
          </ProtectedPage>
        }
      />

      <Route
        path="/user-dashboard"
        element={
          <ProtectedPage permissions={[PERMISSIONS.USER_READ]}>
            <User />
          </ProtectedPage>
        }
      />

      <Route path="/traffic-report-analysis" element={<ProtectedPage><TrafficReportAnalysis /></ProtectedPage>} />
      <Route path="/performance-tracker" element={<ProtectedPage><PerformanceCategory /></ProtectedPage>} />
      <Route path="/traffic-report-compare" element={<ProtectedPage><TrafficReportCompare /></ProtectedPage>} />

      <Route
        path="/keyword-analysis"
        element={
          <ProtectedPage permissions={[PERMISSIONS.KEYWORD_READ]}>
            <EbayKeywordAnalysis />
          </ProtectedPage>
        }
      />

      <Route
        path="/advanced-keyword-research"
        element={
          <ProtectedPage permissions={[PERMISSIONS.KEYWORD_ADVANCED]}>
            <AdvancedKeywordResearch />
          </ProtectedPage>
        }
      />

      <Route
        path="/seller-analysis"
        element={
          <ProtectedPage permissions={[PERMISSIONS.SELLER_READ]}>
            <EbaySellerRoute />
          </ProtectedPage>
        }
      />

      <Route path="/ebay-template" element={<ProtectedPage><TemplateRoute /></ProtectedPage>} />

      <Route
        path="/listing-audit"
        element={
          <ProtectedPage permissions={[PERMISSIONS.LISTING_AUDIT]}>
            <ListingAudit />
          </ProtectedPage>
        }
      />

      {TeamRoute}
      {EbayRoute}
      {TaskRoute}

      <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}
