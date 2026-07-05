import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-wide">
          ⚽ ReservaCanchas
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/canchas" className="hover:text-blue-300 transition">Canchas</Link>
          {usuario ? (
            <>
              <Link to="/reservas" className="hover:text-blue-300 transition">Mis Reservas</Link>
              {usuario.rol === 'administrador' && (
                <Link to="/admin" className="bg-yellow-500 text-black px-3 py-1 rounded font-semibold hover:bg-yellow-400 transition">
                  Admin
                </Link>
              )}
              <span className="text-blue-300">Hola, {usuario.nombre}</span>
              <button onClick={handleLogout}
                className="bg-red-600 px-3 py-1 rounded hover:bg-red-500 transition">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="hover:text-blue-300 transition">Ingresar</Link>
              <Link to="/register" className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-500 transition">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
