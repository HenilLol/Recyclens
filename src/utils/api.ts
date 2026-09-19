import {
  ScanAnalysisResponse,
  PresetScenario,
  FeedbackSubmission,
  CreatePassportInput,
  BatchRecoveryPassport,
  CreateDispatchInput,
  RecoveryDispatchManifest,
  ReconcileIntakeInput,
  IntakeReconciliationReport,
} from '../types/recyclens.types.ts';

const API_BASE = '/api';

export async function checkServerHealth(): Promise<{
  status: string;
  ai_vision_configured: boolean;
  version: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      status: 'offline-standalone',
      ai_vision_configured: false,
      version: '1.0.0-local-cache',
    };
  }
}

export async function fetchPresets(): Promise<PresetScenario[]> {
  try {
    const res = await fetch(`${API_BASE}/scan/presets`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to load presets from server, returning local fallback presets.');
    return [];
  }
}

export async function analyzeWasteScan(payload: {
  image?: string;
  weight_kg?: number;
  location?: { lat: number; lng: number; label: string };
  preset_id?: string;
  material_hint?: string;
}): Promise<ScanAnalysisResponse> {
  const res = await fetch(`${API_BASE}/scan/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Scan analysis failed with status ${res.status}`);
  }

  return await res.json();
}

export async function recalculateMatch(payload: {
  material_code: string;
  weight_kg: number;
  contamination_percentage: number;
  quality_grade: string;
  location?: { lat: number; lng: number };
  composition?: any[];
  recovery_profile?: any;
}): Promise<{
  valuation: any;
  matches: any[];
  eligible_matches: any[];
  incompatible_matches: any[];
  split_routes?: any[];
  optimization_scenarios?: any[];
  optimization_comparison?: any;
}> {
  const res = await fetch(`${API_BASE}/match/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Match recalculation failed with status ${res.status}`);
  }

  return await res.json();
}

export async function submitHITLFeedback(feedback: FeedbackSubmission): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback),
  });

  if (!res.ok) {
    throw new Error(`Feedback submission failed with status ${res.status}`);
  }

  return await res.json();
}

export async function createRecoveryPassport(payload: CreatePassportInput): Promise<{
  success: boolean;
  message: string;
  passport: BatchRecoveryPassport;
}> {
  const res = await fetch(`${API_BASE}/passport/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || `Failed to create passport: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function generateDispatchManifest(payload: CreateDispatchInput): Promise<{
  success: boolean;
  message: string;
  manifest: RecoveryDispatchManifest;
}> {
  const res = await fetch(`${API_BASE}/dispatch/manifest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || `Failed to generate dispatch manifest: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function reconcileDockIntake(payload: ReconcileIntakeInput): Promise<{
  success: boolean;
  message: string;
  report: IntakeReconciliationReport;
}> {
  const res = await fetch(`${API_BASE}/reconciliation/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || `Failed to generate reconciliation report: HTTP ${res.status}`);
  }

  return await res.json();
}
