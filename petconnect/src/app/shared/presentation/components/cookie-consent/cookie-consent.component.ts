import { Component, computed, effect, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { ConsentService, REOPEN_CONSENT_EVENT } from '../../../infrastructure/consent/consent.service';
import { CONSENT_TEMPLATE } from './cookie-consent.template';
import { CONSENT_STYLES } from './cookie-consent.styles';

/**
 * Banner inferior de consentimiento de cookies: primer acceso sin eleccion guardada.
 * Opciones: aceptar todas, solo necesarias o configurar. Necesarias
 * siempre activas; funcionales off por defecto. Se oculta al aceptar
 * o rechazar (guardando la eleccion en localStorage).
 */
@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, ButtonModule, CheckboxModule],
  template: CONSENT_TEMPLATE,
  styles: [CONSENT_STYLES]
})
export class CookieConsentComponent implements OnDestroy {
  private readonly consentService = inject(ConsentService);

  readonly customizing = signal(false);
  functional = false;
  private hadChoice = false;
  private readonly reopenForced = signal(false);

  readonly visible = computed(() => !this.consentService.decided() || this.reopenForced());

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.hadChoice = this.consentService.decided();
        this.functional = this.consentService.consent()?.functional ?? false;
        this.customizing.set(this.hadChoice && this.reopenForced());
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
    window.addEventListener(REOPEN_CONSENT_EVENT, this.onReopen);
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    window.removeEventListener(REOPEN_CONSENT_EVENT, this.onReopen);
  }

  acceptAll(): void { this.consentService.acceptAll(); this.close(); }
  acceptNecessary(): void { this.consentService.acceptNecessary(); this.close(); }
  saveCustom(): void { this.consentService.saveCustom(this.functional); this.close(); }

  private readonly onReopen = (): void => {
    this.reopenForced.set(true);
    this.customizing.set(true);
  };

  private close(): void {
    this.customizing.set(false);
    this.reopenForced.set(false);
  }
}
