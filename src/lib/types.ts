export type AnalysisStatus = 'initial' | 'analyzing' | 'confirmed' | 'false_positive';

// Represents one row of the input data
export type ExoplanetData = {
  kepoi_name?: string;
  kepler_name?: string;
  koi_disposition?: 'CONFIRMED' | 'CANDIDATE' | 'FALSE POSITIVE';
  // API payload fields
  ra?: number;
  dec?: number;
  st_pmra?: number;
  st_pmdec?: number;
  pl_orbper?: number;
  pl_trandurh?: number;
  pl_trandep?: number;
  pl_rade?: number;
  pl_insol?: number;
  pl_eqt?: number;
  st_tmag?: number;
  st_dist?: number;
  st_teff?: number;
  st_logg?: number;
  st_rad?: number;
  // Legacy fields (optional)
  kepid?: number;
  koi_pdisposition?: 'CANDIDATE' | 'FALSE POSITIVE';
  koi_score?: number | null;
  koi_fpflag_nt?: number;
  koi_fpflag_ss?: number;
  koi_fpflag_co?: number;
  koi_fpflag_ec?: number;
  koi_period?: number;
  koi_prad?: number;
  koi_teq?: number | null;
  koi_steff?: number | null;
  koi_depth?: number;
  koi_model_snr?: number;
  [key: string]: string | number | null | undefined;
};

// Represents the output of our analysis
export interface AnalysisResult {
  status: 'confirmed' | 'false_positive';
  confidence: number;
  planetName: string;
  data: ExoplanetData;
  apiResponse?: any; // Full API response from prediction endpoint
  similarTo?: string; // From AI (legacy)
  issues?: { title: string; value: string; recommendation: string }[];
  suggestionsSummary?: string; // From AI (legacy)
}
