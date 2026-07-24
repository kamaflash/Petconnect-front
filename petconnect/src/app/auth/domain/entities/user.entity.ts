export interface User {
  /** Unique identifier - maps to authUserId from backend (the user's auth ID) */
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  dateOfBirth: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  profilePublic: boolean;
  notificationsEnabled: boolean;
  profileType: string;
  role: 'USER' | 'ADMIN' | 'PREMIUM';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
