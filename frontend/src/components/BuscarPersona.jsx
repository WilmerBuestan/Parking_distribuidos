import { useState } from 'react';
import {
  buscarPersonaPorCedula,
  buscarPersonaPorUsername,
  buscarPersonasPorApellido,
} from '../api/personas';

const TIPOS_BUSQUEDA = [
  { value: 'cedula', label: 'Cédula' },
  { value: 'username', label: 'Username' },
  { value: 'apellido', label: 'Apellido' },
];

export default function BuscarPersona() {
  const [tipo, setTipo] = useState('cedula');
  const [valor, setValor] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function handleBuscar(e) {
    e.preventDefault();
    if (!valor.trim()) return;

    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      let data;
      if (tipo === 'cedula') data = await buscarPersonaPorCedula(valor);
      else if (tipo === 'username') data = await buscarPersonaPorUsername(valor);
      else data = await buscarPersonasPorApellido(valor);

      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // findByApellido devuelve un array; las otras dos devuelven un objeto único.
  const personas = Array.isArray(resultado) ? resultado : resultado ? [resultado] : [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Buscar persona</h2>

      <form onSubmit={handleBuscar} className="flex flex-wrap gap-2 mb-4">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          {TIPOS_BUSQUEDA.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={`Buscar por ${tipo}...`}
          className="flex-1 min-w-[180px] border border-gray-300 rounded px-3 py-2 text-sm"
        />

        <button
          type="submit"
          disabled={cargando}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium px-4 py-2 rounded"
        >
          {cargando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {personas.length > 0 && (
        <div className="space-y-2">
          {personas.map((p) => (
            <div key={p.id} className="border border-gray-200 rounded p-3 text-sm">
              <p className="font-medium text-gray-800">
                {p.firstName} {p.middleName} {p.lastName}
              </p>
              <p className="text-gray-500">DNI: {p.dni}</p>
              <p className="text-gray-500">Email: {p.email}</p>
              {p.usuario && (
                <p className="text-gray-500">Usuario: {p.usuario.username}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}