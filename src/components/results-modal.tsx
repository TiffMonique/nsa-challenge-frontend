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

  const { status, confidence, planetName, data, similarTo, issues, suggestionsSummary, apiResponse } = result;

  // Use API stellar_object_data if available, otherwise use original CSV data
  const stellarData = apiResponse?.stellar_object_data || data;

  // Log to verify we're using API data
  if (apiResponse?.stellar_object_data) {
    console.log('Using stellar data from API response:', stellarData);
  } else {
    console.log('Using stellar data from original CSV:', stellarData);
  }

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
          {/* Classification Summary from API */}
          {apiResponse?.classification_result && (
            <Card className="glass-card border-2" style={{ borderColor: isConfirmed ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
              <CardHeader>
                <CardTitle className="text-lg">Classification Result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Classification:</span> <Badge variant={isConfirmed ? "default" : "destructive"}>{apiResponse.classification_result.classification}</Badge></div>
                  <div><span className="text-muted-foreground">Confidence Level:</span> <Badge variant="outline">{apiResponse.classification_result.confidence_level}</Badge></div>
                </div>
                <div>
                  <Label>Accuracy</Label>
                  <div className="flex items-center gap-2">
                    <Progress value={confidence} className={isConfirmed ? '[&>div]:bg-primary' : '[&>div]:bg-destructive'} />
                    <span className={`font-bold ${isConfirmed ? 'text-primary' : 'text-destructive'}`}>{confidence.toFixed(2)}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div><span className="text-muted-foreground">Exoplanet Probability:</span> <span className="font-semibold text-primary">{apiResponse.classification_result.exoplanet_probability_percentage.toFixed(2)}%</span></div>
                  <div><span className="text-muted-foreground">Non-Exoplanet Probability:</span> <span className="font-semibold text-destructive">{apiResponse.classification_result.non_exoplanet_probability_percentage.toFixed(2)}%</span></div>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground text-xs">Model Accuracy: </span>
                  <span className="font-semibold text-xs">{apiResponse.model_accuracy_percentage}%</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legacy confidence display (if no API response) */}
          {!apiResponse?.classification_result && (
            <div>
              <Label>Nivel de Confianza</Label>
              <div className="flex items-center gap-2">
                <Progress value={confidence} className={isConfirmed ? '[&>div]:bg-primary' : '[&>div]:bg-destructive'} />
                <span className={`font-bold ${isConfirmed ? 'text-primary' : 'text-destructive'}`}>{confidence.toFixed(0)}%</span>
              </div>
            </div>
          )}

          {isConfirmed ? (
            <div className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Parámetros Planetarios</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2"><Ruler className="w-4 h-4 text-primary" /> Radio: {stellarData.pl_rade || stellarData.koi_prad || 'N/A'} R⊕</div>
                  <div className="flex items-center gap-2"><Orbit className="w-4 h-4 text-primary" /> Período: {stellarData.pl_orbper?.toFixed(2) || stellarData.koi_period?.toFixed(2) || 'N/A'} días</div>
                  <div className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-primary" /> Temp. Equilibrio: {stellarData.pl_eqt || stellarData.koi_teq || 'N/A'} K</div>
                  <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> Zona Habitable: {(stellarData.pl_eqt || stellarData.koi_teq) && (stellarData.pl_eqt || stellarData.koi_teq)! > 273 && (stellarData.pl_eqt || stellarData.koi_teq)! < 373 ? 'Sí' : 'No'}</div>
                  {stellarData.pl_insol && <div className="flex items-center gap-2"><Signal className="w-4 h-4 text-primary" /> Insolación: {stellarData.pl_insol.toFixed(2)}</div>}
                  {stellarData.pl_trandurh && <div className="flex items-center gap-2"><Telescope className="w-4 h-4 text-primary" /> Duración Tránsito: {stellarData.pl_trandurh.toFixed(2)} hrs</div>}
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Parámetros Estelares</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-primary" /> Temp. Estelar: {stellarData.st_teff || stellarData.koi_steff || 'N/A'} K</div>
                  {stellarData.st_rad && <div className="flex items-center gap-2"><Ruler className="w-4 h-4 text-primary" /> Radio Estelar: {stellarData.st_rad.toFixed(2)} R☉</div>}
                  {stellarData.st_logg && <div className="flex items-center gap-2"><Signal className="w-4 h-4 text-primary" /> log(g): {stellarData.st_logg.toFixed(2)}</div>}
                  {stellarData.st_dist && <div className="flex items-center gap-2"><Telescope className="w-4 h-4 text-primary" /> Distancia: {stellarData.st_dist.toFixed(2)} pc</div>}
                </CardContent>
              </Card>
              {similarTo && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Comparación IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>Similar a: <Badge variant="secondary" className="font-bold">{similarTo}</Badge></div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {issues && issues.length > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Problemas Encontrados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {issues.map((issue, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-semibold">{issue.title}: <span className="text-destructive font-mono">{issue.value}</span></p>
                        <p className="text-muted-foreground">{issue.recommendation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {suggestionsSummary && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Sugerencias para Validación</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>{suggestionsSummary}</p>
                    <div className="flex items-center space-x-2 pt-4">
                      <Switch id="auto-adjust" />
                      <Label htmlFor="auto-adjust">Ajustar parámetros automáticamente</Label>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Raw API Response removed - all data now displayed in structured sections above */}
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
