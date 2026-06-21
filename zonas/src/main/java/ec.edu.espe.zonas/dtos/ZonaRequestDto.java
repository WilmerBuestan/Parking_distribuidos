package ec.edu.espe.zonas.dtos;

import ec.edu.espe.zonas.entidades.TipoZona;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZonaRequestDto {
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    private String descripcion;

    // Agregamos esta línea para recibir el estado desde Postman

    @NotNull(message = "El tipo de zona es obligatorio")
    private TipoZona tipoZona;

    // ¡AGREGAMOS ESTO! Para recibir la capacidad máxima del terreno
    @NotNull(message = "La capacidad es obligatoria")
    private Integer capacidad;

    private Double tarifaPorHora;
}