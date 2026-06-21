package ec.edu.espe.zonas.servicios;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;

import java.util.List;
import java.util.UUID;

public interface EspacioServicio {
    List<EspacioResponseDto> obtenerEspacio();
    EspacioResponseDto crearEspacio(EspacioRequestDto requestDto);
    EspacioResponseDto actualizarEspacio(EspacioRequestDto requestDto);
    EspacioResponseDto asignarEspacioLibre(UUID idZona);
    void eliminarEspacio(UUID idEspacio);
    void activarDesactivar(UUID idEspacio);

    EspacioResponseDto cambiarEstado(UUID idEspacio, EstadoEspacio estado);
    List<EspacioResponseDto> obtenerEspaciosPorEstado(EstadoEspacio estado);
    List<EspacioResponseDto> obtenerEspaciosPorZonaEstado(UUID idZona, EstadoEspacio estado);
}