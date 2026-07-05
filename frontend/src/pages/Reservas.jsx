import { useState, useEffect } from 'react';
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

  if (loading) return <div className="text-center py-12 text-gray-400">Cargando reservas...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Mis Reservas</h1>

      {msg   && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{msg}</div>}
      {error && <div className="bg-red-100   border border-red-400   text-red-700   px-4 py-3 rounded mb-4">{error}</div>}

      {reservas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📋</p>
          <p>No tienes reservas aún. ¡Reserva una cancha!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservas.map(r => (
            <div key={r.id} className="bg-white rounded-xl shadow p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-blue-900">{r.cancha}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full capitalize">{r.tipo}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${estadoBadge(r.estado)}`}>
                    {r.estado}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  📅 {r.fecha?.split('T')[0]} &nbsp;|&nbsp;
                  🕐 {r.hora_inicio} – {r.hora_fin} &nbsp;|&nbsp;
                  💰 S/ {parseFloat(r.monto || 0).toFixed(2)}
                </p>
              </div>
              {(r.estado === 'confirmada' || r.estado === 'pendiente') && (
                <button onClick={() => cancelar(r.id)}
                  className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition whitespace-nowrap">
                  Cancelar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
