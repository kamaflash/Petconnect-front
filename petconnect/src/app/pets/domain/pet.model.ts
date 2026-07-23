export interface PetResponse {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bio: string | null;
  avatarUrl: string | null;
  imageUrls: string[] | null;
  weight: number | null;
  weightUnit: string | null;
  active: boolean;
  microchipId: string | null;
  color: string | null;
  bloodType: string | null;
  allergies: string | null;
  medicalConditions: string | null;
  vetName: string | null;
  vetPhone: string | null;
  vetAddress: string | null;
  lastVaccinationDate: string | null;
  nextVaccinationDate: string | null;
  lastVetVisit: string | null;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  adoptionDate: string | null;
  adoptionCenter: string | null;
  registrationNumber: string | null;
  licenseNumber: string | null;
  licenseExpiryDate: string | null;
  spayedNeutered: boolean;
  spayedNeuteredDate: string | null;
  temperament: string | null;
  energyLevel: string | null;
  trainingLevel: string | null;
  favoriteActivities: string | null;
  favoriteFood: string | null;
  specialNeeds: string | null;
  lastKnownLocation: string | null;
  lost: boolean;
  lostDate: string | null;
  availableForAdoption: boolean;
}

export interface CreatePetRequest {
  name: string;
  species: string;
  breed?: string;
  dateOfBirth?: string;
  gender?: string;
  color?: string | null;
  microchipId?: string | null;
}
