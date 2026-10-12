import React, { useEffect, useState } from 'react';
import { Calendar, ChevronDown, AlertCircle, Save, MapPin, Phone, User, RefreshCw } from 'lucide-react';
import api from '../../services/crmApi';
import { ClientInfoSheet } from '../../components/crm/ClientInfo';

const STATUTS_COMMERCIAL = [
  { value: 'SIGNE', label: 'Signé', cls: 'bg-success/10 text-success' },
  { value: 'NON_SIGNE', label: 'Non signé', cls: 'bg-destructive/10 text-destructive' },
  { value: 'INSTALLE', label: 'Installé', cls: 'bg-primary/10 text-primary' },
  { value: 'R2', label: 'R2', cls: 'bg-warning/10 text-warning' },
  { value: 'NRP', label: 'NRP', cls: 'bg-warning/10 text-warning' },
  { value: 'PORTE', label: 'Porte', cls: 'bg-muted text-muted-foreground' },
  { value: 'REPORTER', label: 'Reporté', cls: 'bg-primary/10 text-primary' },
  { value: 'ANNULE', label: 'Annulé', cls: 'bg-destructive/10 text-destructive' },
  { value: 'CONFIRME', label: 'Confirmé', cls: 'bg-success/10 text-success' },
  { value: 'BRUT', label: 'Brut', cls: 'bg-muted text-muted-foreground' },
];

interface RdvContact {
  id: number; dateCreation?: string; dateRendezVous: string; statut: string; typeProjet?: string;
  typeRendezVous?: string; commentaireCommercial?: string; aRecontacter: boolean;
  contact: {
    id: number; nom?: string; prenom?: string; telephone: string; numGSM?: string;
    adresse?: string; codePostal?: string; ville?: string; projet?: string;
    modeChauffage?: string; surface?: number; nombrePersonnes?: number;
    professionMr?: string; professionMme?: string; credits?: string;
    revenus?: string; fichage?: boolean; etudePV?: boolean; equipePV?: boolean;
    equipePAC?: boolean; etatToiture?: string; etatIsolation?: string;
    proprietaireDepuis?: string; ageChaudiere?: number; consommationChauffage?: string;
    civilite?: string; estProprietaire?: boolean; fournisseurEnergie?: string; factureElectricite?: string;
    surface15m2?: boolean; travauxEnCours?: boolean; projetDemenagement?: boolean; email?: string;
  };
  agent: { id: number; nom: string; prenom: string };
}

interface UpdateForm {
  statut: string; commentaireCommercial: string; motifRefus?: string;
  aRecontacter: boolean; dateReport?: string;
}

export default function CommercialAgenda() {
  const [rdvs, setRdvs] = useState<RdvContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRdv, setSelectedRdv] = useState<RdvContact | null>(null);
  const [form, setForm] = useState<UpdateForm>({
    statut: 'CONFIRME', commentaireCommercial: '', aRecontacter: false
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => { fetchRdvs(); }, []);

  const fetchRdvs = () => {
    setLoading(true);
    api.get('/commercial/agenda')
      .then(res => setRdvs(res.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  const openRdv = (rdv: RdvContact) => {
    setSelectedRdv(rdv);
    setForm({ statut: rdv.statut, commentaireCommercial: rdv.commentaireCommercial || '', aRecontacter: rdv.aRecontacter });
    setSaveMsg('');
  };

  const handleSave = async () => {
    if (!selectedRdv) return;
    setSaving(true);
    try {
      await api.put(`/commercial/rdv/${selectedRdv.id}/statut`, form);
      setSaveMsg('Enregistré !');
      setRdvs(prev => prev.map(r => r.id === selectedRdv.id ? { ...r, ...form } : r));
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const getStatutStyle = (s: string) =>
    STATUTS_COMMERCIAL.find(x => x.value === s) || { cls: 'bg-muted text-muted-foreground', label: s };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-l-4 border-primary pl-6">
        <div>
          <h1 className="font-black italic tracking-tighter  uppercase text-3xl font-black italic tracking-tighter text-foreground">
            Agenda <span className="text-primary">Commercial</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
            Vos rendez-vous et suivi de visite
          </p>
        </div>
        <button onClick={fetchRdvs} className="p-2.5 bg-card border border-border rounded-xl hover:bg-muted transition-all text-primary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="glass-card flex items-center gap-2 text-destructive p-4">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Liste RDV */}
          <div className="col-span-5 space-y-2">
            {rdvs.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Aucun rendez-vous assigné</p>
              </div>
            ) : rdvs.map(rdv => {
              const st = getStatutStyle(rdv.statut);
              return (
                <div
                  key={rdv.id}
                  onClick={() => openRdv(rdv)}
                  className={`bg-card border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all ${
                    selectedRdv?.id === rdv.id ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">{rdv.contact.nom} {rdv.contact.prenom}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(rdv.dateRendezVous).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    {rdv.contact.ville && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {rdv.contact.codePostal} {rdv.contact.ville}
                      </div>
                    )}
                    {rdv.typeProjet && <div className="text-primary/80 font-medium">{rdv.typeProjet}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Détail RDV */}
          <div className="col-span-7">
            {selectedRdv ? (
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="text-sm font-black uppercase tracking-widest">
                    {selectedRdv.contact.nom} {selectedRdv.contact.prenom}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(selectedRdv.dateRendezVous).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="p-6 space-y-5">
                  {/* Contact info */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span>{selectedRdv.contact.telephone}{selectedRdv.contact.numGSM && ` / ${selectedRdv.contact.numGSM}`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>Agent : {selectedRdv.agent.prenom} {selectedRdv.agent.nom}</span>
                    </div>
                  </div>

                  {/* Fiche client : same information as the confirmation agendas */}
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fiche client</h3>
                    <ClientInfoSheet data={{
                      civilite: selectedRdv.contact.civilite, nom: selectedRdv.contact.nom, prenom: selectedRdv.contact.prenom,
                      projet: selectedRdv.contact.projet || selectedRdv.typeProjet,
                      dateCreation: selectedRdv.dateCreation, dateRendezVous: selectedRdv.dateRendezVous,
                      adresse: selectedRdv.contact.adresse, codePostal: selectedRdv.contact.codePostal, ville: selectedRdv.contact.ville,
                      gsm: selectedRdv.contact.numGSM || selectedRdv.contact.telephone,
                      estProprietaire: selectedRdv.contact.estProprietaire, proprietaireDepuis: selectedRdv.contact.proprietaireDepuis,
                      modeChauffage: selectedRdv.contact.modeChauffage, ageChaudiere: selectedRdv.contact.ageChaudiere,
                      fournisseurEnergie: selectedRdv.contact.fournisseurEnergie, consommationChauffage: selectedRdv.contact.consommationChauffage,
                      factureElectricite: selectedRdv.contact.factureElectricite, etatToiture: selectedRdv.contact.etatToiture,
                      etudePV: selectedRdv.contact.etudePV, equipePV: selectedRdv.contact.equipePV,
                      surface15m2: selectedRdv.contact.surface15m2, travauxEnCours: selectedRdv.contact.travauxEnCours,
                      projetDemenagement: selectedRdv.contact.projetDemenagement, nombrePersonnes: selectedRdv.contact.nombrePersonnes,
                    }} />
                    {(selectedRdv.contact.revenus || selectedRdv.contact.professionMr || selectedRdv.contact.professionMme || selectedRdv.contact.credits || selectedRdv.contact.fichage !== undefined) && (
                      <div className="pt-2 border-t border-border space-y-1 text-xs">
                        {selectedRdv.contact.professionMr && <p><span className="font-bold">Profession Mr :</span> {selectedRdv.contact.professionMr}</p>}
                        {selectedRdv.contact.professionMme && <p><span className="font-bold">Profession Mme :</span> {selectedRdv.contact.professionMme}</p>}
                        {selectedRdv.contact.revenus && <p><span className="font-bold">Revenus :</span> {selectedRdv.contact.revenus}</p>}
                        {selectedRdv.contact.credits && <p><span className="font-bold">Crédits :</span> {selectedRdv.contact.credits}</p>}
                        {selectedRdv.contact.fichage !== undefined && selectedRdv.contact.fichage !== null && <p><span className="font-bold">Fiché :</span> {selectedRdv.contact.fichage ? 'Oui' : 'Non'}</p>}
                      </div>
                    )}
                  </div>

                  <hr className="border-border" />

                  {/* Update form */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Résultat de la visite</h3>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Statut</label>
                      <div className="relative">
                        <select
                          value={form.statut}
                          onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                          className="glass-input w-full px-4 py-2.5 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          {STATUTS_COMMERCIAL.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Commentaire commercial</label>
                      <textarea
                        value={form.commentaireCommercial}
                        onChange={e => setForm(f => ({ ...f, commentaireCommercial: e.target.value }))}
                        rows={3}
                        placeholder="Observations sur la visite…"
                        className="glass-input w-full px-4 py-2.5 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="aRecontacter"
                        checked={form.aRecontacter}
                        onChange={e => setForm(f => ({ ...f, aRecontacter: e.target.checked }))}
                        className="rounded"
                      />
                      <label htmlFor="aRecontacter" className="text-sm font-medium">À recontacter</label>
                    </div>

                    {form.aRecontacter && (
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Date rappel</label>
                        <input
                          type="datetime-local"
                          value={form.dateReport || ''}
                          onChange={e => setForm(f => ({ ...f, dateReport: e.target.value }))}
                          className="glass-input px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:opacity-90 disabled:opacity-50 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                      {saveMsg && (
                        <span className={`text-sm font-bold ${saveMsg.includes('Erreur') ? 'text-destructive' : 'text-success'}`}>
                          {saveMsg}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-16 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sélectionnez un RDV pour voir le détail</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
