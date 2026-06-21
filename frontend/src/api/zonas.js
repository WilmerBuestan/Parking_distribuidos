import { apiFetch } from './client';

export function listarZonas() {
  return apiFetch('/api/zonas');
}

export function consultarDisponibilidadZona(idZona) {
  return apiFetch(`/api/zonas/disponibilidad/${idZona}`);
}