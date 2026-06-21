import { useEffect, useState } from 'react';
import { listarZonas } from '../api/zonas';

export default function ListaZonas() {
  const [zonas, setZonas] = useState([]);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarZonas();
  }, []);

  async function cargarZonas() {
    setCargando(true);
    setError(null);
    try {
      const data = await listarZonas();
      setZonas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Zonas</h2>
        <button
          onClick={cargarZonas}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Actualizar
        </button>
      </div>

      {cargando && <p className="text-sm text-gray-400">Cargando zonas...</p>}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {!cargando && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {zonas.map((zona) => {
            const total = zona.espacios?.length ?? 0;
            const libres = zona.espacios?.filter((e) => e.estadoEspacio === 'LIBRE').length ?? 0;

            return (
              <div key={zona.id} className="border border-gray-200 rounded p-3 text-sm">
                <p className="font-medium text-gray-800">{zona.nombre}</p>
                <p className="text-gray-500">Código: {zona.codigo}</p>
                <p className="text-gray-500">Tipo: {zona.tipo}</p>
                <p className="mt-1">
                  <span className="text-gray-700 font-medium">{libres}</span>
                  <span className="text-gray-500"> / {total} espacios libres</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}