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
    TranslocoModule,
  ],
  template: `
    <div class="page-content">
      <header class="page-heading-card">
        <div class="page-heading-copy">
          <h1>{{ 'services.title' | transloco }}</h1>
        </div>
        <p-button
          label="{{ 'services.book' | transloco }}"
          icon="pi pi-plus"
          (onClick)="showAddDialog()"
        />
      </header>

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
      padding: 0;
    }
  `],
})
export class ServicesPageComponent {
  readonly i18n = inject(TranslocoService);
  private readonly transloco = inject(TranslocoService);

  serviceColumns: TableColumn[] = [
    { field: 'name', header: this.transloco.translate('services.service'), sortable: true },
    { field: 'provider', header: this.transloco.translate('services.provider'), sortable: true },
    {
      field: 'type',
      header: this.transloco.translate('services.type'),
      type: 'status',
      format: (value: string) => this.getTypeLabel(value),
      statusSeverity: (value: string) => this.getTypeSeverity(value),
    },
    {
      field: 'price',
      header: this.transloco.translate('services.price'),
      format: (value: number) => `${value} €`,
    },
    {
      field: 'rating',
      header: this.transloco.translate('services.rating'),
      format: (value: number) => `${value}`,
    },
    { field: 'availability', header: this.transloco.translate('services.availability'), sortable: true },
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
      name: this.i18n.translate('services.dogGrooming'),
      provider: 'Grooming Happy Pets',
      type: 'grooming',
      price: 25,
      rating: 4.5,
      availability: this.i18n.translate('services.hours'),
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
        return this.transloco.translate('services.veterinary');
      case 'grooming':
        return this.transloco.translate('services.grooming');
      case 'walking':
        return this.transloco.translate('services.walking');
      case 'training':
        return this.transloco.translate('services.training');
      case 'boarding':
        return this.transloco.translate('services.boarding');
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
