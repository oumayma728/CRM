import React, { useState } from 'react';
import { Layout } from '../../components/Layout';
import { Phone, Mail, MapPin, Building, User, Search, Filter } from 'lucide-react';

const contacts = [
  { id: 1, company: 'Société ABC', contact: 'Jean Dupont', role: 'Directeur Commercial', phone: '+33 6 12 34 56 78', email: 'j.dupont@societeabc.fr', city: 'Paris' },
  { id: 2, company: 'Entreprise XYZ', contact: 'Marie Martin', role: 'CEO', phone: '+33 6 23 45 67 89', email: 'm.martin@xyz.fr', city: 'Lyon' },
  { id: 3, company: 'Solutions Pro', contact: 'Pierre Leroy', role: 'Responsable Achats', phone: '+33 6 34 56 78 90', email: 'p.leroy@solutions-pro.fr', city: 'Marseille' },
  { id: 4, company: 'Tech Innovate', contact: 'Sophie Bernard', role: 'Directrice IT', phone: '+33 6 45 67 89 01', email: 's.bernard@techinnovate.fr', city: 'Toulouse' },
  { id: 5, company: 'Digital Services', contact: 'Luc Moreau', role: 'Manager', phone: '+33 6 56 78 90 12', email: 'l.moreau@digital-services.fr', city: 'Nantes' },
  { id: 6, company: 'Startup Alpha', contact: 'Emma Dubois', role: 'Fondatrice', phone: '+33 6 67 89 01 23', email: 'e.dubois@startup-alpha.fr', city: 'Bordeaux' },
  { id: 7, company: 'Industries Beta', contact: 'Thomas Petit', role: 'DG', phone: '+33 6 78 90 12 34', email: 't.petit@industries-beta.fr', city: 'Lille' },
  { id: 8, company: 'Commerce Gamma', contact: 'Julie Roux', role: 'Responsable', phone: '+33 6 89 01 23 45', email: 'j.roux@commerce-gamma.fr', city: 'Strasbourg' },
  { id: 9, company: 'Services Delta', contact: 'Marc Blanc', role: 'Directeur', phone: '+33 6 90 12 34 56', email: 'm.blanc@services-delta.fr', city: 'Nice' },
  { id: 10, company: 'Consulting Epsilon', contact: 'Nadia Kacem', role: 'Associée', phone: '+33 6 01 23_45_67', email: 'n.kacem@consulting-epsilon.fr', city: 'Montpellier' }
];

export default function ContactsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch =
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.city.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch ;
  });

  const handleCall = (phone: string, contactName: string) => {
    alert(`Appel en cours vers ${contactName} au ${phone}`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2>Liste des Contacts</h2>
          <p className="text-muted-foreground mt-1">Accédez rapidement à tous vos contacts et appelez en un clic</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Total contacts</h3>
              <User className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-medium text-foreground">{contacts.length}</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un contact, société ou ville..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                />
              </div>
              
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-muted-foreground">Société</th>
                  <th className="text-left p-4 text-muted-foreground">Contact</th>
                  <th className="text-left p-4 text-muted-foreground">Téléphone</th>
                  <th className="text-left p-4 text-muted-foreground">Email</th>
                  <th className="text-left p-4 text-muted-foreground">Ville</th>
                  <th className="text-left p-4 text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{contact.company}</p>
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
                      <div className="flex items-center gap-2 text-foreground">
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
                      <button
                        onClick={() => handleCall(contact.phone, contact.contact)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Phone className="w-4 h-4" />
                        Appeler
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
