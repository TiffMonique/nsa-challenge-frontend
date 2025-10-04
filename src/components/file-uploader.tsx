"use client";

import { useState, useCallback, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import { UploadCloud, FileCheck2, List, Loader2, Star, Orbit, Thermometer, Telescope, Signal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sampleData } from '@/lib/sample-data';
import type { ExoplanetData } from '@/lib/types';

interface FileUploaderProps {
  onDataLoaded: (data: ExoplanetData) => void;
  onAnalyze: () => void;
  isDataLoaded: boolean;
  isAnalyzing: boolean;
}

const requiredFields = ['koi_prad', 'koi_period', 'koi_steff', 'koi_depth', 'koi_model_snr'];

export function FileUploader({ onDataLoaded, onAnalyze, isDataLoaded, isAnalyzing }: FileUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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
          throw new Error("El archivo Excel está vacío o tiene un formato incorrecto.");
        }
        
        const firstRow = json[0] as ExoplanetData;

        for (const field of requiredFields) {
            if (!(field in firstRow)) {
                throw new Error(`Falta la columna requerida en el Excel: ${field}`);
            }
        }

        onDataLoaded(firstRow);
        setFileName(file.name);
        toast({ title: "Éxito", description: "Archivo cargado y procesado." });

      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido al procesar el archivo.";
        toast({
          variant: 'destructive',
          title: 'Error de Archivo',
          description: message,
        });
        setFileName(null);
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

      <div className="flex gap-2">
        <Button variant="secondary" className="w-full" onClick={handleUseSampleData}>Usar datos de ejemplo (Real)</Button>
        <Button variant="secondary" className="w-full" onClick={handleUseSampleData2}>Usar datos de ejemplo (Falso)</Button>
      </div>

      <div className="glass-card p-4 rounded-lg">
          <h3 className="font-headline text-lg mb-3 flex items-center gap-2"><List className="w-5 h-5 text-primary"/>Parámetros Esperados</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2"><Star className="w-4 h-4"/>Radio del planeta (koi_prad)</li>
            <li className="flex items-center gap-2"><Orbit className="w-4 h-4"/>Período orbital (koi_period)</li>
            <li className="flex items-center gap-2"><Thermometer className="w-4 h-4"/>Temperatura estelar (koi_steff)</li>
            <li className="flex items-center gap-2"><Telescope className="w-4 h-4"/>Profundidad del tránsito (koi_depth)</li>
            <li className="flex items-center gap-2"><Signal className="w-4 h-4"/>SNR (koi_model_snr)</li>
          </ul>
      </div>

      <Button
        size="lg"
        className="w-full font-bold text-lg py-7"
        onClick={onAnalyze}
        disabled={!isDataLoaded || isAnalyzing}
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
    </div>
  );
}
