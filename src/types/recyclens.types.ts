// RecycLens Core Domain Types

export type MaterialCategory = 'PLASTIC' | 'PAPER' | 'METAL' | 'GLASS' | 'EWASTE' | 'TEXTILE' | 'ORGANIC' | 'OTHER';

export type QualityGrade = 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'REJECT';

export type ContaminationSeverity = 'CLEAN' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface SecondaryMaterial {
  name: string;
  percentage: number;
  separable: boolean;
  notes?: string;
}

export interface ContaminationInfo {
  percentage: number;
  type: string;
  severity: ContaminationSeverity;
  explanation: string;
  visual_indicators: string[];
}

export interface RecoverabilityInfo {
  score: number; // 0 to 100
  grade: QualityGrade;
  is_commercially_viable: boolean;
  actionable_advice: string;
  potential_applications: string[];
}

export interface DetectedMaterial {
  code: string;
  name: string;
  category: MaterialCategory;
  confidence: number; // 0 to 100 (Model visual estimate, not calibrated probability)
  polymer_subtype?: string; // e.g. "PET (Type 1)", "HDPE (Type 2)"
}

export interface RecoveryProfile {
  id: string;
  scan_id: string;
  primary_material: DetectedMaterial;
  secondary_materials: SecondaryMaterial[];
  contamination: ContaminationInfo;
  recoverability: RecoverabilityInfo;
  visual_explanation: string;
  visual_evidence?: string[]; // Concise visual observations directly visible in image
  contamination_evidence?: string[]; // Visual cues supporting contamination severity assessment
  uncertainty?: string[]; // Explicit limitations & unconfirmed physical/chemical variables
  recommended_preparation?: string[]; // Practical pre-dispatch preparation steps
  model_name: string;
  is_fallback_inference: boolean;
  timestamp: string;
}

export interface MaterialRate {
  id: string;
  material_code: string;
  display_name: string;
  category: MaterialCategory;
  rate_min: number; // in ₹/kg
  rate_max: number; // in ₹/kg
  unit: string; // 'kg'
  contamination_penalty_factor: number; // 0.0 to 1.0 (sensitivity multiplier)
  region: string;
  data_source_type: 'CONFIGURED_DEMO' | 'MARKET_SURVEY' | 'VERIFIED_TRANSACTIONS';
  source_label: string;
  last_updated: string;
}

export interface ValuationBreakdown {
  currency: string;
  currency_symbol: string;
  batch_weight_kg: number;
  is_user_specified_weight: boolean;
  base_rate_range: {
    min: number;
    max: number;
    unit: string;
  };
  clean_batch_benchmark: number; // Gross value if 100% clean
  contamination_penalty_amount: number; // Monetary deduction due to contamination
  quality_grade_adjustment: number; // Value multiplier from quality grade
  indicative_net_range: {
    min: number;
    max: number;
  };
  price_disclaimer: string;
  data_source_label: string;
  is_estimate: boolean;
}

export interface MatchScorecard {
  material_compatibility: number; // 0-100 (Weight: 35%)
  quantity_compatibility: number; // 0-100 (Weight: 20%)
  contamination_tolerance: number; // 0-100 (Weight: 15%)
  distance_score: number; // 0-100 (Weight: 15%)
  pickup_availability: number; // 0-100 (Weight: 10%)
  verification_score: number; // 0-100 (Weight: 5%)
}

export interface RecyclerPartner {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  address: string;
  location: {
    lat: number;
    lng: number;
    city: string;
  };
  accepted_materials: string[]; // array of material_code
  min_batch_weight_kg: number;
  max_contamination_tolerance: number; // max % contamination accepted
  pickup_available: boolean;
  service_radius_km: number;
  verification_status: 'DEMO_ARCHETYPE' | 'SIMULATION_FACILITY' | 'CONFIGURED_LISTING';
  indicative_payout_multiplier: number; // e.g. 1.05 = pays 5% above baseline for clean bulk
  contact_phone: string;
  contact_email: string;
  rating: number; // 0.0 to 5.0
  operating_hours: string;
}

export interface RecyclerMatch {
  recycler: RecyclerPartner;
  is_eligible: boolean; // Must accept material and meet baseline intake constraints
  total_score: number; // 0-100
  scorecard: MatchScorecard;
  distance_km: number;
  estimated_payout_range: {
    min: number;
    max: number;
  };
  pickup_offered: boolean;
  match_reasons: string[];
  warnings?: string[];
}

export interface ScanAnalysisResponse {
  scan_id: string;
  image_url: string;
  recovery_profile: RecoveryProfile;
  valuation: ValuationBreakdown;
  matches: RecyclerMatch[];
  eligible_matches: RecyclerMatch[];
  incompatible_matches: RecyclerMatch[];
  telemetry: {
    processing_time_ms: number;
    ai_engine: string;
    is_offline_fallback: boolean;
  };
}

export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  category: MaterialCategory;
  image_url: string;
  default_weight_kg: number;
  location: {
    lat: number;
    lng: number;
    label: string;
  };
  description: string;
  expected_material: string;
  expected_contamination: string;
}

export interface FeedbackSubmission {
  scan_id: string;
  corrected_material_code?: string;
  actual_measured_weight_kg?: number;
  actual_realized_rate?: number;
  user_notes?: string;
  contact_email?: string;
}
