import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Cargar color del tema desde localStorage
const savedThemeColor = localStorage.getItem('theme-color');
if (savedThemeColor) {
  // Calcular colores derivados del color guardado
  // Si es el verde antiguo (#94c748) ignorarlo y usar el naranja
  const color = savedThemeColor === '#94c748' ? '#f97316' : savedThemeColor;

  document.documentElement.style.setProperty('--primary-color', color);
  document.documentElement.style.setProperty('--primary-color-hover', color);
  document.documentElement.style.setProperty('--primary-color-active', color);
  document.documentElement.style.setProperty('--p-primary-color', color);
  document.documentElement.style.setProperty('--p-primary-hover-color', color);
  document.documentElement.style.setProperty('--p-primary-active-color', color);
  document.documentElement.style.setProperty('--p-primary-contrast-color', '#ffffff');
  document.documentElement.style.setProperty('--p-primary-emphasis-color', color);
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
