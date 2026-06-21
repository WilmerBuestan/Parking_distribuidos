import { useState } from 'react';
import { consultarDisponibilidadVehiculo } from '../api/vehiculos';

export default function BuscarVehiculo() {
  const [placa, setPlaca] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function handleBuscar(e) {
    e.preventDefault();
    if (!placa.trim()) return;

    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const data = await consultarDisponibilidadVehiculo(placa);
      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Buscar vehículo</h2>

      <form onSubmit={handleBuscar} className="flex gap-2 mb-4">
        <input
          type="text"
          value={placa}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
          placeholder="Placa (ej. PBA-3256)"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
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

      {resultado && (
        <div className="border border-gray-200 rounded p-3 text-sm space-y-1">
          <p className="font-medium text-gray-800">
            {resultado.vehiculo.marca} {resultado.vehiculo.modelo} ({resultado.vehiculo.anio})
          </p>
          <p className="text-gray-500">Placa: {resultado.vehiculo.placa}</p>
          <p className="text-gray-500">Color: {resultado.vehiculo.color}</p>
          <p>
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                resultado.disponible
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {resultado.disponible ? 'Disponible' : 'En parqueadero'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}