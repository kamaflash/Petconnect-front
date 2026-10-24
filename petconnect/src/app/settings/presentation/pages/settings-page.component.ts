import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { ThemeService } from '../../../shared/infrastructure/services/theme.service';
import { LanguageService } from '../../../shared/infrastructure/i18n/language.service';
import { SearchRadiusService } from '../../../shared/services/search-radius.service';
import { FunctionalStorageService } from '../../../shared/infrastructure/consent/functional-storage.service';
import type { SupportedLang } from '../../../shared/infrastructure/i18n/language.provider';

interface ThemeColor {
  name: string;
  value: string;
}

const themeColorValues: Record<string, { hover: string; active: string; light: string }> = {
  '#f97316': { hover: '#ea580c', active: '#c2410c', light: '#fff7ed' },
  '#1e6f50': { hover: '#17593f', active: '#114530', light: '#e9f3ee' },
  '#94c748': { hover: '#7cb33d', active: '#659929', light: '#f0f8e6' },
  '#e1306c': { hover: '#c42d5f', active: '#a72951', light: '#fce7f3' },
  '#3b82f6': { hover: '#2563eb', active: '#1d4ed8', light: '#dbeafe' },
  '#8b5cf6': { hover: '#7c3aed', active: '#6d28d9', light: '#f5f3ff' },
  '#ec4899': { hover: '#db2777', active: '#be185d', light: '#fce7f3' },
  '#f59e0b': { hover: '#d97706', active: '#b45309', light: '#fef3c7' },
  '#ef4444': { hover: '#dc2626', active: '#b91c1c', light: '#fee2e2' },
};

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ToggleSwitchModule, TooltipModule, FormsModule, RouterLink, TranslocoModule, SelectModule, SliderModule],
  template: `
    <div class="settings-page">
      <div class="settings-container">
        <header class="settings-header page-heading-card">
          <div class="page-heading-copy">
            <h1>{{ 'settings.title' | transloco }}</h1>
            <p>{{ 'settings.subtitle' | transloco }}</p>
          </div>
        </header>

        <!-- Sección de Apariencia -->
        <div class="settings-section">
          <h2 class="section-title">{{ 'settings.appearance' | transloco }}</h2>
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
              />
            </div>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.themeColor' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.themeColorDesc' | transloco }}</span>
              </div>
            </div>
            <div class="color-palette">
              @for (color of themeColors; track color.value) {
                <button
                  class="color-option"
                  [class.color-option-active]="selectedColor() === color.value"
                  [style.background-color]="selectedColor() === color.value ? null : color.value"
                  (click)="selectColor(color)"
                  [pTooltip]="color.name"
                  tooltipPosition="top"
                >
                  @if (selectedColor() === color.value) {
                    <i class="pi pi-check" style="color: white; font-size: 1rem;"></i>
                  }
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Sección de Búsqueda (radio global estilo Tinder) -->
        <div class="settings-section">
          <h2 class="section-title">{{ 'settings.search' | transloco }}</h2>
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

        <!-- Sección de Notificaciones -->
        <div class="settings-section">
          <h2 class="section-title">{{ 'settings.notifications' | transloco }}</h2>
          <div class="settings-card">
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.emailNotifications' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.emailNotificationsDesc' | transloco }}</span>
              </div>
              <p-toggleSwitch [(ngModel)]="emailNotifications" />
            </div>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.pushNotifications' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.pushNotificationsDesc' | transloco }}</span>
              </div>
              <p-toggleSwitch [(ngModel)]="pushNotifications" />
            </div>
          </div>
        </div>

        <!-- Sección de Privacidad -->
        <div class="settings-section">
          <h2 class="section-title">{{ 'settings.privacy' | transloco }}</h2>
          <div class="settings-card">
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.publicProfile' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.publicProfileDesc' | transloco }}</span>
              </div>
              <p-toggleSwitch [(ngModel)]="publicProfile" />
            </div>
          </div>
        </div>

        <!-- Sección de Cuenta -->
        <div class="settings-section">
          <h2 class="section-title">{{ 'settings.account' | transloco }}</h2>
          <div class="settings-card">
            <a routerLink="/auth/login" class="settings-item settings-item-button">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.changePassword' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.changePasswordDesc' | transloco }}</span>
              </div>
              <i class="pi pi-chevron-right" style="color: var(--text-tertiary);"></i>
            </a>
            <a routerLink="/profile" class="settings-item settings-item-button">
              <div class="settings-item-info">
                <span class="settings-item-label">{{ 'settings.editProfile' | transloco }}</span>
                <span class="settings-item-description">{{ 'settings.editProfileDesc' | transloco }}</span>
              </div>
              <i class="pi pi-chevron-right" style="color: var(--text-tertiary);"></i>
            </a>
          </div>
        </div>

        <!-- Botón Guardar -->
        <div class="settings-actions">
          <p-button label="{{ 'common.save' | transloco }}" icon="pi pi-check" (onClick)="saveSettings()" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      min-height: 100vh;
      padding: 2rem;
    }

    .settings-container {
      max-width: var(--max-page-width);
      margin: 0 auto;
    }

    .settings-section {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.75rem 0;
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

    .settings-item-button:hover {
      background-color: var(--surface-hover);
    }

    .settings-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 2.5rem;
    }

    .color-palette {
      display: flex;
      gap: 0.875rem;
      padding: 0.75rem 0 1rem 0;
      flex-wrap: wrap;
    }

                    .color-option {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      border: 2px solid transparent;
      cursor: pointer;
      transition: all var(--transition-normal);
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      /* Suavizar o color de todos os botons para que usen o color do tema mais ténue */
      filter: brightness(0.55) saturate(0.35);
    }

    .color-option:hover {
      transform: scale(1.15);
      border-color: var(--text-tertiary);
    }

                    .color-option-active {
      border-color: var(--text-primary) !important;
      box-shadow: 0 0 0 3px var(--surface-card), 0 0 0 5px var(--text-primary);
      /* Forzar o fondo coa variable do theme actual coa maior prioridade posible */
      background: var(--p-primary-color, var(--primary-color, #f97316)) !important;
      /* O activo veuse coa máxima suavidade */
      filter: brightness(0.65) saturate(0.25);
    }
  `]
})
export class SettingsPageComponent implements OnInit {
  readonly i18n = inject(TranslocoService);
  private readonly themeService = inject(ThemeService);
  private readonly languageService = inject(LanguageService);
  private readonly storage = inject(FunctionalStorageService);
  readonly searchRadius = inject(SearchRadiusService);

  selectedColor = signal('#f97316');

  langOptions = [
    { label: 'Español', value: 'es' },
    { label: 'English', value: 'en' },
  ];

  selectedLang = signal<string>(this.languageService.activeLang());

  themeColors: ThemeColor[] = [
    { name: 'Naranja', value: '#f97316' },
    { name: 'Bosque', value: '#1e6f50' },
    { name: 'Verde', value: '#94c748' },
    { name: 'Azul', value: '#3b82f6' },
    { name: this.i18n.translate('settings.colorPurple'), value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: this.i18n.translate('settings.colorAmber'), value: '#f59e0b' },
    { name: 'Rojo', value: '#ef4444' }
  ];

  emailNotifications = signal(true);
  pushNotifications = signal(true);
  publicProfile = signal(true);

  ngOnInit(): void {
    // Muestra la ubicación de referencia usada por el filtro de distancia
    this.searchRadius.resolveOrigin().subscribe();
    const saved = this.storage.get('theme-color') ?? null;
    if (saved) {
      // Migrar el verde de la identidad anterior al naranja por defecto
      const color = saved === '#94c748' ? '#f97316' : saved;
      this.selectedColor.set(color);
    }
  }

  selectColor(color: ThemeColor): void {
    this.selectedColor.set(color.value);
    this.applyThemeColor(color.value);
    this.storage.set('theme-color', color.value);
  }

  onLanguageChange(lang: string): void {
    this.languageService.setLang(lang as SupportedLang);
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

  private applyThemeColor(color: string): void {
    const shades = themeColorValues[color] || { hover: color, active: color, light: color + '20' };

    document.documentElement.style.setProperty('--primary-color', color);
    document.documentElement.style.setProperty('--primary-color-hover', shades.hover);
    document.documentElement.style.setProperty('--primary-color-active', shades.active);
    document.documentElement.style.setProperty('--primary-color-light', shades.light);
    document.documentElement.style.setProperty('--primary-color-highlight', `${color}1f`);
    document.documentElement.style.setProperty('--primary-color-rgb', this.hexToRgb(color));
    document.documentElement.style.setProperty('--p-primary-color', color);
    document.documentElement.style.setProperty('--p-primary-hover-color', shades.hover);
    document.documentElement.style.setProperty('--p-primary-active-color', shades.active);
    document.documentElement.style.setProperty('--p-primary-contrast-color', '#ffffff');
    document.documentElement.style.setProperty('--p-primary-emphasis-color', shades.hover);
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '249, 115, 22';
  }

  saveSettings(): void {
    this.storage.setJson('theme-settings', JSON.stringify({
      selectedColor: this.selectedColor(),
      emailNotifications: this.emailNotifications(),
      pushNotifications: this.pushNotifications(),
      publicProfile: this.publicProfile()
    }));
  }
}
