import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { ClienteAuthProvider, useClienteAuth } from './context/ClienteAuthContext';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ClienteLoginPage from './pages/cliente/ClienteLoginPage';
import ClienteAppPage from './pages/cliente/ClienteAppPage';

function RutaAdminProtegida({ children }) {
  const { token } = useAdminAuth();
  return token ? children : <Navigate to="/admin/login" replace />;
}

function RutaClienteProtegida({ children }) {
  const { token } = useClienteAuth();
  return token ? children : <Navigate to="/cliente/login" replace />;
}

export default function App() {
  return (
    <AdminAuthProvider>
      <ClienteAuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <RutaAdminProtegida>
                <AdminDashboardPage />
              </RutaAdminProtegida>
            }
          />

          <Route path="/cliente/login" element={<ClienteLoginPage />} />
          <Route
            path="/cliente"
            element={
              <RutaClienteProtegida>
                <ClienteAppPage />
              </RutaClienteProtegida>
            }
          />
        </Routes>
      </ClienteAuthProvider>
    </AdminAuthProvider>
  );
}
