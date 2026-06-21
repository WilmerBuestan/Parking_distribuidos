import { useState } from 'react';
import BuscarPersona from './components/BuscarPersona';
import BuscarVehiculo from './components/BuscarVehiculo';
import ListaZonas from './components/ListaZonas';
import EmitirTicket from './components/EmitirTicket';
import TicketsActivos from './components/TicketsActivos';

function App() {
  // Contador simple: cada vez que sube, TicketsActivos sabe que debe refrescar ya mismo.
  const [refrescoTickets, setRefrescoTickets] = useState(0);

  function handleTicketCreado() {
    setRefrescoTickets((n) => n + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sistema de Parqueadero</h1>
        <p className="text-sm text-gray-500">
          Frontend React conectado vía Kong (localhost:8000) a los 4 microservicios
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <EmitirTicket onTicketCreado={handleTicketCreado} />
          <BuscarPersona />
          <BuscarVehiculo />
        </div>

        <div className="space-y-6">
          <TicketsActivos refrescarSenal={refrescoTickets} />
          <ListaZonas />
        </div>
      </div>
    </div>
  );
}

export default App;