import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { PetResponse, CreatePetRequest } from '../../domain/pet.model';
import { PetService } from '../../infrastructure/services/pet.service';
import { DynamicFormComponent } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { buildPetEditorFormConfig, petEditorDataToRequest } from '../forms/pet-editor-form';
import { TableCardComponent, TableCardItem } from '../../../shared/presentation/components/table-card/table-card.component';

@Component({
  selector: 'app-pets-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    SkeletonModule,
    ToastModule,
    TranslocoModule,
    RouterLink,
    DynamicFormComponent,
    TableCardComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <main class="page-content family-page">
      <header class="page-header">
        <div>
          <h1 class="text-2xl font-bold m-0">{{ 'petsPage.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'petsPage.subtitle' | transloco }}</p>
        </div>
      </header>

      <section class="care-summary" *ngIf="!loading() && !loadFailed() && pets().length > 0" aria-labelledby="care-summary-title">
        <div class="card-header">
          <i class="pi pi-heart card-header-icon" aria-hidden="true"></i>
          <h2 id="care-summary-title" class="card-header-title">{{ 'petsPage.careTitle' | transloco }}</h2>
        </div>
        <div class="card-body care-summary-body">
          <p class="care-summary-copy" *ngIf="carePets().length > 0">{{ 'petsPage.careSubtitle' | transloco:{ count: carePets().length } }}</p>
          <p class="care-summary-copy" *ngIf="carePets().length === 0">{{ 'petsPage.noCareDates' | transloco }}</p>
          <ul class="care-list" *ngIf="carePets().length > 0">
            <li *ngFor="let pet of carePets() | slice:0:3">
              <a [routerLink]="['/profile/pet', pet.id]" [queryParams]="{ tab: 'health' }" [attr.aria-label]="'petsPage.openHealthFor' | transloco:{ name: pet.name }">
                <span class="care-pet-name">{{ pet.name }}</span>
                <span class="care-date" [class.overdue]="isOverdue(pet.nextVaccinationDate)">
                  {{ isOverdue(pet.nextVaccinationDate) ? ('petsPage.vaccineOverdue' | transloco) : ('petsPage.nextVaccine' | transloco) }}
                  · {{ pet.nextVaccinationDate | date:'mediumDate' }}
                </span>
              </a>
            </li>
          </ul>
          <a class="care-more" *ngIf="carePets().length > 3" [routerLink]="['/profile/pet', carePets()[3].id]" [queryParams]="{ tab: 'health' }">
            {{ 'petsPage.moreReminders' | transloco:{ count: carePets().length - 3 } }} <i class="pi pi-arrow-right"></i>
          </a>
        </div>
      </section>

      <section class="pets-panel card-modern" *ngIf="loading()" [attr.aria-label]="'petsPage.loading' | transloco" aria-busy="true">
        <div class="card-header">
          <i class="pi pi-paw card-header-icon" aria-hidden="true"></i>
          <span class="card-header-title">{{ 'petsPage.loading' | transloco }}</span>
        </div>
        <div class="card-body">
          <div class="skeleton-grid">
            <div *ngFor="let item of [1, 2, 3]" class="skeleton-pet">
              <p-skeleton width="100%" height="170px" borderRadius="8px" />
              <p-skeleton width="65%" height="1rem" styleClass="mt-3" />
              <p-skeleton width="45%" height=".875rem" styleClass="mt-2" />
            </div>
          </div>
        </div>
      </section>

      <section class="state-card card-modern" *ngIf="!loading() && loadFailed()" role="alert">
        <div class="card-body">
          <i class="pi pi-exclamation-circle state-icon" aria-hidden="true"></i>
          <h2>{{ 'petsPage.loadErrorTitle' | transloco }}</h2>
          <p>{{ 'petsPage.loadError' | transloco }}</p>
          <p-button [label]="'petsPage.retry' | transloco" icon="pi pi-refresh" (onClick)="loadPets()" />
        </div>
      </section>

      <section class="state-card card-modern" *ngIf="!loading() && !loadFailed() && pets().length === 0">
        <div class="card-body">
          <i class="pi pi-paw state-icon" aria-hidden="true"></i>
          <h2>{{ 'petsPage.emptyTitle' | transloco }}</h2>
          <p>{{ 'petsPage.emptySubtitle' | transloco }}</p>
          <p-button icon="pi pi-plus" [label]="'petsPage.addFirstPet' | transloco" (onClick)="openCreateDialog()" />
        </div>
      </section>

      <section class="pets-panel card-modern" *ngIf="!loading() && !loadFailed() && pets().length > 0">
        <div class="card-header pets-panel-header">
          <i class="pi pi-paw card-header-icon" aria-hidden="true"></i>
          <span class="card-header-title">{{ 'petsPage.petCount' | transloco:{ count: pets().length } }}</span>
        </div>
        <div class="card-body pets-panel-body">
          <app-table-card
            [type]="'pet'"
            [items]="familyPetItems()"
            [filteredItems]="familyPetItems()"
            [showSearch]="true"
            [editable]="true"
            [addLabelText]="'petsPage.addPet' | transloco"
            (searchChange)="searchQuery.set($event)"
            (onAdd)="openCreateDialog()"
          >
            <ng-template card-actions let-item>
              <button
                pButton
                type="button"
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [rounded]="true"
                (click)="$event.stopPropagation(); deletePet(item.id, item.name)"
                [attr.aria-label]="'petsPage.deletePet' | transloco:{ name: item.name }"
                [title]="'petsPage.delete' | transloco"
              ></button>
            </ng-template>
          </app-table-card>
          <div class="no-results" *ngIf="filteredPets().length === 0">
            <i class="pi pi-search" aria-hidden="true"></i>
            <p>{{ 'petsPage.noResults' | transloco }}</p>
          </div>
        </div>
      </section>
    </main>

    <p-dialog
      [visible]="dialogVisible"
      [modal]="true"
      [header]="'petsPage.addTitle' | transloco"
      [style]="{ width: 'min(92vw, 48rem)' }"
      [contentStyle]="{ 'max-height': '70vh', overflow: 'auto' }"
      [draggable]="false"
      [resizable]="false"
      (onHide)="closeDialog()"
    >
      <app-dynamic-form
        *ngIf="dialogVisible"
        [config]="petEditorConfig"
        [formData]="petFormData()"
        [submitting]="saving()"
        (onSubmitClick)="savePet($event)"
        (onCancel)="closeDialog()"
      />
    </p-dialog>
  `,
  styles: [`
    :host { display: block; }
    .family-page { max-width: var(--max-page-width); margin: 0 auto; padding: 1.5rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
    .page-subtitle { margin: .5rem 0 0; color: var(--text-secondary); }
    .card-modern { overflow: hidden; margin-bottom: 1rem; border-radius: var(--radius-md); background: var(--surface-card); }
    .card-header { display: flex; align-items: center; gap: .5rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--surface-border); }
    .card-header-icon { color: var(--text-secondary); font-size: 1.125rem; }
    .card-header-title { color: var(--text-primary); font-size: .9375rem; font-weight: 600; }
    .card-body { padding: .75rem 1.25rem; }
    .care-summary h2 { margin: 0; }
    .care-summary-body { display: grid; grid-template-columns: minmax(180px, .8fr) minmax(0, 1.2fr) auto; align-items: center; gap: 1rem; }
    .care-summary-copy { margin: 0; color: var(--text-secondary); font-size: .875rem; line-height: 1.5; }
    .care-list { display: grid; gap: .5rem; margin: 0; padding: 0; list-style: none; }
    .care-list a { display: flex; justify-content: space-between; gap: .75rem; color: var(--text-primary); font-size: .8125rem; text-decoration: none; }
    .care-list a:hover .care-pet-name { text-decoration: underline; }
    .care-pet-name { font-weight: 600; }
    .care-date { color: var(--text-secondary); text-align: right; }
    .care-date.overdue { color: var(--red-500, #ef4444); font-weight: 600; }
    .care-more { color: var(--primary-color); font-size: .8125rem; font-weight: 600; text-decoration: none; white-space: nowrap; }
    .pets-panel { overflow: hidden; }
    .pets-panel-header { flex-wrap: wrap; }
    .pets-panel-body { padding-top: 1rem; }
    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: 1rem; }
    .skeleton-pet { min-width: 0; }
    .state-card .card-body { display: flex; min-height: 260px; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .state-icon { color: var(--primary-color); font-size: 2rem; }
    .state-card h2 { margin: 1rem 0 .4rem; color: var(--text-primary); font-size: 1.125rem; }
    .state-card p { max-width: 28rem; margin: 0 0 1rem; color: var(--text-secondary); line-height: 1.5; }
    .no-results { padding: 1.5rem 0; color: var(--text-secondary); text-align: center; }
    .no-results p { margin: .5rem 0 0; }
    @media (max-width: 760px) {
      .care-summary-body { grid-template-columns: 1fr; align-items: start; }
      .care-more { justify-self: start; }
    }
    @media (max-width: 600px) {
      .family-page { padding: 1rem; }
      .page-header { align-items: flex-start; flex-direction: column; }
      .pets-panel-header { align-items: flex-start; }
      .care-list a { flex-direction: column; gap: .15rem; }
      .care-date { text-align: left; }
    }
  `],
})
export class PetsPageComponent implements OnInit {
  private readonly petService = inject(PetService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly i18n = inject(TranslocoService);
  readonly petEditorConfig = buildPetEditorFormConfig(this.i18n);

  readonly pets = signal<PetResponse[]>([]);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly saving = signal(false);
  readonly searchQuery = signal('');
  readonly carePets = computed(() =>
    this.pets()
      .filter(pet => Boolean(pet.nextVaccinationDate))
      .sort((a, b) => this.dateTimestamp(a.nextVaccinationDate) - this.dateTimestamp(b.nextVaccinationDate))
  );
  readonly filteredPets = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    if (!query) return this.pets();
    return this.pets().filter(pet =>
      [pet.name, pet.species, pet.breed ?? ''].some(value => value.toLocaleLowerCase().includes(query))
    );
  });
  readonly familyPetItems = computed((): TableCardItem[] =>
    this.filteredPets().map(pet => ({
      id: pet.id,
      name: pet.name,
      avatar: pet.avatarUrl || 'https://placehold.co/600x400?text=%F0%9F%90%BE',
      image: pet.avatarUrl || undefined,
      images: [...new Set([pet.avatarUrl, ...(pet.imageUrls ?? [])].filter((url): url is string => Boolean(url)))],
      familyCard: true,
      petSubtitle: `${this.speciesLabel(pet.species)}${pet.breed ? ` · ${pet.breed}` : ''}`,
      petStatus: this.i18n.translate(
        pet.availableForAdoption ? 'petsPage.forAdoption' : pet.active ? 'petsPage.active' : 'petsPage.inactive'
      ),
      petStatusWarning: pet.availableForAdoption,
      petDetails: [
        this.genderLabel(pet.gender),
        pet.weight ? `${pet.weight} ${pet.weightUnit || 'kg'}` : ''
      ].filter(Boolean),
      careLabel: pet.nextVaccinationDate
        ? this.i18n.translate(this.isOverdue(pet.nextVaccinationDate) ? 'petsPage.vaccineOverdue' : 'petsPage.nextVaccine')
        : this.i18n.translate('petsPage.noVaccineDate'),
      careDate: pet.nextVaccinationDate,
      careOverdue: this.isOverdue(pet.nextVaccinationDate)
    }))
  );

  dialogVisible = false;
  readonly petFormData = signal<Record<string, unknown>>({});

  ngOnInit(): void {
    this.loadPets();
  }

  loadPets(): void {
    const user = this.authService.user();
    if (!user?.id) {
      this.loading.set(false);
      this.loadFailed.set(true);
      return;
    }

    this.loading.set(true);
    this.loadFailed.set(false);
    this.petService.getPetsByOwner(user.id).subscribe({
      next: pets => {
        this.pets.set(pets);
        this.loading.set(false);
      },
      error: error => {
        console.error('Error loading pets:', error);
        this.loading.set(false);
        this.loadFailed.set(true);
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.translate('petsPage.errorTitle'),
          detail: this.i18n.translate('petsPage.loadError'),
        });
      },
    });
  }

  openCreateDialog(): void {
    this.petFormData.set({});
    this.dialogVisible = true;
  }

  closeDialog(): void {
    if (this.saving()) return;
    this.dialogVisible = false;
  }

  savePet(data: Record<string, unknown>): void {
    if (this.saving()) return;
    const request: CreatePetRequest = petEditorDataToRequest(data);
    if (!request.name || !request.species) return;

    this.saving.set(true);

    this.petService.createPet(request).subscribe({
      next: pet => {
        this.pets.update(pets => [...pets, pet]);
        this.saving.set(false);
        this.dialogVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.translate('petsPage.savedTitle'),
          detail: this.i18n.translate('petsPage.createdDetail', { name: pet.name }),
        });
      },
      error: error => {
        console.error('Error saving pet:', error);
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.translate('petsPage.errorTitle'),
          detail: this.i18n.translate('petsPage.createError'),
        });
      },
    });
  }

  deletePet(id: string, name: string): void {
    this.petService.deletePet(id).subscribe({
      next: () => {
        this.pets.update(pets => pets.filter(existing => existing.id !== id));
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.translate('petsPage.deletedTitle'),
          detail: this.i18n.translate('petsPage.deletedDetail', { name }),
        });
      },
      error: error => {
        console.error('Error deleting pet:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.translate('petsPage.errorTitle'),
          detail: this.i18n.translate('petsPage.deleteError'),
        });
      },
    });
  }

  formatAge(dateOfBirth: string): string {
    const birth = new Date(dateOfBirth);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
      years--;
    }
    return years > 0
      ? this.i18n.translate('petsPage.ageYears', { count: years })
      : this.i18n.translate('petsPage.ageUnderYear');
  }

  speciesLabel(species: string): string {
    const keyBySpecies: Record<string, string> = {
      DOG: 'common.dog',
      CAT: 'common.cat',
      BIRD: 'common.bird',
      RABBIT: 'common.rabbit',
      HAMSTER: 'common.hamster',
      OTHER: 'common.other',
    };
    const translationKey = keyBySpecies[species.toUpperCase()];
    return translationKey ? this.i18n.translate(translationKey) : species;
  }

  private genderLabel(gender: string | null): string {
    const keyByGender: Record<string, string> = {
      MALE: 'common.male',
      FEMALE: 'common.female',
      UNKNOWN: 'admin.unknown',
    };
    const translationKey = gender ? keyByGender[gender.toUpperCase()] : undefined;
    return translationKey ? this.i18n.translate(translationKey) : '';
  }

  isOverdue(date: string | null): boolean {
    return Boolean(date) && this.dateTimestamp(date) < this.startOfToday();
  }

  private dateTimestamp(date: string | null): number {
    if (!date) return Number.MAX_SAFE_INTEGER;
    const timestamp = new Date(`${date.slice(0, 10)}T00:00:00`).getTime();
    return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
  }

  private startOfToday(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }

}
