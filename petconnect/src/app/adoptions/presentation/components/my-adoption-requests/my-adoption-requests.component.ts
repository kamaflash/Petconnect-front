import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  AdoptionRequest,
  AdoptionStatus,
  AdoptionService,
} from '../../../infrastructure/services/adoption.service';
import { RequestTimelineComponent } from './request-timeline.component';

// Secuencia de etapas del flujo de adopciÃ³n (las avanza el propietario/protectora)
const ADOPTION_STAGES: AdoptionStatus[] = [
  'pending',
  'pending_contact',
  'pending_delivery',
  'completed',
];
/**
 * Lista de solicitudes de adopciÃ³n del usuario actual. Distingue entre las
 * solicitudes ENVIADAS (el usuario es adoptante, solo lectura) y las RECIBIDAS
 * (el usuario es propietario/protectora y puede avanzarlas o rechazarlas igual
 * que en la pantalla de gestiÃ³n). Se usa como contenido del tab "Mis
 * solicitudes" en la pÃ¡gina de adopciones.
 */
@Component({
  selector: 'app-my-adoption-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule, ButtonModule, ToastModule, RequestTimelineComponent],
  providers: [MessageService],
  template: `
    <section class="requests-card" aria-live="polite">
      <p-toast />

      <div *ngIf="loading()" class="loading-state">
        <span class="skeleton skeleton-title"></span>
        <span class="skeleton"></span>
        <span class="skeleton"></span>
      </div>

      <p *ngIf="error()" class="error-state">{{ 'adoptions.requestsError' | transloco }}</p>

      <div
        *ngIf="!loading() && !error() && sentRequests().length === 0 && receivedRequests().length === 0"
        class="empty-state"
      >
        <i class="pi pi-heart" aria-hidden="true"></i>
        <h2>{{ 'adoptions.noRequests' | transloco }}</h2>
        <p>{{ 'adoptions.noRequestsDescription' | transloco }}</p>
      </div>

      <!-- Solicitudes RECIBIDAS (soy protectora/propietario): puedo gestionarlas -->
      <div class="requests-group" *ngIf="!loading() && !error() && receivedRequests().length > 0">
        <header class="requests-group-header">
          <i class="pi pi-inbox" aria-hidden="true"></i>
          <div>
            <h2>{{ 'adoptions.receivedRequests' | transloco }}</h2>
            <p>{{ 'adoptions.receivedRequestsDescription' | transloco }}</p>
          </div>
        </header>

        <article class="request" *ngFor="let request of receivedRequests(); trackBy: trackRequest">
          <div class="request-heading">
            <img *ngIf="request.petImage" [src]="request.petImage" [alt]="request.petName" />
            <div class="pet-placeholder" *ngIf="!request.petImage">
              <i class="pi pi-heart" aria-hidden="true"></i>
            </div>
            <div class="request-title">
              <h2>{{ request.petName }}</h2>
              <p>{{ request.species }}<span *ngIf="request.breed"> Â· {{ request.breed }}</span></p>
              <p class="request-adopter">
                <i class="pi pi-user" aria-hidden="true"></i>
                {{ 'adoptions.requestedBy' | transloco }} {{ request.adopterName }}
              </p>
            </div>
            <span class="status" [attr.data-status]="request.status">
              {{ statusTranslationKey(request.status) | transloco }}
            </span>
          </div>

          <p class="request-message" *ngIf="request.message">"{{ request.message }}"</p>

          <div class="adoption-steps" *ngIf="stageIndexOf(request.status) >= 0">
            <div
              class="adoption-step"
              *ngFor="let stage of adoptionStages; let i = index"
              [class.active]="i < stageIndexOf(request.status)"
              [class.current]="i === stageIndexOf(request.status)"
            >
              <span class="adoption-step-dot"></span>
              <span class="adoption-step-label">{{ stageLabel(stage) | transloco }}</span>
            </div>
            <span class="adoption-step-counter">
              {{ 'adoptions.stageOf' | transloco:{ current: stageIndexOf(request.status) + 1, total: adoptionStages.length } }}
            </span>
          </div>

          <div class="request-actions">
            <p-button
              *ngIf="canAdvance(request.status)"
              [label]="'adoptions.advanceStage' | transloco"
              icon="pi pi-arrow-right"
              severity="success"
              size="small"
              (onClick)="advanceRequest(request)"
            />
            <p-button
              *ngIf="canReject(request.status)"
              [label]="'adoptions.reject' | transloco"
              icon="pi pi-times"
              severity="danger"
              size="small"
              [outlined]="true"
              (onClick)="rejectRequest(request)"
            />
            <button type="button" class="secondary-button" (click)="toggleTimeline(request.id)">
              <i class="pi" [class.pi-chevron-down]="!isExpanded(request.id)"
                [class.pi-chevron-up]="isExpanded(request.id)" aria-hidden="true"></i>
              {{ (isExpanded(request.id) ? 'adoptions.hideTimeline' : 'adoptions.showTimeline') | transloco }}
            </button>
          </div>

          <div class="timeline" *ngIf="isExpanded(request.id)">
            <app-request-timeline [request]="request" />
          </div>
        </article>
      </div>

      <!-- Solicitudes ENVIADAS (soy adoptante): solo lectura -->
      <div class="requests-group" *ngIf="!loading() && !error() && sentRequests().length > 0">
        <header class="requests-group-header">
          <i class="pi pi-send" aria-hidden="true"></i>
          <div>
            <h2>{{ 'adoptions.mySentRequests' | transloco }}</h2>
            <p>{{ 'adoptions.mySentRequestsDescription' | transloco }}</p>
          </div>
        </header>

        <article class="request" *ngFor="let request of sentRequests(); trackBy: trackRequest">
          <div class="request-heading">
            <img *ngIf="request.petImage" [src]="request.petImage" [alt]="request.petName" />
            <div class="pet-placeholder" *ngIf="!request.petImage">
              <i class="pi pi-heart" aria-hidden="true"></i>
            </div>
            <div class="request-title">
              <h2>{{ request.petName }}</h2>
              <p>{{ request.species }}<span *ngIf="request.breed"> Â· {{ request.breed }}</span></p>
            </div>
            <span class="status" [attr.data-status]="request.status">
              {{ statusTranslationKey(request.status) | transloco }}
            </span>
          </div>

          <p class="request-message" *ngIf="request.message">{{ request.message }}</p>
          <p class="request-date">
            {{ 'adoptions.requestedOn' | transloco }} {{ request.createdAt | date:'mediumDate' }}
          </p>

          <div class="adoption-steps" *ngIf="stageIndexOf(request.status) >= 0">
            <div
              class="adoption-step"
              *ngFor="let stage of adoptionStages; let i = index"
              [class.active]="i < stageIndexOf(request.status)"
              [class.current]="i === stageIndexOf(request.status)"
            >
              <span class="adoption-step-dot"></span>
              <span class="adoption-step-label">{{ stageLabel(stage) | transloco }}</span>
            </div>
            <span class="adoption-step-counter" *ngIf="!isCompleted(request.status)">
              {{ 'adoptions.stageOf' | transloco:{ current: stageIndexOf(request.status) + 1, total: adoptionStages.length } }}
            </span>
            <span class="adoption-step-counter" *ngIf="isCompleted(request.status)">âœ“ {{ 'adoptions.status.completed' | transloco }}</span>
          </div>

          <div class="request-actions">
            <button type="button" class="secondary-button" (click)="toggleTimeline(request.id)">
              <i class="pi" [class.pi-chevron-down]="!isExpanded(request.id)"
                [class.pi-chevron-up]="isExpanded(request.id)" aria-hidden="true"></i>
              {{ (isExpanded(request.id) ? 'adoptions.hideTimeline' : 'adoptions.showTimeline') | transloco }}
            </button>
            <button
              *ngIf="request.status !== 'completed' && request.status !== 'rejected'"
              type="button"
              class="secondary-button"
              (click)="contactOwner(request)"
              [disabled]="!request.shelterId"
            >
              <i class="pi pi-comment" aria-hidden="true"></i>
              {{ 'adoptions.contactOwner' | transloco }}
            </button>
          </div>

          <div class="timeline" *ngIf="isExpanded(request.id)">
            <app-request-timeline [request]="request" />
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`

    .requests-card { display: flex; flex-direction: column; gap: 1.5rem; }
    .loading-state { display: flex; flex-direction: column; gap: .75rem; padding: 1rem; border-radius: .75rem; background: var(--surface-card, #fff); }
    .skeleton { display: block; height: 1rem; border-radius: .5rem; background: linear-gradient(90deg, #edf1f2, #f8f9f9, #edf1f2); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
    .skeleton-title { width: 45%; height: 2rem; }
    .error-state { display: flex; align-items: flex-start; gap: .6rem; padding: 1rem; border-radius: var(--radius-md); background: var(--danger-color-light); color: var(--danger-color); border: 1px solid color-mix(in srgb, var(--danger-color) 30%, transparent); }
    .empty-state { text-align: center; padding: 2.5rem 1.5rem; border-radius: var(--radius-lg); background: var(--surface-card); border: 1px dashed var(--surface-border); }
    .empty-state i { font-size: 2rem; color: var(--primary-color); }
    .empty-state h2 { margin: .5rem 0; }
    .empty-state p { margin: 0 0 1rem; color: var(--text-secondary); }
    .requests-group { display: flex; flex-direction: column; gap: .75rem; }
    .requests-group-header { display: flex; align-items: flex-start; gap: .75rem; padding: .5rem .25rem; }
    .requests-group-header i { font-size: 1.5rem; color: var(--primary-color); margin-top: .15rem; }
    .requests-group-header h2 { margin: 0; font-size: 1.15rem; }
    .requests-group-header p { margin: .15rem 0 0; color: var(--text-secondary); font-size: .9rem; }
    .request { padding: 1rem; border-radius: .75rem; background: var(--surface-card, #fff); display: flex; flex-direction: column; gap: .5rem; }
    .request-heading { display: flex; gap: .75rem; align-items: center; }
    .request-heading img { width: 3.5rem; height: 3.5rem; border-radius: 50%; object-fit: cover; }
    .pet-placeholder { width: 3.5rem; height: 3.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--surface-ground, #f1f5f4); flex-shrink: 0; }
    .request-title { flex: 1; min-width: 0; }
    .request-title h2 { margin: 0; font-size: 1.1rem; }
    .request-title p { margin: 0; color: var(--text-secondary); }
    .request-adopter { display: inline-flex; align-items: center; gap: .3rem; font-size: .9rem; }
    .status { padding: .25rem .6rem; border-radius: 999px; font-size: .8rem; background: var(--surface-ground, #eef3f1); white-space: nowrap; }
    .status[data-status='completed'], .status[data-status='approved'] { background: var(--success-color-light); color: var(--success-color); font-weight: 600; }
    .status[data-status='rejected'] { background: var(--danger-color-light); color: var(--danger-color); font-weight: 600; }
    .request-message { margin: .25rem 0 0; }
    .request-date { margin: .25rem 0 0; color: var(--text-secondary); font-size: .9rem; }
    .request-actions { display: flex; gap: .5rem; margin-top: .25rem; flex-wrap: wrap; align-items: center; }
    .secondary-button { display: inline-flex; align-items: center; gap: .4rem; padding: .5rem .8rem; border-radius: .6rem; border: 1px solid var(--surface-border, #dfe7e4); background: transparent; cursor: pointer; }
    .secondary-button:disabled { opacity: .5; cursor: not-allowed; }
    .adoption-steps { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; margin-top: .35rem; }
    .adoption-step { display: inline-flex; align-items: center; gap: .35rem; }
    .adoption-step-dot { width: .7rem; height: .7rem; border-radius: 50%; background: var(--surface-border); }
    .adoption-step.active .adoption-step-dot { background: var(--primary-color); }
    .adoption-step.current .adoption-step-dot { box-shadow: 0 0 0 3px var(--primary-color-highlight); }
    .adoption-step-label { font-size: .8rem; color: var(--text-secondary); }
    .adoption-step.current .adoption-step-label { color: var(--text-color, #333); font-weight: 600; }
    .adoption-step-counter { margin-left: auto; font-size: .8rem; color: var(--text-secondary); }
    .timeline { margin-top: .5rem; }
    @keyframes shimmer { to { background-position: -200% 0; } }
    @media (max-width: 520px) { .request-heading { align-items: flex-start; flex-wrap: wrap; } .request-title { min-width: calc(100% - 5rem); } .status { margin-left: 4.35rem; } }
  `],
})

export class MyAdoptionRequestsComponent implements OnInit {
  private readonly adoptionService = inject(AdoptionService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslocoService);
  private readonly messages = inject(MessageService);

  readonly adoptionStages = ADOPTION_STAGES;

  readonly sentRequests = signal<AdoptionRequest[]>([]);
  readonly receivedRequests = signal<AdoptionRequest[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly expandedIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadRequests();
  }

  private loadRequests(): void {
    this.loading.set(true);
    this.error.set(false);
    this.adoptionService.getMyAdoptionRequests().subscribe({
      next: (requests) => {
        this.sentRequests.set(
          [...requests].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading sent adoption requests:', err);
        this.error.set(true);
        this.loading.set(false);
      },
    });

    this.adoptionService.getAdoptionRequestsForMyPets().subscribe({
      next: (requests) => {
        this.receivedRequests.set(
          [...requests].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
      },
      error: (err) => {
        console.error('Error loading received adoption requests:', err);
      },
    });
  }

  toggleTimeline(requestId: string): void {
    const expanded = new Set(this.expandedIds());
    if (expanded.has(requestId)) {
      expanded.delete(requestId);
    } else {
      expanded.add(requestId);
    }
    this.expandedIds.set(expanded);
  }

  isExpanded(requestId: string): boolean {
    return this.expandedIds().has(requestId);
  }

  contactOwner(request: AdoptionRequest): void {
    if (!request.shelterId) return;
    this.router.navigate(['/messages'], {
      queryParams: { userId: request.shelterId, name: request.ownerName || '' },
    });
  }

  // --- GestiÃ³n de solicitudes recibidas (avanzar / rechazar) ---

  stageIndexOf(status: string): number {
    return this.adoptionStages.indexOf((status || '').toLowerCase() as AdoptionStatus);
  }

  canAdvance(status: string): boolean {
    const i = this.stageIndexOf(status);
    return i >= 0 && i < this.adoptionStages.length - 1;
  }

  canReject(status: string): boolean {
    const s = (status || '').toLowerCase();
    return s !== 'completed' && s !== 'rejected';
  }

  isCompleted(status: string): boolean {
    return (status || '').toLowerCase() === 'completed';
  }

  advanceRequest(request: AdoptionRequest): void {
    const next = this.adoptionStages[this.stageIndexOf(request.status) + 1];
    if (!next) return;
    this.updateStatus(request, next);
  }

  rejectRequest(request: AdoptionRequest): void {
    this.updateStatus(request, 'rejected');
  }

  private updateStatus(request: AdoptionRequest, status: AdoptionStatus): void {
    this.adoptionService.updateAdoptionRequestStatus(request.id, status).subscribe({
      next: (updated) => {
        this.receivedRequests.update((requests) =>
          requests.map((r) => (r.id === updated.id ? { ...updated, status } : r)),
        );
        this.messages.add({
          severity: 'success',
          summary: this.i18n.translate('adoptions.requestUpdated'),
          detail: this.i18n.translate('adoptions.requestUpdatedDetail', {
            adopter: request.adopterName,
            pet: request.petName,
            status: this.i18n.translate(this.statusTranslationKey(status)),
          }),
        });
      },
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: this.i18n.translate('adoptions.requestsError'),
          detail: this.i18n.translate('adoptions.requestUpdateError'),
        });
      },
    });
  }

  // --- Etiquetas ---

  stageLabel(stage: AdoptionStatus): string {
    const labels: Record<string, string> = {
      pending: 'adoptions.status.pending',
      pending_contact: 'adoptions.status.pendingContact',
      pending_delivery: 'adoptions.status.pendingDelivery',
      completed: 'adoptions.status.completed',
      rejected: 'adoptions.status.rejected',
      approved: 'adoptions.status.approved',
    };
    return labels[stage] ?? labels['pending'];
  }

  statusTranslationKey(status: AdoptionRequest['status']): string {
    const labels: Record<string, string> = {
      pending: 'adoptions.status.pending',
      pending_contact: 'adoptions.status.pendingContact',
      pending_delivery: 'adoptions.status.pendingDelivery',
      completed: 'adoptions.status.completed',
      rejected: 'adoptions.status.rejected',
      approved: 'adoptions.status.approved',
    };
    return labels[status] ?? labels['pending'];
  }

  trackRequest(_: number, request: AdoptionRequest): string {
    return request.id;
  }
}
