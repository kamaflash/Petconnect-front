export interface User {
  id: string;
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  dateOfBirth: string | null;
  city: string | null;
  country: string | null;
  profilePublic: boolean;
  notificationsEnabled: boolean;
  profileType: string;
  role: 'USER' | 'ADMIN' | 'PREMIUM';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
