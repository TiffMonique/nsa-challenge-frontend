"use client";

import React, { useState } from 'react';
import { PageHeader } from './page-header';
import { PageFooter } from './page-footer';
import { FileUploader } from './file-uploader';
import { PlanetVisualization } from './planet-visualization';
import { ResultsModal } from './results-modal';
import type { AnalysisStatus, ExoplanetData, AnalysisResult } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { suggestSimilarExoplanets } from '@/ai/flows/suggest-similar-exoplanets';
import { summarizeValidationSuggestions } from '@/ai/flows/summarize-validation-suggestions';

export function ExoAiExplorer() {
  const [exoplanetData, setExoplanetData] = useState<ExoplanetData | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('initial');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleDataLoaded = (data: ExoplanetData) => {
    setExoplanetData(data);
    setAnalysisStatus('initial');
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    if (!exoplanetData) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No hay datos para analizar. Por favor, carga un archivo.',
      });
      return;
    }

    setAnalysisStatus('analyzing');
    setIsModalOpen(false);

    // Simulate ML model processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // --- Placeholder ML Logic ---
    // In a real app, you would run your TensorFlow.js model here.
    // We simulate the output based on koi_disposition and koi_score.
    const isConfirmedSimulated = exoplanetData.koi_disposition === 'CONFIRMED' || (exoplanetData.koi_score ?? 0) > 0.9;
    const confidence = isConfirmedSimulated ? 80 + Math.random() * 20 : 10 + Math.random() * 40;
    const status: 'confirmed' | 'false_positive' = isConfirmedSimulated ? 'confirmed' : 'false_positive';
    
    const newResult: AnalysisResult = {
        status,
        confidence,
        planetName: exoplanetData.kepler_name || exoplanetData.kepoi_name,
        data: exoplanetData,
    };

    setAnalysisResult(newResult);
    setAnalysisStatus(status);
    setIsModalOpen(true);

    // Call GenAI flows after showing initial result
    if (status === 'confirmed') {
        try {
            const aiResponse = await suggestSimilarExoplanets({
                planetName: exoplanetData.kepler_name || exoplanetData.kepoi_name,
                planetRadius: exoplanetData.koi_prad,
                orbitalPeriod: exoplanetData.koi_period,
                stellarTemperature: exoplanetData.koi_steff || 0,
            });
            setAnalysisResult(prev => prev ? { ...prev, similarTo: aiResponse.similarExoplanets[0] || 'N/A' } : null);
        } catch (error) {
            console.error("Error fetching similar exoplanets:", error);
        }
    } else {
        const mockIssues = [
            { title: "SNR muy bajo", value: `${exoplanetData.koi_model_snr}`, recommendation: "Mínimo recomendado: > 7.1" },
            { title: "Profundidad inconsistente", value: `Varió ${Math.random().toFixed(2)*100}%`, recommendation: "Verificar datos de tránsito" }
        ];
        newResult.issues = mockIssues;
        setAnalysisResult(prev => prev ? { ...prev, issues: mockIssues } : null);
        try {
            const validationText = mockIssues.map(i => `${i.title} (${i.value}): ${i.recommendation}`).join('\n');
            const summaryResponse = await summarizeValidationSuggestions({ validationSuggestions: validationText });
            setAnalysisResult(prev => prev ? { ...prev, suggestionsSummary: summaryResponse.summary } : null);
        } catch (error) {
            console.error("Error summarizing suggestions:", error);
        }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      <PageHeader />
      <main className="flex-grow flex flex-col lg:flex-row items-center justify-center pt-20 pb-16">
        <div className="w-full lg:w-2/5 h-full">
          <FileUploader
            onDataLoaded={handleDataLoaded}
            onAnalyze={handleAnalyze}
            isDataLoaded={!!exoplanetData}
            isAnalyzing={analysisStatus === 'analyzing'}
          />
        </div>
        <div className="w-full lg:w-3/5 h-[50vh] lg:h-full">
          <PlanetVisualization 
            status={analysisStatus}
            data={exoplanetData}
            onPlanetClick={() => analysisResult && setIsModalOpen(true)}
          />
        </div>
      </main>
      <PageFooter />
      {analysisResult && (
        <ResultsModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          result={analysisResult}
        />
      )}
    </div>
  );
}
