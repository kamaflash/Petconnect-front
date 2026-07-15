import { User } from '../entities/user.entity';

export abstract class AuthRepository {
  abstract login(email: string, password: string): Promise<User>;
  abstract register(email: string, password: string, firstName: string, lastName: string): Promise<User>;
  abstract logout(): Promise<void>;
  abstract refreshToken(): Promise<string>;
  abstract getCurrentUser(): Promise<User | null>;
  abstract getToken(): string | null;
  abstract setToken(token: string): void;
  abstract clearToken(): void;
}
