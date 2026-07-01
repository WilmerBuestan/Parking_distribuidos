import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TicketsService } from './tickets.service';
import { Ticket, EstadoTicket, TipoVehiculo, TipoEspacio } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('TicketsService', () => {
  let service: TicketsService;
  let mockTicketRepository: jest.Mocked<Repository<Ticket>>;
  let mockHttpService: jest.Mocked<HttpService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  const createMockResponse = <T>(data: T): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  });

  beforeEach(async () => {
    mockTicketRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    mockHttpService = {
      get: jest.fn(),
      patch: jest.fn(),
    } as any;

    mockConfigService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTicketRepository,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    mockConfigService.get.mockReturnValue('http://localhost:3000');
  });

  describe('crearEntrada', () => {
    it('debe crear un ticket exitosamente', async () => {
      const createTicketDto: CreateTicketDto = {
        cedula: '1234567890',
        placa: 'ABC-1234',
        zonaId: 'zona-1',
      };

      const persona = { id: 'persona-1', dni: '1234567890', firstName: 'Juan' };
      const vehiculo = {
        id: 'vehiculo-1',
        placa: 'ABC-1234',
        tipo: 'Auto',
        tipoVehiculo: 'Auto',
      };
      const espacio = {
        id: 'espacio-1',
        tipo_espacio: 'REGULAR',
      };

      mockHttpService.get.mockReturnValueOnce(of(createMockResponse(persona)));
      mockHttpService.get.mockReturnValueOnce(of(createMockResponse(vehiculo)));
      mockHttpService.get.mockReturnValueOnce(of(createMockResponse({ disponible: true })));
      mockHttpService.get.mockReturnValueOnce(of(createMockResponse({ disponible: true })));
      mockHttpService.patch.mockReturnValueOnce(of(createMockResponse(espacio)));

      const ticket = {
        id: 'ticket-1',
        cedula: createTicketDto.cedula,
        placa: createTicketDto.placa,
        idUsuario: persona.id,
        idVehiculo: vehiculo.id,
        tipoVehiculo: TipoVehiculo.AUTO,
        tipoEspacio: TipoEspacio.REGULAR,
        zonaId: createTicketDto.zonaId,
        espacioId: espacio.id,
        fechaHoraIngreso: new Date(),
        estado: EstadoTicket.ACTIVO,
      };

      mockTicketRepository.create.mockReturnValue(ticket as any);
      mockTicketRepository.save.mockResolvedValue(ticket as any);
      mockHttpService.patch.mockReturnValueOnce(of(createMockResponse({})));

      const resultado = await service.crearEntrada(createTicketDto);

      expect(resultado).toEqual(ticket);
      expect(mockTicketRepository.create).toHaveBeenCalled();
      expect(mockTicketRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar error si la persona no existe', async () => {
      const createTicketDto: CreateTicketDto = {
        cedula: 'INVALIDA',
        placa: 'ABC-1234',
        zonaId: 'zona-1',
      };

      mockHttpService.get.mockReturnValueOnce(throwError(() => new Error('Not found')));

      await expect(service.crearEntrada(createTicketDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar error si el vehículo no está disponible', async () => {
      const createTicketDto: CreateTicketDto = {
        cedula: '1234567890',
        placa: 'ABC-1234',
        zonaId: 'zona-1',
      };

      const persona = { id: 'persona-1', dni: '1234567890', firstName: 'Juan' };
      const vehiculo = {
        id: 'vehiculo-1',
        placa: 'ABC-1234',
        tipo: 'Auto',
        tipoVehiculo: 'Auto',
      };

      mockHttpService.get.mockReturnValueOnce(of(createMockResponse(persona)));
      mockHttpService.get.mockReturnValueOnce(of(createMockResponse(vehiculo)));
      mockHttpService.get.mockReturnValueOnce(of(createMockResponse({ disponible: false })));

      await expect(service.crearEntrada(createTicketDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('procesarSalida', () => {
    it('debe procesar la salida exitosamente', async () => {
      const ticketId = 'ticket-1';
      const ahora = new Date();
      const hace1Hora = new Date(ahora.getTime() - 60 * 60 * 1000);

      const ticket: any = {
        id: ticketId,
        cedula: '1234567890',
        placa: 'ABC-1234',
        idUsuario: 'usuario-1',
        idVehiculo: 'vehiculo-1',
        espacioId: 'espacio-1',
        tipoVehiculo: TipoVehiculo.AUTO,
        tipoEspacio: TipoEspacio.REGULAR,
        zonaId: 'zona-1',
        fechaHoraIngreso: hace1Hora,
        estado: EstadoTicket.ACTIVO,
      };

      mockTicketRepository.findOne.mockResolvedValue(ticket);
      mockHttpService.get.mockReturnValueOnce(
        of(createMockResponse({ tarifaPorHora: 2.0 })),
      );
      mockTicketRepository.save.mockResolvedValue({
        ...ticket,
        fechaHoraSalida: ahora,
        tiempoMinutos: 60,
        valorRecaudado: 2.0,
      });
      mockHttpService.patch.mockReturnValue(of(createMockResponse({})));

      const resultado = await service.procesarSalida(ticketId);

      expect(resultado.fechaHoraSalida).toBeDefined();
      expect(resultado.tiempoMinutos).toBe(60);
      expect(resultado.valorRecaudado).toBe(2.0);
      expect(mockTicketRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar error si el ticket no existe', async () => {
      mockTicketRepository.findOne.mockResolvedValue(null);

      await expect(service.procesarSalida('ticket-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar error si el ticket no está activo', async () => {
      const ticket: any = {
        id: 'ticket-1',
        estado: EstadoTicket.PAGADO,
      };

      mockTicketRepository.findOne.mockResolvedValue(ticket);

      await expect(service.procesarSalida('ticket-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('procesarPago', () => {
    it('debe procesar el pago exitosamente', async () => {
      const processPaymentDto: ProcessPaymentDto = {
        ticketId: 'ticket-1',
        montoPagado: 5.0,
      };

      const ticket: any = {
        id: 'ticket-1',
        cedula: '1234567890',
        placa: 'ABC-1234',
        estado: EstadoTicket.ACTIVO,
        valorRecaudado: 3.0,
      };

      mockTicketRepository.findOne.mockResolvedValue(ticket);
      mockTicketRepository.save.mockResolvedValue({
        ...ticket,
        estado: EstadoTicket.PAGADO,
      });
      mockHttpService.patch.mockReturnValue(of(createMockResponse({})));

      const resultado = await service.procesarPago(processPaymentDto);

      expect(resultado.estado).toBe(EstadoTicket.PAGADO);
      expect(mockTicketRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar error si el monto es insuficiente', async () => {
      const processPaymentDto: ProcessPaymentDto = {
        ticketId: 'ticket-1',
        montoPagado: 1.0,
      };

      const ticket: any = {
        id: 'ticket-1',
        estado: EstadoTicket.ACTIVO,
        valorRecaudado: 5.0,
      };

      mockTicketRepository.findOne.mockResolvedValue(ticket);

      await expect(service.procesarPago(processPaymentDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar error si el ticket ya está pagado', async () => {
      const processPaymentDto: ProcessPaymentDto = {
        ticketId: 'ticket-1',
        montoPagado: 5.0,
      };

      const ticket: any = {
        id: 'ticket-1',
        estado: EstadoTicket.PAGADO,
      };

      mockTicketRepository.findOne.mockResolvedValue(ticket);

      await expect(service.procesarPago(processPaymentDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('buscarPorCedula', () => {
    it('debe buscar tickets por cédula', async () => {
      const cedula = '1234567890';
      const tickets: any[] = [
        {
          id: 'ticket-1',
          cedula,
          estado: EstadoTicket.ACTIVO,
        },
      ];

      mockTicketRepository.find.mockResolvedValue(tickets);

      const resultado = await service.buscarPorCedula(cedula);

      expect(resultado).toEqual(tickets);
      expect(mockTicketRepository.find).toHaveBeenCalledWith({
        where: { cedula },
        order: { fechaHoraIngreso: 'DESC' },
      });
    });

    it('debe lanzar error si la cédula está vacía', async () => {
      await expect(service.buscarPorCedula('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('buscarPorPlaca', () => {
    it('debe buscar tickets por placa', async () => {
      const placa = 'ABC-1234';
      const tickets: any[] = [
        {
          id: 'ticket-1',
          placa,
          estado: EstadoTicket.ACTIVO,
        },
      ];

      mockTicketRepository.find.mockResolvedValue(tickets);

      const resultado = await service.buscarPorPlaca(placa);

      expect(resultado).toEqual(tickets);
      expect(mockTicketRepository.find).toHaveBeenCalledWith({
        where: { placa },
        order: { fechaHoraIngreso: 'DESC' },
      });
    });

    it('debe lanzar error si la placa está vacía', async () => {
      await expect(service.buscarPorPlaca('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('anularTicket', () => {
    it('debe anular un ticket exitosamente', async () => {
      const ticket: any = {
        id: 'ticket-1',
        cedula: '1234567890',
        placa: 'ABC-1234',
        estado: EstadoTicket.ACTIVO,
        espacioId: 'espacio-1',
      };

      mockTicketRepository.findOne.mockResolvedValue(ticket);
      mockTicketRepository.save.mockResolvedValue({
        ...ticket,
        estado: EstadoTicket.ANULADO,
      });
      mockHttpService.patch.mockReturnValue(of(createMockResponse({})));

      const resultado = await service.anularTicket('ticket-1');

      expect(resultado.estado).toBe(EstadoTicket.ANULADO);
      expect(mockTicketRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar error si el ticket está pagado', async () => {
      const ticket: any = {
        id: 'ticket-1',
        estado: EstadoTicket.PAGADO,
      };

      mockTicketRepository.findOne.mockResolvedValue(ticket);

      await expect(service.anularTicket('ticket-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('calcularValorRecaudado', () => {
    it('debe calcular tarifa correcta para auto en espacio regular', () => {
      const valor = service['calcularValorRecaudado'](
        60,
        2.0,
        TipoVehiculo.AUTO,
        TipoEspacio.REGULAR,
      );
      expect(valor).toBe(2.0);
    });

    it('debe aplicar descuento para motocicleta', () => {
      const valor = service['calcularValorRecaudado'](
        60,
        2.0,
        TipoVehiculo.MOTOCICLETA,
        TipoEspacio.REGULAR,
      );
      expect(valor).toBe(1.0);
    });

    it('debe aplicar aumento para camioneta', () => {
      const valor = service['calcularValorRecaudado'](
        60,
        2.0,
        TipoVehiculo.CAMIONETA,
        TipoEspacio.REGULAR,
      );
      expect(valor).toBe(3.0);
    });

    it('debe aplicar ajuste por espacio preferente', () => {
      const valor = service['calcularValorRecaudado'](
        60,
        2.0,
        TipoVehiculo.AUTO,
        TipoEspacio.PREFERENTE,
      );
      expect(valor).toBe(2.4);
    });

    it('debe aplicar ajuste por espacio discapacitado', () => {
      const valor = service['calcularValorRecaudado'](
        60,
        2.0,
        TipoVehiculo.AUTO,
        TipoEspacio.DISCAPACITADO,
      );
      expect(valor).toBe(1.6);
    });
  });

  describe('findActivos', () => {
    it('debe obtener todos los tickets activos', async () => {
      const tickets: any[] = [
        { id: 'ticket-1', estado: EstadoTicket.ACTIVO },
        { id: 'ticket-2', estado: EstadoTicket.ACTIVO },
      ];

      mockTicketRepository.find.mockResolvedValue(tickets);

      const resultado = await service.findActivos();

      expect(resultado).toEqual(tickets);
      expect(mockTicketRepository.find).toHaveBeenCalledWith({
        where: { estado: EstadoTicket.ACTIVO },
        order: { fechaHoraIngreso: 'ASC' },
      });
    });
  });
});
