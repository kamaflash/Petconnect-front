import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { AuthService } from '../../infrastructure/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    CommonModule,
    DynamicFormComponent
  ],
  template: `
    <div class="register-page">
      <div class="register-container auth-card">
        <!-- Logo -->
        <div class="register-header">
          <div class="register-logo">
            <div class="register-logo-icon">
              <i class="pi pi-paw text-white text-lg"></i>
            </div>
            <span class="register-logo-text">
              PetConnect
            </span>
          </div>
          <p class="register-subtitle">
            Crea tu cuenta
          </p>
        </div>

        <!-- Formulario -->
        <app-dynamic-form
          [config]="formConfig"
          [(formData)]="formData"
          (onSubmitClick)="handleSubmit($event)"
          (onCancel)="handleCancel()"
        />

        <!-- Enlace a login -->
        <div class="login-link">
          <span>¿Ya tienes cuenta?</span>
          <a routerLink="/auth/login" class="login-link-text">
            Inicia sesión
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
      background-color: var(--bitbucket-light-gray);
      transition: background-color 0.3s ease;
    }

    .dark .register-page {
      background-color: #111827;
    }

    .register-container {
      width: 100%;
      max-width: 420px;
      background-color: var(--bitbucket-header-bg);
      border-radius: 8px;
      padding: 2.5rem 2rem;
      border: 1px solid var(--bitbucket-border);
      box-shadow: var(--bitbucket-shadow);
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    /* ===== HEADER ===== */
    .register-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .register-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .register-logo-icon {
      width: 44px;
      height: 44px;
      background-color: var(--primary-color);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .register-logo-icon i {
      color: white;
      font-size: 1.5rem;
    }

    .register-logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--bitbucket-text-primary);
    }

    .register-subtitle {
      color: var(--bitbucket-text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    /* ===== LOGIN LINK ===== */
    .login-link {
      text-align: center;
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
      padding-top: 1.5rem;
      border-top: 1px solid var(--bitbucket-border);
      margin-top: 1.5rem;
    }

    .login-link-text {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
      margin-left: 0.25rem;
      transition: color 0.2s ease;
    }

    .login-link-text:hover {
      color: var(--primary-color-hover);
      text-decoration: underline;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 640px) {
      .register-container {
        padding: 1.5rem 1rem;
      }

      .register-logo-icon {
        width: 36px;
        height: 36px;
      }

      .register-logo-icon i {
        font-size: 1.25rem;
      }

      .register-logo-text {
        font-size: 1.25rem;
      }
    }

    @media (max-width: 480px) {
      .register-page {
        padding: 0.5rem;
      }

      .register-container {
        padding: 1rem 0.75rem;
      }
    }
  `]
})
export class RegisterPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  formData = signal<any>({});

  formConfig: DynamicFormConfig = {
    title: 'Crear Cuenta',
    submitLabel: 'Registrarse',
    showCancel: false,
    fields: [
      {
        key: 'firstName',
        label: 'Nombre',
        type: 'input',
        placeholder: 'Tu nombre',
        validation: { required: true, minLength: 2, maxLength: 50 }
      },
      {
        key: 'lastName',
        label: 'Apellidos',
        type: 'input',
        placeholder: 'Tus apellidos',
        validation: { required: true, minLength: 2, maxLength: 50 }
      },
      {
        key: 'email',
        label: 'Email',
        type: 'input',
        placeholder: 'tu@email.com',
        validation: { required: true, email: true }
      },
      {
        key: 'password',
        label: 'Contraseña',
        type: 'password',
        placeholder: '••••••••',
        validation: { required: true, minLength: 8, maxLength: 100 }
      },
      {
        key: 'profileType',
        label: 'Tipo de perfil',
        type: 'select',
        placeholder: 'Selecciona tu tipo de perfil',
        options: [
          { label: 'Usuario', value: 'user' },
          { label: 'Protectora de Animales', value: 'shelter' },
          { label: 'Veterinario', value: 'vet' },
          { label: 'Vendedor', value: 'seller' }
        ],
        validation: { required: true }
      }
    ]
  };

  async handleSubmit(data: any): Promise<void> {
    try {
      await this.authService.register(data.email, data.password, data.firstName, data.lastName, data.profileType);
      this.router.navigate(['/profile'], { queryParams: { tab: 'knowme' } });
    } catch (err) {
      console.error('Error al registrarse:', err);
    }
  }

  handleCancel(): void {
    this.router.navigate(['/auth/login']);
  }
}
