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

interface Service {
  id: string;
  name: string;
  provider: string;
  type: 'veterinary' | 'grooming' | 'walking' | 'training' | 'boarding';
  price: number;
  rating: number;
  availability: string;
}

@Component({
  selector: 'app-services-page',
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
        <h1 class="text-2xl font-bold m-0">Servicios</h1>
        <p-button
          label="Reservar Servicio"
          icon="pi pi-plus"
          (onClick)="showAddDialog()"
        />
      </div>

      <p-card>
        <app-table
          [data]="services()"
          [columns]="serviceColumns"
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
export class ServicesPageComponent {
  serviceColumns: TableColumn[] = [
    { field: 'name', header: 'Servicio', sortable: true },
    { field: 'provider', header: 'Proveedor', sortable: true },
    {
      field: 'type',
      header: 'Tipo',
      type: 'status',
      format: (value: string) => this.getTypeLabel(value),
      statusSeverity: (value: string) => this.getTypeSeverity(value),
    },
    {
      field: 'price',
      header: 'Precio',
      format: (value: number) => `${value} €`,
    },
    {
      field: 'rating',
      header: 'Valoración',
      format: (value: number) => `${value}`,
    },
    { field: 'availability', header: 'Disponibilidad', sortable: true },
  ];

  services = signal<Service[]>([
    {
      id: '1',
      name: 'Consulta General',
      provider: 'Veterinaria Central',
      type: 'veterinary',
      price: 35,
      rating: 4.8,
      availability: 'Lun-Vie 9:00-18:00',
    },
    {
      id: '2',
      name: 'Peluquería Canina',
      provider: 'Grooming Happy Pets',
      type: 'grooming',
      price: 25,
      rating: 4.5,
      availability: 'Mar-Sáb 10:00-17:00',
    },
    {
      id: '3',
      name: 'Paseo Matutino',
      provider: 'PaseaDog',
      type: 'walking',
      price: 15,
      rating: 4.9,
      availability: 'Lun-Dom 7:00-10:00',
    },
  ]);

  showAddDialog() {
    // TODO: Implement add dialog
  }

  bookService(service: Service) {
    // TODO: Implement booking
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'veterinary':
        return 'Veterinaria';
      case 'grooming':
        return 'Peluquería';
      case 'walking':
        return 'Paseo';
      case 'training':
        return 'Adiestramiento';
      case 'boarding':
        return 'Guardería';
      default:
        return type;
    }
  }

  getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (type) {
      case 'veterinary':
        return 'info';
      case 'grooming':
        return 'success';
      case 'walking':
        return 'warn';
      case 'training':
        return 'danger';
      case 'boarding':
        return 'info';
      default:
        return 'info';
    }
  }
}
