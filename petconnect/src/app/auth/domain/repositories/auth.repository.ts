import { User } from '../entities/user.entity';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileType: 'user' | 'vet' | 'shelter' | 'trainer' | 'seller';
  // Campos adicionales según tipo de usuario
  phone?: string;
  // Veterinario
  licenseNumber?: string;
  specialization?: string;
  clinicPhone?: string;
  // Protectora
  organizationName?: string;
  address?: string;
  contactPhone?: string;
  // Adiestrador
  certification?: string;
  experience?: number;
  // Vendedor
  storeName?: string;
  storePhone?: string;
}

export abstract class AuthRepository {
  abstract login(email: string, password: string): Promise<User>;
  abstract register(data: RegisterData): Promise<User>;
  abstract logout(): Promise<void>;
  abstract refreshToken(): Promise<string>;
  abstract getCurrentUser(): Promise<User | null>;
  abstract getToken(): string | null;
  abstract setToken(token: string): void;
  abstract clearToken(): void;
}
