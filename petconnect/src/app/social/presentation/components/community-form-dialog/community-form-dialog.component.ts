import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  COMMUNITY_TOPICS,
  CommunityDraft,
  CommunityResponse,
} from '../../../infrastructure/services/social.service';

/** Estado vacío del formulario de creación. */
const emptyDraft = (): CommunityDraft => ({
  name: '',
  description: null,
  avatarUrl: null,
  category: null,
  topic: null,
});

/** Rellena el formulario a partir de un círculo existente. */
const draftFrom = (circle: CommunityResponse): CommunityDraft => ({
  name: circle.name,
  description: circle.description,
  avatarUrl: circle.avatarUrl,
  category: circle.category,
  topic: circle.topic,
});

/**
 * Formulario de alta y edición de círculos, compartido por la lista y el detalle.
 *
 * Es presentacional: valida solo lo evidente en pantalla (nombre no vacío) y
 * emite el borrador. La llamada HTTP y la gestión de errores viven en la página
 * que lo usa, porque es donde ya están los toasts y el estado de carga.
 */
@Component({
  selector: 'app-community-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    TranslocoModule,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [header]="editing ? t('social.communities.editTitle') : t('social.communities.createTitle')"
      [modal]="true"
      [closable]="!saving"
      [draggable]="false"
      [resizable]="false"
      (onHide)="closed.emit()"
    >
      <div class="form-grid">
        <div class="field">
          <label for="communityName">{{ t('social.communities.form.name') }} *</label>
          <input
            pInputText
            id="communityName"
            [(ngModel)]="form.name"
            class="w-full"
            maxlength="200"
            [placeholder]="t('social.communities.form.namePlaceholder')"
          />
        </div>

        <div class="field">
          <label for="communityTopic">{{ t('social.communities.form.topic') }}</label>
          <p-select
            id="communityTopic"
            [options]="topicOptions"
            optionLabel="label"
            optionValue="value"
            [showClear]="true"
            appendTo="body"
            [placeholder]="t('social.communities.form.noTopic')"
            [(ngModel)]="form.topic"
            styleClass="w-full"
          />
        </div>

        <div class="field">
          <label for="communityDescription">{{ t('social.communities.form.description') }}</label>
          <textarea
            pTextarea
            id="communityDescription"
            [(ngModel)]="form.description"
            rows="3"
            class="w-full"
            maxlength="1000"
            [placeholder]="t('social.communities.form.descriptionPlaceholder')"
          ></textarea>
        </div>

        <div class="field">
          <label for="communityCategory">{{ t('social.communities.form.category') }}</label>
          <input
            pInputText
            id="communityCategory"
            [(ngModel)]="form.category"
            class="w-full"
            maxlength="100"
            [placeholder]="t('social.communities.form.categoryPlaceholder')"
          />
        </div>

        <div class="field">
          <label for="communityAvatar">{{ t('social.communities.form.avatarUrl') }}</label>
          <input
            pInputText
            id="communityAvatar"
            [(ngModel)]="form.avatarUrl"
            class="w-full"
            maxlength="500"
            [placeholder]="t('social.communities.form.avatarUrlPlaceholder')"
          />
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button
          pButton
          type="button"
          [label]="t('social.communities.form.cancel')"
          class="p-button-text"
          [disabled]="saving"
          (click)="visible = false"
        ></button>
        <button
          pButton
          type="button"
          [label]="t('social.communities.form.save')"
          [loading]="saving"
          [disabled]="!form.name.trim()"
          (click)="save()"
        ></button>
      </ng-template>
    </p-dialog>
  `,

  styles: [
    `
      .form-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-width: min(480px, 80vw);
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      label {
        font-size: 0.875rem;
        font-weight: 600;
      }
    `,
  ],
})
export class CommunityFormDialogComponent {
  @Output() saved = new EventEmitter<CommunityDraft>();
  @Output() closed = new EventEmitter<void>();

  private readonly transloco = inject(TranslocoService);

  /**
   * Temas traducidos. Se resuelven una vez al construir el componente, que en
   * esta app siempre se instancia tras elegir idioma; si algún día se permite
   * cambiar de idioma sin recargar, habría que recalcularlas en ese cambio.
   */
  readonly topicOptions = COMMUNITY_TOPICS.map((value) => ({
    value,
    label: this.transloco.translate(`social.communities.topics.${value}`),
  }));

  visible = false;
  saving = false;
  editing = false;
  form: CommunityDraft = emptyDraft();

  t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params);
  }

  /** Abre en modo creación o, si recibe un círculo, en modo edición. */
  open(circle: CommunityResponse | null = null): void {
    this.editing = circle !== null;
    this.form = circle ? draftFrom(circle) : emptyDraft();
    this.visible = true;
  }

  close(): void {
    this.visible = false;
  }

  save(): void {
    if (!this.form.name.trim()) {
      return;
    }
    // Se normaliza aquí lo cosmético para no enviar cadenas con espacios sobrantes.
    this.saved.emit({
      ...this.form,
      name: this.form.name.trim(),
      description: this.form.description?.trim() || null,
      avatarUrl: this.form.avatarUrl?.trim() || null,
      category: this.form.category?.trim() || null,
      topic: this.form.topic,
    });
  }
}
