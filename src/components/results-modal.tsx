"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { AlertTriangle, CheckCircle2, Orbit, Ruler, Thermometer, Telescope, Signal, Eye } from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import { Badge } from './ui/badge';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
}

export function ResultsModal({ isOpen, onClose, result }: ResultsModalProps) {
  if (!result) return null;

  const { status, confidence, planetName, data, similarTo, issues, suggestionsSummary } = result;

  const isConfirmed = status === 'confirmed';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glass-card overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 text-2xl font-headline ${isConfirmed ? 'text-primary' : 'text-destructive'}`}>
            {isConfirmed ? <CheckCircle2 /> : <AlertTriangle />}
            {isConfirmed ? '¡Exoplaneta Confirmado!' : 'Falso Positivo Detectado'}
          </DialogTitle>
          <DialogDescription>
            Análisis para el candidato: {planetName || data.kepoi_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Nivel de Confianza</Label>
            <div className="flex items-center gap-2">
              <Progress value={confidence} className={isConfirmed ? '[&>div]:bg-primary' : '[&>div]:bg-destructive'} />
              <span className={`font-bold ${isConfirmed ? 'text-primary' : 'text-destructive'}`}>{confidence.toFixed(0)}%</span>
            </div>
          </div>

          {isConfirmed ? (
            <div className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Parámetros Clave</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2"><Ruler className="w-4 h-4 text-primary" /> Radio: {data.koi_prad} R⊕</div>
                  <div className="flex items-center gap-2"><Orbit className="w-4 h-4 text-primary" /> Período: {data.koi_period.toFixed(2)} días</div>
                  <div className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-primary" /> Temp. Estelar: {data.koi_steff} K</div>
                  <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> Zona Habitable: {data.koi_teq && data.koi_teq > 273 && data.koi_teq < 373 ? 'Sí' : 'No'}</div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Comparación IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Similar a: <Badge variant="secondary" className="font-bold">{similarTo || 'Buscando...'}</Badge></p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="glass-card">
                 <CardHeader>
                  <CardTitle className="text-lg">Problemas Encontrados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {issues?.map((issue, index) => (
                    <div key={index} className="text-sm">
                      <p className="font-semibold">{issue.title}: <span className="text-destructive font-mono">{issue.value}</span></p>
                      <p className="text-muted-foreground">{issue.recommendation}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-card">
                 <CardHeader>
                  <CardTitle className="text-lg">Sugerencias para Validación</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    {suggestionsSummary ? <p>{suggestionsSummary}</p> : <p>Generando sugerencias...</p>}
                    <div className="flex items-center space-x-2 pt-4">
                        <Switch id="auto-adjust" />
                        <Label htmlFor="auto-adjust">Ajustar parámetros automáticamente</Label>
                    </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant={isConfirmed ? "default" : "secondary"} onClick={onClose}>
            {isConfirmed ? "Ver detalles completos" : "Intentar de nuevo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
