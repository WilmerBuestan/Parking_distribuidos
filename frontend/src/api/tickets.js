import { apiFetch } from './client';

export function emitirTicketEntrada({ cedula, placa, zonaId }) {
  return apiFetch('/api/tickets/entrada', {
    method: 'POST',
    body: { cedula, placa, zonaId },
  });
}

export function procesarSalidaTicket(ticketId) {
  return apiFetch(`/api/tickets/salida/${ticketId}`, {
    method: 'PATCH',
  });
}

export function listarTicketsActivos() {
  return apiFetch('/api/tickets/activos');
}

export function buscarTicketPorId(id) {
  return apiFetch(`/api/tickets/${id}`);
}