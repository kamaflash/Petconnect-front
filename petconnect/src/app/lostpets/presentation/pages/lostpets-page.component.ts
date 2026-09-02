import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { TableComponent, TableColumn } from '../../../shared/presentation/components/table/table.component';

interface LostPet {
  id: string;
  name: string;
  species: string;
  breed: string;
  lastSeen: string;
  location: string;
  reward: number;
  status: 'lost' | 'found' | 'reunited';
}

@Component({
  selector: 'app-lostpets-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    FormsModule,
    SelectModule,
    TableComponent,
    TranslocoModule,
  ],
  template: `
    <div class="page-content">
      <div class="flex justify-between align-items-center mb-4">
        <h1 class="text-2xl font-bold m-0">{{ 'lostPets.title' | transloco }}</h1>
        <p-button
          label="{{ 'lostPets.report' | transloco }}"
          icon="pi pi-plus"
          (onClick)="showAddDialog()"
        />
      </div>

      <p-card>
        <app-table
          [data]="lostPets()"
          [columns]="lostPetColumns"
          [rows]="10"
        />
      </p-card>
    </div>
  `,
  styles: [`
    .page-content {
      max-width: var(--max-page-width);
      margin: 0 auto;
      padding: 1.5rem;
    }
  `],
})
export class LostPetsPageComponent {
  private readonly transloco = inject(TranslocoService);

  lostPetColumns: TableColumn[] = [
    { field: 'name', header: this.transloco.translate('lostPets.pet'), sortable: true },
    {
      field: 'species',
      header: this.transloco.translate('lostPets.speciesBreed'),
      format: (value: string, row: LostPet) => `${row.species} - ${row.breed}`,
    },
    { field: 'lastSeen', header: this.transloco.translate('lostPets.lastSeen'), sortable: true },
    { field: 'location', header: this.transloco.translate('lostPets.location'), sortable: true },
    {
      field: 'reward',
      header: this.transloco.translate('lostPets.reward'),
      format: (value: number) => `${value} €`,
    },
    {
      field: 'status',
      header: this.transloco.translate('lostPets.status'),
      type: 'status',
      format: (value: string) => this.getStatusLabel(value),
      statusSeverity: (value: string) => this.getStatusSeverity(value),
    },
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

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'lost':
        return 'danger';
      case 'found':
        return 'warn';
      case 'reunited':
        return 'success';
      default:
        return 'info';
    }
  }
}
