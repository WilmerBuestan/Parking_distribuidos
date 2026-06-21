package ec.edu.espe.zonas.pruebas;

import ec.edu.espe.zonas.ZonasApplication;
import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.TipoEspacio;
import ec.edu.espe.zonas.repositorios.ZonaRepository;
import ec.edu.espe.zonas.servicios.EspacioServicio;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;

import java.util.List;
import java.util.Scanner;
import java.util.UUID;

public class EspacioTest {

    public static void main(String[] args) {
        ApplicationContext context = SpringApplication.run(ZonasApplication.class, args);

        EspacioServicio espacioServicio = context.getBean(EspacioServicio.class);
        ZonaRepository zonaRepository = context.getBean(ZonaRepository.class);

        iniciarConsola(espacioServicio, zonaRepository);
    }

    private static void iniciarConsola(EspacioServicio espacioServicio, ZonaRepository zonaRepository) {
        Scanner teclado = new Scanner(System.in);
        boolean salir = false;

        while (!salir) {
            System.out.println("\n=== SISTEMA DE PARQUEADERO - GESTIÓN DE ESPACIOS ===");
            System.out.println("1. Crear un nuevo Espacio");
            System.out.println("2. Ver todos los Espacios");
            System.out.println("3. Cambiar estado de un Espacio (Validaciones)");
            System.out.println("4. Salir");
            System.out.print("Elige una opción: ");

            String opcion = teclado.nextLine();

            switch (opcion) {
                case "1":
                    crearEspacioInteractivo(teclado, espacioServicio, zonaRepository);
                    break;
                case "2":
                    listarEspacios(espacioServicio);
                    break;
                case "3":
                    cambiarEstadoInteractivo(teclado, espacioServicio);
                    break;
                case "4":
                    System.out.println("Saliendo de la gestión de espacios... ¡Hasta pronto!");
                    salir = true;
                    break;
                default:
                    System.out.println("❌ Opción no válida. Intenta de nuevo.");
            }
        }
    }

    private static void crearEspacioInteractivo(Scanner teclado, EspacioServicio espacioServicio, ZonaRepository zonaRepository) {
        System.out.println("\n--- ZONAS DISPONIBLES EN BASE DE DATOS ---");
        zonaRepository.findAll().forEach(z ->
                System.out.println("ID: " + z.getId() + " | Nombre: " + z.getNombre())
        );

        System.out.print("\nCopia y pega el ID de la Zona donde crearás el espacio: ");
        String idZonaStr = teclado.nextLine();

        System.out.print("Ingresa una descripción (ej. Espacio cerca de la salida): ");
        String descripcion = teclado.nextLine();

        System.out.print("Ingresa el tipo (MOTO, CARRO, AUTOBUS): ");
        String tipoIngresado = teclado.nextLine().toUpperCase();

        try {
            EspacioRequestDto req = EspacioRequestDto.builder()
                    .idZona(UUID.fromString(idZonaStr))
                    .descripcion(descripcion)
                    .tipo(TipoEspacio.valueOf(tipoIngresado))
                    // Ya NO enviamos el estadoEspacio aquí, el backend se encarga de forzarlo a LIBRE
                    .build();

            EspacioResponseDto res = espacioServicio.crearEspacio(req);
            System.out.println("✅ ¡Espacio creado con éxito en PostgreSQL!");
            System.out.println("Código autogenerado: " + res.getCodigo());
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Error: Escribiste mal el Tipo. Recuerda usar mayúsculas.");
        } catch (Exception e) {
            System.out.println("❌ Error al crear el espacio: " + e.getMessage());
        }
    }

    private static void listarEspacios(EspacioServicio espacioServicio) {
        System.out.println("\n--- ESPACIOS REGISTRADOS ---");
        List<EspacioResponseDto> espacios = espacioServicio.obtenerEspacio();

        if (espacios.isEmpty()) {
            System.out.println("No hay espacios registrados aún.");
        } else {
            for (EspacioResponseDto esp : espacios) {
                System.out.println("ID Espacio: " + esp.getId());
                System.out.println("Código: " + esp.getCodigo() + " | Tipo: " + esp.getTipo() + " | Estado: " + esp.getEstadoEspacio());                System.out.println("-".repeat(40));
            }
        }
    }

    private static void cambiarEstadoInteractivo(Scanner teclado, EspacioServicio espacioServicio) {
        System.out.print("\nCopia y pega el ID del Espacio que deseas actualizar: ");
        String idEspacioStr = teclado.nextLine();

        System.out.print("Ingresa el nuevo estado (LIBRE, OCUPADO, MANTENIMIENTO): ");
        String estadoIngresado = teclado.nextLine().toUpperCase();

        try {
            espacioServicio.cambiarEstado(UUID.fromString(idEspacioStr), EstadoEspacio.valueOf(estadoIngresado));
            System.out.println("✅ ¡Cambio de estado exitoso! Pasó las validaciones del negocio.");
        } catch (Exception e) {
            System.out.println("❌ Error de Validación: " + e.getMessage());
        }
    }
}