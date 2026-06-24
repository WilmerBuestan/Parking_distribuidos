import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, LogOut, Clock, Car, IdCard, Inbox } from "lucide-react";
import Card from "./Card";
import { listarTicketsActivos, procesarSalidaTicket } from "../api/tickets";

const INTERVALO_REFRESCO_MS = 5000;

export default function TicketsActivos({ refrescarSenal, delay }) {
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

  useEffect(() => {
    cargarTickets();
    const interval = setInterval(cargarTickets, INTERVALO_REFRESCO_MS);
    return () => clearInterval(interval);
  }, [cargarTickets]);

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

  function minutos(horaEntrada) {
    return Math.floor((Date.now() - new Date(horaEntrada).getTime()) / 60000);
  }

  return (
    <Card
      icon={Activity}
      title="Tickets activos"
      accent="green"
      delay={delay}
      action={
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-live" />
          <span className="text-[11px] font-semibold text-slate-400">
            EN VIVO
          </span>
        </div>
      }
    >
      <div className="flex items-center gap-2 mb-4">
        <motion.span
          key={tickets.length}
          initial={{ scale: 1.4, color: "#10b981" }}
          animate={{ scale: 1, color: "#1e293b" }}
          className="text-3xl font-extrabold tabular-nums"
        >
          {tickets.length}
        </motion.span>
        <span className="text-sm text-slate-400 font-medium">
          {tickets.length === 1 ? "vehículo dentro" : "vehículos dentro"}
        </span>
      </div>

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 mb-3">
          {error}
        </p>
      )}

      {tickets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-8 text-slate-300"
        >
          <Inbox className="w-10 h-10 mb-2" strokeWidth={1.5} />
          <p className="text-sm text-slate-400">No hay tickets abiertos</p>
        </motion.div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {tickets.map((t) => (
              <motion.div
                layout
                key={t.id}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="flex items-center justify-between bg-white/70 border border-slate-100 rounded-xl p-3.5"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-bold text-slate-800 text-sm font-mono">
                    <Car className="w-4 h-4 text-blue-500" /> {t.placa}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <IdCard className="w-3 h-3" /> {t.cedula}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {minutos(t.horaEntrada)} min
                    </span>
                  </div>
                </div>
                <motion.button
                  onClick={() => handleSalida(t.id)}
                  disabled={procesandoId === t.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 bg-gradient-to-br from-orange-500 to-rose-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-md disabled:opacity-60 flex-shrink-0"
                >
                  {procesandoId === t.id ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.8,
                        ease: "linear",
                      }}
                      className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" /> Salida
                    </>
                  )}
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}
