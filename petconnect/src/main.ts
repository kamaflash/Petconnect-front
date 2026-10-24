import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Naranja: color por defecto de la identidad Petconnect
const DEFAULT_COLOR = '#f97316';

const getColorShades = (color: string) => ({
  hover: color === '#f97316' ? '#ea580c' : color,
  active: color === '#f97316' ? '#c2410c' : color,
});

// Cargar color del tema inicial. Sin consentimiento funcional no se lee
// la preferencia guardada: se usa el naranja por defecto (igual que el
// ThemeService). El verde antiguo (#94c748) se migra siempre al naranja.
// Intentar leer localStorage solo si el usuario aceptó funcionales.
let savedThemeColor: string | null = null;
try {
  const raw = localStorage.getItem('petconnect-consent');
  const parsed = raw ? JSON.parse(raw) as { version?: number; functional?: boolean } : null;
  if (parsed?.version === 1 && parsed.functional === true) {
    savedThemeColor = localStorage.getItem('theme-color');
  }
} catch { /* localStorage no disponible */ }
const color = !savedThemeColor || savedThemeColor === '#94c748' ? DEFAULT_COLOR : savedThemeColor;
const shades = getColorShades(color);

document.documentElement.style.setProperty('--primary-color', color);
document.documentElement.style.setProperty('--primary-color-hover', shades.hover);
document.documentElement.style.setProperty('--primary-color-active', shades.active);
document.documentElement.style.setProperty('--p-primary-color', color);
document.documentElement.style.setProperty('--p-primary-hover-color', shades.hover);
document.documentElement.style.setProperty('--p-primary-active-color', shades.active);
document.documentElement.style.setProperty('--p-primary-contrast-color', '#ffffff');
document.documentElement.style.setProperty('--p-primary-emphasis-color', shades.hover);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
