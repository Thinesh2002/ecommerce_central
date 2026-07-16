import React from "react";
import { Route } from "react-router-dom";
import Team from "../../Pages/team";
import Layout from "../../compnents/Layout";
import ProtectedRoute from "../../config/ProtectedRoute";
import { PERMISSIONS } from "../../config/permissions";

const ProtectedPage = ({ children, permissions = [] }) => (
  <ProtectedRoute permissions={permissions}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

const TeamRoute = (
  <Route
    path="/team-dashboard"
    element={
      <ProtectedPage permissions={[PERMISSIONS.TEAM_READ]}>
        <Team />
      </ProtectedPage>
    }
  />
);

export default TeamRoute;
