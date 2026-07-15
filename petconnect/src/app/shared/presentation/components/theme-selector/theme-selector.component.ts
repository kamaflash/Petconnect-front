import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ThemeService } from '../../../infrastructure/services/theme.service';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <p-button
      icon="pi pi-moon"
      (onClick)="toggleTheme()"
      styleClass="p-button-rounded p-button-text"
      [text]="true"
      [label]="isDark ? 'Modo Claro' : 'Modo Oscuro'"
    />
  `
})
export class ThemeSelectorComponent {
  private readonly themeService = inject(ThemeService);

  isDark = this.themeService.isDarkMode();

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
    this.isDark = this.themeService.isDarkMode();
  }
}
