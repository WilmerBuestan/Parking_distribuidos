import { apiFetch } from './client';

export function buscarVehiculoPorPlaca(placa) {
  return apiFetch(`/api/vehiculos/placa/${placa}`);
}

export function consultarDisponibilidadVehiculo(placa) {
  return apiFetch(`/api/vehiculos/disponibilidad/${placa}`);
}

export function listarVehiculos() {
  return apiFetch('/api/vehiculos');
}