import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [form, setForm]       = useState({ correo: '', contrasena: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [bienvenida, setBienvenida] = useState(true);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión.');
    } finally { setLoading(false); }
  };

  // ── Pantalla de bienvenida ──
  if (bienvenida) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 rounded-3xl shadow-2xl p-10 w-full max-w-lg text-center overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-4 left-4 text-9xl">⚽</div>
            <div className="absolute bottom-4 right-4 text-9xl">🏐</div>
          </div>

          <div className="relative z-10">
            <div className="text-7xl mb-4 animate-bounce">⚽</div>
            <h1 className="text-3xl font-extrabold text-white mb-2 leading-tight">
              ¡Bienvenido a la
            </h1>
            <h2 className="text-4xl font-extrabold text-yellow-400 mb-2">
              Cancha Sintética
            </h2>
            <h3 className="text-3xl font-extrabold text-white mb-6">
              EDHTS
            </h3>
            <p className="text-blue-200 text-lg mb-8">
              Reserva tu cancha de fútbol o vóley de forma rápida, fácil y segura 🏆
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setBienvenida(false)}
                className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-extrabold py-3 px-8 rounded-xl text-lg transition-all duration-300 hover:scale-105 shadow-lg">
                Iniciar Sesión
              </button>
              <Link to="/register"
                className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-8 rounded-xl text-lg transition-all duration-300 hover:scale-105">
                Crear cuenta nueva
              </Link>
            </div>
            <p className="text-blue-300 text-sm mt-6">
              📍 Ayacucho, Perú &nbsp;|&nbsp; 📞 +51 930 463 476
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulario de login ──
  return (
    <div className="min-h-[85vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">⚽</div>
          <h1 className="text-2xl font-bold text-blue-900">Iniciar Sesión</h1>
          <p className="text-gray-500 text-sm">Cancha Sintética EDHTS</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" required value={form.correo}
              onChange={e => setForm({ ...form, correo: e.target.value })}
              placeholder="tucorreo@mail.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" required value={form.contrasena}
              onChange={e => setForm({ ...form, contrasena: e.target.value })}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-900 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="flex justify-between items-center mt-4 text-sm">
          <button onClick={() => setBienvenida(true)} className="text-gray-400 hover:text-gray-600">
            ← Volver
          </button>
          <Link to="/register" className="text-blue-700 font-medium hover:underline">
            Registrarse aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
