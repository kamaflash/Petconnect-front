/**
 * Pet label mappers - Centralized label mapping for pet properties
 */

// Species labels
export const SPECIES_LABELS: Record<string, string> = {
  'dog': 'Perro',
  'cat': 'Gato',
  'bird': 'Ave',
  'rabbit': 'Conejo',
  'hamster': 'Hámster',
  'other': 'Otro'
} as const;

// Gender labels
export const GENDER_LABELS: Record<string, string> = {
  'male': 'Macho',
  'female': 'Hembra',
  'unknown': 'Desconocido'
} as const;

// Temperament labels
export const TEMPERAMENT_LABELS: Record<string, string> = {
  'calm': 'Tranquilo',
  'energetic': 'Energético',
  'playful': 'Juguetón',
  'shy': 'Tímido',
  'aggressive': 'Agresivo',
  'friendly': 'Amigable',
  'other': 'Otro'
} as const;

// Energy level labels
export const ENERGY_LEVEL_LABELS: Record<string, string> = {
  'low': 'Bajo',
  'medium': 'Medio',
  'high': 'Alto'
} as const;

// Training level labels
export const TRAINING_LEVEL_LABELS: Record<string, string> = {
  'none': 'Ninguno',
  'basic': 'Básico',
  'intermediate': 'Intermedio',
  'advanced': 'Avanzado'
} as const;

/**
 * Get species label from value
 */
export function getSpeciesLabel(species: string | null | undefined): string {
  return species ? (SPECIES_LABELS[species] || species) : '—';
}

/**
 * Get gender label from value
 */
export function getGenderLabel(gender: string | null | undefined): string {
  return gender ? (GENDER_LABELS[gender] || gender) : '—';
}

/**
 * Get temperament label from value
 */
export function getTemperamentLabel(temperament: string | null | undefined): string {
  return temperament ? (TEMPERAMENT_LABELS[temperament] || temperament) : '—';
}

/**
 * Get energy level label from value
 */
export function getEnergyLevelLabel(level: string | null | undefined): string {
  return level ? (ENERGY_LEVEL_LABELS[level] || level) : '—';
}

/**
 * Get training level label from value
 */
export function getTrainingLevelLabel(level: string | null | undefined): string {
  return level ? (TRAINING_LEVEL_LABELS[level] || level) : '—';
}

// Type exports
export type Species = keyof typeof SPECIES_LABELS;
export type Gender = keyof typeof GENDER_LABELS;
export type Temperament = keyof typeof TEMPERAMENT_LABELS;
export type EnergyLevel = keyof typeof ENERGY_LEVEL_LABELS;
export type TrainingLevel = keyof typeof TRAINING_LEVEL_LABELS;
