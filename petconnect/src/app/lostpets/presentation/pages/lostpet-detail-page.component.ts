import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { ModalComponent } from '../../../shared/presentation/components/modal/modal';
import { GeolocationService } from '../../../shared/services/geolocation.service';
import {
  LostPetsService,
  LostPetReport,
  LostPetSighting,
  LostPetStatus,
} from '../../infrastructure/services/lost-pets.service';

@Component({
  selector: 'app-lostpet-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    SkeletonModule,
    TagModule,
    ToastModule,
    TranslocoModule,
    DynamicFormComponent,
    ModalComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <main class="page-content detail-page">
      <a class="back-link" routerLink="/lostpets">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        {{ 'lostPets.back' | transloco }}
      </a>

      @if (loading()) {
        <section class="detail-card card-modern" aria-busy="true">
          <p-skeleton height="16rem" />
          <div class="detail-body">
            <p-skeleton width="50%" height="1.6rem" />
            <p-skeleton width="70%" height="1rem" />
            <p-skeleton width="90%" height="1rem" />
          </div>
        </section>
      } @else if (error()) {
        <section class="state-card" role="alert">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <h2>{{ 'lostPets.errorTitle' | transloco }}</h2>
          <p>{{ error() }}</p>
          <button type="button" pButton [label]="'lostPets.retry' | transloco" (click)="retry()"></button>
        </section>
      } @else if (report(); as r) {
        <article class="detail-card card-modern">
          <div class="detail-photo">
            @if (r.photoUrl) {
              <img [src]="r.photoUrl" [alt]="r.petName" />
            } @else {
              <div class="photo-placeholder"><i class="pi pi-image" aria-hidden="true"></i></div>
            }
            <p-tag class="status-tag" [value]="statusLabel(r.status)"
              [severity]="statusSeverity(r.status)" />
          </div>
          <div class="detail-body">
            <h1 class="detail-name">{{ r.petName }}</h1>
            <p class="detail-meta">
              {{ speciesLabel(r.species) }} ·
              {{ r.breed || r.color || ('lostPets.unknownBreed' | transloco) }}
            </p>
            <p class="detail-meta">
              <i class="pi pi-calendar" aria-hidden="true"></i>
              {{ r.lostDate | date:'mediumDate' }}
            </p>
            <p class="detail-meta">
              <i class="pi pi-map-marker" aria-hidden="true"></i>
              {{ r.lastSeenArea }}
              @if (r.distanceKm != null) {
                <span class="distance"> · {{ geolocation.formatDistance(r.distanceKm) }}</span>
              }
            </p>
            @if (r.rewardAmount) {
              <p class="detail-reward">
                <i class="pi pi-euro" aria-hidden="true"></i> {{ r.rewardAmount }}
              </p>
            }
            @if (r.description) {
              <p class="detail-description">{{ r.description }}</p>
            }
            <p class="detail-meta">
              <i class="pi pi-user" aria-hidden="true"></i>
              {{ r.reporterName }}
            </p>

            <div class="detail-actions">
              <button type="button" pButton class="p-button-outlined"
                icon="pi pi-share-alt" [label]="'lostPets.share' | transloco"
                (click)="share(r)"></button>
              <button type="button" pButton class="p-button-outlined"
                icon="pi pi-envelope" [label]="'lostPets.contact' | transloco"
                (click)="contact()"></button>
            </div>
            @if (r.owner) {
              <section class="status-actions" aria-label="{{ 'lostPets.status' | transloco }}">
                @for (s of availableStatuses(); track s) {
                  @if (s !== r.status) {
                    <button type="button" pButton class="p-button-outlined p-button-sm"
                      [label]="statusLabel(s)" (click)="changeStatus(s)"></button>
                  }
                }
              </section>
            }
          </div>
        </article>

        <section class="sightings-section card-modern">
          <header class="sightings-header">
            <h2>{{ 'lostPets.sightings' | transloco }} ({{ sightings().length }})</h2>
            <button type="button" pButton icon="pi pi-plus"
              [label]="'lostPets.sightingTitle' | transloco"
              (click)="openSightingDialog()"></button>
          </header>
          @if (sightings().length === 0) {
            <p class="sightings-empty">{{ 'lostPets.sightingsEmpty' | transloco }}</p>
          } @else {
            <ul class="sightings-list">
              @for (s of sightings(); track s.id) {
                <li class="sighting-item">
                  <div class="sighting-head">
                    <span class="sighting-date">
                      <i class="pi pi-calendar" aria-hidden="true"></i>
                      {{ s.sightedAt | date:'mediumDate' }}
                    </span>
                    @if (s.area) {
                      <span class="sighting-area">
                        <i class="pi pi-map-marker" aria-hidden="true"></i> {{ s.area }}
                      </span>
                    }
                  </div>
                  <p class="sighting-description">{{ s.description }}</p>
                  <span class="sighting-author">{{ s.reporterName }}</span>
                </li>
              }
            </ul>
          }
        </section>
      }
    </main>

    <app-modal
      [visible]="sightingDialogOpen()"
      [header]="'lostPets.sightingTitle' | transloco"
      size="medium"
      [showConfirm]="false"
      [showCancel]="false"
      [hideFooter]="true"
      (onHide)="closeSightingDialog()"
    >
      <app-dynamic-form
        [config]="sightingFormConfig"
        [formData]="sightingFormData"
        (onSubmitClick)="submitSighting($event)"
        (onCancel)="closeSightingDialog()"
      />
    </app-modal>
  `,
  styles: [`
    :host { display: block; }
    .detail-page { max-width: 52rem; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
    .back-link { display: inline-flex; align-items: center; gap: .4rem; align-self: flex-start; color: var(--text-secondary); text-decoration: none; font-size: .9rem; }
    .back-link:hover { color: var(--text-primary); }
    .card-modern { overflow: hidden; border: 1px solid var(--surface-border); border-radius: var(--radius-lg); background: var(--surface-card); }
    .detail-photo { position: relative; height: 16rem; background: var(--surface-hover); }
    .detail-photo img { width: 100%; height: 100%; object-fit: cover; }
    .photo-placeholder { display: grid; place-items: center; height: 100%; color: var(--text-secondary); font-size: 2.5rem; }
    .status-tag { position: absolute; top: .75rem; right: .75rem; }
    .detail-body { display: flex; flex-direction: column; gap: .5rem; padding: 1.25rem; }
    .detail-name { margin: 0; font-size: 1.5rem; }
    .detail-meta { margin: 0; font-size: .9rem; color: var(--text-secondary); }
    .detail-meta i { margin-right: .35rem; }
    .distance { color: var(--primary-color); font-weight: 600; }
    .detail-reward { margin: 0; font-weight: 700; color: var(--primary-color); }
    .detail-description { margin: 0; line-height: 1.5; }
    .detail-actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .5rem; }
    .status-actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .5rem; padding-top: .75rem; border-top: 1px solid var(--surface-border); }
    .sightings-section { padding: 1.25rem; }
    .sightings-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: .75rem; }
    .sightings-header h2 { margin: 0; font-size: 1.1rem; }
    .sightings-empty { margin: 0; color: var(--text-secondary); }
    .sightings-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .75rem; }
    .sighting-item { padding: .75rem 1rem; border: 1px solid var(--surface-border); border-radius: var(--radius-md); background: var(--surface-ground); }
    .sighting-head { display: flex; flex-wrap: wrap; gap: 1rem; font-size: .82rem; color: var(--text-secondary); }
    .sighting-head i { margin-right: .3rem; }
    .sighting-description { margin: .4rem 0 .25rem; }
    .sighting-author { font-size: .78rem; color: var(--text-secondary); }
    .state-card { display: grid; place-items: center; gap: .5rem; padding: 3rem 1rem; text-align: center; border: 1px dashed var(--surface-border); border-radius: var(--radius-lg); background: var(--surface-card); }
    .state-card i { font-size: 2rem; color: var(--text-secondary); }
    .state-card h2 { margin: 0; font-size: 1.1rem; }
    .state-card p { margin: 0 0 .5rem; color: var(--text-secondary); }
    @media (max-width: 640px) { .detail-photo { height: 12rem; } }
  `],
})
export class LostPetDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lostPetsService = inject(LostPetsService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(TranslocoService);
  readonly geolocation = inject(GeolocationService);

  readonly report = signal<LostPetReport | null>(null);
  readonly sightings = signal<LostPetSighting[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly sightingDialogOpen = signal(false);

  private reportId: string | null = null;

  sightingFormData: Record<string, unknown> = {};

  readonly sightingFormConfig: DynamicFormConfig = {
    showSubmit: true,
    showCancel: true,
    submitLabel: this.i18n.translate('lostPets.sightingSubmit'),
    cancelLabel: this.i18n.translate('common.cancel'),
    fields: [
      { key: 'sightingDate', label: this.i18n.translate('lostPets.sightingDate'), type: 'date',
        validation: { required: true } },
      { key: 'sightingArea', label: this.i18n.translate('lostPets.sightingArea'), type: 'input',
        placeholder: this.i18n.translate('lostPets.sightingAreaPlaceholder'),
        validation: { maxLength: 255 } },
      { key: 'description', label: this.i18n.translate('common.description'), type: 'textarea',
        rows: 3, validation: { required: true, maxLength: 1000 } },
    ],
  };

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.error.set(this.i18n.translate('lostPets.error'));
        this.loading.set(false);
        return;
      }
      this.reportId = id;
      this.load(id);
    });
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.lostPetsService.getById(id).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.translate('lostPets.error'));
        this.loading.set(false);
      },
    });
    this.lostPetsService.getSightings(id).subscribe({
      next: (sightings) => this.sightings.set(sightings),
      error: () => this.sightings.set([]),
    });
  }

  retry(): void {
    if (this.reportId) {
      this.load(this.reportId);
    } else {
      void this.router.navigate(['/lostpets']);
    }
  }

  availableStatuses(): LostPetStatus[] {
    return ['LOST', 'FOUND', 'REUNITED', 'CLOSED'];
  }
  changeStatus(status: LostPetStatus): void {
    if (!this.reportId) return;
    this.lostPetsService.updateStatus(this.reportId, status).subscribe({
      next: (report) => {
        this.report.set(report);
        this.messages.add({
          severity: 'success',
          summary: this.i18n.translate('common.success'),
          detail: this.i18n.translate('lostPets.statusUpdatedDetail', { status: this.statusLabel(status) }),
        });
      },
      error: () => this.messages.add({
        severity: 'error',
        summary: this.i18n.translate('lostPets.errorTitle'),
        detail: this.i18n.translate('lostPets.statusError'),
      }),
    });
  }

  openSightingDialog(): void {
    this.sightingFormData = { sightingDate: new Date().toISOString().slice(0, 10) };
    this.sightingDialogOpen.set(true);
  }

  closeSightingDialog(): void {
    this.sightingDialogOpen.set(false);
  }

  submitSighting(values: Record<string, unknown>): void {
    if (!this.reportId) return;
    this.lostPetsService.addSighting(this.reportId, {
      sightedAt: this.toIsoDate(values['sightingDate']),
      area: (values['sightingArea'] as string) || null,
      description: String(values['description'] ?? ''),
    }).subscribe({
      next: (sighting) => {
        this.sightings.update((list) => [...list, sighting]);
        this.report.update((r) => (r ? { ...r, sightingsCount: r.sightingsCount + 1 } : r));
        this.closeSightingDialog();
        this.messages.add({
          severity: 'success',
          summary: this.i18n.translate('common.success'),
          detail: this.i18n.translate('lostPets.sightingCreatedDetail'),
        });
      },
      error: () => this.messages.add({
        severity: 'error',
        summary: this.i18n.translate('lostPets.errorTitle'),
        detail: this.i18n.translate('lostPets.sightingError'),
      }),
    });
  }

  contact(): void {
    void this.router.navigate(['/messages']);
  }

  share(report: LostPetReport): void {
    const url = `${window.location.origin}/lostpets/${report.id}`;
    const text = this.i18n.translate('lostPets.shareText', {
      name: report.petName,
      area: report.lastSeenArea,
    });
    if (navigator.share) {
      void navigator.share({ title: report.petName, text, url }).catch(() => undefined);
      return;
    }
    void navigator.clipboard?.writeText(`${text} ${url}`).then(
      () => this.messages.add({
        severity: 'success',
        summary: this.i18n.translate('lostPets.shareCopiedTitle'),
        detail: this.i18n.translate('lostPets.shareCopied'),
      }),
      () => this.messages.add({ severity: 'info', summary: report.petName, detail: url }),
    );
  }

  speciesLabel(species: string): string {
    const key = `common.${species.toLowerCase()}`;
    const translated = this.i18n.translate(key);
    return translated === key ? species : translated;
  }

  statusLabel(status: LostPetStatus): string {
    switch (status) {
      case 'LOST': return this.i18n.translate('lostPets.lost');
      case 'FOUND': return this.i18n.translate('lostPets.found');
      case 'REUNITED': return this.i18n.translate('lostPets.reunited');
      default: return this.i18n.translate('lostPets.closed');
    }
  }

  statusSeverity(status: LostPetStatus): 'danger' | 'warn' | 'success' | 'secondary' {
    switch (status) {
      case 'LOST': return 'danger';
      case 'FOUND': return 'warn';
      case 'REUNITED': return 'success';
      default: return 'secondary';
    }
  }

  private toIsoDate(value: unknown): string {
    if (!value) return new Date().toISOString().slice(0, 10);
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value);
  }
}
