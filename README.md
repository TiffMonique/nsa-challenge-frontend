# Exoplanet AI Explorer

A Next.js web application for exoplanet classification using machine learning, featuring real-time 3D visualization and light curve analysis.

![NASA Space Apps Challenge 2025](https://img.shields.io/badge/NASA-Space%20Apps%20Challenge%202025-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Three.js](https://img.shields.io/badge/Three.js-3D%20Visualization-orange)

## 🌟 Features

### 📊 Data Analysis
- **CSV/Excel File Upload**: Upload exoplanet candidate data files
- **Row Selection**: Interactive dropdown to select specific candidates
- **API Integration**: Real-time classification using machine learning API
- **Batch Processing**: Analyze multiple candidates simultaneously with progress tracking
- **Export Results**: Download classification results as CSV

### 🌌 3D Visualization
- **Stellar Classification Colors**: Stars display accurate colors based on temperature
  - O-type (>30,000K): Blue
  - B-type (10,000-30,000K): Blue-White
  - A-type (7,500-10,000K): White
  - F-type (6,000-7,500K): Yellow-White
  - G-type (5,200-6,000K): Yellow (Sun-like)
  - K-type (3,700-5,200K): Orange
  - M-type (2,400-3,700K): Red-Orange

- **Planet Classification Colors**: Planets colored by physical properties
  - Rocky planets: Red (hot) to Blue (habitable) to Brown (cold)
  - Super-Earths: Red-orange (hot) to Light blue (cold)
  - Neptunes: Dark blue (cold) to Orange (hot)
  - Gas Giants: Dark brown (cold) to Dark orange (hot)

- **Accurate Scaling**:
  - Planet-to-star radius ratio to scale
  - Semi-major axis calculated using Kepler's third law
  - Orbital period scaled to 60 seconds for visualization

- **Orbital Mechanics**:
  - Counter-clockwise orbital motion
  - Dynamic rotation speeds based on object size
  - Stellar rotation varies with temperature

### 📈 Light Curve Display
- **Real-time Transit Detection**: Displays brightness changes as planet transits
- **Transit Depth Visualization**: Shows dips in stellar brightness (in ppm)
- **Live Graph**: Updates every frame (60 FPS)
- **Transit Markers**: Highlights detected transit events

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- Backend API running on `http://localhost:8000`

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nsa-challenge-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:9002](http://localhost:9002) in your browser

### Backend API Setup

The application requires a backend API running on `http://localhost:8000` with the following endpoint:

**POST** `/exoplanet/predict`

**Request Body:**
```json
{
  "stellar_data": {
    "ra": 0,
    "dec": 0,
    "st_pmra": 0,
    "st_pmdec": 0,
    "pl_orbper": 0,
    "pl_trandurh": 0,
    "pl_trandep": 0,
    "pl_rade": 0,
    "pl_insol": 0,
    "pl_eqt": 0,
    "st_tmag": 0,
    "st_dist": 0,
    "st_teff": 0,
    "st_logg": 0,
    "st_rad": 0
  }
}
```

**Response:**
```json
{
  "message": "Exoplanet classification completed",
  "stellar_object_data": { ... },
  "classification_result": {
    "is_exoplanet": true,
    "classification": "EXOPLANET",
    "confidence_level": "HIGH",
    "accuracy_percentage": 95.5,
    "exoplanet_probability_percentage": 96.2,
    "non_exoplanet_probability_percentage": 3.8
  },
  "model_accuracy_percentage": 82.4
}
```

## 📁 Project Structure

```
nsa-challenge-frontend/
├── src/
│   ├── app/                    # Next.js app directory
│   ├── components/
│   │   ├── exo-ai-explorer.tsx      # Main application component
│   │   ├── file-uploader.tsx        # CSV upload and batch processing
│   │   ├── planet-visualization.tsx # 3D Three.js visualization
│   │   ├── results-modal.tsx        # Classification results display
│   │   ├── page-header.tsx          # Application header
│   │   └── page-footer.tsx          # Application footer
│   ├── lib/
│   │   ├── types.ts                 # TypeScript interfaces
│   │   └── test_samples.csv         # Sample exoplanet data
│   └── hooks/                       # React hooks
├── public/                          # Static assets
└── package.json
```

## 🔧 Technologies Used

- **Next.js 15.3.3** - React framework with Turbopack
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Three.js** - 3D graphics and visualization
- **Radix UI** - Accessible component primitives
- **XLSX** - Excel/CSV file parsing
- **Tailwind CSS** - Styling

## 📋 CSV Data Format

The application expects CSV files with the following columns:

| Column | Description | Unit |
|--------|-------------|------|
| `kepoi_name` | KOI identifier | - |
| `kepler_name` | Kepler name | - |
| `koi_disposition` | Disposition | - |
| `ra` | Right Ascension | degrees |
| `dec` | Declination | degrees |
| `st_pmra` | Proper motion RA | mas/yr |
| `st_pmdec` | Proper motion Dec | mas/yr |
| `pl_orbper` | Orbital period | days |
| `pl_trandurh` | Transit duration | hours |
| `pl_trandep` | Transit depth | ppm |
| `pl_rade` | Planet radius | Earth radii |
| `pl_insol` | Insolation flux | Earth flux |
| `pl_eqt` | Equilibrium temp | Kelvin |
| `st_tmag` | TESS magnitude | - |
| `st_dist` | Distance | parsecs |
| `st_teff` | Stellar temp | Kelvin |
| `st_logg` | Stellar log(g) | log10(cm/s²) |
| `st_rad` | Stellar radius | Solar radii |

Sample data is provided in `/src/lib/test_samples.csv`

## 🎯 Usage

1. **Upload Data**:
   - Click "Subir archivo" to upload a CSV/Excel file
   - Select a row from the dropdown menu
   - View selected parameters in the panel

2. **Single Analysis**:
   - Click "Analizar con IA" to classify the selected candidate
   - View results in the modal with classification details
   - Observe the 3D visualization update with physical properties

3. **Batch Analysis**:
   - Click "Analizar Todos" to process all rows
   - Monitor progress in real-time
   - Download CSV results when complete

4. **Visualization**:
   - Watch the planet orbit the star (60-second period)
   - Observe the light curve update in real-time
   - Click on the planet to view detailed results

## 🎨 Visualization Details

### Star Colors
Stars are colored based on their effective temperature (`st_teff`) following the stellar classification system:
- Cool stars (M-type): Red/Orange
- Sun-like stars (G-type): Yellow
- Hot stars (A/B-type): White/Blue

### Planet Colors
Planets are colored based on their radius (`pl_rade`) and equilibrium temperature (`pl_eqt`):
- **Rocky planets** (<1.5 R⊕): Red (hot) / Blue (habitable) / Brown (cold)
- **Super-Earths** (1.5-3.5 R⊕): Dark orange tones
- **Neptunes** (3.5-8 R⊕): Dark blue (cold) / Dark orange (hot)
- **Gas Giants** (>8 R⊕): Very dark brown/amber (more opaque for contrast)

### Light Curve
The light curve shows:
- Brightness on Y-axis (0.990 - 1.000)
- Time progression on X-axis
- Transit dips marked with colored dots
- Current brightness value displayed
- Orbital period and transit depth info

## 🤝 Contributing

This project was created for the NASA Space Apps Challenge 2025. Contributions are welcome!

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- NASA Kepler/K2 Mission for exoplanet data
- NASA TESS Mission for transit photometry
- NASA Exoplanet Archive for datasets
- TensorFlow.js team for machine learning capabilities
- Three.js community for 3D visualization tools

---

**🪐 Generated with Claude Code**

**Co-Authored-By: Claude <noreply@anthropic.com>**
