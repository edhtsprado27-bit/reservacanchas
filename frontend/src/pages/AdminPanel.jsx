import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminPanel() {
  const [tab,      setTab]      = useState('reservas');
  const [reservas, setReservas] = useState([]);
  const [canchas,  setCanchas]  = useState([]);
  const [reporte,  setReporte]  = useState([]);
  const [desde,    setDesde]    = useState('');
  const [hasta,    setHasta]    = useState('');
  const [msg,      setMsg]      = useState('');
  const [nuevaCancha, setNuevaCancha] = useState({ nombre:'', tipo:'futbol', ubicacion:'', precio_hora:'' });

  useEffect(() => {
    if (tab === 'reservas') api.get('/reservas/todas').then(r => setReservas(r.data.data));
    if (tab === 'canchas')  api.get('/canchas').then(r => setCanchas(r.data.data));
  }, [tab]);

  const cancelarAdmin = async (id) => {
    const motivo = prompt('Ingresa el motivo de cancelación:');
    if (!motivo) return;
    try {
      await api.delete(`/reservas/${id}`, { data: { motivo } });
      setMsg('✅ Reserva cancelada.');
      api.get('/reservas/todas').then(r => setReservas(r.data.data));
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
  };

  const crearCancha = async (e) => {
    e.preventDefault();
    try {
      await api.post('/canchas', nuevaCancha);
      setMsg('✅ Cancha creada exitosamente.');
      setNuevaCancha({ nombre:'', tipo:'futbol', ubicacion:'', precio_hora:'' });
      api.get('/canchas').then(r => setCanchas(r.data.data));
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
  };

  const generarReporte = async () => {
    if (!desde || !hasta) { setMsg('❌ Selecciona el rango de fechas.'); return; }
    try {
      const r = await api.get(`/reservas/reporte?desde=${desde}&hasta=${hasta}`);
      setReporte(r.data.data);
      setMsg('');
    } catch (err) { setMsg('❌ Error al generar reporte.'); }
  };

  const tabs = [
    { id: 'reservas', label: '📋 Reservas' },
    { id: 'canchas',  label: '🏟 Canchas' },
    { id: 'reporte',  label: '📊 Reportes' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Panel Administrativo</h1>

      {msg && (
        <div className={`px-4 py-3 rounded mb-4 ${msg.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setMsg(''); }}
            className={`px-5 py-2 font-semibold text-sm rounded-t transition
              ${tab === t.id ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Reservas */}
      {tab === 'reservas' && (
        <div className="space-y-3">
          {reservas.map(r => (
            <div key={r.id} className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold text-blue-900">{r.usuario} — {r.cancha} ({r.tipo})</p>
                <p className="text-sm text-gray-500">
                  📅 {r.fecha?.split('T')[0]} | 🕐 {r.hora_inicio}–{r.hora_fin} | S/ {parseFloat(r.monto||0).toFixed(2)}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                  ${r.estado === 'confirmada' ? 'bg-green-100 text-green-800' : r.estado === 'cancelada' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {r.estado}
                </span>
              </div>
              {(r.estado === 'confirmada' || r.estado === 'pendiente') && (
                <button onClick={() => cancelarAdmin(r.id)}
                  className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition">
                  Cancelar
                </button>
              )}
            </div>
          ))}
          {reservas.length === 0 && <p className="text-gray-400 text-center py-8">No hay reservas registradas.</p>}
        </div>
      )}

      {/* TAB: Canchas */}
      {tab === 'canchas' && (
        <div>
          {/* Formulario nueva cancha */}
          <form onSubmit={crearCancha} className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="font-bold text-blue-900 mb-4">➕ Agregar nueva cancha</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" required placeholder="Ej: Cancha Fútbol 3"
                  value={nuevaCancha.nombre}
                  onChange={e => setNuevaCancha({...nuevaCancha, nombre: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={nuevaCancha.tipo}
                  onChange={e => setNuevaCancha({...nuevaCancha, tipo: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="futbol">⚽ Fútbol</option>
                  <option value="voley">🏐 Vóley</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input type="text" required placeholder="Ej: Sector Norte"
                  value={nuevaCancha.ubicacion}
                  onChange={e => setNuevaCancha({...nuevaCancha, ubicacion: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio por hora (S/)</label>
                <input type="number" required min="1" step="0.50" placeholder="25.00"
                  value={nuevaCancha.precio_hora}
                  onChange={e => setNuevaCancha({...nuevaCancha, precio_hora: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <button type="submit"
              className="mt-4 bg-blue-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 transition">
              Crear Cancha
            </button>
          </form>

          {/* Lista de canchas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {canchas.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-blue-900">{c.nombre}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${c.tipo === 'futbol' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {c.tipo === 'futbol' ? '⚽ Fútbol' : '🏐 Vóley'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">📍 {c.ubicacion}</p>
                <p className="text-blue-900 font-bold">S/ {parseFloat(c.precio_hora).toFixed(2)}/h</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Reportes */}
      {tab === 'reporte' && (
        <div>
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="font-bold text-blue-900 mb-4">📊 Reporte de Ocupación</h2>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button onClick={generarReporte}
                className="bg-blue-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 transition">
                Generar
              </button>
            </div>
          </div>

          {reporte.length > 0 && (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    {['Cancha','Tipo','Total Reservas','Confirmadas','Canceladas','Ingresos (S/)'].map(h => (
                      <th key={h} className="px-4 py-3 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reporte.map((r, i) => (
                    <tr key={i} className={i % 2 === 1 ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3 font-medium">{r.cancha}</td>
                      <td className="px-4 py-3 capitalize">{r.tipo}</td>
                      <td className="px-4 py-3">{r.total_reservas}</td>
                      <td className="px-4 py-3 text-green-700">{r.confirmadas}</td>
                      <td className="px-4 py-3 text-red-600">{r.canceladas}</td>
                      <td className="px-4 py-3 font-bold">S/ {parseFloat(r.ingresos||0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
