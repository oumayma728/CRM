import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/crmApi';
import { adminService, type ConfirmatriceAgenda, type AgendaDisponible, type AssignAgendaDTO } from '../../services/adminService';
import { Calendar, UserCheck, CheckCircle, XCircle, Loader2, Building2, Users, XCircle as XCircleIcon, ArrowLeft } from 'lucide-react';

export default function ConfirmatricesAgendasPage() {
  const navigate = useNavigate();
  const [confirmatrices, setConfirmatrices] = useState<ConfirmatriceAgenda[]>([]);
  const [agendasDisponibles, setAgendasDisponibles] = useState<AgendaDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<{ id: number; agendaId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [confirmatricesRes, agendasRes] = await Promise.all([
        adminService.getConfirmatricesAgendas(),
        adminService.getAgendasDisponibles()
      ]);
      setConfirmatrices(confirmatricesRes.data);
      setAgendasDisponibles(agendasRes.data);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const toggleAgenda = async (confirmatriceId: number, agendaId: string, currentAssigned: boolean) => {
    setSaving({ id: confirmatriceId, agendaId });
    try {
      const data: AssignAgendaDTO = {
        agendaId,
        assigned: !currentAssigned
      };
      const response = await adminService.assignAgendaToConfirmatrice(confirmatriceId, data);
      
      setConfirmatrices(prev => prev.map(c => 
        c.id === confirmatriceId ? response.data : c
      ));
    } catch (err) {
      console.error('Erreur lors de l\'assignation:', err);
      setError('Erreur lors de la modification des accès');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  // Séparer les confirmatrices
  const confirmatrice1 = confirmatrices.find(c => c.type === 'CONF1');
  const confirmatrice2 = confirmatrices.find(c => c.type === 'CONF2');

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton retour */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground">Gestion des Agendas</h1>
          <p className="text-muted-foreground mt-1">Assignez les agendas aux confirmatrices 1 et 2</p>
        </div>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft size={18} />
          Retour au Dashboard
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg">
          {error}
          <button onClick={fetchData} className="ml-4 text-sm underline">Réessayer</button>
        </div>
      )}

      {/* Liste des agendas disponibles */}
      <div className="glass-card p-4">
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar size={20} />
          Agendas disponibles
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {agendasDisponibles.map((agenda) => (
            <div key={agenda.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="text-2xl">{agenda.icon}</div>
              <div>
                <div className="font-medium text-foreground">{agenda.nom}</div>
                <div className="text-xs text-muted-foreground">{agenda.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmatrice 1 */}
      {confirmatrice1 && (
        <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
          <div className="bg-gradient-to-r from-primary to-primary text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{confirmatrice1.prenom} {confirmatrice1.nom}</h2>
                <p className="text-white/80 text-sm mt-1">{confirmatrice1.email}</p>
              </div>
              <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-semibold">
                Confirmatrice Niveau 1
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-sm font-medium text-foreground mb-2">📋 Agendas accessibles :</p>
            {agendasDisponibles.map((agenda) => {
              const isAssigned = confirmatrice1.agendasAccess.includes(agenda.id);
              const isSaving = saving?.id === confirmatrice1.id && saving?.agendaId === agenda.id;
              
              return (
                <div
                  key={agenda.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isAssigned 
                      ? 'bg-success/10 border-success/30' 
                      : 'bg-muted border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{agenda.icon}</div>
                    <div>
                      <div className="font-medium text-foreground">{agenda.nom}</div>
                      <div className="text-xs text-muted-foreground">{agenda.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAgenda(confirmatrice1.id, agenda.id, isAssigned)}
                    disabled={isSaving}
                    className={`ml-4 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isAssigned
                        ? 'bg-destructive/15 text-destructive hover:bg-destructive/20'
                        : 'bg-success/15 text-success hover:bg-success/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isAssigned ? (
                      <>
                        <XCircleIcon size={14} />
                        Retirer
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        Assigner
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 bg-muted border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Accès actuels :</span>
              {confirmatrice1.agendasAccess.length > 0 ? (
                <div className="flex gap-1 flex-wrap">
                  {confirmatrice1.agendasAccess.map(access => {
                    const agenda = agendasDisponibles.find(a => a.id === access);
                    return (
                      <span key={access} className="inline-flex items-center gap-1 px-2 py-0.5 bg-card rounded-full text-xs border">
                        {agenda?.icon} {agenda?.nom}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="text-muted-foreground italic">Aucun agenda assigné</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmatrice 2 */}
      {confirmatrice2 && (
        <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
          <div className="bg-gradient-to-r from-primary to-primary text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{confirmatrice2.prenom} {confirmatrice2.nom}</h2>
                <p className="text-white/80 text-sm mt-1">{confirmatrice2.email}</p>
              </div>
              <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-semibold">
                Confirmatrice Niveau 2
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-sm font-medium text-foreground mb-2">📋 Agendas accessibles :</p>
            {agendasDisponibles.map((agenda) => {
              const isAssigned = confirmatrice2.agendasAccess.includes(agenda.id);
              const isSaving = saving?.id === confirmatrice2.id && saving?.agendaId === agenda.id;
              
              return (
                <div
                  key={agenda.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isAssigned 
                      ? 'bg-success/10 border-success/30' 
                      : 'bg-muted border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{agenda.icon}</div>
                    <div>
                      <div className="font-medium text-foreground">{agenda.nom}</div>
                      <div className="text-xs text-muted-foreground">{agenda.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAgenda(confirmatrice2.id, agenda.id, isAssigned)}
                    disabled={isSaving}
                    className={`ml-4 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isAssigned
                        ? 'bg-destructive/15 text-destructive hover:bg-destructive/20'
                        : 'bg-success/15 text-success hover:bg-success/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isAssigned ? (
                      <>
                        <XCircleIcon size={14} />
                        Retirer
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        Assigner
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 bg-muted border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Accès actuels :</span>
              {confirmatrice2.agendasAccess.length > 0 ? (
                <div className="flex gap-1 flex-wrap">
                  {confirmatrice2.agendasAccess.map(access => {
                    const agenda = agendasDisponibles.find(a => a.id === access);
                    return (
                      <span key={access} className="inline-flex items-center gap-1 px-2 py-0.5 bg-card rounded-full text-xs border">
                        {agenda?.icon} {agenda?.nom}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="text-muted-foreground italic">Aucun agenda assigné</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}