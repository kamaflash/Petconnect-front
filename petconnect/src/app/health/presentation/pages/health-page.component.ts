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

interface Vaccine {
  id: string;
  name: string;
  pet: string;
  date: string;
  nextDate: string;
  status: 'completed' | 'pending' | 'overdue';
}

interface Medication {
  id: string;
  name: string;
  pet: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-health-page',
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
      <h1 class="text-2xl font-bold mb-4">Salud de Família</h1>

      <div class="grid">
        <div class="col-12 md:col-6">
          <p-card>
            <app-table
              title="Vacunas"
              [data]="vaccines()"
              [columns]="vaccineColumns"
              [rows]="5"
            />
          </p-card>
        </div>

        <div class="col-12 md:col-6">
          <p-card>
            <app-table
              title="Medicación"
              [data]="medications()"
              [columns]="medicationColumns"
              [rows]="5"
            />
          </p-card>
        </div>
      </div>
    </div>
  `,
  styles: [``],
})
export class HealthPageComponent {
  vaccineColumns: TableColumn[] = [
    { field: 'name', header: 'Vacuna', sortable: true },
    { field: 'pet', header: 'Mascota', sortable: true },
    { field: 'date', header: 'Fecha', sortable: true },
    { field: 'nextDate', header: 'Próxima', sortable: true },
    {
      field: 'status',
      header: 'Estado',
      type: 'status',
      format: (value: string) => this.getVaccineStatus(value),
      statusSeverity: (value: string) => this.getVaccineSeverity(value),
    },
  ];

  medicationColumns: TableColumn[] = [
    { field: 'name', header: 'Medicamento', sortable: true },
    { field: 'pet', header: 'Mascota', sortable: true },
    { field: 'dosage', header: 'Dosis', sortable: true },
    { field: 'frequency', header: 'Frecuencia', sortable: true },
  ];

  vaccines = signal<Vaccine[]>([
    {
      id: '1',
      name: 'Rabia',
      pet: 'Max',
      date: '15/03/2024',
      nextDate: '15/03/2025',
      status: 'completed',
    },
    {
      id: '2',
      name: 'Moquillo',
      pet: 'Luna',
      date: '01/01/2024',
      nextDate: '01/01/2025',
      status: 'completed',
    },
    {
      id: '3',
      name: 'Polivalente',
      pet: 'Max',
      date: '20/06/2024',
      nextDate: '20/06/2024',
      status: 'overdue',
    },
  ]);

  medications = signal<Medication[]>([
    {
      id: '1',
      name: 'Antipulgas',
      pet: 'Max',
      dosage: '1 comprimido',
      frequency: 'Mensual',
      startDate: '01/06/2024',
      endDate: '01/12/2024',
    },
  ]);

  getVaccineStatus(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'pending':
        return 'Pendiente';
      case 'overdue':
        return 'Vencida';
      default:
        return status;
    }
  }

  getVaccineSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'info';
      case 'overdue':
        return 'danger';
      default:
        return 'info';
    }
  }
}
