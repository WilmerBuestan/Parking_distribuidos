import { useCallback, useEffect, useState } from 'react';
import { listarTicketsActivos, procesarSalidaTicket } from '../api/tickets';

const INTERVALO_REFRESCO_MS = 5000;

export default function TicketsActivos({ refrescarSenal }) {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);

  const cargarTickets = useCallback(async () => {
    try {
      const data = await listarTicketsActivos();
      setTickets(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Refresco automático cada 5s, para simular "tiempo real" sin websockets.
  useEffect(() => {
    cargarTickets();
    const interval = setInterval(cargarTickets, INTERVALO_REFRESCO_MS);
    return () => clearInterval(interval);
  }, [cargarTickets]);

  // Refresco inmediato cuando el padre nos avisa que se creó un ticket nuevo.
  useEffect(() => {
    if (refrescarSenal) cargarTickets();
  }, [refrescarSenal, cargarTickets]);

  async function handleSalida(ticketId) {
    setProcesandoId(ticketId);
    try {
      await procesarSalidaTicket(ticketId);
      await cargarTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesandoId(null);
    }
  }

  function calcularMinutosTranscurridos(horaEntrada) {
    const minutos = Math.floor((Date.now() - new Date(horaEntrada).getTime()) / 60000);
    return minutos;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Tickets activos</h2>
        <span className="text-xs text-gray-400">Auto-actualiza cada 5s</span>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {tickets.length === 0 ? (
        <p className="text-sm text-gray-400">No hay tickets abiertos.</p>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between border border-gray-200 rounded p-3 text-sm"
            >
              <div>
                <p className="font-medium text-gray-800">Placa: {t.placa}</p>
                <p className="text-gray-500">Cédula: {t.cedula}</p>
                <p className="text-gray-500">
                  {calcularMinutosTranscurridos(t.horaEntrada)} min en parqueadero
                </p>
              </div>
              <button
                onClick={() => handleSalida(t.id)}
                disabled={procesandoId === t.id}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white text-xs font-medium px-3 py-2 rounded"
              >
                {procesandoId === t.id ? 'Procesando...' : 'Registrar salida'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}