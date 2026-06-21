package ec.edu.espe.zonas.dtos;

import ec.edu.espe.zonas.entidades.TipoZona;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZonaResponseDto {

    private UUID id;
    private String nombre;
    private String codigo;
    private String descripcion;
    private int estado;
    private TipoZona tipo;

    // --- NUEVOS CAMPOS AGREGADOS ---
    private Integer capacidad;
    private Double tarifaPorHora;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaModificacion;

    // Esta lista guardará todos los espacios que le pertenecen a esta zona
    private List<EspacioResponseDto> espacios;
}