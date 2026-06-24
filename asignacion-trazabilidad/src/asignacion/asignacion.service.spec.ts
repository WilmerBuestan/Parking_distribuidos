import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AsignacionService } from './asignacion.service';
import { Asignacion, EstadoAsignacion } from './entities/asignacion.entity';
import { EventoAuditoria } from './entities/evento-auditoria.entity';

/**
 * Pruebas unitarias de AsignacionService.
 *
 * Estrategia: se mockean el Repository (TypeORM) y el HttpService, de forma
 * que estas pruebas corran de forma aislada y rápida, sin necesitar una base
 * de datos real ni que personas-service/vehiculos-service estén levantados.
 * Esto es justo lo que se espera de pruebas "unitarias" (a diferencia de
 * pruebas e2e, que sí requerirían el stack completo corriendo).
 */
describe('AsignacionService', () => {
  let service: AsignacionService;
  let asignacionRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    remove: jest.Mock;
  };
  let httpService: { get: jest.Mock; post: jest.Mock };

  const USER_ID = '29ded413-94e0-423e-84c0-b8161ef4d6fe';
  const VEHICLE_ID = '1be7a7b5-42f7-4555-bf49-c4d325202452';
  const OTRO_USER_ID = 'd9d643a8-d95d-41fe-bce6-6e430dd56ae0';

  beforeEach(async () => {
    asignacionRepository = {
      findOne: jest.fn(),
      create: jest.fn((datos) => datos),
      save: jest.fn((entidad) => Promise.resolve(entidad)),
      find: jest.fn(),
      remove: jest.fn((entidad) => Promise.resolve(entidad)),
    };

    httpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsignacionService,
        {
          provide: getRepositoryToken(Asignacion),
          useValue: asignacionRepository,
        },
        {
          provide: getRepositoryToken(EventoAuditoria),
          useValue: { find: jest.fn() },
        },
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'PERSONAS_SERVICE_URL')
                return 'http://localhost:3001';
              if (key === 'VEHICULOS_SERVICE_URL')
                return 'http://localhost:3002';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AsignacionService>(AsignacionService);
  });

  describe('crear', () => {
    it('crea la asignación cuando el usuario y el vehículo existen y no hay conflicto', async () => {
      httpService.get.mockReturnValue(of({ data: {} })); // valida usuario y vehículo OK
      asignacionRepository.findOne
        .mockResolvedValueOnce(null) // no existe la misma clave compuesta
        .mockResolvedValueOnce(null); // el vehículo no tiene otra asignación ACTIVA

      const resultado = await service.crear({
        userId: USER_ID,
        vehicleId: VEHICLE_ID,
      });

      expect(resultado.userId).toBe(USER_ID);
      expect(resultado.vehicleId).toBe(VEHICLE_ID);
      expect(resultado.estado).toBe(EstadoAsignacion.ACTIVA);
      expect(asignacionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('rechaza la creación si el usuario no existe en personas-service', async () => {
      httpService.get.mockReturnValueOnce(throwError(() => new Error('404')));

      await expect(
        service.crear({ userId: USER_ID, vehicleId: VEHICLE_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza la creación si el vehículo no existe en vehiculos-service', async () => {
      httpService.get
        .mockReturnValueOnce(of({ data: {} })) // usuario OK
        .mockReturnValueOnce(throwError(() => new Error('404'))); // vehículo falla

      await expect(
        service.crear({ userId: USER_ID, vehicleId: VEHICLE_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si ya existe exactamente la misma clave compuesta (RF1)', async () => {
      httpService.get.mockReturnValue(of({ data: {} }));
      asignacionRepository.findOne.mockResolvedValueOnce({
        userId: USER_ID,
        vehicleId: VEHICLE_ID,
        estado: EstadoAsignacion.ACTIVA,
      });

      await expect(
        service.crear({ userId: USER_ID, vehicleId: VEHICLE_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si el vehículo ya tiene una asignación ACTIVA con OTRO usuario (regla de negocio)', async () => {
      httpService.get.mockReturnValue(of({ data: {} }));
      asignacionRepository.findOne
        .mockResolvedValueOnce(null) // no existe la misma clave compuesta
        .mockResolvedValueOnce({
          userId: OTRO_USER_ID,
          vehicleId: VEHICLE_ID,
          estado: EstadoAsignacion.ACTIVA,
        });

      await expect(
        service.crear({ userId: USER_ID, vehicleId: VEHICLE_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('permite asignar un vehículo a un nuevo usuario si su asignación anterior está FINALIZADA', async () => {
      httpService.get.mockReturnValue(of({ data: {} }));
      asignacionRepository.findOne
        .mockResolvedValueOnce(null) // no existe la misma clave compuesta
        .mockResolvedValueOnce(null); // la búsqueda filtra por ACTIVA, así que una FINALIZADA no aparece aquí

      const resultado = await service.crear({
        userId: USER_ID,
        vehicleId: VEHICLE_ID,
      });

      expect(resultado.estado).toBe(EstadoAsignacion.ACTIVA);
    });
  });

  describe('finalizar', () => {
    it('finaliza una asignación ACTIVA correctamente', async () => {
      asignacionRepository.findOne.mockResolvedValueOnce({
        userId: USER_ID,
        vehicleId: VEHICLE_ID,
        estado: EstadoAsignacion.ACTIVA,
      });

      const resultado = await service.finalizar(USER_ID, VEHICLE_ID);

      expect(resultado.estado).toBe(EstadoAsignacion.FINALIZADA);
      expect(resultado.fechaFinalizacion).toBeInstanceOf(Date);
    });

    it('lanza NotFoundException si la asignación no existe', async () => {
      asignacionRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.finalizar(USER_ID, VEHICLE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza finalizar una asignación que ya está FINALIZADA', async () => {
      asignacionRepository.findOne.mockResolvedValueOnce({
        userId: USER_ID,
        vehicleId: VEHICLE_ID,
        estado: EstadoAsignacion.FINALIZADA,
      });

      await expect(service.finalizar(USER_ID, VEHICLE_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('eliminar', () => {
    it('elimina una asignación existente', async () => {
      const asignacionExistente = { userId: USER_ID, vehicleId: VEHICLE_ID };
      asignacionRepository.findOne.mockResolvedValueOnce(asignacionExistente);

      await service.eliminar(USER_ID, VEHICLE_ID);

      expect(asignacionRepository.remove).toHaveBeenCalledWith(
        asignacionExistente,
      );
    });

    it('lanza NotFoundException si la asignación a eliminar no existe', async () => {
      asignacionRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.eliminar(USER_ID, VEHICLE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('consultarFlotaPorUsuario (RF3)', () => {
    it('devuelve flota vacía si el usuario no tiene asignaciones activas', async () => {
      httpService.get.mockReturnValueOnce(of({ data: {} })); // valida que el usuario existe
      asignacionRepository.find.mockResolvedValueOnce([]);

      const resultado = await service.consultarFlotaPorUsuario(USER_ID);

      expect(resultado.totalVehiculos).toBe(0);
      expect(resultado.vehiculos).toEqual([]);
    });

    it('agrega correctamente tipo y categoría desde vehiculos-service vía batch', async () => {
      httpService.get.mockReturnValueOnce(of({ data: {} })); // usuario existe
      asignacionRepository.find.mockResolvedValueOnce([
        {
          userId: USER_ID,
          vehicleId: VEHICLE_ID,
          estado: EstadoAsignacion.ACTIVA,
        },
      ]);
      httpService.post.mockReturnValueOnce(
        of({
          data: [
            {
              id: VEHICLE_ID,
              placa: 'PBA-3256',
              marca: 'Renault',
              modelo: 'Duster',
              clasificacion: 'Gasolina',
              tipo: 'Auto',
            },
          ],
        }),
      );

      const resultado = await service.consultarFlotaPorUsuario(USER_ID);

      expect(resultado.totalVehiculos).toBe(1);
      expect(resultado.vehiculos[0]).toMatchObject({
        vehicleId: VEHICLE_ID,
        placa: 'PBA-3256',
        categoria: 'Gasolina',
      });
      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:3002/vehiculos/batch',
        { ids: [VEHICLE_ID] },
      );
    });

    it('lanza BadRequestException si vehiculos-service falla en el batch', async () => {
      httpService.get.mockReturnValueOnce(of({ data: {} }));
      asignacionRepository.find.mockResolvedValueOnce([
        {
          userId: USER_ID,
          vehicleId: VEHICLE_ID,
          estado: EstadoAsignacion.ACTIVA,
        },
      ]);
      httpService.post.mockReturnValueOnce(throwError(() => new Error('500')));

      await expect(service.consultarFlotaPorUsuario(USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
