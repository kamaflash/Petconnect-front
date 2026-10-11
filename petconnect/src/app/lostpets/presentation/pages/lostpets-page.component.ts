import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { ModalComponent } from '../../../shared/presentation/components/modal/modal';
import { PageHeadingCardComponent } from '../../../shared/presentation/components/page-heading-card/page-heading-card.component';
import { GeolocationService } from '../../../shared/services/geolocation.service';
import { LostPetsService, LostPetReport, LostPetStatus } from '../../infrastructure/services/lost-pets.service';

/** Especies ofrecidas en el filtro, alineadas con el enum del backend. */
const SPECIES = [
  'DOG', 'CAT', 'BIRD', 'RABBIT', 'HAMSTER', 'GUINEA_PIG', 'TURTLE',
  'FISH', 'SNAKE', 'LIZARD', 'HORSE', 'OTHER',
] as const;

@Component({
  selector: 'app-lostpets-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    SelectModule,
    SkeletonModule,
    TagModule,
    ToastModule,
    FormsModule,
    TranslocoModule,
    DynamicFormComponent,
    ModalComponent,
    PageHeadingCardComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-content">
      <app-page-heading-card
        [title]="'lostPets.title' | transloco"
        [subtitle]="'lostPets.subtitle' | transloco"
      >
        <button
          page-heading-actions
          type="button"
          class="report-button"
          [attr.aria-label]="'lostPets.report' | transloco"
          [title]="'lostPets.report' | transloco"
          (click)="openCreate()"
        >
          <i class="pi pi-plus" aria-hidden="true"></i>
        </button>
      </app-page-heading-card>

      <section class="filters-bar card-modern">
        <div class="filter-field">
          <label for="species-filter">{{ 'lostPets.filterSpecies' | transloco }}</label>
          <p-select
            inputId="species-filter"
            [(ngModel)]="speciesFilter"
            [options]="speciesOptions()"
            optionLabel="label"
            optionValue="value"
            [showClear]="true"
            (onChange)="load()"
          />
        </div>
        <div class="filter-field">
          <label for="status-filter">{{ 'lostPets.status' | transloco }}</label>
          <p-select
            inputId="status-filter"
            [(ngModel)]="statusFilter"
            [options]="statusOptions()"
            optionLabel="label"
            optionValue="value"
            [showClear]="true"
            (onChange)="load()"
          />
        </div>
        <div class="filter-field">
          <label for="from-filter">{{ 'lostPets.filterFrom' | transloco }}</label>
          <input id="from-filter" type="date" class="date-input"
            [(ngModel)]="fromFilter" (change)="load()" />
        </div>
        <div class="filter-field">
          <label for="to-filter">{{ 'lostPets.filterTo' | transloco }}</label>
          <input id="to-filter" type="date" class="date-input"
            [(ngModel)]="toFilter" (change)="load()" />
        </div>
        <button
          type="button"
          pButton
          class="p-button-outlined nearby-toggle"
          [class.active]="nearbyOnly()"
          [attr.aria-pressed]="nearbyOnly()"
          (click)="toggleNearby()"
        >
          <i class="pi pi-map-marker" aria-hidden="true"></i>
          {{ (nearbyOnly() ? 'lostPets.nearbyActive' : 'lostPets.nearby') | transloco }}
        </button>
      </section>

      @if (loading()) {
        <div class="reports-grid" aria-busy="true">
          @for (placeholder of [1, 2, 3, 4]; track placeholder) {
            <article class="report-card skeleton-card" aria-hidden="true">
              <p-skeleton height="150px" />
              <div class="report-body">
                <p-skeleton width="60%" height="1.1rem" />
                <p-skeleton width="40%" height=".85rem" />
                <p-skeleton width="85%" height=".85rem" />
              </div>
            </article>
          }
        </div>
      } @else if (error()) {
        <section class="state-card" role="alert">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <h2>{{ 'lostPets.errorTitle' | transloco }}</h2>
          <p>{{ error() }}</p>
          <button type="button" pButton [label]="'lostPets.retry' | transloco" (click)="load()"></button>
        </section>
      } @else if (reports().length === 0) {
        <section class="state-card">
          <i class="pi pi-search" aria-hidden="true"></i>
          <h2>{{ 'lostPets.emptyTitle' | transloco }}</h2>
          <p>{{ 'lostPets.emptyDescription' | transloco }}</p>
          <button type="button" pButton [label]="'lostPets.report' | transloco" (click)="openCreate()"></button>
        </section>
      } @else {
        <div class="reports-grid">
          @for (report of reports(); track report.id) {
            <article class="report-card">
              <div class="report-photo">
                @if (report.photoUrl) {
                  <img [src]="report.photoUrl" [alt]="report.petName" loading="lazy" />
                } @else {
                  <div class="photo-placeholder"><i class="pi pi-image" aria-hidden="true"></i></div>
                }
                <p-tag class="status-tag" [value]="statusLabel(report.status)"
                  [severity]="statusSeverity(report.status)" />
              </div>
              <div class="report-body">
                <h3 class="report-name">{{ report.petName }}</h3>
                <p class="report-meta">
                  {{ speciesLabel(report.species) }} ·
                  {{ report.breed || report.color || ('lostPets.unknownBreed' | transloco) }}
                </p>
                <p class="report-meta">
                  <i class="pi pi-calendar" aria-hidden="true"></i>
                  {{ report.lostDate | date:'mediumDate' }}
                </p>
                <p class="report-meta">
                  <i class="pi pi-map-marker" aria-hidden="true"></i>
                  {{ report.lastSeenArea }}
                  @if (report.distanceKm != null) {
                    <span class="distance"> · {{ geolocation.formatDistance(report.distanceKm) }}</span>
                  }
                </p>
                @if (report.rewardAmount) {
                  <p class="report-reward">
                    <i class="pi pi-euro" aria-hidden="true"></i> {{ report.rewardAmount }}
                  </p>
                }
                <p class="report-meta">
                  <i class="pi pi-eye" aria-hidden="true"></i>
                  {{ report.sightingsCount }} {{ 'lostPets.sightings' | transloco }}
                </p>
                <div class="report-actions">
                  <button type="button" pButton class="p-button-text p-button-sm"
                    [label]="'lostPets.viewDetail' | transloco"
                    (click)="goToDetail(report)"></button>
                  <button type="button" pButton class="p-button-text p-button-sm"
                    icon="pi pi-share-alt"
                    [attr.aria-label]="'lostPets.share' | transloco"
                    [title]="'lostPets.share' | transloco"
                    (click)="share(report)"></button>
                  @if (report.owner) {
                    <button type="button" pButton class="p-button-text p-button-sm"
                      [label]="'lostPets.edit' | transloco" (click)="openEdit(report)"></button>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }
      </div>

    <app-modal
      [visible]="dialogOpen()"
      [header]="(editing() ? 'lostPets.editTitle' : 'lostPets.reportTitle') | transloco"
      size="medium"
      [showConfirm]="false"
      [showCancel]="false"
      [hideFooter]="true"
      (onHide)="closeDialog()"
    >
      <app-dynamic-form
        [config]="reportFormConfig"
        [formData]="reportFormData"
        (onSubmitClick)="submitReport($event)"
        (onCancel)="closeDialog()"
      />
    </app-modal>
  `,
  styles: [`
    :host { display: block; }
    .lostpets-page { max-width: var(--max-page-width); margin: 0 auto; }
    .card-modern {
      overflow: hidden; margin-bottom: 1rem; padding: 1rem;
      border: 1px solid var(--surface-border); border-radius: var(--radius-lg);
      background: var(--surface-card);
    }
    .filters-bar { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; }
    .filter-field { display: flex; flex-direction: column; gap: .35rem; min-width: 11rem; }
    .filter-field label { font-size: .8rem; font-weight: 600; color: var(--text-secondary); }
    .date-input {
      padding: .55rem .65rem; border: 1px solid var(--surface-border);
      border-radius: var(--radius-md); background: var(--surface-ground);
      color: var(--text-primary); font: inherit;
    }
    .nearby-toggle.active { border-color: var(--primary-color); color: var(--primary-color); }
    .reports-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); }
    .report-card {
      overflow: hidden; border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg); background: var(--surface-card);
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    .report-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); }
    .report-photo { position: relative; height: 9.5rem; background: var(--surface-hover); }
    .report-photo img { width: 100%; height: 100%; object-fit: cover; }
    .photo-placeholder { display: grid; place-items: center; height: 100%; color: var(--text-secondary); font-size: 1.75rem; }
    .status-tag { position: absolute; top: .6rem; right: .6rem; }
    .report-body { display: flex; flex-direction: column; gap: .3rem; padding: .9rem 1rem 1rem; }
    .report-name { margin: 0; font-size: 1.05rem; }
    .report-meta { margin: 0; font-size: .82rem; color: var(--text-secondary); }
    .report-meta i { margin-right: .3rem; }
    .distance { color: var(--primary-color); font-weight: 600; }
    .report-reward { margin: 0; font-weight: 700; color: var(--primary-color); }
    .report-actions {
      display: flex; flex-wrap: wrap; gap: .25rem; margin-top: .5rem;
      padding-top: .6rem; border-top: 1px solid var(--surface-border);
    }
    .state-card {
      display: grid; place-items: center; gap: .5rem; padding: 3rem 1rem; text-align: center;
      border: 1px dashed var(--surface-border); border-radius: var(--radius-lg);
      background: var(--surface-card);
    }
    .state-card i { font-size: 2rem; color: var(--text-secondary); }
    .state-card h2 { margin: 0; font-size: 1.1rem; }
    .state-card p { margin: 0 0 .5rem; color: var(--text-secondary); }
    .report-button {
      display: grid; place-items: center; width: 2.75rem; height: 2.75rem;
      border: 1px solid var(--surface-border); border-radius: 50%;
      background: var(--surface-card); color: var(--text-secondary); cursor: pointer;
    }
    .report-button:hover { background: var(--surface-hover); color: var(--text-primary); }
    @media (max-width: 640px) {
      .filter-field { flex: 1 1 100%; }
      .reports-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class LostPetsPageComponent implements OnInit {
  private readonly lostPetsService = inject(LostPetsService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslocoService);
  readonly geolocation = inject(GeolocationService);

  readonly reports = signal<LostPetReport[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly nearbyOnly = signal(false);
  readonly dialogOpen = signal(false);
  readonly editing = signal<LostPetReport | null>(null);
  readonly userCoordinates = signal<{ lat: number; lng: number } | null>(null);

  speciesFilter: string | null = null;
  statusFilter: LostPetStatus | null = null;
  fromFilter = '';
  toFilter = '';

  reportFormData: Record<string, unknown> = {};

  readonly speciesOptions = computed(() =>
    SPECIES.map((value) => ({ label: this.speciesLabel(value), value })),
  );

  readonly statusOptions = computed(() => [
    { label: this.i18n.translate('lostPets.lost'), value: 'LOST' as LostPetStatus },
    { label: this.i18n.translate('lostPets.found'), value: 'FOUND' as LostPetStatus },
    { label: this.i18n.translate('lostPets.reunited'), value: 'REUNITED' as LostPetStatus },
    { label: this.i18n.translate('lostPets.closed'), value: 'CLOSED' as LostPetStatus },
  ]);

  readonly reportFormConfig: DynamicFormConfig = {
    showSubmit: true,
    showCancel: true,
    submitLabel: this.i18n.translate('lostPets.save'),
    cancelLabel: this.i18n.translate('common.cancel'),
    fields: [
      { key: 'petName', label: this.i18n.translate('lostPets.pet'), type: 'input',
        validation: { required: true, maxLength: 100 } },
      { key: 'species', label: this.i18n.translate('common.species'), type: 'select',
        options: this.speciesOptions(), validation: { required: true } },
      { key: 'breed', label: this.i18n.translate('common.breed'), type: 'input' },
      { key: 'color', label: this.i18n.translate('common.color'), type: 'input' },
      { key: 'lostDate', label: this.i18n.translate('lostPets.lostDate'), type: 'date',
        validation: { required: true } },
      { key: 'lastSeenArea', label: this.i18n.translate('lostPets.lastSeenArea'), type: 'input',
        placeholder: this.i18n.translate('lostPets.lastSeenAreaPlaceholder'),
        validation: { required: true, maxLength: 255 } },
      { key: 'description', label: this.i18n.translate('common.description'), type: 'textarea',
        rows: 3, validation: { maxLength: 1000 } },
      { key: 'rewardAmount', label: this.i18n.translate('lostPets.reward'), type: 'number',
        validation: { min: 0 } },
      { key: 'photoUrl', label: this.i18n.translate('lostPets.photoUrl'), type: 'input' },
    ],
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const coordinates = this.nearbyOnly() ? this.userCoordinates() : null;
    this.lostPetsService
      .search({
        species: this.speciesFilter ?? undefined,
        status: this.statusFilter ?? undefined,
        from: this.fromFilter || undefined,
        to: this.toFilter || undefined,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
        radiusKm: coordinates ? 15 : undefined,
      })
      .subscribe({
        next: (reports) => {
          this.reports.set(reports);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.i18n.translate('lostPets.error'));
          this.loading.set(false);
        },
      });
  }

  toggleNearby(): void {
    if (this.nearbyOnly()) {
      this.nearbyOnly.set(false);
      this.load();
      return;
    }
    this.geolocation.getCurrentPosition().subscribe({
      next: (coords) => {
        this.userCoordinates.set(coords);
        this.nearbyOnly.set(true);
        this.load();
      },
      error: (err: Error) => this.messages.add({
        severity: 'warn',
        summary: this.i18n.translate('lostPets.geolocationErrorTitle'),
        detail: err.message,
      }),
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.reportFormData = { lostDate: new Date().toISOString().slice(0, 10) };
    this.dialogOpen.set(true);
  }

  openEdit(report: LostPetReport): void {
    this.editing.set(report);
    this.reportFormData = {
      petName: report.petName,
      species: report.species,
      breed: report.breed ?? '',
      color: report.color ?? '',
      lostDate: report.lostDate,
      lastSeenArea: report.lastSeenArea,
      description: report.description ?? '',
      rewardAmount: report.rewardAmount ?? null,
      photoUrl: report.photoUrl ?? '',
    };
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.editing.set(null);
  }

  submitReport(values: Record<string, unknown>): void {
    const payload = {
      petId: null,
      petName: String(values['petName'] ?? ''),
      species: String(values['species'] ?? ''),
      breed: (values['breed'] as string) || null,
      color: (values['color'] as string) || null,
      description: (values['description'] as string) || null,
      photoUrl: (values['photoUrl'] as string) || null,
      lostDate: this.toIsoDate(values['lostDate']),
      lastSeenArea: String(values['lastSeenArea'] ?? ''),
      rewardAmount: values['rewardAmount'] == null ? null : Number(values['rewardAmount']),
    };
    const editing = this.editing();
    const request = editing
      ? this.lostPetsService.update(editing.id, payload)
      : this.lostPetsService.create(payload);

    request.subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: this.i18n.translate('common.success'),
          detail: this.i18n.translate(
            editing ? 'lostPets.updatedDetail' : 'lostPets.createdDetail',
          ),
        });
        this.closeDialog();
        this.load();
      },
      error: () => this.messages.add({
        severity: 'error',
        summary: this.i18n.translate('lostPets.errorTitle'),
        detail: this.i18n.translate('lostPets.saveError'),
      }),
    });
  }

  goToDetail(report: LostPetReport): void {
    void this.router.navigate(['/lostpets', report.id]);
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
