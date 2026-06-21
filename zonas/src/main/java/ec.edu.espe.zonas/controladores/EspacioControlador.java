package ec.edu.espe.zonas.controladores;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.servicios.EspacioServicio;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/espacios")
@RequiredArgsConstructor
public class EspacioControlador {

    private final EspacioServicio espacioServicio;

    // GET: Listar todos los espacios
    @GetMapping
    public ResponseEntity<List<EspacioResponseDto>> listarEspacios() {
        return ResponseEntity.ok(espacioServicio.obtenerEspacio());
    }

    // POST: Crear un nuevo espacio
    @PostMapping
    public ResponseEntity<EspacioResponseDto> crearEspacio(@Valid @RequestBody EspacioRequestDto request) {
        // La lógica del servicio se encargará de forzar que nazca LIBRE
        EspacioResponseDto nuevoEspacio = espacioServicio.crearEspacio(request);
        return new ResponseEntity<>(nuevoEspacio, HttpStatus.CREATED);
    }

    // PATCH: Cambiar el estado (Aquí actúa nuestra máquina de estados)
    // Ejemplo de uso: /api/v1/espacios/123e4567-e89b-12d3.../estado?nuevoEstado=OCUPADO
    @PatchMapping("/{idEspacio}/estado")
    public ResponseEntity<EspacioResponseDto> cambiarEstado(
            @PathVariable UUID idEspacio,
            @RequestParam EstadoEspacio nuevoEstado) {

        // Enviamos el cambio al servicio, el cual evaluará si la transición es permitida
        EspacioResponseDto espacioActualizado = espacioServicio.cambiarEstado(idEspacio, nuevoEstado);
        return ResponseEntity.ok(espacioActualizado);
    }


    @PatchMapping("/asignar/{idZona}")
public ResponseEntity<EspacioResponseDto> asignarEspacioLibre(@PathVariable UUID idZona) {
    EspacioResponseDto espacioAsignado = espacioServicio.asignarEspacioLibre(idZona);
    return ResponseEntity.ok(espacioAsignado);
}
 
}