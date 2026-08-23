import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { TableComponent, TableColumn } from '../../../shared/presentation/components/table/table.component';
import { ModalComponent } from '../../../shared/presentation/components/modal/modal';
import { PetService } from '../../infrastructure/services/pet.service';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { PetResponse } from '../../domain/pet.model';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  status: 'active' | 'inactive';
  avatar: string;
}

@Component({
  selector: 'app-pets-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    AvatarModule,
    InputTextModule,
    FormsModule,
    SelectModule,
    TableComponent,
    ModalComponent,
  ],
  template: `
    <div class="page-content">
        <app-table
          title="Família"
          [data]="pets()"
          [columns]="petColumns"
          [rows]="5"
          (onView)="onView($event)"
          (onEdit)="onEdit($event)"
          (onDelete)="onDelete($event)"
        >
        </app-table>

      <app-modal
        [visible]="dialogVisible"
        header="Editar Mascota"
        size="medium"
        (onHide)="dialogVisible = false"
        (onCancel)="dialogVisible = false"
        (onConfirm)="savePet()"
        confirmLabel="Guardar"
        cancelLabel="Cancelar"
      >
        <div class="flex flex-column gap-3">
          <div class="flex flex-column gap-2">
            <label for="name">Nombre</label>
            <input pInputText id="name" [(ngModel)]="newPet.name" />
          </div>
          <div class="flex flex-column gap-2">
            <label for="species">Especie</label>
            <p-select
              [options]="speciesOptions"
              [(ngModel)]="newPet.species"
              placeholder="Selecciona especie"
            />
          </div>
          <div class="flex flex-column gap-2">
            <label for="breed">Raza</label>
            <input pInputText id="breed" [(ngModel)]="newPet.breed" />
          </div>
          <div class="flex flex-column gap-2">
            <label for="age">Edad (años)</label>
            <input pInputText id="age" type="number" [(ngModel)]="newPet.age" />
          </div>
          <div class="flex flex-column gap-2">
            <label for="weight">Peso (kg)</label>
            <input pInputText id="weight" type="number" [(ngModel)]="newPet.weight" />
          </div>
        </div>
      </app-modal>
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
export class PetsPageComponent implements OnInit {
  private router = inject(Router);
  private petService = inject(PetService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  pets = signal<Pet[]>([]);

  dialogVisible = false;
  newPet: Partial<Pet> = {};

  petColumns: TableColumn[] = [
    {
      field: 'name',
      header: 'Mascota',
      type: 'avatar',
      format: (value: string, row: Pet) => row.name,
    },
    { field: 'species', header: 'Especie' },
    { field: 'breed', header: 'Raza' },
    { field: 'age', header: 'Edad', format: (value: number) => `${value} años` },
    { field: 'weight', header: 'Peso', format: (value: number) => `${value} kg` },
    {
      field: 'status',
      header: 'Estado',
      type: 'status',
      statusLabel: (value: string) => (value === 'active' ? 'Activo' : 'Inactivo'),
      statusSeverity: (value: string) => (value === 'active' ? 'success' : 'secondary'),
    },
    {
      field: 'actions',
      header: 'Acciones',
      type: 'actions',
    },
  ];

  speciesOptions = [
    { label: 'Perro', value: 'Perro' },
    { label: 'Gato', value: 'Gato' },
    { label: 'Ave', value: 'Ave' },
    { label: 'Conejo', value: 'Conejo' },
    { label: 'Hámster', value: 'Hámster' },
  ];

  ngOnInit(): void {
    this.loadPets();
  }

  // Load pets from the backend
  loadPets(): void {
    const user = this.authService.user();
    if (!user?.id) return;

    this.petService.getPetsByOwner(user.id).subscribe({
      next: (petResponses: PetResponse[]) => {
        this.pets.set(petResponses.map(p => this.mapPetResponseToPet(p)));
      },
      error: (err) => {
        console.error('Error loading pets:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las mascotas'
        });
      }
    });
  }

  // Map PetResponse from backend to the Pet interface used in the UI
  mapPetResponseToPet(p: PetResponse): Pet {
    const age = p.dateOfBirth
      ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()
      : 0;

    return {
      id: p.id,
      name: p.name,
      species: p.species || 'Desconocido',
      breed: p.breed || 'Sin raza',
      age,
      weight: p.weight || 0,
      status: p.active ? 'active' : 'inactive',
      avatar: p.avatarUrl || 'https://i.pravatar.cc/150',
    };
  }

  editPet(pet: Pet) {
    this.newPet = { ...pet };
    this.dialogVisible = true;
  }

  deletePet(pet: Pet) {
    this.petService.deletePet(pet.id).subscribe({
      next: () => {
        this.pets.set(this.pets().filter((p) => p.id !== pet.id));
        this.messageService.add({
          severity: 'success',
          summary: 'Mascota eliminada',
          detail: `La mascota "${pet.name}" ha sido eliminada`
        });
      },
      error: (err) => {
        console.error('Error deleting pet:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la mascota'
        });
      }
    });
  }

  onView(pet: Pet) {
    this.router.navigate(['/profile/pet', pet.id]);
  }

  onEdit(pet: Pet) {
    this.editPet(pet);
  }

  onDelete(pet: Pet) {
    this.deletePet(pet);
  }

  savePet() {
    if (this.newPet.id) {
      // Update existing pet
      this.petService.updatePet(this.newPet.id, {
        name: this.newPet.name || '',
        species: this.newPet.species || '',
        breed: this.newPet.breed,
      }).subscribe({
        next: (updatedPet) => {
          this.pets.update((pets) =>
            pets.map((p) => (p.id === this.newPet.id ? { ...p, ...this.newPet } : p))
          );
          this.messageService.add({
            severity: 'success',
            summary: 'Mascota actualizada',
            detail: `La mascota "${this.newPet.name}" ha sido actualizada`
          });
          this.dialogVisible = false;
        },
        error: (err) => {
          console.error('Error updating pet:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la mascota'
          });
        }
      });
    }
  }
}
