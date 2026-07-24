import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthRepository, RegisterData } from '../../domain/repositories/auth.repository';
import { User } from '../../domain/entities/user.entity';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends AuthRepository {
  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<User | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    super();
    this.loadFromStorage();
  }

  async login(email: string, password: string): Promise<User> {
    const response = await this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).toPromise();

    if (response) {
      // Guardar refresh token en sessionStorage
      if (response.refreshToken) {
        sessionStorage.setItem('refresh_token', response.refreshToken);
      }

       const user: User = {
          id: response.userId, // This is the authUserId - the unique identifier for the user
          email: response.email,
          firstName: response.profile.firstName,
          lastName: response.profile.lastName,
          phone: response.profile.phone,
          bio: response.profile.bio,
          avatarUrl: response.profile.avatarUrl,
          coverImageUrl: response.profile.coverImageUrl,
          dateOfBirth: response.profile.dateOfBirth,
           location: response.profile.location,
           latitude: response.profile.latitude,
           longitude: response.profile.longitude,
           profilePublic: response.profile.profilePublic,
           notificationsEnabled: response.profile.notificationsEnabled,
           profileType: response.profile.profileType,
           role: response.role as 'USER' | 'ADMIN' | 'PREMIUM',
           isVerified: false,
           createdAt: new Date(),
           updatedAt: new Date()
         };
      this._user.set(user);
      this._token.set(response.accessToken);
      this.saveToStorage();
      return user;
    }
    throw new Error('Login failed');
  }

  async register(data: RegisterData): Promise<User> {
    const response = await this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).toPromise();

    if (response) {
      // Guardar refresh token en sessionStorage
      if (response.refreshToken) {
        sessionStorage.setItem('refresh_token', response.refreshToken);
      }

      const user: User = {
          id: response.userId, // This is the authUserId - the unique identifier for the user
          email: response.email,
          firstName: response.profile.firstName,
          lastName: response.profile.lastName,
          phone: response.profile.phone,
          bio: response.profile.bio,
          avatarUrl: response.profile.avatarUrl,
          coverImageUrl: response.profile.coverImageUrl,
          dateOfBirth: response.profile.dateOfBirth,
           location: response.profile.location,
           latitude: response.profile.latitude,
           longitude: response.profile.longitude,
           profilePublic: response.profile.profilePublic,
           notificationsEnabled: response.profile.notificationsEnabled,
           profileType: response.profile.profileType,
           role: response.role as 'USER' | 'ADMIN' | 'PREMIUM',
           isVerified: false,
           createdAt: new Date(),
           updatedAt: new Date()
         };
      this._user.set(user);
      this._token.set(response.accessToken);
      this.saveToStorage();
      return user;
    }
    throw new Error('Registration failed');
  }

  async logout(): Promise<void> {
    this._user.set(null);
    this._token.set(null);
    // Limpiar refresh token
    sessionStorage.removeItem('refresh_token');
  }

  async refreshToken(): Promise<string> {
    // El refreshToken se guarda en sessionStorage
    const refreshToken = sessionStorage.getItem('refresh_token');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.http.post<RefreshTokenResponse>(`${this.apiUrl}/auth/refresh`, {
      refreshToken: refreshToken
    }).toPromise();

    if (response) {
      this._token.set(response.accessToken);
      // Guardar el nuevo refresh token si viene en la respuesta
      if (response.refreshToken) {
        sessionStorage.setItem('refresh_token', response.refreshToken);
      }
      return response.accessToken;
    }
    throw new Error('Token refresh failed');
  }

  async getCurrentUser(): Promise<User | null> {
    return this._user();
  }

  getToken(): string | null {
    return this._token();
  }

  setToken(token: string): void {
    this._token.set(token);
  }

  clearToken(): void {
    this._token.set(null);
  }

  private saveToStorage(): void {
    if (this._token()) {
      sessionStorage.setItem('auth_token', this._token()!);
    }
    if (this._user()) {
      sessionStorage.setItem('auth_user', JSON.stringify(this._user()));
    }
    // Guardar refresh token si existe
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (refreshToken) {
      sessionStorage.setItem('refresh_token', refreshToken);
    }
  }

  private loadFromStorage(): void {
    const token = sessionStorage.getItem('auth_token');
    const userJson = sessionStorage.getItem('auth_user');

    if (token) {
      this._token.set(token);
    }
    if (userJson) {
      this._user.set(JSON.parse(userJson));
    }
  }

  // Actualizar usuario en el estado y en storage
  updateUser(user: User): void {
    this._user.set(user);
    this.saveToStorage();
  }
}

interface AuthResponse {
  userId: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  profile: {
    id: string;
    authUserId: string;
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
  };
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
