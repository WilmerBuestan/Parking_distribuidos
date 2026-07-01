import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { EstadoTicket, TipoVehiculo, TipoEspacio } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: TicketsService;

  const mockTicket = {
    id: 'ticket-1',
    cedula: '1234567890',
    placa: 'ABC-1234',
    idUsuario: 'usuario-1',
    idVehiculo: 'vehiculo-1',
    idEmpleado: null,
    tipoVehiculo: TipoVehiculo.AUTO,
    tipoEspacio: TipoEspacio.REGULAR,
    zonaId: 'zona-1',
    espacioId: 'espacio-1',
    fechaHoraIngreso: new Date(),
    fechaHoraSalida: null,
    tiempoMinutos: null,
    valorRecaudado: null,
    estado: EstadoTicket.ACTIVO,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: {
            crearEntrada: jest.fn(),
            procesarSalida: jest.fn(),
            procesarPago: jest.fn(),
            anularTicket: jest.fn(),
            findActivos: jest.fn(),
            findOne: jest.fn(),
            buscarPorCedula: jest.fn(),
            buscarPorPlaca: jest.fn(),
            buscar: jest.fn(),
            obtenerPorEstado: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get<TicketsService>(TicketsService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('crearEntrada', () => {
    it('debe crear una entrada', async () => {
      const createTicketDto: CreateTicketDto = {
        cedula: '1234567890',
        placa: 'ABC-1234',
        zonaId: 'zona-1',
      };

      jest.spyOn(service, 'crearEntrada').mockResolvedValue(mockTicket as any);

      const resultado = await controller.crearEntrada(createTicketDto);

      expect(resultado).toEqual(mockTicket);
      expect(service.crearEntrada).toHaveBeenCalledWith(createTicketDto);
    });
  });

  describe('procesarSalida', () => {
    it('debe procesar la salida', async () => {
      const ticketConSalida = {
        ...mockTicket,
        fechaHoraSalida: new Date(),
        tiempoMinutos: 60,
        valorRecaudado: 2.0,
      };

      jest.spyOn(service, 'procesarSalida').mockResolvedValue(ticketConSalida as any);

      const resultado = await controller.procesarSalida('ticket-1');

      expect(resultado.valorRecaudado).toBe(2.0);
      expect(service.procesarSalida).toHaveBeenCalledWith('ticket-1');
    });
  });

  describe('procesarPago', () => {
    it('debe procesar el pago', async () => {
      const processPaymentDto: ProcessPaymentDto = {
        ticketId: 'ticket-1',
        montoPagado: 2.0,
      };

      const ticketPagado = {
        ...mockTicket,
        estado: EstadoTicket.PAGADO,
      };

      jest.spyOn(service, 'procesarPago').mockResolvedValue(ticketPagado as any);

      const resultado = await controller.procesarPago(processPaymentDto);

      expect(resultado.estado).toBe(EstadoTicket.PAGADO);
      expect(service.procesarPago).toHaveBeenCalledWith(processPaymentDto);
    });
  });

  describe('anularTicket', () => {
    it('debe anular un ticket', async () => {
      const ticketAnulado = {
        ...mockTicket,
        estado: EstadoTicket.ANULADO,
      };

      jest.spyOn(service, 'anularTicket').mockResolvedValue(ticketAnulado as any);

      const resultado = await controller.anularTicket('ticket-1');

      expect(resultado.estado).toBe(EstadoTicket.ANULADO);
      expect(service.anularTicket).toHaveBeenCalledWith('ticket-1');
    });
  });

  describe('findActivos', () => {
    it('debe retornar tickets activos', async () => {
      const tickets = [mockTicket];

      jest.spyOn(service, 'findActivos').mockResolvedValue(tickets as any);

      const resultado = await controller.findActivos();

      expect(resultado).toEqual(tickets);
      expect(service.findActivos).toHaveBeenCalled();
    });
  });

  describe('buscar', () => {
    it('debe buscar por cédula', async () => {
      const tickets = [mockTicket];

      jest.spyOn(service, 'buscar').mockResolvedValue(tickets as any);

      const resultado = await controller.buscar('1234567890');

      expect(resultado).toEqual(tickets);
      expect(service.buscar).toHaveBeenCalledWith({
        cedula: '1234567890',
        placa: undefined,
      });
    });

    it('debe buscar por placa', async () => {
      const tickets = [mockTicket];

      jest.spyOn(service, 'buscar').mockResolvedValue(tickets as any);

      const resultado = await controller.buscar(undefined, 'ABC-1234');

      expect(resultado).toEqual(tickets);
      expect(service.buscar).toHaveBeenCalledWith({
        cedula: undefined,
        placa: 'ABC-1234',
      });
    });
  });

  describe('buscarPorCedula', () => {
    it('debe buscar tickets por cédula', async () => {
      const tickets = [mockTicket];

      jest.spyOn(service, 'buscarPorCedula').mockResolvedValue(tickets as any);

      const resultado = await controller.buscarPorCedula('1234567890');

      expect(resultado).toEqual(tickets);
      expect(service.buscarPorCedula).toHaveBeenCalledWith('1234567890');
    });
  });

  describe('buscarPorPlaca', () => {
    it('debe buscar tickets por placa', async () => {
      const tickets = [mockTicket];

      jest.spyOn(service, 'buscarPorPlaca').mockResolvedValue(tickets as any);

      const resultado = await controller.buscarPorPlaca('ABC-1234');

      expect(resultado).toEqual(tickets);
      expect(service.buscarPorPlaca).toHaveBeenCalledWith('ABC-1234');
    });
  });

  describe('obtenerPorEstado', () => {
    it('debe obtener tickets por estado', async () => {
      const tickets = [mockTicket];

      jest
        .spyOn(service, 'obtenerPorEstado')
        .mockResolvedValue(tickets as any);

      const resultado = await controller.obtenerPorEstado(EstadoTicket.ACTIVO);

      expect(resultado).toEqual(tickets);
      expect(service.obtenerPorEstado).toHaveBeenCalledWith(EstadoTicket.ACTIVO);
    });
  });

  describe('findOne', () => {
    it('debe obtener un ticket por ID', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTicket as any);

      const resultado = await controller.findOne('ticket-1');

      expect(resultado).toEqual(mockTicket);
      expect(service.findOne).toHaveBeenCalledWith('ticket-1');
    });
  });
});
