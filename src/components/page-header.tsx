import { Rocket } from 'lucide-react';

export function PageHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Rocket className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-headline text-foreground">ExoPlanet AI Validator</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Descubre si tu candidato es un planeta real</p>
          </div>
        </div>
        {/* Navigation hidden */}
      </div>
    </header>
  );
}
