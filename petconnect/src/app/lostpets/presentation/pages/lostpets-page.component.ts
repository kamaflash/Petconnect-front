import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { PageHeadingCardComponent } from '../../../shared/presentation/components/page-heading-card/page-heading-card.component';
import { ColumnConfig, FilterConfig, PetFeedGridComponent } from '../../../adoptions/presentation/components/pet-feed-grid/pet-feed-grid.component';

interface LostPet {
  id: string;
  name: string;
  species: string;
  breed: string;
  lastSeen: string;
  location: string;
  speciesBreed: string;
  reward: number;
  status: 'lost' | 'found' | 'reunited';
  statusLabel: string;
}

@Component({
  selector: 'app-lostpets-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    PageHeadingCardComponent,
    PetFeedGridComponent,
    TranslocoModule,
  ],
  template: `
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
          (click)="showAddDialog()"
        >
          <i class="pi pi-plus" aria-hidden="true"></i>
        </button>
      </app-page-heading-card>

      <app-pet-feed-grid
        [items]="lostPets()"
        [itemLabel]="'lostPets.itemLabel' | transloco"
        itemKeyField="id"
        [filterConfigs]="lostPetFilters"
        [columnConfigs]="lostPetColumns"
      />
    </div>
  `,
  styles: [`
    .report-button {
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border: 1px solid var(--surface-border);
      border-radius: 50%;
      background: var(--surface-card);
      color: var(--text-secondary);
      cursor: pointer;
      transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
    }
    .report-button:hover { background: var(--surface-hover); color: var(--text-primary); }
    .report-button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .page-content {
      max-width: var(--max-page-width);
      margin: 0 auto;
      padding: 0 1rem;
    }
  `],
})
export class LostPetsPageComponent {
  private readonly transloco = inject(TranslocoService);

  lostPetFilters: FilterConfig[] = [
    {
      type: 'text',
      key: 'search',
      label: this.transloco.translate('lostPets.search'),
      placeholder: this.transloco.translate('lostPets.searchPlaceholder'),
      searchFields: ['name', 'species', 'breed', 'lastSeen', 'location']
    },
    {
      type: 'select',
      key: 'status',
      label: this.transloco.translate('lostPets.status'),
      options: [
        { label: this.transloco.translate('lostPets.lost'), value: 'lost' },
        { label: this.transloco.translate('lostPets.found'), value: 'found' },
        { label: this.transloco.translate('lostPets.reunited'), value: 'reunited' }
      ]
    }
  ];

  lostPetColumns: ColumnConfig[] = [
    { key: 'name', label: this.transloco.translate('lostPets.pet'), type: 'text' },
    { key: 'speciesBreed', label: this.transloco.translate('lostPets.speciesBreed'), type: 'text', icon: 'pi-paw' },
    { key: 'lastSeen', label: this.transloco.translate('lostPets.lastSeen'), type: 'text', icon: 'pi-calendar' },
    { key: 'location', label: this.transloco.translate('lostPets.location'), type: 'text', icon: 'pi-map-marker' },
    { key: 'reward', label: this.transloco.translate('lostPets.reward'), type: 'price' },
    { key: 'statusLabel', label: this.transloco.translate('lostPets.status'), type: 'badge' },
  ];

  lostPets = signal<LostPet[]>([
    {
      id: '1',
      name: 'Rocky',
      species: 'Perro',
      breed: 'Bulldog',
      lastSeen: '10/07/2024',
      location: 'Parque Central',
      reward: 100,
      status: 'lost',
      statusLabel: this.getStatusLabel('lost'),
      speciesBreed: 'Perro - Bulldog',
    },
    {
      id: '2',
      name: 'Mia',
      species: 'Gato',
      breed: 'Persa',
      lastSeen: '08/07/2024',
      location: 'Calle Mayor',
      reward: 50,
      status: 'found',
      statusLabel: this.getStatusLabel('found'),
      speciesBreed: 'Gato - Persa',
    },
  ]);

  showAddDialog() {
    // TODO: Implement add dialog
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'lost':
        return this.transloco.translate('lostPets.lost');
      case 'found':
        return this.transloco.translate('lostPets.found');
      case 'reunited':
        return this.transloco.translate('lostPets.reunited');
      default:
        return status;
    }
  }

}
