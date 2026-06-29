import AgendaCalendarPage from './AgendaCalendarPage';

export default function AgendaEBIClient() {
  return (
    <AgendaCalendarPage
      title="Agenda EBI"
      icon="🏢"
      fetchEndpoint="confirmation1/agenda-ebi"
      updateEndpoint="confirmation1/rdv"
    />
  );
}
