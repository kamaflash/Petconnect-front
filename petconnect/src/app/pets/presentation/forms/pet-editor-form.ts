import { TranslocoService } from '@jsverse/transloco';
import { DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { PET_COLOR_OPTIONS } from '../../domain/pet-colors.model';
import { PetResponse, CreatePetRequest } from '../../domain/pet.model';
import { SPECIES_BREEDS } from '../../domain/species-breeds.model';

export function buildPetEditorFormConfig(i18n: TranslocoService): DynamicFormConfig {
  return {
    submitLabel: i18n.translate('petsPage.saveChanges'),
    showCancel: true,
    resolveOptions: (_field, sourceValue) => SPECIES_BREEDS[sourceValue] ?? [],
    fields: [
      {
        key: 'name',
        label: i18n.translate('petsPage.nameLabel'),
        type: 'input',
        validation: { required: true, minLength: 2, maxLength: 100 }
      },
      {
        key: 'species',
        label: i18n.translate('petsPage.speciesLabel'),
        type: 'select',
        options: [
          { label: i18n.translate('common.dog'), value: 'dog' },
          { label: i18n.translate('common.cat'), value: 'cat' },
          { label: i18n.translate('common.bird'), value: 'bird' },
          { label: i18n.translate('common.rabbit'), value: 'rabbit' },
          { label: i18n.translate('common.hamster'), value: 'hamster' },
          { label: i18n.translate('common.other'), value: 'other' }
        ],
        validation: { required: true }
      },
      {
        key: 'breed',
        label: i18n.translate('petsPage.breedLabel'),
        type: 'select',
        dependsOn: 'species'
      },
      {
        key: 'dateOfBirth',
        label: i18n.translate('petsPage.birthDateLabel'),
        type: 'date',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'gender',
        label: i18n.translate('common.gender'),
        type: 'select',
        options: [
          { label: i18n.translate('common.male'), value: 'male' },
          { label: i18n.translate('common.female'), value: 'female' },
          { label: i18n.translate('admin.unknown'), value: 'unknown' }
        ]
      },
      {
        key: 'color',
        label: i18n.translate('common.color'),
        type: 'select',
        options: PET_COLOR_OPTIONS,
        showClear: true
      },
      {
        key: 'microchipId',
        label: 'Microchip ID',
        type: 'input',
        validation: { maxLength: 100 }
      },
      {
        key: 'weight',
        label: i18n.translate('admin.weight'),
        type: 'number',
        validation: { min: 0.1, max: 200 }
      },
      {
        key: 'weightUnit',
        label: i18n.translate('admin.weightUnit'),
        type: 'select',
        options: [
          { label: 'kg', value: 'kg' },
          { label: 'lb', value: 'lb' }
        ]
      },
      {
        key: 'bio',
        label: i18n.translate('common.bio'),
        type: 'textarea',
        rows: 3,
        validation: { maxLength: 500 }
      },
      {
        key: 'bloodType',
        label: 'Tipo de Sangre',
        type: 'input',
        validation: { maxLength: 10 }
      },
      {
        key: 'allergies',
        label: 'Alergias',
        type: 'textarea',
        rows: 2,
        validation: { maxLength: 500 }
      },
      {
        key: 'medicalConditions',
        label: i18n.translate('petProfile.medicalConditions'),
        type: 'textarea',
        rows: 2,
        validation: { maxLength: 500 }
      },
      {
        key: 'vetName',
        label: 'Nombre del Veterinario',
        type: 'input',
        validation: { maxLength: 100 }
      },
      {
        key: 'vetPhone',
        label: i18n.translate('petProfile.vetPhone'),
        type: 'input',
        validation: { maxLength: 20 }
      },
      {
        key: 'vetAddress',
        label: i18n.translate('petProfile.vetAddress'),
        type: 'input',
        validation: { maxLength: 255 }
      },
      {
        key: 'lastVaccinationDate',
        label: i18n.translate('petProfile.lastVaccination'),
        type: 'date',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'nextVaccinationDate',
        label: i18n.translate('petProfile.nextVaccination'),
        type: 'date',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'lastVetVisit',
        label: i18n.translate('petProfile.lastVetVisit'),
        type: 'date',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'insuranceProvider',
        label: 'Aseguradora',
        type: 'input',
        validation: { maxLength: 100 }
      },
      {
        key: 'insurancePolicyNumber',
        label: i18n.translate('petProfile.policyNumber'),
        type: 'input',
        validation: { maxLength: 100 }
      },
      {
        key: 'emergencyContact',
        label: 'Contacto de Emergencia',
        type: 'input',
        validation: { maxLength: 100 }
      },
      {
        key: 'emergencyPhone',
        label: i18n.translate('petProfile.emergencyPhone'),
        type: 'input',
        validation: { maxLength: 20 }
      },
      {
        key: 'adoptionDate',
        label: i18n.translate('petProfile.adoptionDate'),
        type: 'date',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'adoptionCenter',
        label: i18n.translate('petProfile.adoptionCenter'),
        type: 'input',
        validation: { maxLength: 100 }
      },
      {
        key: 'registrationNumber',
        label: i18n.translate('petProfile.registrationNumber'),
        type: 'input',
        validation: { maxLength: 50 }
      },
      {
        key: 'licenseNumber',
        label: i18n.translate('petProfile.licenseNumber'),
        type: 'input',
        validation: { maxLength: 50 }
      },
      {
        key: 'licenseExpiryDate',
        label: 'Vencimiento de Licencia',
        type: 'date',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'spayedNeutered',
        label: 'Esterilizado/Castrado',
        type: 'checkbox'
      },
      {
        key: 'spayedNeuteredDate',
        label: i18n.translate('petProfile.sterilizationDate'),
        type: 'date',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'temperament',
        label: 'Temperamento',
        type: 'select',
        options: [
          { label: 'Tranquilo', value: 'calm' },
          { label: i18n.translate('petProfile.energetic'), value: 'energetic' },
          { label: i18n.translate('petProfile.playful'), value: 'playful' },
          { label: i18n.translate('petProfile.shy'), value: 'shy' },
          { label: 'Agresivo', value: 'aggressive' },
          { label: 'Amigable', value: 'friendly' },
          { label: 'Otro', value: 'other' }
        ]
      },
      {
        key: 'energyLevel',
        label: i18n.translate('petProfile.energyLevel'),
        type: 'select',
        options: [
          { label: 'Bajo', value: 'low' },
          { label: 'Medio', value: 'medium' },
          { label: 'Alto', value: 'high' }
        ]
      },
      {
        key: 'trainingLevel',
        label: 'Nivel de Entrenamiento',
        type: 'select',
        options: [
          { label: 'Ninguno', value: 'none' },
          { label: i18n.translate('petProfile.basic'), value: 'basic' },
          { label: 'Intermedio', value: 'intermediate' },
          { label: 'Avanzado', value: 'advanced' }
        ]
      },
      {
        key: 'favoriteActivities',
        label: 'Actividades Favoritas',
        type: 'textarea',
        rows: 2,
        validation: { maxLength: 255 }
      },
      {
        key: 'favoriteFood',
        label: 'Comida Favorita',
        type: 'input',
        validation: { maxLength: 100 }
      },
      {
        key: 'specialNeeds',
        label: 'Necesidades Especiales',
        type: 'textarea',
        rows: 2,
        validation: { maxLength: 500 }
      }
    ]
  };
}

export function petToEditorFormData(pet: PetResponse | null): Record<string, unknown> {
  if (!pet) return {};

  return {
    ...pet,
    species: pet.species.toLowerCase(),
    dateOfBirth: toDate(pet.dateOfBirth),
    lastVaccinationDate: toDate(pet.lastVaccinationDate),
    nextVaccinationDate: toDate(pet.nextVaccinationDate),
    lastVetVisit: toDate(pet.lastVetVisit),
    adoptionDate: toDate(pet.adoptionDate),
    licenseExpiryDate: toDate(pet.licenseExpiryDate),
    spayedNeuteredDate: toDate(pet.spayedNeuteredDate),
    weight: pet.weight ?? null,
    weightUnit: pet.weightUnit || 'kg'
  };
}

export function petEditorDataToRequest(data: Record<string, unknown>): CreatePetRequest {
  return {
    name: String(data['name'] ?? '').trim(),
    species: String(data['species'] ?? ''),
    breed: nullableString(data['breed']),
    dateOfBirth: toIsoDate(data['dateOfBirth']),
    gender: nullableString(data['gender']),
    color: nullableString(data['color']),
    microchipId: nullableString(data['microchipId']),
    bio: nullableString(data['bio']),
    weight: nullableNumber(data['weight']),
    weightUnit: nullableString(data['weightUnit']),
    bloodType: nullableString(data['bloodType']),
    allergies: nullableString(data['allergies']),
    medicalConditions: nullableString(data['medicalConditions']),
    vetName: nullableString(data['vetName']),
    vetPhone: nullableString(data['vetPhone']),
    vetAddress: nullableString(data['vetAddress']),
    lastVaccinationDate: toIsoDate(data['lastVaccinationDate']),
    nextVaccinationDate: toIsoDate(data['nextVaccinationDate']),
    lastVetVisit: toIsoDate(data['lastVetVisit']),
    insuranceProvider: nullableString(data['insuranceProvider']),
    insurancePolicyNumber: nullableString(data['insurancePolicyNumber']),
    emergencyContact: nullableString(data['emergencyContact']),
    emergencyPhone: nullableString(data['emergencyPhone']),
    adoptionDate: toIsoDate(data['adoptionDate']),
    adoptionCenter: nullableString(data['adoptionCenter']),
    registrationNumber: nullableString(data['registrationNumber']),
    licenseNumber: nullableString(data['licenseNumber']),
    licenseExpiryDate: toIsoDate(data['licenseExpiryDate']),
    spayedNeutered: Boolean(data['spayedNeutered']),
    spayedNeuteredDate: toIsoDate(data['spayedNeuteredDate']),
    temperament: nullableString(data['temperament']),
    energyLevel: nullableString(data['energyLevel']),
    trainingLevel: nullableString(data['trainingLevel']),
    favoriteActivities: nullableString(data['favoriteActivities']),
    favoriteFood: nullableString(data['favoriteFood']),
    specialNeeds: nullableString(data['specialNeeds'])
  };
}

function nullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}
