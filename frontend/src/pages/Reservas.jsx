import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const estadoBadge = (e) => {
  const map = {
    confirmada: 'bg-green-100 text-green-800',
    pendiente:  'bg-yellow-100 text-yellow-800',
    cancelada:  'bg-red-100 text-red-600',
    completada: 'bg-gray-100 text-gray-600',
  };
  return map[e] || 'bg-gray-100';
};

// Formatear hora peruana (HH:MM)
const fmtHora = (h) => {
  if (!h) return '';
  if (h.includes('T')) return h.split('T')[1].substring(0, 5);
  return h.substring(0, 5);
};

// Formatear fecha peruana
const fmtFecha = (f) => {
  if (!f) return '';
  const d = new Date(f);
  return d.toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric' });
};

export default function Reservas() {
  const [reservas, setReservas] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [msg,      setMsg]      = useState('');
  const [error,    setError]    = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await api.get('/reservas/historial');
      setReservas(r.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const cancelar = async (id) => {
    if (!window.confirm('¿Estás seguro de cancelar esta reserva?')) return;
    setMsg(''); setError('');
    try {
      await api.delete(`/reservas/${id}`);
      setMsg('✅ Reserva cancelada correctamente.');
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cancelar.');
    }
  };

  if (loading) return <div className="text-center py-12 text-white text-lg">Cargando reservas...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white drop-shadow">Mis Reservas</h1>
        <Link to="/canchas"
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-5 py-2.5 rounded-xl font-bold transition shadow-lg hover:scale-105 duration-200">
          <span className="text-2xl font-bold leading-none">+</span>
          <span>Nueva Reserva</span>
        </Link>
      </div>

      {msg   && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{msg}</div>}
      {error && <div className="bg-red-100   border border-red-400   text-red-700   px-4 py-3 rounded mb-4">{error}</div>}

      {reservas.length === 0 ? (
        <div className="text-center py-16 bg-white/90 rounded-2xl shadow-xl">
          <p className="text-6xl mb-4">📋</p>
          <p className="text-gray-500 text-lg mb-6">Aún no tienes reservas.</p>
          <Link to="/canchas"
            className="inline-flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-800 transition shadow-lg text-lg">
            <span className="text-2xl font-bold">+</span>
            Hacer mi primera reserva
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservas.map(r => (
            <div key={r.id} className="bg-white rounded-xl shadow-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-xl transition">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-blue-900">{r.cancha}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full capitalize">{r.tipo}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${estadoBadge(r.estado)}`}>
                    {r.estado}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  📅 {fmtFecha(r.fecha)} &nbsp;|&nbsp;
                  🕐 {fmtHora(r.hora_inicio)} – {fmtHora(r.hora_fin)} &nbsp;|&nbsp;
                  💰 S/ {parseFloat(r.monto || 0).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {(r.estado === 'confirmada' || r.estado === 'pendiente') && (
                  <button onClick={() => cancelar(r.id)}
                    className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition">
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}

          <Link to="/canchas"
            className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-white/50 text-white py-4 rounded-xl font-semibold hover:bg-white/10 transition text-lg">
            <span className="text-3xl font-bold leading-none">+</span>
            Agregar nueva reserva
          </Link>
        </div>
      )}
    </div>
  );
}
