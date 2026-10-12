import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import {
  AdoptionRequest,
  AdoptionRequestEvent,
  AdoptionService,
} from '../../../infrastructure/services/adoption.service';

/**
 * Línea temporal (timeline) de una solicitud de adopción concreta.
 */
@Component({
  selector: 'app-request-timeline',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  template: `
    <div class="timeline-current">
      <span class="timeline-current-label">{{ 'adoptions.currentStatus' | transloco }}</span>
      <span class="status" [attr.data-status]="request.status">
        {{ statusTranslationKey(request.status) | transloco }}
      </span>
    </div>
    <div *ngIf="loading()" class="loading-state">
      <span class="skeleton"></span>
      <span class="skeleton"></span>
    </div>
    <p *ngIf="loadError()" class="error-state">{{ 'adoptions.timelineError' | transloco }}</p>
    <ol *ngIf="!loading() && !loadError()" class="timeline-list">
      <li class="timeline-empty" *ngIf="events().length === 0">
        {{ 'adoptions.timelineEmpty' | transloco }}
      </li>
      <li class="timeline-event" *ngFor="let event of events(); trackBy: trackEvent">
        <span class="timeline-dot" aria-hidden="true"></span>
        <div class="timeline-body">
          <p class="timeline-title">{{ statusTranslationKey(event.status) | transloco }}</p>
          <p class="timeline-comment" *ngIf="event.note">{{ event.note }}</p>
          <p class="timeline-date">{{ event.createdAt | date:'medium' }}</p>
        </div>
      </li>
    </ol>
  `,
  styles: [`
    .timeline-current { display: flex; align-items: center; gap: .6rem; margin-bottom: .75rem; padding: .75rem 1rem; background: var(--surface-card, #fff); border: 1px solid var(--surface-border, #e6e9ee); border-radius: .75rem; }
    .timeline-current-label { font-size: .75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .06em; }
    .status { padding: .25rem .6rem; border-radius: 999px; font-size: .8rem; background: var(--surface-ground, #eef3f1); }
    .status[data-status='completed'], .status[data-status='approved'] { background: #e6f4ea; color: #1e7e34; }
    .status[data-status='rejected'] { background: #fdecea; color: #b3261e; }
    .loading-state { display: flex; flex-direction: column; gap: .5rem; }
    .skeleton { display: block; height: 1rem; border-radius: .5rem; background: linear-gradient(90deg, #edf1f2, #f8f9f9, #edf1f2); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
    .error-state { padding: .75rem 1rem; border-radius: .75rem; background: #fdecea; color: #b3261e; }
    .timeline-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .75rem; }
    .timeline-event { display: flex; gap: .6rem; }
    .timeline-dot { width: .65rem; height: .65rem; margin-top: .3rem; border-radius: 50%; background: var(--primary-color, #4d7c70); flex-shrink: 0; }
    .timeline-title { margin: 0; font-weight: 600; }
    .timeline-comment { margin: .15rem 0; }
    .timeline-date { margin: 0; font-size: .85rem; color: var(--text-secondary); }
    .timeline-empty { color: var(--text-secondary); }
    @keyframes shimmer { to { background-position: -200% 0; } }
  `],
})
export class RequestTimelineComponent implements OnInit {
  private readonly adoptionService = inject(AdoptionService);

  @Input() request!: AdoptionRequest;
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly events = signal<AdoptionRequestEvent[]>([]);

  ngOnInit(): void {
    this.adoptionService.getAdoptionRequestTimeline(this.request.id).subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading adoption request timeline:', err);
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  statusTranslationKey(status: AdoptionRequestEvent['status']): string {
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

  trackEvent(_: number, event: AdoptionRequestEvent): string {
    return event.id;
  }
}
