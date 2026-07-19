import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { Router } from '@angular/router';
import { TableComponent, TableColumn } from '../../../shared/presentation/components/table/table.component';
import { ModalComponent } from '../../../shared/presentation/components/modal/modal';

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
    <div >
        <app-table
          title="Família"
          [data]="pets()"
          [columns]="petColumns"
          [rows]="5"
          (onView)="onView($event)"
          (onEdit)="onEdit($event)"
          (onDelete)="onDelete($event)"
        >
          <p-button
            icon="pi pi-plus"
            [text]="true"
            (onClick)="showAddDialog()"
            table-actions
          />
        </app-table>

      <app-modal
        [visible]="dialogVisible"
        header="Nueva Mascota"
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
  styles: [``],
})
export class PetsPageComponent {
  private router = inject(Router);

  pets = signal<Pet[]>([
    {
      id: '1',
      name: 'Max',
      species: 'Perro',
      breed: 'Golden Retriever',
      age: 3,
      weight: 25,
      status: 'active',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
    {
      id: '2',
      name: 'Luna',
      species: 'Gato',
      breed: 'Siamés',
      age: 2,
      weight: 4,
      status: 'active',
      avatar: 'https://i.pravatar.cc/150?img=6',
    },
  ]);

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

  showAddDialog() {
    this.newPet = {};
    this.dialogVisible = true;
  }

  editPet(pet: Pet) {
    this.newPet = { ...pet };
    this.dialogVisible = true;
  }

  deletePet(pet: Pet) {
    this.pets.set(this.pets().filter((p) => p.id !== pet.id));
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
      this.pets.update((pets) =>
        pets.map((p) => (p.id === this.newPet.id ? { ...p, ...this.newPet } : p))
      );
    } else {
      this.pets.update((pets) => [
        ...pets,
        { ...this.newPet, id: Date.now().toString() } as Pet,
      ]);
    }
    this.dialogVisible = false;
  }
}
