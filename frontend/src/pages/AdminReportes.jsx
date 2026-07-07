import { useState, useEffect } from 'react';
import api from '../services/api';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function AdminReportes() {
  const [ingresos,  setIngresos]  = useState(null);
  const [ocupacion, setOcupacion] = useState([]);
  const [desde,     setDesde]     = useState('');
  const [hasta,     setHasta]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [tabReporte, setTabReporte] = useState('dia');

  useEffect(() => {
    cargarIngresos();
  }, []);

  const cargarIngresos = async () => {
    setLoading(true);
    try {
      const r = await api.get('/reservas/ingresos');
      setIngresos(r.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const generarOcupacion = async () => {
    if (!desde || !hasta) return;
    try {
      const r = await api.get(`/reservas/reporte?desde=${desde}&hasta=${hasta}`);
      setOcupacion(r.data.data);
    } catch (err) { console.error(err); }
  };

  const fmtSoles = (n) => `S/ ${parseFloat(n || 0).toFixed(2)}`;
  const fmtFecha = (f) => { if (!f) return ''; const [y,m,d] = String(f).split('T')[0].split('-'); return `${d}/${m}/${y}`; };

  if (loading) return <div className="text-center py-12 text-white text-lg">⏳ Cargando reportes...</div>;

  return (
    <div className="space-y-6">

      {/* ── RESUMEN GENERAL ── */}
      <div>
        <h2 className="text-white font-bold text-lg mb-3 drop-shadow">💰 Resumen de Ingresos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label:'HOY',         icon:'📅', data: ingresos?.resumen?.hoy,    color:'from-blue-800 to-blue-600'    },
            { label:'ESTA SEMANA', icon:'📆', data: ingresos?.resumen?.semana, color:'from-green-800 to-green-600'  },
            { label:'ESTE MES',    icon:'🗓', data: ingresos?.resumen?.mes,    color:'from-purple-800 to-purple-600' },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white rounded-2xl p-6 shadow-xl`}>
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-xs font-semibold opacity-70 mb-1">{s.label}</div>
              <div className="text-4xl font-extrabold mb-1">
                {fmtSoles(s.data?.total)}
              </div>
              <div className="text-sm opacity-80">
                {s.data?.reservas || 0} reservas confirmadas
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DETALLE POR PERÍODO ── */}
      <div className="bg-white/95 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-bold text-blue-900 text-lg">📊 Detalle por Período</h2>
          <div className="flex gap-2">
            {[
              { id:'dia',    label:'Por Día'    },
              { id:'semana', label:'Por Semana' },
              { id:'mes',    label:'Por Mes'    },
            ].map(t => (
              <button key={t.id} onClick={() => setTabReporte(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition
                  ${tabReporte===t.id ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Por día */}
        {tabReporte === 'dia' && (
          <div>
            <p className="text-gray-500 text-sm mb-4">Ingresos de los últimos 7 días</p>
            {ingresos?.porDia?.length === 0 && (
              <p className="text-gray-400 text-center py-8">No hay ingresos en los últimos 7 días.</p>
            )}
            <div className="space-y-3">
              {ingresos?.porDia?.map((d, i) => {
                const maxTotal = Math.max(...(ingresos.porDia.map(x => x.total || 0)), 1);
                const pct = Math.round((d.total / maxTotal) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-28 text-right text-sm font-semibold text-gray-700 flex-shrink-0">
                      <div>{fmtFecha(d.fecha)}</div>
                      <div className="text-xs text-gray-400">{d.dia_nombre?.substring(0,3)}</div>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 5)}%` }}>
                        <span className="text-white text-xs font-bold whitespace-nowrap">{fmtSoles(d.total)}</span>
                      </div>
                    </div>
                    <div className="w-16 text-right text-xs text-gray-500 flex-shrink-0">
                      {d.reservas} res.
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
              <span className="font-bold text-gray-700">Total 7 días:</span>
              <span className="font-extrabold text-blue-900 text-lg">
                {fmtSoles(ingresos?.porDia?.reduce((a, d) => a + (d.total || 0), 0))}
              </span>
            </div>
          </div>
        )}

        {/* Por semana */}
        {tabReporte === 'semana' && (
          <div>
            <p className="text-gray-500 text-sm mb-4">Ingresos de las últimas 4 semanas</p>
            {ingresos?.porSemana?.length === 0 && (
              <p className="text-gray-400 text-center py-8">No hay ingresos en las últimas semanas.</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th className="px-4 py-3 text-left rounded-tl-xl">Semana</th>
                    <th className="px-4 py-3 text-center">Inicio</th>
                    <th className="px-4 py-3 text-center">Reservas</th>
                    <th className="px-4 py-3 text-right rounded-tr-xl">Total Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresos?.porSemana?.map((s, i) => (
                    <tr key={i} className={i%2===0?'bg-gray-50':'bg-white'}>
                      <td className="px-4 py-3 font-semibold text-blue-900">Semana {s.semana_num}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{fmtFecha(s.inicio_semana)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">{s.reservas}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-700 text-base">{fmtSoles(s.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-900 text-white">
                    <td colSpan="3" className="px-4 py-3 font-bold rounded-bl-xl">TOTAL</td>
                    <td className="px-4 py-3 text-right font-extrabold text-yellow-300 text-lg rounded-br-xl">
                      {fmtSoles(ingresos?.porSemana?.reduce((a,s) => a+(s.total||0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Por mes */}
        {tabReporte === 'mes' && (
          <div>
            <p className="text-gray-500 text-sm mb-4">Ingresos de los últimos 6 meses</p>
            {ingresos?.porMes?.length === 0 && (
              <p className="text-gray-400 text-center py-8">No hay ingresos en los últimos meses.</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th className="px-4 py-3 text-left rounded-tl-xl">Mes</th>
                    <th className="px-4 py-3 text-center">Año</th>
                    <th className="px-4 py-3 text-center">Reservas</th>
                    <th className="px-4 py-3 text-right rounded-tr-xl">Total Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresos?.porMes?.map((m, i) => (
                    <tr key={i} className={i%2===0?'bg-gray-50':'bg-white'}>
                      <td className="px-4 py-3 font-semibold text-blue-900 capitalize">{m.mes_nombre}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{m.anio}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">{m.reservas}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-700 text-base">{fmtSoles(m.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-900 text-white">
                    <td colSpan="3" className="px-4 py-3 font-bold rounded-bl-xl">TOTAL ACUMULADO</td>
                    <td className="px-4 py-3 text-right font-extrabold text-yellow-300 text-lg rounded-br-xl">
                      {fmtSoles(ingresos?.porMes?.reduce((a,m) => a+(m.total||0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── REPORTE DE OCUPACIÓN POR CANCHA ── */}
      <div className="bg-white/95 rounded-2xl shadow-xl p-6">
        <h2 className="font-bold text-blue-900 text-lg mb-4">🏟 Ocupación por Cancha</h2>
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
          </div>
          <button onClick={generarOcupacion}
            className="bg-blue-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 transition">
            Generar
          </button>
          <button onClick={cargarIngresos}
            className="bg-green-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-800 transition">
            🔄 Actualizar ingresos
          </button>
        </div>

        {ocupacion.length > 0 && (
          <>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    {['Cancha','Tipo','Total','Confirmadas','Canceladas','Ingresos'].map(h => (
                      <th key={h} className="px-4 py-3 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ocupacion.map((r,i) => (
                    <tr key={i} className={i%2===0?'bg-gray-50':'bg-white'}>
                      <td className="px-4 py-3 font-semibold">{r.cancha}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${r.tipo==='futbol'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>
                          {r.tipo==='futbol'?'⚽ Fútbol':'🏐 Vóley'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{r.total_reservas}</td>
                      <td className="px-4 py-3 text-green-700 font-semibold">{r.confirmadas}</td>
                      <td className="px-4 py-3 text-red-600">{r.canceladas}</td>
                      <td className="px-4 py-3 font-bold text-blue-900">{fmtSoles(r.ingresos)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 font-bold">
                    <td colSpan="5" className="px-4 py-3 text-blue-900">TOTAL PERÍODO</td>
                    <td className="px-4 py-3 text-blue-900 text-lg">
                      {fmtSoles(ocupacion.reduce((a,r) => a+(r.ingresos||0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
