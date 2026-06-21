package ec.edu.espe.zonas.controladores;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.servicios.EspacioServicio;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "espacios", description = "Espacios físicos individuales dentro de una zona, con su propia máquina de estados (LIBRE, RESERVADO, OCUPADO, MANTENIMIENTO).")
@RestController
@RequestMapping("/api/v1/espacios")
@RequiredArgsConstructor
public class EspacioControlador {

    private final EspacioServicio espacioServicio;

    @Operation(summary = "Listar todos los espacios de todas las zonas")
    @GetMapping
    public ResponseEntity<List<EspacioResponseDto>> listarEspacios() {
        return ResponseEntity.ok(espacioServicio.obtenerEspacio());
    }

    @Operation(
            summary = "Crear un nuevo espacio dentro de una zona",
            description = "El espacio nace en estado LIBRE por defecto, salvo que se especifique otro estado explícitamente."
    )
    @PostMapping
    public ResponseEntity<EspacioResponseDto> crearEspacio(@Valid @RequestBody EspacioRequestDto request) {
        EspacioResponseDto nuevoEspacio = espacioServicio.crearEspacio(request);
        return new ResponseEntity<>(nuevoEspacio, HttpStatus.CREATED);
    }

    @Operation(
            summary = "Cambiar el estado de un espacio (máquina de estados)",
            description = "Valida transiciones permitidas: un espacio en MANTENIMIENTO solo puede pasar a LIBRE, " +
                    "y un espacio OCUPADO no puede pasar directo a RESERVADO."
    )
    @ApiResponse(responseCode = "200", description = "Estado actualizado")
    @PatchMapping("/{idEspacio}/estado")
    public ResponseEntity<EspacioResponseDto> cambiarEstado(
            @PathVariable UUID idEspacio,
            @RequestParam EstadoEspacio nuevoEstado) {
        EspacioResponseDto espacioActualizado = espacioServicio.cambiarEstado(idEspacio, nuevoEstado);
        return ResponseEntity.ok(espacioActualizado);
    }

    @Operation(
            summary = "Asignar y ocupar automáticamente un espacio libre de una zona",
            description = "Busca el primer espacio en estado LIBRE dentro de la zona indicada, lo marca como " +
                    "OCUPADO y lo devuelve. Usado por tickets-service al emitir un ticket de entrada."
    )
    @ApiResponse(responseCode = "200", description = "Espacio asignado y marcado OCUPADO")
    @ApiResponse(responseCode = "400", description = "No hay espacios LIBRES disponibles en la zona")
    @PatchMapping("/asignar/{idZona}")
    public ResponseEntity<EspacioResponseDto> asignarEspacioLibre(
            @Parameter(example = "2287d61b-a911-4266-8c3a-e7678756102d") @PathVariable UUID idZona) {
        EspacioResponseDto espacioAsignado = espacioServicio.asignarEspacioLibre(idZona);
        return ResponseEntity.ok(espacioAsignado);
    }
}