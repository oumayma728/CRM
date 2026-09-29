import React, { useState, useEffect, useRef, ReactNode } from "react";
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play,
  PhoneCall, Bot, Sparkles, Save, Activity, Signal,
  Coffee, Calendar, MessageCircle, Award,
  FileText, Check, Download, Bell, ArrowLeft,
  Zap, RefreshCw, Send, Plus,
  XCircle, Radio, Wifi, Battery, ChevronDown, Clock,
  TrendingUp, Users, MapPin, Mail, User,
  LogOut, Settings, HelpCircle, Moon, Sun,
} from "lucide-react";
import api from '../../services/api';
import { LucideIcon } from "lucide-react";
import { useCallContext } from '../../contexts/CallContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PhoneKeypad } from '../../components/call/PhoneKeypad';

// ─── Types ────────────────────────────────────────────────────────────────────
type ColorKey = "green" | "red" | "blue" | "purple" | "amber" | "orange" | "slate";

interface TranscriptLine {
  id: number;
  speaker: string;
  text: string;
  t: number;
  sentiment: string;
}

interface StatusOption {
  value: string;
  label: string;
  color: ColorKey;
}

interface FormData {
  nom: string; gsm: string; proprietaire: string; depuis: string;
  nbPersonnes: string; chauffage: string; consommation: string; ageChaudiere: string;
  equipePV: string; equipePAC: string; toiture: string; isolation: string; surface: string;
  profMr: string; profMme: string; revenus: string; credits: string;
  fichage: string; budget: string; interet: string; urgence: string;
}

interface NoteItem {
  id: number;
  text: string;
  author: string;
  time: string;
}

interface AiScore {
  lead: number;
  conversion: number;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SCRIPT: TranscriptLine[] = [
  { id: 1, speaker: "Agent", text: "Bonjour, je suis Sarah de EBI. Puis-je parler à M. Dupont ?", t: 2, sentiment: "neutral" },
  { id: 2, speaker: "Client", text: "Oui, c'est moi.", t: 6, sentiment: "neutral" },
  { id: 3, speaker: "Agent", text: "Je vous appelle pour nos solutions de rénovation énergétique éligibles aux aides d'état.", t: 12, sentiment: "positive" },
  { id: 4, speaker: "Client", text: "Intéressant — je veux remplacer ma vieille chaudière fioul.", t: 18, sentiment: "positive" },
  { id: 5, speaker: "Agent", text: "Vous êtes bien propriétaire de votre logement ?", t: 24, sentiment: "neutral" },
  { id: 6, speaker: "Client", text: "Oui, depuis 2010. Maison individuelle de 120 m².", t: 28, sentiment: "positive" },
  { id: 7, speaker: "Agent", text: "Combien de personnes dans le foyer, et vos revenus annuels approximativement ?", t: 34, sentiment: "neutral" },
  { id: 8, speaker: "Client", text: "4 personnes. Environ 38 000 € par an.", t: 40, sentiment: "positive" },
  { id: 9, speaker: "Agent", text: "Quel âge a votre chaudière ?", t: 46, sentiment: "neutral" },
  { id: 10, speaker: "Client", text: "12 ans — elle commence à faire des siennes.", t: 52, sentiment: "positive" },
  { id: 11, speaker: "Agent", text: "Je vous propose un rendez-vous gratuit avec notre technicien — mardi 10 h ?", t: 60, sentiment: "positive" },
  { id: 12, speaker: "Client", text: "Oui, mardi à 10 h c'est parfait.", t: 66, sentiment: "positive" },
];

const STATUS_OPTIONS: StatusOption[] = [
  { value: "NRP", label: "NRP", color: "amber" },
  { value: "HC Logement", label: "HC Logement", color: "slate" },
  { value: "HC Langue", label: "HC Langue", color: "slate" },
  { value: "Refus", label: "Pas Intéressé", color: "red" },
  { value: "À Rappeler", label: "À Rappeler", color: "blue" },
  { value: "RDV Client 1", label: "RDV Client 1", color: "purple" },
  { value: "RDV Client 2", label: "RDV Client 2", color: "purple" },
  { value: "RDV Confirmé", label: "RDV Confirmé ✓", color: "green" },
  { value: "RDV Annulé", label: "RDV Annulé", color: "red" },
  { value: "Lead Chaud", label: "Lead Chaud 🔥", color: "orange" },
  { value: "Converti", label: "Converti ✓", color: "green" },
];

const PAUSE_TYPES = ["☕ Café", "🍽️ Déjeuner", "🕌 Prière", "🔧 Technique", "💭 Personnelle"] as const;

// Colors compatible light/dark mode
const getColors = (isDark: boolean) => ({
  green: { bg: isDark ? "#0D2818" : "#E8F5E9", text: "#2DCF7F", border: isDark ? "#2DCF7F40" : "#2DCF7F20", darkText: "#2DCF7F" },
  red: { bg: isDark ? "#2E1515" : "#FFEBEE", text: "#F87171", border: isDark ? "#F8717140" : "#F8717120", darkText: "#F87171" },
  blue: { bg: isDark ? "#0F1B2A" : "#E3F2FD", text: "#5D9BFF", border: isDark ? "#5D9BFF40" : "#5D9BFF20", darkText: "#5D9BFF" },
  purple: { bg: isDark ? "#1E1B3A" : "#F3E5F5", text: "#8B7EF5", border: isDark ? "#8B7EF540" : "#8B7EF520", darkText: "#8B7EF5" },
  amber: { bg: isDark ? "#2A2410" : "#FFF8E1", text: "#F0B34B", border: isDark ? "#F0B34B40" : "#F0B34B20", darkText: "#F0B34B" },
  orange: { bg: isDark ? "#2E1A10" : "#FFF3E0", text: "#FB923C", border: isDark ? "#FB923C40" : "#FB923C20", darkText: "#FB923C" },
  slate: { bg: isDark ? "#1A1F2A" : "#F1F5F9", text: "#9AA9B9", border: isDark ? "#9AA9B940" : "#9AA9B920", darkText: "#9AA9B9" },
});

// ─── Components ────────────────────────────────────────────────────────────────
interface BadgeProps { color?: ColorKey; children: ReactNode; size?: "sm" | "md"; isDark?: boolean }
const Badge: React.FC<BadgeProps> = ({ color = "slate", children, size = "sm", isDark = true }) => {
  const colors = getColors(isDark);
  const c = colors[color];
 
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      padding: size === "sm" ? "3px 10px" : "5px 14px",
      borderRadius: 20, fontSize: size === "sm" ? 11 : 12,
      fontWeight: 500, display: "inline-block", whiteSpace: "nowrap" as const,
    }}>{children}</span>
  );
};

interface SectionProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  action?: ReactNode;
  isDark?: boolean;
}
const Section: React.FC<SectionProps> = ({ title, icon: Icon, iconColor, children, action, isDark = true }) => (
  <div style={{
    background: isDark ? "#0B0F17" : "#FFFFFF",
    border: `1px solid ${isDark ? "#252E3A" : "#E2E8F0"}`,
    borderRadius: 20, overflow: "hidden",
  }}>
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 20px", borderBottom: `1px solid ${isDark ? "#252E3A" : "#E2E8F0"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {Icon && <Icon size={16} style={{ color: iconColor ?? (isDark ? "#9AA9B9" : "#64748B") }} />}
        <span style={{ fontSize: 14, fontWeight: 600, color: isDark ? "#F1F5F9" : "#0F172A" }}>{title}</span>
      </div>
      {action && <div>{action}</div>}
    </div>
    <div style={{ padding: "18px 20px" }}>{children}</div>
  </div>
);

interface FieldProps { label: string; children: ReactNode; isDark?: boolean }
const Field: React.FC<FieldProps> = ({ label, children, isDark = true }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{
      fontSize: 10, color: isDark ? "#5A6C7E" : "#94A3B8", fontWeight: 600,
      marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.06em",
    }}>{label}</div>
    {children}
  </div>
);

const inputStyle = (isDark: boolean): React.CSSProperties => ({
  width: "100%", padding: "10px 14px", fontSize: 13, boxSizing: "border-box",
  border: `1px solid ${isDark ? "#252E3A" : "#E2E8F0"}`,
  borderRadius: 12, background: isDark ? "#11161F" : "#F8FAFC",
  color: isDark ? "#F1F5F9" : "#0F172A", outline: "none", transition: "all 0.2s",
});

interface FSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: (string | { value: string; label: string })[];
  isDark?: boolean;
}
const FSelect: React.FC<FSelectProps> = ({ value, onChange, options, isDark = true }) => (
  <select value={value} onChange={onChange} style={{ ...inputStyle(isDark), cursor: "pointer" }}>
    {options.map((o) => {
      const val = typeof o === "string" ? o : o.value;
      const lbl = typeof o === "string" ? o : o.label;
      return <option key={val} value={val}>{lbl}</option>;
    })}
  </select>
);

interface CircleScoreProps { value: number; label: string; color?: string; isDark?: boolean }
const CircleScore: React.FC<CircleScoreProps> = ({ value, label, color = "#8B7EF5", isDark = true }) => {
  const r = 28; const circ = 2 * Math.PI * r;
  const offset = circ - (circ * value) / 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" stroke={isDark ? "#252E3A" : "#E2E8F0"} strokeWidth={4} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 36 36)" />
        <text x={36} y={41} textAnchor="middle"
          style={{ fontSize: 13, fontWeight: 700, fill: isDark ? "#F1F5F9" : "#0F172A" }}>
          {value}%
        </text>
      </svg>
      <span style={{ fontSize: 10, color: isDark ? "#9AA9B9" : "#64748B" }}>{label}</span>
    </div>
  );
};

const Div: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => (
  <div style={{ height: "1px", background: isDark ? "#252E3A" : "#E2E8F0", margin: "14px 0" }} />
);

// ─── Main Component ──────────────────────────────────────────────────────────
const ContactPage: React.FC = () => {
  const contact = {
    contact: "Jean Dupont", company: "Habitat Rénov+", role: "Propriétaire",
    phone: "+33 6 12 34 56 78", email: "jean.dupont@mail.fr", city: "Lyon, 69000",
  };

  // ── Call state from context ─────────────────────────────────────────────────
  const {
    callState, callDuration, cooldownRemaining,
    startCall: ctxStartCall, endCall: ctxEndCall, skipCooldown,
    isMuted, isOnHold, toggleMute, toggleHold,
  } = useCallContext();

  const [campaign, setCampaign] = useState("PAC");
  const [callQuality, setCallQuality] = useState<number>(97);
  const [messages, setMessages] = useState<TranscriptLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Agent status ─────────────────────────────────────────────────────────────
  const [agentStatus, setAgentStatus] = useState<"online" | "break" | "offline">("online");
  const [activePause, setActivePause] = useState<string>("");
  const [pauseSeconds, setPauseSeconds] = useState<number>(0);
  const [showPauseMenu, setShowPauseMenu] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  // ── Notifications ────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: "Nouveau lead", message: "Un nouveau prospect a été assigné", time: "Il y a 5 min", read: false },
    { id: 2, title: "RDV confirmé", message: "RDV avec M. Martin confirmé pour demain", time: "Il y a 30 min", read: false },
    { id: 3, title: "Rappel", message: "Appel programmé dans 10 minutes", time: "Il y a 1h", read: true },
  ]);
  const unreadCount = notifications.filter(n => !n.read).length;

  // ── CRM ──────────────────────────────────────────────────────────────────────
  const [crmStatus, setCrmStatus] = useState<string>("À Rappeler");
  const [agentNote, setAgentNote] = useState<string>("Client ouvert et disponible à la discussion.");
  const [newNote, setNewNote] = useState<string>("");
  const [notes, setNotes] = useState<NoteItem[]>([
    { id: 1, text: "A déjà eu un devis concurrent à 18k€.", author: "Sarah", time: "10 min ago" },
  ]);

  // ── Qualification form ───────────────────────────────────────────────────────
  const [form, setForm] = useState<FormData>({
    nom: "Jean Dupont", gsm: "+33 6 12 34 56 78", proprietaire: "Oui", depuis: "2010",
    nbPersonnes: "4", chauffage: "Fioul", consommation: "2 400 €", ageChaudiere: "12 ans",
    equipePV: "Non", equipePAC: "Non", toiture: "Bon état", isolation: "Moyenne", surface: "120 m²",
    profMr: "Salarié CDI", profMme: "Infirmière", revenus: "38 000 €/an", credits: "Non",
    fichage: "Sain", budget: "15 000 €", interet: "Élevé", urgence: "Avant hiver",
  });
  const setF = (k: keyof FormData, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  // ── AI state ─────────────────────────────────────────────────────────────────
  const [aiSummary, setAiSummary] = useState<string>("L'IA analysera la conversation en temps réel...");
  const [aiScore, setAiScore] = useState<AiScore>({ lead: 85, conversion: 78 });
  const [objections, setObjections] = useState<string[]>(["Délai de pose", "Financement à confirmer"]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // ── RDV ──────────────────────────────────────────────────────────────────────
  const [rdvDate, setRdvDate] = useState<string>("2026-06-03");
  const [rdvTime, setRdvTime] = useState<string>("10:00");
  const [rdvCommercial, setRdvCommercial] = useState<string>("Michel Martin");

  // ── Active tab ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"qualification" | "rdv" | "statut" | "notes">("qualification");

  // ── Highlighted fields ───────────────────────────────────────────────────────
  const [highlighted, setHighlighted] = useState<Set<keyof FormData>>(new Set());
  const flash = (keys: (keyof FormData)[]) => {
    setHighlighted(new Set(keys));
    setTimeout(() => setHighlighted(new Set()), 2000);
  };

  // ── AUTOMATIC CALL START ON LOAD ─────────────────────────────────────────────
  // ── Call quality fluctuation ─────────────────────────────────────────────────
  useEffect(() => {
    let t: ReturnType<typeof setInterval> | undefined;
    if (callState === 'calling' && !isOnHold) {
      t = setInterval(() => {
        setCallQuality(q => Math.max(88, Math.min(100, q + (Math.random() - 0.5) * 1.5)));
      }, 2000);
    }
    return () => { if (t !== undefined) clearInterval(t); };
  }, [callState, isOnHold]);

  // ── Pause timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let t: ReturnType<typeof setInterval> | undefined;
    if (agentStatus === "break") {
      t = setInterval(() => setPauseSeconds(s => s + 1), 1000);
    } else {
      setPauseSeconds(0);
    }
    return () => { if (t !== undefined) clearInterval(t); };
  }, [agentStatus]);

  // ── Transcription + auto-fill ────────────────────────────────────────────────
  useEffect(() => {
    if (callState !== 'calling' || isOnHold) return;
    const msg = SCRIPT.find(m => m.t === callDuration);
    if (!msg) return;

    setMessages(prev => [...prev, msg]);
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 80);

    triggerAI();

    if (msg.t === 18) { setF("chauffage", "Fioul"); flash(["chauffage"]); }
    if (msg.t === 28) { setF("depuis", "2010"); flash(["depuis"]); }
    if (msg.t === 40) { setF("nbPersonnes", "4"); setF("revenus", "38 000 €/an"); flash(["nbPersonnes", "revenus"]); }
    if (msg.t === 52) { setF("ageChaudiere", "12 ans"); flash(["ageChaudiere"]); }
    if (msg.t === 66) {
      setAiScore({ lead: 85, conversion: 78 });
      setObjections(["Délai de pose", "Financement à confirmer"]);
      setCrmStatus("RDV Client 1");
      const newNotif: Notification = {
        id: Date.now(),
        title: "Analyse IA complétée",
        message: "Lead qualifié avec un score de 85%",
        time: "À l'instant",
        read: false,
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  }, [callDuration, callState, isOnHold]);

  const triggerAI = () => { setAiLoading(true); setTimeout(() => setAiLoading(false), 900); };
  // ── Generate AI summary when call ends ──────────────────────────────────────
  useEffect(() => {
    if (callState === 'cooldown') {
      setAiSummary("Prospect qualifié automatiquement. Analyse IA terminée.");
      setAiScore({ lead: 85, conversion: 78 });
      setObjections(["Délai de pose", "Financement à confirmer"]);
    }
  }, [callState]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startCall = async () => {
    ctxStartCall();
    setMessages([]);
    setCallQuality(97);
  };
  const endCall = async () => {
    ctxEndCall();
    try {
      const statut = crmStatus === "Converti" ? "Converti" : crmStatus === "Refusé" ? "Refusé" : "Rappel";
      await api.saveCall({
        contact_id: 1,
        contact_name: contact.contact,
        contact_company: contact.company,
        phone: contact.phone,
        email: contact.email,
        duration: callDuration,
        besoin: form.chauffage || "",
        budget: form.budget || "",
        interet: form.interet || "",
        notes: agentNote,
        statut,
        call_date: new Date().toISOString()
      });
      if (crmStatus.includes("RDV")) {
        await api.createAppointment({
          client_name: contact.contact,
          client_phone: contact.phone,
          appointment_date: rdvDate,
          appointment_time: rdvTime,
          commercial: rdvCommercial
        });
      }
    } catch (e) {
      console.error("Auto-save error:", e);
    }
  };
  const startPause = (type: string) => { setAgentStatus("break"); setActivePause(type); setShowPauseMenu(false); };
  const endPause = () => { setAgentStatus("online"); setActivePause(""); };
const saveCrm = async () => {
  let statut: "Rappel" | "Converti" | "Refusé" = "Rappel";

  if (crmStatus === "Converti") {
    statut = "Converti";
  } else if (crmStatus === "Refusé") {
    statut = "Refusé";
  }

  try {
    console.log("CRM BEFORE API");

    const response = await api.saveCall({
      contact_id: 1,
      contact_name: contact.contact,
      contact_company: contact.company,
      phone: contact.phone,
      email: contact.email,
      duration: callDuration,
      besoin: form.chauffage || "",
      budget: form.budget || "",
      interet: form.interet || "",
      notes: agentNote,
      statut,
      call_date: new Date().toISOString()
    });

    console.log("CRM API RESPONSE =", response);

    alert("CRM enregistré avec succès");
  } catch (error) {
    console.error("CRM API ERROR =", error);
    alert("Erreur lors de l'enregistrement CRM");
  }
};

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes(prev => [{ id: Date.now(), text: newNote, author: "Moi", time: "À l'instant" }, ...prev]);
    setNewNote("");
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const iStyle = (k: keyof FormData): React.CSSProperties => ({
    ...inputStyle(darkMode),
    borderColor: highlighted.has(k) ? "#8B7EF5" : undefined,
    background: highlighted.has(k) ? (darkMode ? "#1E1B3A" : "#F3E5F5") : (darkMode ? "#11161F" : "#F8FAFC"),
    transition: "background 0.3s, border-color 0.3s",
    boxShadow: highlighted.has(k) ? `0 0 0 2px ${darkMode ? "rgba(139,126,245,0.2)" : "rgba(139,126,245,0.3)"}` : "none",
  });
  const handleManualCall = async (number: string) => {
    startCall();
    try {
      await api.saveCall({
        contact_id: 0,
        contact_name: number,
        contact_company: "Appel manuel",
        phone: number,
        email: "",
        duration: 0,
        besoin: "",
        budget: "",
        interet: "",
        notes: `Appel manuel vers ${number}`,
        statut: "Rappel",
        call_date: new Date().toISOString()
      });
    } catch (e) {
      console.error("Manual call save error:", e);
    }
  };

  const changeCampaign = (newCampaign: string) => {
  setCampaign(newCampaign);

  if (callState === 'calling') {
    endCall();

    setTimeout(() => {
      startCall();
    }, 500);
  }
  
};

  const callStatusLabel = callState === 'calling' && !isOnHold ? "En ligne" : callState === 'calling' ? "En attente" : "Inactif";
  const colors = getColors(darkMode);

  type TabId = "qualification" | "rdv" | "statut" | "notes";
  const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: "qualification", label: "Qualification", icon: FileText },
    { id: "rdv", label: "Rendez-vous", icon: Calendar },
    { id: "statut", label: "Statut CRM", icon: Award },
    { id: "notes", label: "Notes", icon: MessageCircle },
  ];

  // Helper pour obtenir la couleur par clé
  const getColorByKey = (key: ColorKey) => colors[key];
const saveQualification = async () => {
  console.log("QUALIFICATION BUTTON CLICKED");

  try {
    console.log("BEFORE API");

    const response = await api.saveAgentData({
      chauffage: form.chauffage,
      revenus: form.revenus,
      budget: form.budget,
      interet: form.interet
    });

    console.log("API RESPONSE =", response);

    alert("Qualification enregistrée");
  } catch (error) {
    console.error("API ERROR =", error);
  }
};
const saveRdv = async () => {
  try {
    console.log("BEFORE API");

    const response = await api.createAppointment({
      client_name: contact.contact,
      client_phone: contact.phone,
      appointment_date: rdvDate,
      appointment_time: rdvTime,
      commercial: rdvCommercial
    });

    console.log("API RESPONSE =", response);

    alert("RDV enregistré");
  } catch (error) {
    console.error("API ERROR =", error);
  }
};
  return (
    <div style={{
      background: "transparent",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        
        * { scrollbar-width: thin; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${darkMode ? "#2A3645" : "#CBD5E1"}; border-radius: 4px; }
        
        input:focus, select:focus, textarea:focus { 
          border-color: #8B7EF5 !important; 
          box-shadow: 0 0 0 3px rgba(139,126,245,0.15) !important; 
        }
        
        button { transition: all 0.2s ease; cursor: pointer; }
        button:hover { opacity: 0.85; transform: translateY(-1px); }
        button:active { transform: translateY(0); }
        
        .message-appear { animation: fadeSlide 0.25s ease-out; }
        .spin-animation { animation: spin 0.8s linear infinite; }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* UNIQUE HEADER BAR - SANS DEUXIÈME BARRE */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
     

      {/* ═══ MAIN BODY ════════════════════════════════════════════════════════ */}
      <div style={{
        maxWidth: 1440, margin: "0 auto", padding: "24px",
        display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 24,
      }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* CALL CONSOLE - BOUTONS CORRIGÉS */}
          <div style={{
            background: darkMode ? "#0B0F17" : "#FFFFFF",
            border: `1px solid ${darkMode ? "#252E3A" : "#E2E8F0"}`,
            borderRadius: 24, overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 24px", borderBottom: `1px solid ${darkMode ? "#252E3A" : "#E2E8F0"}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
            <select
  value={campaign}
  onChange={(e) => changeCampaign(e.target.value)}
  style={{
  ...inputStyle(darkMode),
  width: "160px",
  fontWeight: 600
}}
>
  <option value="PAC">PAC</option>
  <option value="PV">PV</option>
  <option value="Isolation">Isolation</option>
  <option value="Toiture">Toiture</option>
</select>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <PhoneCall size={18} style={{ color: callState === 'calling' && !isOnHold ? "#2DCF7F" : (darkMode ? "#9AA9B9" : "#64748B") }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: darkMode ? "#F1F5F9" : "#0F172A" }}>CONSOLE TÉLÉPHONIQUE</span>
                {callState === 'calling' && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2DCF7F", animation: "pulse 1.5s infinite" }} />
                    <span style={{ fontSize: 11, color: "#2DCF7F" }}>APPEL EN COURS</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: darkMode ? "#F1F5F9" : "#0F172A" }}>{fmt(callDuration)}</span>
                <span style={{
                  padding: "4px 14px", borderRadius: 30, fontSize: 11, fontWeight: 600,
                  background: callState === 'calling' && !isOnHold ? getColorByKey("green").bg : callState === 'calling' ? getColorByKey("amber").bg : getColorByKey("slate").bg,
                  color: callState === 'calling' && !isOnHold ? getColorByKey("green").text : callState === 'calling' ? getColorByKey("amber").text : getColorByKey("slate").text,
                }}>{callStatusLabel}</span>
              </div>
            </div>

            {callState === 'calling' && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
                {[
                  { icon: Signal, label: "Qualité", val: `${Math.round(callQuality)}%` },
                  { icon: Wifi, label: "Latence", val: "24 ms" },
                  { icon: Radio, label: "Whisper AI", val: "Actif" },
                  { icon: Battery, label: "Volume", val: "-12 dB" },
                ].map(({ icon: I, label, val }) => (
                  <div key={label} style={{
                    padding: "12px 20px",
                    borderRight: `1px solid ${darkMode ? "#252E3A" : "#E2E8F0"}`,
                    borderBottom: `1px solid ${darkMode ? "#252E3A" : "#E2E8F0"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <I size={12} style={{ color: "#2DCF7F" }} />
                      <span style={{ fontSize: 10, color: darkMode ? "#5A6C7E" : "#94A3B8", textTransform: "uppercase" }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: darkMode ? "#F1F5F9" : "#0F172A" }}>{val}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: callState === 'calling' && !isOnHold ? getColorByKey("green").bg : (darkMode ? "#11161F" : "#F8FAFC"),
                  border: `1px solid ${callState === 'calling' && !isOnHold ? getColorByKey("green").border : (darkMode ? "#252E3A" : "#E2E8F0")}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Phone size={20} style={{ color: callState === 'calling' && !isOnHold ? getColorByKey("green").text : (darkMode ? "#9AA9B9" : "#64748B") }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: darkMode ? "#F1F5F9" : "#0F172A" }}>{contact.contact}</div>
                  <div style={{ fontSize: 13, color: darkMode ? "#9AA9B9" : "#64748B" }}>{contact.phone}</div>
                </div>
              </div>

              {/* BOUTONS D'APPEL — Nouveau workflow 3 états */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {callState === 'cooldown' && (
                  <div style={{
                    display: "flex", alignItems: "center",
                    padding: "8px 24px",
                    borderRadius: 40,
                    background: getColorByKey("amber").bg,
                    border: `1px solid ${getColorByKey("amber").border}`,
                    boxShadow: "0 4px 20px rgba(240,179,75,0.2)",
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={16} style={{ color: getColorByKey("amber").text }} />
                        <span style={{ fontSize: 15, fontWeight: 700, color: getColorByKey("amber").text, fontVariantNumeric: "tabular-nums" }}>
                          {cooldownRemaining}s
                        </span>
                      </div>
                      <div style={{
                        width: 80, height: 4, background: `${getColorByKey("amber").border}`,
                        borderRadius: 4, marginTop: 4, overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%", background: getColorByKey("amber").text,
                          borderRadius: 4,
                          width: `${((30 - cooldownRemaining) / 30) * 100}%`,
                          transition: "width 1s linear",
                        }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TRANSCRIPTION IA */}
          <div style={{
            background: darkMode ? "#0B0F17" : "#FFFFFF",
            border: `1px solid ${darkMode ? "#252E3A" : "#E2E8F0"}`,
            borderRadius: 24, overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 24px", borderBottom: `1px solid ${darkMode ? "#252E3A" : "#E2E8F0"}`,
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Bot size={18} style={{ color: "#8B7EF5" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: darkMode ? "#F1F5F9" : "#0F172A" }}>TRANSCRIPTION IA</span>
                <span style={{ fontSize: 11, color: darkMode ? "#5A6C7E" : "#94A3B8" }}>Whisper · Diarisation</span>
              </div>
              {aiLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <RefreshCw size={13} className="spin-animation" style={{ color: "#8B7EF5" }} />
                  <span style={{ fontSize: 11, color: "#8B7EF5" }}>Analyse...</span>
                </div>
              )}
            </div>
            <div ref={scrollRef} style={{
              padding: "18px 24px", maxHeight: 300, overflowY: "auto",
              display: "flex", flexDirection: "column", gap: 12
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Bot size={36} style={{ color: darkMode ? "#5A6C7E" : "#94A3B8", margin: "0 auto 12px", display: "block" }} />
                  <p style={{ fontSize: 13, color: darkMode ? "#5A6C7E" : "#94A3B8" }}>L'appel va démarrer automatiquement...</p>
                </div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className="message-appear" style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: m.speaker === "Agent" ? "flex-end" : "flex-start" }}>
                    <span style={{ fontSize: 10, color: m.speaker === "Agent" ? "#8B7EF5" : "#2DCF7F", fontWeight: 600 }}>{m.speaker} · {fmt(m.t)}</span>
                    <div style={{
                      maxWidth: "78%", padding: "10px 16px", borderRadius: 18, fontSize: 13, lineHeight: 1.5,
                      background: m.speaker === "Agent" ? getColorByKey("purple").bg : (darkMode ? "#11161F" : "#F8FAFC"),
                      color: m.speaker === "Agent" ? getColorByKey("purple").text : (darkMode ? "#F1F5F9" : "#0F172A"),
                      border: `1px solid ${m.speaker === "Agent" ? getColorByKey("purple").border : (darkMode ? "#252E3A" : "#E2E8F0")}`,
                    }}>{m.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TABBED SECTION */}
          <div style={{
            background: darkMode ? "#0B0F17" : "#FFFFFF",
            border: `1px solid ${darkMode ? "#252E3A" : "#E2E8F0"}`,
            borderRadius: 24, overflow: "hidden",
          }}>
            <div style={{ display: "flex", borderBottom: `1px solid ${darkMode ? "#252E3A" : "#E2E8F0"}`, padding: "0 20px", gap: 6 }}>
              {TABS.map(({ id, label, icon: I }) => (
                <button key={id} onClick={() => setActiveTab(id)} style={{
                  padding: "14px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: "transparent", border: "none", whiteSpace: "nowrap",
                  borderBottom: activeTab === id ? "2px solid #8B7EF5" : "2px solid transparent",
                  color: activeTab === id ? "#8B7EF5" : (darkMode ? "#9AA9B9" : "#64748B"),
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <I size={14} /> {label}
                </button>
              ))}
            </div>

            <div style={{ padding: "24px" }}>
              {activeTab === "qualification" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#5D9BFF", marginBottom: 14 }}>IDENTITÉ & LOGEMENT</div>
                    <Field label="NOM COMPLET" isDark={darkMode}><input value={form.nom} onChange={e => setF("nom", e.target.value)} style={iStyle("nom")} /></Field>
                    <Field label="GSM" isDark={darkMode}><input value={form.gsm} readOnly style={iStyle("gsm")} /></Field>
                    <Field label="PROPRIÉTAIRE DEPUIS" isDark={darkMode}><input value={form.depuis} onChange={e => setF("depuis", e.target.value)} style={iStyle("depuis")} /></Field>
                    <Field label="PERSONNES" isDark={darkMode}><input value={form.nbPersonnes} onChange={e => setF("nbPersonnes", e.target.value)} style={iStyle("nbPersonnes")} /></Field>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#2DCF7F", marginBottom: 14 }}>QUALIFICATION TECHNIQUE</div>
                    <Field label="CHAUFFAGE" isDark={darkMode}><FSelect value={form.chauffage} onChange={e => setF("chauffage", e.target.value)} options={["Gaz", "Fioul", "Électrique", "Bois"]} isDark={darkMode} /></Field>
                    <Field label="ÂGE CHAUDIÈRE" isDark={darkMode}><input value={form.ageChaudiere} onChange={e => setF("ageChaudiere", e.target.value)} style={iStyle("ageChaudiere")} /></Field>
                    <Field label="CONSOMMATION" isDark={darkMode}><input value={form.consommation} onChange={e => setF("consommation", e.target.value)} style={iStyle("consommation")} /></Field>
                    <Field label="SURFACE" isDark={darkMode}><input value={form.surface} onChange={e => setF("surface", e.target.value)} style={iStyle("surface")} /></Field>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#F0B34B", marginBottom: 14 }}>PROFIL FINANCIER</div>
                    <Field label="REVENUS" isDark={darkMode}><input value={form.revenus} onChange={e => setF("revenus", e.target.value)} style={iStyle("revenus")} /></Field>
                    <Field label="BUDGET" isDark={darkMode}><input value={form.budget} onChange={e => setF("budget", e.target.value)} style={iStyle("budget")} /></Field>
                    <Field label="INTÉRÊT" isDark={darkMode}><FSelect value={form.interet} onChange={e => setF("interet", e.target.value)} options={["Faible", "Moyen", "Élevé", "Très élevé"]} isDark={darkMode} /></Field>
                    <button onClick={saveQualification}
                    style={{ marginTop: 16, width: "100%", padding: "12px", background: "#1C4935", border: "none", borderRadius: 40, color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Save size={14} /> ENREGISTRER
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "rdv" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div>
                    <Field label="DATE" isDark={darkMode}><input type="date" value={rdvDate} onChange={e => setRdvDate(e.target.value)} style={inputStyle(darkMode)} /></Field>
                    <Field label="HEURE" isDark={darkMode}><input type="time" value={rdvTime} onChange={e => setRdvTime(e.target.value)} style={inputStyle(darkMode)} /></Field>
                    <Field label="COMMERCIAL" isDark={darkMode}><FSelect value={rdvCommercial} onChange={e => setRdvCommercial(e.target.value)} options={["Michel Martin", "Jean-Luc Dubois", "Sarah Lopez"]} isDark={darkMode} /></Field>
                    <button onClick={saveRdv}
                    style={{ marginTop: 16, width: "100%", padding: "12px", background: "#8B7EF5", border: "none", borderRadius: 40, color: "#fff", fontWeight: 600 }}>CONFIRMER LE RENDEZ-VOUS</button>
                  </div>
                  <div style={{ background: darkMode ? "#11161F" : "#F8FAFC", borderRadius: 16, padding: 18 }}>
                    <div style={{ fontWeight: 700, marginBottom: 14, color: darkMode ? "#F1F5F9" : "#0F172A" }}>RÉCAPITULATIF</div>
                    {[["Date", rdvDate], ["Heure", rdvTime], ["Commercial", rdvCommercial], ["Client", contact.contact], ["Adresse", contact.city]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${darkMode ? "#252E3A" : "#E2E8F0"}`, fontSize: 13 }}>
                        <span style={{ color: darkMode ? "#9AA9B9" : "#64748B" }}>{k}</span><span style={{ fontWeight: 600, color: darkMode ? "#F1F5F9" : "#0F172A" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "statut" && (
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                    {STATUS_OPTIONS.map(s => {
                      const isActive = crmStatus === s.value;
                      const c = getColorByKey(s.color);
      
                      return (
                        <button key={s.value} onClick={() => setCrmStatus(s.value)} style={{
                          padding: "7px 16px", borderRadius: 30, fontSize: 12, fontWeight: 500,
                          border: `1px solid ${isActive ? c.border : (darkMode ? "#252E3A" : "#E2E8F0")}`,
                          background: isActive ? c.bg : (darkMode ? "#11161F" : "#F8FAFC"),
                          color: isActive ? c.text : (darkMode ? "#9AA9B9" : "#64748B"),
                        }}>
                          {isActive && <Check size={11} style={{ marginRight: 6, display: "inline" }} />}
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                  <textarea value={agentNote} onChange={e => setAgentNote(e.target.value)} rows={3} style={{ width: "100%", padding: "12px", background: darkMode ? "#11161F" : "#F8FAFC", borderRadius: 16, border: `1px solid ${darkMode ? "#252E3A" : "#E2E8F0"}`, color: darkMode ? "#F1F5F9" : "#0F172A" }} />
                  <button onClick={saveCrm}
                  style={{ marginTop: 16, padding: "12px 24px", background: "#1C4935", border: "none", borderRadius: 40, color: "#fff", fontWeight: 600 }}><Save size={14} style={{ marginRight: 8 }} /> SAUVEGARDER CRM</button>
                </div>
              )}

              {activeTab === "notes" && (
                <div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Ajouter une note..." onKeyDown={e => e.key === "Enter" && addNote()} style={{ flex: 1, ...inputStyle(darkMode) }} />
                    <button onClick={addNote} style={{ padding: "10px 20px", background: "#8B7EF5", border: "none", borderRadius: 40, cursor: "pointer" }}><Plus size={16} color="#fff" /></button>
                  </div>
                  {notes.map(n => (
                    <div key={n.id} style={{ padding: "14px", background: darkMode ? "#11161F" : "#F8FAFC", borderRadius: 16, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#8B7EF5" }}>{n.author}</span>
                        <span style={{ fontSize: 11, color: darkMode ? "#5A6C7E" : "#94A3B8" }}>{n.time}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: darkMode ? "#F1F5F9" : "#0F172A" }}>{n.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Section title="FICHE PROSPECT" icon={User} iconColor="#5D9BFF" isDark={darkMode}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, padding: "12px", background: darkMode ? "#11161F" : "#F8FAFC", borderRadius: 18 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: getColorByKey("purple").bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: getColorByKey("purple").text }}>JD</div>
              <div><div style={{ fontWeight: 700, fontSize: 16, color: darkMode ? "#F1F5F9" : "#0F172A" }}>{contact.contact}</div><div style={{ fontSize: 12, color: darkMode ? "#9AA9B9" : "#64748B" }}>{contact.role} · {contact.company}</div></div>
            </div>
            {[
              { icon: PhoneCall, val: contact.phone },
              { icon: Mail, val: contact.email },
              { icon: MapPin, val: contact.city },
            ].map(({ icon: I, val }) => (
              <div key={val} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, marginBottom: 10 }}>
                <I size={14} style={{ color: darkMode ? "#5A6C7E" : "#94A3B8" }} /><span style={{ color: darkMode ? "#9AA9B9" : "#64748B" }}>{val}</span>
              </div>
            ))}
          </Section>

          <Section title="COMPOSER UN NUMÉRO" icon={PhoneCall} iconColor="#F0B34B" isDark={darkMode}>
            <PhoneKeypad onCall={handleManualCall} />
          </Section>

          <Section title="PIPELINE CRM" icon={Activity} iconColor="#2DCF7F" isDark={darkMode}>
            {[
              { step: 1, title: "Agent", detail: "Qualification & RDV", active: callState === 'calling' },
              { step: 2, title: "Confirmation", detail: "Vérification qualité", active: callState === 'cooldown' },
              { step: 3, title: "Commercial", detail: "Visite à domicile", active: false },
              { step: 4, title: "Installation", detail: "Pose & raccordement", active: false },
            ].map(({ step, title, detail, active }) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px", borderRadius: 14, background: active ? getColorByKey("green").bg : (darkMode ? "#11161F" : "#F8FAFC"), marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: active ? getColorByKey("green").text : (darkMode ? "#2A3645" : "#CBD5E1"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: active ? (darkMode ? "#03050A" : "#0F172A") : (darkMode ? "#5A6C7E" : "#94A3B8") }}>{step}</div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13, color: darkMode ? "#F1F5F9" : "#0F172A" }}>{title}</div><div style={{ fontSize: 11, color: darkMode ? "#5A6C7E" : "#94A3B8" }}>{detail}</div></div>
                {active && <Badge color="green" isDark={darkMode}>En cours</Badge>}
              </div>
            ))}
          </Section>

          <Section title="ANALYSE IA" icon={Sparkles} iconColor="#8B7EF5" isDark={darkMode} action={aiLoading ? <RefreshCw size={14} className="spin-animation" style={{ color: "#8B7EF5" }} /> : undefined}>
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 16 }}>
              <CircleScore value={aiScore.lead} label="Score Lead" color="#8B7EF5" isDark={darkMode} />
              <CircleScore value={aiScore.conversion} label="Conversion" color="#2DCF7F" isDark={darkMode} />
            </div>
            <Div isDark={darkMode} />
            <div><div style={{ fontSize: 10, color: darkMode ? "#5A6C7E" : "#94A3B8", marginBottom: 6 }}>RÉSUMÉ AUTOMATIQUE</div><p style={{ fontSize: 12, background: darkMode ? "#11161F" : "#F8FAFC", padding: "12px", borderRadius: 14, lineHeight: 1.5, color: darkMode ? "#F1F5F9" : "#0F172A" }}>Prospect Jean Dupont, propriétaire depuis 2010, chaudière fioul 12 ans. Revenus ~38k€, projet de PAC. RDV confirmé mardi 10h. Fort potentiel.</p></div>
            {objections.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: darkMode ? "#5A6C7E" : "#94A3B8", marginBottom: 6 }}>OBJECTIONS</div>
                <div style={{ display: "flex", gap: 8 }}>{objections.map(o => <Badge key={o} color="amber" isDark={darkMode}>{o}</Badge>)}</div>
              </div>
            )}
          </Section>

          <Section title="ACTIONS RAPIDES" icon={Zap} iconColor="#F0B34B" isDark={darkMode}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "SMS", icon: Send, color: "blue" as ColorKey },
                { label: "RDV", icon: Calendar, color: "purple" as ColorKey },
                { label: "Lead Chaud", icon: TrendingUp, color: "orange" as ColorKey },
                { label: "Export", icon: Download, color: "slate" as ColorKey },
              ].map(({ label, icon: I, color }) => (
                <button key={label} style={{ padding: "10px", background: darkMode ? "#11161F" : "#F8FAFC", border: `1px solid ${darkMode ? "#252E3A" : "#E2E8F0"}`, borderRadius: 40, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: darkMode ? "#F1F5F9" : "#0F172A" }}>
                  <I size={14} style={{ color: getColorByKey(color).text }} /> {label}
                </button>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;