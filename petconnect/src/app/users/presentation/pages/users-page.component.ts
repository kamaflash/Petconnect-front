import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  level: number;
  xp: number;
  joinDate: string;
  petsCount: number;
}

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    FormsModule,
    AvatarModule,
    TagModule,
  ],
  template: `
    <div class="p-4">
      <div class="flex justify-between align-items-center mb-4">
        <h1 class="text-2xl font-bold m-0">Mi Perfil</h1>
        <p-button
          [label]="isEditing ? 'Cancelar' : 'Editar Perfil'"
          [icon]="isEditing ? 'pi pi-times' : 'pi pi-pencil'"
          (onClick)="toggleEdit()"
        />
      </div>

      <div class="grid">
        <div class="col-12 md:col-4">
          <p-card>
            <div class="flex flex-column align-items-center text-center">
              <p-avatar
                [image]="user().avatar"
                size="xlarge"
                shape="circle"
                class="mb-3"
              />
              <h2 class="m-0 mb-2">{{ user().name }}</h2>
              <p-tag [value]="'Nivel ' + user().level" severity="info" />
              <p class="text-sm text-secondary mt-2">
                Miembro desde {{ user().joinDate }}
              </p>
              <p class="text-sm text-secondary">
                <i class="pi pi-paw"></i> {{ user().petsCount }} mascotas registradas
              </p>
            </div>
          </p-card>
        </div>

        <div class="col-12 md:col-8">
          <p-card header="Información Personal">
            <div class="flex flex-column gap-3">
              <div class="flex flex-column gap-2">
                <label for="name">Nombre</label>
                <input
                  pInputText
                  id="name"
                  [(ngModel)]="user().name"
                  [disabled]="!isEditing"
                />
              </div>
              <div class="flex flex-column gap-2">
                <label for="email">Email</label>
                <input
                  pInputText
                  id="email"
                  [(ngModel)]="user().email"
                  [disabled]="!isEditing"
                />
              </div>
              <div class="flex flex-column gap-2">
                <label for="phone">Teléfono</label>
                <input
                  pInputText
                  id="phone"
                  [(ngModel)]="user().phone"
                  [disabled]="!isEditing"
                />
              </div>
              <div class="flex flex-column gap-2">
                <label for="bio">Biografía</label>
                <textarea
                  id="bio"
                  rows="3"
                  class="w-full"
                  placeholder="Cuéntanos sobre ti y tus mascotas..."
                  [disabled]="!isEditing"
                ></textarea>
              </div>
            </div>
            @if (isEditing) {
              <ng-template pTemplate="footer">
                <p-button label="Guardar Cambios" (onClick)="saveProfile()" />
              </ng-template>
            }
          </p-card>
        </div>
      </div>
    </div>
  `,
  styles: [``],
})
export class UsersPageComponent {
  isEditing = false;

  user = signal<UserProfile>({
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '+34 600 123 456',
    avatar: 'https://i.pravatar.cc/150?img=10',
    level: 12,
    xp: 650,
    joinDate: 'Ene 2024',
    petsCount: 2,
  });

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  saveProfile() {
    this.isEditing = false;
  }
}
