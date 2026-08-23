import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Colores derivados del naranja (color por defecto del theme)
const DEFAULT_COLOR = '#f97316';

const getColorShades = (color: string) => ({
  hover: color === '#f97316' ? '#ea580c' : color,
  active: color === '#f97316' ? '#c2410c' : color,
});

// Cargar color del tema desde localStorage
// Si no hay guardado, usar el naranja por defecto.
// Si es el verde antiguo (#94c748), ignorarlo y usar el naranja.
const savedThemeColor = localStorage.getItem('theme-color');
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
