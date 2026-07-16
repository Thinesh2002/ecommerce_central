import React from "react";
import { Route } from "react-router-dom";

import Layout from "../../compnents/Layout";
import ProtectedRoute from "../../config/ProtectedRoute";
import { PERMISSIONS } from "../../config/permissions";
import TaskDashboard from "../../Pages/task/index";
import CreateTask from "../../Pages/task/create_task/index";

const ProtectedPage = ({ children, permissions = [] }) => (
  <ProtectedRoute permissions={permissions}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

const Task = (
  <>
    <Route
      path="/task-dashboard"
      element={
        <ProtectedPage permissions={[PERMISSIONS.TASK_READ]}>
          <TaskDashboard />
        </ProtectedPage>
      }
    />
    <Route
      path="/create-task"
      element={
        <ProtectedPage permissions={[PERMISSIONS.TASK_CREATE]}>
          <CreateTask />
        </ProtectedPage>
      }
    />
  </>
);

export default Task;
