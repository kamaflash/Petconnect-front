import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import {
  Component,
  inject,
  input,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import {
  AdoptionService,
  PetOwnerPeriod,
} from '../../../../adoptions/infrastructure/services/adoption.service';
import { OwnershipChangeReason } from '../../../services/pet-ownership-event.service';
import { Subscription } from 'rxjs';

export interface AdoptionHistoryItem {
  id: string;
  type: 'request' | 'ownership';
  label: string;
  status?: string;
  reason?: OwnershipChangeReason;
  date: string;
  detail?: string;
  // Usuarios implicados
  fromName?: string;
  toName?: string;
  requesterName?: string;
  ownerName?: string;
}

@Component({
  selector: 'app-adoption-history',
  standalone: true,
  imports: [TranslocoModule, CommonModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adoption-history">
      <h3 class="section-title">
        <i class="pi pi-history"></i>
        {{ this.i18n.translate('adoptionHistory.title') }}
      </h3>

      @if (items().length === 0) {
        <div class="empty-state">
          <i class="pi pi-inbox"></i>
          <p>{{ this.i18n.translate('adoptionHistory.empty') }}</p>
          <span class="empty-subtitle">{{ this.i18n.translate('adoptionHistory.emptySubtitle') }}</span>
        </div>
      } @else {
        <div class="history-list">
          @for (item of items(); track item.id) {
            <div class="history-item" [class.ownership]="item.type === 'ownership'">
              <div class="history-icon">
                <i [class]="item.type === 'ownership' ? 'pi pi-arrow-right-arrow-left' : 'pi pi-file'"></i>
              </div>
              <div class="history-body">
                <div class="history-header">
                  <span class="history-label">{{ item.label }}</span>
                  <span class="history-date">{{ item.date | date: 'medium' }}</span>
                </div>
                @if (item.status) {
                  <p-tag [value]="statusLabel(item.status)" [severity]="statusSeverity(item.status!)"></p-tag>
                }
                @if (item.requesterName || item.ownerName) {
                  <div class="history-users">
                    @if (item.requesterName) {
                      <span class="history-user"><i class="pi pi-user"></i> Solicitante: <b>{{ item.requesterName }}</b></span>
                    }
                    @if (item.ownerName) {
                      <span class="history-user"><i class="pi pi-home"></i> Propietario: <b>{{ item.ownerName }}</b></span>
                    }
                  </div>
                }
                @if (item.fromName || item.toName) {
                  <div class="history-transfer">
                    <span class="history-user"><i class="pi pi-arrow-left"></i> De: <b>{{ item.fromName }}</b></span>
                    <span class="history-user"><i class="pi pi-arrow-right"></i>{{ this.i18n.translate('adoptionHistory.to') }}<b>{{ item.toName }}</b></span>
                  </div>
                }
                @if (item.detail) { <p class="history-detail">{{ item.detail }}</p> }
                @if (item.reason) {
                  <span class="history-reason"><i class="pi pi-tag"></i> {{ reasonLabel(item.reason) }}</span>
                }
              </div>
            </div>
          }
        </div>
      }
      @if (owners().length > 0) {
        <div class="owners-section">
          <h4 class="owners-title"><i class="pi pi-user"></i> Familias a la que ha pertenecido</h4>
          <div class="owners-timeline">
            @for (owner of owners(); track owner.ownerId + (owner.fromDate ?? '')) {
              <div class="owner-period" [class.current]="owner.toDate === null">
                <div class="owner-name">{{ owner.ownerName ?? owner.ownerId }}</div>
                <div class="owner-dates">
                  <i class="pi pi-calendar"></i>
                  {{ owner.fromDate | date: 'mediumDate' }} – {{ owner.toDate ? (owner.toDate | date: 'mediumDate') : ('adoptionHistory.current' | transloco) }}
                </div>
                @if (owner.reason) {
                  <span class="owner-reason"><i class="pi pi-tag"></i> {{ ownerReasonLabel(owner.reason) }}</span>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .adoption-history {
        font-family: inherit;
      }

      /* ============================================
       SECTION TITLE
    ============================================ */
      .section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 16px 0;
      }
      .section-title i {
        color: var(--primary-color);
        font-size: 18px;
      }

      /* ============================================
       EMPTY STATE
    ============================================ */
      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-secondary);
      }
      .empty-state i {
        font-size: 48px;
        margin-bottom: 12px;
        opacity: 0.4;
      }
      .empty-state p {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }
      .empty-state .empty-subtitle {
        font-size: 14px;
        opacity: 0.7;
      }

      /* ============================================
       HISTORY LIST
    ============================================ */
      .history-list {
        display: flex;
        flex-direction: column;
      }
      .history-item {
        display: flex;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--surface-border);
      }
      .history-item:last-child {
        border-bottom: none;
      }
      .history-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--surface-ground);
        color: var(--text-secondary);
        font-size: 16px;
        flex-shrink: 0;
      }
      :host-context(.dark) .history-icon {
        background: var(--surface-ground-dark);
      }
      .history-item.ownership .history-icon {
        color: var(--primary-color);
      }
      .history-body {
        flex: 1;
        min-width: 0;
      }
      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 4px;
      }
      .history-label {
        font-weight: 600;
        font-size: 14px;
        color: var(--text-primary);
      }
      .history-date {
        font-size: 12px;
        color: var(--text-secondary);
        white-space: nowrap;
      }
      .history-detail {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 4px 0 0;
      }
      .history-reason {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        font-weight: 500;
        color: var(--primary-color);
        margin-top: 6px;
      }
      .history-users,
      .history-transfer {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-top: 6px;
      }
      .history-user {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--text-secondary);
      }
      .history-user i {
        color: var(--text-secondary);
        font-size: 12px;
      }
      .history-user b {
        font-weight: 600;
        color: var(--text-primary);
      }
      .history-transfer .history-user b {
        color: var(--primary-color);
      }

      /* ============================================
       OWNERS TIMELINE
    ============================================ */
      .owners-section {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--surface-border);
      }
      .owners-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 10px;
      }
      .owners-timeline {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .owner-period {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 8px 12px;
        border-radius: 8px;
        background: var(--surface-ground);
        border-left: 3px solid var(--text-secondary);
      }
      .owner-period.current {
        border-left-color: var(--primary-color);
        background: color-mix(in srgb, var(--primary-color) 8%, transparent);
      }
      .owner-name {
        font-weight: 600;
        font-size: 14px;
        color: var(--text-primary);
      }
      .owner-dates {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary);
      }
      .owner-reason {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--primary-color);
      }
    `,
  ],
})
export class AdoptionHistoryComponent implements OnInit, OnDestroy {
  readonly i18n = inject(TranslocoService);
  readonly petId = input<string>('');

  private readonly adoptionService = inject(AdoptionService);

  readonly items = signal<AdoptionHistoryItem[]>([]);
  readonly owners = signal<PetOwnerPeriod[]>([]);
  private readonly subscriptions = new Subscription();

  ngOnInit(): void {
    // Reacciona a cambios del historial local (en sesiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n) para actualizar la vista
    this.subscriptions.add(
      this.adoptionService.adoptionHistory$.subscribe(() => this.buildItems()),
    );
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Carga el historial persistente desde el backend
  private loadHistory(): void {
    const petId = this.petId();
    if (!petId) return;
    this.subscriptions.add(
      this.adoptionService.getAdoptionHistory(petId).subscribe({
        next: () => this.buildItems(),
        // Si el backend falla, se muestran los datos locales disponibles
        error: () => this.buildItems(),
      }),
    );
  }

  private buildItems(): void {
    const petId = this.petId();
    const result: AdoptionHistoryItem[] = [];
    const history = this.adoptionService.getCurrentHistory(petId);

    history.adoptionRequests.forEach((entry, idx) => {
      result.push({
        id: `req-${entry.requestId}-${idx}`,
        type: 'request',
        label: this.i18n.translate('adoptionHistory.requestLabel'),
        status: entry.status,
        date: entry.statusChangedAt,
        detail: entry.notes ? entry.notes : undefined,
        requesterName: entry.adopterName,
        ownerName: entry.ownerName,
      });
    });

    history.ownershipChanges.forEach((change, idx) => {
      result.push({
        id: `own-${change.changedAt}-${idx}`,
        type: 'ownership',
        label: this.i18n.translate('adoptionHistory.ownershipLabel'),
        reason: change.reason,
        date: change.changedAt,
        fromName: change.previousOwnerName || change.previousOwnerId,
        toName: change.newOwnerName || change.newOwnerId,
        detail: change.adoptionRequestId
          ? `${this.i18n.translate('adoptionHistory.viaRequest')} ${change.adoptionRequestId}`
          : 'Cambio registrado',
      });
    });

    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.items.set(result);
    // Refrescar la cronologÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a de propietarios con los datos locales mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s recientes
    this.owners.set(history.owners ?? []);
  }

  /** Etiqueta legible del motivo de un cambio de propietario. */
  ownerReasonLabel(reason: string | null | undefined): string {
    if (!reason) {
      return '';
    }
    const map: Record<string, string> = {
      ADOPTION_COMPLETED: this.i18n.translate('adoptionHistory.reasonOwner.completed'),
      RETURNED: this.i18n.translate('adoptionHistory.reasonOwner.returned'),
      TRANSFERRED: this.i18n.translate('adoptionHistory.reasonOwner.transferred'),
      OTHER: this.i18n.translate('adoptionHistory.reasonOwner.other'),
    };
    return map[reason.toUpperCase()] || reason;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: this.i18n.translate('adoptionHistory.pending'),
      pending_contact: this.i18n.translate('adoptionHistory.contact'),
      pending_delivery: this.i18n.translate('adoptionHistory.delivery'),
      completed: this.i18n.translate('adoptionHistory.completed'),
      rejected: this.i18n.translate('adoptionHistory.rejected'),
      approved: this.i18n.translate('adoptionHistory.approved'),
    };
    return map[status] || status;
  }

  statusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'completed':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
        return 'warn';
      case 'pending_contact':
      case 'pending_delivery':
        return 'info';
      default:
        return 'secondary';
    }
  }

  reasonLabel(reason: OwnershipChangeReason): string {
    const map: Record<OwnershipChangeReason, string> = {
      adoption_completed: this.i18n.translate('adoptionHistory.reason.completed'),
      returned: this.i18n.translate('adoptionHistory.reason.returned'),
      transferred: this.i18n.translate('adoptionHistory.reason.transferred'),
      other: this.i18n.translate('adoptionHistory.reason.other'),
    };
    return map[reason] || this.i18n.translate('adoptionHistory.reason.other');
  }
}
