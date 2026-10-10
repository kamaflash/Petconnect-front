import { Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  constructor() {
    const savedTheme = this.getSavedTheme();
    const prefersDark = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    this.applyTheme(savedTheme ? savedTheme === 'dark' : Boolean(prefersDark));
    this.watchSystemTheme();
  }

  toggleDarkMode(): void {
    const nextTheme = this.isDarkMode() ? 'light' : 'dark';
    this.applyTheme(nextTheme === 'dark');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('petconnect-theme', nextTheme);
    }
  }

  isDarkMode(): boolean {
    return this.document.documentElement.classList.contains('dark');
  }

  private watchSystemTheme(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e: MediaQueryListEvent) => {
        if (!this.getSavedTheme()) {
          this.applyTheme(e.matches);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
    }
  }

  private getSavedTheme(): 'dark' | 'light' | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const savedTheme = window.localStorage.getItem('petconnect-theme');
    return savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : null;
  }

  private applyTheme(isDark: boolean): void {
    const root = this.document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(isDark ? 'dark' : 'light');
  }
}
