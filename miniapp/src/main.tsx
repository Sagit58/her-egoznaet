import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import './index.css';
import { AuthGate, Dashboard, LoginCard } from './App.tsx';
import { BranchesScreen } from './screens/BranchesScreen.tsx';
import { CustomerDetailScreen } from './screens/CustomerDetailScreen.tsx';
import { CustomersScreen } from './screens/CustomersScreen.tsx';
import { EmployeesScreen } from './screens/EmployeesScreen.tsx';
import { FilesScreen } from './screens/FilesScreen.tsx';
import { OrderDetailScreen } from './screens/OrderDetailScreen.tsx';
import { OrdersScreen } from './screens/OrdersScreen.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginCard />} />

        <Route
          path="/dashboard"
          element={
            <AuthGate>
              <Dashboard />
            </AuthGate>
          }
        />
        <Route
          path="/orders"
          element={
            <AuthGate>
              <OrdersScreen />
            </AuthGate>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <AuthGate>
              <OrderDetailScreen />
            </AuthGate>
          }
        />
        <Route
          path="/customers"
          element={
            <AuthGate>
              <CustomersScreen />
            </AuthGate>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <AuthGate>
              <CustomerDetailScreen />
            </AuthGate>
          }
        />
        <Route
          path="/employees"
          element={
            <AuthGate>
              <EmployeesScreen />
            </AuthGate>
          }
        />
        <Route
          path="/files"
          element={
            <AuthGate>
              <FilesScreen />
            </AuthGate>
          }
        />
        <Route
          path="/branches"
          element={
            <AuthGate>
              <BranchesScreen />
            </AuthGate>
          }
        />

        {/* По умолчанию — на дашборд */}
        <Route path="*" element={<AuthGate><Dashboard /></AuthGate>} />
      </Routes>
    </Router>
  </StrictMode>,
);
