package ec.edu.espe.zonas.controladores;

import ec.edu.espe.zonas.dtos.ZonaRequestDto;
import ec.edu.espe.zonas.dtos.ZonaResponseDto;
import ec.edu.espe.zonas.servicios.ZonaServicio;
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
import java.util.Map;
import java.util.UUID;

@Tag(name = "zonas", description = "Gestión de zonas de parqueo. Cada zona agrupa varios espacios físicos.")
@RestController
@RequestMapping("/zonas")
@RequiredArgsConstructor
public class ZonaControlador {

    private final ZonaServicio zonaServicio;

    @Operation(summary = "Listar todas las zonas con sus espacios")
    @GetMapping
    public ResponseEntity<List<ZonaResponseDto>> listarZonas() {
        return ResponseEntity.ok(zonaServicio.listarZonas());
    }

    @Operation(
            summary = "Consultar disponibilidad de una zona",
            description = "Devuelve totalEspacios, espaciosLibres, espaciosOcupados y un flag disponible. " +
                    "Usado por tickets-service antes de asignar un espacio."
    )
    @ApiResponse(responseCode = "200", description = "Disponibilidad calculada correctamente")
    @GetMapping("/disponibilidad/{idZona}")
    public ResponseEntity<Map<String, Object>> obtenerDisponibilidad(
            @Parameter(example = "2287d61b-a911-4266-8c3a-e7678756102d") @PathVariable UUID idZona) {
        return ResponseEntity.ok(zonaServicio.obtenerDisponibilidad(idZona));
    }

    @Operation(summary = "Obtener el detalle de una zona por su ID, incluida la tarifa por hora")
    @GetMapping("/{idZona}")
    public ResponseEntity<ZonaResponseDto> obtenerZona(@PathVariable UUID idZona) {
        return ResponseEntity.ok(zonaServicio.obtenerZona(idZona));
    }

    @Operation(summary = "Crear una nueva zona")
    @PostMapping
    public ResponseEntity<ZonaResponseDto> crearZona(@Valid @RequestBody ZonaRequestDto request) {
        ZonaResponseDto nuevaZona = zonaServicio.crearZona(request);
        return new ResponseEntity<>(nuevaZona, HttpStatus.CREATED);
    }

    @Operation(summary = "Actualizar nombre, descripción y tipo de una zona")
    @PutMapping("/{idZona}")
    public ResponseEntity<ZonaResponseDto> actualizarZona(
            @PathVariable UUID idZona,
            @Valid @RequestBody ZonaRequestDto request) {
        return ResponseEntity.ok(zonaServicio.actualizarZona(idZona, request));
    }

    @Operation(summary = "Activar o desactivar una zona (toggle)")
    @PatchMapping("/{idZona}/estado")
    public ResponseEntity<Void> activarDesactivar(@PathVariable UUID idZona) {
        zonaServicio.activarDesactivar(idZona);
        return ResponseEntity.ok().build();
    }
}