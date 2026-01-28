import { Star, SpectralType } from '../types';

const TOTAL_STARS = 7000;

const TYPE_COLORS: Record<SpectralType, string> = {
  [SpectralType.O]: '#9bb0ff',
  [SpectralType.B]: '#aabfff',
  [SpectralType.A]: '#cad7ff',
  [SpectralType.F]: '#f8f7ff',
  [SpectralType.G]: '#fff4ea',
  [SpectralType.K]: '#ffd2a1',
  [SpectralType.M]: '#ffcc6f',
};

const SPECTRAL_WEIGHTS = [
  { type: SpectralType.O, weight: 0.00003, minTemp: 30000, maxTemp: 50000 },
  { type: SpectralType.B, weight: 0.0013, minTemp: 10000, maxTemp: 30000 },
  { type: SpectralType.A, weight: 0.006, minTemp: 7500, maxTemp: 10000 },
  { type: SpectralType.F, weight: 0.03, minTemp: 6000, maxTemp: 7500 },
  { type: SpectralType.G, weight: 0.076, minTemp: 5200, maxTemp: 6000 },
  { type: SpectralType.K, weight: 0.121, minTemp: 3700, maxTemp: 5200 },
  { type: SpectralType.M, weight: 0.7645, minTemp: 2400, maxTemp: 3700 },
];

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random(); 
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    return z * stdev + mean;
}

// Convert Galactic (l, b) to Equatorial (ra, dec)
// This ensures the Milky Way looks like a band in the sky
function galacticToEquatorial(l: number, b: number) {
  // Approximate conversion constants (radians)
  const deg2rad = Math.PI / 180;
  const rad2deg = 180 / Math.PI;
  
  const alphaG = 192.85 * deg2rad;
  const deltaG = 27.13 * deg2rad;
  const lCP = 122.93 * deg2rad;

  const lRad = l * deg2rad;
  const bRad = b * deg2rad;

  const sinDec = Math.sin(deltaG) * Math.sin(bRad) + Math.cos(deltaG) * Math.cos(bRad) * Math.cos(lRad - lCP);
  const dec = Math.asin(sinDec);

  const y = Math.cos(bRad) * Math.sin(lRad - lCP);
  const x = Math.cos(deltaG) * Math.sin(bRad) - Math.sin(deltaG) * Math.cos(bRad) * Math.cos(lRad - lCP);
  
  let ra = Math.atan2(y, x) + alphaG;
  if (ra < 0) ra += 2 * Math.PI;
  if (ra > 2 * Math.PI) ra -= 2 * Math.PI;

  return { ra: ra * rad2deg, dec: dec * rad2deg };
}

export const generateStars = (): Star[] => {
  const stars: Star[] = [];

  for (let i = 0; i < TOTAL_STARS; i++) {
    // 1. Spectral Properties
    let rand = Math.random();
    let typeData = SPECTRAL_WEIGHTS[SPECTRAL_WEIGHTS.length - 1]; 
    for (const w of SPECTRAL_WEIGHTS) {
      if (rand < w.weight) {
        typeData = w;
        break;
      }
      rand -= w.weight;
    }

    const temperature = randomRange(typeData.minTemp, typeData.maxTemp);
    const normalizedTemp = temperature / 5778; 
    let luminosity = Math.pow(normalizedTemp, 7) * randomRange(0.5, 1.5);
    const radius = Math.sqrt(luminosity) / Math.pow(normalizedTemp, 2);

    // 2. Spatial Position (Galactic Model)
    // Create a thick disk distribution
    const angle = Math.random() * Math.PI * 2;
    const distFromCenter = Math.abs(gaussianRandom(0, 0.6)); 
    // Galactic coords (Cartesian, normalized for Galaxy View)
    const galX = (Math.cos(angle + distFromCenter * 4) * distFromCenter);
    const galY = (Math.sin(angle + distFromCenter * 4) * distFromCenter);
    const galZ = gaussianRandom(0, 0.08); // Thickness

    // Convert to Galactic Lat/Long for Celestial Projection
    const distXY = Math.sqrt(galX * galX + galY * galY);
    const b = Math.atan2(galZ, distXY) * (180 / Math.PI); // Galactic Latitude
    const l = Math.atan2(galY, galX) * (180 / Math.PI);   // Galactic Longitude

    // Convert to Equatorial (RA/Dec)
    const { ra, dec } = galacticToEquatorial(l, b);

    // 3. Magnitude & Distance
    const distancePc = Math.pow(10, randomRange(0, 3.8)); // 1pc to ~6000pc
    const absMag = -2.5 * Math.log10(luminosity) + 4.83;
    const appMag = absMag + 5 * (Math.log10(distancePc) - 1);

    // 4. HR Diagram Projection
    const logTemp = Math.log10(temperature);
    const hrX = -((logTemp - 3.3) / (4.7 - 3.3) * 2 - 1); 
    const logLum = Math.log10(luminosity);
    const hrY = (logLum - (-4)) / (6 - (-4)) * 2 - 1;

    stars.push({
      id: i,
      ra,
      dec,
      galX,
      galY,
      galZ,
      hrX,
      hrY: -hrY,
      spectralType: typeData.type,
      temperature,
      luminosity,
      radius,
      apparentMagnitude: appMag,
      absoluteMagnitude: absMag,
      distance: distancePc,
      color: TYPE_COLORS[typeData.type],
      baseSize: Math.max(0.5, (2 - appMag / 10))
    });
  }

  // Pre-sort by magnitude for cleaner rendering (though canvas doesn't need Z-buffer)
  return stars.sort((a, b) => a.apparentMagnitude - b.apparentMagnitude);
};