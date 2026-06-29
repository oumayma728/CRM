import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, ChevronDown, AlertCircle, Save, MapPin, Phone, User } from 'lucide-react';
import { Layout } from '../../components/Layout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATUTS_COMMERCIAL = [
  { value: 'SIGNE', label: 'Signé', cls: 'bg-green-100 text-green-700' },
  { value: 'NON_SIGNE', label: 'Non signé', cls: 'bg-red-100 text-red-700' },
  { value: 'INSTALLE', label: 'Installé', cls: 'bg-blue-100 text-blue-700' },
  { value: 'R2', label: 'R2', cls: 'bg-yellow-100 text-yellow-700' },
  { value: 'NRP', label: 'NRP', cls: 'bg-orange-100 text-orange-700' },
  { value: 'PORTE', label: 'Porte', cls: 'bg-gray-100 text-gray-700' },
  { value: 'REPORTER', label: 'Reporté', cls: 'bg-purple-100 text-purple-700' },
  { value: 'ANNULE', label: 'Annulé', cls: 'bg-red-100 text-red-700' },
  { value: 'CONFIRME', label: 'Confirmé', cls: 'bg-emerald-100 text-emerald-700' },
  { value: 'BRUT', label: 'Brut', cls: 'bg-muted text-muted-foreground' },
];

interface RdvContact {
  id: number; dateRendezVous: string; statut: string; typeProjet?: string;
  typeRendezVous?: string; commentaireCommercial?: string; aRecontacter: boolean;
  contact: {
    id: number; nom?: string; prenom?: string; telephone: string; numGSM?: string;
    adresse?: string; codePostal?: string; ville?: string; projet?: string;
    modeChauffage?: string; surface?: number; nombrePersonnes?: number;
    professionMr?: string; professionMme?: string; credits?: string;
    revenus?: string; fichage?: boolean; etudePV?: boolean; equipePV?: boolean;
    equipePAC?: boolean; etatToiture?: string; etatIsolation?: string;
    proprietaireDepuis?: string; ageChaudiere?: number; consommationChauffage?: string;
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/api/commercial/agenda`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setRdvs(res.data))
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  const openRdv = (rdv: RdvContact) => {
    setSelectedRdv(rdv);
    setForm({
      statut: rdv.statut,
      commentaireCommercial: rdv.commentaireCommercial || '',
      aRecontacter: rdv.aRecontacter
    });
    setSaveMsg('');
  };

  const handleSave = async () => {
    if (!selectedRdv) return;
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API_URL}/api/commercial/rdv/${selectedRdv.id}/statut`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaveMsg('Enregistré !');
      setRdvs(prev => prev.map(r => r.id === selectedRdv.id ? { ...r, ...form } : r));
    } catch {
      setSaveMsg('Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const getStatutStyle = (s: string) =>
    STATUTS_COMMERCIAL.find(x => x.value === s) || { cls: 'bg-gray-100 text-gray-700', label: s };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" /> Agenda Commercial
          </h1>
          <p className="text-muted-foreground">Vos rendez-vous et suivi de visite</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive"><AlertCircle className="w-4 h-4" /> {error}</div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Liste RDV */}
            <div className="col-span-5 space-y-2">
              {rdvs.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
                  Aucun rendez-vous assigné
                </div>
              ) : rdvs.map(rdv => {
                const st = getStatutStyle(rdv.statut);
                return (
                  <div
                    key={rdv.id}
                    onClick={() => openRdv(rdv)}
                    className={`bg-card border rounded-lg p-4 cursor-pointer hover:shadow-sm transition-all ${
                      selectedRdv?.id === rdv.id ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {rdv.contact.nom} {rdv.contact.prenom}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>
                        {st.label}
                      </span>
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
                      {rdv.typeProjet && <div className="text-primary/80">{rdv.typeProjet}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Détail RDV */}
            <div className="col-span-7">
              {selectedRdv ? (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-5 py-4 border-b border-border bg-muted/30">
                    <h2 className="font-semibold">
                      {selectedRdv.contact.nom} {selectedRdv.contact.prenom}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedRdv.dateRendezVous).toLocaleDateString('fr-FR', {
                        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Contact info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" /> {selectedRdv.contact.telephone}
                          {selectedRdv.contact.numGSM && ` / ${selectedRdv.contact.numGSM}`}
                        </div>
                        {selectedRdv.contact.adresse && (
                          <div className="flex items-start gap-1 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 mt-0.5" />
                            {selectedRdv.contact.adresse}<br />
                            {selectedRdv.contact.codePostal} {selectedRdv.contact.ville}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="w-3.5 h-3.5" /> Agent : {selectedRdv.agent.prenom} {selectedRdv.agent.nom}
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {selectedRdv.contact.projet && <p><strong>Projet :</strong> {selectedRdv.contact.projet}</p>}
                        {selectedRdv.contact.surface && <p><strong>Surface :</strong> {selectedRdv.contact.surface} m²</p>}
                        {selectedRdv.contact.nombrePersonnes && <p><strong>Foyer :</strong> {selectedRdv.contact.nombrePersonnes} pers.</p>}
                        {selectedRdv.contact.modeChauffage && <p><strong>Chauffage :</strong> {selectedRdv.contact.modeChauffage}</p>}
                        {selectedRdv.contact.revenus && <p><strong>Revenus :</strong> {selectedRdv.contact.revenus}</p>}
                        {selectedRdv.contact.fichage !== undefined && <p><strong>Fiché :</strong> {selectedRdv.contact.fichage ? 'Oui' : 'Non'}</p>}
                      </div>
                    </div>

                    <hr className="border-border" />

                    {/* Update form */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-sm">Résultat de la visite</h3>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Statut</label>
                        <div className="relative">
                          <select
                            value={form.statut}
                            onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            {STATUTS_COMMERCIAL.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Commentaire commercial</label>
                        <textarea
                          value={form.commentaireCommercial}
                          onChange={e => setForm(f => ({ ...f, commentaireCommercial: e.target.value }))}
                          rows={3}
                          placeholder="Observations sur la visite…"
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                        <label htmlFor="aRecontacter" className="text-sm">À recontacter</label>
                      </div>
                      {form.aRecontacter && (
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Date rappel</label>
                          <input
                            type="datetime-local"
                            value={form.dateReport || ''}
                            onChange={e => setForm(f => ({ ...f, dateReport: e.target.value }))}
                            className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                        {saveMsg && (
                          <span className={`text-sm ${saveMsg.includes('Erreur') ? 'text-destructive' : 'text-green-600'}`}>
                            {saveMsg}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Sélectionnez un RDV pour voir le détail</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
