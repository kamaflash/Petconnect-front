import { Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { ConsentService, REOPEN_CONSENT_EVENT } from '../../../infrastructure/consent/consent.service';
import { CONSENT_TEMPLATE } from './cookie-consent.template';
import { CONSENT_STYLES } from './cookie-consent.styles';

/**
 * Banner de consentimiento: primer acceso sin eleccion guardada.
 * Opciones: aceptar todas, solo necesarias o configurar. Necesarias
 * siempre activas; funcionales off por defecto. role=dialog, foco
 * inicial, Escape solo con eleccion previa.
 */
@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, ButtonModule, CheckboxModule],
  template: CONSENT_TEMPLATE,
  styles: [CONSENT_STYLES]
})
export class CookieConsentComponent {
  private readonly consentService = inject(ConsentService);
  @ViewChild('dialog') dialog?: ElementRef<HTMLElement>;

  readonly customizing = signal(false);
  functional = false;
  private hadChoice = false;
  private opener: HTMLElement | null = null;
  private readonly reopenForced = signal(false);

  readonly visible = computed(() => !this.consentService.decided() || this.reopenForced());

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.hadChoice = this.consentService.decided();
        this.functional = this.consentService.consent()?.functional ?? false;
        this.customizing.set(this.hadChoice && this.reopenForced());
        queueMicrotask(() => this.dialog?.nativeElement.focus());
      } else if (this.opener) {
        this.opener.focus();
        this.opener = null;
      }
    });
    window.addEventListener(REOPEN_CONSENT_EVENT, this.onReopen);
    window.addEventListener('keydown', this.onKeydown);
  }

  acceptAll(): void { this.consentService.acceptAll(); this.close(); }
  acceptNecessary(): void { this.consentService.acceptNecessary(); this.close(); }
  saveCustom(): void { this.consentService.saveCustom(this.functional); this.close(); }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && this.hadChoice) this.close();
  }

  private readonly onReopen = (): void => {
    this.reopenForced.set(true);
    this.customizing.set(true);
  };

  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.visible() && this.hadChoice) this.close();
  };

  private close(): void {
    this.customizing.set(false);
    this.reopenForced.set(false);
  }
}
