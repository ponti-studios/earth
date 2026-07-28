// Shared Earth data types.
// This file intentionally contains no runtime signals.

export interface TflCamera {
  id: string;
  available: string;
  commonName: string;
  videoUrl: string;
  view: string;
  imageUrl: string;
  lat: number;
  lng: number;
}
