// "Fiche client": ONE definition of the fields, used by
//  - the agent forms (create a contact, live call screen)  -> ClientIdentityFields + ClientHousingFields
//  - the agendas side panel (read only)                    -> ClientInfoSheet
import React from 'react';

export type YesNo = '' | 'oui' | 'non';

/** The form state. Everything is a string so that the inputs behave; ficheToPayload() converts it back. */
export interface ClientFiche {
  civilite: string;
  nom: string;
  prenom: string;
  numGSM: string;
  adresse: string;
  codePostal: string;
  ville: string;
  projet: string;
  // Logement
  estProprietaire: YesNo;
  proprietaireDepuis: string;      // year, e.g. 2012
  modeChauffage: string;
  ageChaudiere: string;
  fournisseurEnergie: string;
  consommationChauffage: string;
  factureElectricite: string;
  etatToiture: string;
  etatIsolation: string;
  surface: string;
  surface15m2: YesNo;
  travauxEnCours: YesNo;
  projetDemenagement: YesNo;
  // Energie
  etudePV: YesNo;
  equipePV: YesNo;
  equipePAC: YesNo;
  // Foyer
  nbPersonnes: string;
  professionMr: string;
  professionMme: string;
  credits: string;
  revenus: string;
  fichage: YesNo;
}

export const emptyFiche = (): ClientFiche => ({
  civilite: '', nom: '', prenom: '', numGSM: '', adresse: '', codePostal: '', ville: '', projet: '',
  estProprietaire: '', proprietaireDepuis: '', modeChauffage: '', ageChaudiere: '',
  fournisseurEnergie: '', consommationChauffage: '', factureElectricite: '', etatToiture: '',
  etatIsolation: '', surface: '', surface15m2: '', travauxEnCours: '', projetDemenagement: '',
  etudePV: '', equipePV: '', equipePAC: '',
  nbPersonnes: '', professionMr: '', professionMme: '', credits: '', revenus: '', fichage: '',
});

const yn = (v: unknown): YesNo => (v === true || v === 'oui' ? 'oui' : v === false || v === 'non' ? 'non' : '');
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

/** Builds the form state from what the API returns for a contact (keys are already camelCase). */
export function ficheFromContact(c: any): ClientFiche {
  const f = emptyFiche();
  if (!c) return f;
  const year = c.proprietaireDepuis ? (typeof c.proprietaireDepuis === 'number' ? c.proprietaireDepuis : new Date(c.proprietaireDepuis).getUTCFullYear()) : '';
  return {
    civilite: str(c.civilite), nom: str(c.nom), prenom: str(c.prenom), numGSM: str(c.numGSM),
    adresse: str(c.adresse), codePostal: str(c.codePostal), ville: str(c.ville), projet: str(c.projet),
    estProprietaire: yn(c.estProprietaire), proprietaireDepuis: str(year),
    modeChauffage: str(c.modeChauffage), ageChaudiere: str(c.ageChaudiere),
    fournisseurEnergie: str(c.fournisseurEnergie), consommationChauffage: str(c.consommationChauffage),
    factureElectricite: str(c.factureElectricite), etatToiture: str(c.etatToiture),
    etatIsolation: str(c.etatIsolation), surface: str(c.surface),
    surface15m2: yn(c.surface15m2), travauxEnCours: yn(c.travauxEnCours), projetDemenagement: yn(c.projetDemenagement),
    etudePV: yn(c.etudePV), equipePV: yn(c.equipePV), equipePAC: yn(c.equipePAC),
    nbPersonnes: str(c.nbPersonnes ?? c.nombrePersonnes), professionMr: str(c.professionMr),
    professionMme: str(c.professionMme), credits: str(c.credits), revenus: str(c.revenus), fichage: yn(c.fichage),
  };
}

const text = (v: string) => (v.trim() ? v.trim() : null);
const bool = (v: YesNo) => (v === 'oui' ? true : v === 'non' ? false : null);
const int = (v: string) => (v.trim() && !Number.isNaN(parseInt(v, 10)) ? parseInt(v, 10) : null);

/** What the API expects (POST /contact and PUT /contact/{id}). Empty answers are sent as null = "keep what is stored". */
export function ficheToPayload(f: ClientFiche) {
  return {
    civilite: text(f.civilite), nom: text(f.nom), prenom: text(f.prenom), numGSM: text(f.numGSM),
    adresse: text(f.adresse), codePostal: text(f.codePostal), ville: text(f.ville), projet: text(f.projet),
    estProprietaire: bool(f.estProprietaire), proprietaireDepuis: int(f.proprietaireDepuis),
    modeChauffage: text(f.modeChauffage), ageChaudiere: int(f.ageChaudiere),
    fournisseurEnergie: text(f.fournisseurEnergie), consommationChauffage: text(f.consommationChauffage),
    factureElectricite: text(f.factureElectricite), etatToiture: text(f.etatToiture),
    etatIsolation: text(f.etatIsolation),
    surface: f.surface.trim() && !Number.isNaN(parseFloat(f.surface)) ? parseFloat(f.surface) : null,
    surface15m2: bool(f.surface15m2), travauxEnCours: bool(f.travauxEnCours), projetDemenagement: bool(f.projetDemenagement),
    etudePV: bool(f.etudePV), equipePV: bool(f.equipePV), equipePAC: bool(f.equipePAC),
    nbPersonnes: int(f.nbPersonnes), professionMr: text(f.professionMr), professionMme: text(f.professionMme),
    credits: text(f.credits), revenus: text(f.revenus), fichage: f.fichage || null,
  };
}

// ── Choices ─────────────────────────────────────────────────────────────────────
export const CIVILITES = ['Mr', 'Mme', 'Ms', 'Mlle'];
export const PROJETS = ['PV', 'PAC', 'Chaudière', 'Isolation', 'Autre'];
export const CHAUFFAGES = ['Mazout', 'Gaz', 'Électrique', 'Pellets', 'Bois', 'PAC', 'Autre'];
export const ETATS = ['Bon', 'Moyen', 'Mauvais'];

// ── Small inputs ────────────────────────────────────────────────────────────────
const INPUT = 'glass-input w-full px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none';

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

/** Oui / Non buttons; clicking the chosen one again clears the answer. */
function YesNoField({ label, value, onChange, id }: { label: string; value: YesNo; onChange: (v: YesNo) => void; id: string }) {
  return (
    <div>
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <div className="inline-flex rounded-lg border border-border overflow-hidden" role="group" aria-label={label} data-testid={id}>
        {(['oui', 'non'] as const).map(opt => (
          <button
            key={opt}
            type="button"
            aria-pressed={value === opt}
            onClick={() => onChange(value === opt ? '' : opt)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              value === opt
                ? opt === 'oui' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {opt === 'oui' ? 'Oui' : 'Non'}
          </button>
        ))}
      </div>
    </div>
  );
}

interface FieldsProps {
  value: ClientFiche;
  onChange: (patch: Partial<ClientFiche>) => void;
}

/** Civilité, name (optional), address, postal code, commune, GSM and project. */
export function ClientIdentityFields({ value, onChange, withName = false }: FieldsProps & { withName?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Projet">
        <input list="client-projets" value={value.projet} onChange={e => onChange({ projet: e.target.value })}
          placeholder="PV, PAC, chaudière…" className={INPUT} name="projet" />
        <datalist id="client-projets">{PROJETS.map(p => <option key={p} value={p} />)}</datalist>
      </Field>
      <Field label="Civilité">
        <select value={value.civilite} onChange={e => onChange({ civilite: e.target.value })} className={INPUT} name="civilite">
          <option value="">—</option>
          {CIVILITES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      {withName && (
        <>
          <Field label="Nom"><input value={value.nom} onChange={e => onChange({ nom: e.target.value })} className={INPUT} name="nom" /></Field>
          <Field label="Prénom"><input value={value.prenom} onChange={e => onChange({ prenom: e.target.value })} className={INPUT} name="prenom" /></Field>
        </>
      )}
      <Field label="Adresse" className="sm:col-span-2">
        <input value={value.adresse} onChange={e => onChange({ adresse: e.target.value })} className={INPUT} name="adresse" />
      </Field>
      <Field label="Code postal">
        <input value={value.codePostal} onChange={e => onChange({ codePostal: e.target.value })} inputMode="numeric" className={INPUT} name="codePostal" />
      </Field>
      <Field label="Commune">
        <input value={value.ville} onChange={e => onChange({ ville: e.target.value })} className={INPUT} name="ville" />
      </Field>
      <Field label="GSM">
        <input value={value.numGSM} onChange={e => onChange({ numGSM: e.target.value })} type="tel" className={INPUT} name="numGSM" />
      </Field>
    </div>
  );
}

/** Logement, energy, works and household questions of the call script. */
export function ClientHousingFields({ value, onChange }: FieldsProps) {
  const set = onChange;
  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Logement</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <YesNoField id="estProprietaire" label="Propriétaire" value={value.estProprietaire}
            onChange={v => set({ estProprietaire: v, ...(v === 'non' ? { proprietaireDepuis: '' } : {}) })} />
          <Field label="Propriétaire depuis (année)">
            <input value={value.proprietaireDepuis} onChange={e => set({ proprietaireDepuis: e.target.value.replace(/\D/g, '').slice(0, 4), ...(e.target.value ? { estProprietaire: 'oui' as YesNo } : {}) })}
              inputMode="numeric" placeholder="ex : 2012" disabled={value.estProprietaire === 'non'} className={`${INPUT} disabled:opacity-50`} name="proprietaireDepuis" />
          </Field>
          <Field label="Chauffage">
            <select value={value.modeChauffage} onChange={e => set({ modeChauffage: e.target.value })} className={INPUT} name="modeChauffage">
              <option value="">—</option>
              {value.modeChauffage && !CHAUFFAGES.includes(value.modeChauffage) && <option value={value.modeChauffage}>{value.modeChauffage}</option>}
              {CHAUFFAGES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Âge de la chaudière (ans)">
            <input value={value.ageChaudiere} onChange={e => set({ ageChaudiere: e.target.value.replace(/\D/g, '') })} inputMode="numeric" className={INPUT} name="ageChaudiere" />
          </Field>
          <Field label="Fournisseur d'énergie">
            <input value={value.fournisseurEnergie} onChange={e => set({ fournisseurEnergie: e.target.value })} className={INPUT} name="fournisseurEnergie" />
          </Field>
          <Field label="Consommation de chauffage">
            <input value={value.consommationChauffage} onChange={e => set({ consommationChauffage: e.target.value })} placeholder="ex : 2000 L" className={INPUT} name="consommationChauffage" />
          </Field>
          <Field label="Électricité (facture, €)">
            <input value={value.factureElectricite} onChange={e => set({ factureElectricite: e.target.value })} inputMode="decimal" className={INPUT} name="factureElectricite" />
          </Field>
          <Field label="État du toit">
            <select value={value.etatToiture} onChange={e => set({ etatToiture: e.target.value })} className={INPUT} name="etatToiture">
              <option value="">—</option>
              {value.etatToiture && !ETATS.includes(value.etatToiture) && <option value={value.etatToiture}>{value.etatToiture}</option>}
              {ETATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="État de l'isolation">
            <select value={value.etatIsolation} onChange={e => set({ etatIsolation: e.target.value })} className={INPUT} name="etatIsolation">
              <option value="">—</option>
              {value.etatIsolation && !ETATS.includes(value.etatIsolation) && <option value={value.etatIsolation}>{value.etatIsolation}</option>}
              {ETATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Surface (m²)">
            <input value={value.surface} onChange={e => set({ surface: e.target.value })} inputMode="decimal" className={INPUT} name="surface" />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Énergie et travaux</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <YesNoField id="etudePV" label="Étude" value={value.etudePV} onChange={v => set({ etudePV: v })} />
          <YesNoField id="equipePV" label="PV" value={value.equipePV} onChange={v => set({ equipePV: v })} />
          <YesNoField id="equipePAC" label="PAC" value={value.equipePAC} onChange={v => set({ equipePAC: v })} />
          <YesNoField id="surface15m2" label="15 m²" value={value.surface15m2} onChange={v => set({ surface15m2: v })} />
          <YesNoField id="travauxEnCours" label="Travaux en cours" value={value.travauxEnCours} onChange={v => set({ travauxEnCours: v })} />
          <YesNoField id="projetDemenagement" label="Projet de déménagement" value={value.projetDemenagement} onChange={v => set({ projetDemenagement: v })} />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Foyer</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre de personnes">
            <input value={value.nbPersonnes} onChange={e => set({ nbPersonnes: e.target.value.replace(/\D/g, '') })} inputMode="numeric" className={INPUT} name="nbPersonnes" />
          </Field>
          <Field label="Revenus">
            <input value={value.revenus} onChange={e => set({ revenus: e.target.value })} className={INPUT} name="revenus" />
          </Field>
          <Field label="Profession Mr">
            <input value={value.professionMr} onChange={e => set({ professionMr: e.target.value })} className={INPUT} name="professionMr" />
          </Field>
          <Field label="Profession Mme">
            <input value={value.professionMme} onChange={e => set({ professionMme: e.target.value })} className={INPUT} name="professionMme" />
          </Field>
          <Field label="Crédits">
            <input value={value.credits} onChange={e => set({ credits: e.target.value })} className={INPUT} name="credits" />
          </Field>
          <YesNoField id="fichage" label="Fichage" value={value.fichage} onChange={v => set({ fichage: v })} />
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Read only sheet, in the order of the agenda event (RDV avec, créé le, pris pour, adresse, …)
// ═══════════════════════════════════════════════════════════════════════════════
export interface ClientInfoData {
  civilite?: string | null;
  nom?: string | null;
  prenom?: string | null;
  projet?: string | null;
  dateCreation?: string | null;       // when the RDV was created
  dateRendezVous?: string | null;     // "pris pour"
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  gsm?: string | null;
  estProprietaire?: boolean | null;
  proprietaireDepuis?: string | number | null;   // year (number) or a date
  modeChauffage?: string | null;
  ageChaudiere?: number | null;
  fournisseurEnergie?: string | null;
  consommationChauffage?: string | null;
  factureElectricite?: string | null;
  etatToiture?: string | null;
  etudePV?: boolean | null;
  equipePV?: boolean | null;
  surface15m2?: boolean | null;
  travauxEnCours?: boolean | null;
  projetDemenagement?: boolean | null;
  nombrePersonnes?: number | null;
}

const MISSING = '—';
const yesNo = (v?: boolean | null) => (v === true ? 'Oui' : v === false ? 'Non' : MISSING);
const present = (v?: string | number | null) => (v === null || v === undefined || String(v).trim() === '' ? MISSING : String(v));
const dateFr = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : MISSING);
const timeFr = (d?: string | null) => (d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '');

/** "oui, depuis 12 ans" — the year is stored, the number of years is computed. */
export function proprietaireLabel(est?: boolean | null, depuis?: string | number | null): string {
  const year = depuis ? (typeof depuis === 'number' ? depuis : new Date(depuis).getUTCFullYear()) : null;
  const yearsAgo = year && year > 1900 ? new Date().getFullYear() - year : null;
  if (est === false) return 'Non';
  if (est === true || year) return yearsAgo !== null && yearsAgo >= 0 ? `Oui, depuis ${yearsAgo} an${yearsAgo > 1 ? 's' : ''} (${year})` : 'Oui';
  return MISSING;
}

export function ClientInfoSheet({ data }: { data: ClientInfoData }) {
  const nomComplet = [data.civilite, data.prenom, data.nom].filter(Boolean).join(' ');
  const euro = data.factureElectricite && /^[\d\s.,]+$/.test(data.factureElectricite) ? `${data.factureElectricite.trim()} €` : data.factureElectricite;
  const rows: [string, string][] = [
    ['Projet', present(data.projet)],
    ['RDV avec', present(nomComplet)],
    ['Date de création du RDV', dateFr(data.dateCreation)],
    ['Pris pour', data.dateRendezVous ? `${dateFr(data.dateRendezVous)} à ${timeFr(data.dateRendezVous)}` : MISSING],
    ['Adresse', present(data.adresse)],
    ['Code postal', present(data.codePostal)],
    ['Commune', present(data.ville)],
    ['GSM', present(data.gsm)],
    ['Propriétaire', proprietaireLabel(data.estProprietaire, data.proprietaireDepuis)],
    ['Chauffage', present(data.modeChauffage)],
    ['Chaudière', data.ageChaudiere ? `${data.ageChaudiere} ans` : MISSING],
    ["Fournisseur d'énergie", present(data.fournisseurEnergie)],
    ['Consommation de chauffage', present(data.consommationChauffage)],
    ['Électricité', present(euro)],
    ['Toit', present(data.etatToiture)],
    ['Étude', yesNo(data.etudePV)],
    ['PV', yesNo(data.equipePV)],
    ['15 m²', yesNo(data.surface15m2)],
    ['Travaux en cours', yesNo(data.travauxEnCours)],
    ['Projet de déménagement', yesNo(data.projetDemenagement)],
    ['Nombre de personnes', present(data.nombrePersonnes)],
  ];
  return (
    <dl className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-3 gap-y-1.5 text-xs" data-testid="client-info-sheet">
      {rows.map(([label, value]) => (
        <React.Fragment key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className={`font-medium break-words ${value === MISSING ? 'text-muted-foreground/60' : 'text-foreground'}`}>{value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
