package ec.edu.espe.zonas.excepciones;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Este método "atrapa" cualquier IllegalArgumentException que salte en tu código
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> manejarReglasDeNegocio(IllegalArgumentException ex) {
        Map<String, String> respuesta = new HashMap<>();
        respuesta.put("error", "Regla de Negocio Rechazada");
        respuesta.put("mensaje", ex.getMessage());

        // Devolvemos un error 400 en lugar del feo 500
        return new ResponseEntity<>(respuesta, HttpStatus.BAD_REQUEST);
    }
}