import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ThemePreference, ThemeService } from '../../../shared/infrastructure/services/theme.service';
import { LanguageService } from '../../../shared/infrastructure/i18n/language.service';
import { SearchRadiusService } from '../../../shared/services/search-radius.service';
import type { SupportedLang } from '../../../shared/infrastructure/i18n/language.provider';
import { BlockedUserResponse, ProfileService, UserProfileResponse } from '../../../profile/infrastructure/services/profile.service';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { User } from '../../../auth/domain/entities/user.entity';
import { VET_SERVICES, parseVetServiceCodes } from '../../../profile/domain/vet-services';
import { LocationPickerComponent } from '../../../shared/components/location-picker/location-picker.component';
import { GeocodingResult } from '../../../shared/services/geolocation.service';

interface ProfileEditData {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  dateOfBirth: string;
  location: string;
  website: string;
  specialty: string;
  services: string[];
  licenseNumber: string;
  charityNumber: string;
  storeName: string;
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToggleSwitchModule, FormsModule, TranslocoModule, SelectModule, SliderModule, InputTextModule, MultiSelectModule, LocationPickerComponent],
  template: `
    <div class="settings-page">
      <div class="settings-container">
        <header class="settings-header page-heading-card">
          <div class="page-heading-copy">
            <h1>{{ 'settings.title' | transloco }}</h1>
            <p>{{ 'settings.subtitle' | transloco }}</p>
          </div>
        </header>

        <p class="settings-intro">{{ 'settings.intro' | transloco }}</p>

        <!-- Preferencias de visualización -->
        <div class="settings-section">
          <h2 class="section-title"><i class="pi pi-eye" aria-hidden="true"></i>{{ 'settings.appearance' | transloco }}</h2>
          <div class="settings-card">
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.language' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.languageDesc' | transloco }}</span>
              </div>
              <p-select
                [options]="langOptions"
                optionLabel="label"
                optionValue="value"
                [(ngModel)]="selectedLang"
                (ngModelChange)="onLanguageChange($event)"
                class="language-select"
                [attr.aria-label]="'settings.language' | transloco"
              />
            </div>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.theme' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.themeDesc' | transloco }}</span>
              </div>
              <p-select
                [options]="themeOptions"
                optionLabel="label"
                optionValue="value"
                [ngModel]="selectedTheme()"
                (ngModelChange)="onThemeChange($event)"
                [attr.aria-label]="'settings.theme' | transloco"
              />
            </div>
          </div>
        </div>

        <!-- Preferencias de búsqueda -->
        <div class="settings-section">
          <h2 class="section-title"><i class="pi pi-map-marker" aria-hidden="true"></i>{{ 'settings.search' | transloco }}</h2>
          <div class="settings-card">
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.searchRadius' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.searchRadiusDesc' | transloco }}</span>
              </div>
              <span class="radius-value">@if (searchRadius.isUnlimited()) {
                {{ 'settings.unlimited' | transloco }}
              } @else {
                {{ searchRadius.radiusKm() }} km
              }</span>
            </div>
            <div class="radius-slider-row">
              <p-slider
                [min]="searchRadius.sliderMin"
                [max]="searchRadius.sliderMax"
                [step]="1"
                [ngModel]="searchRadius.sliderPosition()"
                (ngModelChange)="searchRadius.setSliderPosition($event)"
                aria-label="{{ 'settings.searchRadius' | transloco }}"
              />
              <div class="radius-slider-scale" aria-hidden="true">
                <span>{{ searchRadius.sliderMin }} km</span>
                <span>{{ 'settings.unlimited' | transloco }}</span>
              </div>
            </div>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.locationReference' | transloco }}</span>
                <span class="settings-item-description">{{ originDescription() }}</span>
              </div>
              <p-button
                icon="pi pi-crosshair"
                [label]="'settings.useCurrentLocation' | transloco"
                styleClass="p-button-outlined"
                [loading]="searchRadius.originLoading()"
                (onClick)="useCurrentLocation()"
              />
            </div>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-description">{{ 'settings.searchRadiusHint' | transloco }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Notificaciones -->
        <div class="settings-section">
          <h2 class="section-title"><i class="pi pi-bell" aria-hidden="true"></i>{{ 'settings.notifications' | transloco }}</h2>
          <div class="settings-card">
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.lostPetAlerts' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.lostPetAlertsDesc' | transloco }}</span>
              </div>
              <p-toggleSwitch
                [ngModel]="notificationsEnabled()"
                (ngModelChange)="notificationsEnabled.set($event); markPreferencesChanged()"
                [disabled]="!settingsLoaded() || settingsSaving()"
                [attr.aria-label]="'settings.lostPetAlerts' | transloco"
              />
            </div>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.messageNotifications' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.messageNotificationsDesc' | transloco }}</span>
              </div>
              <p-toggleSwitch
                [ngModel]="notifyMessages()"
                (ngModelChange)="notifyMessages.set($event); markPreferencesChanged()"
                [disabled]="!settingsLoaded() || settingsSaving()"
                [attr.aria-label]="'settings.messageNotifications' | transloco"
              />
            </div>
          </div>
        </div>

        <!-- Privacidad -->
        <div class="settings-section">
          <h2 class="section-title"><i class="pi pi-shield" aria-hidden="true"></i>{{ 'settings.privacy' | transloco }}</h2>
          <div class="settings-card">
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.publicProfile' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.publicProfileDesc' | transloco }}</span>
              </div>
              <p-toggleSwitch
                [ngModel]="publicProfile()"
                (ngModelChange)="publicProfile.set($event); markPreferencesChanged()"
                [disabled]="!settingsLoaded() || settingsSaving()"
                [attr.aria-label]="'settings.publicProfile' | transloco"
              />
            </div>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.onlineStatus' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.onlineStatusDesc' | transloco }}</span>
              </div>
              <p-toggleSwitch
                [ngModel]="showOnlineStatus()"
                (ngModelChange)="showOnlineStatus.set($event); markPreferencesChanged()"
                [disabled]="!settingsLoaded() || settingsSaving()"
                [attr.aria-label]="'settings.onlineStatus' | transloco"
              />
            </div>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.directMessages' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.directMessagesDesc' | transloco }}</span>
              </div>
              <p-select
                [options]="directMessageOptions"
                optionLabel="label"
                optionValue="value"
                [ngModel]="directMessagePolicy()"
                (ngModelChange)="directMessagePolicy.set($event); markPreferencesChanged()"
                [disabled]="!settingsLoaded() || settingsSaving()"
                [attr.aria-label]="'settings.directMessages' | transloco"
              />
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2 class="section-title"><i class="pi pi-list" aria-hidden="true"></i>{{ 'settings.feed' | transloco }}</h2>
          <div class="settings-card">
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.defaultFeed' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.defaultFeedDesc' | transloco }}</span>
              </div>
              <p-select
                [options]="feedOptions"
                optionLabel="label"
                optionValue="value"
                [ngModel]="feedDefault()"
                (ngModelChange)="feedDefault.set($event); markPreferencesChanged()"
                [disabled]="!settingsLoaded() || settingsSaving()"
                [attr.aria-label]="'settings.defaultFeed' | transloco"
              />
            </div>
          </div>
        </div>

        <!-- Cuenta -->
        <div class="settings-section">
          <h2 class="section-title"><i class="pi pi-user" aria-hidden="true"></i>{{ 'settings.account' | transloco }}</h2>
          <div class="settings-card">
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.email' | transloco }}</span>
                <span class="settings-item-description">{{ accountEmail() || ('settings.emailUnavailable' | transloco) }}</span>
              </div>
            </div>
            <button type="button" class="settings-item settings-item-button" (click)="toggleEmailForm()">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.changeEmail' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.changeEmailDesc' | transloco }}</span>
              </div>
              <i class="pi pi-chevron-right" aria-hidden="true"></i>
            </button>
            @if (emailChangeFormOpen()) {
              <form class="password-form" #emailForm="ngForm" (ngSubmit)="requestEmailChange()">
                <label>
                  <span>{{ 'settings.newEmail' | transloco }}</span>
                  <input pInputText type="email" name="newEmail" [(ngModel)]="newEmail"
                    required maxlength="100" autocomplete="email" />
                </label>
                @if (emailChangeError()) {
                  <p class="settings-feedback settings-feedback-error" role="alert">{{ 'settings.changeEmailError' | transloco }}</p>
                }
                <div class="password-form-actions">
                  <p-button type="button" [label]="'common.cancel' | transloco" severity="secondary" [outlined]="true"
                    [disabled]="emailChangeSubmitting()" (onClick)="toggleEmailForm()" />
                  <p-button type="submit"
                    [label]="(emailChangeSubmitting() ? 'settings.saving' : 'settings.sendVerification') | transloco"
                    [loading]="emailChangeSubmitting()"
                    [disabled]="emailForm.invalid || emailChangeSubmitting()" />
                </div>
              </form>
            }
            @if (emailChangeRequested()) {
              <p class="settings-email-feedback" role="status">{{ 'settings.emailVerificationSent' | transloco }}</p>
            }
            <button type="button" class="settings-item settings-item-button" (click)="togglePasswordForm()">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.changePassword' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.changePasswordDesc' | transloco }}</span>
              </div>
              <i class="pi pi-chevron-right" aria-hidden="true"></i>
            </button>
            @if (passwordFormOpen()) {
              <form class="password-form" #passwordForm="ngForm" (ngSubmit)="changePassword()">
                <label>
                  <span>{{ 'settings.currentPassword' | transloco }}</span>
                  <input pInputText type="password" name="currentPassword" [(ngModel)]="currentPassword"
                    required autocomplete="current-password" />
                </label>
                <label>
                  <span>{{ 'settings.newPassword' | transloco }}</span>
                  <input pInputText type="password" name="newPassword" [(ngModel)]="newPassword" (ngModelChange)="checkPasswordMatch()"
                    required minlength="8" maxlength="100" autocomplete="new-password" />
                </label>
                <label>
                  <span>{{ 'settings.confirmPassword' | transloco }}</span>
                  <input pInputText type="password" name="confirmPassword" [(ngModel)]="confirmPassword" (ngModelChange)="checkPasswordMatch()"
                    required minlength="8" maxlength="100" autocomplete="new-password" />
                </label>
                @if (passwordError()) {
                  <p class="settings-feedback settings-feedback-error" role="alert">{{ 'settings.changePasswordError' | transloco }}</p>
                }
                @if (passwordMismatch()) {
                  <p class="settings-feedback settings-feedback-error" role="alert">{{ 'settings.passwordMismatch' | transloco }}</p>
                }
                <div class="password-form-actions">
                  <p-button type="button" [label]="'common.cancel' | transloco" severity="secondary" [outlined]="true"
                    [disabled]="passwordSubmitting()" (onClick)="togglePasswordForm()" />
                  <p-button type="submit" [label]="(passwordSubmitting() ? 'settings.saving' : 'settings.updatePassword') | transloco"
                    [loading]="passwordSubmitting()" [disabled]="passwordForm.invalid || passwordMismatch() || passwordSubmitting()" />
                </div>
              </form>
            }
            <button type="button" class="settings-item settings-item-button"
              [attr.aria-expanded]="profileEditOpen()"
              (click)="toggleProfileEdit()">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.editProfile' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.editProfileDesc' | transloco }}</span>
              </div>
              <i class="pi" [class.pi-chevron-down]="profileEditOpen()" [class.pi-chevron-right]="!profileEditOpen()" aria-hidden="true"></i>
            </button>
            @if (profileEditOpen()) {
              <form class="settings-profile-form" #profileForm="ngForm" (ngSubmit)="saveProfile()">
                @if (profileEditLoading()) {
                  <p class="settings-feedback" role="status">{{ 'settings.loadingProfile' | transloco }}</p>
                } @else if (profileEditLoadError()) {
                  <p class="settings-feedback settings-feedback-error" role="alert">{{ 'settings.profileLoadError' | transloco }}</p>
                  <button type="button" class="settings-retry" (click)="loadProfileForEdit()">{{ 'settings.retry' | transloco }}</button>
                } @else {
                  <div class="settings-profile-grid">
                    <label>
                      <span>{{ 'settings.profileEdit.firstName' | transloco }}</span>
                      <input pInputText name="firstName" [(ngModel)]="profileEditData.firstName" required maxlength="50" autocomplete="given-name" />
                    </label>
                    <label>
                      <span>{{ 'settings.profileEdit.lastName' | transloco }}</span>
                      <input pInputText name="lastName" [(ngModel)]="profileEditData.lastName" required maxlength="50" autocomplete="family-name" />
                    </label>
                    <label>
                      <span>{{ 'settings.profileEdit.phone' | transloco }}</span>
                      <input pInputText name="phone" [(ngModel)]="profileEditData.phone" maxlength="20" autocomplete="tel" />
                    </label>
                    <label>
                      <span>{{ 'settings.profileEdit.email' | transloco }}</span>
                      <input pInputText [value]="accountEmail()" readonly autocomplete="email" />
                    </label>
                    <label>
                      <span>{{ 'settings.profileEdit.dateOfBirth' | transloco }}</span>
                      <input pInputText type="date" name="dateOfBirth" [(ngModel)]="profileEditData.dateOfBirth" />
                    </label>
                    <div class="profile-field-full settings-location-field">
                      <span>{{ 'settings.profileEdit.location' | transloco }}</span>
                      <app-location-picker
                        [initialAddress]="profileEditData.location"
                        [initialLat]="profileEditProfile()?.latitude ?? undefined"
                        [initialLng]="profileEditProfile()?.longitude ?? undefined"
                        (locationConfirmed)="onProfileLocationConfirmed($event)"
                      />
                    </div>
                    <label class="profile-field-full">
                      <span>{{ 'settings.profileEdit.bio' | transloco }}</span>
                      <textarea name="bio" [(ngModel)]="profileEditData.bio" maxlength="500" rows="4"></textarea>
                    </label>
                    <label class="profile-field-full">
                      <span>{{ 'settings.profileEdit.website' | transloco }}</span>
                      <input pInputText name="website" [(ngModel)]="profileEditData.website" maxlength="255" />
                    </label>
                    @if (profileEditType() === 'vet') {
                      <label class="profile-field-full">
                        <span>{{ 'settings.profileEdit.services' | transloco }}</span>
                        <p-multiSelect name="services" [(ngModel)]="profileEditData.services"
                          [options]="vetServiceOptions()" optionLabel="label" optionValue="value"
                          [placeholder]="'settings.profileEdit.servicesPlaceholder' | transloco"
                          [maxSelectedLabels]="3" class="w-full" />
                      </label>
                      <label class="profile-field-full">
                        <span>{{ 'settings.profileEdit.licenseNumber' | transloco }}</span>
                        <input pInputText name="licenseNumber" [(ngModel)]="profileEditData.licenseNumber" required maxlength="50"
                          pattern="^(?:[Cc][Oo][Ll][Vv][Ee][Tt]-)?[A-Za-z]{1,3}-[0-9]{3,6}$" />
                      </label>
                    }
                    @if (profileEditType() === 'trainer') {
                      <label class="profile-field-full">
                        <span>{{ 'settings.profileEdit.specialty' | transloco }}</span>
                        <input pInputText name="specialty" [(ngModel)]="profileEditData.specialty" maxlength="100" />
                      </label>
                    }
                    @if (profileEditType() === 'shelter') {
                      <label class="profile-field-full">
                        <span>{{ 'settings.profileEdit.charityNumber' | transloco }}</span>
                        <input pInputText name="charityNumber" [(ngModel)]="profileEditData.charityNumber" required maxlength="100"
                          pattern="^(?:[A-Za-z][0-9]{7}[0-9A-Ja-j]|[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,10}-[0-9]{4}-[0-9]{3,8})$" />
                      </label>
                    }
                    @if (profileEditType() === 'seller') {
                      <label class="profile-field-full">
                        <span>{{ 'settings.profileEdit.storeName' | transloco }}</span>
                        <input pInputText name="storeName" [(ngModel)]="profileEditData.storeName" maxlength="100" />
                      </label>
                    }
                    <label>
                      <span>{{ 'settings.profileEdit.avatar' | transloco }}</span>
                      <input type="file" accept="image/*" (change)="onProfileImageSelected($event, 'avatar')" />
                    </label>
                    <label>
                      <span>{{ 'settings.profileEdit.coverImage' | transloco }}</span>
                      <input type="file" accept="image/*" (change)="onProfileImageSelected($event, 'coverImage')" />
                    </label>
                  </div>
                  @if (profileEditError()) {
                    <p class="settings-feedback settings-feedback-error" role="alert">{{ profileEditError() }}</p>
                  }
                  @if (profileEditSaved()) {
                    <p class="settings-feedback settings-feedback-success" role="status">{{ 'settings.profileSaved' | transloco }}</p>
                  }
                  <div class="password-form-actions">
                    <p-button type="submit"
                      [label]="(profileEditSaving() ? 'settings.saving' : 'common.save') | transloco"
                      [loading]="profileEditSaving()"
                      [disabled]="profileForm.invalid || profileEditSaving()" />
                  </div>
                }
              </form>
            }
            <button type="button" class="settings-item settings-item-button settings-logout" (click)="logout()">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.signOut' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.signOutDesc' | transloco }}</span>
              </div>
              <i class="pi pi-sign-out" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <div class="settings-section">
          <h2 class="section-title"><i class="pi pi-ban" aria-hidden="true"></i>{{ 'settings.blockedUsers' | transloco }}</h2>
          <div class="settings-card">
            @if (blockedUsersLoading()) {
              <p class="blocked-users-empty">{{ 'settings.blockedUsersLoading' | transloco }}</p>
            } @else if (blockedUsersError()) {
              <p class="settings-feedback settings-feedback-error" role="alert">{{ 'settings.blockedUsersError' | transloco }}</p>
              <button type="button" class="settings-retry" (click)="loadBlockedUsers()">{{ 'settings.retry' | transloco }}</button>
            } @else if (blockedUsers().length === 0) {
              <p class="blocked-users-empty">{{ 'settings.noBlockedUsers' | transloco }}</p>
            } @else {
              @for (blockedUser of blockedUsers(); track blockedUser.userId) {
                <div class="settings-item">
                  <div class="blocked-user-info">
                    @if (blockedUser.avatarUrl) {
                      <img [src]="blockedUser.avatarUrl" [alt]="blockedUser.firstName" class="blocked-user-avatar" />
                    } @else {
                      <span class="blocked-user-avatar blocked-user-avatar-fallback" aria-hidden="true">
                        {{ blockedUser.firstName.charAt(0) }}
                      </span>
                    }
                    <span class="settings-item-label">{{ blockedUser.firstName }} {{ blockedUser.lastName }}</span>
                  </div>
                  <p-button [label]="'settings.unblock' | transloco" severity="secondary" [outlined]="true"
                    [loading]="unblockingUserId() === blockedUser.userId"
                    [disabled]="unblockingUserId() !== null"
                    (onClick)="unblockUser(blockedUser)" />
                </div>
              }
            }
          </div>
        </div>

        <!-- Botón Guardar -->
        <div class="settings-actions">
          @if (settingsSaved()) {
            <p class="settings-feedback settings-feedback-success" role="status">{{ 'settings.preferencesSaved' | transloco }}</p>
          }
          @if (settingsError()) {
            <p class="settings-feedback settings-feedback-error" role="alert">{{ 'settings.preferencesSaveError' | transloco }}</p>
          }
          @if (settingsLoadError()) {
            <p class="settings-feedback settings-feedback-error" role="alert">{{ 'settings.preferencesLoadError' | transloco }}</p>
            <button type="button" class="settings-retry" (click)="loadPreferences()">{{ 'settings.retry' | transloco }}</button>
          }
          <p-button
            [label]="(settingsSaving() ? 'settings.saving' : 'common.save') | transloco"
            [icon]="settingsSaving() ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
            [loading]="settingsSaving()"
            [disabled]="!settingsLoaded() || settingsSaving()"
            (onClick)="saveSettings()"
          />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      min-height: 100%;
      padding: 1rem;
    }

    .settings-container {
      max-width: var(--max-page-width);
      margin: 0 auto;
    }

    .settings-section {
      margin-bottom: 1.5rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.75rem 0;
    }

    .section-title i {
      color: var(--primary-color);
      font-size: 1rem;
    }

    .settings-intro {
      max-width: 46rem;
      margin: 0 0 1.5rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .settings-card {
      background-color: var(--surface-card);
      border-radius: var(--radius-md);
      border: 1px solid var(--surface-border);
      padding: 0.5rem 1rem;
    }

    .settings-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 0;
      border-bottom: 1px solid var(--surface-border);
      gap: 1rem;
    }

    .settings-item:last-child {
      border-bottom: none;
    }

    .settings-item-info {
      flex: 1;
      min-width: 0;
    }

    .settings-item-label {
      display: block;
      font-weight: 500;
      color: var(--text-primary);
      font-size: 0.9375rem;
    }

    .settings-item-description {
      display: block;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      margin-top: 0.125rem;
    }

    /* Radio de búsqueda (slider estilo Tinder) */
    .radius-value {
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--primary-color);
      white-space: nowrap;
    }

    .radius-slider-row {
      padding: 0.5rem 0 1rem;
    }

    .radius-slider-row ::ng-deep .p-slider {
      width: 100%;
    }

    .radius-slider-scale {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-tertiary);
      margin-top: 0.35rem;
    }

    .settings-item-button {
      text-decoration: none;
      cursor: pointer;
      border-radius: var(--radius-sm);
      margin: 0 -0.75rem;
      padding: 0.875rem 0.75rem !important;
      transition: all var(--transition-fast);
    }

    button.settings-item-button {
      width: 100%;
      border: 0;
      border-bottom: 1px solid var(--surface-border);
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
    }

    .settings-logout .settings-item-label,
    .settings-logout > i {
      color: var(--red-600, #dc2626);
    }

    .settings-item-button:hover {
      background-color: var(--surface-hover);
    }

    .settings-item-button:focus-visible,
    .settings-retry:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .settings-feedback {
      margin: 0;
      font-size: 0.875rem;
    }

    .settings-feedback-success {
      color: var(--green-600, #16a34a);
    }

    .settings-feedback-error {
      color: var(--red-600, #dc2626);
    }

    .password-form {
      display: grid;
      gap: 0.875rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .settings-profile-form {
      display: grid;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .settings-profile-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }

    .settings-profile-grid label {
      display: grid;
      align-content: start;
      gap: 0.375rem;
      color: var(--text-secondary);
      font-size: 0.8125rem;
    }

    .settings-profile-grid input,
    .settings-profile-grid textarea {
      width: 100%;
      min-width: 0;
    }

    .settings-profile-grid textarea {
      padding: 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      background: var(--surface-card);
      color: var(--text-primary);
      font: inherit;
      resize: vertical;
    }

    .profile-field-full {
      grid-column: 1 / -1;
    }

    .settings-location-field {
      display: grid;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.8125rem;
    }

    .settings-profile-grid input[type="file"] {
      padding: 0.5rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      background: var(--surface-card);
      color: var(--text-secondary);
    }

    @media (max-width: 640px) {
      .settings-profile-grid {
        grid-template-columns: 1fr;
      }

      .profile-field-full {
        grid-column: auto;
      }
    }

    .settings-email-feedback {
      padding: 0.875rem 0;
      margin: 0;
      color: var(--green-600, #16a34a);
      font-size: 0.875rem;
    }

    .blocked-users-empty {
      margin: 0;
      padding: 1rem 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .blocked-user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }

    .blocked-user-avatar {
      width: 2.5rem;
      height: 2.5rem;
      object-fit: cover;
      border-radius: 50%;
      flex: 0 0 auto;
    }

    .blocked-user-avatar-fallback {
      display: grid;
      place-items: center;
      background: var(--surface-hover);
      color: var(--text-secondary);
    }

    .password-form label {
      display: grid;
      gap: 0.375rem;
      color: var(--text-secondary);
      font-size: 0.8125rem;
    }

    .password-form input {
      width: 100%;
    }

    .password-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .settings-retry {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      background: var(--surface-card);
      color: var(--text-primary);
      font: inherit;
      cursor: pointer;
    }

  `]
})
export class SettingsPageComponent implements OnInit {
  readonly i18n = inject(TranslocoService);
  private readonly themeService = inject(ThemeService);
  private readonly languageService = inject(LanguageService);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly searchRadius = inject(SearchRadiusService);

  selectedTheme = signal<ThemePreference>(this.themeService.getPreference());
  accountEmail = signal(this.authService.user()?.email ?? '');
  profileEditOpen = signal(false);
  profileEditLoading = signal(false);
  profileEditLoadError = signal(false);
  profileEditSaving = signal(false);
  profileEditSaved = signal(false);
  profileEditError = signal('');
  profileEditProfile = signal<UserProfileResponse | null>(null);
  profileEditType = computed(() => (this.profileEditProfile()?.profileType ?? 'user').toLowerCase());
  vetServiceOptions = computed(() => VET_SERVICES.map(service => ({
    label: this.i18n.translate(service.labelKey),
    value: service.code,
  })));
  profileEditData: ProfileEditData = this.emptyProfileEditData();
  private avatarFile: File | null = null;
  private coverImageFile: File | null = null;
  private selectedProfileLocation: GeocodingResult | null = null;

  langOptions = [
    { label: 'Español', value: 'es' },
    { label: 'English', value: 'en' },
  ];
  directMessageOptions = [
    { label: this.i18n.translate('settings.messagesEveryone'), value: 'EVERYONE' as const },
    { label: this.i18n.translate('settings.messagesFollowing'), value: 'FOLLOWING' as const },
    { label: this.i18n.translate('settings.messagesNobody'), value: 'NOBODY' as const },
  ];
  feedOptions = [
    { label: this.i18n.translate('settings.feedAll'), value: 'ALL' as const },
    { label: this.i18n.translate('settings.feedFollowing'), value: 'FOLLOWING' as const },
  ];

  selectedLang = signal<string>(this.languageService.activeLang());
  themeOptions = [
    { label: this.i18n.translate('settings.themeSystem'), value: 'system' as const },
    { label: this.i18n.translate('settings.themeLight'), value: 'light' as const },
    { label: this.i18n.translate('settings.themeDark'), value: 'dark' as const },
  ];

  notificationsEnabled = signal(true);
  notifyMessages = signal(true);
  publicProfile = signal(true);
  showOnlineStatus = signal(true);
  directMessagePolicy = signal<'EVERYONE' | 'FOLLOWING' | 'NOBODY'>('EVERYONE');
  feedDefault = signal<'ALL' | 'FOLLOWING'>('ALL');
  settingsLoading = signal(true);
  settingsLoaded = signal(false);
  settingsLoadError = signal(false);
  settingsSaving = signal(false);
  settingsSaved = signal(false);
  settingsError = signal(false);
  passwordFormOpen = signal(false);
  passwordSubmitting = signal(false);
  passwordError = signal(false);
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  passwordMismatch = signal(false);
  emailChangeFormOpen = signal(false);
  emailChangeSubmitting = signal(false);
  emailChangeError = signal(false);
  emailChangeRequested = signal(false);
  newEmail = '';
  blockedUsers = signal<BlockedUserResponse[]>([]);
  blockedUsersLoading = signal(true);
  blockedUsersError = signal(false);
  unblockingUserId = signal<string | null>(null);

  ngOnInit(): void {
    // Muestra la ubicación de referencia usada por el filtro de distancia
    this.searchRadius.resolveOrigin().subscribe();
    this.loadPreferences();
    this.loadBlockedUsers();
    if (this.route.snapshot.queryParamMap.get('editProfile') === '1') {
      this.toggleProfileEdit();
    }
  }

  onLanguageChange(lang: string): void {
    this.languageService.setLang(lang as SupportedLang);
  }

  onThemeChange(theme: ThemePreference): void {
    this.selectedTheme.set(theme);
    this.themeService.setPreference(theme);
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch {
      // El backend pudo haber fallado, pero igual completamos el logout local.
    }
    // Siempre llevar al usuario al login tras cerrar sesión.
    await this.router.navigate(['/auth/login']);
  }

  togglePasswordForm(): void {
    this.passwordFormOpen.update((open) => !open);
    this.passwordError.set(false);
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordMismatch.set(false);
  }

  checkPasswordMatch(): void {
    this.passwordMismatch.set(
      this.newPassword.length > 0 &&
      this.confirmPassword.length > 0 &&
      this.newPassword !== this.confirmPassword
    );
  }

  toggleEmailForm(): void {
    this.emailChangeFormOpen.update((open) => !open);
    this.emailChangeError.set(false);
    this.emailChangeRequested.set(false);
    this.newEmail = '';
  }

  toggleProfileEdit(): void {
    const opening = !this.profileEditOpen();
    this.profileEditOpen.set(opening);
    this.profileEditError.set('');
    this.profileEditSaved.set(false);
    if (opening && !this.profileEditProfile()) {
      this.loadProfileForEdit();
    }
  }

  loadProfileForEdit(): void {
    this.profileEditLoading.set(true);
    this.profileEditLoadError.set(false);
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.profileEditProfile.set(profile);
        this.selectedProfileLocation = null;
        this.profileEditData = {
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          phone: profile.phone ?? '',
          bio: profile.bio ?? '',
          dateOfBirth: profile.dateOfBirth ?? '',
          location: profile.location ?? '',
          website: profile.website ?? '',
          specialty: profile.specialty ?? '',
          services: parseVetServiceCodes(profile.services),
          licenseNumber: profile.licenseNumber ?? '',
          charityNumber: profile.charityNumber ?? '',
          storeName: profile.storeName ?? '',
        };
        this.profileEditLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading profile for editing', error);
        this.profileEditLoadError.set(true);
        this.profileEditLoading.set(false);
      }
    });
  }

  onProfileImageSelected(event: Event, kind: 'avatar' | 'coverImage'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (kind === 'avatar') {
      this.avatarFile = file;
    } else {
      this.coverImageFile = file;
    }
  }

  onProfileLocationConfirmed(location: GeocodingResult): void {
    this.selectedProfileLocation = location;
    this.profileEditData.location = location.displayName;
  }

  saveProfile(): void {
    const currentProfile = this.profileEditProfile();
    if (!currentProfile || this.profileEditSaving()) {
      return;
    }

    this.profileEditSaving.set(true);
    this.profileEditSaved.set(false);
    this.profileEditError.set('');
    const location = this.profileEditData.location.trim();
    const selectedLocation = this.selectedProfileLocation;
    const coordinatesUnchanged = location === (currentProfile.location ?? '');
    const profileType = currentProfile.profileType.toLowerCase();
    const payload = {
      profileType,
      firstName: this.profileEditData.firstName.trim(),
      lastName: this.profileEditData.lastName.trim(),
      phone: this.profileEditData.phone.trim(),
      bio: this.profileEditData.bio.trim(),
      dateOfBirth: this.profileEditData.dateOfBirth || null,
      location,
      latitude: selectedLocation?.lat ?? (coordinatesUnchanged ? currentProfile.latitude : null),
      longitude: selectedLocation?.lon ?? (coordinatesUnchanged ? currentProfile.longitude : null),
      website: this.profileEditData.website.trim(),
      specialty: this.profileEditData.specialty.trim(),
      services: this.profileEditData.services.join(','),
      licenseNumber: this.profileEditData.licenseNumber.trim(),
      charityNumber: this.profileEditData.charityNumber.trim(),
      storeName: this.profileEditData.storeName.trim(),
    };
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (this.avatarFile) formData.append('avatar', this.avatarFile);
    if (this.coverImageFile) formData.append('coverImage', this.coverImageFile);

    this.profileService.updateProfile(formData).subscribe({
      next: (profile) => {
        this.profileEditProfile.set(profile);
        this.selectedProfileLocation = null;
        this.profileEditData = {
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          phone: profile.phone ?? '',
          bio: profile.bio ?? '',
          dateOfBirth: profile.dateOfBirth ?? '',
          location: profile.location ?? '',
          website: profile.website ?? '',
          specialty: profile.specialty ?? '',
          services: parseVetServiceCodes(profile.services),
          licenseNumber: profile.licenseNumber ?? '',
          charityNumber: profile.charityNumber ?? '',
          storeName: profile.storeName ?? '',
        };
        const currentUser = this.authService.user();
        if (currentUser) {
          const timestamp = Date.now();
          const updatedUser: User = {
            ...currentUser,
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
            bio: profile.bio,
            location: profile.location,
            latitude: profile.latitude,
            longitude: profile.longitude,
            avatarUrl: profile.avatarUrl ? `${profile.avatarUrl}?t=${timestamp}` : currentUser.avatarUrl,
            coverImageUrl: profile.coverImageUrl ? `${profile.coverImageUrl}?t=${timestamp}` : currentUser.coverImageUrl,
            profileType: profile.profileType,
            profileComplete: profile.profileComplete,
          };
          this.authService.updateUser(updatedUser);
          this.authService.setProfileComplete(profile.profileComplete);
        }
        this.avatarFile = null;
        this.coverImageFile = null;
        this.profileEditSaved.set(true);
        this.profileEditSaving.set(false);
      },
      error: (error) => {
        console.error('Error updating profile', error);
        this.profileEditError.set(
          error?.error?.detail || this.i18n.translate('settings.profileSaveError')
        );
        this.profileEditSaving.set(false);
      }
    });
  }

  private emptyProfileEditData(): ProfileEditData {
    return {
      firstName: '',
      lastName: '',
      phone: '',
      bio: '',
      dateOfBirth: '',
      location: '',
      website: '',
      specialty: '',
      services: [],
      licenseNumber: '',
      charityNumber: '',
      storeName: '',
    };
  }

  async requestEmailChange(): Promise<void> {
    if (this.emailChangeSubmitting()) {
      return;
    }
    this.emailChangeSubmitting.set(true);
    this.emailChangeError.set(false);
    this.emailChangeRequested.set(false);
    try {
      await this.authService.requestEmailChange(this.newEmail);
      this.emailChangeFormOpen.set(false);
      this.emailChangeRequested.set(true);
      this.newEmail = '';
    } catch {
      this.emailChangeError.set(true);
    } finally {
      this.emailChangeSubmitting.set(false);
    }
  }

  loadBlockedUsers(): void {
    this.blockedUsersLoading.set(true);
    this.blockedUsersError.set(false);
    this.profileService.getBlockedUsers().subscribe({
      next: (users) => {
        this.blockedUsers.set(users);
        this.blockedUsersLoading.set(false);
      },
      error: () => {
        this.blockedUsersError.set(true);
        this.blockedUsersLoading.set(false);
      }
    });
  }

  unblockUser(user: BlockedUserResponse): void {
    if (this.unblockingUserId()) {
      return;
    }
    this.unblockingUserId.set(user.userId);
    this.profileService.unblockUser(user.userId).subscribe({
      next: () => {
        this.blockedUsers.update((users) => users.filter((item) => item.userId !== user.userId));
        this.unblockingUserId.set(null);
      },
      error: () => {
        this.unblockingUserId.set(null);
        this.blockedUsersError.set(true);
      }
    });
  }

  async changePassword(): Promise<void> {
    if (this.passwordSubmitting()) {
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordMismatch.set(true);
      return;
    }

    this.passwordMismatch.set(false);
    this.passwordError.set(false);
    this.passwordSubmitting.set(true);
    try {
      await this.authService.changePassword(this.currentPassword, this.newPassword);
      await this.router.navigate(['/auth/login']);
    } catch {
      this.passwordError.set(true);
      this.passwordSubmitting.set(false);
    }
  }

  /** Describe la ubicación de referencia del filtro de distancia. */
  originDescription(): string {
    if (this.searchRadius.originLoading()) {
      return this.i18n.translate('settings.originPending');
    }
    if (this.searchRadius.originError()) {
      return this.i18n.translate('settings.originError');
    }
    const source = this.searchRadius.originSource();
    if (source === 'gps') return this.i18n.translate('settings.originGps');
    if (source === 'profile') return this.i18n.translate('settings.originProfile');
    return this.i18n.translate('settings.originNone');
  }

  /** Fuerza la obtención de la ubicación (GPS) como referencia del filtro. */
  useCurrentLocation(): void {
    this.searchRadius.resolveOrigin(true).subscribe();
  }

  loadPreferences(): void {
    this.settingsLoading.set(true);
    this.settingsLoadError.set(false);
    this.profileService.getPreferences().subscribe({
      next: (profile) => {
        this.publicProfile.set(profile.profilePublic);
        this.notificationsEnabled.set(profile.notificationsEnabled);
        this.notifyMessages.set(profile.notifyMessages);
        this.showOnlineStatus.set(profile.showOnlineStatus);
        this.directMessagePolicy.set(profile.directMessagePolicy);
        this.feedDefault.set(profile.feedDefault);
        this.settingsLoaded.set(true);
        this.settingsLoading.set(false);
      },
      error: () => {
        this.settingsLoadError.set(true);
        this.settingsLoading.set(false);
      }
    });
  }

  markPreferencesChanged(): void {
    this.settingsSaved.set(false);
    this.settingsError.set(false);
  }

  saveSettings(): void {
    if (!this.settingsLoaded() || this.settingsLoading() || this.settingsSaving()) {
      return;
    }

    this.settingsSaving.set(true);
    this.settingsSaved.set(false);
    this.settingsError.set(false);
    this.profileService.updatePreferences({
      profilePublic: this.publicProfile(),
      notificationsEnabled: this.notificationsEnabled(),
      directMessagePolicy: this.directMessagePolicy(),
      showOnlineStatus: this.showOnlineStatus(),
      notifyMessages: this.notifyMessages(),
      feedDefault: this.feedDefault()
    }).subscribe({
      next: () => {
        this.settingsLoaded.set(true);
        this.settingsSaving.set(false);
        this.settingsSaved.set(true);
      },
      error: () => {
        this.settingsSaving.set(false);
        this.settingsError.set(true);
      }
    });
  }
}
