import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CookieConsentComponent } from '../shared/presentation/components/cookie-consent/cookie-consent.component';

/**
 * Página pública de presentación (sin guards): puerta de entrada para
 * visitantes no autenticados. Incluye el banner de consentimiento.
 */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, TranslocoModule, ButtonModule, CookieConsentComponent],
  template: `
    <div class="landing">
      <header class="landing-hero">
        <img src="https://res.cloudinary.com/dxjcjee8f/image/upload/v1784374711/m9caz3kr9yusdgis1k42.png"
          alt="Pawly" class="landing-logo" />
        <h1 class="landing-title">{{ 'landing.title' | transloco }}</h1>
        <p class="landing-subtitle">{{ 'landing.subtitle' | transloco }}</p>
        <div class="landing-cta">
          <p-button [label]="'landing.login' | transloco" routerLink="/auth/login" />
          <p-button [label]="'landing.register' | transloco" routerLink="/auth/login" styleClass="p-button-outlined" />
        </div>
      </header>
      <section class="landing-features" aria-label="features">
        <article class="landing-feature">
          <h2>{{ 'landing.feature1Title' | transloco }}</h2>
          <p>{{ 'landing.feature1Desc' | transloco }}</p>
        </article>
        <article class="landing-feature">
          <h2>{{ 'landing.feature2Title' | transloco }}</h2>
          <p>{{ 'landing.feature2Desc' | transloco }}</p>
        </article>
        <article class="landing-feature">
          <h2>{{ 'landing.feature3Title' | transloco }}</h2>
          <p>{{ 'landing.feature3Desc' | transloco }}</p>
        </article>
      </section>
      <footer class="landing-footer">
        <button type="button" class="landing-consent-link" (click)="openConsent()">
          {{ 'footer.cookiesShort' | transloco }}
        </button>
      </footer>
    </div>
    <app-cookie-consent />
  `,
  styles: [`
    .landing { min-height: 100dvh; display: flex; flex-direction: column;
      align-items: center; padding: 3rem 1.25rem 2rem; text-align: center; }
    .landing-hero { max-width: 640px; display: grid; gap: 1rem; justify-items: center; }
    .landing-logo { width: 120px; height: auto; }
    .landing-title { font-size: clamp(1.75rem, 4vw, 2.75rem); margin: 0; }
    .landing-subtitle { font-size: 1.1rem; opacity: .85; margin: 0; line-height: 1.6; }
    .landing-cta { display: flex; gap: .75rem; flex-wrap: wrap; justify-content: center; }
    .landing-features { display: grid; gap: 1rem; margin-top: 3rem;
      max-width: 960px; width: 100%; }
    .landing-feature { border: 1px solid var(--surface-border, #e5e7eb);
      border-radius: 12px; padding: 1.25rem; text-align: left; }
    .landing-feature h2 { margin: 0 0 .5rem; font-size: 1.1rem; }
    .landing-feature p { margin: 0; line-height: 1.55; opacity: .9; }
    .landing-footer { margin-top: auto; padding-top: 2rem; }
    .landing-consent-link { background: none; border: 0; cursor: pointer;
      color: var(--primary-color, #f97316); font-size: .9rem; text-decoration: underline; }
    .landing-consent-link:focus-visible { outline: 3px solid var(--primary-color, #f97316); outline-offset: 2px; }
    @media (min-width: 720px) { .landing-features { grid-template-columns: repeat(3, 1fr); } }
  `]
})
export class LandingPageComponent {
  openConsent(): void {
    window.dispatchEvent(new CustomEvent('petconnect:open-consent'));
  }
}
