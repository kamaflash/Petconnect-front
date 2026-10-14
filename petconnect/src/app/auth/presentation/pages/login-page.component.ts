import { Component, signal, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../infrastructure/services/auth.service';
import { RegisterData } from '../../domain/repositories/auth.repository';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

// Google Identity Services inyecta `window.google` tras cargar el script.
declare const google: any;

interface ProfileTypeOption {
  value: 'user' | 'vet' | 'shelter' | 'trainer' | 'seller';
  label: string;
  icon: string;
  description: string;
}

interface RegisterStep {
  id: number;
  label: string;
}

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
    RouterLink,
    TranslocoModule
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
              {{ 'auth.taglinePrefix' | transloco }}  <span class="highlight">{{ 'auth.taglineHighlight' | transloco }}</span><br>
              {{ 'auth.tagline' | transloco }}
            </h1>
            <p class="presentation-description">
              {{ 'auth.description' | transloco }}
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
              {{ 'auth.login' | transloco }}
            </button>
            <button
              type="button"
              class="tab-button"
              [class.active]="activeTab() === 'register'"
              (click)="activeTab.set('register')"
            >
              {{ 'auth.register' | transloco }}
            </button>
          </div>

          <!-- Formulario de Login -->
          @if (activeTab() === 'login') {
            <div class="form-header">
                            <h2 class="form-title">{{ 'auth.login' | transloco }}</h2>
              <p class="form-subtitle">{{ 'auth.loginSubtitle' | transloco }}</p>
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
                                    placeholder="{{ 'auth.emailPlaceholder' | transloco }}"
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
                                    placeholder="{{ 'auth.passwordPlaceholder' | transloco }}"
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
                  {{ 'auth.loginButton' | transloco }}
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
                  {{ 'auth.googleButton' | transloco }}
                </span>
              </button>
            </form>
          }

          <!-- Formulario de Registro - Multi Step -->
          @if (activeTab() === 'register') {
            <div class="form-header">
                            <h2 class="form-title">{{ 'auth.registerTitle' | transloco }}</h2>
              <p class="form-subtitle">{{ 'auth.registerSubtitle' | transloco }}</p>
            </div>

            <!-- Stepper -->
            <div class="register-stepper">
              <div class="stepper-progress">
                <div class="stepper-track">
                  @for (step of registerSteps; track step.id; let i = $index) {
                    <div class="stepper-segment" [class.active]="registerStep() >= i + 1">
                      <div class="stepper-dot" [class.completed]="registerStep() > i">
                        @if (registerStep() > i) {
                          <i class="pi pi-check"></i>
                        } @else {
                          <span>{{ i + 1 }}</span>
                        }
                      </div>
                      <span class="stepper-label">{{ step.label | transloco }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <form (ngSubmit)="onRegisterSubmit()" class="auth-form">
              <!-- Paso 1: Tipo de cuenta -->
              @if (registerStep() === 1) {
                <div class="step-content">
                  <div class="form-group">
                                        <label class="field-label">{{ 'auth.accountType' | transloco }}</label>
                    <div class="profile-type-selector">
                      @for (option of profileTypeOptions; track option.value) {
                        <button
                          type="button"
                          class="profile-type-card"
                          [class.selected]="registerData.profileType === option.value"
                          (click)="selectProfileType(option.value)"
                        >
                          <div class="profile-type-icon">
                            <i class="pi {{ option.icon }}"></i>
                          </div>
                          <div class="profile-type-content">
                            <span class="profile-type-label">{{ option.label | transloco }}</span>
                            <span class="profile-type-description">{{ option.description | transloco }}</span>
                          </div>
                          @if (registerData.profileType === option.value) {
                            <div class="profile-type-check">
                              <i class="pi pi-check-circle"></i>
                            </div>
                          }
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- Paso 2: Información personal -->
              @if (registerStep() === 2) {
                <div class="step-content">
                  <div class="form-group">
                                        <label class="field-label">{{ 'auth.firstName' | transloco }}</label>
                    <input
                      pInputText
                      id="firstName"
                      type="text"
                      [(ngModel)]="registerData.firstName"
                      name="firstName"
                                            placeholder="{{ 'auth.firstNamePlaceholder' | transloco }}"
                      required
                      class="w-full instagram-input"
                    />
                  </div>

                  <div class="form-group">
                                        <label class="field-label">{{ 'auth.lastName' | transloco }}</label>
                    <input
                      pInputText
                      id="lastName"
                      type="text"
                      [(ngModel)]="registerData.lastName"
                      name="lastName"
                                            placeholder="{{ 'auth.lastNamePlaceholder' | transloco }}"
                      required
                      class="w-full instagram-input"
                    />
                  </div>

                  <div class="form-group">
                                        <label class="field-label">{{ 'auth.emailPlaceholder' | transloco }}</label>
                    <input
                      pInputText
                      id="registerEmail"
                      type="email"
                      [(ngModel)]="registerData.email"
                      name="email"
                      placeholder="{{ 'auth.emailPlaceholder' | transloco }}"

                      required
                      class="w-full instagram-input"
                    />
                  </div>

                  <div class="form-group">
                                        <label class="field-label">{{ 'auth.passwordPlaceholder' | transloco }}</label>
                    <p-password
                      [(ngModel)]="registerData.password"
                      name="password"
                      [feedback]="false"
                      [toggleMask]="true"
                      placeholder="{{ 'auth.createPasswordPlaceholder' | transloco }}"
                      required
                      class="w-full"
                      inputStyleClass="w-full instagram-input"
                    />
                  </div>
                </div>
              }

              <!-- Mensaje de error -->
              @if (error()) {
                <div class="error-message">
                  <i class="pi pi-exclamation-circle"></i>
                  {{ error() }}
                </div>
              }

              <!-- Navegación entre pasos -->
              <div class="step-navigation">
                @if (registerStep() > 1) {
                  <button
                    type="button"
                    class="step-button step-button-back"
                    (click)="previousStep()"
                  >
                    <i class="pi pi-arrow-left"></i>
                    {{ 'auth.previous' | transloco }}
                  </button>
                }
                @if (registerStep() < 2) {
                  <button
                    type="button"
                    class="step-button step-button-next"
                    (click)="nextStep()"
                  >
                    {{ 'auth.next' | transloco }}
                    <i class="pi pi-arrow-right"></i>
                  </button>
                }
                @if (registerStep() === 2) {
                  <button
                    type="submit"
                    class="step-button step-button-submit instagram-button"
                    [class.loading]="registerLoading()"
                    [disabled]="registerLoading()"
                  >
                    <span class="button-content">
                      <i class="pi pi-user-plus"></i>
                      {{ 'auth.registerSubmit' | transloco }}
                    </span>
                  </button>
                }
              </div>
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
      background: var(--primary-color-light);
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
      background: var(--instagram-gradient);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.35);
    }

    .logo-icon i {
      color: var(--on-primary);
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
      position: relative;
      white-space: nowrap;
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

    .field-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    /* ===== STEPPER ===== */
    .register-stepper {
      margin-bottom: 1.5rem;
    }

    .stepper-progress {
      display: flex;
      justify-content: center;
    }

    .stepper-track {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .stepper-segment {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      opacity: 0.5;
    }

    .stepper-segment.active {
      opacity: 1;
    }

    .stepper-dot {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--surface-border);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 600;
    }

    .stepper-dot.completed {
      background: var(--primary-color);
      color: white;
    }

    .stepper-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .stepper-segment.active .stepper-label {
      color: var(--text-primary);
    }

    /* ===== STEP CONTENT ===== */
    .step-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* ===== STEP NAVIGATION ===== */
    .step-navigation {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
    }

    .step-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .step-button-back {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .step-button-back:hover {
      background: var(--surface-border);
    }

    .step-button-next {
      background: var(--primary-color);
      color: white;
    }

    .step-button-next:hover {
      background: var(--primary-color-hover);
      transform: translateY(-1px);
    }

    .step-button-submit {
      width: auto;
      padding: 0.625rem 1.5rem;
    }

    /* ===== PROFILE TYPE SELECTOR - MODERNO ===== */
    .profile-type-selector {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .profile-type-card {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border: 2px solid var(--surface-border);
      border-radius: 16px;
      background: var(--surface-card);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: left;
      overflow: hidden;
    }

    .profile-type-card:hover {
      border-color: var(--primary-color);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.15);
    }

    .profile-type-card.selected {
      border-color: var(--primary-color);
      background: rgba(var(--primary-color-rgb), 0.05);
    }

    .profile-type-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--surface-hover);
      color: var(--primary-color);
      font-size: 1.25rem;
      flex-shrink: 0;
      transition: all 0.3s ease;
    }

    .profile-type-card.selected .profile-type-icon {
      background: var(--primary-color);
      color: white;
    }

    .profile-type-content {
      flex: 1;
      min-width: 0;
    }

    .profile-type-label {
      display: block;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .profile-type-description {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .profile-type-check {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      color: var(--primary-color);
      font-size: 1.1rem;
    }

    .dark .profile-type-card {
      background: var(--surface-hover);
      border-color: var(--surface-border);
    }

    .dark .profile-type-card:hover {
      background: var(--surface-card);
    }

    .dark .profile-type-card.selected {
      background: rgba(var(--primary-color-rgb), 0.15);
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

      .profile-type-selector {
        grid-template-columns: 1fr;
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
  private readonly transloco = inject(TranslocoService);

  // ===== Inputs para modal =====
  inModal = input<boolean>(false);
  closeModal = output<void>();
  loginSuccess = output<void>();

  // ===== Form Data =====
  email = '';
  password = '';
  rememberMe = false;

  // ===== Register Form Data =====
  registerData: RegisterData = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    profileType: 'user'
  };

  // ===== Opciones de tipos de perfil =====
  profileTypeOptions: ProfileTypeOption[] = [
    {
      value: 'user',
      label: 'auth.petOwner',
      icon: 'pi-user',
      description: 'auth.petOwnerDesc'
    },
    {
      value: 'vet',
      label: 'auth.vet',
      icon: 'pi-heart',
      description: 'auth.vetDesc'
    },
    {
      value: 'shelter',
      label: 'auth.shelter',
      icon: 'pi-home',
      description: 'auth.shelterDesc'
    },
    {
      value: 'trainer',
      label: 'auth.trainer',
      icon: 'pi-star',
      description: 'auth.trainerDesc'
    },
    {
      value: 'seller',
      label: 'auth.seller',
      icon: 'pi-shopping-cart',
      description: 'auth.sellerDesc'
    }
  ];

  // ===== Estado =====
  loading = signal(false);
  googleLoading = signal(false);
  registerLoading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'login' | 'register'>('login');
  registerStep = signal(1);

  // ===== Pasos del registro =====
  registerSteps: RegisterStep[] = [
    { id: 1, label: 'auth.stepType' },
    { id: 2, label: 'auth.stepData' }
  ];

  // ===== Métodos =====
  selectProfileType(type: 'user' | 'vet' | 'shelter' | 'trainer' | 'seller'): void {
    this.registerData.profileType = type;
  }

  nextStep(): void {
    if (this.registerStep() === 1) {
      if (!this.registerData.profileType) {
        this.error.set(this.transloco.translate('auth.accountTypeError'));
        return;
      }
    }
    this.error.set(null);
    this.registerStep.update(step => Math.min(step + 1, 2));
  }

  previousStep(): void {
    this.registerStep.update(step => Math.max(step - 1, 1));
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.error.set(this.transloco.translate('auth.fieldsRequired'));
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
      this.error.set(this.transloco.translate('auth.loginError'));
    } finally {
      this.loading.set(false);
    }
  }

    private googleScriptLoaded = false;
  private googleInitialized = false;

  /** Carga el script de Google Identity Services y lo inicializa una sola vez. */
  private loadGoogle(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.googleInitialized) {
        resolve();
        return;
      }

      const init = () => {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleCredential(response)
        });
        this.googleInitialized = true;
        resolve();
      };

      if (typeof google !== 'undefined' && google?.accounts?.id) {
        init();
        return;
      }

      if (this.googleScriptLoaded) {
        // El script está cargado pero google aún no está listo: reintentar en breve.
        setTimeout(() => init(), 50);
        return;
      }

      this.googleScriptLoaded = true;
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => init();
      script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /** Callback de GIS: recibe el ID token y lo envía al backend. */
  private async handleGoogleCredential(response: { credential?: string }): Promise<void> {
    if (!response?.credential) {
      this.googleLoading.set(false);
      this.error.set(this.transloco.translate('auth.googleNoCredential'));
      return;
    }

    try {
      const user = await this.authService.loginWithGoogle(response.credential);

      // Si el perfil está incompleto (primer acceso con Google), ir al perfil
      // para completar los datos faltantes.
      const needsProfileCompletion =
        !user.phone || !user.bio || !user.dateOfBirth || !user.location;

      if (this.inModal()) {
        this.loginSuccess.emit();
        this.closeModal.emit();
      }

      void this.router.navigate([needsProfileCompletion ? '/profile' : '/']);
    } catch (err) {
      this.error.set(this.transloco.translate('auth.googleError'));
    } finally {
      this.googleLoading.set(false);
    }
  }

  async onGoogleLogin(): Promise<void> {
    this.googleLoading.set(true);
    this.error.set(null);

    try {
      await this.loadGoogle();
      // `prompt` abre el selector de cuenta de Google (Sign in with Google).
      google.accounts.id.prompt({
        context: 'signin',
        // Si el usuario cierra el diálogo sin elegir cuenta, no bloqueamos el loading.
        cancel_on_click: true
      });
      // El callback handleGoogleCredential se encarga de navegar / cerrar el modal.
    } catch (err) {
      this.googleLoading.set(false);
      this.error.set(this.transloco.translate('auth.googleUnavailable'));
    }
  }

  async onRegisterSubmit(): Promise<void> {
    // Validación básica
    if (!this.registerData.firstName || !this.registerData.lastName ||
        !this.registerData.email || !this.registerData.password ||
        !this.registerData.profileType) {
      this.error.set(this.transloco.translate('auth.registerFieldsRequired'));
      return;
    }

    this.registerLoading.set(true);
    this.error.set(null);

    try {
      await this.authService.register(this.registerData);

      // Tras el registro, llevar al perfil para completar los datos faltantes
      void this.router.navigate(['/profile']);
    } catch (err) {
      this.error.set(this.transloco.translate('auth.registerError'));
    } finally {
      this.registerLoading.set(false);
    }
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    console.log('Navegar a recuperar contraseña');
  }
}
