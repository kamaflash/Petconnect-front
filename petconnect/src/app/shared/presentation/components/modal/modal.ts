import { Component, input, output, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

export type DialogSize = 'small' | 'medium' | 'large' | 'xlarge' | 'full' | 'auto';
export type DialogPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
export type ButtonPosition = 'left' | 'center' | 'right';

export interface ModalButton {
  label: string;
  action: () => void;
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'danger' | 'help' | 'contrast';
  outlined?: boolean;
  text?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPos?: 'left' | 'right';
  class?: string;
  autoFocus?: boolean;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule],
  template: `
    <p-dialog
      [header]="header()"
      [visible]="visible()"
      [style]="getDialogStyle()"
      [modal]="true"
      [closable]="closable()"
      [dismissableMask]="dismissableMask()"
      [closeOnEscape]="closeOnEscape()"
      [draggable]="draggable()"
      [resizable]="resizable()"
      [blockScroll]="true"
      [styleClass]="getDialogClass()"
      [position]="position()"
      [showHeader]="showHeader()"
      (onHide)="onHide.emit()"
      (onShow)="onShow.emit()"
    >
      <!-- Header personalizado -->
      <ng-container *ngIf="customHeader">
        <ng-container *ngTemplateOutlet="customHeader"></ng-container>
      </ng-container>

      <!-- Contenido -->
      <div class="modal-body" [class.no-padding]="noPadding()">
        <ng-content></ng-content>
      </div>

      <!-- Footer -->
      <ng-template pTemplate="footer">
        <div class="modal-footer" *ngIf="!hideFooter()">
          <!-- Botones dinámicos -->
          <div class="modal-actions" [class]="getButtonPositionClass()">
            <!-- Botón Cancelar -->
            <p-button
              *ngIf="showCancel()"
              [label]="cancelLabel()"
              [severity]="cancelSeverity()"
              [outlined]="cancelOutlined()"
              [text]="cancelText()"
              [icon]="cancelIcon()"
              [iconPos]="cancelIconPos()"
              (onClick)="onCancel.emit()"
              [disabled]="cancelDisabled() || loading()"
              [class]="cancelClass()"
            />

            <!-- Botones adicionales -->
            <ng-container *ngFor="let button of buttons(); trackBy: trackButton">
              <p-button
                [label]="button.label"
                [severity]="button.severity || 'secondary'"
                [outlined]="button.outlined || false"
                [text]="button.text || false"
                [icon]="button.icon || ''"
                [iconPos]="button.iconPos || 'left'"
                (onClick)="button.action()"
                [loading]="button.loading || false"
                [disabled]="button.disabled || false"
                [class]="button.class || ''"
                [autofocus]="button.autoFocus || false"
              />
            </ng-container>

            <!-- Botón Confirmar -->
            <p-button
              *ngIf="showConfirm()"
              [label]="confirmLabel()"
              [severity]="confirmSeverity()"
              [outlined]="confirmOutlined()"
              [text]="confirmText()"
              [icon]="confirmIcon()"
              [iconPos]="confirmIconPos()"
              (onClick)="onConfirm.emit()"
              [loading]="confirmLoading() || loading()"
              [disabled]="confirmDisabled() || loading()"
              [class]="confirmClass()"
              [autofocus]="confirmAutoFocus()"
            />
          </div>

          <!-- Footer personalizado -->
          <ng-container *ngIf="customFooter">
            <ng-container *ngTemplateOutlet="customFooter"></ng-container>
          </ng-container>
        </div>
      </ng-template>
    </p-dialog>
  `,
    styles: [`
      /* ===== MODAL WRAPPER - Instagram/Facebook Modern Style ===== */
      :host ::ng-deep .p-dialog {
        border-radius: 24px;
        overflow: hidden;
        background: var(--surface-card);
        box-shadow:
          0 10px 40px rgba(0, 0, 0, 0.15),
          0 0 0 1px var(--surface-border);
        animation: modalSlideUp 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        transform-origin: center;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes modalSlideUp {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* ===== BACKDROP - Instagram Style ===== */
      :host ::ng-deep .p-dialog-mask {
        background: rgba(0, 0, 0, 0.45);
        animation: backdropFade 0.25s ease-out;
      }

      @keyframes backdropFade {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* ===== HEADER - Instagram/Facebook Style ===== */
      :host ::ng-deep .p-dialog-header {
        background: var(--surface-card);
        border-bottom: 1px solid var(--surface-border);
        padding: 1.25rem 1.5rem;
        color: var(--text-primary);
        font-weight: 600;
        font-size: 1.125rem;
        letter-spacing: -0.01em;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
      }

      :host ::ng-deep .p-dialog-header .p-dialog-title {
        color: var(--text-primary);
        font-weight: 600;
        font-size: 1.125rem;
        letter-spacing: -0.01em;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      :host ::ng-deep .p-dialog-header .p-dialog-header-icon {
        color: var(--text-secondary);
        transition: all 0.2s ease;
        width: 2rem;
        height: 2rem;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        border-radius: 50%;
      }

      :host ::ng-deep .p-dialog-header .p-dialog-header-icon:hover {
        color: var(--text-primary);
        background-color: var(--surface-hover);
        transform: scale(1.1);
      }

      /* ===== CONTENT ===== */
      :host ::ng-deep .p-dialog-content {
        background: var(--surface-card);
        padding: 1.5rem;
        color: var(--text-secondary);
        line-height: 1.6;
        font-size: 0.95rem;
      }

      /* ===== FOOTER ===== */
      :host ::ng-deep .p-dialog-footer {
        background: var(--surface-card);
        border-top: 1px solid var(--surface-border);
        padding: 1rem 1.5rem;
      }

      /* ===== DARK MODE ===== */
      .dark :host ::ng-deep .p-dialog {
        box-shadow:
          0 10px 40px rgba(0, 0, 0, 0.4),
          0 0 0 1px var(--surface-border);
      }

      .dark :host ::ng-deep .p-dialog-mask {
        background: rgba(0, 0, 0, 0.6);
      }

      .dark :host ::ng-deep .p-dialog-header {
        background: var(--surface-card);
        border-bottom-color: var(--surface-border);
        color: var(--text-primary);
      }

      .dark :host ::ng-deep .p-dialog-header .p-dialog-title {
        color: var(--text-primary);
      }

      .dark :host ::ng-deep .p-dialog-content {
        background: var(--surface-card);
        color: var(--text-secondary);
      }

      .dark :host ::ng-deep .p-dialog-footer {
        background: var(--surface-card);
        border-top-color: var(--surface-border);
      }

      /* ===== SIZES ===== */
      :host ::ng-deep .p-dialog.dialog-small { width: 360px; }
      :host ::ng-deep .p-dialog.dialog-medium { width: 500px; }
      :host ::ng-deep .p-dialog.dialog-large { width: 720px; }
      :host ::ng-deep .p-dialog.dialog-xlarge { width: 900px; }

      :host ::ng-deep .p-dialog.dialog-full {
        width: 90vw;
        max-width: 1100px;
        height: 85vh;
      }

      :host ::ng-deep .p-dialog.dialog-auto {
        width: auto;
        min-width: 260px;
        max-width: 85vw;
      }

      /* ===== BODY ===== */
      .modal-body {
        max-height: 65vh;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--text-tertiary) transparent;
        font-size: 0.95rem;
        line-height: 1.6;
      }

      .modal-body.no-padding {
        padding: 0 !important;
      }

      .modal-body::-webkit-scrollbar {
        width: 5px;
      }
      .modal-body::-webkit-scrollbar-track {
        background: transparent;
      }
      .modal-body::-webkit-scrollbar-thumb {
        background: var(--text-tertiary);
        border-radius: 10px;
      }
      .modal-body::-webkit-scrollbar-thumb:hover {
        background: var(--text-secondary);
      }

      /* ===== FOOTER ===== */
      .modal-footer {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .modal-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        align-items: center;
      }

      .modal-actions.left { justify-content: flex-start; }
      .modal-actions.center { justify-content: center; }
      .modal-actions.right { justify-content: flex-end; }

      /* ===== BUTTONS - Instagram/Facebook Style ===== */
      :host ::ng-deep .p-button {
        border-radius: 10px !important;
        font-weight: 600 !important;
        font-size: 0.95rem !important;
        padding: 0.5rem 1.25rem !important;
        transition: all 0.2s ease !important;
        letter-spacing: -0.01em;
      }

      :host ::ng-deep .p-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      }

      :host ::ng-deep .p-button:active {
        transform: translateY(0);
      }

      :host ::ng-deep .p-button.p-button-outlined {
        background: transparent !important;
        border: 1px solid var(--surface-border) !important;
        color: var(--text-primary) !important;
      }

      :host ::ng-deep .p-button.p-button-outlined:hover {
        background: var(--surface-hover) !important;
        border-color: var(--surface-border) !important;
      }

      :host ::ng-deep .p-button.p-button-text {
        color: var(--text-secondary) !important;
        background: transparent !important;
      }

      :host ::ng-deep .p-button.p-button-text:hover {
        background: var(--surface-hover) !important;
        color: var(--text-primary) !important;
      }

      /* ===== PRIMARY BUTTON - Instagram Orange ===== */
      :host ::ng-deep .p-button.p-button-primary {
        background: var(--primary-color) !important;
        border-color: var(--primary-color) !important;
        color: #ffffff !important;
      }

      :host ::ng-deep .p-button.p-button-primary:hover {
        background: var(--primary-color-hover) !important;
        border-color: var(--primary-color-hover) !important;
        color: #ffffff !important;
        box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25) !important;
      }

      :host ::ng-deep .p-button.p-button-primary:active {
        background: var(--primary-color-active) !important;
        border-color: var(--primary-color-active) !important;
      }

      /* ===== RESPONSIVE ===== */
      @media (max-width: 640px) {
        :host ::ng-deep .p-dialog {
          border-radius: 20px !important;
          margin: 0.75rem;
          width: calc(100vw - 1.5rem) !important;
        }

        :host ::ng-deep .p-dialog.dialog-full {
          width: 100vw !important;
          height: 100dvh !important;
          max-width: 100vw !important;
          margin: 0;
          border-radius: 0 !important;
        }

        .modal-body {
          max-height: 50vh;
          padding: 1.25rem;
        }

        :host ::ng-deep .p-dialog-header {
          padding: 1rem 1.25rem !important;
          font-size: 1rem !important;
        }

        :host ::ng-deep .p-dialog-content {
          padding: 1.25rem !important;
        }

        :host ::ng-deep .p-dialog-footer {
          padding: 0.875rem 1.25rem !important;
        }

        .modal-actions {
          flex-direction: column;
          width: 100%;
          gap: 0.5rem;
        }

        .modal-actions .p-button,
        :host ::ng-deep .p-button {
          width: 100%;
        }
      }

      @media (max-width: 480px) {
        :host ::ng-deep .p-dialog {
          margin: 0.5rem;
          border-radius: 16px !important;
        }

        :host ::ng-deep .p-dialog-header {
          padding: 0.875rem 1rem !important;
          font-size: 0.95rem !important;
        }

        :host ::ng-deep .p-dialog-content {
          padding: 1rem !important;
        }

        :host ::ng-deep .p-dialog-footer {
          padding: 0.75rem 1rem !important;
        }
      }

      /* ===== REDUCED MOTION ===== */
      @media (prefers-reduced-motion: reduce) {
        :host ::ng-deep .p-dialog,
        :host ::ng-deep .p-dialog-mask {
          animation: none !important;
          transition: none !important;
        }
      }
    `]
 })
export class ModalComponent {
  // ===== Inputs Principales =====
  visible = input<boolean>(false);
  header = input<string>('');
  size = input<DialogSize>('medium');
  position = input<DialogPosition>('center');
  showHeader = input<boolean>(true);
  noPadding = input<boolean>(false);

  // ===== Botón Confirmar =====
  showConfirm = input<boolean>(true);
  confirmLabel = input<string>('Confirmar');
  confirmSeverity = input<'primary' | 'secondary' | 'success' | 'info' | 'danger' | 'help' | 'contrast'>('primary');
  confirmOutlined = input<boolean>(false);
  confirmText = input<boolean>(false);
  confirmIcon = input<string>('');
  confirmIconPos = input<'left' | 'right'>('left');
  confirmLoading = input<boolean>(false);
  confirmDisabled = input<boolean>(false);
  confirmClass = input<string>('');
  confirmAutoFocus = input<boolean>(true);

  // ===== Botón Cancelar =====
  showCancel = input<boolean>(true);
  cancelLabel = input<string>('Cancelar');
  cancelSeverity = input<'primary' | 'secondary' | 'success' | 'info' | 'danger' | 'help' | 'contrast'>('secondary');
  cancelOutlined = input<boolean>(true);
  cancelText = input<boolean>(false);
  cancelIcon = input<string>('');
  cancelIconPos = input<'left' | 'right'>('left');
  cancelDisabled = input<boolean>(false);
  cancelClass = input<string>('');

  // ===== Botones Adicionales =====
  buttons = input<ModalButton[]>([]);

  // ===== Comportamiento =====
  closable = input<boolean>(true);
  dismissableMask = input<boolean>(true);
  closeOnEscape = input<boolean>(true);
  draggable = input<boolean>(false);
  resizable = input<boolean>(false);
  loading = input<boolean>(false);
  buttonPosition = input<ButtonPosition>('right');
  hideFooter = input<boolean>(false);
  closeOnConfirm = input<boolean>(true);

  // ===== Outputs =====
  onConfirm = output<void>();
  onCancel = output<void>();
  onHide = output<void>();
  onShow = output<void>();

  // ===== Templates personalizados =====
  @ContentChild('header') customHeader!: TemplateRef<any>;
  @ContentChild('footer') customFooter!: TemplateRef<any>;
  @ContentChild('body') customBody!: TemplateRef<any>;

  // ===== Métodos =====
  getDialogStyle(): { [key: string]: string } {
    const style: { [key: string]: string } = {};

    if (this.size() === 'full') {
      style['max-width'] = '1200px';
    }
    if (this.size() === 'auto') {
      style['min-width'] = '300px';
      style['max-width'] = '90vw';
    }

    return style;
  }

  getDialogClass(): string {
    return `dialog-${this.size()}`;
  }

  getButtonPositionClass(): string {
    return this.buttonPosition();
  }

  trackButton(index: number, button: ModalButton): string {
    return `${button.label}-${index}`;
  }
}
