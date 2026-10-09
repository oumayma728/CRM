import React, { useEffect, useState } from 'react';
import { agentService, type Contact } from '../../services/agentService';
import { Search, Building2, Phone, Mail, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 50;

export default function ConfContactsListPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Wait 300 ms after the last keystroke before asking the server (avoids one request per letter).
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // The server returns ONE page at a time and does the searching itself.
  useEffect(() => {
    let cancelled = false;
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const data = await agentService.getContactsPage({ page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined });
        if (!cancelled) { setContacts(data.items); setTotal(data.total); }
      } catch (error) {
        console.error('Erreur chargement contacts:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchContacts();
    return () => { cancelled = true; };
  }, [page, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (loading && contacts.length === 0 && !debouncedSearch) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Mes Contacts</h2>
        <p className="text-muted-foreground mt-1">Contacts créés via la fiche contact.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="bg-primary/10 rounded-lg px-4 py-2">
          <span className="text-primary font-medium">Total : {total} contact{total !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher par nom, société, téléphone…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="glass-input w-full pl-10 pr-4 py-2.5 bg-input-background border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      {contacts.length === 0 ? (
        <div className="glass-card text-center p-12">
          <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun contact trouvé</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Société</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Contact</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Téléphone</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Email</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Ville</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(contact => (
                  <tr key={contact.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium">{contact.source || '—'}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium">
                      {contact.prenom} {contact.nom}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                        {contact.telephone || '—'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        {contact.email || '—'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                        {contact.adresse || '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted/50"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
            <span className="text-muted-foreground">Page {page} sur {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted/50"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
