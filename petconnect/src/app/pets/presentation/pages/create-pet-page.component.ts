import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';

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
        validation: { required: true, minLength: 2, maxLength: 50 }
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
        validation: { required: true }
      },
      {
        key: 'birthDate',
        label: 'Fecha de Nacimiento',
        type: 'date',
        placeholder: 'Seleccione la fecha',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'weight',
        label: 'Peso (kg)',
        type: 'number',
        placeholder: 'Peso en kilogramos',
        validation: { min: 0.1, max: 200 }
      },
      {
        key: 'gender',
        label: 'Género',
        type: 'radio',
        options: [
          { label: 'Macho', value: 'male' },
          { label: 'Hembra', value: 'female' }
        ]
      },
      {
        key: 'vaccinationsUpToDate',
        label: 'Vacunas al día',
        type: 'checkbox'
      },
    {
        key: 'notes',
        label: 'Notas',
        type: 'textarea',
        placeholder: 'Información adicional sobre la mascota...',
        rows: 4
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

  constructor(private router: Router) {}

  handleSubmit(data: any) {
    console.log('Nueva mascota creada:', data);
    // Aquí se enviaría a un servicio
    // Por ahora, simulamos éxito y volvemos al perfil
    this.router.navigate(['/profile']);
  }

  handleCancel() {
    this.router.navigate(['/profile']);
  }
}
