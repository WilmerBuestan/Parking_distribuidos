package ec.edu.espe.zonas.dtos;

import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.TipoEspacio;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EspacioResponseDto {
    private UUID id;
    private String codigo;
    private String descripcion;
    private TipoEspacio tipo;
    private boolean estado;
    private boolean activo;
    private UUID idZona;

    // Agregamos esta línea para que viaje la información del estado
    private EstadoEspacio estadoEspacio;
}