// src/app/services/quality.ts

/**
 * Interfaces representing the data structures used by the Quality service.
 * These are shared between frontend pages such as QualityDashboard, ManualEvaluationPage,
 * AgentQualityDetail, etc.
 */

// Trend data displayed on the dashboard (score and RDV per day)
export interface QualityTrend {
  name: string; // e.g., 'Lun', 'Mar', ...
  score: number; // quality score for the day
  rdv: number; // number of rendez‑vous booked that day
}

// RDV aggregation per agent used on the dashboard
export interface RdvPerAgent {
  name: string; // Agent name
  rdv: number; // RDV count
  objectif: number; // target RDV count
  taux: number; // achievement rate (percentage)
}

export interface Agent {
  id: number;
  name: string;
}

import { getAgents, getAuthHeaders, API_BASE } from "./api";

export const fetchAgents = async (): Promise<Agent[]> => {
  return await getAgents();
};

export const fetchAgentPerformance = async (id: number): Promise<AgentPerformance> => {
  const res = await fetch(`${API_BASE}/agents/${id}/performance`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch performance');
  return (await res.json()) as AgentPerformance;
};

// Alert item shown in the Alerts tab
export type AlertType = 'critical' | 'warning' | 'info';
export interface QualityAlert {
  id: number;
  type: AlertType;
  agent: string;
  message: string;
  time: string; // HH:mm
  read: boolean;
  category: string; // e.g., 'qualite', 'pointage', ...
}

// Detail of a single agent used by AgentQualityDetail and the agents table
export type TrendDirection = 'up' | 'down';
export interface AgentDetail {
  agent: string;
  score: number; // overall quality percentage
  calls: number;
  rdv: number;
  taux: number; // % of target achieved
  trend: TrendDirection;
  color: string; // hex colour used for UI
}

/**
 * Agent performance summary returned by `api.getAgentsPerformance`.
 * The backend provides multiple score fields for each quality criterion.
 */
export interface MonthlyMetrics {
  calls: number;
  appointments: number;
  conversion_rate: number; // percentage
  avg_call_duration: number; // seconds
  quality_score: number; // percentage
  attendance_rate: number; // percentage
  daily_performance: number[]; // array of daily appointment counts
}

// Updated AgentPerformance for monthly comparison
export interface AgentPerformance {
  agent_id: number;
  agent_name: string;
  current_month: MonthlyMetrics;
  previous_month: MonthlyMetrics;
}


// Criterion used in manual evaluation forms
export interface EvaluationCriterion {
  id: string; // unique identifier, used as key when sending scores
  category: string; // e.g., 'ACCUEIL', 'DÉCOUVERTE'
  label: string; // human‑readable description
  score: number; // 0‑5 rating
}

/** Payload sent when a manual evaluation is saved */
export interface QualityEvaluationPayload {
  agent_id: number;
  call_date: string; // ISO date string (YYYY‑MM‑DD)
  call_ref: string;
  decision: 'conforme' | 'coaching' | 'non-conforme';
  commentaires: string;
  // Optional extracted highlights
  points_forts?: string;
  points_faibles?: string;
  // Overall score as a percentage string (e.g., "84.3%")
  global_score: string;
  // Scores per criterion, key format `score_<criterion_id>`
  [key: string]: any;
}

// Statistics displayed on the dashboard KPI cards
export interface DashboardStats {
  avgQuality: number; // average quality score (%)
  compliance: number; // IA compliance rate (%)
  alerts: number; // total alerts (including read/unread)
  totalCalls: number;
}

// Historical evaluation entry used in the History tab
export interface EvaluationHistoryItem {
  id: number;
  date: string; // formatted date string
  agent: string;
  score: number;
  calls: number;
  rdv: number;
  type: string; // e.g., 'Évaluation IA'
  evaluator: string;
}

// Export a collection type that groups all the interfaces for convenience
export type QualityServiceTypes =
  | QualityTrend
  | RdvPerAgent
  | QualityAlert
  | AgentDetail
  | AgentPerformance
  | EvaluationCriterion
  | QualityEvaluationPayload
  | DashboardStats
  | EvaluationHistoryItem;
