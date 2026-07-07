import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';

// Componente de pelota animada
function Ball({ style }) {
  return (
    <div className="absolute rounded-full opacity-20 animate-bounce" style={style} />
  );
}

export default function Dashboard() {
  const { usuario } = useAuth();

  const balls = [
    { width:80,  height:80,  background:'#1e40af', top:'10%',  left:'5%',   animationDuration:'2s',   animationDelay:'0s'   },
    { width:50,  height:50,  background:'#16a34a', top:'20%',  right:'8%',  animationDuration:'2.5s', animationDelay:'0.5s' },
    { width:100, height:100, background:'#1e40af', bottom:'15%',left:'10%',  animationDuration:'3s',   animationDelay:'1s'   },
    { width:60,  height:60,  background:'#ca8a04', top:'50%',  right:'5%',  animationDuration:'2.2s', animationDelay:'0.3s' },
    { width:40,  height:40,  background:'#16a34a', bottom:'30%',right:'15%', animationDuration:'1.8s', animationDelay:'0.7s' },
    { width:70,  height:70,  background:'#1e40af', top:'70%',  left:'20%',  animationDuration:'2.8s', animationDelay:'0.2s' },
  ];

  return (
    <div className="relative min-h-[80vh] overflow-hidden">

      {/* Fondo animado con gradiente */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-green-50" />

      {/* Pelotas decorativas animadas */}
      {balls.map((b, i) => (
        <Ball key={i} style={{ ...b, position:'fixed', zIndex:0 }} />
      ))}

      {/* Contenido principal */}
      <div className="relative z-10">

        {/* Banner de bienvenida */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="text-6xl">⚽</div>
            <div>
              <h1 className="text-3xl font-bold mb-1">
                ¡Bienvenido/a, {usuario?.nombre}! 👋
              </h1>
              <p className="text-blue-200 text-lg">
                Reserva tu cancha de fútbol o vóley en minutos. Rápido, fácil y seguro.
              </p>
            </div>
          </div>
        </div>

        {/* Cards de acceso rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/canchas"
            className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-blue-600">
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">⚽</div>
            <h2 className="text-xl font-bold text-blue-900 mb-2">Ver Canchas</h2>
            <p className="text-gray-500 text-sm">Consulta disponibilidad y reserva tu cancha favorita de fútbol o vóley.</p>
            <span className="inline-block mt-3 text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform duration-300">
              Ver canchas →
            </span>
          </Link>

          <Link to="/reservas"
            className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-green-600">
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">📋</div>
            <h2 className="text-xl font-bold text-blue-900 mb-2">Mis Reservas</h2>
            <p className="text-gray-500 text-sm">Revisa y gestiona todas tus reservas activas y el historial completo.</p>
            <span className="inline-block mt-3 text-green-600 font-semibold text-sm group-hover:translate-x-1 transition-transform duration-300">
              Ver reservas →
            </span>
          </Link>

          {usuario?.rol === 'administrador' ? (
            <Link to="/admin"
              className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-yellow-500">
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">🔧</div>
              <h2 className="text-xl font-bold text-blue-900 mb-2">Panel Admin</h2>
              <p className="text-gray-500 text-sm">Gestiona canchas, horarios, reservas y genera reportes de ocupación.</p>
              <span className="inline-block mt-3 text-yellow-600 font-semibold text-sm group-hover:translate-x-1 transition-transform duration-300">
                Ir al panel →
              </span>
            </Link>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="text-5xl mb-3">🏆</div>
              <h2 className="text-xl font-bold text-blue-900 mb-2">¿Necesitas ayuda?</h2>
              <p className="text-gray-500 text-sm">Contáctanos por WhatsApp para reservar o consultar disponibilidad.</p>
              <a href="https://wa.me/51930463476?text=Hola,%20quiero%20información%20sobre%20las%20canchas%20deportivas"
                target="_blank" rel="noopener noreferrer"
                className="inline-block mt-3 text-green-600 font-semibold text-sm hover:translate-x-1 transition-transform duration-300">
                💬 Escribir al admin →
              </a>
            </div>
          )}
        </div>

        {/* Sección informativa */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">🏟️ Nuestras Instalaciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="text-3xl mb-2">⚽</div>
              <h3 className="font-bold text-green-800 mb-1">Canchas de Fútbol</h3>
              <p className="text-green-700 text-sm">Grass sintético de primera calidad. Iluminación nocturna. Disponibles todos los días.</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="text-3xl mb-2">🏐</div>
              <h3 className="font-bold text-yellow-800 mb-1">Canchas de Vóley</h3>
              <p className="text-yellow-700 text-sm">Superficie reglamentaria. Perfectas para competencias y entrenamientos.</p>
            </div>
          </div>
          <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-200 flex items-center gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <p className="font-semibold text-blue-900">Horario de atención: 6:00 AM – 10:00 PM</p>
              <p className="text-blue-700 text-sm">Reserva con anticipación para asegurar tu horario favorito.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
