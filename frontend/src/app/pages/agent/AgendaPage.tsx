import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone,
  CheckCircle, XCircle, Clock, Plus, X, Zap, TrendingUp,
  Activity, User, MapPin, Home, Thermometer, Shield, Banknote,
  FileText, Star, AlertTriangle, Eye
} from 'lucide-react';
import * as api from '../../services/api';
import toast from 'react-hot-toast';

interface Appointment {
  id: number;
  agent_id: number;
  agent_name?: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  project_type: string;
  appointment_date: string;
  appointment_time: string;
  quality_score: number;
  financing_status: string;
  financing_label?: string;
  color_code?: string;
  status: string;
  revenus: number;
  chauffage: string;
  toiture: string;
  isolation: string;
  consommation: number;
  credit_score: number;
  situation_bancaire: string;
  notes: string;
  created_at: string;
  updated_at: string;
  recent_calls?: any[];
}

interface RdvDetail {
  appointment: Appointment;
  aiScore: any | null;
  fakeRdvResult: any | null;
}

const HOURS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00'
];

function getScoreBg(score: number) {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 50) return 'bg-amber-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreText(score: number) {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 50) return 'text-amber-400';
  if (score >= 30) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreLabel(score: number) {
  if (score >= 90) return 'Premium';
  if (score >= 70) return 'Bon prospect';
  if (score >= 50) return 'Moyen';
  if (score >= 30) return 'Risque';
  return 'Refus';
}

function getScoreBorder(score: number) {
  if (score >= 90) return 'border-l-emerald-500';
  if (score >= 70) return 'border-l-blue-500';
  if (score >= 50) return 'border-l-amber-500';
  if (score >= 30) return 'border-l-orange-500';
  return 'border-l-red-500';
}

function getScoreRing(score: number) {
  if (score >= 90) return 'ring-emerald-500/30';
  if (score >= 70) return 'ring-blue-500/30';
  if (score >= 50) return 'ring-amber-500/30';
  if (score >= 30) return 'ring-orange-500/30';
  return 'ring-red-500/30';
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  pending:     { bg: 'bg-orange-500/20', text: 'text-orange-400',   border: 'border-l-orange-500',   dot: 'bg-orange-500',   label: 'En attente' },
  confirmed:   { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-l-emerald-500',  dot: 'bg-emerald-500', label: 'Confirmé' },
  cancelled:   { bg: 'bg-red-500/20',    text: 'text-red-400',     border: 'border-l-red-500',      dot: 'bg-red-500',     label: 'Annulé' },
  rescheduled: { bg: 'bg-blue-500/20',   text: 'text-blue-400',    border: 'border-l-blue-500',     dot: 'bg-blue-500',    label: 'Reprogrammé' },
  nrp:         { bg: 'bg-gray-500/20',   text: 'text-gray-400',    border: 'border-l-gray-500',      dot: 'bg-gray-500',    label: 'NRP' },
  hc:          { bg: 'bg-gray-500/20',   text: 'text-gray-400',    border: 'border-l-gray-500',      dot: 'bg-gray-500',    label: 'HC' },
  not_interested: { bg: 'bg-gray-500/20', text: 'text-gray-400',   border: 'border-l-gray-500',      dot: 'bg-gray-500',    label: 'Pas intéressé' },
};

function getStatusStyle(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS.pending;
}

function getFinancingBg(label: string) {
  switch (label) {
    case 'premium': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'financable': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'en_attente': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'rappel': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default: return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
}

function getFinancingLabelFr(label: string) {
  switch (label) {
    case 'premium': return 'Premium';
    case 'financable': return 'Finançable';
    case 'en_attente': return 'En attente';
    case 'rappel': return 'Rappel';
    case 'refuse': return 'Refusé';
    default: return label;
  }
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedRdv, setSelectedRdv] = useState<RdvDetail | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newForm, setNewForm] = useState({
    client_name: '', client_phone: '', client_email: '',
    project_type: 'PV', appointment_date: '', appointment_time: '09:00',
    revenus: 0, chauffage: 'electrique', toiture: 'tuiles',
    isolation: 'moyenne', consommation: 0, credit_score: 50,
    situation_bancaire: 'bonne', notes: ''
  });

  const dateStr = (d: Date) => d.toISOString().split('T')[0];

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAppointments(dateStr(selectedDate));
      setAppointments(data);
    } catch (e) {
      console.error('Failed to fetch appointments', e);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleRdvClick = async (apt: Appointment) => {
    setSelectedRdv({ appointment: apt, aiScore: null, fakeRdvResult: null });
    setShowPanel(true);
    try {
      const [score, fakeRdv] = await Promise.all([
        api.aiScore({
          revenus: apt.revenus, chauffage: apt.chauffage, toiture: apt.toiture,
          isolation: apt.isolation, consommation: apt.consommation,
          credit_score: apt.credit_score, situation_bancaire: apt.situation_bancaire,
          project_type: apt.project_type
        }),
        api.aiDetectFakeRdv({
          id: apt.id, agent_id: apt.agent_id, quality_score: apt.quality_score,
          client_phone: apt.client_phone, appointment_time: apt.appointment_time,
          revenus: apt.revenus, chauffage: apt.chauffage, toiture: apt.toiture
        }).catch(() => null)
      ]);
      setSelectedRdv(prev => prev ? { ...prev, aiScore: score, fakeRdvResult: fakeRdv } : null);
    } catch (e) {
      console.error('AI scoring failed', e);
    }
  };

  const handleCreate = async () => {
    try {
      await api.createAppointment({
        ...newForm,
        appointment_date: newForm.appointment_date || dateStr(selectedDate)
      });
      setShowNewModal(false);
      setNewForm({
        client_name: '', client_phone: '', client_email: '',
        project_type: 'PV', appointment_date: '', appointment_time: '09:00',
        revenus: 0, chauffage: 'electrique', toiture: 'tuiles',
        isolation: 'moyenne', consommation: 0, credit_score: 50,
        situation_bancaire: 'bonne', notes: ''
      });
      fetchAppointments();
    } catch (e) {
      console.error('Create failed', e);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.updateAppointment(id, { status });
      fetchAppointments();
      if (selectedRdv && selectedRdv.appointment.id === id) {
        setSelectedRdv(prev => prev ? {
          ...prev,
          appointment: { ...prev.appointment, status }
        } : null);
      }
    } catch (e) {
      console.error('Update failed', e);
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < adjustedFirstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getAppointmentsForDay = (day: number) => {
    const ds = dateStr(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    return appointments.filter(a => a.appointment_date === ds);
  };

  const dayAppointments = appointments.filter(
    a => a.appointment_date === dateStr(selectedDate)
  );

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideInRight { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes slideOutRight { from { transform:translateX(0); opacity:1; } to { transform:translateX(100%); opacity:0; } }
        @keyframes pulse-glow { 0%,100% { box-shadow:0 0 8px rgba(124,58,237,0.3); } 50% { box-shadow:0 0 20px rgba(124,58,237,0.6); } }
        .animate-fadeIn { animation: fadeIn .5s ease-out; }
        .animate-slideInRight { animation: slideInRight .3s ease-out; }
        .pulse-glow { animation: pulse-glow 2s infinite; }
        .scrollbar-thin::-webkit-scrollbar { width:4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background:transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background:rgba(124,58,237,0.3); border-radius:4px; }
      `}</style>

      <div className="min-h-screen bg-[#0d0d1a] dark:bg-[#0d0d1a] p-4 md:p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">
                Mon Agenda
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
            >
              <Plus className="w-4 h-4" /> Nouveau RDV
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total RDV', value: stats.total, icon: CalendarIcon, color: 'from-[#7c3aed]/20 to-[#6d28d9]/20 border-[#7c3aed]/30' },
              { label: 'En attente', value: stats.pending, icon: Clock, color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30' },
              { label: 'Confirmés', value: stats.confirmed, icon: CheckCircle, color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30' },
              { label: 'Annulés', value: stats.cancelled, icon: XCircle, color: 'from-red-500/20 to-rose-500/20 border-red-500/30' },
            ].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 border backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                  </div>
                  <s.icon className="w-6 h-6 text-gray-500 opacity-50" />
                </div>
              </div>
            ))}
          </div>

          {/* Main Layout: Calendar + Day View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Mini Calendar */}
            <div className="lg:col-span-3 bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white capitalize">
                  {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                </h3>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-all">
                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-all">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {['L','M','M','J','V','S','D'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] text-gray-500 font-medium py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day, i) => {
                  if (day === null) return <div key={`e${i}`} className="h-8" />;
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const ds = dateStr(date);
                  const isToday = dateStr(new Date()) === ds;
                  const isSelected = dateStr(selectedDate) === ds;
                  const dayApts = getAppointmentsForDay(day);
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(date)}
                      className={`h-8 rounded-lg text-xs font-medium flex flex-col items-center justify-center relative transition-all
                        ${isSelected ? 'bg-[#7c3aed] text-white' : isToday ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}
                      `}
                    >
                      {day}
                      {dayApts.length > 0 && (
                         <div className="flex gap-0.5 absolute bottom-0.5">
                           {dayApts.slice(0, 3).map((a, ai) => (
                             <div key={ai} className={`w-1 h-1 rounded-full ${getStatusStyle(a.status).dot}`} />
                           ))}
                         </div>
                       )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Statuts RDV</p>
                {[
                  { label: 'En attente', color: 'bg-orange-500' },
                  { label: 'Confirmé', color: 'bg-emerald-500' },
                  { label: 'Annulé', color: 'bg-red-500' },
                  { label: 'Reprogrammé', color: 'bg-blue-500' },
                  { label: 'NRP', color: 'bg-gray-500' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${l.color}`} />
                    <span className="text-[10px] text-gray-400">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: Day Timeline */}
            <div className="lg:col-span-5 bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-[#7c3aed]" />
                  <h3 className="text-sm font-bold text-white">
                    {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                </div>
                <span className="text-xs text-gray-500">{dayAppointments.length} RDV</span>
              </div>

              <div className="overflow-y-auto max-h-[500px] scrollbar-thin">
                {HOURS.map(hour => {
                  const hourApts = dayAppointments.filter(a => a.appointment_time === hour);
                  return (
                    <div key={hour} className="flex border-b border-white/[0.03] last:border-0">
                      <div className="w-16 py-3 px-2 text-[10px] text-gray-500 font-mono shrink-0 border-r border-white/[0.03]">
                        {hour}
                      </div>
                      <div className="flex-1 py-2 px-2 min-h-[44px]">
                        {hourApts.length > 0 ? hourApts.map(apt => (
                          <button
                            key={apt.id}
                            onClick={() => handleRdvClick(apt)}
                            className={`w-full text-left p-2.5 rounded-lg border-l-3 ${getStatusStyle(apt.status).border}
                              bg-white/[0.03] hover:bg-white/[0.06] transition-all ring-1 ring-white/5
                              flex items-center justify-between gap-2`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-1.5 h-8 rounded-full ${getStatusStyle(apt.status).dot} shrink-0`} />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{apt.client_name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{apt.project_type} · {apt.client_phone || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getStatusStyle(apt.status).bg} ${getStatusStyle(apt.status).text} border-white/10`}>
                                {getStatusStyle(apt.status).label}
                              </span>
                              <span className={`text-xs font-bold ${getScoreText(apt.quality_score)}`}>
                                {apt.quality_score}
                              </span>
                            </div>
                          </button>
                        )) : (
                          <div className="h-full flex items-center opacity-0 hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setNewForm(f => ({ ...f, appointment_time: hour, appointment_date: dateStr(selectedDate) }));
                                setShowNewModal(true);
                              }}
                              className="text-[10px] text-gray-600 hover:text-[#7c3aed] transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Ajouter
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Day Summary List */}
            <div className="lg:col-span-4 bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-white/5 p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#7c3aed]" />
                RDV du jour
              </h3>

              {dayAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <CalendarIcon className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Aucun RDV ce jour</p>
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="mt-3 text-xs text-[#7c3aed] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Créer un RDV
                  </button>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[500px] scrollbar-thin">
                  {dayAppointments
                    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                    .map(apt => (
                    <div
                      key={apt.id}
                      onClick={() => handleRdvClick(apt)}
                      className={`w-full text-left p-3 rounded-xl border-l-4 ${getStatusStyle(apt.status).border}
                        bg-white/[0.03] hover:bg-white/[0.06] transition-all group cursor-pointer`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-xs font-bold text-white">{apt.appointment_time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getStatusStyle(apt.status).bg} ${getStatusStyle(apt.status).text} border-white/10`}>
                            {getStatusStyle(apt.status).label}
                          </span>
                          <span className={`text-xs font-bold ${getScoreText(apt.quality_score)}`}>
                            {apt.quality_score}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-white truncate">{apt.client_name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{apt.project_type} · {apt.client_phone || 'Sans téléphone'}</p>
                      {apt.status === 'pending' && (
                        <div className="flex gap-1.5 mt-2">
                          <span className={`text-[10px] px-2 py-1 rounded-md ${getStatusStyle('pending').bg} ${getStatusStyle('pending').text} border border-orange-500/20`}>
                            En attente confirmation
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== RDV DETAIL PANEL (Slide-in) ===== */}
        {showPanel && selectedRdv && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPanel(false)} />
            <div className="relative w-full max-w-lg bg-[#12122a] border-l border-white/5 h-full overflow-y-auto animate-slideInRight scrollbar-thin">
              {/* Panel Header */}
              <div className="sticky top-0 z-10 bg-[#12122a]/95 backdrop-blur-sm border-b border-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getScoreBg(selectedRdv.appointment.quality_score)}`}>
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">{selectedRdv.appointment.client_name}</h2>
                      <p className="text-[10px] text-gray-400">
                        {selectedRdv.appointment.appointment_time} · {selectedRdv.appointment.project_type}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowPanel(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Score bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${getScoreBg(selectedRdv.appointment.quality_score)}`}
                      style={{ width: `${selectedRdv.appointment.quality_score}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold ${getScoreText(selectedRdv.appointment.quality_score)}`}>
                    {selectedRdv.appointment.quality_score}%
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getFinancingBg(selectedRdv.appointment.financing_label || selectedRdv.appointment.financing_status)}`}>
                    {getFinancingLabelFr(selectedRdv.appointment.financing_label || selectedRdv.appointment.financing_status)}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4">

                {/* Section 1: Info Client */}
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-bold text-[#7c3aed] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Informations Client
                  </h4>
                  <div className="space-y-2">
                    {[
                      { icon: User, label: 'Nom', value: selectedRdv.appointment.client_name },
                      { icon: Phone, label: 'Téléphone', value: selectedRdv.appointment.client_phone || 'Non renseigné' },
                      { icon: MapPin, label: 'Email', value: selectedRdv.appointment.client_email || 'Non renseigné' },
                      { icon: Home, label: 'Projet', value: selectedRdv.appointment.project_type === 'PV' ? 'Panneaux Solaires' : 'Pompe à Chaleur' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3 text-xs">
                        <item.icon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="text-gray-400 w-20 shrink-0">{item.label}</span>
                        <span className="text-white font-medium truncate">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Qualification Technique */}
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-bold text-[#7c3aed] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Thermometer className="w-3.5 h-3.5" /> Qualification Technique
                  </h4>
                  <div className="space-y-2">
                    {[
                      { icon: Thermometer, label: 'Chauffage', value: selectedRdv.appointment.chauffage || 'N/A' },
                      { icon: Home, label: 'Toiture', value: selectedRdv.appointment.toiture || 'N/A' },
                      { icon: Shield, label: 'Isolation', value: selectedRdv.appointment.isolation || 'N/A' },
                      { icon: Zap, label: 'Consommation', value: `${selectedRdv.appointment.consommation} kWh` },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3 text-xs">
                        <item.icon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="text-gray-400 w-24 shrink-0">{item.label}</span>
                        <span className="text-white font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Qualification Financière */}
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-bold text-[#7c3aed] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Banknote className="w-3.5 h-3.5" /> Qualification Financière
                  </h4>
                  <div className="space-y-2">
                    {[
                      { icon: Banknote, label: 'Revenus', value: `${selectedRdv.appointment.revenus} €/an` },
                      { icon: Shield, label: 'Score crédit', value: `${selectedRdv.appointment.credit_score}/100` },
                      { icon: FileText, label: 'Situation bancaire', value: selectedRdv.appointment.situation_bancaire || 'N/A' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3 text-xs">
                        <item.icon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="text-gray-400 w-28 shrink-0">{item.label}</span>
                        <span className="text-white font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 4: Analyse IA */}
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-bold text-[#7c3aed] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Analyse IA
                  </h4>

                  {selectedRdv.aiScore ? (
                    <div className="space-y-3">
                      {/* Score breakdown */}
                      <div className="space-y-2">
                        {Object.entries(selectedRdv.aiScore.details || {}).map(([key, detail]: [string, any]) => (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">{detail.label}</span>
                              <span className="text-gray-300 font-medium">
                                {Math.round(detail.value * detail.weight)}pts
                                <span className="text-gray-600 ml-1">({Math.round(detail.weight * 100)}%)</span>
                              </span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] rounded-full"
                                style={{ width: `${detail.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Recommendation */}
                      <div className={`p-3 rounded-lg border ${getFinancingBg(selectedRdv.aiScore.label?.toLowerCase() || 'en_attente')}`}>
                        <p className="text-xs font-medium">{selectedRdv.aiScore.recommendation}</p>
                      </div>

                      {/* Aides */}
                      {selectedRdv.aiScore.eligible_aides && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Aides éligibles</p>
                          {Object.entries(selectedRdv.aiScore.aides_estimees || {}).map(([aide, eligible]: [string, any]) => (
                            <div key={aide} className="flex items-center gap-2 text-xs">
                              {eligible
                                ? <CheckCircle className="w-3 h-3 text-emerald-400" />
                                : <XCircle className="w-3 h-3 text-gray-600" />
                              }
                              <span className={eligible ? 'text-emerald-400' : 'text-gray-600'}>
                                {aide === 'CEE' ? 'Certificats d\'Économies d\'Énergie' :
                                 aide === 'coup_de_pouce' ? 'Coup de Pouce' :
                                 aide === 'TVA_reduite' ? 'TVA Réduite (5.5%)' :
                                 aide === 'eco_ptz' ? 'Éco-PTZ' : aide}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-6 h-6 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2 text-xs text-gray-400">Analyse en cours...</span>
                    </div>
                  )}
                </div>

      {/* Fake RDV Detection */}
      {selectedRdv.fakeRdvResult && (
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className={`w-3.5 h-3.5 ${
              selectedRdv.fakeRdvResult.risk_score >= 60 ? 'text-red-400' :
              selectedRdv.fakeRdvResult.risk_score >= 30 ? 'text-amber-400' : 'text-emerald-400'
            }`} />
            <span className={
              selectedRdv.fakeRdvResult.risk_score >= 60 ? 'text-red-400' :
              selectedRdv.fakeRdvResult.risk_score >= 30 ? 'text-amber-400' : 'text-emerald-400'
            }>Détection Faux RDV</span>
          </h4>

          <div className="flex items-center gap-3 mb-3">
            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
              selectedRdv.fakeRdvResult.risk_score >= 60 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              selectedRdv.fakeRdvResult.risk_score >= 30 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {selectedRdv.fakeRdvResult.verdict}
            </div>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  selectedRdv.fakeRdvResult.risk_score >= 60 ? 'bg-red-500' :
                  selectedRdv.fakeRdvResult.risk_score >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${selectedRdv.fakeRdvResult.risk_score}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${
              selectedRdv.fakeRdvResult.risk_score >= 60 ? 'text-red-400' :
              selectedRdv.fakeRdvResult.risk_score >= 30 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {selectedRdv.fakeRdvResult.risk_score}%
            </span>
          </div>

          {selectedRdv.fakeRdvResult.flags && selectedRdv.fakeRdvResult.flags.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Signaux détectés</p>
              {selectedRdv.fakeRdvResult.flags.map((flag: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    selectedRdv.fakeRdvResult.risk_score >= 60 ? 'bg-red-400' : 'bg-amber-400'
                  }`} />
                  <span className="text-gray-300">{flag}</span>
                </div>
              ))}
            </div>
          )}

          {selectedRdv.fakeRdvResult.risk_score < 30 && (
            <p className="text-[10px] text-emerald-400/80 mt-2">Aucun signal suspect — RDV valide</p>
          )}
        </div>
      )}

      {/* Notes */}
      {selectedRdv.appointment.notes && (
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <h4 className="text-xs font-bold text-[#7c3aed] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> Notes
                    </h4>
                    <p className="text-xs text-gray-300 whitespace-pre-wrap">{selectedRdv.appointment.notes}</p>
                  </div>
                )}

                {/* Recent calls */}
                {selectedRdv.appointment.recent_calls && selectedRdv.appointment.recent_calls.length > 0 && (
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <h4 className="text-xs font-bold text-[#7c3aed] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" /> Appels récents
                    </h4>
                    <div className="space-y-2">
                      {selectedRdv.appointment.recent_calls.map((call: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-gray-400">{call.call_date}</span>
                          <span className={`font-medium ${call.sentiment === 'POSITIVE' ? 'text-emerald-400' : call.sentiment === 'NEGATIVE' ? 'text-red-400' : 'text-amber-400'}`}>
                            {call.performance}
                          </span>
                          <span className="text-gray-300">{call.score_percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Status */}
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-bold text-[#7c3aed] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Statut du RDV
                  </h4>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusStyle(selectedRdv.appointment.status).bg} ${getStatusStyle(selectedRdv.appointment.status).text} border border-white/10`}>
                    <div className={`w-2 h-2 rounded-full ${getStatusStyle(selectedRdv.appointment.status).dot}`} />
                    {getStatusStyle(selectedRdv.appointment.status).label}
                  </div>
                  {selectedRdv.appointment.status === 'pending' && (
                    <div className="space-y-2 mt-2">
                      <p className="text-[10px] text-gray-500">En attente de validation par le Service Qualité</p>
                      <button
                        onClick={async () => {
                          try {
                            await api.updateAppointmentStatus(selectedRdv.appointment.id, 'cancelled');
                            toast.success('RDV annulé');
                            fetchAppointments();
                            setShowPanel(false);
                          } catch (e) {
                            toast.error("Erreur lors de l'annulation");
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 transition-all"
                      >
                        <XCircle className="w-3 h-3" /> Annuler le RDV
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== NEW RDV MODAL ===== */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
            <div className="relative bg-[#12122a] rounded-2xl border border-white/5 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fadeIn scrollbar-thin">
              <div className="sticky top-0 bg-[#12122a] border-b border-white/5 p-4 flex items-center justify-between z-10">
                <h2 className="text-base font-bold text-white">Nouveau Rendez-vous</h2>
                <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-white/5 rounded-xl">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Client info */}
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Informations Client</p>
                  <input
                    type="text" placeholder="Nom du client *"
                    value={newForm.client_name}
                    onChange={e => setNewForm(f => ({ ...f, client_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:border-[#7c3aed] focus:outline-none transition-colors"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="tel" placeholder="Téléphone"
                      value={newForm.client_phone}
                      onChange={e => setNewForm(f => ({ ...f, client_phone: e.target.value }))}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:border-[#7c3aed] focus:outline-none transition-colors"
                    />
                    <input
                      type="email" placeholder="Email"
                      value={newForm.client_email}
                      onChange={e => setNewForm(f => ({ ...f, client_email: e.target.value }))}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:border-[#7c3aed] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* RDV info */}
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Rendez-vous</p>
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={newForm.project_type}
                      onChange={e => setNewForm(f => ({ ...f, project_type: e.target.value }))}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#7c3aed] focus:outline-none transition-colors"
                    >
                      <option value="PV">PV</option>
                      <option value="PAC">PAC</option>
                    </select>
                    <input
                      type="date"
                      value={newForm.appointment_date || dateStr(selectedDate)}
                      onChange={e => setNewForm(f => ({ ...f, appointment_date: e.target.value }))}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#7c3aed] focus:outline-none transition-colors"
                    />
                    <select
                      value={newForm.appointment_time}
                      onChange={e => setNewForm(f => ({ ...f, appointment_time: e.target.value }))}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#7c3aed] focus:outline-none transition-colors"
                    >
                      {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                {/* Qualification technique */}
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Qualification Technique</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newForm.chauffage} onChange={e => setNewForm(f => ({ ...f, chauffage: e.target.value }))}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#7c3aed] focus:outline-none transition-colors">
                      <option value="electrique">Électrique</option>
                      <option value="gaz">Gaz</option>
                      <option value="fioul">Fioul</option>
                      <option value="autre">Autre</option>
                    </select>
                    <select value={newForm.toiture} onChange={e => setNewForm(f => ({ ...f, toiture: e.target.value }))}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#7c3aed] focus:outline-none transition-colors">
                      <option value="tuiles">Tuiles</option>
                      <option value="ardoises">Ardoises</option>
                      <option value="plat">Plat</option>
                      <option value="autre">Autre</option>
                    </select>
                    <select value={newForm.isolation} onChange={e => setNewForm(f => ({ ...f, isolation: e.target.value }))}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#7c3aed] focus:outline-none transition-colors">
                      <option value="bonne">Bonne</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="mauvaise">Mauvaise</option>
                    </select>
                    <input type="number" placeholder="Consommation kWh" value={newForm.consommation || ''}
                      onChange={e => setNewForm(f => ({ ...f, consommation: parseFloat(e.target.value) || 0 }))}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:border-[#7c3aed] focus:outline-none transition-colors" />
                  </div>
                </div>

                {/* Qualification financière */}
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Qualification Financière</p>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="number" placeholder="Revenus €/an" value={newForm.revenus || ''}
                      onChange={e => setNewForm(f => ({ ...f, revenus: parseFloat(e.target.value) || 0 }))}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:border-[#7c3aed] focus:outline-none transition-colors" />
                    <input type="number" placeholder="Score crédit" min="0" max="100" value={newForm.credit_score || ''}
                      onChange={e => setNewForm(f => ({ ...f, credit_score: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:border-[#7c3aed] focus:outline-none transition-colors" />
                    <select value={newForm.situation_bancaire} onChange={e => setNewForm(f => ({ ...f, situation_bancaire: e.target.value }))}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-[#7c3aed] focus:outline-none transition-colors">
                      <option value="excellente">Excellente</option>
                      <option value="bonne">Bonne</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="mauvaise">Mauvaise</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <textarea
                  placeholder="Notes..."
                  value={newForm.notes}
                  onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:border-[#7c3aed] focus:outline-none transition-colors resize-none"
                  rows={3}
                />

                <button
                  onClick={handleCreate}
                  disabled={!newForm.client_name}
                  className="w-full py-3 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer le RDV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </>
    );
  }
