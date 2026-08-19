import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, TrendingDown, Trash2, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

interface AlertRule {
  id: number;
  rule_type: string;
  threshold_value: number;
  is_active: boolean;
  notification_email: string;
}

const ruleTypeLabels: Record<string, string> = {
  low_score: 'Score minimum',
  inactivity: 'Inactivité maximum',
  conversion: 'Taux de conversion'
};

const ruleTypeIcons: Record<string, React.ElementType> = {
  low_score: TrendingDown,
  inactivity: Clock,
  conversion: AlertTriangle
};

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, historyRes] = await Promise.all([
        fetch('/api/alerts/rules'),
        fetch('/api/alerts/history?limit=20')
      ]);
      
      const rulesData = await rulesRes.json();
      const historyData = await historyRes.json();
      
      setRules(rulesData.rules || []);
      setHistory(historyData.history || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (ruleId: number, thresholdValue: number) => {
    setSaving(true);
    try {
      await fetch(`/api/alerts/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold_value: thresholdValue, is_active: true })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle?')) return;
    
    try {
      await fetch(`/api/alerts/rules/${ruleId}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Configuration des alertes</h2>
        <p className="text-muted-foreground mt-1">
          Gérez les seuils et les notifications d'alertes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Règles d'alertes
            </CardTitle>
            <CardDescription>
              Configurez les seuils de déclenchement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rules.map(rule => {
              const Icon = ruleTypeIcons[rule.rule_type] || AlertTriangle;
              return (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{ruleTypeLabels[rule.rule_type]}</p>
                      <p className="text-sm text-muted-foreground">
                        {rule.is_active ? 'Actif' : 'Inactif'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      defaultValue={rule.threshold_value}
                      className="w-20 font-mono"
                      id={`threshold-${rule.id}`}
                    />
                    <Button
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg"
                      onClick={() => {
                        const val = (document.getElementById(`threshold-${rule.id}`) as HTMLInputElement).value;
                        handleUpdate(rule.id, Number(val));
                      }}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
                      onClick={() => alert('Historique détaillé bientôt disponible')}
                    >
                      <Clock className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Historique des alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-muted-foreground">Aucune alerte récente</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {history.slice(0, 10).map((alert: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{alert.message || alert.alert_type}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(alert.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}