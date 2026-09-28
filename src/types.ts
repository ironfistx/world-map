import type { City } from './data/cities'
export type Marker = City & { id: string; createdAt: string }
