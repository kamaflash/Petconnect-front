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

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'banned';
  joinDate: string;
}

interface Report {
  id: string;
  type: string;
  reporter: string;
  target: string;
  status: 'pending' | 'reviewed' | 'resolved';
  date: string;
}

@Component({
  selector: 'app-admin-page',
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
      <h1 class="text-2xl font-bold mb-4">Panel de Administración</h1>

      <div class="grid">
        <div class="col-12 md:col-4">
          <p-card>
            <div class="text-center">
              <h3 class="m-0 mb-2">Usuarios</h3>
              <p class="text-3xl font-bold m-0">1,245</p>
            </div>
          </p-card>
        </div>

        <div class="col-12 md:col-4">
          <p-card>
            <div class="text-center">
              <h3 class="m-0 mb-2">Reportes</h3>
              <p class="text-3xl font-bold m-0">23</p>
            </div>
          </p-card>
        </div>

        <div class="col-12 md:col-4">
          <p-card>
            <div class="text-center">
              <h3 class="m-0 mb-2">Família</h3>
              <p class="text-3xl font-bold m-0">2,567</p>
            </div>
          </p-card>
        </div>
      </div>

      <p-card header="Gestión de Usuarios" class="mt-4">
        <app-table
          [data]="users()"
          [columns]="userColumns"
          [rows]="10"
        />
      </p-card>
    </div>
  `,
  styles: [``],
})
export class AdminPageComponent {
  userColumns: TableColumn[] = [
    { field: 'name', header: 'Usuario', sortable: true },
    { field: 'email', header: 'Email', sortable: true },
    {
      field: 'role',
      header: 'Rol',
      type: 'status',
      format: (value: string) => this.getRoleLabel(value),
      statusSeverity: (value: string) => this.getRoleSeverity(value),
    },
    {
      field: 'status',
      header: 'Estado',
      type: 'status',
      format: (value: string) => this.getStatusLabel(value),
      statusSeverity: (value: string) => this.getStatusSeverity(value),
    },
    { field: 'joinDate', header: 'Fecha Registro', sortable: true },
  ];

  users = signal<User[]>([
    {
      id: '1',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      role: 'user',
      status: 'active',
      joinDate: '15/03/2024',
    },
    {
      id: '2',
      name: 'María López',
      email: 'maria@example.com',
      role: 'moderator',
      status: 'active',
      joinDate: '20/04/2024',
    },
  ]);

  reports = signal<Report[]>([
    {
      id: '1',
      type: 'Contenido inapropiado',
      reporter: 'Usuario 1',
      target: 'Publicación 123',
      status: 'pending',
      date: '10/07/2024',
    },
  ]);

  getRoleLabel(role: string): string {
    switch (role) {
      case 'user':
        return 'Usuario';
      case 'admin':
        return 'Admin';
      case 'moderator':
        return 'Moderador';
      default:
        return role;
    }
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (role) {
      case 'user':
        return 'info';
      case 'admin':
        return 'success';
      case 'moderator':
        return 'warn';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'suspended':
        return 'Suspendido';
      case 'banned':
        return 'Baneado';
      default:
        return status;
    }
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'warn';
      case 'banned':
        return 'danger';
      default:
        return 'info';
    }
  }

  suspendUser(user: User) {
    // TODO: Implement suspend user
  }
}
