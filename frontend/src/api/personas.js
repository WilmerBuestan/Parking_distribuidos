import { apiFetch } from './client';

export function buscarPersonaPorCedula(cedula) {
  return apiFetch(`/api/personas/cedula/${cedula}`);
}

export function buscarPersonaPorUsername(username) {
  return apiFetch(`/api/personas/username/${username}`);
}

export function buscarPersonasPorApellido(apellido) {
  return apiFetch(`/api/personas/apellido/${apellido}`);
}

export function listarPersonas() {
  return apiFetch('/api/personas');
}