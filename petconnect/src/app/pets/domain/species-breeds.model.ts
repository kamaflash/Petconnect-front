// Descripción: Razas disponibles por especie para los formularios de mascotas.

export interface SpeciesBreedOption {
  label: string;
  value: string;
}

/**
 * Razas disponibles por especie (código de especie -> lista de razas).
 * El valor coincide con el nombre de la raza para almacenarlo como texto legible.
 */
export const SPECIES_BREEDS: Record<string, SpeciesBreedOption[]> = {
  dog: [
    { label: 'Beagle', value: 'Beagle' },
    { label: 'Border Collie', value: 'Border Collie' },
    { label: 'Boxer', value: 'Boxer' },
    { label: 'Bulldog Francés', value: 'Bulldog Francés' },
    { label: 'Caniche', value: 'Caniche' },
    { label: 'Chihuahua', value: 'Chihuahua' },
    { label: 'Cocker Spaniel', value: 'Cocker Spaniel' },
    { label: 'Dálmata', value: 'Dálmata' },
    { label: 'Doberman', value: 'Doberman' },
    { label: 'Golden Retriever', value: 'Golden Retriever' },
    { label: 'Husky Siberiano', value: 'Husky Siberiano' },
    { label: 'Labrador Retriever', value: 'Labrador Retriever' },
    { label: 'Pastor Alemán', value: 'Pastor Alemán' },
    { label: 'Rottweiler', value: 'Rottweiler' },
    { label: 'Schnauzer', value: 'Schnauzer' },
    { label: 'Shih Tzu', value: 'Shih Tzu' },
    { label: 'Yorkshire Terrier', value: 'Yorkshire Terrier' },
    { label: 'Otra raza', value: 'Otra raza' }
  ],
  cat: [
    { label: 'Común Europeo', value: 'Común Europeo' },
    { label: 'Persa', value: 'Persa' },
    { label: 'Maine Coon', value: 'Maine Coon' },
    { label: 'British Shorthair', value: 'British Shorthair' },
    { label: 'Siamés', value: 'Siamés' },
    { label: 'Sphynx', value: 'Sphynx' },
    { label: 'Ragdoll', value: 'Ragdoll' },
    { label: 'Oriental', value: 'Oriental' },
    { label: 'Otra raza', value: 'Otra raza' }
  ],
  bird: [
    { label: 'Periquito', value: 'Periquito' },
    { label: 'Canario', value: 'Canario' },
    { label: 'Agapornis', value: 'Agapornis' },
    { label: 'Cacatúa', value: 'Cacatúa' },
    { label: 'Cotorra', value: 'Cotorra' },
    { label: 'Guacamayo', value: 'Guacamayo' },
    { label: 'Loro', value: 'Loro' },
    { label: 'Otra raza', value: 'Otra raza' }
  ],
  rabbit: [
    { label: 'Cabeza de León', value: 'Cabeza de León' },
    { label: 'Rex', value: 'Rex' },
    { label: 'Mini Lop', value: 'Mini Lop' },
    { label: 'Mini Rex', value: 'Mini Rex' },
    { label: 'Conejo Californiano', value: 'Conejo Californiano' },
    { label: 'Otra raza', value: 'Otra raza' }
  ],
  hamster: [
    { label: 'Sirio o Dorado', value: 'Sirio o Dorado' },
    { label: 'Ruso', value: 'Ruso' },
    { label: 'Chino', value: 'Chino' },
    { label: 'Roborovski', value: 'Roborovski' },
    { label: 'Campbell', value: 'Campbell' },
    { label: 'Otra raza', value: 'Otra raza' }
  ],
  other: []
};