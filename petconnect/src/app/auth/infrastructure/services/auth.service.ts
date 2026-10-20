import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthRepository, RegisterData } from '../../domain/repositories/auth.repository';
import { User } from '../../domain/entities/user.entity';
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

  /**
   * True si el usuario ha completado el onboarding (perfil con los datos
   * obligatorios de su tipo). Se mantiene en un signal propio para poder
   * actualizarlo de inmediato tras guardar el perfil, sin esperar al
   * siguiente refresh del token (el claim JWT puede quedar desactualizado).
   */
  private readonly _profileComplete = signal(false);
  readonly profileComplete = this._profileComplete.asReadonly();

  /** Controla el refresh concurrente (evita varios POST /auth/refresh simultáneos) */
  private readonly _isRefreshing = signal(false);
  readonly isRefreshing = this._isRefreshing.asReadonly();

  /** Notifica el nuevo token a las peticiones que esperan el refresh */
  private readonly _refreshSubject = new BehaviorSubject<string | null>(null);

  /** Timer del refresh proactivo. Se cancela cuando el token cambia. */
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    super();
    this.loadFromStorage();
    this.setupProactiveRefresh();
  }

  // ===================================================================
  //  JWT helpers (sin dependencias externas)
  // ===================================================================

  /** Decodifica el payload del JWT (segunda parte) */
  private decodeJwt(token: string): Record<string, unknown> | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      // base64url -> base64
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /** Marca de tiempo de expiración del token (ms desde epoch) */
  private getTokenExpiry(token: string): number {
    const payload = this.decodeJwt(token);
    const exp = payload?.['exp'];
    return typeof exp === 'number' ? exp * 1000 : 0;
  }

  /** True cuando el token está expirado o expirará en los próximos 30 s */
  isTokenExpired(): boolean {
    const token = this._token();
    if (!token) return true;
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return true;
    return Date.now() >= expiry - 30_000;
  }

  // ===================================================================
  //  Autenticación
  // ===================================================================

  async login(email: string, password: string): Promise<User> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
    );
    if (!response) {
      throw new Error('Login failed');
    }
    return this.handleAuthResponse(response, false);
  }

  async register(data: RegisterData): Promise<User> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data)
    );
    if (!response) {
      throw new Error('Registration failed');
    }
    return this.handleAuthResponse(response, true);
  }

  /** Login usando el ID token emitido por Google Identity Services. */
  async loginWithGoogle(idToken: string): Promise<User> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/auth/google`, { idToken })
    );
    if (!response) {
      throw new Error('Google login failed');
    }
    return this.handleAuthResponse(response, true);
  }

  /** Procesa la respuesta de login/register/google y persiste el estado. */
  private handleAuthResponse(response: AuthResponse, isVerified = false): User {
    // Guardar refresh token en sessionStorage
    if (response.refreshToken) {
      sessionStorage.setItem('refresh_token', response.refreshToken);
    }

    const user: User = {
      id: response.userId,
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
      isVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileComplete: response.profileComplete ?? response.profile.profileComplete ?? false
    };
    this._user.set(user);
    this._profileComplete.set(user.profileComplete);
    this._token.set(response.accessToken);
    this.saveToStorage();
    return user;
  }

  /**
   * Marca el perfil como completado en el estado local.
   *
   * Se llama justo después de guardar el perfil en el onboarding para que el
   * guard no bloquee al usuario con un claim JWT desactualizado.
   */
  setProfileComplete(complete: boolean): void {
    this._profileComplete.set(complete);
    const current = this._user();
    if (current) {
      this.updateUser({ ...current, profileComplete: complete });
    }
  }

    logout(): Promise<void> {
    this._user.set(null);
    this._token.set(null);
    // Limpiar TODO el storage de autenticación
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_profile_complete');
    sessionStorage.removeItem('refresh_token');
    this._refreshSubject.next(null);
    this.clearRefreshTimer();
    this._profileComplete.set(false);
    return Promise.resolve();
  }

  // ===================================================================
  //  Refresh token (con control de concurrencia)
  // ===================================================================

  async refreshToken(): Promise<string> {
    // Si ya hay un refresh en curso, esperar al resultado compartido
    if (this._isRefreshing()) {
      return firstValueFrom(
        this._refreshSubject.pipe(filter((t): t is string => t !== null))
      );
    }

    // El refreshToken se guarda en sessionStorage
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this._isRefreshing.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<RefreshTokenResponse>(`${this.apiUrl}/auth/refresh`, {
          refreshToken
        })
      );

      if (!response) {
        throw new Error('Token refresh failed');
      }

      this._token.set(response.accessToken);
      // Guardar el nuevo refresh token si viene en la respuesta
      if (response.refreshToken) {
        sessionStorage.setItem('refresh_token', response.refreshToken);
      }
      // El backend recalcula la completitud en cada refresh: se sincroniza
      // para que el guard no use un estado obsoleto.
      if (typeof response.profileComplete === 'boolean') {
        this.setProfileComplete(response.profileComplete);
      }
      this.saveToStorage();
      this._refreshSubject.next(response.accessToken);
      return response.accessToken;
    } finally {
      this._isRefreshing.set(false);
    }
  }

  // ===================================================================
  //  Usuario y utilidades
  // ===================================================================

    getCurrentUser(): Promise<User | null> {
    return Promise.resolve(this._user());
  }

  getToken(): string | null {
    return this._token();
  }

  setToken(token: string): void {
    this._token.set(token);
    this.saveToStorage();
  }

  clearToken(): void {
    this._token.set(null);
    sessionStorage.removeItem('auth_token');
  }

  // ===================================================================
  //  Persistencia
  // ===================================================================

  private saveToStorage(): void {
    if (this._token()) {
      sessionStorage.setItem('auth_token', this._token()!);
    }
    if (this._user()) {
      sessionStorage.setItem('auth_user', JSON.stringify(this._user()));
    }
    sessionStorage.setItem('auth_profile_complete', String(this._profileComplete()));
  }

  private loadFromStorage(): void {
    const token = sessionStorage.getItem('auth_token');
    const userJson = sessionStorage.getItem('auth_user');

    if (token) {
      this._token.set(token);
    }
    if (userJson) {
            this._user.set(JSON.parse(userJson) as User);
    }
    // El estado de completitud se restaura desde el storage; si no está,
    // se deduce del usuario persistido.
    const storedComplete = sessionStorage.getItem('auth_profile_complete');
    if (storedComplete !== null) {
      this._profileComplete.set(storedComplete === 'true');
    } else {
      this._profileComplete.set(this._user()?.profileComplete ?? false);
    }
  }

  // Actualizar usuario en el estado y en storage
  updateUser(user: User): void {
    this._user.set(user);
    this.saveToStorage();
  }

  // ===================================================================
  //  Refresh proactivo (antes de que expire)
  // ===================================================================

  /**
   * Programa un refresh silencioso ~60 s antes de que el JWT expire.
   * Se reprograma automáticamente cada vez que el token cambia
   * (login, refresh reactivo, etc.).
   */
  private setupProactiveRefresh(): void {
    effect(() => {
      const token = this._token();
      if (!token) {
        this.clearRefreshTimer();
        return;
      }

      const expiry = this.getTokenExpiry(token);
      if (!expiry) return; // sin claim `exp`, no podemos programar

      // Refrescar 60 s antes de la expiración
      const msUntilRefresh = expiry - 60_000 - Date.now();
      if (msUntilRefresh <= 0) return; // ya expiró -> el interceptor lo maneja

      this.clearRefreshTimer();
      this.refreshTimer = setTimeout(() => {
        this.refreshTimer = null;
        if (!this._token()) return; // usuario deslogueado
        this.refreshToken().catch(() => {
          // Si falla el refresh proactivo, el interceptor reactivo
          // hará logout cuando la siguiente peticion reciba 401.
        });
      }, msUntilRefresh);
    });
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

interface AuthResponse {
  userId: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  /** True si la cuenta acaba de crearse (registro o primer acceso con Google). */
  newUser?: boolean;
  /** True si el perfil tiene los datos obligatorios de su tipo. */
  profileComplete?: boolean;
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
    profileComplete?: boolean;
  };
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  /** Completitud del perfil recalculada por el backend. */
  profileComplete?: boolean;
}