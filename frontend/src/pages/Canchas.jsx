import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Generar los próximos 7 días desde hoy
function proximosDias(n = 7) {
  const dias = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dias.push(d.toISOString().split('T')[0]);
  }
  return dias;
}

const DIAS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
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

export default function Canchas() {
  const { usuario } = useAuth();
  const navigate    = useNavigate();
  const esAdmin     = usuario?.rol === 'administrador';

  const [canchas,    setCanchas]    = useState([]);
  const [tipo,       setTipo]       = useState('todos');
  const [selected,   setSelected]   = useState(null);
  const [grilla,     setGrilla]     = useState({}); // { "2026-07-08": { "08:00": {estado, id} } }
  const [loadGrid,   setLoadGrid]   = useState(false);
  const [celSel,     setCelSel]     = useState(null); // { fecha, hora_inicio, hora_fin, horarioId }
  const [showForm,   setShowForm]   = useState(false);
  const [msg,        setMsg]        = useState('');
  const [error,      setError]      = useState('');
  const [semana,     setSemana]     = useState(0); // 0 = esta semana, 1 = próxima, etc.

  const [form, setForm] = useState({
    nombre:'', apellido:'', celular:'',
    hora_inicio:'', hora_fin:'', fecha_manual:'',
    captura: null
  });

  const dias = proximosDias(14).slice(semana * 7, semana * 7 + 7);

  useEffect(() => {
    const params = tipo !== 'todos' ? `?tipo=${tipo}` : '';
    api.get(`/canchas${params}`).then(r => setCanchas(r.data.data));
  }, [tipo]);

  // Cargar grilla de horarios para la cancha seleccionada
  useEffect(() => {
    if (!selected) return;
    cargarGrilla();
  }, [selected, semana]);

  const cargarGrilla = async () => {
    if (!selected) return;
    setLoadGrid(true);
    const nuevaGrilla = {};
    await Promise.all(dias.map(async (fecha) => {
      try {
        const r = await api.get(`/canchas/${selected.id}/horarios?fecha=${fecha}`);
        nuevaGrilla[fecha] = {};
        r.data.data.forEach(h => {
          nuevaGrilla[fecha][h.hora_inicio] = {
            estado: h.estado, id: h.id, hora_fin: h.hora_fin
          };
        });
      } catch { nuevaGrilla[fecha] = {}; }
    }));
    setGrilla(nuevaGrilla);
    setLoadGrid(false);
  };

  const handleCeldaClick = async (fecha, hora) => {
    if (!usuario) { navigate('/login'); return; }
    const celda = grilla[fecha]?.[hora];
    if (!celda || celda.estado !== 'disponible') return;

    const hora_fin = HORAS[HORAS.indexOf(hora) + 1] || '22:00';
    setCelSel({ fecha, hora_inicio: hora, hora_fin, horarioId: celda.id });
    setShowForm(true);
    setMsg(''); setError('');
    setForm({ nombre:'', apellido:'', celular:'', hora_inicio: hora, hora_fin, fecha_manual: fecha, captura: null });
  };

  const handleReservar = async () => {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.celular.trim()) {
      setError('Completa nombre, apellido y celular.'); return;
    }
    if (!esAdmin && !form.captura) {
      setError('La captura de pago es obligatoria.'); return;
    }

    const fechaFinal      = esAdmin ? form.fecha_manual  : celSel?.fecha;
    const horaInicioFinal = esAdmin ? form.hora_inicio   : celSel?.hora_inicio;
    const horaFinFinal    = esAdmin ? form.hora_fin      : celSel?.hora_fin;
    let   horarioId       = celSel?.horarioId;

    if (!fechaFinal || !horaInicioFinal || !horaFinFinal) {
      setError('Completa la fecha y horario.'); return;
    }

    setError('');
    try {
      if (esAdmin && (!celSel || celSel.fecha !== fechaFinal || celSel.hora_inicio !== horaInicioFinal)) {
        const res = await api.get(`/canchas/${selected.id}/horarios?fecha=${fechaFinal}`);
        const existente = res.data.data.find(
          h => h.hora_inicio === horaInicioFinal && h.hora_fin === horaFinFinal
        );
        if (existente) { horarioId = existente.id; }
        else {
          const rh = await api.post('/horarios', {
            canchaId: selected.id, fecha: fechaFinal,
            horaInicio: horaInicioFinal, horaFin: horaFinFinal
          });
          horarioId = rh.data.data.id;
        }
      }

      await api.post('/reservas', {
        canchaId:   selected.id,
        horarioId,
        fecha:      fechaFinal,
        horaInicio: horaInicioFinal,
        horaFin:    horaFinFinal,
        clienteNombre:   form.nombre,
        clienteApellido: form.apellido,
        clienteCelular:  form.celular,
      });

      setMsg(`✅ ¡Reserva confirmada! ${form.nombre} ${form.apellido} — ${fechaFinal} ${horaInicioFinal}`);
      setShowForm(false); setCelSel(null);
      setForm({ nombre:'', apellido:'', celular:'', hora_inicio:'', hora_fin:'', fecha_manual:'', captura:null });
      cargarGrilla(); // Recargar grilla
    } catch (err) {
      setError(err.response?.data?.message || 'Error al reservar.');
    }
  };

  const colorCelda = (fecha, hora) => {
    const celda = grilla[fecha]?.[hora];
    if (!celda) return 'bg-gray-100 text-gray-300 cursor-default text-xs';
    if (celda.estado === 'reservado')  return 'bg-red-500 text-white cursor-not-allowed text-xs font-semibold';
    if (celda.estado === 'bloqueado')  return 'bg-gray-400 text-white cursor-not-allowed text-xs';
    if (celda.estado === 'disponible') return 'bg-green-400 hover:bg-green-500 text-white cursor-pointer text-xs font-semibold transition';
    return 'bg-gray-100 text-gray-300 cursor-default text-xs';
  };

  const textoCelda = (fecha, hora) => {
    const celda = grilla[fecha]?.[hora];
    if (!celda) return '—';
    if (celda.estado === 'reservado')  return '🔴 Reservado';
    if (celda.estado === 'bloqueado')  return '🚫 Bloqueado';
    if (celda.estado === 'disponible') return '✅ Disponible';
    return '—';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white drop-shadow mb-4">Canchas Disponibles</h1>

      {/* Filtros de tipo */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {['todos','futbol','voley'].map(t => (
          <button key={t}
            onClick={() => { setTipo(t); setSelected(null); setGrilla({}); setShowForm(false); setCelSel(null); }}
            className={`px-5 py-2 rounded-full font-semibold border transition
              ${tipo === t ? 'bg-blue-900 text-white border-blue-900' : 'bg-white/90 text-blue-900 border-blue-900 hover:bg-white'}`}>
            {t === 'todos' ? '🏟 Todas' : t === 'futbol' ? '⚽ Fútbol' : '🏐 Vóley'}
          </button>
        ))}
      </div>

      {/* Cards de canchas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {canchas.map(c => (
          <div key={c.id}
            onClick={() => { setSelected(c); setShowForm(false); setCelSel(null); setMsg(''); setError(''); }}
            className={`bg-white/95 rounded-xl shadow p-5 cursor-pointer border-2 transition hover:shadow-lg
              ${selected?.id === c.id ? 'border-blue-600 shadow-xl ring-2 ring-blue-300' : 'border-transparent hover:border-blue-300'}`}>
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-bold text-blue-900 text-lg">{c.nombre}</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${c.tipo==='futbol'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>
                {c.tipo==='futbol'?'⚽ Fútbol':'🏐 Vóley'}
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-2">📍 {c.ubicacion}</p>
            <p className="text-blue-900 font-bold text-xl">S/ {parseFloat(c.precio_hora).toFixed(2)} / hora</p>
            {selected?.id === c.id && <p className="text-blue-600 text-xs mt-2 font-semibold">✓ Seleccionada</p>}
          </div>
        ))}
      </div>

      {/* GRILLA DE HORARIOS */}
      {selected && (
        <div className="bg-white/95 rounded-2xl shadow-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-bold text-blue-900">
              📅 {selected.nombre} — Horarios disponibles
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setSemana(s => Math.max(0, s-1))} disabled={semana === 0}
                className="bg-blue-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold disabled:opacity-30 hover:bg-blue-800 transition">
                ← Anterior
              </button>
              <span className="text-sm font-semibold text-blue-900 bg-blue-50 px-3 py-1 rounded-lg">
                {semana === 0 ? 'Esta semana' : semana === 1 ? 'Próxima semana' : `Semana +${semana}`}
              </span>
              <button onClick={() => setSemana(s => s+1)}
                className="bg-blue-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-800 transition">
                Siguiente →
              </button>
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex gap-4 mb-3 text-xs flex-wrap">
            <span className="flex items-center gap-1"><span className="w-4 h-4 bg-green-400 rounded inline-block"/> Disponible — clic para reservar</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 bg-red-500 rounded inline-block"/> Reservado</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 bg-gray-100 border rounded inline-block"/> Sin horario</span>
          </div>

          {loadGrid ? (
            <div className="text-center py-8 text-blue-900 font-semibold">Cargando horarios... ⏳</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs min-w-[600px]">
                <thead>
                  <tr>
                    <th className="bg-blue-900 text-white p-2 rounded-tl-lg sticky left-0 z-10 min-w-[80px]">
                      Hora / Fecha
                    </th>
                    {dias.map(fecha => {
                      const { dia, num, mes } = fmtDia(fecha);
                      const esHoy = fecha === new Date().toISOString().split('T')[0];
                      return (
                        <th key={fecha} className={`p-2 text-center font-bold min-w-[90px] ${esHoy ? 'bg-yellow-500 text-white' : 'bg-blue-800 text-white'}`}>
                          <div>{dia}</div>
                          <div className="text-lg leading-tight">{num}</div>
                          <div className="text-xs opacity-80">{mes}</div>
                          {esHoy && <div className="text-xs bg-white text-yellow-600 rounded px-1 mt-0.5">HOY</div>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {HORAS.map((hora, hi) => (
                    <tr key={hora} className={hi % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="bg-blue-900 text-white font-bold p-2 text-center sticky left-0 z-10">
                        {hora}
                      </td>
                      {dias.map(fecha => {
                        const celda = grilla[fecha]?.[hora];
                        const clickable = celda?.estado === 'disponible';
                        return (
                          <td key={fecha}
                            onClick={() => clickable && handleCeldaClick(fecha, hora)}
                            className={`p-1 text-center border border-gray-200 transition
                              ${colorCelda(fecha, hora)}
                              ${celda === celSel ? 'ring-2 ring-blue-500' : ''}
                            `}>
                            {textoCelda(fecha, hora)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Admin: modo manual */}
          {esAdmin && (
            <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-xl p-4">
              <p className="text-yellow-800 font-semibold text-sm mb-3">
                🔧 Admin — También puedes ingresar manualmente cualquier fecha y hora
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                  <input type="date" value={form.fecha_manual}
                    onChange={e => { setForm({...form, fecha_manual: e.target.value}); setShowForm(true); }}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora inicio</label>
                  <input type="time" value={form.hora_inicio}
                    onChange={e => { setForm({...form, hora_inicio: e.target.value}); setShowForm(true); }}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora fin</label>
                  <input type="time" value={form.hora_fin}
                    onChange={e => { setForm({...form, hora_fin: e.target.value}); setShowForm(true); }}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"/>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FORMULARIO DE DATOS DEL CLIENTE */}
      {selected && showForm && (
        <div className="bg-white/95 rounded-2xl shadow-xl p-6">
          <h3 className="font-bold text-blue-900 text-lg mb-1">
            📝 Confirmar Reserva
          </h3>
          {celSel && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-800">
              <strong>Cancha:</strong> {selected.nombre} &nbsp;|&nbsp;
              <strong>Fecha:</strong> {celSel.fecha} &nbsp;|&nbsp;
              <strong>Hora:</strong> {celSel.hora_inicio} – {celSel.hora_fin} &nbsp;|&nbsp;
              <strong>Precio:</strong> S/ {parseFloat(selected.precio_hora).toFixed(2)}/h
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" placeholder="Nombre del cliente"
                value={form.nombre}
                onChange={e => setForm({...form, nombre: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
              <input type="text" placeholder="Apellido del cliente"
                value={form.apellido}
                onChange={e => setForm({...form, apellido: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Celular *</label>
              <input type="tel" placeholder="Ej: 987654321"
                value={form.celular}
                onChange={e => setForm({...form, celular: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Captura de pago {!esAdmin
                  ? <span className="text-red-500 text-xs">* obligatorio</span>
                  : <span className="text-gray-400 text-xs">(opcional)</span>}
              </label>
              <input type="file" accept="image/*"
                onChange={e => setForm({...form, captura: e.target.files[0]})}
                className="w-full border rounded-lg px-2 py-2 text-sm bg-white cursor-pointer"/>
              {form.captura && <p className="text-green-600 text-xs mt-1">✅ {form.captura.name}</p>}
              {!esAdmin && !form.captura && (
                <p className="text-red-500 text-xs mt-1">📸 Sube tu comprobante de pago</p>
              )}
            </div>
          </div>

          {msg   && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-3 text-sm">{msg}</div>}
          {error && <div className="bg-red-100   border border-red-400   text-red-700   px-4 py-3 rounded mb-3 text-sm">{error}</div>}

          <div className="flex gap-3">
            <button onClick={handleReservar}
              className="bg-blue-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg hover:scale-105 duration-200">
              ✅ Confirmar Reserva
            </button>
            <button onClick={() => { setShowForm(false); setCelSel(null); setError(''); }}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {msg && !showForm && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4 text-sm">
          {msg}
        </div>
      )}
    </div>
  );
}
