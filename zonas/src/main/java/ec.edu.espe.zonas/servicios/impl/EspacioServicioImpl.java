package ec.edu.espe.zonas.servicios.impl;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.Espacio;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.Zona;
import ec.edu.espe.zonas.repositorios.EspacioRepository;
import ec.edu.espe.zonas.repositorios.ZonaRepository;
import ec.edu.espe.zonas.servicios.EspacioServicio;
import ec.edu.espe.zonas.utils.UtilsMappers;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EspacioServicioImpl implements EspacioServicio {

    private final EspacioRepository repositorioEspacio;
    private final ZonaRepository zonaRepository;
    private final UtilsMappers mappers;

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspacio() {
        return repositorioEspacio.findAll().stream()
                .map(mappers::espacioResponseDto)
                .collect(Collectors.toList());
    }


    @Override
@Transactional
public EspacioResponseDto asignarEspacioLibre(UUID idZona) {
    List<Espacio> espaciosLibres = repositorioEspacio.findByZonaIdAndEstadoEspacio(
            idZona, EstadoEspacio.LIBRE);
 
    if (espaciosLibres.isEmpty()) {
        throw new IllegalArgumentException(
                "No hay espacios LIBRES disponibles en la zona con ID: " + idZona);
    }
 
    // Tomamos el primero disponible (orden de llegada simple, suficiente por ahora)
    Espacio espacio = espaciosLibres.get(0);
    espacio.setEstadoEspacio(EstadoEspacio.OCUPADO);
 
    Espacio espacioGuardado = repositorioEspacio.save(espacio);
    return mappers.espacioResponseDto(espacioGuardado);
}
 





    @Override
    @Transactional
    public EspacioResponseDto crearEspacio(EspacioRequestDto dto) {
        Zona objZona = zonaRepository.findById(dto.getIdZona())
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada con id: " + dto.getIdZona()));

        // --- INICIO DE LA REGLA DE NEGOCIO ---
        // CORRECCIÓN 1: Contamos directamente en PostgreSQL para que sea infalible
        int espaciosActuales = repositorioEspacio.countByZonaId(objZona.getId());

        // Verificamos si ya llegamos al límite
        if (objZona.getCapacidad() != null && espaciosActuales >= objZona.getCapacidad()) {
            // CORRECCIÓN 2: Usamos IllegalArgumentException para atraparlo luego y devolver un error 400
            throw new IllegalArgumentException("La zona '" + objZona.getNombre() +
                    "' ya está llena. Solo tiene capacidad para " + objZona.getCapacidad() + " espacios físicos.");
        }
        // --- FIN DE LA REGLA DE NEGOCIO ---

        Espacio nuevoEspacio = mappers.toEntityEspacio(dto);
        nuevoEspacio.setZona(objZona);
        nuevoEspacio.setCodigo(objZona.getCodigo() + "-" + java.util.UUID.randomUUID().toString().substring(0, 5).toUpperCase());
        nuevoEspacio.setActivo(true);
        nuevoEspacio.setEstado(true);

        // Todo espacio nuevo nace LIBRE obligatoriamente
// --- ASIGNACIÓN DE ESTADO INICIAL ---
        // Si desde Postman nos enviaron un estado (ej. OCUPADO), lo respetamos.
        // Si no nos enviaron nada (viene null), por defecto lo hacemos nacer LIBRE.
        if (dto.getEstadoEspacio() != null) {
            nuevoEspacio.setEstadoEspacio(dto.getEstadoEspacio());
        } else {
            nuevoEspacio.setEstadoEspacio(EstadoEspacio.LIBRE);
        }

        Espacio espacioGuardado = repositorioEspacio.save(nuevoEspacio);
        return mappers.espacioResponseDto(espacioGuardado);
    }

    @Override
    @Transactional
    public EspacioResponseDto cambiarEstado(UUID idEspacio, EstadoEspacio nuevoEstado) {
        Espacio espacio = repositorioEspacio.findById(idEspacio)
                .orElseThrow(() -> new IllegalArgumentException("Error: Espacio no encontrado con ID: " + idEspacio));

        EstadoEspacio estadoActual = espacio.getEstadoEspacio();

        // VALIDACIONES Y REGLAS DE LA MÁQUINA DE ESTADOS
        if (estadoActual == nuevoEstado) {
            throw new IllegalArgumentException("El espacio ya se encuentra " + nuevoEstado);
        }
        if (!espacio.isActivo()) {
            throw new IllegalArgumentException("No se puede operar sobre un espacio inactivo.");
        }
        if (estadoActual == EstadoEspacio.MANTENIMIENTO && nuevoEstado != EstadoEspacio.LIBRE) {
            throw new IllegalArgumentException("Un espacio en MANTENIMIENTO solo puede pasar a LIBRE tras ser reparado.");
        }
        if (estadoActual == EstadoEspacio.OCUPADO && nuevoEstado == EstadoEspacio.RESERVADO) {
            throw new IllegalArgumentException("No puedes RESERVAR un espacio que ya está OCUPADO por un vehículo.");
        }

        espacio.setEstadoEspacio(nuevoEstado);
        Espacio espacioActualizado = repositorioEspacio.save(espacio);
        return mappers.espacioResponseDto(espacioActualizado);
    }

    @Override
    public EspacioResponseDto actualizarEspacio(EspacioRequestDto dto) {
        return null;
    }

    @Override
    public void eliminarEspacio(UUID idEspacio) {
    }

    @Override
    public List<EspacioResponseDto> obtenerEspaciosPorEstado(EstadoEspacio estado) {
        return null;
    }

    @Override
    public List<EspacioResponseDto> obtenerEspaciosPorZonaEstado(UUID idZona, EstadoEspacio estado) {
        return null;
    }

    @Override
    @Transactional
    public void activarDesactivar(UUID idEspacio) {
        Espacio espacio = repositorioEspacio.findById(idEspacio)
                .orElseThrow(() -> new IllegalArgumentException("Error: Espacio no encontrado con ID: " + idEspacio));

        // --- INICIO DE LA REGLA DE NEGOCIO ---
        // Si vamos a desactivarlo (estado actual es true) y además está OCUPADO, lo bloqueamos.
        if (espacio.isEstado() && espacio.getEstadoEspacio() == EstadoEspacio.OCUPADO) {
            throw new IllegalArgumentException("LÓGICA RECHAZADA: No puedes desactivar un espacio que actualmente tiene un vehículo (OCUPADO).");
        }
        // --- FIN DE LA REGLA DE NEGOCIO ---

        // Invertimos el valor booleano (si es true, pasa a false (0), y viceversa)
        espacio.setEstado(!espacio.isEstado());
        repositorioEspacio.save(espacio);
    }




}