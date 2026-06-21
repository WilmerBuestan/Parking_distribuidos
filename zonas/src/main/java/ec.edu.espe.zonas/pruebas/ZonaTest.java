package ec.edu.espe.zonas.pruebas;

import ec.edu.espe.zonas.ZonasApplication;
import ec.edu.espe.zonas.entidades.TipoZona;
import ec.edu.espe.zonas.entidades.Zona;
import ec.edu.espe.zonas.repositorios.ZonaRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;

import java.util.Scanner;

public class ZonaTest {

    public static void main(String[] args) {
        // 1. Levantamos el contexto igual que en EspacioTest (Sin @SpringBootApplication extra)
        ApplicationContext context = SpringApplication.run(ZonasApplication.class, args);

        // 2. Pedimos el repositorio a Spring
        ZonaRepository zonaRepository = context.getBean(ZonaRepository.class);

        // 3. Arrancamos el menú interactivo
        iniciarConsola(zonaRepository);
    }

    private static void iniciarConsola(ZonaRepository zonaRepository) {
        Scanner teclado = new Scanner(System.in);
        boolean salir = false;

        while (!salir) {
            System.out.println("\n=== SISTEMA DE PARQUEADERO - GESTIÓN DE ZONAS ===");
            System.out.println("1. Crear una nueva Zona");
            System.out.println("2. Ver todas las Zonas");
            System.out.println("3. Salir");
            System.out.print("Elige una opción: ");

            String opcion = teclado.nextLine();

            switch (opcion) {
                case "1":
                    crearZonaInteractiva(teclado, zonaRepository);
                    break;
                case "2":
                    listarZonas(zonaRepository);
                    break;
                case "3":
                    System.out.println("Saliendo del sistema... ¡Hasta pronto!");
                    salir = true;
                    break;
                default:
                    System.out.println("❌ Opción no válida. Intenta de nuevo.");
            }
        }
    }

    private static void crearZonaInteractiva(Scanner teclado, ZonaRepository zonaRepository) {
        System.out.println("\n--- INGRESANDO NUEVA ZONA ---");

        Zona nuevaZona = new Zona();

        // ❌ ELIMINAMOS la generación manual del UUID.
        // Dejamos que Spring y PostgreSQL lo generen solos al hacer el save().

        System.out.print("Ingresa el código (ej. Z002): ");
        nuevaZona.setCodigo(teclado.nextLine());

        System.out.print("Ingresa el nombre de la zona (ej. Parqueadero Sur): ");
        nuevaZona.setNombre(teclado.nextLine());

        System.out.print("Ingresa una descripción: ");
        nuevaZona.setDescripcion(teclado.nextLine());

        System.out.print("Ingresa el tipo (VIP, REGULAR, INTERNA, EXTERNA, PREFERENCIAL): ");
        String tipoIngresado = teclado.nextLine().toUpperCase();
        nuevaZona.setTipo(TipoZona.valueOf(tipoIngresado));

        nuevaZona.setEstado(1);
        // También quitamos la fecha manual, porque @CreationTimestamp en la entidad ya hace eso solo.

        // ¡Guardamos en PostgreSQL!
        zonaRepository.save(nuevaZona);
        System.out.println("✅ ¡Éxito! La zona se ha guardado en la base de datos real.");
    }

    private static void listarZonas(ZonaRepository zonaRepository) {
        System.out.println("\n--- ZONAS REGISTRADAS ---");
        Iterable<Zona> zonas = zonaRepository.findAll();

        for (Zona zona : zonas) {
            System.out.println("- [" + zona.getCodigo() + "] " + zona.getNombre() + " (Tipo: " + zona.getTipo() + ")");
        }
        System.out.println("-------------------------");
    }
}