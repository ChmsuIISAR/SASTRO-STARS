export enum AppMode {
  SKY = 'SKY',
  CLASSIFICATION = 'CLASSIFICATION',
  GALAXY = 'GALAXY',
  HR_DIAGRAM = 'HR_DIAGRAM',
  CENSUS = 'CENSUS'
}

export enum SpectralType {
  O = 'O',
  B = 'B',
  A = 'A',
  F = 'F',
  G = 'G',
  K = 'K',
  M = 'M'
}

export interface Star {
  id: number;
  
  // Equatorial Coordinates (Fixed on Celestial Sphere)
  ra: number; // Right Ascension (0 to 360 degrees)
  dec: number; // Declination (-90 to +90 degrees)

  // HR Diagram Coordinates (Normalized -1 to 1)
  hrX: number; 
  hrY: number; 

  // Galactic Coordinates (3D Cartesian, Normalized)
  galX: number;
  galY: number;
  galZ: number;

  spectralType: SpectralType;
  temperature: number; // Kelvin
  luminosity: number; // Solar luminosities
  radius: number; // Solar radii
  apparentMagnitude: number; // m
  absoluteMagnitude: number; // M
  distance: number; // Parsecs
  
  color: string;
  baseSize: number;
}

export interface ObserverState {
  latitude: number; // -90 to 90
  localSiderealTime: number; // 0 to 360 degrees
  lightPollutionLimit: number; // Magnitude limit imposed by city lights
  isPaused: boolean;
  timeSpeed: number;
}