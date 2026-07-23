import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { PetService } from '../../infrastructure/services/pet.service';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { CreatePetRequest } from '../../domain/pet.model';

@Component({
  selector: 'app-create-pet-page',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  template: `
    <div class="create-pet-container">
      <div class="create-pet-content">
        <app-dynamic-form
          [config]="formConfig"
          [(formData)]="formData"
          (onSubmitClick)="handleSubmit($event)"
          (onCancel)="handleCancel()"
        />
      </div>
    </div>
  `,
  styles: [`
    .create-pet-container {
      min-height: 100vh;
      background-color: var(--bitbucket-header-bg);
      padding: 2rem;
      transition: background-color 0.3s ease;
    }

    .dark .create-pet-container {
      background-color: #111827;
    }

    .create-pet-content {
      max-width: 800px;
      margin: 0 auto;
    }
  `]
})
export class CreatePetPageComponent {
  formData = signal<any>({});

  formConfig: DynamicFormConfig = {
    title: 'Crear Nueva Mascota',
    submitLabel: 'Crear Mascota',
    showCancel: true,
    fields: [
      {
        key: 'name',
        label: 'Nombre',
        type: 'input',
        placeholder: 'Nombre de la mascota',
        validation: { required: true, minLength: 2, maxLength: 100 }
      },
      {
        key: 'species',
        label: 'Especie',
        type: 'select',
        placeholder: 'Seleccione una especie',
        options: [
          { label: 'Perro', value: 'dog' },
          { label: 'Gato', value: 'cat' },
          { label: 'Ave', value: 'bird' },
          { label: 'Conejo', value: 'rabbit' },
          { label: 'Hámster', value: 'hamster' },
          { label: 'Otro', value: 'other' }
        ],
        validation: { required: true }
      },
      {
        key: 'breed',
        label: 'Raza',
        type: 'input',
        placeholder: 'Raza de la mascota',
        validation: { maxLength: 100 }
      },
      {
        key: 'dateOfBirth',
        label: 'Fecha de Nacimiento',
        type: 'date',
        placeholder: 'Seleccione la fecha',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'gender',
        label: 'Género',
        type: 'select',
        placeholder: 'Seleccione el género',
        options: [
          { label: 'Macho', value: 'male' },
          { label: 'Hembra', value: 'female' },
          { label: 'Desconocido', value: 'unknown' }
        ]
      },
      {
        key: 'color',
        label: 'Color',
        type: 'input',
        placeholder: 'Color de la mascota',
        validation: { maxLength: 100 }
      },
      {
        key: 'weight',
        label: 'Peso',
        type: 'number',
        placeholder: 'Peso',
        validation: { min: 0.1, max: 200 }
      },
      {
        key: 'weightUnit',
        label: 'Unidad de Peso',
        type: 'select',
        placeholder: 'Seleccione la unidad',
        options: [
          { label: 'kg', value: 'kg' },
          { label: 'lb', value: 'lb' }
        ]
      },
      {
        key: 'bio',
        label: 'Biografía',
        type: 'textarea',
        placeholder: 'Información sobre la personalidad y características de tu mascota...',
        rows: 3,
        validation: { maxLength: 500 }
      },
      {
        key: 'photos',
        label: 'Fotos',
        type: 'file',
        placeholder: 'Selecciona fotos de tu mascota',
        accept: 'image/*',
        maxFileSize: 5000000,
        multiple: true
      }
    ]
  };

  constructor(
    private router: Router,
    private petService: PetService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  handleSubmit(data: any) {
    const user = this.authService.user();
    const ownerId = user?.id || '';

    // Extract uploaded files from the photos field
    const photos = data.photos || [];
    const imageFiles: File[] = photos
      .filter((f: any) => f.originalFile instanceof File)
      .map((f: any) => f.originalFile as File);

    const imageFile: File | undefined = imageFiles[0];

    // Build the CreatePetRequest
    const request: CreatePetRequest = {
      name: data.name,
      species: data.species,
      breed: data.breed || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      gender: data.gender || undefined,
      color: data.color || null,
      microchipId: data.microchipId || null
    };

    // Call the backend service to create the pet
    this.petService.createPet(request, imageFile, imageFiles, ownerId).subscribe({
      next: (pet) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Mascota creada',
          detail: `La mascota "${pet.name}" ha sido creada correctamente`
        });
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        console.error('Error creating pet:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la mascota. Inténtalo de nuevo.'
        });
      }
    });
  }

  handleCancel() {
    this.router.navigate(['/profile']);
  }
}
