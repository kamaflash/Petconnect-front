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

interface Appointment {
  id: string;
  pet: string;
  service: string;
  provider: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

@Component({
  selector: 'app-appointments-page',
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
        <h1 class="text-2xl font-bold m-0">{{ 'appointments.title' | transloco }}</h1>
        <p-button
          label="{{ 'appointments.new' | transloco }}"
          icon="pi pi-plus"
          (onClick)="showAddDialog()"
        />
      </div>

      <p-card>
        <app-table
          [data]="appointments()"
          [columns]="appointmentColumns"
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
export class AppointmentsPageComponent {
  readonly i18n = inject(TranslocoService);
  private readonly transloco = inject(TranslocoService);

  appointmentColumns: TableColumn[] = [
    { field: 'pet', header: this.transloco.translate('appointments.pet'), sortable: true },
    { field: 'service', header: this.transloco.translate('appointments.service'), sortable: true },
    { field: 'provider', header: this.transloco.translate('appointments.provider'), sortable: true },
    { field: 'date', header: this.transloco.translate('appointments.date'), sortable: true },
    { field: 'time', header: this.transloco.translate('appointments.time'), sortable: true },
    {
      field: 'status',
      header: this.transloco.translate('appointments.status'),
      type: 'status',
      format: (value: string) => this.getStatusLabel(value),
      statusSeverity: (value: string) => this.getStatusSeverity(value),
    },
  ];

  appointments = signal<Appointment[]>([
    {
      id: '1',
      pet: 'Max',
      service: this.i18n.translate('common.vaccination'),
      provider: 'Veterinaria Central',
      date: '15/07/2024',
      time: '10:00',
      status: 'scheduled',
    },
    {
      id: '2',
      pet: 'Luna',
      service: this.i18n.translate('common.grooming'),
      provider: 'Grooming Happy Pets',
      date: '18/07/2024',
      time: '14:30',
      status: 'scheduled',
    },
  ]);

  showAddDialog() {
    // TODO: Implement add dialog
  }

  cancelAppointment(appointment: Appointment) {
    this.appointments.update((apps) =>
      apps.map((a) =>
        a.id === appointment.id ? { ...a, status: 'cancelled' } : a
      )
    );
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'scheduled':
        return this.transloco.translate('appointments.scheduled');
      case 'completed':
        return this.transloco.translate('appointments.completed');
      case 'cancelled':
        return this.transloco.translate('appointments.cancelled');
      default:
        return status;
    }
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'scheduled':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'info';
    }
  }
}
