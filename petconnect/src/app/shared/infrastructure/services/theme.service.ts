import { Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  constructor() {
    // Cargar tema guardado al iniciar
    const savedTheme = localStorage.getItem('petconnect-theme');
    if (savedTheme === 'dark') {
      this.document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      this.document.documentElement.classList.add('light');
    } else {
      // Detectar preferencia del sistema
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.matches) {
          this.document.documentElement.classList.add('dark');
        } else {
          this.document.documentElement.classList.add('light');
        }
      }
    }

    // Escuchar cambios en el sistema
    this.watchSystemTheme();
  }

  toggleDarkMode(): void {
    const isDark = this.document.documentElement.classList.contains('dark');
    if (isDark) {
      this.document.documentElement.classList.remove('dark');
      this.document.documentElement.classList.add('light');
      localStorage.setItem('petconnect-theme', 'light');
    } else {
      this.document.documentElement.classList.remove('light');
      this.document.documentElement.classList.add('dark');
      localStorage.setItem('petconnect-theme', 'dark');
    }
  }

  isDarkMode(): boolean {
    return this.document.documentElement.classList.contains('dark');
  }

  private watchSystemTheme(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e: MediaQueryListEvent) => {
        const savedTheme = localStorage.getItem('petconnect-theme');
        // Solo aplicar tema del sistema si no hay tema guardado
        if (!savedTheme) {
          if (e.matches) {
            this.document.documentElement.classList.add('dark');
          } else {
            this.document.documentElement.classList.remove('dark');
          }
        }
      };

      mediaQuery.addEventListener('change', handleChange);
    }
  }
}
