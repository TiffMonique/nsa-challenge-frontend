"use client";

import React, { useState } from 'react';
import { PageHeader } from './page-header';
import { PageFooter } from './page-footer';
import { FileUploader } from './file-uploader';
import { PlanetVisualization } from './planet-visualization';
import { ResultsModal } from './results-modal';
import type { AnalysisStatus, ExoplanetData, AnalysisResult } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Removed AI dependencies - using local API instead

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

    // Log parsed content to console
    console.log('Datos parseados para análisis:', JSON.stringify(exoplanetData, null, 2));

    // Transform to API payload format and log
    const apiPayload = {
      stellar_data: {
        pl_orbper: exoplanetData.pl_orbper || 0,
        pl_trandurh: exoplanetData.pl_trandurh || 0,
        pl_trandep: exoplanetData.pl_trandep || 0,
        pl_rade: exoplanetData.pl_rade || 0,
        pl_insol: exoplanetData.pl_insol || 0,
        pl_eqt: exoplanetData.pl_eqt || 0,
        st_tmag: exoplanetData.st_tmag || 0,
        st_teff: exoplanetData.st_teff || 0,
        st_logg: exoplanetData.st_logg || 0,
        st_rad: exoplanetData.st_rad || 0
      }
    };
    console.log('API Payload para enviar:', JSON.stringify(apiPayload, null, 2));

    setAnalysisStatus('analyzing');
    setIsModalOpen(false);

    try {
      // Mock API response (replace with actual API call when ready)
      const USE_MOCK_API = false; // Set to true to use mock data

      let apiResponse;

      if (USE_MOCK_API) {
        // Simulate API processing time for mock
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Simulate API response matching real API format
        const isConfirmed = exoplanetData.koi_disposition === 'CONFIRMED';
        const accuracyPercentage = isConfirmed
          ? 85 + Math.random() * 14.96
          : 85 + Math.random() * 14.96;
        const exoplanetProbability = isConfirmed
          ? 85 + Math.random() * 15
          : Math.random() * 15;

        apiResponse = {
          message: "Exoplanet classification completed",
          stellar_object_data: {
            pl_orbper: exoplanetData.pl_orbper || 0,
            pl_trandurh: exoplanetData.pl_trandurh || 0,
            pl_trandep: exoplanetData.pl_trandep || 0,
            pl_rade: exoplanetData.pl_rade || 0,
            pl_insol: exoplanetData.pl_insol || 0,
            pl_eqt: exoplanetData.pl_eqt || 0,
            st_tmag: exoplanetData.st_tmag || 0,
            st_teff: exoplanetData.st_teff || 0,
            st_logg: exoplanetData.st_logg || 0,
            st_rad: exoplanetData.st_rad || 0
          },
          classification_result: {
            is_exoplanet: isConfirmed,
            classification: isConfirmed ? "EXOPLANET" : "NOT_EXOPLANET",
            confidence_level: accuracyPercentage > 95 ? "VERY_HIGH" : accuracyPercentage > 85 ? "HIGH" : "MEDIUM",
            accuracy_percentage: parseFloat(accuracyPercentage.toFixed(2)),
            exoplanet_probability_percentage: parseFloat(exoplanetProbability.toFixed(2)),
            non_exoplanet_probability_percentage: parseFloat((100 - exoplanetProbability).toFixed(2)),
            prediction_summary: {
              result: isConfirmed ? "EXOPLANET" : "NOT_EXOPLANET",
              confidence: accuracyPercentage > 95 ? "VERY_HIGH" : accuracyPercentage > 85 ? "HIGH" : "MEDIUM",
              accuracy: `${accuracyPercentage.toFixed(2)}%`
            }
          },
          model_accuracy_percentage: 82.4
        };
        console.log('Mock API Response:', apiResponse);
      } else {
        // Real API call (uncomment when ready)
        const response = await fetch('http://localhost:8000/exoplanet/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiPayload),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        apiResponse = await response.json();
        console.log('API Response:', apiResponse);
      }

      // Process API response - new format
      const classificationResult = apiResponse.classification_result;
      const isExoplanet = classificationResult.is_exoplanet;
      const status: 'confirmed' | 'false_positive' = isExoplanet ? 'confirmed' : 'false_positive';
      const confidence = classificationResult.accuracy_percentage || 0;

      const newResult: AnalysisResult = {
        status,
        confidence,
        planetName: exoplanetData.kepler_name || exoplanetData.kepoi_name || 'Unknown',
        data: exoplanetData,
        apiResponse: apiResponse, // Store full API response
      };

      setAnalysisResult(newResult);
      setAnalysisStatus(status);
      setIsModalOpen(true);

      toast({
        title: 'Análisis completado',
        description: `Resultado: ${classificationResult.classification} - ${classificationResult.confidence_level} (${confidence.toFixed(2)}% accuracy)`,
      });

    } catch (error) {
      console.error("Error calling prediction API:", error);
      setAnalysisStatus('initial');
      toast({
        variant: 'destructive',
        title: 'Error de API',
        description: error instanceof Error ? error.message : 'Error desconocido al llamar a la API de predicción.',
      });
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
