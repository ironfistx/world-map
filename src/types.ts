export type GeocodedPlace = { id?: number; name: string; country: string; admin1?: string; latitude: number; longitude: number }
export type Pin = { id: number | string; name: string | null; city: string; country: string; latitude: number; longitude: number; created_at?: string }

declare global {
  interface Window { mapboxgl: any; supabase: any }
}

export {}
