import React, { useEffect, useState } from 'react';
import { useRecyclensStore } from './store/useRecyclensStore.ts';
import { Navbar } from './components/layout/Navbar.tsx';
import { TopbarHUD } from './components/layout/TopbarHUD.tsx';
import { StepIndicator } from './components/common/StepIndicator.tsx';
import { LoadingHUD } from './components/common/LoadingHUD.tsx';

// Screen 1 Components
import { ImageDropzone } from './components/scan/ImageDropzone.tsx';
import { CameraCapture } from './components/scan/CameraCapture.tsx';
import { WeightLocationInputs } from './components/scan/WeightLocationInputs.tsx';
import { PresetSelector } from './components/scan/PresetSelector.tsx';

// Screen 2 Components
import { RecoveryProfileCard } from './components/profile/RecoveryProfileCard.tsx';
import { ContaminationGauge } from './components/profile/ContaminationGauge.tsx';
import { CompositionBreakdown } from './components/profile/CompositionBreakdown.tsx';
import { VisualReasoningBox } from './components/profile/VisualReasoningBox.tsx';
import { HITLVerifyModal } from './components/profile/HITLVerifyModal.tsx';

// Screen 3 Components
import { ValuationCard } from './components/valuation/ValuationCard.tsx';

// Screen 4 Components
import { RecyclerList } from './components/routing/RecyclerList.tsx';
import { ExplainableRadarModal } from './components/routing/ExplainableRadarModal.tsx';
import { DispatchModal } from './components/routing/DispatchModal.tsx';

import { Sparkles, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const {
    currentStep,
    setStep,
    currentImage,
    setImage,
    runAnalysis,
    isAnalyzing,
    analysisResult,
    error,
    initialize,
  } = useRecyclensStore();

  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleStartScan = () => {
    runAnalysis();
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 relative">
      {/* Background Cyber Grid */}
      <div className="fixed inset-0 hud-grid-pattern opacity-30 pointer-events-none" />

      {/* Top Navbar & Ticker */}
      <Navbar />
      <TopbarHUD />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10">
        {/* Step Indicator */}
        <StepIndicator />

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center space-x-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SCREEN 1: SCAN INGESTION HUD */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Image Ingestion (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <ImageDropzone onOpenLiveCamera={() => setIsCameraOpen(true)} />
              </div>

              {/* Right Column: Weight & Metadata Inputs (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <WeightLocationInputs />

                {/* Primary Action Button */}
                <button
                  type="button"
                  disabled={isAnalyzing || !currentImage}
                  onClick={handleStartScan}
                  className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base font-['Outfit'] flex items-center justify-center space-x-2 transition-all shadow-xl ${
                    currentImage
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-slate-800/60 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>
                    {isAnalyzing
                      ? 'Analyzing Material Spectrum...'
                      : currentImage
                      ? 'Run Material Recovery Intelligence'
                      : 'Upload or Select a Test Image to Scan'}
                  </span>
                  {currentImage && !isAnalyzing && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 1-Click Test Scenarios Suite */}
            <PresetSelector />
          </div>
        )}

        {/* SCREEN 2: UNDERSTAND (AI RECOVERY PROFILE) */}
        {currentStep === 2 && analysisResult && (
          <div className="space-y-6 animate-fade-in">
            {/* Primary Profile Card */}
            <RecoveryProfileCard />

            {/* Detail Grid: Contamination, Composition, Reasoning */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ContaminationGauge
                contamination={analysisResult.recovery_profile.contamination}
                contaminationEvidence={analysisResult.recovery_profile.contamination_evidence}
              />
              <CompositionBreakdown secondaryMaterials={analysisResult.recovery_profile.secondary_materials} />
              <VisualReasoningBox
                recoverability={analysisResult.recovery_profile.recoverability}
                recommendedPreparation={analysisResult.recovery_profile.recommended_preparation}
              />
            </div>

            {/* Screen Navigation Footer */}
            <div className="p-4 rounded-2xl hud-glass border border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center space-x-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Scan HUD</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-transform hover:scale-105"
              >
                <span>Calculate Recovery Scrap Value</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: VALUE (SCRAP YIELD ESTIMATOR) */}
        {currentStep === 3 && analysisResult && (
          <div className="space-y-6 animate-fade-in">
            <ValuationCard />

            {/* Navigation Footer */}
            <div className="p-4 rounded-2xl hud-glass border border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center space-x-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to AI Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-transform hover:scale-105"
              >
                <span>Find Matched Recyclers</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: RECOVER (RECYCLER MATCHING & ROUTE) */}
        {currentStep === 4 && analysisResult && (
          <div className="space-y-6 animate-fade-in">
            <RecyclerList />

            {/* Navigation Footer */}
            <div className="p-4 rounded-2xl hud-glass border border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center space-x-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Valuation</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs sm:text-sm font-semibold border border-slate-700 flex items-center space-x-2"
              >
                <span>Scan Another Batch</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Modals & Overlays */}
      <LoadingHUD />

      {isCameraOpen && (
        <CameraCapture
          onCapture={(dataUrl) => setImage(dataUrl)}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      <HITLVerifyModal />
      <ExplainableRadarModal />
      <DispatchModal />

      {/* Industrial Footer */}
      <footer className="w-full bg-[#060910] border-t border-hud-border/40 py-6 px-4 mt-12 z-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300 font-['Outfit']">RecycLens</span>
            <span>— Material Recovery Intelligence Engine</span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>SCAN → UNDERSTAND → VALUE → RECOVER</span>
            <span>•</span>
            <span className="text-emerald-400">CPCB & MRF Standards</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
