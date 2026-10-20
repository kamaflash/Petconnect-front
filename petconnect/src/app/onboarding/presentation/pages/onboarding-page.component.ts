import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import {
  OnboardingProfileRequest,
  ProfileService
} from '../../../profile/infrastructure/services/profile.service';
import { VET_SERVICES } from '../../../profile/domain/vet-services';
import { LocationPickerComponent } from '../../../shared/components/location-picker/location-picker.component';
import { GeocodingResult } from '../../../shared/services/geolocation.service';

type OnboardingAccountType = 'user' | 'vet' | 'shelter' | 'trainer' | 'seller';

interface AccountTypeOption {
  value: OnboardingAccountType;
  labelKey: string;
  descriptionKey: string;
  icon: string;
}

/**
 * Onboarding post-registro.
 *
 * Dos pasos:
 * 1. El usuario elige el tipo de cuenta (usuario, veterinario, protectora,
 *    adiestrador o vendedor).
 * 2. Confirma sus datos: nombre y apellidos obligatorios, más los campos
 *    propios del tipo elegido.
 *
 * Al guardar, el backend activa la marca de onboarding del perfil y el
 * frontend actualiza el estado local para desbloquear las rutas protegidas.
 */
@Component({
  selector: 'app-onboarding-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    ProgressBarModule,
    ToastModule,
    TranslocoModule,
    LocationPickerComponent
  ],
  templateUrl: './onboarding-page.component.html',
  styleUrls: ['./onboarding-page.component.css']
})
export class OnboardingPageComponent {

  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly transloco = inject(TranslocoService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly step = signal<1 | 2>(1);
  readonly selectedType = signal<OnboardingAccountType | null>(null);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  //  LOCATION SIGNALS
  locationConfirmed = signal(false);
  newAddress = signal<string | null>(null);
  userLatitude = signal<number | null>(null);
  userLongitude = signal<number | null>(null);

  readonly accountTypes: AccountTypeOption[] = [
    { value: 'user', labelKey: 'onboarding.types.user', descriptionKey: 'onboarding.types.userDesc', icon: 'pi-user' },
    { value: 'vet', labelKey: 'onboarding.types.vet', descriptionKey: 'onboarding.types.vetDesc', icon: 'pi-heart' },
    { value: 'shelter', labelKey: 'onboarding.types.shelter', descriptionKey: 'onboarding.types.shelterDesc', icon: 'pi-home' },
    { value: 'trainer', labelKey: 'onboarding.types.trainer', descriptionKey: 'onboarding.types.trainerDesc', icon: 'pi-star' },
    { value: 'seller', labelKey: 'onboarding.types.seller', descriptionKey: 'onboarding.types.sellerDesc', icon: 'pi-shopping-bag' }
  ];

  readonly vetServices = VET_SERVICES;

  /** Datos del formulario del paso 2. */
  form = {
    firstName: '',
    lastName: '',
    location: '',
    phone: '',
    bio: '',
    website: '',
    specialty: '',
    licenseNumber: '',
    charityNumber: '',
    storeName: '',
    services: [] as string[]
  };


  /** ¿El formulario del paso 2 tiene lo mínimo para enviarse? */
  canSubmit(): boolean {
    const type = this.selectedType();
    if (!type) return false;
    if (!this.form.firstName.trim() || !this.form.lastName.trim()) return false;
    if (!this.form.location.trim()) return false;

    switch (type) {
      case 'vet':
        return !!this.form.licenseNumber.trim() && this.form.services.length > 0;
      case 'shelter':
        return !!this.form.charityNumber.trim();
      case 'trainer':
        return !!this.form.specialty.trim();
      case 'seller':
        return !!this.form.storeName.trim();
      default:
        return true;
    }
  }

  /** Guarda la ubicación confirmada desde el LocationPicker */
  onLocationConfirmed(location: GeocodingResult): void {
    this.userLatitude.set(location.lat);
    this.userLongitude.set(location.lon);
    this.newAddress.set(location.displayName || null);
    this.locationConfirmed.set(true);
    this.form.location = location.displayName || '';
  }

  constructor() {
    this.prefillFromExistingProfile();
  }

  selectType(type: OnboardingAccountType): void {
    this.selectedType.set(type);
    this.errorMessage.set(null);
  }

  goToProfileStep(): void {
    if (!this.selectedType()) return;
    this.step.set(2);
    this.errorMessage.set(null);
  }

  backToTypeStep(): void {
    this.step.set(1);
    this.errorMessage.set(null);
  }

  toggleService(code: string): void {
    const services = [...this.form.services];
    const index = services.indexOf(code);
    if (index >= 0) {
      services.splice(index, 1);
    } else {
      services.push(code);
    }
    this.form.services = services;
  }


  submit(): void {
    if (!this.canSubmit() || this.saving()) {
      this.errorMessage.set(this.transloco.translate('onboarding.errors.missingFields'));
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const payload: OnboardingProfileRequest = {
      profileType: this.selectedType()!,
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      location: this.form.location.trim() || null,
      latitude: this.userLatitude(),
      longitude: this.userLongitude(),
      phone: this.form.phone.trim() || null,
      bio: this.form.bio.trim() || null,
      website: this.form.website.trim() || null
    };

    const type = this.selectedType()!;
    if (type === 'vet') {
      payload.licenseNumber = this.form.licenseNumber.trim();
      payload.services = this.form.services.join(',');
    }
    if (type === 'shelter') {
      payload.charityNumber = this.form.charityNumber.trim();
    }
    if (type === 'trainer') {
      payload.specialty = this.form.specialty.trim();
    }
    if (type === 'seller') {
      payload.storeName = this.form.storeName.trim();
    }

    this.profileService.completeOnboarding(payload).subscribe({
      next: (profile) => {
        // El estado local se actualiza de inmediato: el claim del JWT puede
        // seguir marcando el perfil como incompleto.
        //
        // Además del flag, se sincronizan los datos guardados (ubicación,
        // teléfono, bio, coordenadas...). El snapshot del usuario viene del
        // login de Google (campos aún null) y sin este merge la sesión actual
        // vería el perfil vacío hasta volver a hacer login.
        const current = this.authService.user();
        if (current) {
          this.authService.updateUser({
            ...current,
            firstName: profile.firstName ?? current.firstName,
            lastName: profile.lastName ?? current.lastName,
            phone: profile.phone ?? null,
            bio: profile.bio ?? null,
            dateOfBirth: profile.dateOfBirth ?? null,
            location: profile.location ?? null,
            latitude: profile.latitude ?? null,
            longitude: profile.longitude ?? null,
            profileType: profile.profileType ?? current.profileType,
            profileComplete: profile.profileComplete !== false,
          });
        }
        this.authService.setProfileComplete(profile.profileComplete !== false);
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate('onboarding.toasts.success'),
          detail: this.transloco.translate('onboarding.toasts.successDetail')
        });
        void this.router.navigate(['/']);
      },
      error: (error) => {
        this.saving.set(false);
        const detail: string | undefined = error?.error?.detail || error?.error?.message;
        this.errorMessage.set(detail || this.transloco.translate('onboarding.errors.generic'));
      }
    });
  }

  /**
   * Rellena el formulario con los datos que ya existen en el perfil (p. ej. el
   * nombre que llegó de Google), para no obligar a repetirlos.
   */
  private prefillFromExistingProfile(): void {
    const user = this.authService.user();
    if (!user) return;

    this.form.firstName = user.firstName || '';
    this.form.lastName = user.lastName || '';
    this.form.phone = user.phone || '';
    this.form.bio = user.bio || '';
  }
}