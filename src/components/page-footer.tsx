export function PageFooter() {
  return (
    <footer className="absolute bottom-0 left-0 right-0 p-4 text-center">
      <div className="text-xs text-muted-foreground space-y-1">
        <p>NASA Space Apps Challenge 2025</p>
        <div className="flex justify-center gap-4">
          <a href="#" className="hover:text-primary transition-colors">GitHub</a>
          <span>|</span>
          <a href="#" className="hover:text-primary transition-colors">Documentación</a>
          <span>|</span>
          <a href="#" className="hover:text-primary transition-colors">Datasets Usados</a>
        </div>
        <p>Powered by TensorFlow.js</p>
      </div>
    </footer>
  );
}
