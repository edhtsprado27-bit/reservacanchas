import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { usuario } = useAuth();

  return (
    <div>
      <div className="bg-blue-900 text-white rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold mb-2">
          ¡Bienvenido/a, {usuario?.nombre}! 👋
        </h1>
        <p className="text-blue-200">
          Reserva tu cancha de fútbol o vóley en minutos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/canchas"
          className="bg-white rounded-xl shadow p-6 hover:shadow-md transition border-l-4 border-blue-600 flex flex-col items-center gap-3">
          <span className="text-5xl">⚽</span>
          <h2 className="text-lg font-bold text-blue-900">Ver Canchas</h2>
          <p className="text-gray-500 text-sm text-center">Consulta disponibilidad y reserva tu cancha favorita.</p>
        </Link>

        <Link to="/reservas"
          className="bg-white rounded-xl shadow p-6 hover:shadow-md transition border-l-4 border-green-600 flex flex-col items-center gap-3">
          <span className="text-5xl">📋</span>
          <h2 className="text-lg font-bold text-blue-900">Mis Reservas</h2>
          <p className="text-gray-500 text-sm text-center">Revisa y gestiona todas tus reservas activas.</p>
        </Link>

        {usuario?.rol === 'administrador' && (
          <Link to="/admin"
            className="bg-white rounded-xl shadow p-6 hover:shadow-md transition border-l-4 border-yellow-500 flex flex-col items-center gap-3">
            <span className="text-5xl">🔧</span>
            <h2 className="text-lg font-bold text-blue-900">Panel Admin</h2>
            <p className="text-gray-500 text-sm text-center">Gestiona canchas, horarios y reportes.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
