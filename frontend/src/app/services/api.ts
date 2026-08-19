import type { Message, Conversation } from '../types/chat';

/**
 * api.ts - API Client for CRM AI Backend
 * Handles all HTTP requests to CRM API backend
 * URL relative = fonctionne avec Vite proxy (dev) et Nginx (prod Docker)
 * VITE_API_URL = URL absolue pour Render Static Site (cross-origin)
 */
const BASE_URL = import.meta.env.VITE_API_URL || "";

export const API_BASE = `${BASE_URL}/api`;
const AUTH_BASE = `${BASE_URL}/api/auth`;

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
}

interface Call {
  call_id: number;
  agent_name: string;
  audio_path: string;
  sentiment: string;
  sentiment_score: number;
  score_percentage: number;
  performance: string;
  summary: string;
  keywords: string[];
  call_date: string;
}

interface Stats {
  total_calls: number;
  avg_score: number;
  sentiment_distribution: Record<string, number>;
  performance_distribution: Record<string, number>;
  role: string;
  agent_name?: string;
}

// ============================================================
// Token Management
// ============================================================

export const getToken = (): string | null => {
  return localStorage.getItem('crm_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('crm_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('crm_token');
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};


const request = async (path: string, options: any = {}) => {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401) {
      // Token might be invalid or missing – clear it and redirect to login page
      removeToken();
      // Optionally, you could trigger a navigation to the login route if you have access to a router
      // For now, throw a specific error to be caught by UI components
      throw new Error('Unauthorized: Please log in again.');
    }
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }
  return response.json();
};

// ============================================================
// Auth API
// ============================================================

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let detail = 'Login failed';
    try { const e = await response.json(); detail = e.detail || detail; } catch { }
    throw new Error(detail);
  }

  const result = await response.json();
  // Store JWT token for subsequent authenticated requests
  setToken(result.token);
  return result;
};

export const getMe = async (): Promise<LoginResponse['user']> => {
  const response = await fetch(`${AUTH_BASE}/me`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
};

export const createUser = async (userData: any): Promise<any> => {
  const response = await fetch(`${AUTH_BASE}/users/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    let detail = 'Failed to create user';
    try { const e = await response.json(); detail = e.detail || detail; } catch { }
    throw new Error(detail);
  }

  return response.json();
};

export const deleteUser = async (userId: number): Promise<any> => {
  const response = await fetch(`${AUTH_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let detail = 'Failed to delete user';
    try { const e = await response.json(); detail = e.detail || detail; } catch { }
    throw new Error(detail);
  }

  return response.json();
};

export const updateUser = async (userId: number, userData: any): Promise<any> => {
  const response = await fetch(`${AUTH_BASE}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    let detail = 'Failed to update user';
    try { const e = await response.json(); detail = e.detail || detail; } catch { }
    throw new Error(detail);
  }

  return response.json();
};
export const forgotPassword = async (email: string): Promise<any> => {
  const response = await fetch(`${AUTH_BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    let detail = 'Failed to send reset email';
    try { const e = await response.json(); detail = e.detail || detail; } catch { }
    throw new Error(detail);
  }

  return response.json();
};

export const resetPassword = async (token: string, new_password: string): Promise<any> => {
  const response = await fetch(`${AUTH_BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password }),
  });

  if (!response.ok) {
    let detail = 'Failed to reset password';
    try { const e = await response.json(); detail = e.detail || detail; } catch { }
    throw new Error(detail);
  }

  return response.json();
};
export const getAgents = async (): Promise<any[]> => {
  const response = await fetch(`${AUTH_BASE}/agents`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get agents');
  }

  return response.json();
};

export const getLeads = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/leads`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get leads');
  return response.json();
};

// ============================================================
// Calls API
// ============================================================

interface CallsResponse {
  calls: Call[];
  total: number;
  limit: number;
  offset: number;
  role: string;
}

export const getCalls = async (params?: {
  agent_name?: string;
  sentiment?: string;
  limit?: number;
  offset?: number;
}): Promise<CallsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.agent_name) queryParams.set('agent_name', params.agent_name);
  if (params?.sentiment) queryParams.set('sentiment', params.sentiment);
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.offset) queryParams.set('offset', params.offset.toString());

  const response = await fetch(`${API_BASE}/calls?${queryParams}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get calls');
  }

  return response.json();
};

export const getCallDetail = async (callId: number): Promise<Call> => {
  const response = await fetch(`${API_BASE}/calls/${callId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get call detail');
  }

  return response.json();
};

// ============================================================
// Stats API
// ============================================================

export const getStats = async (agent_name?: string): Promise<Stats> => {
  const queryParams = agent_name ? `?agentName=${agent_name}` : '';

  const response = await fetch(`${API_BASE}/calls/stats${queryParams}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to get stats");
  }

  return response.json();
};

export const getAgentsCallsSummary = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/calls/agents-summary`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get agents summary');
  }

  return response.json();
};

// ============================================================
// Performance Comparison API
// ============================================================

interface PerformanceMetrics {
  total_calls: number;
  avg_score: number;
  conversions: number;
  refusal_rate: number;
  avg_duration: number;
}

interface PerformanceComparison {
  current_month: PerformanceMetrics;
  previous_month: PerformanceMetrics;
  evolution: {
    total_calls: number;
    avg_score: number;
    conversions: number;
    refusal_rate: number;
    avg_duration: number;
  };
  monthly_data: PerformanceMetrics[];
}

export const getPerformanceComparison = async (month?: string, agentId?: number): Promise<PerformanceComparison> => {
  let url = `${API_BASE}/performance/comparison?`;
  if (month) url += `month=${month}&`;
  if (agentId) url += `agent_id=${agentId}&`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get performance comparison');
  }

  return response.json();
};

export const getSalaries = async (month?: string): Promise<any[]> => {
  const params = month ? `?month=${month}` : '';
  const response = await fetch(`${API_BASE}/salaries${params}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get salaries');
  return response.json();
};

export const getSalaryMonthlySummary = async (month?: string): Promise<any> => {
  const params = month ? `?month=${month}` : '';
  const response = await fetch(`${API_BASE}/salaries/monthly-summary${params}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get salary summary');
  return response.json();
};

export const calculateSalaries = async (month?: string): Promise<any[]> => {
  const params = month ? `?month=${month}` : '';
  const response = await fetch(`${API_BASE}/salaries/calculate${params}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to calculate salaries');
  return response.json();
};

export const getSalaryRules = async (role?: string): Promise<any[]> => {
  const params = role ? `?role=${role}` : '';
  const response = await fetch(`${API_BASE}/salaries/rules${params}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get salary rules');
  return response.json();
};

export const createSalaryRule = async (data: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/salaries/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let detail = 'Failed to create rule';
    try { const e = await response.json(); detail = e.detail || detail; } catch { }
    throw new Error(detail);
  }
  return response.json();
};

export const updateSalaryRule = async (ruleId: number, data: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/salaries/rules/${ruleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let detail = 'Failed to update rule';
    try { const e = await response.json(); detail = e.detail || detail; } catch { }
    throw new Error(detail);
  }
  return response.json();
};

export const deleteSalaryRule = async (ruleId: number): Promise<any> => {
  const response = await fetch(`${API_BASE}/salaries/rules/${ruleId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete rule');
  return response.json();
};

export const getAgentSalaryDetail = async (agentId: number, month?: string): Promise<any> => {
  const params = month ? `?month=${month}` : '';
  const response = await fetch(`${API_BASE}/salaries/${agentId}${params}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get agent salary detail');
  return response.json();
};

export const updateSalaryPayment = async (salaryId: number, status: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/salaries/${salaryId}/payment`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update payment status');
  return response.json();
};

export const getAgentsFromCalls = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/performance/agents-from-calls`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get agents from calls');
  return response.json();
};

export const getPerformanceTrendByName = async (agentName: string, month?: string): Promise<any> => {
  let url = `${API_BASE}/performance/comparison?`;
  if (agentName) url += `agent_name=${encodeURIComponent(agentName)}&`;
  if (month) url += `month=${month}&`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get performance trend');
  return response.json();
};

export const getAllAgentsPerformance = async (month?: string): Promise<any[]> => {
  const queryParams = month ? `?month=${month}` : '';
  const response = await fetch(`${API_BASE}/performance/agents${queryParams}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get agents performance');
  return response.json();
};

export const getConversations = async (): Promise<Conversation[]> => {
  const response = await fetch(`${API_BASE}/messages/conversations`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get conversations');
  }

  return response.json();
};

export const getMessages = async (userId: number): Promise<Message[]> => {
  const response = await fetch(`${API_BASE}/messages/${userId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get messages');
  }

  return response.json();
};

export const sendMessage = async (receiverId: number, content: string, isUrgent: boolean = false): Promise<Message> => {
  const response = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ receiver_id: receiverId, content, is_urgent: isUrgent }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
};

export const markMessageAsRead = async (messageId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/messages/${messageId}/read`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to mark message as read');
  }
};

// ============================================================
// Save Call API (for direct calls from contact list)
// ============================================================
// Audio Analysis API
// ============================================================

interface AnalysisResult {
  agent_name: string;
  audio_path: string;
  transcription: string;
  labeled_transcript?: string;
  agent_text?: string;
  client_text?: string;
  sentiment: string;
  sentiment_score?: number;
  score_percentage: number;
  performance: string;
  summary: string;
  keywords: string[];
  score_accueil: number;
  score_energie: number;
  score_voix: number;
  score_ecoute: number;
  score_client: number;
  score_operateur: number;
  score_efficacite: number;
  score_conclusion: number;
  agent_talk_ratio?: number;
  client_talk_ratio?: number;
  agent_seconds?: number;
  client_seconds?: number;
  script_respected?: boolean;
  qualification_match?: boolean;
  refusal_reason?: string;
  inactivity_detected?: boolean;
  inactivity_duration?: number;
  next_steps?: string;
  appointment_detected?: boolean;
  appointment_date?: string;
}

export const analyzeCall = async (file: File, agentName: string): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('agent_name', agentName);

  const response = await fetch(`${API_BASE}/analyze/call`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    let detail = 'Analysis failed';
    try { const e = await response.json(); detail = e.error || e.detail || detail; } catch { }
    throw new Error(detail);
  }

  return await response.json();
};

// ============================================================
// Chatbot API
// ============================================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const sendChatMessage = async (
  message: string,
  role: string,
  agentName?: string
): Promise<{ response: string; sources?: string[] }> => {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      message,
      role,
      agent_name: agentName,
    }),
  });

  if (!response.ok) {
    throw new Error('Chat failed');
  }

  return response.json();
};

// ============================================================
// Analytics API (connected to MySQL)
// ============================================================

export const getAnalyticsOverview = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/analytics/overview`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to get analytics' }));
    throw new Error(err.detail || err.title || 'Failed to get analytics');
  }
  return response.json();
};

export const getAgentsPerformance = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/analytics/agents-performance`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get agents performance');
  return response.json();
};

export const getSupervisionData = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/analytics/supervision`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get supervision data');
  return response.json();
};

export const getGeoAnalysis = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/analytics/geo`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get geo data');
  return response.json();
};

export const getFollowupsData = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/analytics/followups`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get followups');
  return response.json();
};

export const getCallsLog = async (limit: number = 200): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/analytics/calls-log?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get calls log');
  return response.json();
};

export const getPointageData = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/analytics/pointage`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get pointage data');
  return response.json();
};

export const getLiveAgents = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/analytics/live-agents`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get live agents');
  return response.json();
};

export const getCallsToday = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/analytics/calls-today`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get calls today');
  return response.json();
};

export const getGlobalComparison = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/analytics/comparison`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to get global comparison');
  }
  return response.json();
};

// ============================================================
// Attendance API
// ============================================================

export const clockIn = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/attendance/clock-in`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to clock in');
  return response.json();
};

export const clockOut = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/attendance/clock-out`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to clock out');
  return response.json();
};

export const startBreak = async (type: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/attendance/break/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ type }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to start break' }));
    return { success: false, message: err.error || 'Failed to start break' };
  }
  return response.json();
};

export const endBreak = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/attendance/break/end`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    try {
      const err = await response.json();
      return { success: false, message: err.message || err.detail || err.error || 'Failed to end break' };
    } catch {
      return { success: false, message: 'Failed to end break' };
    }
  }
  return response.json();
};

export const getAttendanceStatus = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/attendance/status`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get attendance status');
  return response.json();
};

export const getAttendanceReport = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/attendance/report`, {
    headers: getAuthHeaders(),

  });
  if (!response.ok) throw new Error('Failed to get attendance report');
  return response.json();

};
export const getAttendanceTeamDetail = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/attendance/team-detail`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get team detail');
  return response.json();
};

// ============================================================
// Appointments API
// ============================================================

export const getAppointments = async (date?: string, agentId?: number): Promise<any[]> => {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (agentId) params.set('agent_id', agentId.toString());
  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE}/appointments${qs}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get appointments');
  return response.json();
};

export const getAppointmentDetail = async (id: number): Promise<any> => {
  const response = await fetch(`${API_BASE}/appointments/${id}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get appointment detail');
  return response.json();
};

export const createAppointment = async (data: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let detail = 'Failed to create appointment';
    try { const e = await response.json(); detail = e.error || e.detail || detail; } catch { }
    throw new Error(detail);
  }
  return response.json();
};

export const updateAppointment = async (id: number, data: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let detail = 'Failed to update appointment';
    try { const e = await response.json(); detail = e.error || e.detail || detail; } catch { }
    throw new Error(detail);
  }
  return response.json();
};

export const deleteAppointment = async (id: number): Promise<any> => {
  const response = await fetch(`${API_BASE}/appointments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete appointment');
  return response.json();
};

// ============================================================
// AI Scoring API
// ============================================================

export const aiScore = async (data: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/ai/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('AI scoring failed');
  return response.json();
};

export const aiAnalyzeEligibility = async (data: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/ai/analyze-eligibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Eligibility analysis failed');
  return response.json();
};

export const aiDetectFakeRdv = async (data: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/ai/detect-fake-rdv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Fake RDV detection failed');
  return response.json();
};

export const aiAgentInsights = async (agentId: number): Promise<any> => {
  const response = await fetch(`${API_BASE}/ai/insights/${agentId}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get AI insights');
  return response.json();
};

// ============================================================
// Agent Save API
// ============================================================

export const saveAgentData = async (data: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/agents/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let detail = 'Failed to save agent data';
    try { const e = await response.json(); detail = e.detail || e.message || detail; } catch { }
    throw new Error(detail);
  }
  return response.json();
};

export const getAgentSavedData = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/agents/saved`, { headers: getAuthHeaders() });
  if (!response.ok) {
    let detail = 'Failed to get agent saved data';
    try { const e = await response.json(); detail = e.detail || e.message || detail; } catch { }
    throw new Error(detail);
  }
  return response.json();
};

export const saveQualityEvaluation = async (evaluationData: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/quality/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(evaluationData),
  });
  if (!response.ok) throw new Error('Failed to save evaluation');
  return response.json();
};

export const getAgentEvaluations = async (agentId: number): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/quality/evaluations/${agentId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch evaluations');
  return response.json();
};

export const getAllEvaluations = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/quality/evaluations`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch all evaluations');
  return response.json();
};

export const getEvaluationStats = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/quality/stats`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch evaluation stats');
  return response.json();
};

export const deleteEvaluation = async (evalId: number): Promise<any> => {
  const response = await fetch(`${API_BASE}/quality/evaluations/${evalId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete evaluation');
  return response.json();
};

export const getQualityTeamStatus = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/quality/dashboard/team-status`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get team status');
  return response.json();
};

export const getQualityAgentsState = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/quality/dashboard/agents-state`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get agents state');
  return response.json();
};

export const getQualityGlobalStats = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/quality/dashboard/global-stats`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get global stats');
  return response.json();
};

export const getQualityDashboardAlerts = async (): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/quality/dashboard/alerts`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get dashboard alerts');
  return response.json();
};

export const getQualityEvaluationHistory = async (limit: number = 20, offset: number = 0): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/quality/dashboard/evaluation-history?limit=${limit}&offset=${offset}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get evaluation history');
  return response.json();
};

export const getQualityAgentDetail = async (agentId: number): Promise<any> => {
  const response = await fetch(`${API_BASE}/quality/dashboard/agent-detail/${agentId}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get agent detail');
  return response.json();
};

export const getQualityRdvJour = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/quality/dashboard/rdv-jour`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get RDV jour');
  return response.json();
};

export const getQualityComparison = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/quality/dashboard/comparison`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to get quality comparison');
  return response.json();
};

// ============================================================
// Save Call API (for direct calls from contact list)
// ============================================================

export interface SaveCallRequest {
  contact_id: number;
  contact_name: string;
  contact_company: string;
  phone: string;
  email: string;
  duration: number;
  besoin: string;
  budget: string;
  interet: string;
  notes: string;
  statut: 'Converti' | 'Rappel' | 'Refusé';
  call_date: string;
}

export const saveCall = async (callData: SaveCallRequest): Promise<any> => {
  const response = await fetch(`${API_BASE}/calls/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(callData),
  });

  if (!response.ok) {
    let detail = 'Failed to save call';
    try { const e = await response.json(); detail = e.detail || detail; } catch { }
    throw new Error(detail);
  }

  return response.json();
};

// ============================================================
// Config & Maintenance API
// ============================================================

export const saveWeights = async (weights: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/config/weights`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(weights),
  });
  if (!response.ok) throw new Error('Failed to save weights');
  return response.json();
};

export const saveConfig = async (config: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/config/system`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error('Failed to save config');
  return response.json();
};



// ============================================================
// Export all
// ============================================================

const exportData = () => request('/api/maintenance/export');
const importData = (data: any) => request('/api/maintenance/import', { method: 'POST', body: JSON.stringify(data) });
const resetData = () => request('/api/maintenance/reset', { method: 'POST' });

export const analyzeTranscript = async (data: {
  transcript: string;
  call_duration?: number;
  agent_name?: string;
  qualification?: string;
}): Promise<any> => {
  const response = await fetch(`${API_BASE}/analyze/transcript`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Transcript analysis failed');
  return response.json();
};

export const analyzeExistingCall = async (callId: number): Promise<any> => {
  const response = await fetch(`${API_BASE}/analyze/analyze-call/${callId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Call analysis failed');
  return response.json();
};

export const batchAnalyzeCalls = async (limit: number = 50): Promise<any> => {
  const response = await fetch(`${API_BASE}/analyze/batch-analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ limit }),
  });
  if (!response.ok) throw new Error('Batch analysis failed');
  return response.json();
};

// ============================================================
// Permissions API
// ============================================================

export const getMyPermissions = async (): Promise<{ permissions: string[]; role: string }> => {
  const response = await fetch(`${AUTH_BASE}/permissions`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get permissions');
  return response.json();
};

export const api = {
  // Auth
  login,
  getMe,
  getAgents,
  getLeads,
  createUser,
  deleteUser,
  updateUser,
  forgotPassword,
  resetPassword,


  // Calls
  getCalls,
  getCallDetail,

  // Stats
  getStats,
  getAgentsCallsSummary,

  // Analysis
  analyzeCall,

  // Chat
  sendChatMessage,

  // Analytics (MySQL)
  getAnalyticsOverview,
  getAgentsPerformance,
  getSupervisionData,
  getGeoAnalysis,
  getFollowupsData,
  getCallsLog,
  getPointageData,
  getPerformanceComparison,
  getAllAgentsPerformance,
  getConversations,
  getMessages,
  getLiveAgents,
  getCallsToday,
  getGlobalComparison,
  sendMessage,
  markMessageAsRead,

  // Direct Call
  saveCall,

  // Config & Maintenance
  saveWeights,
  saveConfig,
  exportData,
  importData,
  resetData,

  // Appointments

  getAppointments,
  getAppointmentDetail,
  createAppointment,
  updateAppointment,
  deleteAppointment,


  // AI Scoring
  aiScore,
  aiAnalyzeEligibility,
  aiDetectFakeRdv,
  aiAgentInsights,

  // Agent Save
  saveAgentData,
  getAgentSavedData,

  // Attendance
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getAttendanceStatus,
  getAttendanceReport,
  getAttendanceTeamDetail,
  saveQualityEvaluation,
  getAgentEvaluations,
  getAllEvaluations,
  getEvaluationStats,
  deleteEvaluation,
  getQualityTeamStatus,
  getQualityAgentsState,
  getQualityGlobalStats,
  getQualityDashboardAlerts,
  getQualityEvaluationHistory,
  getQualityAgentDetail,
  getQualityRdvJour,
  getQualityComparison,
  getAgentsFromCalls,
  getPerformanceTrendByName,

  getSalaries,
  getSalaryMonthlySummary,
  calculateSalaries,
  getSalaryRules,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule,
  getAgentSalaryDetail,
  updateSalaryPayment,

  // Enhanced AI Analysis
  analyzeTranscript,
  analyzeExistingCall,
  batchAnalyzeCalls,

  // Permissions
  getMyPermissions,
};

export default api;

export const updateAppointmentStatus = (
  appointmentId: number,
  status: string
) =>
  request(
    `/api/appointments/${appointmentId}/status`,
    {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }
  );

