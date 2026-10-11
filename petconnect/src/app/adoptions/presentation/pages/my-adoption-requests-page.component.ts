import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import {
  AdoptionRequest,
  AdoptionRequestEvent,
  AdoptionService,
} from '../../infrastructure/services/adoption.service';
import { PageHeadingCardComponent } from '../../../shared/presentation/components/page-heading-card/page-heading-card.component';

@Component({
  selector: 'app-my-adoption-requests-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule, PageHeadingCardComponent],
  template: `
    <main class="requests-page">
      <app-page-heading-card
        [title]="'adoptions.myRequests' | transloco"
        [subtitle]="'adoptions.requestsSubtitle' | transloco"
      />

      <a class="back-link" routerLink="/adoptions">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        {{ 'adoptions.backToListings' | transloco }}
      </a>

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
          <a routerLink="/adoptions">{{ 'adoptions.explorePets' | transloco }}</a>
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
              {{ 'adoptions.contactOwner' | transloco }}
            </button>
          </div>

          <section *ngIf="isExpanded(request.id)" class="timeline">
            <p *ngIf="timelineLoading()[request.id]" class="muted">
              {{ 'adoptions.loadingTimeline' | transloco }}
            </p>
            <p *ngIf="timelineErrors()[request.id]" class="error-state">
              {{ 'adoptions.timelineError' | transloco }}
            </p>
            <ol *ngIf="!timelineLoading()[request.id] && !timelineErrors()[request.id]">
              <li *ngFor="let event of timelines()[request.id]; trackBy: trackEvent">
                <span class="timeline-dot"></span>
                <div>
                  <strong>{{ statusTranslationKey(event.status) | transloco }}</strong>
                  <p>{{ event.note || (statusTranslationKey(event.status) | transloco) }}</p>
                  <small>
                    {{ event.actorName || ('adoptions.participant' | transloco) }}
                    · {{ event.createdAt | date:'medium' }}
                  </small>
                </div>
              </li>
            </ol>
          </section>
        </article>
      </section>
    </main>
  `,
  styles: [`
    .requests-page { max-width: var(--max-page-width); min-height: 100vh; margin: 0 auto; padding: 0 1rem 2rem; box-sizing: border-box; }
    .back-link { display: inline-flex; gap: .5rem; align-items: center; margin: .75rem 0 1rem; color: var(--primary-color, #426d62); text-decoration: none; }
    .requests-card { padding: clamp(1rem, 3vw, 1.5rem); border: 1px solid var(--surface-border, #e0e6e8); border-radius: 1rem; background: var(--surface-card, #fff); }
    .request { padding: 1.25rem 0; border-bottom: 1px solid var(--surface-border, #e0e6e8); }
    .request:first-child { padding-top: 0; }
    .request:last-child { padding-bottom: 0; border-bottom: 0; }
    .request-heading { display: flex; align-items: center; gap: .85rem; }
    .request-heading img, .pet-placeholder { width: 3.5rem; height: 3.5rem; flex: 0 0 3.5rem; border-radius: .75rem; object-fit: cover; background: var(--surface-ground, #f1f5f4); }
    .pet-placeholder { display: grid; place-items: center; color: var(--primary-color, #426d62); }
    .request-title { min-width: 0; flex: 1; }
    h2 { margin: 0; font-size: 1.05rem; }
    .request-title p, .request-date, .muted { margin: .25rem 0 0; color: var(--text-color-secondary, #64748b); font-size: .9rem; }
    .status { padding: .35rem .65rem; border-radius: 999px; background: var(--surface-ground, #f1f5f4); font-size: .8rem; white-space: nowrap; }
    .status[data-status="completed"] { color: #216e49; background: #e9f6ee; }
    .status[data-status="rejected"] { color: #8c3a3a; background: #fbefef; }
    .request-message { margin: 1rem 0 .5rem; }
    .request-actions { display: flex; flex-wrap: wrap; gap: .65rem; margin-top: 1rem; }
    .secondary-button { display: inline-flex; gap: .5rem; align-items: center; padding: .55rem .75rem; border: 1px solid var(--surface-border, #d9e2e8); border-radius: .65rem; background: var(--surface-card, #fff); color: var(--text-color, #263238); cursor: pointer; }
    .secondary-button:disabled { opacity: .5; cursor: not-allowed; }
    .timeline { margin: 1.25rem 0 0 .5rem; padding: 0 0 0 1rem; border-left: 2px solid var(--surface-border, #d9e2e8); }
    .timeline ol { margin: 0; padding: 0; list-style: none; }
    .timeline li { position: relative; display: flex; gap: .75rem; padding: 0 0 1.15rem .25rem; }
    .timeline li:last-child { padding-bottom: 0; }
    .timeline-dot { position: absolute; left: -1.43rem; top: .25rem; width: .65rem; height: .65rem; border: 2px solid var(--surface-card, #fff); border-radius: 50%; background: var(--primary-color, #4d7c70); }
    .timeline p { margin: .2rem 0; }
    .timeline small { color: var(--text-color-secondary, #64748b); }
    .empty-state { padding: 2.5rem 1rem; text-align: center; }
    .empty-state > i { color: var(--primary-color, #4d7c70); font-size: 1.75rem; }
    .empty-state p { color: var(--text-color-secondary, #64748b); }
    .empty-state a { color: var(--primary-color, #426d62); }
    .error-state { color: #9d3030; }
    .loading-state { display: grid; gap: .8rem; }
    .skeleton { display: block; width: 100%; height: 1rem; border-radius: .5rem; background: linear-gradient(90deg, #edf1f2, #f8f9f9, #edf1f2); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
    .skeleton-title { width: 45%; height: 2rem; }
    @keyframes shimmer { to { background-position: -200% 0; } }
    @media (max-width: 520px) { .request-heading { align-items: flex-start; flex-wrap: wrap; } .request-title { min-width: calc(100% - 5rem); } .status { margin-left: 4.35rem; } }
  `],
})
export class MyAdoptionRequestsPageComponent implements OnInit {
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
