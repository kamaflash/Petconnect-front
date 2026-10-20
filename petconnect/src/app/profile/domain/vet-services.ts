/**
 * Catálogo de servicios que un veterinario selecciona como propios.
 *
 * Los `code` son códigos estables: el backend los guarda en
 * `user_profiles.services` separados por comas (p. ej.
 * "consultations,vaccinations"). El catálogo vive en el frontend como única
 * fuente de verdad; añadir un servicio es añadir aquí su código y las
 * traducciones `profile.services.<code>` en i18n.
 */
export interface VetServiceOption {
  code: string;
  labelKey: string;
}

export const VET_SERVICES: VetServiceOption[] = [
  { code: 'consultations', labelKey: 'profile.services.consultations' },
  { code: 'vaccinations', labelKey: 'profile.services.vaccinations' },
  { code: 'deworming', labelKey: 'profile.services.deworming' },
  { code: 'microchip', labelKey: 'profile.services.microchip' },
  { code: 'surgery', labelKey: 'profile.services.surgery' },
  { code: 'emergency', labelKey: 'profile.services.emergency' },
  { code: 'dentistry', labelKey: 'profile.services.dentistry' },
  { code: 'laboratory', labelKey: 'profile.services.laboratory' },
  { code: 'imaging', labelKey: 'profile.services.imaging' },
  { code: 'nutrition', labelKey: 'profile.services.nutrition' },
  { code: 'grooming', labelKey: 'profile.services.grooming' },
  { code: 'boarding', labelKey: 'profile.services.boarding' },
];

/**
 * Convierte el valor guardado (cadena comma-separated o array) en una lista de
 * códigos limpia. Los códigos desconocidos se descartan al mapear etiquetas.
 */
export function parseVetServiceCodes(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(code => String(code).trim()).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map(code => code.trim()).filter(Boolean);
  }
  return [];
}
