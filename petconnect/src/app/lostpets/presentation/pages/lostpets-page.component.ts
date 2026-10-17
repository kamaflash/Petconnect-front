import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { LostPetReportModalComponent } from '../components/lostpet-report-modal.component';
import { LostPetSightingModalComponent } from '../components/lostpet-sighting-modal.component';
import { PageHeadingCardComponent } from '../../../shared/presentation/components/page-heading-card/page-heading-card.component';
import { TabsComponent, Tab } from '../../../shared/presentation/components/tabs/tabs.component';
import { GeolocationService } from '../../../shared/services/geolocation.service';
import { LostPetsService, LostPetReport, LostPetStatus, CreateLostPetReport } from '../../infrastructure/services/lost-pets.service';

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
    LostPetReportModalComponent,
    LostPetSightingModalComponent,
    PageHeadingCardComponent,
    TabsComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-content lostpets-page">
      <app-page-heading-card
        [title]="'lostPets.title' | transloco"
        [subtitle]="'lostPets.subtitle' | transloco"
      />

      <app-tabs
        [tabs]="tabs()"
        [activeTab]="activeTab()"
        (tabChange)="onTabChange($event)"
      />

      <div class="tab-content">
        <details class="catalog-toolbar">
          <summary class="filters-summary">
            <span class="filters-summary-title">
              <i class="pi pi-sliders-h" aria-hidden="true"></i>
              {{ 'feedGrid.filters' | transloco }}
            </span>
            <span class="filters-summary-meta">
              <span class="results-count">
                {{ filteredReports().length }} {{ filteredReports().length === 1 ? 'reporte' : 'reportes' }}
              </span>
              <i class="pi pi-chevron-down accordion-chevron" aria-hidden="true"></i>
            </span>
          </summary>
          <div class="filter-panel">
            <div class="filter-group">
              <label class="filter-label">{{ 'lostPets.species' | transloco }}</label>
              <p-select
                [options]="speciesOptions()"
                optionLabel="label"
                optionValue="value"
                [showClear]="true"
                [placeholder]="'lostPets.species' | transloco"
                [(ngModel)]="speciesFilter"
                (onChange)="load()"
                class="filter-select"
              />
            </div>
            <div class="filter-group">
              <label class="filter-label">{{ 'lostPets.status' | transloco }}</label>
              <p-select
                [options]="statusOptions()"
                optionLabel="label"
                optionValue="value"
                [showClear]="true"
                [placeholder]="'lostPets.status' | transloco"
                [(ngModel)]="statusFilter"
                (onChange)="load()"
                class="filter-select"
              />
            </div>
            <div class="filter-group">
              <label class="filter-label">{{ 'lostPets.lostDate' | transloco }}</label>
              <div class="date-range">
                <input
                  type="date"
                  class="form-input"
                  [(ngModel)]="fromFilter"
                  (change)="load()"
                  [attr.aria-label]="'lostPets.lostDate' | transloco"
                />
                <span aria-hidden="true">–</span>
                <input
                  type="date"
                  class="form-input"
                  [(ngModel)]="toFilter"
                  (change)="load()"
                  [attr.aria-label]="'lostPets.lostDate' | transloco"
                />
              </div>
            </div>
            <div class="filter-group">
              <label class="filter-label">&nbsp;</label>
              <div class="filter-actions">
                <button
                  type="button"
                  pButton
                  [icon]="nearbyOnly() ? 'pi pi-map-marker' : 'pi pi-compass'"
                  [label]="'lostPets.nearby' | transloco"
                  [class.p-button-primary]="nearbyOnly()"
                  class="p-button-outlined"
                  (click)="toggleNearby()"
                ></button>
                <button
                  type="button"
                  pButton
                  class="p-button-text"
                  icon="pi pi-filter-slash"
                  [label]="'lostPets.clearFilters' | transloco"
                  (click)="clearFilters()"
                ></button>
              </div>
            </div>
          </div>
        </details>

        <div class="tab-header">
          <h2 class="tab-title">
            {{ activeTab() === 'found' ? ('lostPets.tabFound' | transloco) : ('lostPets.tabLost' | transloco) }}
            <span class="tab-count">({{ filteredReports().length }})</span>
          </h2>
          <button
            type="button"
            pButton
            icon="pi pi-plus"
            [label]="activeTab() === 'found' ? ('lostPets.sightingTitle' | transloco) : ('lostPets.report' | transloco)"
            (click)="openCreate()"
          ></button>
        </div>

        @if (loading()) {
          <div class="reports-grid">
            @for (skeleton of [1, 2, 3, 4]; track skeleton) {
              <div class="report-card">
                <p-skeleton height="180px" />
                <div class="report-body">
                  <p-skeleton width="60%" height="1.2rem" styleClass="mb-2" />
                  <p-skeleton width="80%" height="0.9rem" styleClass="mb-2" />
                  <p-skeleton width="70%" height="0.9rem" />
                </div>
              </div>
            }
          </div>
        } @else if (error()) {
          <section class="state-card">
            <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
            <h2>{{ 'lostPets.errorTitle' | transloco }}</h2>
            <p>{{ error() }}</p>
            <button type="button" pButton [label]="'lostPets.retry' | transloco" (click)="load()"></button>
          </section>
        } @else if (filteredReports().length === 0) {
          <section class="state-card">
            <i class="pi pi-search" aria-hidden="true"></i>
            <h2>{{ activeTab() === 'found' ? ('lostPets.emptyFoundTitle' | transloco) : ('lostPets.emptyTitle' | transloco) }}</h2>
            <p>{{ activeTab() === 'found' ? ('lostPets.emptyFoundDescription' | transloco) : ('lostPets.emptyDescription' | transloco) }}</p>
            <button type="button" pButton [label]="activeTab() === 'found' ? ('lostPets.sightingTitle' | transloco) : ('lostPets.report' | transloco)" (click)="openCreate()"></button>
          </section>
        } @else {
          <div class="reports-grid">
            @for (report of filteredReports(); track report.id) {
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

      @if (dialogOpen()) {
        <app-lostpet-report-modal
          [editable]="editing()"
          (cancel)="closeDialog()"
          (submit)="onLostPetSubmit($event)"
        />
      }

      @if (sightingDialogOpen()) {
        <app-lostpet-sighting-modal
          (cancel)="closeSightingDialog()"
          (submit)="onSightingSubmit($event)"
        />
      }
    </div>
  `,
  styles: [`
    .lostpets-page { padding-bottom: 2rem; }
    .tab-content { margin-top: 0.5rem; }
    .tab-header {
      display: flex; align-items: center; justify-content: space-between;
      margin: 1.25rem 0 1rem;
    }
    .tab-title { margin: 0; font-size: 1.1rem; font-weight: 700; }
    .tab-count { color: var(--text-secondary); font-weight: 500; font-size: 0.95rem; }

    /* Filters — mismo patrón plegable que el toolbar de adopciones / nearby */
    .catalog-toolbar {
      margin: 0 auto 1.25rem;
      padding: 1rem 1.25rem;
      background: var(--surface-card);
      border: none;
      border-radius: var(--radius-lg);
    }
    .filters-summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; color: var(--text-primary); cursor: pointer; list-style: none; }
    .filters-summary::-webkit-details-marker { display: none; }
    .filters-summary-title, .filters-summary-meta { display: inline-flex; align-items: center; gap: .75rem; }
    .filters-summary-title { font-weight: 650; }
    .filters-summary-title > i { color: var(--primary-color); }
    .accordion-chevron { color: var(--text-secondary); transition: transform var(--transition-fast); }
    .catalog-toolbar[open] .accordion-chevron { transform: rotate(180deg); }
    .filter-panel { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: .85rem; align-items: end; padding-top: 1rem; }
    .results-count { color: var(--text-secondary); font-size: .85rem; white-space: nowrap; }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      min-width: 0;
    }
    .filter-label {
      font-size: 0.8rem;
      font-weight: 650;
      color: var(--text-secondary);
    }
    .filter-select {
      width: 100%;
    }
    :host ::ng-deep .filter-panel .p-select {
      background: transparent;
    }
    .filter-panel .p-button {
      min-height: 2.75rem;
    }
    .filter-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .date-range { display: flex; align-items: center; gap: 0.4rem; }
    .form-input {
      width: 100%; padding: 0.5rem 0.65rem; border: 1px solid var(--surface-border);
      border-radius: var(--radius-sm); background: var(--surface-card); color: var(--text-primary);
    }
    .reports-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .report-card {
      display: flex; flex-direction: column; overflow: hidden;
      border: 1px solid var(--surface-border); border-radius: var(--radius-lg);
      background: var(--surface-card); transition: box-shadow 0.2s;
    }
    .report-card:hover { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); }
    .report-photo { position: relative; aspect-ratio: 4/3; overflow: hidden; }
    .report-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .photo-placeholder {
      display: grid; place-items: center; width: 100%; height: 100%;
      background: var(--surface-hover); color: var(--text-secondary);
    }
    .photo-placeholder i { font-size: 2rem; }
    .status-tag { position: absolute; top: 0.6rem; right: 0.6rem; }
    .report-body { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.85rem 1rem 1rem; }
    .report-name { margin: 0; font-size: 1rem; font-weight: 700; }
    .report-meta { margin: 0; font-size: 0.82rem; color: var(--text-secondary); }
    .report-meta i { margin-right: 0.3rem; }
    .distance { color: var(--primary-color); font-weight: 600; }
    .report-reward { margin: 0; font-weight: 700; color: var(--primary-color); }
    .report-actions {
      display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.5rem;
      padding-top: 0.6rem; border-top: 1px solid var(--surface-border);
    }
    .state-card {
      display: grid; place-items: center; gap: 0.5rem; padding: 3rem 1rem; text-align: center;
      border: 1px dashed var(--surface-border); border-radius: var(--radius-lg);
      background: var(--surface-card);
    }
    .state-card i { font-size: 2rem; color: var(--text-secondary); }
    .state-card h2 { margin: 0; font-size: 1.1rem; }
    .state-card p { margin: 0 0 0.5rem; color: var(--text-secondary); }
    @media (max-width: 640px) {
      .filter-group { flex: 1 1 100%; }
      .reports-grid { grid-template-columns: 1fr; }
      .tab-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    }
  `],
})
export class LostPetsPageComponent implements OnInit {
  private readonly lostPetsService = inject(LostPetsService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslocoService);
  private readonly messages = inject(MessageService);

  readonly geolocation = inject(GeolocationService);

  readonly reports = signal<LostPetReport[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly nearbyOnly = signal(false);
  readonly dialogOpen = signal(false);
  readonly sightingDialogOpen = signal(false);
  readonly editing = signal<LostPetReport | null>(null);
  readonly userCoordinates = signal<{ lat: number; lng: number } | null>(null);
  readonly activeTab = signal<'found' | 'lost'>('found');

  readonly tabs = computed<Tab[]>(() => [
    {
      id: 'found',
      label: this.i18n.translate('lostPets.tabFound'),
      icon: 'pi pi-eye',
      iconType: 'prime',
    },
    {
      id: 'lost',
      label: this.i18n.translate('lostPets.tabLost'),
      icon: 'pi pi-flag',
      iconType: 'prime',
    },
  ]);

  readonly filteredReports = computed(() => {
    const tab = this.activeTab();
    return this.reports().filter(r => tab === 'lost' ? r.status === 'LOST' : r.status === 'FOUND');
  });

  speciesFilter: string | null = null;
  statusFilter: LostPetStatus | null = null;
  fromFilter = '';
  toFilter = '';

  readonly speciesOptions = computed(() =>
    SPECIES.map((value) => ({ label: this.speciesLabel(value), value })),
  );

  readonly statusOptions = computed(() => [
    { label: this.i18n.translate('lostPets.lost'), value: 'LOST' as LostPetStatus },
    { label: this.i18n.translate('lostPets.found'), value: 'FOUND' as LostPetStatus },
    { label: this.i18n.translate('lostPets.reunited'), value: 'REUNITED' as LostPetStatus },
    { label: this.i18n.translate('lostPets.closed'), value: 'CLOSED' as LostPetStatus },
  ]);

  ngOnInit(): void {
    this.load();
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId as 'found' | 'lost');
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
        radiusKm: coordinates ? 50 : undefined,
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

  clearFilters(): void {
    this.speciesFilter = null;
    this.statusFilter = null;
    this.fromFilter = '';
    this.toFilter = '';
    this.load();
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
    if (this.activeTab() === 'found') {
      this.sightingDialogOpen.set(true);
      return;
    }
    this.editing.set(null);
    this.dialogOpen.set(true);
  }

  openEdit(report: LostPetReport): void {
    this.editing.set(report);
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.editing.set(null);
  }

  closeSightingDialog(): void {
    this.sightingDialogOpen.set(false);
  }

  onSightingSubmit(_event: { payload: CreateLostPetReport; files: any[] }): void {
    this.closeSightingDialog();
    // El avistamiento se crea con estado FOUND: mostrarlo en la pestaña Avistamientos.
    this.activeTab.set('found');
    // Recargar tras un tick para que el cambio de detección aplique la nueva pestaña y los datos.
    setTimeout(() => this.load());
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

  onLostPetSubmit(_event: any): void {
    this.closeDialog();
    // El reporte se crea con estado LOST: mostrarlo en la pestaña Perdidas.
    this.activeTab.set('lost');
    // Recargar tras un tick para que el cambio de detección aplique la nueva pestaña y los datos.
    setTimeout(() => this.load());
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
}
