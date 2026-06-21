package ec.edu.espe.zonas.servicios;

import ec.edu.espe.zonas.dtos.ZonaRequestDto;
import ec.edu.espe.zonas.dtos.ZonaResponseDto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ZonaServicio {

    List<ZonaResponseDto> listarZonas();

    ZonaResponseDto obtenerZona(UUID idZona);

    Map<String, Object> obtenerDisponibilidad(UUID idZona);

    ZonaResponseDto crearZona(ZonaRequestDto requestDto);

    ZonaResponseDto actualizarZona(UUID idZona, ZonaRequestDto request);

    void activarDesactivar(UUID idZona);
}