import { create } from 'zustand';
import {
  ScanAnalysisResponse,
  PresetScenario,
  RecyclerMatch,
  FeedbackSubmission,
} from '../types/recyclens.types.ts';
import {
  analyzeWasteScan,
  fetchPresets,
  checkServerHealth,
  recalculateMatch,
  submitHITLFeedback,
} from '../utils/api.ts';
import confetti from 'canvas-confetti';

interface RecyclensState {
  currentStep: 1 | 2 | 3 | 4;
  currentImage: string | null;
  selectedPreset: PresetScenario | null;
  weightKg: number;
  userLocation: { lat: number; lng: number; label: string };
  isAnalyzing: boolean;
  analysisStage: string;
  analysisResult: ScanAnalysisResponse | null;
  selectedRecyclerForRadar: RecyclerMatch | null;
  selectedRecyclerForDispatch: RecyclerMatch | null;
  selectedScenarioId: string | null;
  isHITLModalOpen: boolean;
  presets: PresetScenario[];
  serverHealth: { status: string; ai_vision_configured: boolean; version: string } | null;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setImage: (imageData: string | null) => void;
  setWeightKg: (weight: number) => void;
  setUserLocation: (loc: { lat: number; lng: number; label: string }) => void;
  selectPreset: (preset: PresetScenario) => void;
  setSelectedScenarioId: (id: string | null) => void;
  runAnalysis: (overrideImage?: string, overridePresetId?: string) => Promise<void>;
  recalculateWithCustomInputs: (weight: number, contam: number, materialCode: string) => Promise<void>;
  openRadarModal: (match: RecyclerMatch) => void;
  closeRadarModal: () => void;
  openDispatchModal: (match: RecyclerMatch) => void;
  closeDispatchModal: () => void;
  openHITLModal: () => void;
  closeHITLModal: () => void;
  submitFeedback: (data: Omit<FeedbackSubmission, 'scan_id'>) => Promise<void>;
  resetToScan: () => void;
}

export const useRecyclensStore = create<RecyclensState>((set, get) => ({
  currentStep: 1,
  currentImage: null,
  selectedPreset: null,
  weightKg: 15.0,
  userLocation: { lat: 19.076, lng: 72.8777, label: 'Demo Default Location (Mumbai MMR)' },
  isAnalyzing: false,
  analysisStage: '',
  analysisResult: null,
  selectedRecyclerForRadar: null,
  selectedRecyclerForDispatch: null,
  selectedScenarioId: null,
  isHITLModalOpen: false,
  presets: [],
  serverHealth: null,
  error: null,

  initialize: async () => {
    try {
      const [health, presetList] = await Promise.all([
        checkServerHealth(),
        fetchPresets(),
      ]);
      set({ serverHealth: health, presets: presetList });
    } catch (err) {
      console.warn('Init error:', err);
    }
  },

  setStep: (step) => set({ currentStep: step }),

  setImage: (imageData) => set({ currentImage: imageData, selectedPreset: null, error: null }),

  setWeightKg: (weight) => {
    set({ weightKg: weight });
    const { analysisResult } = get();
    if (analysisResult) {
      get().recalculateWithCustomInputs(
        weight,
        analysisResult.recovery_profile.contamination.percentage,
        analysisResult.recovery_profile.primary_material.code
      );
    }
  },

  setUserLocation: (loc) => set({ userLocation: loc }),

  selectPreset: (preset) => {
    set({
      selectedPreset: preset,
      currentImage: preset.image_url,
      weightKg: preset.default_weight_kg,
      userLocation: preset.location,
      error: null,
    });
  },

  runAnalysis: async (overrideImage, overridePresetId) => {
    const { currentImage, selectedPreset, weightKg, userLocation } = get();
    const imageToAnalyze = overrideImage || currentImage;
    const presetIdToAnalyze = overridePresetId || selectedPreset?.id;

    if (!imageToAnalyze && !presetIdToAnalyze) {
      set({ error: 'Please upload an image or choose a demo preset to begin scanning.' });
      return;
    }

    set({ isAnalyzing: true, error: null, analysisStage: 'Initializing Vision Pipeline...' });

    try {
      // Animated telemetry stages for rich user experience
      setTimeout(() => set({ analysisStage: 'Scanning Pixel Structure & Textures...' }), 300);
      setTimeout(() => set({ analysisStage: 'Deconstructing Polymer Composition & Contaminants...' }), 700);
      setTimeout(() => set({ analysisStage: 'Calculating Indicative Recovery Yield & Scrap Value...' }), 1100);
      setTimeout(() => set({ analysisStage: 'Evaluating Recycler Route Eligibility & Compatibility...' }), 1500);

      const result = await analyzeWasteScan({
        image: imageToAnalyze || undefined,
        preset_id: presetIdToAnalyze || undefined,
        weight_kg: weightKg,
        location: userLocation,
      });

      // Small delay for smooth visual transition
      await new Promise((resolve) => setTimeout(resolve, 1800));

      set({
        analysisResult: result,
        currentStep: 2,
        isAnalyzing: false,
        analysisStage: '',
      });

      // Trigger celebratory confetti on high recoverability
      if (result.recovery_profile.recoverability.score >= 80) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10B981', '#06B6D4', '#34D399'],
        });
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      set({
        isAnalyzing: false,
        error: err?.message || 'Failed to complete material analysis. Please try again.',
      });
    }
  },

  setSelectedScenarioId: (id) => set({ selectedScenarioId: id }),

  recalculateWithCustomInputs: async (weight, contam, materialCode) => {
    const { analysisResult, userLocation } = get();
    if (!analysisResult) return;

    try {
      const updated = await recalculateMatch({
        material_code: materialCode,
        weight_kg: weight,
        contamination_percentage: contam,
        quality_grade: analysisResult.recovery_profile.recoverability.grade,
        location: userLocation,
        composition: analysisResult.recovery_profile.composition,
        recovery_profile: analysisResult.recovery_profile,
      });

      set({
        analysisResult: {
          ...analysisResult,
          valuation: updated.valuation,
          matches: updated.matches,
          eligible_matches: updated.eligible_matches || updated.matches.filter((m: RecyclerMatch) => m.is_eligible),
          incompatible_matches: updated.incompatible_matches || updated.matches.filter((m: RecyclerMatch) => !m.is_eligible),
          split_routes: updated.split_routes || analysisResult.split_routes,
          optimization_scenarios: updated.optimization_scenarios || analysisResult.optimization_scenarios,
          optimization_comparison: updated.optimization_comparison || analysisResult.optimization_comparison,
        },
      });
    } catch (err) {
      console.error('Recalculation error:', err);
    }
  },

  openRadarModal: (match) => set({ selectedRecyclerForRadar: match }),
  closeRadarModal: () => set({ selectedRecyclerForRadar: null }),

  openDispatchModal: (match) => set({ selectedRecyclerForDispatch: match }),
  closeDispatchModal: () => set({ selectedRecyclerForDispatch: null }),

  openHITLModal: () => set({ isHITLModalOpen: true }),
  closeHITLModal: () => set({ isHITLModalOpen: false }),

  submitFeedback: async (feedbackData) => {
    const { analysisResult } = get();
    if (!analysisResult) return;

    await submitHITLFeedback({
      scan_id: analysisResult.scan_id,
      ...feedbackData,
    });

    // If user changed material code, dynamically update the profile
    if (feedbackData.corrected_material_code) {
      const newCode = feedbackData.corrected_material_code;
      const weight = feedbackData.actual_measured_weight_kg || analysisResult.valuation.batch_weight_kg;
      const contam = analysisResult.recovery_profile.contamination.percentage;

      await get().recalculateWithCustomInputs(weight, contam, newCode);
    }

    set({ isHITLModalOpen: false });
  },

  resetToScan: () =>
    set({
      currentStep: 1,
      currentImage: null,
      selectedPreset: null,
      analysisResult: null,
      error: null,
    }),
}));
