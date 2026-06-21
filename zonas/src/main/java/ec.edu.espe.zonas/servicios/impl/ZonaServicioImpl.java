package ec.edu.espe.zonas.servicios.impl;

import ec.edu.espe.zonas.dtos.ZonaRequestDto;
import ec.edu.espe.zonas.dtos.ZonaResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.Zona;
import ec.edu.espe.zonas.repositorios.EspacioRepository;
import ec.edu.espe.zonas.repositorios.ZonaRepository;
import ec.edu.espe.zonas.servicios.ZonaServicio;
import ec.edu.espe.zonas.utils.UtilsMappers;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ZonaServicioImpl implements ZonaServicio {

    private final ZonaRepository zonaRepository;
    private final EspacioRepository espacioRepository;
    private final UtilsMappers mappers;

    @Override
    @Transactional(readOnly = true)
    public List<ZonaResponseDto> listarZonas() {
        return zonaRepository.findAll().stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ZonaResponseDto obtenerZona(UUID idZona) {
        Zona zona = zonaRepository.findById(idZona)
                .orElseThrow(() -> new RuntimeException("Zona no encontrada con ID: " + idZona));
        return convertirADto(zona);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> obtenerDisponibilidad(UUID idZona) {
        Zona zona = zonaRepository.findById(idZona)
                .orElseThrow(() -> new RuntimeException("Zona no encontrada con ID: " + idZona));
        int espaciosLibres = espacioRepository.countByZonaIdAndEstadoEspacio(idZona, EstadoEspacio.LIBRE);
        int totalEspacios = espacioRepository.countByZonaId(idZona);
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("idZona", idZona);
        resultado.put("nombreZona", zona.getNombre());
        resultado.put("capacidad", zona.getCapacidad());
        resultado.put("totalEspacios", totalEspacios);
        resultado.put("espaciosLibres", espaciosLibres);
        resultado.put("espaciosOcupados", totalEspacios - espaciosLibres);
        resultado.put("disponible", espaciosLibres > 0);
        return resultado;
    }

    @Override
    @Transactional
    public ZonaResponseDto crearZona(ZonaRequestDto requestDto) {
        String codigoGenerado = requestDto.getNombre().length() >= 4
                ? requestDto.getNombre().substring(0, 4).toUpperCase()
                : requestDto.getNombre().toUpperCase();

        Zona zona = Zona.builder()
                .nombre(requestDto.getNombre())
                .descripcion(requestDto.getDescripcion())
                .tipo(requestDto.getTipoZona())
                .estado(1)
                .codigo(codigoGenerado)
                .capacidad(requestDto.getCapacidad())
                .tarifaPorHora(requestDto.getTarifaPorHora())
                .build();

        Zona zonaGuardada = zonaRepository.save(zona);
        return convertirADto(zonaGuardada);
    }

    @Override
    @Transactional
    public ZonaResponseDto actualizarZona(UUID idZona, ZonaRequestDto request) {
        Zona zonaExistente = zonaRepository.findById(idZona)
                .orElseThrow(() -> new RuntimeException("Zona no encontrada con ID: " + idZona));

        zonaExistente.setNombre(request.getNombre());
        zonaExistente.setDescripcion(request.getDescripcion());
        zonaExistente.setTipo(request.getTipoZona());

        Zona zonaActualizada = zonaRepository.save(zonaExistente);
        return convertirADto(zonaActualizada);
    }

    @Override
    @Transactional
    public void activarDesactivar(UUID idZona) {
        Zona zonaExistente = zonaRepository.findById(idZona)
                .orElseThrow(() -> new RuntimeException("Zona no encontrada con ID: " + idZona));

        int nuevoEstado = zonaExistente.getEstado() == 1 ? 0 : 1;
        zonaExistente.setEstado(nuevoEstado);

        zonaRepository.save(zonaExistente);
    }

    private ZonaResponseDto convertirADto(Zona zona) {
        return ZonaResponseDto.builder()
                .id(zona.getId())
                .nombre(zona.getNombre())
                .codigo(zona.getCodigo())
                .descripcion(zona.getDescripcion())
                .estado(zona.getEstado())
                .tipo(zona.getTipo())
                .capacidad(zona.getCapacidad())
                .tarifaPorHora(zona.getTarifaPorHora())
                .fechaCreacion(zona.getFechaCreacion())
                .fechaModificacion(zona.getFechaModificacion())
                .espacios(zona.getEspacios() != null ?
                        zona.getEspacios().stream().map(mappers::espacioResponseDto).collect(Collectors.toList())
                        : null)
                .build();
    }
}