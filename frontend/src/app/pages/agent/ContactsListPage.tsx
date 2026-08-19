import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, Mail, MapPin, Building, User, Search, 
  Filter, MoreVertical, Star, StarOff, Briefcase,
  MessageCircle, Clock, Award, TrendingUp,
  ChevronRight, Eye, Edit, Trash2, Download,
  Grid, List, X, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import api from '../../services/api';

interface Contact {
  id: number;
  company: string;
  contact: string;
  role: string;
  phone: string;
  email: string;
  city: string;
  industry: string;
  status: string;
  lastContact: string;
  deals: number;
  revenue: number;
}

// ── Helper: ligne info en mode lecture ────────────────────────────────────────
function InfoRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${highlight ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-muted/30'}`}>
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">{label}</p>
        <p className={`text-sm font-semibold truncate ${highlight ? 'text-emerald-400' : 'text-foreground'}`}>{value}</p>
      </div>
    </div>
  );
}

export default function ContactsListPage() {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Contact | null>(null);
  const [contactsList, setContactsList] = useState<Contact[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const [newContact, setNewContact] = useState({
  contact: '',
  phone: '',
  email: ''
});

  useEffect(() => {
    loadContacts();
    const savedFavorites = localStorage.getItem('favoriteContacts');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Verrouillage du scroll de la page quand un modal est ouvert (conserve la position)
  useEffect(() => {
    if (showCreateModal || showDetailsModal) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [showCreateModal, showDetailsModal]);

  // Fermer le modal Nouveau Contact avec la touche Échap
  useEffect(() => {
    if (!showCreateModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCreateModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCreateModal]);

  // Création d'un contact (sauvegarde locale + notification)
  const handleCreateContact = () => {
    if (!newContact.contact.trim()) {
      showNotificationMessage('Veuillez saisir le nom du contact');
      return;
    }
    const contact = {
      id: Date.now(),
      company: newContact.contact.trim(),
      contact: newContact.contact.trim(),
      role: '',
      phone: newContact.phone.trim(),
      email: newContact.email.trim(),
      city: '',
      industry: '',
      status: 'nouveau',
      lastContact: new Date().toISOString().split('T')[0],
      deals: 0,
      revenue: 0,
    };
    setContactsList(prev => [...prev, contact]);
    setNewContact({ contact: '', phone: '', email: '' });
    setShowCreateModal(false);
    showNotificationMessage('Contact ajouté avec succès !');
  };

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await api.getLeads();
      const mapped: Contact[] = (data || []).map((lead: any, idx: number) => ({
        id: lead.id || idx + 1,
        company: lead.name || lead.company || '',
        contact: lead.name || lead.contact || '',
        role: lead.role || '',
        phone: lead.phone || '',
        email: lead.email || '',
        city: lead.city || '',
        industry: lead.industry || '',
        status: lead.status === 'actif' ? 'actif' : lead.status === 'inactif' ? 'inactif' : 'nouveau',
        lastContact: lead.last_contact || lead.lastContact || new Date().toISOString().split('T')[0],
        deals: lead.deals ?? 0,
        revenue: lead.revenue ?? 0,
      }));
      setContactsList(mapped);
    } catch (e) {
      console.error('Error loading contacts:', e);
    } finally {
      setLoading(false);
    }
  };

  const industries = ['all', ...new Set(contactsList.map(c => c.industry))];
  const statuses = ['all', 'actif', 'inactif', 'nouveau'];

  const filteredContacts = contactsList.filter(contact => {
    const matchesSearch =
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || contact.status === filterStatus;
    const matchesIndustry = filterIndustry === 'all' || contact.industry === filterIndustry;
    
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const handleOpenModal = (contact: Contact) => {
    setSelectedContact(contact);
    setEditData({ ...contact });
    setEditMode(false);
    setShowDetailsModal(true);
  };

 const handleSaveEdit = () => {
  console.log("SAVE CLICKED", editData);

  if (!editData) return;

  setContactsList(prev =>
    prev.map(c =>
      c.id === editData.id ? editData : c
    )
  );

  setSelectedContact(editData);
  setEditMode(false);

  showNotificationMessage(
    'Fiche contact mise à jour avec succès !'
  );
};

  const handleFieldChange = (field: keyof Contact, value: string | number) => {
    setEditData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleCall = (contact: Contact) => {
    navigate('/agent/contact', { state: { contact, autoStart: true } });
  };

  const toggleFavorite = (contactId: number) => {
    let newFavorites;
    if (favorites.includes(contactId)) {
      newFavorites = favorites.filter(id => id !== contactId);
      showNotificationMessage('Retiré des favoris');
    } else {
      newFavorites = [...favorites, contactId];
      showNotificationMessage('Ajouté aux favoris');
    }
    setFavorites(newFavorites);
    localStorage.setItem('favoriteContacts', JSON.stringify(newFavorites));
  };

  const showNotificationMessage = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'actif': return 'bg-gradient-to-r from-emerald-500 to-teal-500';
      case 'inactif': return 'bg-gradient-to-r from-muted to-muted';
      case 'nouveau': return 'bg-gradient-to-r from-primary to-indigo-500';
      default: return 'bg-gradient-to-r from-muted to-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'actif': return 'Actif';
      case 'inactif': return 'Inactif';
      case 'nouveau': return 'Nouveau';
      default: return status;
    }
  };

  const getIndustryIcon = (industry: string) => {
    switch(industry) {
      case 'Tech': return <Award className="w-4 h-4" />;
      case 'Finance': return <TrendingUp className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <div className="group bg-card rounded-2xl border border-border hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-[1.02]">
      <div className={`h-1 ${getStatusColor(contact.status)}`} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {contact.company.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-foreground">{contact.company}</h3>
              <p className="text-sm text-muted-foreground">{contact.contact}</p>
            </div>
          </div>
          <button 
            onClick={() => toggleFavorite(contact.id)}
            className="p-2 hover:bg-accent rounded-xl transition-all"
          >
            {favorites.includes(contact.id) ? 
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> : 
              <StarOff className="w-5 h-5 text-muted-foreground" />
            }
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="w-4 h-4 text-primary" />
            {contact.role}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building className="w-4 h-4 text-primary" />
            {contact.industry}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            {contact.city}
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dernier contact</span>
            <span className="font-medium text-foreground">{contact.lastContact}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Affaires en cours</span>
            <span className="font-medium text-emerald-400">{contact.deals}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">CA généré</span>
            <span className="font-medium text-primary">{contact.revenue.toLocaleString()} €</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleCall(contact)}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Appeler
          </button>
          <button
            onClick={() => handleOpenModal(contact)}
            className="px-3 py-2 bg-muted/30 text-foreground/80 rounded-xl text-sm font-medium hover:bg-accent transition-all duration-200"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const ContactRow = ({ contact }: { contact: Contact }) => (
    <tr className="border-b border-border hover:bg-accent transition-all duration-200 group">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            {contact.company.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-foreground">{contact.company}</p>
            <p className="text-xs text-muted-foreground">{contact.industry}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div>
          <p className="font-medium text-foreground">{contact.contact}</p>
          <p className="text-sm text-muted-foreground">{contact.role}</p>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2 text-foreground/80">
          <Phone className="w-4 h-4 text-primary" />
          {contact.phone}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="w-4 h-4" />
          {contact.email}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          {contact.city}
        </div>
      </td>
      <td className="p-4">
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(contact.status)}`}>
          {getStatusText(contact.status)}
        </span>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleCall(contact)}
            className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            title="Appeler"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFavorite(contact.id)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              favorites.includes(contact.id) 
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' 
                : 'bg-muted/30 text-muted-foreground hover:bg-accent'
            }`}
            title={favorites.includes(contact.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            {favorites.includes(contact.id) ? <Star className="w-4 h-4 fill-yellow-500" /> : <StarOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleOpenModal(contact)}
            className="p-2 bg-muted/30 text-muted-foreground rounded-lg hover:bg-accent transition-all duration-200"
            title="Voir détails"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  const stats = {
    total: contactsList.length,
    actifs: contactsList.filter(c => c.status === 'actif').length,
    revenuTotal: contactsList.reduce((sum, c) => sum + c.revenue, 0),
    affairesTotal: contactsList.reduce((sum, c) => sum + c.deals, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/15 via-card to-muted/15 dark:from-background dark:via-background dark:to-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Chargement des contacts...</p>
        </div>
      </div>
    );
  }

  return (
  <>
  <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-muted/15 via-card to-muted/15 dark:from-background dark:via-background dark:to-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Notification */}
          {showNotification && (
            <div className="fixed top-4 right-4 z-50 animate-slideIn">
              <div className="bg-card rounded-xl shadow-2xl p-4 border-l-4 border-primary">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <p className="text-foreground">{notificationMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="bg-card rounded-2xl shadow-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Liste des Contacts
                </h1>
                <p className="text-muted-foreground mt-1">Gérez votre réseau professionnel efficacement</p>
              </div>
              
         <div className="flex gap-2">
  <button
    onClick={() => setShowCreateModal(true)}
    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-[1px] active:scale-95 transition-all cursor-pointer"
  >
    <User className="w-4 h-4" />
    Nouveau Contact
  </button>
</div>
  
</div>
              
      

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary font-medium">Total Contacts</p>
                    <p className="text-2xl font-bold text-primary">{stats.total}</p>
                  </div>
                  <User className="w-8 h-8 text-primary opacity-50" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-400 font-medium">Contacts Actifs</p>
                    <p className="text-2xl font-bold text-emerald-400">{stats.actifs}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-500 opacity-50" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Affaires en cours</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.affairesTotal}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-purple-500 opacity-50" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">CA Généré</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.revenuTotal.toLocaleString()} €</p>
                  </div>
                  <Award className="w-8 h-8 text-amber-500 opacity-50" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-card rounded-2xl shadow-xl border border-border p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, société, ville ou rôle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground font-medium shadow-sm"
                />
              </div>
              
              <div className="flex gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-9 pr-8 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'Tous les statuts' : getStatusText(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={filterIndustry}
                    onChange={(e) => setFilterIndustry(e.target.value)}
                    className="pl-9 pr-8 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    {industries.map(industry => (
                      <option key={industry} value={industry}>
                        {industry === 'all' ? 'Tous les secteurs' : industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-1 p-1 bg-muted/30 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-card shadow-md text-primary' : 'text-muted-foreground'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-card shadow-md text-primary' : 'text-muted-foreground'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Contacts Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {filteredContacts.map(contact => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-muted/20 to-muted/5">
                    <tr>
                      <th className="text-left p-4 text-muted-foreground font-semibold">Société</th>
                      <th className="text-left p-4 text-muted-foreground font-semibold">Contact</th>
                      <th className="text-left p-4 text-muted-foreground font-semibold">Téléphone</th>
                      <th className="text-left p-4 text-muted-foreground font-semibold">Email</th>
                      <th className="text-left p-4 text-muted-foreground font-semibold">Ville</th>
                      <th className="text-left p-4 text-muted-foreground font-semibold">Statut</th>
                      <th className="text-left p-4 text-muted-foreground font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(contact => (
                      <ContactRow key={contact.id} contact={contact} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredContacts.length === 0 && (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <div className="inline-flex p-4 bg-muted/30 rounded-full mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Aucun contact trouvé</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterIndustry('all');
                }}
                className="mt-4 text-primary hover:underline"
              >
                Effacer les filtres
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Détails / Édition Contact */}
      {showDetailsModal && selectedContact && editData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slideIn">
            {/* Header barre couleur */}
            <div className={`h-1.5 ${getStatusColor(editData.status)}`} />

            {/* Header titre */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {editData.company.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {editMode ? 'Modifier la fiche' : editData.company}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {editMode ? 'Tous les champs sont modifiables' : editData.contact}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </button>
                )}
                <button
                  onClick={() => { setShowDetailsModal(false); setEditMode(false); }}
                  className="p-2 hover:bg-accent rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Corps */}
            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {editMode ? (
                /* ── MODE ÉDITION ── */
                <div className="space-y-5">
                  {/* Société & Contact */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Société *</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <input
                          type="text"
                          value={editData.company}
                          onChange={e => handleFieldChange('company', e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Nom du contact *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <input
                          type="text"
                          value={editData.contact}
                          onChange={e => handleFieldChange('contact', e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rôle & Secteur */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Fonction / Rôle</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <input
                          type="text"
                          value={editData.role}
                          onChange={e => handleFieldChange('role', e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Secteur d'activité</label>
                      <div className="relative">
                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <input
                          type="text"
                          value={editData.industry}
                          onChange={e => handleFieldChange('industry', e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* TÉLÉPHONE & EMAIL */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Téléphone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <input
                          type="tel"
                          value={editData.phone}
                          readOnly
                          placeholder="+33 6 XX XX XX XX"
                          className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border-2 border-emerald-400/60 dark:border-emerald-600/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <input
                          type="email"
                          value={editData.email}
                          onChange={e => handleFieldChange('email', e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ville & Statut */}
                <div>
  <label className="block text-xs font-bold mb-1">
    Campagne
  </label>

  <select
    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder:text-muted-foreground rounded-xl"
  >
    <option>Isolation</option>
    <option>PAC</option>
    <option>PV</option>
    <option>Toiture</option>
  </select>
</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Ville</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <input
                          type="text"
                          value={editData.city}
                          onChange={e => handleFieldChange('city', e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Statut</label>
                      <select
                        value={editData.status}
                        onChange={e => handleFieldChange('status', e.target.value)}
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                        <option value="nouveau">Nouveau</option>
                      </select>
                    </div>
                  </div>

                 <div className="bg-muted/20 border border-border rounded-xl p-4">

  <h3 className="font-bold text-white mb-3">
    Qualification Client
  </h3>

  <div className="grid grid-cols-2 gap-3">

    <input
      placeholder="Revenus"
      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl"
    />

    <input
      placeholder="Crédits"
      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl"
    />

    <input
      placeholder="Mode Chauffage"
      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl"
    />

    <input
      placeholder="Etat Toiture"
      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl"
    />

  </div>

</div>



                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Affaires en cours</label>
                      <input
                        type="number"
                        min={0}
                        value={editData.deals}
                        onChange={e => handleFieldChange('deals', Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">CA Généré (€)</label>
                      <input
                        type="number"
                        min={0}
                        value={editData.revenue}
                        onChange={e => handleFieldChange('revenue', Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* ── MODE LECTURE ── */
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <InfoRow icon={<Briefcase className="w-4 h-4 text-primary" />} label="Fonction" value={editData.role} />
                      <InfoRow icon={<Building className="w-4 h-4 text-primary" />} label="Secteur" value={editData.industry} />
                      <InfoRow icon={<MapPin className="w-4 h-4 text-primary" />} label="Ville" value={editData.city} />
                    </div>
                    <div className="space-y-3">
                      <InfoRow icon={<Phone className="w-4 h-4 text-emerald-500" />} label="Téléphone" value={editData.phone} highlight />
                      <InfoRow icon={<Mail className="w-4 h-4 text-primary" />} label="Email" value={editData.email} />
                      <InfoRow icon={<Clock className="w-4 h-4 text-primary" />} label="Dernier contact" value={editData.lastContact} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-muted/20 to-muted/5 rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-3">Activité commerciale</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Affaires en cours</p>
                        <p className="text-2xl font-bold text-emerald-400">{editData.deals}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CA généré</p>
                        <p className="text-2xl font-bold text-primary">{editData.revenue.toLocaleString()} €</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-border flex gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Enregistrer les modifications
                  </button>
                  <button
                    onClick={() => { setEditData({ ...selectedContact }); setEditMode(false); }}
                    className="px-4 py-2.5 bg-muted/30 text-foreground/80 rounded-xl font-semibold text-sm hover:bg-accent transition-all"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleCall(editData)}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Appeler
                  </button>
                  <button className="flex-1 px-4 py-2.5 bg-muted/30 text-foreground/80 rounded-xl font-semibold text-sm hover:bg-accent transition-all flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-card rounded-2xl w-full max-w-lg overflow-hidden border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Nouveau Contact
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Ajoutez un prospect à votre liste
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl bg-muted/30 text-foreground/70 hover:bg-accent hover:text-foreground transition-all"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Nom du contact</label>
                <input
                  placeholder="Ex. Mohamed Ben Salah"
                  value={newContact.contact}
                  onChange={(e) =>
                    setNewContact({
                      ...newContact,
                      contact: e.target.value
                    })
                  }
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Téléphone</label>
                <input
                  placeholder="06 00 00 00 00"
                  value={newContact.phone}
                  onChange={(e) =>
                    setNewContact({
                      ...newContact,
                      phone: e.target.value
                    })
                  }
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="contact@entreprise.com"
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact({
                      ...newContact,
                      email: e.target.value
                    })
                  }
                  className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 bg-muted/30 text-foreground/80 rounded-xl font-semibold text-sm hover:bg-accent transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateContact}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Enregistrer le contact
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}