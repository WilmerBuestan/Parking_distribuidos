package ec.edu.espe.zonas.repositorios;

import ec.edu.espe.zonas.entidades.Espacio;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EspacioRepository extends JpaRepository<Espacio, UUID> {

    int countByZonaId(UUID idZona);

    int countByZonaIdAndEstadoEspacio(UUID idZona, EstadoEspacio estadoEspacio);

    boolean existsByCodigo(String codigo);

    List<Espacio> findByZonaId(UUID idZona);

    List<Espacio> findByZonaIdAndEstado(UUID idZona, boolean estado);



    List<Espacio> findByZonaIdAndEstadoEspacio(UUID idZona, EstadoEspacio estadoEspacio);


}