package ec.edu.espe.zonas.servicios.impl;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;

import java.util.List;
import java.util.UUID;

public interface EstadoServicioImpl {

    List<EspacioResponseDto> obtenerEspacio();

    // Aquí está la corrección: agregamos "dto" como nombre de la variable
    EspacioResponseDto crearEspacio(EspacioRequestDto dto);

    // Aquí también agregamos "dto"
    EspacioResponseDto actualizarEspacio(EspacioRequestDto dto);

    void eliminarEspacio(UUID idEspacio);

    EspacioResponseDto cambiarEstado(UUID idEspacio, EstadoEspacio estado);

    List<EspacioResponseDto> ObtenerEspaciosPorEstado(EstadoEspacio estado);

    List<EspacioResponseDto> ObtenerEspaciosPorZonaEstado(UUID idZona, EstadoEspacio estado);
}