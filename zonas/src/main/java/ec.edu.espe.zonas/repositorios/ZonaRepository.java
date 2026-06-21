package ec.edu.espe.zonas.repositorios;

import ec.edu.espe.zonas.entidades.Zona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ZonaRepository extends JpaRepository<Zona, UUID> {
    // Aquí puedes agregar consultas personalizadas más adelante
}