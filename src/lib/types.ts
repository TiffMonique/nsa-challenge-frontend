export type AnalysisStatus = 'initial' | 'analyzing' | 'confirmed' | 'false_positive';

// Represents one row of the input data
export type ExoplanetData = {
  kepid: number;
  kepoi_name: string;
  kepler_name: string;
  koi_disposition: 'CONFIRMED' | 'CANDIDATE' | 'FALSE POSITIVE';
  koi_pdisposition: 'CANDIDATE' | 'FALSE POSITIVE';
  koi_score: number | null;
  koi_fpflag_nt: number;
  koi_fpflag_ss: number;
  koi_fpflag_co: number;
  koi_fpflag_ec: number;
  koi_period: number;
  koi_prad: number; // Planet Radius
  koi_teq: number | null; // Equilibrium Temperature
  koi_steff: number | null; // Stellar Temperature
  koi_depth: number;
  koi_model_snr: number; // SNR
  [key: string]: string | number | null;
};

// Represents the output of our analysis
export interface AnalysisResult {
  status: 'confirmed' | 'false_positive';
  confidence: number;
  planetName: string;
  data: ExoplanetData;
  similarTo?: string; // From AI
  issues?: { title: string; value: string; recommendation: string }[];
  suggestionsSummary?: string; // From AI
}
