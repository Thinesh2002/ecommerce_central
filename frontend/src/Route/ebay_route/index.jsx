import React from "react";
import { Route } from "react-router-dom";
import Layout from "../../compnents/Layout";
import ProtectedRoute from "../../config/ProtectedRoute";
import { PERMISSIONS } from "../../config/permissions";
import Accounts from "../../Pages/Ebay/account/index";

const ProtectedPage = ({ children, permissions = [] }) => (
  <ProtectedRoute permissions={permissions}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

const EbayRoute = (
  <Route
    path="/ebay-accounts"
    element={
      <ProtectedPage permissions={[PERMISSIONS.ACCOUNT_READ]}>
        <Accounts />
      </ProtectedPage>
    }
  />
);

export default EbayRoute;
