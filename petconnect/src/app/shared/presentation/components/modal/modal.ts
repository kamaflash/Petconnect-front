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
    :host ::ng-deep .p-dialog {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: var(--bitbucket-shadow);
    }

    :host ::ng-deep .p-dialog-header {
      background-color: var(--bitbucket-header-bg);
      border-bottom: 1px solid var(--bitbucket-border);
      padding: 1.25rem 1.5rem;
      color: var(--bitbucket-text-primary);
      font-weight: 600;
      font-size: 1.125rem;
    }

    :host ::ng-deep .p-dialog-header .p-dialog-title {
      color: var(--bitbucket-text-primary);
    }

    :host ::ng-deep .p-dialog-header .p-dialog-header-icon {
      color: var(--bitbucket-text-secondary);
      transition: all 0.2s ease;
      border-radius: 4px;
      width: 2rem;
      height: 2rem;
    }

    :host ::ng-deep .p-dialog-header .p-dialog-header-icon:hover {
      color: var(--bitbucket-text-primary);
      background-color: var(--bitbucket-bg-hover);
    }

    :host ::ng-deep .p-dialog-content {
      background-color: var(--bitbucket-header-bg);
      padding: 1.5rem;
      color: var(--bitbucket-text-secondary);
    }

    :host ::ng-deep .p-dialog-footer {
      background-color: var(--bitbucket-header-bg);
      border-top: 1px solid var(--bitbucket-border);
      padding: 1rem 1.5rem;
    }

    /* Dark mode */
    .dark :host ::ng-deep .p-dialog-header {
      background-color: var(--bitbucket-header-bg);
      border-bottom-color: var(--bitbucket-border);
      color: var(--bitbucket-text-primary);
    }

    .dark :host ::ng-deep .p-dialog-header .p-dialog-title {
      color: var(--bitbucket-text-primary);
    }

    .dark :host ::ng-deep .p-dialog-content {
      background-color: var(--bitbucket-header-bg);
      color: var(--bitbucket-text-secondary);
    }

    .dark :host ::ng-deep .p-dialog-footer {
      background-color: var(--bitbucket-header-bg);
      border-top-color: var(--bitbucket-border);
    }

    /* Modal sizes */
    :host ::ng-deep .p-dialog.dialog-small {
      width: 400px;
    }

    :host ::ng-deep .p-dialog.dialog-medium {
      width: 600px;
    }

    :host ::ng-deep .p-dialog.dialog-large {
      width: 800px;
    }

    :host ::ng-deep .p-dialog.dialog-xlarge {
      width: 1000px;
    }

    :host ::ng-deep .p-dialog.dialog-full {
      width: 90vw;
      max-width: 1200px;
      height: 90vh;
    }

    :host ::ng-deep .p-dialog.dialog-auto {
      width: auto;
      min-width: 300px;
      max-width: 90vw;
    }

    .modal-body {
      max-height: 70vh;
      overflow-y: auto;
    }

    .modal-body.no-padding {
      padding: 0 !important;
    }

    .modal-body::-webkit-scrollbar {
      width: 6px;
    }

    .modal-body::-webkit-scrollbar-track {
      background: var(--bitbucket-light-gray);
      border-radius: 3px;
    }

    .modal-body::-webkit-scrollbar-thumb {
      background: var(--bitbucket-gray);
      border-radius: 3px;
    }

    .modal-body::-webkit-scrollbar-thumb:hover {
      background: var(--bitbucket-text-secondary);
    }

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

    .modal-actions.left {
      justify-content: flex-start;
    }

    .modal-actions.center {
      justify-content: center;
    }

    .modal-actions.right {
      justify-content: flex-end;
    }

    /* Responsive */
    @media (max-width: 640px) {
      :host ::ng-deep .p-dialog.dialog-small,
      :host ::ng-deep .p-dialog.dialog-medium,
      :host ::ng-deep .p-dialog.dialog-large,
      :host ::ng-deep .p-dialog.dialog-xlarge,
      :host ::ng-deep .p-dialog.dialog-auto {
        width: 95vw !important;
        margin: 0.5rem;
      }

      :host ::ng-deep .p-dialog.dialog-full {
        width: 100vw !important;
        height: 100vh !important;
        max-width: 100vw !important;
        margin: 0;
        border-radius: 0 !important;
      }

      .modal-body {
        max-height: 60vh;
      }

      .modal-actions {
        flex-direction: column;
        width: 100%;
      }

      .modal-actions .p-button {
        width: 100%;
      }

      :host ::ng-deep .p-button {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      :host ::ng-deep .p-dialog-header {
        padding: 1rem 1.25rem !important;
        font-size: 1rem !important;
      }

      :host ::ng-deep .p-dialog-content {
        padding: 1rem !important;
      }

      :host ::ng-deep .p-dialog-footer {
        padding: 0.75rem 1rem !important;
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
