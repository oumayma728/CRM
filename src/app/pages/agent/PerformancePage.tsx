import React from 'react';
import { Layout } from '../../components/Layout';
import { TrendingUp, TrendingDown, Award, Target, MessageSquare } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const weeklyData = [
  { day: 'Lun', score: 78, appels: 45, conversions: 28 },
  { day: 'Mar', score: 82, appels: 52, conversions: 31 },
  { day: 'Mer', score: 85, appels: 48, conversions: 35 },
  { day: 'Jeu', score: 88, appels: 56, conversions: 38 },
  { day: 'Ven', score: 92, appels: 54, conversions: 40 }
];

const skillsData = [
  { skill: 'Écoute', value: 95 },
  { skill: 'Persuasion', value: 88 },
  { skill: 'Empathie', value: 92 },
  { skill: 'Argumentation', value: 85 },
  { skill: 'Gestion objections', value: 78 },
  { skill: 'Closing', value: 90 }
];

const suggestions = [
  { id: 1, type: 'success', title: 'Excellent travail sur l\'écoute active', description: 'Vos temps de silence et vos reformulations sont très bien maîtrisés.' },
  { id: 2, type: 'improvement', title: 'Améliorer la gestion des objections', description: 'Prenez plus de temps pour comprendre la vraie raison derrière l\'objection avant de répondre.' },
  { id: 3, type: 'tip', title: 'Astuce : Technique du silence', description: 'Après avoir posé une question importante, laissez un silence de 3-5 secondes pour que le client réfléchisse.' }
];

export default function PerformancePage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2>Ma Performance</h2>
          <p className="text-muted-foreground mt-1">Analyse détaillée de votre performance et suggestions d'amélioration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-primary to-secondary rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3>Score Global</h3>
              <Award className="w-5 h-5" />
            </div>
            <p className="text-4xl font-medium">92/100</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+5 vs semaine dernière</span>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Taux conversion</h3>
              <Target className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-medium text-foreground">68.5%</p>
            <div className="flex items-center gap-1 mt-2 text-success">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+3.2%</span>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Appels qualité</h3>
              <MessageSquare className="w-5 h-5 text-accent" />
            </div>
            <p className="text-3xl font-medium text-foreground">87%</p>
            <div className="flex items-center gap-1 mt-2 text-success">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+1.5%</span>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-muted-foreground">Classement</h3>
              <Award className="w-5 h-5 text-warning" />
            </div>
            <p className="text-3xl font-medium text-foreground">3e</p>
            <p className="text-sm text-muted-foreground mt-2">Sur 24 agents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Évolution du score hebdomadaire</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={3} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Compétences évaluées</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={skillsData}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="skill" stroke="var(--color-foreground)" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="var(--color-muted-foreground)" />
                <Radar name="Score" dataKey="value" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.3} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Performance par jour</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="appels" fill="var(--color-chart-1)" name="Appels" />
                <Bar dataKey="conversions" fill="var(--color-chart-4)" name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Feedback IA & Suggestions</h3>
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-4 rounded-lg border ${
                    suggestion.type === 'success' ? 'bg-success/5 border-success/20' :
                    suggestion.type === 'improvement' ? 'bg-warning/5 border-warning/20' :
                    'bg-info/5 border-info/20'
                  }`}
                >
                  <h4 className={`font-medium mb-1 ${
                    suggestion.type === 'success' ? 'text-success' :
                    suggestion.type === 'improvement' ? 'text-warning' :
                    'text-info'
                  }`}>
                    {suggestion.title}
                  </h4>
                  <p className="text-sm text-foreground">{suggestion.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
