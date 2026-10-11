export type PetCareRole = 'CAREGIVER' | 'VIEWER';
export type PetCareShareStatus = 'PENDING' | 'ACTIVE' | 'DECLINED' | 'REVOKED';
export type PetCareActivityType = 'WALK' | 'MEDICATION' | 'FEEDING' | 'VET_VISIT' | 'OTHER';

export interface PetPassportSettings {
  enabled: boolean;
  token: string | null;
  shareMedical: boolean;
  shareEmergencyContact: boolean;
  shareVet: boolean;
}

export interface PetPassportUpdate {
  enabled: boolean;
  shareMedical: boolean;
  shareEmergencyContact: boolean;
  shareVet: boolean;
}

export interface PetPassport {
  petName: string;
  species: string;
  breed: string | null;
  avatarUrl: string | null;
  bloodType: string | null;
  allergies: string | null;
  medicalConditions: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  vetName: string | null;
  vetPhone: string | null;
  vetAddress: string | null;
}

export interface PetCareSummary {
  petId: string;
  petName: string;
  species: string;
  avatarUrl: string | null;
  owner: boolean;
  role: PetCareRole | null;
}

export interface PetCareShare {
  id: string;
  petId: string;
  petName: string;
  ownerId: string;
  ownerName: string;
  userId: string;
  userName: string;
  role: PetCareRole;
  status: PetCareShareStatus;
  createdAt: string;
}

export interface PetCareActivity {
  id: string;
  petId: string;
  actorId: string;
  actorName: string;
  type: PetCareActivityType;
  notes: string | null;
  occurredAt: string;
}
