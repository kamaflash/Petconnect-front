import { Component, signal, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../../infrastructure/services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    CheckboxModule,
    RouterLink
  ],
  template: `
<div class="auth-layout" [class.in-modal]="inModal()">
      <!-- Panel izquierdo - Estilo app con imagen de mascotas -->
      <div class="auth-presentation">
        <div class="paw-prints">
          <i class="pi pi-paw paw paw-1"></i>
          <i class="pi pi-paw paw paw-2"></i>
          <i class="pi pi-paw paw paw-3"></i>
          <i class="pi pi-paw paw paw-4"></i>
          <i class="pi pi-paw paw paw-5"></i>
        </div>

        <div class="presentation-content">
          <div class="presentation-logo">
              <img src="https://res.cloudinary.com/dxjcjee8f/image/upload/v1784374711/m9caz3kr9yusdgis1k42.png" alt="Petopia" class="logo-image" />
          </div>

          <div class="presentation-text">
            <h1 class="presentation-title">
              Porque cada  <span class="highlight">huella</span><br>
              merece un hoga.
            </h1>
            <p class="presentation-description">
              La red social para amantes de los animales.
            </p>
          </div>

          <div class="presentation-image">
            <img src="https://res.cloudinary.com/dxjcjee8f/image/upload/v1784375687/b8lzp4yhyz51rrzgz70h.png" alt="Perro, gato y conejo" class="mascotas-image" />
          </div>
        </div>
      </div>

      <!-- Panel derecho - Formulario con Tabs personalizados -->
      <div class="auth-form-panel">
        <div class="form-container">
          <!-- Logo móvil -->
          <div class="mobile-logo">
            <img src="https://res.cloudinary.com/dxjcjee8f/image/upload/v1784374711/m9caz3kr9yusdgis1k42.png" alt="Petopia" class="mobile-logo-image" />
          </div>

          <!-- Tabs personalizados -->
          <div class="auth-tabs">
            <button
              type="button"
              class="tab-button"
              [class.active]="activeTab() === 'login'"
              (click)="activeTab.set('login')"
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              class="tab-button"
              [class.active]="activeTab() === 'register'"
              (click)="activeTab.set('register')"
            >
              Registrarse
            </button>
          </div>

          <!-- Formulario de Login -->
          @if (activeTab() === 'login') {
            <div class="form-header">
              <h2 class="form-title">Bienvenido de nuevo</h2>
              <p class="form-subtitle">Inicia sesión para continuar</p>
            </div>

            <form (ngSubmit)="onSubmit()" class="auth-form">
              <!-- Email -->
              <div class="form-group">
                <input
                  pInputText
                  id="email"
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="Correo electrónico"
                  required
                  class="w-full instagram-input"
                  [class.p-error]="error()"
                />
              </div>

              <!-- Contraseña -->
              <div class="form-group">
                <p-password
                  [(ngModel)]="password"
                  name="password"
                  [feedback]="false"
                  [toggleMask]="true"
                  placeholder="Contraseña"
                  required
                  class="w-full"
                  inputStyleClass="w-full instagram-input"
                  [class.p-error]="error()"
                />
              </div>

              <!-- Mensaje de error -->
              @if (error()) {
                <div class="error-message">
                  <i class="pi pi-exclamation-circle"></i>
                  {{ error() }}
                </div>
              }

              <!-- Botón submit -->
              <button
                type="submit"
                class="instagram-button"
                [class.loading]="loading()"
                [disabled]="loading()"
              >
                <span class="button-content">
                  <i class="pi pi-sign-in"></i>
                  Iniciar Sesión
                </span>
              </button>

              <!-- Separador -->
              <div class="login-divider">
                <span class="divider-line"></span>
                <span class="divider-text">o</span>
                <span class="divider-line"></span>
              </div>

              <!-- Botón Google -->
              <button
                type="button"
                class="google-button-instagram"
                (click)="onGoogleLogin()"
                [class.loading]="googleLoading()"
                [disabled]="loading() || googleLoading()"
              >
                <span class="button-content">
                  <i class="pi pi-google"></i>
                  Iniciar sesión con Google
                </span>
              </button>
            </form>
          }

          <!-- Formulario de Registro -->
          @if (activeTab() === 'register') {
            <div class="form-header">
              <h2 class="form-title">Crear cuenta</h2>
              <p class="form-subtitle">Únete a nuestra comunidad</p>
            </div>

            <form (ngSubmit)="onRegisterSubmit()" class="auth-form">
              <!-- Nombre -->
              <div class="form-group">
                <input
                  pInputText
                  id="firstName"
                  type="text"
                  [(ngModel)]="registerData.firstName"
                  name="firstName"
                  placeholder="Nombre"
                  required
                  class="w-full instagram-input"
                />
              </div>

              <!-- Apellidos -->
              <div class="form-group">
                <input
                  pInputText
                  id="lastName"
                  type="text"
                  [(ngModel)]="registerData.lastName"
                  name="lastName"
                  placeholder="Apellidos"
                  required
                  class="w-full instagram-input"
                />
              </div>

              <!-- Email -->
              <div class="form-group">
                <input
                  pInputText
                  id="registerEmail"
                  type="email"
                  [(ngModel)]="registerData.email"
                  name="email"
                  placeholder="Correo electrónico"
                  required
                  class="w-full instagram-input"
                />
              </div>

              <!-- Contraseña -->
              <div class="form-group">
                <p-password
                  [(ngModel)]="registerData.password"
                  name="password"
                  [feedback]="false"
                  [toggleMask]="true"
                  placeholder="Contraseña"
                  required
                  class="w-full"
                  inputStyleClass="w-full instagram-input"
                />
              </div>

              <!-- Tipo de perfil -->
              <div class="form-group">
                <select
                  id="profileType"
                  [(ngModel)]="registerData.profileType"
                  name="profileType"
                  required
                  class="instagram-input"
                >
                  <option value="">Tipo de perfil</option>
                  <option value="user">Usuario</option>
                  <option value="shelter">Protectora de Animales</option>
                  <option value="vet">Veterinario</option>
                  <option value="seller">Vendedor</option>
                </select>
              </div>

              <!-- Botón submit -->
              <button
                type="submit"
                class="instagram-button"
                [class.loading]="registerLoading()"
                [disabled]="registerLoading()"
              >
                <span class="button-content">
                  <i class="pi pi-user-plus"></i>
                  Registrarse
                </span>
              </button>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== INSTAGRAM-STYLE LAYOUT ===== */
    .auth-layout {
      display: flex;
      min-height: 100vh;
      background: var(--surface-bg);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
    }

    .auth-layout.in-modal {
      min-height: auto;
      position: relative;
      z-index: auto;
    }

    .dark .auth-layout {
      background: var(--surface-bg);
    }

    /* ===== LEFT PANEL - ESTILO APP ===== */
    .auth-presentation {
      flex: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: var(--surface-bg);
      border-right: 1px solid var(--surface-border);
      position: relative;
      overflow: hidden;
    }
.logo-image {
      width: 200px !important;
      height: 200px !important;
    }
    .paw-prints {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      opacity: 0.15;
    }

    .paw {
      position: absolute;
      color: var(--primary-color);
      font-size: 3rem;
    }

    .paw-1 {
      top: 10%;
      left: 15%;
      transform: rotate(15deg);
    }

    .paw-2 {
      top: 20%;
      right: 20%;
      transform: rotate(-20deg);
    }

    .paw-3 {
      bottom: 30%;
      left: 10%;
      transform: rotate(45deg);
    }

    .paw-4 {
      bottom: 15%;
      right: 15%;
      transform: rotate(-10deg);
    }

    .paw-5 {
      top: 50%;
      right: 8%;
      transform: rotate(30deg);
    }

    .presentation-content {
      max-width: 500px;
      color: var(--text-primary);
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
      gap: 2rem;
    }

    .presentation-logo {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
      align-self: flex-start;
    }

    .logo-icon {
      width: 56px;
      height: 56px;
      background: var(--primary-color);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-md);
    }

    .logo-icon i {
      color: white;
      font-size: 1.75rem;
    }

    .logo-text {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--text-primary);
    }

    .presentation-text {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-self: flex-start;
    }

    .presentation-title {
      font-size: 3rem;
      font-weight: 800;
      line-height: 1.2;
      margin: 0;
      letter-spacing: -0.03em;
      color: var(--text-primary);
    }

    .presentation-title .highlight {
      color: var(--primary-color);
    }

    .presentation-description {
      font-size: 1.125rem;
      line-height: 1.6;
      margin: 0;
      color: var(--text-secondary);
      font-weight: 400;
    }

    .presentation-image {
      width: 100%;
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }

    .mascotas-image {
      max-width: 100%;
      height: auto;
    }

    /* ===== MOBILE LOGO ===== */
    .mobile-logo {
      display: none;
      text-align: center;
      margin-bottom: 1.5rem;
      position: sticky;
      top: 0;
      background: var(--surface-card);
      padding: 1rem 0;
      z-index: 10;
    }

    .mobile-logo-image {
      width: 120px;
      height: 120px;
    }

    /* ===== RIGHT PANEL - FORM ===== */
    .auth-form-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: var(--surface-card);
      min-width: 400px;
    }

    .form-container {
      width: 100%;
      max-width: 380px;
    }

    .form-header {
      margin-bottom: 2.5rem;
    }

    .form-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.02em;
    }

    .form-subtitle {
      color: var(--text-secondary);
      font-size: 1rem;
      margin: 0;
      font-weight: 400;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    /* ===== TABS ===== */
    .auth-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--surface-border);
      position: sticky;
      top: 0;
      background: var(--surface-card);
      padding-top: 0.5rem;
      z-index: 10;
    }

    .tab-button {
      flex: 1;
      padding: 0.75rem 1rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-secondary);
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      bottom: -1px;
    }

    .tab-button:hover {
      color: var(--text-primary);
    }

    .tab-button.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
      font-weight: 600;
    }

    /* ===== INPUTS ===== */
    .instagram-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 1.5px solid var(--surface-border);
      border-radius: 12px;
      background: var(--surface-card);
      color: var(--text-primary);
      font-size: 0.95rem;
      transition: all 0.2s ease;
      outline: none;
    }

    .instagram-input::placeholder {
      color: var(--text-tertiary);
    }

    .instagram-input:hover {
      border-color: #cbd5e1;
    }

    .instagram-input:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.15);
    }

    .instagram-input.p-error {
      border-color: #dc2626;
    }

    .dark .instagram-input {
      background: var(--surface-hover);
      border-color: var(--surface-border);
      color: var(--text-primary);
    }

    .dark .instagram-input:hover {
      border-color: #525252;
    }

    .dark .instagram-input:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.25);
    }

    /* ===== ERROR ===== */
    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1rem;
      background: rgba(220, 38, 38, 0.08);
      border: 1px solid rgba(220, 38, 38, 0.2);
      border-radius: 12px;
      color: #dc2626;
      font-size: 0.875rem;
    }

    .dark .error-message {
      background: rgba(220, 38, 38, 0.15);
      border-color: rgba(220, 38, 38, 0.3);
      color: #f87171;
    }

    .error-message i {
      font-size: 1rem;
      flex-shrink: 0;
    }

    /* ===== BUTTONS ===== */
    .instagram-button {
      width: 100%;
      padding: 0.875rem 1rem;
      border: none;
      border-radius: 12px;
      background: var(--primary-color);
      color: white;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }

    .instagram-button:hover:not(:disabled) {
      background: var(--primary-color-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.3);
    }

    .instagram-button:active:not(:disabled) {
      transform: translateY(0);
    }

    .instagram-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .instagram-button.loading {
      opacity: 0.85;
      cursor: wait;
    }

    .button-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .button-content i {
      font-size: 1.1rem;
    }

    /* ===== GOOGLE BUTTON ===== */
    .google-button-instagram {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 1.5px solid var(--surface-border);
      border-radius: 12px;
      background: var(--surface-card);
      color: var(--text-primary);
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }

    .google-button-instagram:hover:not(:disabled) {
      background: var(--surface-hover);
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }

    .google-button-instagram:active:not(:disabled) {
      transform: translateY(0);
    }

    .google-button-instagram:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .google-button-instagram.loading {
      opacity: 0.85;
    }

    .dark .google-button-instagram {
      background: var(--surface-hover);
      border-color: var(--surface-border);
      color: var(--text-primary);
    }

    .dark .google-button-instagram:hover:not(:disabled) {
      background: var(--surface-card);
      border-color: #525252;
    }

    /* ===== DIVIDER ===== */
    .login-divider {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 0.5rem 0;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: var(--surface-border);
    }

    .divider-text {
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0 0.5rem;
    }

    /* ===== FOOTER ===== */
    .form-footer {
      margin-top: 1.5rem;
      text-align: center;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .register-link-text {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 600;
      margin-left: 0.25rem;
      transition: color 0.2s ease;
    }

    .register-link-text:hover {
      color: var(--primary-color-hover);
      text-decoration: underline;
    }

    /* ===== PRIMENG OVERRIDES ===== */
    :host ::ng-deep .p-password {
      width: 100%;
    }

    :host ::ng-deep .p-password input {
      width: 100% !important;
      padding: 0.875rem 1rem;
      border: 1.5px solid var(--surface-border);
      border-radius: 12px;
      background: var(--surface-card);
      color: var(--text-primary);
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }

    :host ::ng-deep .p-password input:hover {
      border-color: #cbd5e1;
    }

    :host ::ng-deep .p-password input:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.15);
    }

    :host ::ng-deep .p-password input.p-error {
      border-color: #dc2626;
    }

    :host ::ng-deep .p-checkbox .p-checkbox-box {
      border: 1.5px solid var(--surface-border);
      background: var(--surface-card);
      border-radius: 6px;
      width: 18px;
      height: 18px;
    }

    :host ::ng-deep .p-checkbox .p-checkbox-box.p-highlight {
      background: var(--primary-color);
      border-color: var(--primary-color);
    }

    :host ::ng-deep .p-checkbox .p-checkbox-box.p-highlight:hover {
      background: var(--primary-color-hover);
      border-color: var(--primary-color-hover);
    }

    :host ::ng-deep .p-checkbox .p-checkbox-box .p-checkbox-icon {
      font-size: 12px;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1024px) {
      .auth-presentation {
        padding: 2rem;
      }

      .presentation-title {
        font-size: 2.5rem;
      }

      .mascotas-image {
        max-width: 90%;
      }

      .auth-form-panel {
        padding: 2rem;
        min-width: 350px;
      }
    }

    @media (max-width: 768px) {
      .auth-layout {
        flex-direction: column;
      }

      .auth-presentation {
        display: none;
      }

      .mobile-logo {
        display: block;
        position: sticky;
        top: 0;
        background: var(--surface-card);
        z-index: 10;
      }

      .auth-tabs {
        position: sticky;
        top: 0;
        background: var(--surface-card);
        z-index: 10;
      }

      .auth-form-panel {
        padding: 0 1.5rem 2rem 1.5rem;
        min-width: auto;
        flex: 1;
        overflow-y: auto;
      }

      .form-container {
        max-width: 100%;
      }
    }

    @media (max-width: 480px) {
      .auth-presentation {
        padding: 1.5rem 1rem;
        min-height: auto;
      }

      .presentation-title {
        font-size: 1.75rem;
      }

      .mascotas-image {
        max-width: 70%;
      }

      .paw {
        font-size: 1.5rem;
      }

      .auth-form-panel {
        padding: 1.5rem 1rem;
      }

      .form-title {
        font-size: 1.5rem;
      }
    }
  `]
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ===== Inputs para modal =====
  inModal = input<boolean>(false);
  closeModal = output<void>();
  loginSuccess = output<void>();

  // ===== Form Data =====
  email = '';
  password = '';
  rememberMe = false;

  // ===== Register Form Data =====
  registerData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    profileType: ''
  };

  // ===== Estado =====
  loading = signal(false);
  googleLoading = signal(false);
  registerLoading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'login' | 'register'>('login');

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.error.set('Por favor, completa todos los campos');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      await this.authService.login(this.email, this.password);

      // Si está en modal, emitir eventos
      if (this.inModal()) {
        this.loginSuccess.emit();
        this.closeModal.emit();
      } else {
        this.router.navigate(['/']);
      }
    } catch (err) {
      this.error.set('Credenciales incorrectas. Por favor, intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  async onGoogleLogin(): Promise<void> {
    this.googleLoading.set(true);
    this.error.set(null);

    try {
      // Aquí llamas a tu servicio de Google
      // await this.authService.loginWithGoogle();

      // Simulación de login con Google
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Login con Google exitoso');

      if (this.inModal()) {
        this.loginSuccess.emit();
        this.closeModal.emit();
      } else {
        this.router.navigate(['/']);
      }
    } catch (err) {
      this.error.set('Error al iniciar sesión con Google. Por favor, intenta de nuevo.');
    } finally {
      this.googleLoading.set(false);
    }
  }

  async onRegisterSubmit(): Promise<void> {
    if (!this.registerData.firstName || !this.registerData.lastName ||
        !this.registerData.email || !this.registerData.password ||
        !this.registerData.profileType) {
      this.error.set('Por favor, completa todos los campos');
      return;
    }

    this.registerLoading.set(true);
    this.error.set(null);

    try {
      await this.authService.register(
        this.registerData.email,
        this.registerData.password,
        this.registerData.firstName,
        this.registerData.lastName,
        this.registerData.profileType
      );
      this.router.navigate(['/']);
    } catch (err) {
      this.error.set('Error al registrarse. Por favor, intenta de nuevo.');
    } finally {
      this.registerLoading.set(false);
    }
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    console.log('Navegar a recuperar contraseña');
    // this.router.navigate(['/auth/forgot-password']);
  }
}
