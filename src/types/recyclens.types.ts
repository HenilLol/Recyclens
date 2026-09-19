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

export interface BatchComponent {
  material: string;
  material_code: string;
  category: MaterialCategory;
  estimated_share_percent: number; // 1 to 100 visual estimate
  confidence: number; // 0 to 100 model visual confidence
  polymer_subtype?: string;
  visual_evidence: string[];
  contamination_percent: number; // 0 to 100
  recoverability_score: number; // 0 to 100
  recoverability_grade: QualityGrade;
  is_separable: boolean;
  preparation_actions: string[];
  uncertainty: string[];
}

export interface UnresolvedFraction {
  estimated_share_percent: number; // Unresolved / visually ambiguous portion
  visual_reason: string; // Factual visual reason why portion cannot be identified
}

export interface RecoveryDecision {
  batch_archetype: string; // e.g. "Mixed Post-Consumer Packaging"
  condition_summary: string;
  recommended_action: string;
  economic_effect: string;
  routing_strategy: 'SINGLE_FACILITY' | 'SPLIT_ROUTING' | 'SPECIALIZED_DISPOSAL';
  routing_rationale: string;
}

export interface ComponentValuation {
  material_code: string;
  material_name: string;
  estimated_share_percent: number; // Estimated visual surface area share
  allocated_weight_kg: number; // Illustrative mass allocation based on visual share projection
  illustrative_weight_kg: number; // Explicitly named alias for scientific clarity
  weight_allocation_basis: 'ILLUSTRATIVE_VISUAL_PROJECTION';
  allocation_disclosure: string; // Scientific honesty disclosure: visual share != physical mass
  base_rate_range: {
    min: number;
    max: number;
  };
  clean_benchmark: number;
  contamination_penalty: number;
  indicative_net_range: {
    min: number;
    max: number;
  };
  notes: string;
}

export interface SplitRouteRecommendation {
  material_code: string;
  material_name: string;
  allocated_weight_kg: number; // Illustrative projected channel mass
  illustrative_weight_kg: number; // Explicit alias for clarity
  is_provisional: boolean; // true — route is provisional until physical segregation & weighment
  routing_status: 'PROVISIONAL_SPLIT_ROUTE';
  quantity_basis_disclosure: string; // Disclosure that channel weight is projected from visual share
  suggested_recycler_id?: string;
  suggested_recycler_name?: string;
  target_facility_type: string;
  estimated_payout_range: {
    min: number;
    max: number;
  };
  preparation_required: string[];
}

export interface RecoveryProfile {
  id: string;
  scan_id: string;
  primary_material: DetectedMaterial;
  secondary_materials: SecondaryMaterial[];
  composition: BatchComponent[]; // Phase 3 multi-material breakdown
  unresolved_fraction?: UnresolvedFraction; // Remainder if composition < 100%
  recovery_decision?: RecoveryDecision; // Synthesized operational dispatch decision
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
  component_valuations?: ComponentValuation[]; // Multi-material component weight & benchmark breakdown
  unresolved_economic_impact?: string; // Disclosure of economic impact from unresolved fraction
  valuation_methodology?: string; // Explicit disclosure of visual-share projection methodology
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

export type DataOrigin = 'OBSERVED' | 'MODEL_ESTIMATED' | 'USER_CONFIRMED' | 'SCENARIO_PROJECTED';

export type ScenarioType = 'MINIMAL_PREPARATION' | 'RECOMMENDED_PREPARATION' | 'MAXIMUM_SEPARATION';

export type EffortLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type RoutingEffectStrategy =
  | 'NO_ROUTE_CHANGE'
  | 'SINGLE_FACILITY_PREFERRED'
  | 'SPLIT_ROUTING_RECOMMENDED'
  | 'SPECIALIZED_DISPOSAL_REQUIRED';

export interface PreparationActionEvidence {
  action_id: string;
  title: string;
  observed_basis: string; // What visual feature or indicator was detected
  rationale: string; // Engineering justification for why action improves recovery
  scenario_assumption: string; // Explicit modeled condition (e.g. "Assumes visible liquid residue is successfully drained")
  modeled_effect: string; // Projected quantifiable outcome
  uncertainty: string; // Factual limitations & what remains unmeasured
  affected_material_codes: string[];
}

export interface ScenarioCurrentStateReference {
  data_origin: 'OBSERVED' | 'MODEL_ESTIMATED' | 'USER_CONFIRMED';
  contamination_percentage: number;
  recoverability_score: number;
  recoverability_grade: QualityGrade;
  indicative_net_range: {
    min: number;
    max: number;
  };
  weight_kg: number;
  weight_basis: 'ILLUSTRATIVE_VISUAL_PROJECTION' | 'USER_CONFIRMED_SCALE_WEIGHMENT';
}

export interface ScenarioModeledState {
  data_origin: 'SCENARIO_PROJECTED';
  projected_contamination_percentage: number; // e.g. ~4.0%
  projected_recoverability_score: number; // e.g. ~92.0
  projected_recoverability_grade: QualityGrade; // e.g. GRADE_A
  projected_clean_benchmark: number;
  projected_contamination_penalty: number;
  projected_indicative_net_range: {
    min: number;
    max: number;
  };
  projected_component_valuations?: ComponentValuation[];
}

export interface ScenarioModelingCoefficients {
  contamination_reduction_coefficient: number; // Relative reduction factor (e.g. 0.65)
  recoverability_headroom_coefficient: number; // Headroom capture factor (e.g. 0.55)
  coefficient_basis: 'ILLUSTRATIVE_SCENARIO_ASSUMPTION';
  contamination_floor: number; // Floor bound to prevent false-zero claims (2.0%)
  recoverability_ceiling: number; // Ceiling bound to prevent false-perfection claims (98.0)
  action_suppression_heuristic: number; // Heuristic threshold below which generic decontamination is suppressed (5.0%)
}

export interface OptimizationScenario {
  scenario_id: string;
  scenario_type: ScenarioType;
  title: string;
  description: string;
  effort_level: EffortLevel;
  actions: PreparationActionEvidence[];
  affected_material_codes: string[];
  modeling_coefficients: ScenarioModelingCoefficients;
  current_state_reference: ScenarioCurrentStateReference;
  modeled_state: ScenarioModeledState;
  assumptions: string[];
  uncertainties: string[];
  evidence_basis: string[];
  economic_effect: string;
  routing_effect: {
    strategy: RoutingEffectStrategy;
    rationale: string;
  };
  is_scenario_projection: true;
  is_fallback_demo?: boolean;
}

export interface ScenarioMetricComparison {
  metric: string;
  current_value_label: string;
  minimal_value_label?: string;
  recommended_value_label?: string;
  maximum_value_label?: string;
  unit?: string;
  interpretation: string;
}

export interface OptimizationComparison {
  current_state_summary: {
    data_origin: 'OBSERVED' | 'MODEL_ESTIMATED' | 'USER_CONFIRMED';
    contamination_label: string;
    recoverability_label: string;
    net_realization_label: string;
    routing_label: string;
  };
  comparisons: ScenarioMetricComparison[];
  modeling_disclosure: string;
}

export interface ScanAnalysisResponse {
  scan_id: string;
  image_url: string;
  recovery_profile: RecoveryProfile;
  valuation: ValuationBreakdown;
  matches: RecyclerMatch[];
  eligible_matches: RecyclerMatch[];
  incompatible_matches: RecyclerMatch[];
  split_routes?: SplitRouteRecommendation[]; // Multi-material split route routing
  optimization_scenarios?: OptimizationScenario[]; // Phase 4 deterministic what-if scenarios
  optimization_comparison?: OptimizationComparison; // Phase 4 scenario comparison matrix
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
  preparation_completed_status?: 'NOT_PREPARED' | 'PARTIALLY_PREPARED' | 'FULLY_PREPARED';
  operator_observed_contamination_percent?: number;
  user_notes?: string;
  contact_email?: string;
}

// ==================================================
// PHASE 5.1 — RECOVERY PASSPORT DOMAIN FOUNDATION
// ==================================================

export type WeightProvenance = 'USER_CONFIRMED_SCALE_WEIGHMENT' | 'ILLUSTRATIVE_VISUAL_PROJECTION';

export type PassportVerificationStatus =
  | 'UNVERIFIED'
  | 'OPERATOR_DECLARED_VERIFIED'
  | 'OPERATOR_VERIFIED';

export type PassportRoutingStatus = 'PLANNED' | 'PROVISIONAL' | 'RECOMMENDED';

export type PassportScenarioSelectedStatus = 'SELECTED_FOR_PASSPORT' | 'COMMITTED';

export interface PassportEvidenceSnapshot {
  primary_material: DetectedMaterial;
  composition: BatchComponent[];
  unresolved_fraction?: UnresolvedFraction;
  contamination: ContaminationInfo;
  recoverability: RecoverabilityInfo;
  visual_evidence: string[];
  contamination_evidence: string[];
  uncertainty: string[];
  visual_explanation: string;
  batch_weight_kg: number;
  weight_provenance: WeightProvenance;
  model_name: string;
  is_fallback_inference: boolean;
  captured_at: string;
}

export interface PassportVerificationSnapshot {
  verification_status: PassportVerificationStatus;
  verified_at?: string;
  confirmed_weight_kg?: number;
  confirmed_weight_provenance?: 'USER_CONFIRMED_SCALE_WEIGHMENT';
  material_corrections?: string;
  contamination_corrections?: number;
  preparation_confirmation?: 'NOT_PREPARED' | 'PARTIALLY_PREPARED' | 'FULLY_PREPARED';
  user_notes?: string;
  verification_disclosure?: string;
}

export interface PassportScenarioSnapshot {
  scenario_id: string;
  scenario_type: ScenarioType | 'NONE';
  title: string;
  selected_status: PassportScenarioSelectedStatus;
  effort_level: EffortLevel | 'NONE';
  modeled_contamination_percent: number;
  modeled_recoverability_score: number;
  modeled_recoverability_grade: QualityGrade;
  modeled_economic_result: {
    min: number;
    max: number;
    currency: string;
  };
  preparation_actions: PreparationActionEvidence[];
  scenario_assumptions: string[];
  coefficient_metadata?: ScenarioModelingCoefficients;
  scenario_disclosure: string;
}

export interface PassportRoutingSnapshot {
  routing_status: PassportRoutingStatus;
  selected_facility_id?: string;
  selected_facility_name?: string;
  route_type: 'SINGLE_FACILITY' | 'SPLIT_ROUTING' | 'SPECIALIZED_DISPOSAL';
  split_routes?: SplitRouteRecommendation[];
  routing_rationale: string;
  preparation_requirements: string[];
  indicative_payout_range: {
    min: number;
    max: number;
  };
}

export interface PassportIntegrity {
  algorithm: 'SHA-256';
  canonical_payload_hash: string;
  payload_version: string;
  hashed_fields: string[];
}

export interface BatchRecoveryPassport {
  passport_id: string; // Format: RCP-YYYY-<16 HEX CHARACTERS>
  scan_id: string;
  created_at: string; // ISO 8601
  schema_version: '1.0';
  evidence_snapshot: PassportEvidenceSnapshot;
  verification_snapshot: PassportVerificationSnapshot;
  scenario_snapshot: PassportScenarioSnapshot;
  routing_snapshot: PassportRoutingSnapshot;
  integrity: PassportIntegrity;
  snapshot_disclosure: string;
}

export interface CreatePassportInput {
  scan_id: string;
  recovery_profile: RecoveryProfile;
  weight_kg: number;
  weight_provenance: WeightProvenance;
  verification?: Partial<PassportVerificationSnapshot>;
  selected_scenario?: OptimizationScenario;
  selected_route?: {
    routing_status?: PassportRoutingStatus;
    selected_facility_id?: string;
    selected_facility_name?: string;
    route_type?: 'SINGLE_FACILITY' | 'SPLIT_ROUTING' | 'SPECIALIZED_DISPOSAL';
    split_routes?: SplitRouteRecommendation[];
    routing_rationale?: string;
    preparation_requirements?: string[];
    indicative_payout_range?: { min: number; max: number };
  };
}

// ==================================================
// PHASE 5.2 — SCENARIO-AWARE DISPATCH MANIFEST
// ==================================================

export interface DispatchChecklistItem {
  action_id: string;
  title: string;
  required: boolean;
  rationale: string;
  observed_basis?: string;
  completed?: boolean;
}

export interface DispatchMaterialFraction {
  material_code: string;
  name: string;
  category: MaterialCategory;
  estimated_share_percent: number;
  estimated_weight_kg: number;
}

export interface RecoveryDispatchManifest {
  manifest_id: string; // Format: DSP-YYYY-<16 HEX CHARACTERS>
  passport_id: string;
  scan_id: string;
  created_at: string; // ISO 8601
  selected_scenario_id: string;
  selected_scenario_type: ScenarioType | 'NONE';
  scenario_title: string;
  target_facility: {
    facility_id?: string;
    facility_name: string;
    route_type: 'SINGLE_FACILITY' | 'SPLIT_ROUTING' | 'SPECIALIZED_DISPOSAL';
    contact_phone?: string;
    address?: string;
  };
  material_breakdown: DispatchMaterialFraction[];
  batch_weight_kg: number;
  weight_provenance: WeightProvenance;
  preparation_checklist: DispatchChecklistItem[];
  handling_precautions: string[];
  modeled_expectations: {
    projected_contamination_percent: number;
    projected_recoverability_grade: QualityGrade;
    projected_indicative_net_range: {
      min: number;
      max: number;
      currency: string;
    };
  };
  dispatch_disclosure: string;
}

export interface CreateDispatchInput {
  passport: BatchRecoveryPassport;
  override_facility_id?: string;
  override_facility_name?: string;
  handling_notes?: string[];
}

// ==================================================
// PHASE 5.3 — DOCK INTAKE RECONCILIATION
// ==================================================

export interface FractionDisposition {
  material_code: string;
  material_name?: string;
  disposition_status: 'ACCEPTED' | 'REJECTED' | 'DOWNGRADED';
  weighed_weight_kg?: number;
  rejection_reason?: string;
}

export interface DockIntakeRecord {
  passport_id: string;
  manifest_id?: string;
  recorded_at: string; // ISO 8601
  actual_intake_weight_kg: number;
  weight_provenance: 'USER_CONFIRMED_SCALE_WEIGHMENT';
  operator_observed_contamination_percent: number;
  preparation_completion_status: 'NOT_PREPARED' | 'PARTIALLY_PREPARED' | 'FULLY_PREPARED';
  fraction_dispositions: FractionDisposition[];
  unexpected_materials?: string[];
  operator_notes?: string;
}

export interface WeightReconciliationResult {
  projected_weight_kg: number;
  projected_provenance: WeightProvenance;
  actual_intake_weight_kg: number;
  actual_provenance: 'USER_CONFIRMED_SCALE_WEIGHMENT';
  variance_kg: number;
  variance_percent: number;
  variance_category: 'MATCH' | 'SURPLUS' | 'DEFICIT';
  uncertainty_explanations: string[];
}

export interface QualityReconciliationResult {
  projected_contamination_percent: number;
  actual_contamination_percent: number;
  contamination_variance_points: number;
  preparation_expected: string;
  preparation_observed: 'NOT_PREPARED' | 'PARTIALLY_PREPARED' | 'FULLY_PREPARED';
  accepted_fractions_count: number;
  rejected_fractions_count: number;
  unexpected_materials_flagged: string[];
}

export interface EconomicReconciliationResult {
  projected_indicative_net_range: { min: number; max: number };
  realized_indicative_net_range: { min: number; max: number };
  variance_indicative_midpoint: number;
  currency: 'INR';
  economic_note: string;
}

export interface IntakeReconciliationReport {
  reconciliation_id: string; // Format: REC-YYYY-<16 HEX CHARACTERS>
  passport_id: string;
  manifest_id?: string;
  reconciled_at: string; // ISO 8601
  passport_integrity_status: {
    is_valid: boolean;
    details: string;
  };
  weight_reconciliation: WeightReconciliationResult;
  quality_reconciliation: QualityReconciliationResult;
  economic_reconciliation: EconomicReconciliationResult;
  reconciliation_disclosure: string;
}

export interface ReconcileIntakeInput {
  passport: BatchRecoveryPassport;
  manifest?: RecoveryDispatchManifest;
  intake: DockIntakeRecord;
}
