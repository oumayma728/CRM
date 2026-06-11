import React, { useState } from 'react';
import { Layout } from '../../components/Layout';
import { MapPin, TrendingUp, Filter } from 'lucide-react';

const regionsData = [
  { id: 1, region: 'Tunis', appels: 156, conversions: 98, taux: 62.8, population: '1M+' },
  { id: 2, region: 'Sfax', appels: 89, conversions: 52, taux: 58.4, population: '500K+' },
  { id: 3, region: 'Sousse', appels: 72, conversions: 45, taux: 62.5, population: '300K+' },
  { id: 4, region: 'Paris', appels: 124, conversions: 82, taux: 66.1, population: '2M+' },
  { id: 5, region: 'Lyon', appels: 98, conversions: 62, taux: 63.3, population: '500K+' },
  { id: 6, region: 'Marseille', appels: 86, conversions: 48, taux: 55.8, population: '850K+' },
  { id: 7, region: 'Nabeul', appels: 45, conversions: 28, taux: 62.2, population: '200K+' },
  { id: 8, region: 'Bizerte', appels: 38, conversions: 22, taux: 57.9, population: '150K+' }
];

export default function MapPage() {
  const [selectedCountry, setSelectedCountry] = useState('all');

  const filteredData = selectedCountry === 'all' ? regionsData :
    selectedCountry === 'tunisia' ? regionsData.filter(r => ['Tunis', 'Sfax', 'Sousse', 'Nabeul', 'Bizerte'].includes(r.region)) :
    regionsData.filter(r => ['Paris', 'Lyon', 'Marseille'].includes(r.region));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2>Carte Géographique</h2>
          <p className="text-muted-foreground mt-1">Distribution géographique des conversions</p>
        </div>

        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-4 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
          >
            <option value="all">Toutes les régions</option>
            <option value="tunisia">Tunisie</option>
            <option value="france">France</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Carte de chaleur des conversions</h3>
            <div className="relative bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-8 h-[500px] flex items-center justify-center">
              <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
                {filteredData.slice(0, 6).map((region) => (
                  <div
                    key={region.id}
                    className="relative group"
                    style={{
                      transform: `scale(${0.8 + (region.taux / 100) * 0.4})`
                    }}
                  >
                    <div className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                      region.taux >= 62 ? 'bg-success/20 border-success' :
                      region.taux >= 58 ? 'bg-warning/20 border-warning' :
                      'bg-destructive/20 border-destructive'
                    }`}>
                      <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-center font-medium text-foreground">{region.region}</p>
                      <p className="text-center text-2xl font-medium text-primary mt-1">{region.taux}%</p>
                      <p className="text-center text-sm text-muted-foreground">{region.conversions} conversions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="mb-4">Top régions</h3>
              <div className="space-y-3">
                {filteredData.sort((a, b) => b.taux - a.taux).slice(0, 5).map((region, index) => (
                  <div key={region.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-primary">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-foreground">{region.region}</p>
                        <p className="text-sm text-muted-foreground">{region.population}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-success">{region.taux}%</p>
                      <p className="text-sm text-muted-foreground">{region.conversions}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="mb-4">Statistiques globales</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total appels</span>
                  <span className="font-medium text-foreground">
                    {filteredData.reduce((sum, r) => sum + r.appels, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Conversions</span>
                  <span className="font-medium text-success">
                    {filteredData.reduce((sum, r) => sum + r.conversions, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Taux moyen</span>
                  <span className="font-medium text-primary">
                    {(filteredData.reduce((sum, r) => sum + r.taux, 0) / filteredData.length).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
