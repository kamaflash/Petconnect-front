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
  ],
  template: `
    <div class="p-4">
      <div class="flex justify-between align-items-center mb-4">
        <h1 class="text-2xl font-bold m-0">Citas</h1>
        <p-button
          label="Nueva Cita"
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
  styles: [``],
})
export class AppointmentsPageComponent {
  appointmentColumns: TableColumn[] = [
    { field: 'pet', header: 'Mascota', sortable: true },
    { field: 'service', header: 'Servicio', sortable: true },
    { field: 'provider', header: 'Proveedor', sortable: true },
    { field: 'date', header: 'Fecha', sortable: true },
    { field: 'time', header: 'Hora', sortable: true },
    {
      field: 'status',
      header: 'Estado',
      type: 'status',
      format: (value: string) => this.getStatusLabel(value),
      statusSeverity: (value: string) => this.getStatusSeverity(value),
    },
  ];

  appointments = signal<Appointment[]>([
    {
      id: '1',
      pet: 'Max',
      service: 'Vacunación',
      provider: 'Veterinaria Central',
      date: '15/07/2024',
      time: '10:00',
      status: 'scheduled',
    },
    {
      id: '2',
      pet: 'Luna',
      service: 'Peluquería',
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
        return 'Programada';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
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
