import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { PetResponse, CreatePetRequest } from '../../domain/pet.model';
import { PetService } from '../../infrastructure/services/pet.service';
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { ModalComponent } from '../../../shared/presentation/components/modal/modal';
import { buildPetEditorFormConfig, petEditorDataToRequest } from '../forms/pet-editor-form';
import { TableCardComponent, TableCardItem } from '../../../shared/presentation/components/table-card/table-card.component';

@Component({
  selector: 'app-pets-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    SkeletonModule,
    ToastModule,
    TranslocoModule,
    RouterLink,
    DynamicFormComponent,
    TableCardComponent,
    ModalComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <main class="page-content family-page">
      <header class="page-header page-heading-card">
        <div class="page-heading-copy">
          <h1 class="text-2xl font-bold m-0">{{ 'petsPage.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'petsPage.subtitle' | transloco }}</p>
        </div>
        <a class="care-invitations-link" routerLink="/pet-care/invitations">
          <i class="pi pi-users" aria-hidden="true"></i>
          <span>{{ 'petCare.invitationsTitle' | transloco }}</span>
        </a>
      </header>

      <section class="care-summary card-modern  card-orange-border" *ngIf="!loading() && !loadFailed() && pets().length > 0" aria-labelledby="care-summary-title">
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

      <section class="pets-panel card-modern " *ngIf="loading()" [attr.aria-label]="'petsPage.loading' | transloco" aria-busy="true">
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
              <a
                pButton
                type="button"
                icon="pi pi-heart"
                class="p-button-text p-button-rounded"
                [routerLink]="['/pets', item.id, 'care']"
                (click)="$event.stopPropagation()"
                [attr.aria-label]="'petCare.manageFor' | transloco:{ name: item.name }"
                [title]="'petCare.manageCare' | transloco"
              ></a>
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

    <app-modal
      [visible]="dialogVisible"
      [showHeader]="false"
      [style]="{ width: 'min(94vw, 56rem)' }"
      [contentStyle]="{ 'max-height': '86vh', overflow: 'auto', padding: '0' }"
      [noPadding]="true"
      [draggable]="false"
      [resizable]="false"
      [showCancel]="false"
      [showConfirm]="false"
      (onHide)="closeDialog()"
    >
      <div class="pet-wizard">
        <header class="pet-wizard-header">
          <div class="pet-wizard-heading">
            <span class="pet-wizard-icon"><i class="pi pi-heart-fill" aria-hidden="true"></i></span>
            <div>
              <span class="pet-wizard-eyebrow">{{ 'petsPage.addTitle' | transloco }}</span>
              <h2>{{ 'petsPage.wizardTitle' | transloco }}</h2>
              <p>{{ 'petsPage.wizardSubtitle' | transloco }}</p>
            </div>
          </div>
          <button
            type="button"
            class="pet-wizard-close"
            [disabled]="saving()"
            [attr.aria-label]="'petsPage.closeForm' | transloco"
            (click)="closeDialog()"
          >
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </header>

        <div class="pet-wizard-progress" aria-hidden="true">
          <span [style.width.%]="((activePetTab() + 1) / petFormTabs.length) * 100"></span>
        </div>

        <nav class="pet-wizard-tabs" role="tablist" [attr.aria-label]="'petsPage.formSections' | transloco">
          @for (tab of petFormTabs; track tab.id; let index = $index) {
            <button
              type="button"
              role="tab"
              class="pet-wizard-tab"
              [class.active]="activePetTab() === index"
              [attr.aria-selected]="activePetTab() === index"
              [attr.aria-controls]="'pet-wizard-panel'"
              [disabled]="index > furthestPetTab()"
              (click)="selectPetTab(index)"
            >
              <span class="pet-wizard-tab-icon"><i [class]="tab.icon" aria-hidden="true"></i></span>
              <span class="pet-wizard-tab-copy">
                <span class="pet-wizard-tab-step">{{ 'petsPage.step' | transloco:{ current: index + 1, total: petFormTabs.length } }}</span>
                <span class="pet-wizard-tab-label">{{ tab.labelKey | transloco }}</span>
              </span>
              @if (index < petFormTabs.length - 1) {
                <i class="pi pi-chevron-right pet-wizard-tab-chevron" aria-hidden="true"></i>
              }
            </button>
          }
        </nav>

        <section class="pet-wizard-panel" id="pet-wizard-panel" role="tabpanel">
          <div class="pet-wizard-section-heading">
            <span class="pet-wizard-section-icon"><i [class]="petFormTabs[activePetTab()].icon" aria-hidden="true"></i></span>
            <div>
              <h3>{{ petFormTabs[activePetTab()].labelKey | transloco }}</h3>
              <p>{{ petFormTabs[activePetTab()].descriptionKey | transloco }}</p>
            </div>
          </div>
          <app-dynamic-form
            *ngIf="dialogVisible"
            [config]="activePetFormConfig()"
            [formData]="petFormData()"
            [submitting]="saving()"
            (formValueChange)="onPetFormValueChange($event)"
            (onSubmitClick)="advancePetForm($event)"
            (onCancel)="closeDialog()"
          />
        </section>
      </div>
    </app-modal>
  `,
  styles: [`
    :host { display: block; }
    .family-page { max-width: var(--max-page-width); margin: 0 auto; padding: 0 0 1.5rem; }
    .page-header { justify-content: space-between; gap: 1rem; }
    .page-subtitle { margin: .5rem 0 0; color: var(--text-secondary); }
    .care-invitations-link { display: inline-flex; align-items: center; gap: .5rem; color: var(--text-secondary); text-decoration: none; white-space: nowrap; }
    .care-invitations-link:hover { color: var(--text-primary); }
    .card-modern { overflow: hidden; margin-bottom: 1rem; border-radius: var(--radius-lg); background: var(--surface-card); }
    .card-orange-border { border: 1px solid var(--surface-border) }
    .care-summary { border-color: color-mix(in srgb, var(--primary-color) 32%, var(--surface-border)); background: color-mix(in srgb, var(--primary-color) 5%, var(--surface-card)); }
    .card-header { display: flex; align-items: center; gap: .5rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--surface-border); }
    .card-header-icon { color: var(--text-secondary); font-size: 1.125rem; }
    .card-header-title { color: var(--text-primary); font-size: .9375rem; font-weight: 600; }
    .card-body { padding: .75rem 1.25rem; }
    .care-summary h2 { margin: 0; }
    .care-summary .card-header { background: color-mix(in srgb, var(--primary-color) 8%, var(--surface-card)); }
    .care-summary .card-header-icon { color: var(--primary-color); }
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
    .pet-wizard { overflow: hidden; background: var(--surface-card); color: var(--text-primary); }
    .pet-wizard-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 1.5rem 1.75rem 1.25rem; }
    .pet-wizard-heading { display: flex; align-items: center; gap: 1rem; min-width: 0; }
    .pet-wizard-icon, .pet-wizard-section-icon { display: grid; flex: 0 0 auto; place-items: center; width: 3rem; height: 3rem; border-radius: 1rem; background: color-mix(in srgb, var(--primary-color) 13%, var(--surface-card)); color: var(--primary-color); font-size: 1.2rem; }
    .pet-wizard-eyebrow { display: block; margin-bottom: .2rem; color: var(--primary-color); font-size: .7rem; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
    .pet-wizard-header h2 { margin: 0; color: var(--text-primary); font-size: 1.35rem; font-weight: 750; letter-spacing: -.025em; }
    .pet-wizard-header p, .pet-wizard-section-heading p { margin: .35rem 0 0; color: var(--text-secondary); font-size: .875rem; line-height: 1.5; }
    .pet-wizard-close { display: grid; flex: 0 0 auto; place-items: center; width: 2.5rem; height: 2.5rem; border: 1px solid var(--surface-border); border-radius: 50%; background: var(--surface-card); color: var(--text-secondary); cursor: pointer; transition: background .2s, color .2s; }
    .pet-wizard-close:hover:not(:disabled) { background: var(--surface-hover); color: var(--text-primary); }
    .pet-wizard-close:disabled { cursor: not-allowed; opacity: .55; }
    .pet-wizard-progress { height: 3px; background: var(--surface-hover); }
    .pet-wizard-progress span { display: block; height: 100%; border-radius: 0 99px 99px 0; background: linear-gradient(90deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 68%, #f59e0b)); transition: width .25s ease; }
    .pet-wizard-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .5rem; padding: 1.1rem 1.75rem; border-bottom: 1px solid var(--surface-border); }
    .pet-wizard-tab { position: relative; display: flex; align-items: center; gap: .65rem; min-width: 0; padding: .7rem .65rem; border: 1px solid transparent; border-radius: .85rem; background: transparent; color: var(--text-secondary); text-align: left; cursor: pointer; transition: background .2s, border-color .2s, color .2s; }
    .pet-wizard-tab:hover { background: var(--surface-hover); color: var(--text-primary); }
    .pet-wizard-tab.active { border-color: color-mix(in srgb, var(--primary-color) 35%, var(--surface-border)); background: color-mix(in srgb, var(--primary-color) 8%, var(--surface-card)); color: var(--text-primary); }
    .pet-wizard-tab-icon { display: grid; flex: 0 0 auto; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: .7rem; background: var(--surface-hover); color: var(--text-secondary); }
    .pet-wizard-tab.active .pet-wizard-tab-icon { background: var(--primary-color); color: #fff; }
    .pet-wizard-tab-copy { display: flex; flex-direction: column; gap: .1rem; min-width: 0; }
    .pet-wizard-tab-step { color: var(--text-secondary); font-size: .62rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    .pet-wizard-tab-label { overflow: hidden; color: inherit; font-size: .8rem; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
    .pet-wizard-tab-chevron { margin-left: auto; color: var(--surface-border); font-size: .65rem; }
    .pet-wizard-panel { padding: 1.35rem 1.75rem 1.5rem; }
    .pet-wizard-section-heading { display: flex; align-items: center; gap: .85rem; margin-bottom: .5rem; }
    .pet-wizard-section-icon { width: 2.6rem; height: 2.6rem; border-radius: .8rem; font-size: 1rem; }
    .pet-wizard-section-heading h3 { margin: 0; color: var(--text-primary); font-size: 1rem; font-weight: 700; }
    .pet-wizard-section-heading p { margin-top: .2rem; font-size: .8rem; }
    :host ::ng-deep .pet-wizard .dynamic-form-container { overflow: visible; border: 0; border-radius: 0; background: transparent; }
    :host ::ng-deep .pet-wizard .dynamic-form { padding: 1rem 0 0; }
    :host ::ng-deep .pet-wizard .form-fields { gap: 1rem 1.15rem; }
    :host ::ng-deep .pet-wizard .field-label { color: var(--text-primary); font-weight: 600; }
    :host ::ng-deep .pet-wizard .form-actions { margin-top: 1.25rem; padding-top: 1.1rem; }
    @media (max-width: 760px) {
      .care-summary-body { grid-template-columns: 1fr; align-items: start; }
      .care-more { justify-self: start; }
      .pet-wizard-header { padding: 1.25rem 1.25rem 1rem; }
      .pet-wizard-tabs { padding: .85rem 1rem; gap: .25rem; }
      .pet-wizard-tab { flex-direction: column; align-items: flex-start; gap: .35rem; padding: .6rem .45rem; }
      .pet-wizard-tab-chevron { display: none; }
      .pet-wizard-panel { padding: 1.1rem 1.25rem 1.25rem; }
    }
    @media (max-width: 600px) {
      .family-page { padding-bottom: 1rem; }
      .page-header { align-items: flex-start; flex-direction: column; }
      .pets-panel-header { align-items: flex-start; }
      .care-list a { flex-direction: column; gap: .15rem; }
      .care-date { text-align: left; }
      .pet-wizard-header { padding: 1rem; }
      .pet-wizard-heading { gap: .7rem; }
      .pet-wizard-icon { width: 2.6rem; height: 2.6rem; border-radius: .8rem; }
      .pet-wizard-header h2 { font-size: 1.15rem; }
      .pet-wizard-header p { font-size: .8rem; }
      .pet-wizard-tabs { padding: .7rem .5rem; }
      .pet-wizard-tab { align-items: center; padding: .55rem .2rem; text-align: center; }
      .pet-wizard-tab-icon { width: 2rem; height: 2rem; }
      .pet-wizard-tab-copy { width: 100%; }
      .pet-wizard-tab-step { font-size: .55rem; }
      .pet-wizard-tab-label { width: 100%; font-size: .67rem; }
      .pet-wizard-panel { padding: 1rem; }
    }
  `],
})
export class PetsPageComponent implements OnInit {
  private readonly petService = inject(PetService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly i18n = inject(TranslocoService);
  // Reactivo al idioma: las etiquetas se (re)traducen cuando los JSON de i18n
  // ya están cargados o cuando el usuario cambia de idioma. Al ser un computed
  // perezoso, se evalúa al abrir el diálogo, evitando capturar claves crudas
  // (p.ej. "petsPage.nameLabel") si se construyera antes de cargar traducciones.
  readonly petEditorConfig = computed<DynamicFormConfig>(() => {
    this.i18n.activeLang();
    return buildPetEditorFormConfig(this.i18n);
  });
  readonly petFormTabs = [
    {
      id: 'basics',
      icon: 'pi pi-user',
      labelKey: 'petsPage.tabBasics',
      descriptionKey: 'petsPage.tabBasicsDescription',
      fields: new Set(['name', 'species', 'breed', 'dateOfBirth', 'gender', 'color', 'microchipId', 'weight', 'weightUnit', 'bio'])
    },
    {
      id: 'health',
      icon: 'pi pi-heart',
      labelKey: 'petsPage.tabHealth',
      descriptionKey: 'petsPage.tabHealthDescription',
      fields: new Set(['bloodType', 'allergies', 'medicalConditions', 'vetName', 'vetPhone', 'vetAddress', 'lastVaccinationDate', 'nextVaccinationDate', 'lastVetVisit', 'insuranceProvider', 'insurancePolicyNumber', 'emergencyContact', 'emergencyPhone'])
    },
    {
      id: 'records',
      icon: 'pi pi-id-card',
      labelKey: 'petsPage.tabRecords',
      descriptionKey: 'petsPage.tabRecordsDescription',
      fields: new Set(['adoptionDate', 'adoptionCenter', 'registrationNumber', 'licenseNumber', 'licenseExpiryDate', 'spayedNeutered', 'spayedNeuteredDate'])
    },
    {
      id: 'personality',
      icon: 'pi pi-sparkles',
      labelKey: 'petsPage.tabPersonality',
      descriptionKey: 'petsPage.tabPersonalityDescription',
      fields: new Set(['temperament', 'energyLevel', 'trainingLevel', 'favoriteActivities', 'favoriteFood', 'specialNeeds'])
    }
  ];
  readonly activePetTab = signal(0);
  readonly furthestPetTab = signal(0);
  readonly activePetFormConfig = computed<DynamicFormConfig>(() => {
    const tab = this.petFormTabs[this.activePetTab()];
    const isLastTab = this.activePetTab() === this.petFormTabs.length - 1;
    const editorConfig = this.petEditorConfig();
    return {
      ...editorConfig,
      title: undefined,
      cancelLabel: this.i18n.translate('petsPage.cancel'),
      submitLabel: this.i18n.translate(isLastTab ? 'petsPage.createPet' : 'petsPage.continue'),
      fields: editorConfig.fields.filter(field => tab.fields.has(field.key))
    };
  });

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
    this.activePetTab.set(0);
    this.furthestPetTab.set(0);
    this.dialogVisible = true;
  }

  selectPetTab(index: number): void {
    if (index > this.furthestPetTab()) return;
    this.activePetTab.set(index);
  }

  onPetFormValueChange(data: Record<string, unknown>): void {
    this.petFormData.update(current => ({ ...current, ...data }));
  }

  advancePetForm(data: Record<string, unknown>): void {
    this.petFormData.update(current => ({ ...current, ...data }));
    if (this.activePetTab() < this.petFormTabs.length - 1) {
      const nextTab = this.activePetTab() + 1;
      this.furthestPetTab.set(Math.max(this.furthestPetTab(), nextTab));
      this.activePetTab.set(nextTab);
      return;
    }

    this.savePet(this.petFormData());
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
