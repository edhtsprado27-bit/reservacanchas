import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ADMIN_CORREO = 'edhtsprado@gmail.com';

export default function Register() {
  const [form, setForm]       = useState({ nombre:'', apellido:'', correo:'', contrasena:'' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.correo.toLowerCase() === ADMIN_CORREO.toLowerCase()) {
      setError('Este correo está reservado. Por favor usa otro correo.');
      return;
    }

    if (form.contrasena.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setSuccess('¡Cuenta creada! Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏆</div>
          <h1 className="text-2xl font-bold text-blue-900">Crear Cuenta</h1>
          <p className="text-gray-500 text-sm">Cancha Sintética EDHTS</p>
        </div>

        {error   && <div className="bg-red-100   border border-red-400   text-red-700   px-4 py-3 rounded mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key:'nombre',     label:'Nombre',             type:'text',     ph:'Tu nombre'         },
            { key:'apellido',   label:'Apellido',           type:'text',     ph:'Tu apellido'       },
            { key:'correo',     label:'Correo electrónico', type:'email',    ph:'tucorreo@mail.com' },
            { key:'contrasena', label:'Contraseña',         type:'password', ph:'Mínimo 6 caracteres' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type={f.type} required placeholder={f.ph}
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-900 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-blue-700 font-medium hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
