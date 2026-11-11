import { Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { FunctionalStorageService } from '../consent/functional-storage.service';

export type ThemePreference = 'system' | 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(FunctionalStorageService);

  constructor() {
    const savedTheme = this.getSavedTheme();
    this.applyTheme(savedTheme === 'system' || savedTheme === null
      ? this.prefersDarkMode()
      : savedTheme === 'dark');
    this.watchSystemTheme();
  }

  getPreference(): ThemePreference {
    return this.getSavedTheme() ?? 'system';
  }

  setPreference(preference: ThemePreference): void {
    this.storage.set('petconnect-theme', preference);
    this.applyTheme(preference === 'system' ? this.prefersDarkMode() : preference === 'dark');
  }

  toggleDarkMode(): void {
    this.setPreference(this.isDarkMode() ? 'light' : 'dark');
  }

  isDarkMode(): boolean {
    return this.document.documentElement.classList.contains('dark');
  }

  private watchSystemTheme(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e: MediaQueryListEvent) => {
        if (!this.getSavedTheme() || this.getSavedTheme() === 'system') {
          this.applyTheme(e.matches);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
    }
  }

  private getSavedTheme(): ThemePreference | null {
    // Sin consentimiento funcional no se lee el tema guardado (solo memoria).
    const savedTheme = this.storage.get('petconnect-theme');
    return savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system'
      ? savedTheme
      : null;
  }

  private prefersDarkMode(): boolean {
    return typeof window !== 'undefined'
      && Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  }

  private applyTheme(isDark: boolean): void {
    const root = this.document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(isDark ? 'dark' : 'light');
  }
}
