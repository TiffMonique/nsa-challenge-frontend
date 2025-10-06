"use client";

import { useState, useCallback, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import { UploadCloud, FileCheck2, List, Loader2, Star, Orbit, Thermometer, Telescope, Signal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sampleData } from '@/lib/sample-data';
import type { ExoplanetData } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface FileUploaderProps {
  onDataLoaded: (data: ExoplanetData) => void;
  onAnalyze: () => void;
  isDataLoaded: boolean;
  isAnalyzing: boolean;
}

// Transform CSV data to API payload format
const transformToApiPayload = (data: any) => {
  return {
    stellar_data: {
      pl_orbper: data.pl_orbper || 0,
      pl_trandurh: data.pl_trandurh || 0,
      pl_trandep: data.pl_trandep || 0,
      pl_rade: data.pl_rade || 0,
      pl_insol: data.pl_insol || 0,
      pl_eqt: data.pl_eqt || 0,
      st_tmag: data.st_tmag || 0,
      st_teff: data.st_teff || 0,
      st_logg: data.st_logg || 0,
      st_rad: data.st_rad || 0
    }
  };
};

export function FileUploader({ onDataLoaded, onAnalyze, isDataLoaded, isAnalyzing }: FileUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<string>('');
  const [selectedRowData, setSelectedRowData] = useState<any>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const { toast } = useToast();

  const handleFileParse = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          throw new Error("El archivo está vacío o tiene un formato incorrecto.");
        }

        // Store all rows for dropdown selection
        setCsvRows(json);
        setSelectedRowIndex('0');

        const firstRow = json[0] as any;
        // Convert numeric strings to numbers
        const parsedFirstRow = {
          ...firstRow,
          pl_orbper: firstRow.pl_orbper ? parseFloat(firstRow.pl_orbper) : null,
          pl_trandurh: firstRow.pl_trandurh ? parseFloat(firstRow.pl_trandurh) : null,
          pl_trandep: firstRow.pl_trandep ? parseFloat(firstRow.pl_trandep) : null,
          pl_rade: firstRow.pl_rade ? parseFloat(firstRow.pl_rade) : null,
          pl_insol: firstRow.pl_insol ? parseFloat(firstRow.pl_insol) : null,
          pl_eqt: firstRow.pl_eqt ? parseFloat(firstRow.pl_eqt) : null,
          st_tmag: firstRow.st_tmag ? parseFloat(firstRow.st_tmag) : null,
          st_teff: firstRow.st_teff ? parseFloat(firstRow.st_teff) : null,
          st_logg: firstRow.st_logg ? parseFloat(firstRow.st_logg) : null,
          st_rad: firstRow.st_rad ? parseFloat(firstRow.st_rad) : null
        };

        setSelectedRowData(parsedFirstRow);
        onDataLoaded(parsedFirstRow as ExoplanetData);
        setFileName(file.name);
        toast({ title: "Éxito", description: `Archivo cargado con ${json.length} filas.` });

      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido al procesar el archivo.";
        toast({
          variant: 'destructive',
          title: 'Error de Archivo',
          description: message,
        });
        setFileName(null);
        setCsvRows([]);
        setSelectedRowIndex('');
      }
    };
    reader.readAsBinaryString(file);
  }, [onDataLoaded, toast]);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileParse(e.target.files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileParse(e.dataTransfer.files[0]);
    }
  };

  const handleUseSampleData = () => {
    // For simplicity, we'll use the first sample data entry.
    // A more complex implementation could involve a dropdown to select which sample to use.
    onDataLoaded(sampleData[0]);
    setFileName("Datos de Ejemplo (Kepler-227 b)");
    toast({ title: "Datos de Ejemplo Cargados", description: "Listo para analizar Kepler-227 b." });
  };
  
  const handleUseSampleData2 = () => {
    onDataLoaded(sampleData[1]);
    setFileName("Datos de Ejemplo (Falso Positivo)");
    toast({ title: "Datos de Ejemplo Cargados", description: "Listo para analizar un candidato a falso positivo." });
  };

  const handleRowSelection = (value: string) => {
    setSelectedRowIndex(value);
    const rowIndex = parseInt(value);
    const selectedRow = csvRows[rowIndex];

    // Convert numeric strings to numbers
    const parsedRow = {
      ...selectedRow,
      pl_orbper: selectedRow.pl_orbper ? parseFloat(selectedRow.pl_orbper) : null,
      pl_trandurh: selectedRow.pl_trandurh ? parseFloat(selectedRow.pl_trandurh) : null,
      pl_trandep: selectedRow.pl_trandep ? parseFloat(selectedRow.pl_trandep) : null,
      pl_rade: selectedRow.pl_rade ? parseFloat(selectedRow.pl_rade) : null,
      pl_insol: selectedRow.pl_insol ? parseFloat(selectedRow.pl_insol) : null,
      pl_eqt: selectedRow.pl_eqt ? parseFloat(selectedRow.pl_eqt) : null,
      st_tmag: selectedRow.st_tmag ? parseFloat(selectedRow.st_tmag) : null,
      st_teff: selectedRow.st_teff ? parseFloat(selectedRow.st_teff) : null,
      st_logg: selectedRow.st_logg ? parseFloat(selectedRow.st_logg) : null,
      st_rad: selectedRow.st_rad ? parseFloat(selectedRow.st_rad) : null
    };

    setSelectedRowData(parsedRow);

    // Convert row to JSON and log to console
    console.log('Selected Row as JSON:', JSON.stringify(parsedRow, null, 2));

    // Transform and log API payload format
    const apiPayload = transformToApiPayload(parsedRow);
    console.log('API Payload:', JSON.stringify(apiPayload, null, 2));

    // Also load the data for analysis
    onDataLoaded(parsedRow as ExoplanetData);
  };

  const handleBatchAnalysis = async () => {
    if (csvRows.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No hay filas para analizar.',
      });
      return;
    }

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: csvRows.length });

    const results: any[] = [];
    const batchSize = 5; // Process 5 rows at a time
    const USE_MOCK_API = false; // Use same flag as single analysis

    try {
      for (let i = 0; i < csvRows.length; i += batchSize) {
        const batch = csvRows.slice(i, Math.min(i + batchSize, csvRows.length));

        // Process batch in parallel
        const batchPromises = batch.map(async (row, batchIndex) => {
          const globalIndex = i + batchIndex;
          const apiPayload = transformToApiPayload(row);

          try {
            let apiResponse;

            if (USE_MOCK_API) {
              // Mock response
              await new Promise(resolve => setTimeout(resolve, 500));
              const isConfirmed = row.koi_disposition === 'CONFIRMED';
              const accuracyPercentage = isConfirmed ? 85 + Math.random() * 14.96 : 85 + Math.random() * 14.96;
              const exoplanetProbability = isConfirmed ? 85 + Math.random() * 15 : Math.random() * 15;

              apiResponse = {
                message: "Exoplanet classification completed",
                stellar_object_data: apiPayload.stellar_data,
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
            } else {
              // Real API call
              const response = await fetch('http://localhost:8000/exoplanet/predict', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiPayload),
              });

              if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
              }

              apiResponse = await response.json();
            }

            return {
              row_index: globalIndex,
              planet_name: row.kepler_name || row.kepoi_name || `Row ${globalIndex + 1}`,
              input_data: row,
              api_response: apiResponse,
              success: true,
              timestamp: new Date().toISOString()
            };
          } catch (error) {
            return {
              row_index: globalIndex,
              planet_name: row.kepler_name || row.kepoi_name || `Row ${globalIndex + 1}`,
              input_data: row,
              error: error instanceof Error ? error.message : 'Unknown error',
              success: false,
              timestamp: new Date().toISOString()
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        setBatchProgress({ current: Math.min(i + batchSize, csvRows.length), total: csvRows.length });
      }

      // Generate and download CSV file
      const csvHeaders = [
        'planet_name',
        'kepoi_name',
        'ra',
        'dec',
        'pl_orbper',
        'pl_rade',
        'pl_insol',
        'pl_eqt',
        'st_teff',
        'st_rad',
        'st_dist',
        'classification',
        'is_confirmed',
        'accuracy_percentage',
        'confidence_level',
        'exoplanet_probability',
        'status'
      ];

      const outputCsvRows = [csvHeaders.join(',')];

      results.forEach(result => {
        if (result.success && result.api_response) {
          const classification = result.api_response.classification_result;
          const data = result.input_data;

          const row = [
            result.planet_name || '',
            data.kepoi_name || '',
            data.ra || 0,
            data.dec || 0,
            data.pl_orbper || 0,
            data.pl_rade || 0,
            data.pl_insol || 0,
            data.pl_eqt || 0,
            data.st_teff || 0,
            data.st_rad || 0,
            data.st_dist || 0,
            classification.classification || 'UNKNOWN',
            classification.is_exoplanet ? 'YES' : 'NO',
            classification.accuracy_percentage || 0,
            classification.confidence_level || 'UNKNOWN',
            classification.exoplanet_probability_percentage || 0,
            'SUCCESS'
          ];

          outputCsvRows.push(row.join(','));
        } else {
          // Failed row
          const data = result.input_data;
          const row = [
            result.planet_name || '',
            data.kepoi_name || '',
            data.ra || 0,
            data.dec || 0,
            data.pl_orbper || 0,
            data.pl_rade || 0,
            data.pl_insol || 0,
            data.pl_eqt || 0,
            data.st_teff || 0,
            data.st_rad || 0,
            data.st_dist || 0,
            'ERROR',
            'NO',
            0,
            'UNKNOWN',
            0,
            'FAILED'
          ];

          outputCsvRows.push(row.join(','));
        }
      });

      const csvContent = outputCsvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exoplanet_batch_results_${new Date().getTime()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Análisis Completo',
        description: `${results.filter(r => r.success).length}/${csvRows.length} filas procesadas exitosamente. Archivo descargado.`,
      });

    } catch (error) {
      console.error('Batch processing error:', error);
      toast({
        variant: 'destructive',
        title: 'Error en Procesamiento',
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsBatchProcessing(false);
      setBatchProgress(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center p-4 md:p-8 space-y-6">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging || isDataLoaded ? 'border-primary' : 'border-border hover:border-primary/50'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input type="file" id="file-upload" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
            {isDataLoaded ? (
                <>
                    <FileCheck2 className="w-12 h-12 text-primary" />
                    <p className="font-semibold text-foreground">Archivo Cargado</p>
                    <p className="text-xs text-muted-foreground truncate max-w-full px-4">{fileName}</p>
                </>
            ) : (
                <>
                    <UploadCloud className="w-12 h-12 text-muted-foreground" />
                    <p className="font-semibold text-foreground">Arrastra tu archivo Excel aquí</p>
                    <p className="text-xs text-muted-foreground">o haz click para seleccionar</p>
                </>
            )}
        </div>
      </div>

      {csvRows.length > 0 && (
        <div className="glass-card p-4 rounded-lg">
          <h3 className="font-headline text-lg mb-3 flex items-center gap-2">
            <List className="w-5 h-5 text-primary"/>Seleccionar Fila del CSV
          </h3>
          <Select value={selectedRowIndex} onValueChange={handleRowSelection}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una fila" />
            </SelectTrigger>
            <SelectContent>
              {csvRows.map((row, index) => (
                <SelectItem key={index} value={index.toString()}>
                  Fila {index + 1} {row.kepler_name || row.kepoi_name || row.pl_name || `(Row ${index + 1})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          Subir archivo
        </Button>
      </div>

      <div className="glass-card p-4 rounded-lg">
          <h3 className="font-headline text-lg mb-3 flex items-center gap-2"><List className="w-5 h-5 text-primary"/>Parámetros</h3>
          {selectedRowData ? (
            <ul className="text-sm space-y-2">
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted-foreground"><Star className="w-4 h-4"/>Coordenadas:</span>
                <span className="font-mono font-semibold">RA: {selectedRowData.ra?.toFixed(2) || 'N/A'}, DEC: {selectedRowData.dec?.toFixed(2) || 'N/A'}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted-foreground"><Orbit className="w-4 h-4"/>Período orbital:</span>
                <span className="font-mono font-semibold">{selectedRowData.pl_orbper?.toFixed(2) || 'N/A'} días</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted-foreground"><Thermometer className="w-4 h-4"/>Temp. estelar:</span>
                <span className="font-mono font-semibold">{selectedRowData.st_teff?.toFixed(0) || 'N/A'} K</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted-foreground"><Telescope className="w-4 h-4"/>Radio planeta:</span>
                <span className="font-mono font-semibold">{selectedRowData.pl_rade?.toFixed(2) || 'N/A'} R⊕</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted-foreground"><Signal className="w-4 h-4"/>Distancia estelar:</span>
                <span className="font-mono font-semibold">{selectedRowData.st_dist?.toFixed(2) || 'N/A'} pc</span>
              </li>
            </ul>
          ) : (
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2"><Star className="w-4 h-4"/>Coordenadas (ra, dec)</li>
              <li className="flex items-center gap-2"><Orbit className="w-4 h-4"/>Período orbital (pl_orbper)</li>
              <li className="flex items-center gap-2"><Thermometer className="w-4 h-4"/>Temperatura estelar (st_teff)</li>
              <li className="flex items-center gap-2"><Telescope className="w-4 h-4"/>Radio planeta (pl_rade)</li>
              <li className="flex items-center gap-2"><Signal className="w-4 h-4"/>Distancia estelar (st_dist)</li>
            </ul>
          )}
      </div>

      <Button
        size="lg"
        className="w-full font-bold text-lg py-7"
        onClick={onAnalyze}
        disabled={!isDataLoaded || isAnalyzing || isBatchProcessing || (csvRows.length > 0 && selectedRowIndex === '')}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Analizando...
          </>
        ) : (
          'Analizar con IA'
        )}
      </Button>

      {csvRows.length > 0 && (
        <Button
          size="lg"
          variant="secondary"
          className="w-full font-bold text-lg py-7"
          onClick={handleBatchAnalysis}
          disabled={isBatchProcessing || isAnalyzing}
        >
          {isBatchProcessing && batchProgress ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Procesando {batchProgress.current}/{batchProgress.total}...
            </>
          ) : (
            <>
              <List className="mr-2 h-6 w-6" />
              Analizar Todos ({csvRows.length} filas)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
