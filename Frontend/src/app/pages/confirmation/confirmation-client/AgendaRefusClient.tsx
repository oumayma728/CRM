import AgendaCalendarPage from './AgendaCalendarPage';

export default function AgendaRefusClient() {
  return (
    <AgendaCalendarPage
      title="Agenda Refus"
      icon="❌"
      fetchEndpoint="confirmation1/agenda-refus"
      updateEndpoint="confirmation1/rdv"
    />
  );
}
