import { User } from './entities/user.entity';

const PROFESSIONAL_PROFILE_TYPES = new Set(['vet', 'seller', 'shelter', 'trainer']);

export function isProfessionalProfile(user: User | null | undefined): boolean {
  return Boolean(user && PROFESSIONAL_PROFILE_TYPES.has(user.profileType.toLowerCase()));
}

export function canAccessManagementSpace(user: User | null | undefined): boolean {
  return user?.role === 'ADMIN' || isProfessionalProfile(user);
}
