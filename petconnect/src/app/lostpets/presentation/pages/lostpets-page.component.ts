import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
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
  ],
  template: `
    <div class="page-content">
      <div class="flex justify-between align-items-center mb-4">
        <h1 class="text-2xl font-bold m-0">Família Perdidas</h1>
        <p-button
          label="Reportar Pérdida"
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
  lostPetColumns: TableColumn[] = [
    { field: 'name', header: 'Mascota', sortable: true },
    {
      field: 'species',
      header: 'Especie/Raza',
      format: (value: string, row: LostPet) => `${row.species} - ${row.breed}`,
    },
    { field: 'lastSeen', header: 'Última Vez', sortable: true },
    { field: 'location', header: 'Ubicación', sortable: true },
    {
      field: 'reward',
      header: 'Recompensa',
      format: (value: number) => `${value} €`,
    },
    {
      field: 'status',
      header: 'Estado',
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
        return 'Perdido';
      case 'found':
        return 'Encontrado';
      case 'reunited':
        return 'Reencontrado';
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
