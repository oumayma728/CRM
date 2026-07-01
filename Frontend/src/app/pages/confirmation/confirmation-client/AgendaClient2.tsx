import AgendaCalendarPage from './AgendaCalendarPage';

export default function AgendaClient2() {
  return (
    <AgendaCalendarPage
      title="Agenda Client 2"
      icon="👥"
      fetchEndpoint="confirmation2/agenda"
      updateEndpoint="confirmation2/rdv"
    />
  );
}
