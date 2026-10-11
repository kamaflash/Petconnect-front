import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import {
  AdoptionRequest,
  AdoptionRequestEvent,
  AdoptionService,
} from '../../../infrastructure/services/adoption.service';

/**
 * Lista de solicitudes de adopción del usuario actual. Se usa como contenido
 * del tab "Mis solicitudes" en la página de adopciones; la ruta
 * `/adoptions/my-requests` se conserva como alias que abre ese tab.
 */
@Component({
  selector: 'app-my-adoption-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule],
  template: `
    <section class="requests-card" aria-live="polite">
      <div *ngIf="loading()" class="loading-state">
        <span class="skeleton skeleton-title"></span>
        <span class="skeleton"></span>
        <span class="skeleton"></span>
      </div>

      <p *ngIf="error()" class="error-state">{{ 'adoptions.requestsError' | transloco }}</p>

      <div *ngIf="!loading() && !error() && requests().length === 0" class="empty-state">
        <i class="pi pi-heart" aria-hidden="true"></i>
        <h2>{{ 'adoptions.noRequests' | transloco }}</h2>
        <p>{{ 'adoptions.noRequestsDescription' | transloco }}</p>
      </div>

      <article class="request" *ngFor="let request of requests(); trackBy: trackRequest">
        <div class="request-heading">
          <img *ngIf="request.petImage" [src]="request.petImage" [alt]="request.petName" />
          <div class="pet-placeholder" *ngIf="!request.petImage">
            <i class="pi pi-heart" aria-hidden="true"></i>
          </div>
          <div class="request-title">
            <h2>{{ request.petName }}</h2>
            <p>{{ request.species }}<span *ngIf="request.breed"> · {{ request.breed }}</span></p>
          </div>
          <span class="status" [attr.data-status]="request.status">
            {{ statusTranslationKey(request.status) | transloco }}
          </span>
        </div>

        <p class="request-message" *ngIf="request.message">{{ request.message }}</p>
        <p class="request-date">
          {{ 'adoptions.requestedOn' | transloco }} {{ request.createdAt | date:'mediumDate' }}
        </p>

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
            {{ 'adoptions.contactShelter' | transloco }}
          </button>
        </div>

        <div class="timeline" *ngIf="isExpanded(request.id)">
          <div class="timeline-current">
            <span class="timeline-current-label">{{ 'adoptions.currentStatus' | transloco }}</span>
            <span class="status" [attr.data-status]="request.status">
              {{ statusTranslationKey(request.status) | transloco }}
            </span>
          </div>
          <div *ngIf="timelineLoading()[request.id]" class="loading-state">
            <span class="skeleton"></span>
            <span class="skeleton"></span>
          </div>

          <p *ngIf="timelineErrors()[request.id]" class="error-state">
            {{ 'adoptions.timelineError' | transloco }}
          </p>

          <ol
            *ngIf="!timelineLoading()[request.id] && !timelineErrors()[request.id]"
            class="timeline-list"
          >
            <li class="timeline-empty" *ngIf="(timelines()[request.id] || []).length === 0">
              {{ 'adoptions.timelineEmpty' | transloco }}
            </li>
            <li class="timeline-event" *ngFor="let event of timelines()[request.id] || []; trackBy: trackEvent">
              <span class="timeline-dot" aria-hidden="true"></span>
              <div class="timeline-body">
                <p class="timeline-title">{{ statusTranslationKey(event.status) | transloco }}</p>
                <p class="timeline-comment" *ngIf="event.note">{{ event.note }}</p>
                <p class="timeline-date">{{ event.createdAt | date:'medium' }}</p>
              </div>
            </li>
          </ol>
        </div>
      </article>
    </section>
  `,
  styles: [`
    .requests-card { display: flex; flex-direction: column; gap: 1rem; }
    .loading-state { display: flex; flex-direction: column; gap: .75rem; padding: 1rem; border-radius: .75rem; background: var(--surface-card, #fff); }
    .skeleton { display: block; height: 1rem; border-radius: .5rem; background: linear-gradient(90deg, #edf1f2, #f8f9f9, #edf1f2); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
    .skeleton-title { width: 45%; height: 2rem; }
    .error-state { padding: 1rem; border-radius: .75rem; background: #fdecea; color: #b3261e; }
    .empty-state { text-align: center; padding: 2.5rem 1rem; border-radius: .75rem; background: var(--surface-card, #fff); }
    .empty-state i { font-size: 2rem; color: var(--primary-color, #4d7c70); }
    .empty-state h2 { margin: .5rem 0; }
    .empty-state p { margin: 0 0 1rem; color: var(--text-color-secondary, #607d8b); }
    .request { padding: 1rem; border-radius: .75rem; background: var(--surface-card, #fff); }
    .request-heading { display: flex; gap: .75rem; align-items: center; }
    .request-heading img { width: 3.5rem; height: 3.5rem; border-radius: 50%; object-fit: cover; }
    .pet-placeholder { width: 3.5rem; height: 3.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--surface-ground, #f1f5f4); }
    .request-title { flex: 1; min-width: 0; }
    .request-title h2 { margin: 0; font-size: 1.1rem; }
    .request-title p { margin: 0; color: var(--text-secondary); }
    .status { padding: .25rem .6rem; border-radius: 999px; font-size: .8rem; background: var(--surface-ground, #eef3f1); }
    .status[data-status='completed'], .status[data-status='approved'] { background: #e6f4ea; color: #1e7e34; }
    .status[data-status='rejected'] { background: #fdecea; color: #b3261e; }
    .request-message { margin: .75rem 0 0; }
    .request-date { margin: .25rem 0 0; color: var(--text-secondary); font-size: .9rem; }
    .request-actions { display: flex; gap: .5rem; margin-top: .75rem; flex-wrap: wrap; }
    .secondary-button { display: inline-flex; align-items: center; gap: .4rem; padding: .5rem .8rem; border-radius: .6rem; border: 1px solid var(--surface-border, #dfe7e4); background: transparent; cursor: pointer; }
    .secondary-button:disabled { opacity: .5; cursor: not-allowed; }
    .timeline { margin-top: .75rem; }
    .timeline-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .75rem; }
    .timeline-event { display: flex; gap: .6rem; }
    .timeline-dot { width: .65rem; height: .65rem; margin-top: .3rem; border-radius: 50%; background: var(--primary-color, #4d7c70); flex-shrink: 0; }
    .timeline-title { margin: 0; font-weight: 600; }
    .timeline-comment { margin: .15rem 0; }
    .timeline-date { margin: 0; font-size: .85rem; color: var(--text-secondary); }
    .timeline-current { display: flex; align-items: center; gap: .6rem; margin-bottom: .75rem; padding: .75rem 1rem; background: var(--surface-card, #fff); border: 1px solid var(--surface-border, #e6e9ee); border-radius: .75rem; }
    .timeline-current-label { font-size: .75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .06em; }
    @keyframes shimmer { to { background-position: -200% 0; } }
    @media (max-width: 520px) { .request-heading { align-items: flex-start; flex-wrap: wrap; } .request-title { min-width: calc(100% - 5rem); } .status { margin-left: 4.35rem; } }
  `],
})
export class MyAdoptionRequestsComponent implements OnInit {
  private readonly adoptionService = inject(AdoptionService);
  private readonly router = inject(Router);

  readonly requests = signal<AdoptionRequest[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly expandedIds = signal<Set<string>>(new Set());
  readonly timelines = signal<Record<string, AdoptionRequestEvent[]>>({});
  readonly timelineLoading = signal<Record<string, boolean>>({});
  readonly timelineErrors = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.adoptionService.getMyAdoptionRequests().subscribe({
      next: requests => {
        this.requests.set([...requests].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ));
        this.loading.set(false);
      },
      error: err => {
        console.error('Error loading my adoption requests:', err);
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  toggleTimeline(requestId: string): void {
    const expanded = new Set(this.expandedIds());
    if (expanded.has(requestId)) {
      expanded.delete(requestId);
      this.expandedIds.set(expanded);
      return;
    }
    expanded.add(requestId);
    this.expandedIds.set(expanded);
    if (this.timelines()[requestId] || this.timelineLoading()[requestId]) return;

    this.timelineLoading.update(current => ({ ...current, [requestId]: true }));
    this.adoptionService.getAdoptionRequestTimeline(requestId).subscribe({
      next: events => {
        this.timelines.update(current => ({ ...current, [requestId]: events }));
        this.timelineLoading.update(current => ({ ...current, [requestId]: false }));
      },
      error: err => {
        console.error('Error loading adoption request timeline:', err);
        this.timelineErrors.update(current => ({ ...current, [requestId]: true }));
        this.timelineLoading.update(current => ({ ...current, [requestId]: false }));
      },
    });
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

  statusTranslationKey(status: AdoptionRequest['status']): string {
    const labels: Record<AdoptionRequest['status'], string> = {
      pending: 'adoptions.status.pending',
      pending_contact: 'adoptions.status.pendingContact',
      pending_delivery: 'adoptions.status.pendingDelivery',
      completed: 'adoptions.status.completed',
      rejected: 'adoptions.status.rejected',
      approved: 'adoptions.status.approved',
    };
    return labels[status] ?? labels.pending;
  }

  trackRequest(_: number, request: AdoptionRequest): string {
    return request.id;
  }

  trackEvent(_: number, event: AdoptionRequestEvent): string {
    return event.id;
  }
}
