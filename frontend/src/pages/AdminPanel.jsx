import { useState, useEffect, useCallback } from 'react';
import AdminReportes from './AdminReportes';
import api from '../services/api';

const fmtHora  = (h) => { if (!h) return ''; if (String(h).includes('T')) return String(h).split('T')[1].substring(0,5); return String(h).substring(0,5); };
const fmtFecha = (f) => { if (!f) return ''; const s = String(f).split('T')[0]; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };

const DIAS_ES  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmtDia(fechaStr) {
  const d = new Date(fechaStr + 'T12:00:00');
  return { dia: DIAS_ES[d.getDay()], num: d.getDate(), mes: MESES_ES[d.getMonth()] };
}

const HORAS = [
  '06:00','07:00','08:00','09:00','10:00','11:00',
  '12:00','13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00','21:00'
];

function proximosDias(inicio, n = 7) {
  const dias = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + inicio + i);
    dias.push(d.toISOString().split('T')[0]);
  }
  return dias;
}

const estadoBadge = (e) => ({
  confirmada: 'bg-green-100 text-green-800',
  pendiente:  'bg-yellow-100 text-yellow-800',
  cancelada:  'bg-red-100 text-red-600',
  completada: 'bg-gray-200 text-gray-600',
}[e] || 'bg-gray-100');

export default function AdminPanel() {
  const [tab,        setTab]        = useState('grilla');
  const [reservas,   setReservas]   = useState([]);
  const [canchas,    setCanchas]    = useState([]);
  const [reporte,    setReporte]    = useState([]);
  const [desde,      setDesde]      = useState('');
  const [hasta,      setHasta]      = useState('');
  const [msg,        setMsg]        = useState('');
  const [editRes,    setEditRes]    = useState(null);
  const [editCancha, setEditCancha] = useState(null);
  const [nuevaC,     setNuevaC]     = useState({ nombre:'', tipo:'futbol', ubicacion:'', precio_hora:'' });
  const [semana,     setSemana]     = useState(0);
  const [canchaGrilla, setCanchaGrilla] = useState(null);
  const [grilla,     setGrilla]     = useState({});
  const [loadGrid,   setLoadGrid]   = useState(false);
  const [busqueda,   setBusqueda]   = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');

  const dias = proximosDias(semana * 7, 7);

  const cargarReservas = useCallback(() =>
    api.get('/reservas/todas').then(r => setReservas(r.data.data)).catch(() => {}), []);
  const cargarCanchas  = useCallback(() =>
    api.get('/canchas').then(r => {
      setCanchas(r.data.data);
      if (!canchaGrilla && r.data.data.length > 0) setCanchaGrilla(r.data.data[0]);
    }).catch(() => {}), [canchaGrilla]);

  useEffect(() => {
    cargarReservas();
    cargarCanchas();
  }, []);

  useEffect(() => {
    if (tab === 'grilla' && canchaGrilla) cargarGrilla();
  }, [tab, canchaGrilla, semana]);

  // Auto-refresh cada 30s
  useEffect(() => {
    const interval = setInterval(() => {
      cargarReservas();
      if (tab === 'grilla' && canchaGrilla) cargarGrilla();
    }, 30000);
    return () => clearInterval(interval);
  }, [tab, canchaGrilla, semana]);

  const cargarGrilla = async () => {
    if (!canchaGrilla) return;
    setLoadGrid(true);
    const nueva = {};
    await Promise.all(dias.map(async (fecha) => {
      try {
        const r = await api.get(`/canchas/${canchaGrilla.id}/horarios?fecha=${fecha}`);
        nueva[fecha] = {};
        r.data.data.forEach(h => {
          nueva[fecha][h.hora_inicio] = {
            estado: h.estado, id: h.id,
            hora_fin: h.hora_fin,
            reserva: reservas.find(rv =>
              rv.cancha === canchaGrilla.nombre &&
              String(rv.fecha).split('T')[0] === fecha &&
              fmtHora(rv.hora_inicio) === h.hora_inicio
            )
          };
        });
      } catch { nueva[fecha] = {}; }
    }));
    setGrilla(nueva);
    setLoadGrid(false);
  };

  const colorCelda = (fecha, hora) => {
    const c = grilla[fecha]?.[hora];
    if (!c) return 'bg-gray-100 text-gray-300 text-xs';
    if (c.estado === 'reservado')  return 'bg-red-500 text-white text-xs font-semibold cursor-pointer hover:bg-red-600';
    if (c.estado === 'bloqueado')  return 'bg-gray-400 text-white text-xs';
    if (c.estado === 'disponible') return 'bg-green-400 text-white text-xs font-semibold';
    return 'bg-gray-100 text-gray-300 text-xs';
  };

  const textoCelda = (fecha, hora) => {
    const c = grilla[fecha]?.[hora];
    if (!c) return '—';
    if (c.estado === 'reservado') {
      const r = c.reserva;
      return r ? `🔴 ${r.usuario?.split(' ')[0] || 'Reservado'}` : '🔴 Reservado';
    }
    if (c.estado === 'bloqueado')  return '🚫';
    if (c.estado === 'disponible') return '✅ Libre';
    return '—';
  };

  const cancelarAdmin = async (id) => {
    const motivo = prompt('Motivo de cancelación:');
    if (!motivo) return;
    try {
      await api.delete(`/reservas/${id}`, { data: { motivo } });
      setMsg('✅ Reserva cancelada.');
      cargarReservas();
      if (tab === 'grilla') cargarGrilla();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
  };

  const guardarReserva = async () => {
    try {
      await api.put(`/reservas/${editRes.id}`, {
        fecha:       String(editRes.fecha).split('T')[0],
        hora_inicio: editRes.hora_inicio,
        hora_fin:    editRes.hora_fin,
        estado:      editRes.estado,
      });
      setMsg('✅ Reserva actualizada.');
      setEditRes(null);
      cargarReservas();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
  };

  const guardarCancha = async () => {
    try {
      await api.put(`/canchas/${editCancha.id}`, editCancha);
      setMsg('✅ Cancha actualizada.');
      setEditCancha(null);
      cargarCanchas();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
  };

  const crearCancha = async (e) => {
    e.preventDefault();
    try {
      await api.post('/canchas', nuevaC);
      setMsg('✅ Cancha creada.');
      setNuevaC({ nombre:'', tipo:'futbol', ubicacion:'', precio_hora:'' });
      cargarCanchas();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
  };

  const generarReporte = async () => {
    if (!desde || !hasta) { setMsg('❌ Selecciona fechas.'); return; }
    try {
      const r = await api.get(`/reservas/reporte?desde=${desde}&hasta=${hasta}`);
      setReporte(r.data.data); setMsg('');
    } catch { setMsg('❌ Error al generar reporte.'); }
  };

  const reservasFiltradas = reservas.filter(r => {
    const matchEstado   = filtroEstado === 'todas' || r.estado === filtroEstado;
    const matchBusqueda = !busqueda ||
      r.usuario?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.cancha?.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const tabs = [
    { id:'grilla',   label:'📅 Grilla de Canchas'   },
    { id:'reservas', label:'📋 Lista de Reservas'    },
    { id:'canchas',  label:'🏟 Gestionar Canchas'    },
    { id:'reporte',  label:'📊 Reportes de Ingresos'  },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white drop-shadow mb-2">Panel Administrativo</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label:'Total Reservas',  val: reservas.length,                                    color:'bg-blue-900'  },
          { label:'Confirmadas',     val: reservas.filter(r=>r.estado==='confirmada').length,  color:'bg-green-700' },
          { label:'Canceladas',      val: reservas.filter(r=>r.estado==='cancelada').length,   color:'bg-red-700'   },
          { label:'Hoy',             val: reservas.filter(r=>String(r.fecha).split('T')[0]===new Date().toISOString().split('T')[0]).length, color:'bg-yellow-600' },
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white rounded-xl p-3 text-center shadow`}>
            <div className="text-2xl font-bold">{s.val}</div>
            <div className="text-xs opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded mb-4 text-sm ${msg.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {msg} <button onClick={() => setMsg('')} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setMsg(''); setEditRes(null); setEditCancha(null); }}
            className={`px-4 py-2 font-semibold text-sm rounded-xl transition
              ${tab === t.id ? 'bg-blue-900 text-white shadow-lg' : 'bg-white/80 text-blue-900 hover:bg-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════ TAB: GRILLA ══════ */}
      {tab === 'grilla' && (
        <div className="bg-white/95 rounded-2xl shadow-xl p-4">
          {/* Selector de cancha */}
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <span className="font-bold text-blue-900 text-sm">Cancha:</span>
            {canchas.map(c => (
              <button key={c.id}
                onClick={() => { setCanchaGrilla(c); setGrilla({}); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition
                  ${canchaGrilla?.id === c.id
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-white text-blue-900 border-blue-200 hover:border-blue-500'}`}>
                {c.tipo === 'futbol' ? '⚽' : '🏐'} {c.nombre}
              </button>
            ))}
            <button onClick={() => { cargarReservas(); cargarGrilla(); }}
              className="ml-auto bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition">
              🔄 Actualizar
            </button>
          </div>

          {/* Navegación de semanas */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSemana(s => Math.max(0,s-1))} disabled={semana===0}
              className="bg-blue-900 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-blue-800 transition">
              ← Semana anterior
            </button>
            <span className="font-bold text-blue-900 bg-blue-50 px-4 py-2 rounded-xl text-sm">
              {semana===0 ? '📅 Esta semana' : semana===1 ? '📅 Próxima semana' : `📅 Semana +${semana}`}
            </span>
            <button onClick={() => setSemana(s => s+1)}
              className="bg-blue-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-800 transition">
              Siguiente semana →
            </button>
          </div>

          {/* Leyenda */}
          <div className="flex gap-4 mb-3 text-xs flex-wrap">
            <span className="flex items-center gap-1"><span className="w-4 h-4 bg-green-400 rounded inline-block"/> Disponible</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 bg-red-500 rounded inline-block"/> Reservado</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 bg-gray-100 border rounded inline-block"/> Sin horario</span>
          </div>

          {loadGrid ? (
            <div className="text-center py-12 text-blue-900 font-bold text-lg">⏳ Cargando grilla...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs min-w-[700px]">
                <thead>
                  <tr>
                    <th className="bg-blue-900 text-white p-2 sticky left-0 z-10 min-w-[80px] rounded-tl-lg">
                      ⏰ Hora
                    </th>
                    {dias.map(fecha => {
                      const { dia, num, mes } = fmtDia(fecha);
                      const esHoy = fecha === new Date().toISOString().split('T')[0];
                      return (
                        <th key={fecha}
                          className={`p-2 text-center font-bold min-w-[110px] ${esHoy ? 'bg-yellow-500 text-white' : 'bg-blue-800 text-white'}`}>
                          <div className="text-xs">{dia}</div>
                          <div className="text-xl leading-tight">{num}</div>
                          <div className="text-xs opacity-80">{mes}</div>
                          {esHoy && <div className="text-xs bg-white text-yellow-600 rounded px-1 mt-0.5 font-bold">HOY</div>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {HORAS.map((hora, hi) => (
                    <tr key={hora} className={hi%2===0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="bg-blue-900 text-white font-bold p-2 text-center sticky left-0 z-10 text-sm">
                        {hora}
                      </td>
                      {dias.map(fecha => {
                        const celda = grilla[fecha]?.[hora];
                        const reserva = celda?.reserva;
                        return (
                          <td key={fecha}
                            className={`p-1 text-center border border-gray-200 transition ${colorCelda(fecha, hora)}`}>
                            <div>{textoCelda(fecha, hora)}</div>
                            {reserva && (
                              <div className="text-xs mt-0.5 leading-tight">
                                {reserva.usuario?.split(' ')[0]}
                                <button
                                  onClick={() => cancelarAdmin(reserva.id)}
                                  className="block mx-auto mt-0.5 bg-white/30 hover:bg-white/50 rounded px-1 text-xs">
                                  ✕ Cancelar
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════ TAB: LISTA RESERVAS ══════ */}
      {tab === 'reservas' && (
        <div>
          <div className="bg-white/90 rounded-xl p-3 mb-4 flex flex-wrap gap-3 items-center">
            <input type="text" placeholder="🔍 Buscar usuario o cancha..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[180px] focus:ring-2 focus:ring-blue-400 focus:outline-none"/>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none">
              <option value="todas">Todas</option>
              <option value="confirmada">Confirmadas</option>
              <option value="pendiente">Pendientes</option>
              <option value="cancelada">Canceladas</option>
              <option value="completada">Completadas</option>
            </select>
            <button onClick={cargarReservas}
              className="bg-blue-900 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-800">
              🔄 Actualizar
            </button>
          </div>

          <div className="space-y-3">
            {reservasFiltradas.length === 0 && (
              <div className="bg-white/90 rounded-xl p-8 text-center text-gray-400">No hay reservas.</div>
            )}
            {reservasFiltradas.map(r => (
              <div key={r.id} className="bg-white/95 rounded-xl shadow p-4">
                {editRes?.id === r.id ? (
                  <div>
                    <h3 className="font-bold text-blue-900 mb-3">✏️ Editando Reserva #{r.id}</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {[
                        { key:'fecha',       label:'Fecha', type:'date' },
                        { key:'estado',      label:'Estado',type:'select' },
                        { key:'hora_inicio', label:'Hora inicio', type:'time' },
                        { key:'hora_fin',    label:'Hora fin',    type:'time' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                          {f.type === 'select' ? (
                            <select value={editRes.estado}
                              onChange={e => setEditRes({...editRes, estado: e.target.value})}
                              className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none">
                              {['pendiente','confirmada','cancelada','completada'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <input type={f.type}
                              value={f.key==='fecha' ? (String(editRes.fecha).split('T')[0]) : fmtHora(editRes[f.key])}
                              onChange={e => setEditRes({...editRes, [f.key]: e.target.value})}
                              className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"/>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={guardarReserva} className="bg-blue-900 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-800">💾 Guardar</button>
                      <button onClick={() => setEditRes(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-300">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-blue-900">👤 {r.usuario}</span>
                        <span className="text-xs text-gray-400">{r.correo}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${estadoBadge(r.estado)}`}>{r.estado}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-700">🏟 {r.cancha}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${r.tipo==='futbol'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>
                          {r.tipo==='futbol'?'⚽':'🏐'} {r.tipo}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">
                        📅 {fmtFecha(r.fecha)} &nbsp;|&nbsp;
                        🕐 {fmtHora(r.hora_inicio)} – {fmtHora(r.hora_fin)} &nbsp;|&nbsp;
                        💰 S/ {parseFloat(r.monto||0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditRes({...r})} className="bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1.5 rounded text-sm font-semibold hover:bg-blue-200">✏️ Editar</button>
                      {(r.estado==='confirmada'||r.estado==='pendiente') && (
                        <button onClick={() => cancelarAdmin(r.id)} className="bg-red-100 text-red-700 border border-red-300 px-3 py-1.5 rounded text-sm font-semibold hover:bg-red-200">✕ Cancelar</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════ TAB: CANCHAS ══════ */}
      {tab === 'canchas' && (
        <div>
          <form onSubmit={crearCancha} className="bg-white/95 rounded-xl shadow p-6 mb-6">
            <h2 className="font-bold text-blue-900 mb-4">➕ Agregar nueva cancha</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key:'nombre',      label:'Nombre',          type:'text',   ph:'Ej: Cancha Fútbol 3' },
                { key:'ubicacion',   label:'Ubicación',       type:'text',   ph:'Ej: Sector Norte'    },
                { key:'precio_hora', label:'Precio/hora (S/)',type:'number', ph:'25.00'               },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type} required placeholder={f.ph}
                    value={nuevaC[f.key]}
                    onChange={e => setNuevaC({...nuevaC, [f.key]: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={nuevaC.tipo} onChange={e => setNuevaC({...nuevaC, tipo: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="futbol">⚽ Fútbol</option>
                  <option value="voley">🏐 Vóley</option>
                </select>
              </div>
            </div>
            <button type="submit" className="mt-4 bg-blue-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800">Crear Cancha</button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {canchas.map(c => (
              <div key={c.id} className="bg-white/95 rounded-xl shadow p-4">
                {editCancha?.id === c.id ? (
                  <div>
                    <h3 className="font-bold text-blue-900 mb-3">✏️ Editando cancha</h3>
                    <div className="space-y-3">
                      {[
                        { key:'nombre',      label:'Nombre',          type:'text'   },
                        { key:'ubicacion',   label:'Ubicación',       type:'text'   },
                        { key:'precio_hora', label:'Precio/hora (S/)',type:'number' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                          <input type={f.type} value={editCancha[f.key]||''}
                            onChange={e => setEditCancha({...editCancha, [f.key]: e.target.value})}
                            className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"/>
                        </div>
                      ))}
                      {[
                        { key:'tipo',   label:'Tipo',   opts:[['futbol','⚽ Fútbol'],['voley','🏐 Vóley']] },
                        { key:'estado', label:'Estado', opts:[['activa','✅ Activa'],['inactiva','❌ Inactiva'],['mantenimiento','🔧 Mantenimiento']] },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                          <select value={editCancha[f.key]} onChange={e => setEditCancha({...editCancha, [f.key]: e.target.value})}
                            className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none">
                            {f.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={guardarCancha} className="bg-blue-900 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-800">💾 Guardar</button>
                      <button onClick={() => setEditCancha(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-300">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-blue-900">{c.nombre}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${c.tipo==='futbol'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>
                        {c.tipo==='futbol'?'⚽ Fútbol':'🏐 Vóley'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">📍 {c.ubicacion}</p>
                    <p className="text-blue-900 font-bold">S/ {parseFloat(c.precio_hora).toFixed(2)}/h</p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">Estado: {c.estado}</p>
                    <button onClick={() => setEditCancha({...c})}
                      className="mt-3 w-full bg-blue-100 text-blue-800 border border-blue-300 px-4 py-1.5 rounded text-sm font-semibold hover:bg-blue-200">
                      ✏️ Editar cancha
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════ TAB: REPORTES ══════ */}
      {tab === 'reporte' && <AdminReportes />}
    </div>
  );
}
