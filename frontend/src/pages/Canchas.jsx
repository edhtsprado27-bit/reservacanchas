import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Canchas() {
  const { usuario } = useAuth();
  const navigate    = useNavigate();

  const [canchas,   setCanchas]   = useState([]);
  const [tipo,      setTipo]      = useState('todos');
  const [selected,  setSelected]  = useState(null);
  const [fecha,     setFecha]     = useState('');
  const [horarios,  setHorarios]  = useState([]);
  const [horSel,    setHorSel]    = useState(null);
  const [loadH,     setLoadH]     = useState(false);
  const [msg,       setMsg]       = useState('');
  const [error,     setError]     = useState('');

  // Cargar canchas
  useEffect(() => {
    const params = tipo !== 'todos' ? `?tipo=${tipo}` : '';
    api.get(`/canchas${params}`).then(r => setCanchas(r.data.data));
  }, [tipo]);

  // Cargar horarios al cambiar cancha o fecha
  useEffect(() => {
    if (!selected || !fecha) return;
    setLoadH(true); setHorarios([]); setHorSel(null);
    api.get(`/canchas/${selected.id}/horarios?fecha=${fecha}`)
      .then(r => setHorarios(r.data.data))
      .finally(() => setLoadH(false));
  }, [selected, fecha]);

  const hoy = new Date().toISOString().split('T')[0];

  const handleReservar = async () => {
    if (!usuario) { navigate('/login'); return; }
    if (!horSel)  { setError('Selecciona un horario.'); return; }
    setError(''); setMsg('');
    try {
      await api.post('/reservas', {
        canchaId:   selected.id,
        horarioId:  horSel.id,
        fecha,
        horaInicio: horSel.hora_inicio,
        horaFin:    horSel.hora_fin,
      });
      setMsg('✅ ¡Reserva confirmada! Puedes verla en "Mis Reservas".');
      setHorSel(null);
      // Recargar horarios
      const r = await api.get(`/canchas/${selected.id}/horarios?fecha=${fecha}`);
      setHorarios(r.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al reservar.');
    }
  };

  const estadoColor = (estado) => {
    if (estado === 'disponible') return 'bg-green-100 border-green-400 text-green-800 hover:bg-green-200 cursor-pointer';
    if (estado === 'reservado')  return 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed';
    return 'bg-red-100 border-red-300 text-red-600 cursor-not-allowed';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Canchas Disponibles</h1>

      {/* Filtro de tipo */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {['todos', 'futbol', 'voley'].map(t => (
          <button key={t} onClick={() => { setTipo(t); setSelected(null); setHorarios([]); }}
            className={`px-5 py-2 rounded-full font-semibold border transition
              ${tipo === t ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'}`}>
            {t === 'todos' ? '🏟 Todas' : t === 'futbol' ? '⚽ Fútbol' : '🏐 Vóley'}
          </button>
        ))}
      </div>

      {/* Grid de canchas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {canchas.map(c => (
          <div key={c.id} onClick={() => { setSelected(c); setHorarios([]); setHorSel(null); setMsg(''); setError(''); }}
            className={`bg-white rounded-xl shadow p-5 cursor-pointer border-2 transition
              ${selected?.id === c.id ? 'border-blue-600 shadow-md' : 'border-transparent hover:border-blue-300'}`}>
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-bold text-blue-900">{c.nombre}</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${c.tipo === 'futbol' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {c.tipo === 'futbol' ? '⚽ Fútbol' : '🏐 Vóley'}
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-3">📍 {c.ubicacion}</p>
            <p className="text-blue-900 font-bold text-lg">S/ {parseFloat(c.precio_hora).toFixed(2)} / hora</p>
          </div>
        ))}
        {canchas.length === 0 && (
          <div className="col-span-3 text-center text-gray-400 py-12">No hay canchas disponibles.</div>
        )}
      </div>

      {/* Selección de fecha y horarios */}
      {selected && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">
            {selected.nombre} — Selecciona fecha y horario
          </h2>
          <input type="date" min={hoy} value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {loadH && <p className="text-gray-400">Cargando horarios...</p>}

          {horarios.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                {horarios.map(h => (
                  <button key={h.id}
                    disabled={h.estado !== 'disponible'}
                    onClick={() => setHorSel(h)}
                    className={`border-2 rounded-xl p-3 text-center transition
                      ${estadoColor(h.estado)}
                      ${horSel?.id === h.id ? '!bg-blue-600 !text-white !border-blue-600' : ''}`}>
                    <div className="font-bold text-sm">{h.hora_inicio} – {h.hora_fin}</div>
                    <div className="text-xs mt-1 capitalize">{h.estado}</div>
                  </button>
                ))}
              </div>

              {horSel && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Cancha:</strong> {selected.nombre} ({selected.tipo}) |{' '}
                    <strong>Fecha:</strong> {fecha} |{' '}
                    <strong>Hora:</strong> {horSel.hora_inicio} – {horSel.hora_fin} |{' '}
                    <strong>Monto:</strong> S/ {parseFloat(selected.precio_hora).toFixed(2)}
                  </p>
                </div>
              )}

              {msg   && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-3">{msg}</div>}
              {error && <div className="bg-red-100   border border-red-400   text-red-700   px-4 py-3 rounded mb-3">{error}</div>}

              <button onClick={handleReservar} disabled={!horSel}
                className="bg-blue-900 text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-40">
                Confirmar Reserva
              </button>
            </>
          )}

          {!loadH && fecha && horarios.length === 0 && (
            <p className="text-gray-400">No hay horarios para esa fecha.</p>
          )}
        </div>
      )}
    </div>
  );
}
