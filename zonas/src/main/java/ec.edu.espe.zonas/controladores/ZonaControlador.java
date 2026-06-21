package ec.edu.espe.zonas.controladores;

import ec.edu.espe.zonas.dtos.ZonaRequestDto;
import ec.edu.espe.zonas.dtos.ZonaResponseDto;
import ec.edu.espe.zonas.servicios.ZonaServicio;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/zonas")
@RequiredArgsConstructor
public class ZonaControlador {

    private final ZonaServicio zonaServicio;

    @GetMapping
    public ResponseEntity<List<ZonaResponseDto>> listarZonas() {
        return ResponseEntity.ok(zonaServicio.listarZonas());
    }

    @GetMapping("/disponibilidad/{idZona}")
    public ResponseEntity<Map<String, Object>> obtenerDisponibilidad(@PathVariable UUID idZona) {
        return ResponseEntity.ok(zonaServicio.obtenerDisponibilidad(idZona));
    }

    @GetMapping("/{idZona}")
    public ResponseEntity<ZonaResponseDto> obtenerZona(@PathVariable UUID idZona) {
        return ResponseEntity.ok(zonaServicio.obtenerZona(idZona));
    }

    @PostMapping
    public ResponseEntity<ZonaResponseDto> crearZona(@Valid @RequestBody ZonaRequestDto request) {
        ZonaResponseDto nuevaZona = zonaServicio.crearZona(request);
        return new ResponseEntity<>(nuevaZona, HttpStatus.CREATED);
    }

    @PutMapping("/{idZona}")
    public ResponseEntity<ZonaResponseDto> actualizarZona(
            @PathVariable UUID idZona,
            @Valid @RequestBody ZonaRequestDto request) {
        return ResponseEntity.ok(zonaServicio.actualizarZona(idZona, request));
    }

    @PatchMapping("/{idZona}/estado")
    public ResponseEntity<Void> activarDesactivar(@PathVariable UUID idZona) {
        zonaServicio.activarDesactivar(idZona);
        return ResponseEntity.ok().build();
    }
}