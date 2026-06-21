import { useEffect, useState } from 'react';
import { listarZonas } from '../api/zonas';
import { emitirTicketEntrada } from '../api/tickets';

export default function EmitirTicket({ onTicketCreado }) {
  const [zonas, setZonas] = useState([]);
  const [cedula, setCedula] = useState('');
  const [placa, setPlaca] = useState('');
  const [zonaId, setZonaId] = useState('');
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    listarZonas()
      .then((data) => {
        setZonas(data);
        if (data.length > 0) setZonaId(data[0].id);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cedula.trim() || !placa.trim() || !zonaId) return;

    setCargando(true);
    setError(null);
    setExito(null);

    try {
      const ticket = await emitirTicketEntrada({ cedula, placa, zonaId });
      setExito(`Ticket creado: ${ticket.id}`);
      setCedula('');
      setPlaca('');
      onTicketCreado?.(ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Emitir ticket de entrada</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Cédula</label>
          <input
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="1712345678"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Placa</label>
          <input
            type="text"
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            placeholder="PBA-3256"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Zona</label>
          <select
            value={zonaId}
            onChange={(e) => setZonaId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium px-4 py-2 rounded"
        >
          {cargando ? 'Emitiendo...' : 'Emitir ticket'}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-3">
          {error}
        </p>
      )}

      {exito && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mt-3">
          {exito}
        </p>
      )}
    </div>
  );
}