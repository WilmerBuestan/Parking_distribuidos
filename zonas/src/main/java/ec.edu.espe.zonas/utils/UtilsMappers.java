package ec.edu.espe.zonas.utils;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.Espacio;
import org.springframework.stereotype.Component;

@Component

public class UtilsMappers {

    public EspacioResponseDto espacioResponseDto(Espacio objEspacio) {
        return EspacioResponseDto.builder()
                .id(objEspacio.getId())
                .codigo(objEspacio.getCodigo())
                .descripcion(objEspacio.getDescripcion())
                .tipo(objEspacio.getTipo())
                .estado(objEspacio.isEstado())
                .activo(objEspacio.isActivo())
                .idZona(objEspacio.getZona() != null ? objEspacio.getZona().getId() : null)
                // Agregamos esta línea:
                .estadoEspacio(objEspacio.getEstadoEspacio())
                .build();
    }

    public Espacio toEntityEspacio(EspacioRequestDto requestDto){
        if (requestDto == null) return null;

        return Espacio.builder()
                .descripcion(requestDto.getDescripcion())
                .tipo(requestDto.getTipo())
                .estadoEspacio(requestDto.getEstadoEspacio())
                .build();
    }
}
