import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar         from './components/layout/Navbar';
import WhatsAppButton from './components/layout/WhatsAppButton';
import Login          from './pages/Login';
import Register       from './pages/Register';
import Dashboard      from './pages/Dashboard';
import Canchas        from './pages/Canchas';
import Reservas       from './pages/Reservas';
import AdminPanel     from './pages/AdminPanel';

function RutaProtegida({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function RutaAdmin({ children }) {
  const { usuario } = useAuth();
  return usuario?.rol === 'administrador' ? children : <Navigate to="/" />;
}

function AppRoutes() {
  const { token } = useAuth();
  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/login"    element={token ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={token ? <Navigate to="/" /> : <Register />} />
          <Route path="/" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
          <Route path="/canchas"  element={<Canchas />} />
          <Route path="/reservas" element={<RutaProtegida><Reservas /></RutaProtegida>} />
          <Route path="/admin"    element={<RutaProtegida><RutaAdmin><AdminPanel /></RutaAdmin></RutaProtegida>} />
        </Routes>
      </main>
      {/* Botón flotante de WhatsApp — visible en todas las páginas */}
      <WhatsAppButton />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
