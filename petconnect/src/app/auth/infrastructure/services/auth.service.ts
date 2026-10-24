import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthRepository, RegisterData } from '../../domain/repositories/auth.repository';
import { User } from '../../domain/entities/user.entity';
import { environment } from '../../../../environments/environment';

/** Cache no sensible (perfil publico) para pintar antes de GET /session. */
const SESSION_KEY = 'pc_session_user';
const SESSION_COMPLETE_KEY = 'pc_session_complete';

/**
 * Sesion por cookies HttpOnly (PC_AT/PC_RT) gestionadas por el backend.
 * El frontend nunca ve ni guarda tokens: solo el perfil publico en memoria
 * (+ cache no sensible en sessionStorage) y envia credenciales con
 * withCredentials. CSRF via cookie XSRF-TOKEN + cabecera X-XSRF-TOKEN.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService extends AuthRepository {
  private readonly _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  /** True cuando termino el intento inicial de restaurar sesion. */
  private readonly _sessionReady = signal(false);
  readonly sessionReady = this._sessionReady.asReadonly();

  private readonly _profileComplete = signal(false);
  readonly profileComplete = this._profileComplete.asReadonly();

  /** Controla el refresh concurrente (evita varios POST /auth/refresh). */
  private readonly _isRefreshing = signal(false);
  readonly isRefreshing = this._isRefreshing.asReadonly();

  /** Notifica el fin del refresh a las peticiones que esperan. */
  private readonly _refreshSubject = new BehaviorSubject<boolean | null>(null);

  private readonly apiUrl = environment.apiUrl;

  /**
   * Token CSRF en memoria.
   *
   * La cookie `XSRF-TOKEN` la emite el backend en el host de la API. Cuando
   * el front y la API comparten origen (desarrollo) el navegador la expone en
   * `document.cookie`, pero en produccion (`petconnect.com` vs
   * `api.petconnect.com`) la cookie vive en el host de la API y no es
   * legible desde el front. Por eso el backend tambien devuelve el token en
   * el cuerpo de `/csrf-token` y aqui se guarda en memoria para reenviarlo en
   * la cabecera `X-XSRF-TOKEN`.
   */
  private csrfToken: string | null = null;

  constructor(private http: HttpClient) {
    super();
    this.loadCachedSession();
  }

  /** Token CSRF actual (memoria o cookie), o null si aun no se ha obtenido. */
  getCsrfToken(): string | null {
    if (this.csrfToken) {
      return this.csrfToken;
    }
    return this.readCsrfCookie();
  }

  /** Guarda el token CSRF en memoria. */
  setCsrfToken(token: string | null): void {
    this.csrfToken = token;
  }

  /** Lee la cookie `XSRF-TOKEN` (solo funciona si es same-origin). */
  private readCsrfCookie(): string | null {
    if (typeof document === 'undefined' || !document.cookie) {
      return null;
    }
    for (const part of document.cookie.split(';')) {
      const [name, ...rest] = part.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(rest.join('='));
      }
    }
    return null;
  }

  async login(email: string, password: string): Promise<User> {
    const response = await firstValueFrom(
      this.http.post<SessionResponse>(`${this.apiUrl}/auth/login`, { email, password }, { withCredentials: true })
    );
    if (!response) {
      throw new Error('Login failed');
    }
    const user = this.handleAuthResponse(response, false);
    await this.ensureCsrfToken();
    return user;
  }

  async register(data: RegisterData): Promise<User> {
    const response = await firstValueFrom(
      this.http.post<SessionResponse>(`${this.apiUrl}/auth/register`, data, { withCredentials: true })
    );
    if (!response) {
      throw new Error('Registration failed');
    }
    const user = this.handleAuthResponse(response, true);
    await this.ensureCsrfToken();
    return user;
  }

  /** Login usando el ID token emitido por Google Identity Services. */
  async loginWithGoogle(idToken: string): Promise<User> {
    const response = await firstValueFrom(
      this.http.post<SessionResponse>(`${this.apiUrl}/auth/google`, { idToken }, { withCredentials: true })
    );
    if (!response) {
      throw new Error('Google login failed');
    }
    const user = this.handleAuthResponse(response, true);
    await this.ensureCsrfToken();
    return user;
  }

  /** Procesa la respuesta de sesion (sin tokens: viajan en cookies HttpOnly). */
  private handleAuthResponse(response: SessionResponse, isVerified = false): User {
    // El perfil puede no existir todavia (cuenta creada sin perfil asociado).
    const profile = response.profile;
    const user: User = {
      id: response.userId,
      email: response.email,
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phone: profile?.phone ?? null,
      bio: profile?.bio ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      coverImageUrl: profile?.coverImageUrl ?? null,
      dateOfBirth: profile?.dateOfBirth ?? null,
      location: profile?.location ?? null,
      latitude: profile?.latitude ?? null,
      longitude: profile?.longitude ?? null,
      profilePublic: profile?.profilePublic ?? true,
      notificationsEnabled: profile?.notificationsEnabled ?? true,
      profileType: profile?.profileType ?? 'user',
      role: response.role as 'USER' | 'ADMIN' | 'PREMIUM',
      isVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileComplete: response.profileComplete ?? profile?.profileComplete ?? false
    };
    this._user.set(user);
    this._profileComplete.set(user.profileComplete);
    this.cacheSession();
    return user;
  }
  /**
   * Marca el perfil como completado en el estado local.
   * Se llama justo despues de guardar el perfil en el onboarding.
   */
  setProfileComplete(complete: boolean): void {
    this._profileComplete.set(complete);
    const current = this._user();
    if (current) {
      this.updateUser({ ...current, profileComplete: complete });
    }
  }

  /** Cierra la sesion: revoca en backend (borra cookies) y limpia el estado. */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true })
      );
    } catch {
      // Aunque falle la red, la sesion local se limpia igual.
    }
    this.clearLocalSession();
  }

  private clearLocalSession(): void {
    this._user.set(null);
    this._profileComplete.set(false);
    this._sessionReady.set(true);
    // El token CSRF queda invalidado al revocar la sesion: se descarta para
    // que la siguiente mutacion no lo reutilice.
    this.setCsrfToken(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_COMPLETE_KEY);
    } catch { /* storage no disponible */ }
    this._refreshSubject.next(null);
  }

  /**
   * Restaura la sesion tras recargar (GET /session con cookie PC_AT). Si el
   * access expiro pero el refresh sigue vivo, reintenta tras POST /refresh.
   * Un solo intento de refresh como maximo (sin bucles).
   */
  async restoreSession(): Promise<User | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<SessionResponse>(`${this.apiUrl}/auth/session`, { withCredentials: true })
      );
      const user = this.handleAuthResponse(response, true);
      await this.ensureCsrfToken();
      this._sessionReady.set(true);
      return user;
    } catch {
      try {
        await this.refreshToken();
        const response = await firstValueFrom(
          this.http.get<SessionResponse>(`${this.apiUrl}/auth/session`, { withCredentials: true })
        );
        const user = this.handleAuthResponse(response, true);
        await this.ensureCsrfToken();
        this._sessionReady.set(true);
        return user;
      } catch {
        this.clearLocalSession();
        return null;
      }
    }
  }

  /**
   * Refresh reactivo (el navegador envia la cookie PC_RT automaticamente).
   * Con control de concurrencia: una sola peticion en vuelo.
   */
  async refreshToken(): Promise<void> {
    if (this._isRefreshing()) {
      await firstValueFrom(
        this._refreshSubject.pipe(filter((v): v is boolean => v !== null))
      );
      return;
    }
    this._isRefreshing.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<SessionResponse>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      );
      if (!response) {
        throw new Error('Token refresh failed');
      }
      this.handleAuthResponse(response, true);
      // Tras rotar la sesion el token CSRF puede haber caducado: se pide uno
      // nuevo para que las siguientes mutaciones no fallen con 403.
      await this.ensureCsrfToken();
      this._refreshSubject.next(true);
    } catch (error) {
      this._refreshSubject.next(false);
      throw error;
    } finally {
      this._isRefreshing.set(false);
    }
  }

  /**
   * Obtiene la cookie XSRF-TOKEN tras el login (incluido Google) para poder
   * hacer escrituras posteriores. Retorna una promesa que se resuelve cuando
   * la cookie está establecida (o falla silenciosamente si el endpoint no
   * responde), para que el caller pueda awaitarla antes de navegar o escribir.
   */
  async ensureCsrfToken(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<CsrfTokenResponse>(`${this.apiUrl}/csrf-token`, { withCredentials: true })
      );
      // El backend devuelve el token en el cuerpo y en la cabecera
      // `X-XSRF-TOKEN`; se guarda en memoria para reenviarlo en las
      // mutaciones (imprescindible en cross-origin, donde la cookie del host
      // de la API no es legible desde `document.cookie`).
      const token = response?.token;
      if (token) {
        this.setCsrfToken(token);
        return;
      }
      // Fallback same-origin: usar la cookie emitida por el backend.
      const fromCookie = this.readCsrfCookie();
      if (fromCookie) {
        this.setCsrfToken(fromCookie);
      }
    } catch {
      // Si falla, continuamos: las escrituras posteriores devolverán 403 CSRF
      // y el frontend podrá reintentar ensureCsrfToken() si es necesario.
    }
  }

  getCurrentUser(): Promise<User | null> {
    return Promise.resolve(this._user());
  }

  private cacheSession(): void {
    try {
      if (this._user()) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(this._user()));
      }
      sessionStorage.setItem(SESSION_COMPLETE_KEY, String(this._profileComplete()));
    } catch { /* storage no disponible */ }
  }

  private loadCachedSession(): void {
    try {
      const userJson = sessionStorage.getItem(SESSION_KEY);
      if (userJson) {
        this._user.set(JSON.parse(userJson) as User);
      }
      const storedComplete = sessionStorage.getItem(SESSION_COMPLETE_KEY);
      if (storedComplete !== null) {
        this._profileComplete.set(storedComplete === 'true');
      } else {
        this._profileComplete.set(this._user()?.profileComplete ?? false);
      }
    } catch { /* storage no disponible */ }
  }

  // Actualizar usuario en el estado y en cache
  updateUser(user: User): void {
    this._user.set(user);
    this.cacheSession();
  }
}

/** Respuesta de GET /api/v1/csrf-token con el token para el double-submit. */
interface CsrfTokenResponse {
  token: string;
}

interface SessionResponse {
  userId: string;
  email: string;
  role: string;
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
