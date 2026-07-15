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
    <div class="login-page" [class.in-modal]="inModal()">
      <div class="login-container auth-card">
        <!-- Logo -->
        <div class="login-header">
          <div class="login-logo">
            <div class="login-logo-icon">
              <i class="pi pi-paw"></i>
            </div>
            <span class="login-logo-text">PetConnect</span>
          </div>
          <p class="login-subtitle">
            Inicia sesión en tu cuenta
          </p>
        </div>

        <!-- Formulario -->
        <form (ngSubmit)="onSubmit()" class="login-form">
          <!-- Email -->
          <div class="form-group">
            <label for="email" class="form-label">
              Correo electrónico
            </label>
            <input
              pInputText
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="usuario@email.com"
              required
              class="w-full"
              [class.p-error]="error()"
            />
          </div>

          <!-- Contraseña -->
          <div class="form-group">
            <label for="password" class="form-label">
              Contraseña
            </label>
            <p-password
              [(ngModel)]="password"
              name="password"
              [feedback]="false"
              [toggleMask]="true"
              placeholder="Ingresa tu contraseña"
              required
              class="w-full"
              inputStyleClass="w-full"
              [class.p-error]="error()"
            />
          </div>

          <!-- Recordar y Olvidé contraseña -->
          <div class="login-options">
            <div class="flex items-center gap-2">
              <p-checkbox
                [(ngModel)]="rememberMe"
                name="rememberMe"
                [binary]="true"
                inputId="remember"
              ></p-checkbox>
              <label for="remember" class="remember-label">
                Recordarme
              </label>
            </div>
            <a href="#" class="forgot-link" (click)="onForgotPassword($event)">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <!-- Mensaje de error -->
          @if (error()) {
            <div class="error-message">
              <i class="pi pi-exclamation-circle"></i>
              {{ error() }}
            </div>
          }

          <!-- Botón submit -->
          <p-button
            type="submit"
            label="Iniciar Sesión"
            [loading]="loading()"
            styleClass="w-full primary-button"
          />

          <!-- Separador con "O" -->
          <div class="login-divider">
            <span class="divider-line"></span>
            <span class="divider-text">o</span>
            <span class="divider-line"></span>
          </div>

          <!-- Botón Google -->
          <p-button
            type="button"
            label="Iniciar sesión con Google"
            icon="pi pi-google"
            iconPos="left"
            [loading]="googleLoading()"
            [disabled]="loading()"
            (onClick)="onGoogleLogin()"
            styleClass="w-full p-button-outlined"
          />

          <!-- Registro -->
          <div class="register-link">
            <span>¿No tienes cuenta?</span>
            <p-button
              label="Regístrate aquí"
              routerLink="/auth/register"
              styleClass="p-button-link"
            />
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
      background-color: var(--bitbucket-light-gray);
      transition: background-color 0.3s ease;
    }

    .dark .login-page {
      background-color: #111827;
    }

    .login-page.in-modal {
      min-height: auto;
      padding: 0;
      background-color: transparent;
    }

    .login-container {
      width: 100%;
      max-width: 420px;
      background-color: var(--bitbucket-header-bg);
      border-radius: 8px;
      padding: 2.5rem 2rem;
      border: 1px solid var(--bitbucket-border);
      box-shadow: var(--bitbucket-shadow);
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .in-modal .login-container {
      border: none;
      box-shadow: none;
      padding: 1.5rem;
    }

    /* ===== HEADER ===== */
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .login-logo-icon {
      width: 44px;
      height: 44px;
      background-color: var(--primary-color);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .login-logo-icon i {
      color: white;
      font-size: 1.5rem;
    }

    .login-logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--bitbucket-text-primary);
    }

    .login-subtitle {
      color: var(--bitbucket-text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    /* ===== FORM ===== */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--bitbucket-text-primary);
    }

    /* ===== LOGIN OPTIONS ===== */
    .login-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .remember-label {
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
      cursor: pointer;
    }

    .forgot-link {
      font-size: 0.875rem;
      color: var(--primary-color);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .forgot-link:hover {
      color: var(--primary-color-hover);
      text-decoration: underline;
    }

    /* ===== ERROR ===== */
    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: #dc2626;
      font-size: 0.875rem;
    }

    .dark .error-message {
      background-color: rgba(220, 38, 38, 0.15);
      border-color: rgba(220, 38, 38, 0.3);
      color: #f87171;
    }

    .error-message i {
      font-size: 1rem;
      flex-shrink: 0;
    }

    /* ===== BUTTONS ===== */
    .login-button {
      margin-top: 0.25rem;
    }

    .login-button .p-button {
      background-color: var(--primary-color) !important;
      border-color: var(--primary-color) !important;
      color: white !important;
    }

    .login-button .p-button:hover {
      background-color: var(--primary-color-hover) !important;
      border-color: var(--primary-color-hover) !important;
    }

    /* ===== GOOGLE BUTTON ===== */
    .google-button .p-button {
      background-color: #ffffff !important;
      border: 1px solid #dadce0 !important;
      color: #3c4043 !important;
      transition: all 0.2s ease !important;
    }

    .google-button .p-button:hover {
      background-color: #f8f9fa !important;
      border-color: #dadce0 !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
    }

    .google-button .p-button .p-button-icon {
      color: #4285f4 !important;
      font-size: 1.2rem !important;
    }

    .google-button .p-button:disabled {
      opacity: 0.6 !important;
      cursor: not-allowed !important;
    }

    /* Dark mode para Google button */
    .dark .google-button .p-button {
      background-color: #2d2d2d !important;
      border-color: #404040 !important;
      color: #e8eaed !important;
    }

    .dark .google-button .p-button:hover {
      background-color: #3d3d3d !important;
      border-color: #505050 !important;
    }

    .dark .google-button .p-button .p-button-icon {
      color: #4285f4 !important;
    }

    /* ===== DIVIDER ===== */
    .login-divider {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 0.25rem 0;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background-color: var(--bitbucket-border);
    }

    .divider-text {
      color: var(--bitbucket-text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
      padding: 0 0.5rem;
    }

    /* ===== REGISTER LINK ===== */
    .register-link {
      text-align: center;
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
      padding-top: 0.5rem;
      border-top: 1px solid var(--bitbucket-border);
    }

    .register-link-text {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
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
    }

    :host ::ng-deep .p-checkbox .p-checkbox-box.p-highlight {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
    }

    :host ::ng-deep .p-checkbox .p-checkbox-box.p-highlight:hover {
      background-color: var(--primary-color-hover);
      border-color: var(--primary-color-hover);
    }

    :host ::ng-deep .p-inputtext:enabled:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(148, 199, 72, 0.2);
    }

    :host ::ng-deep .p-inputtext.p-error {
      border-color: #dc2626;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 640px) {
      .login-container {
        padding: 1.5rem 1rem;
      }

      .in-modal .login-container {
        padding: 1rem;
      }

      .login-logo-icon {
        width: 36px;
        height: 36px;
      }

      .login-logo-icon i {
        font-size: 1.25rem;
      }

      .login-logo-text {
        font-size: 1.25rem;
      }

      .login-options {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .login-page {
        padding: 0.5rem;
      }

      .login-container {
        padding: 1rem 0.75rem;
      }

      .in-modal .login-container {
        padding: 0.75rem;
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

  // ===== Estado =====
  loading = signal(false);
  googleLoading = signal(false);
  error = signal<string | null>(null);

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
        this.router.navigate(['/pets']);
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
        this.router.navigate(['/pets']);
      }
    } catch (err) {
      this.error.set('Error al iniciar sesión con Google. Por favor, intenta de nuevo.');
    } finally {
      this.googleLoading.set(false);
    }
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    console.log('Navegar a recuperar contraseña');
    // this.router.navigate(['/auth/forgot-password']);
  }
}
