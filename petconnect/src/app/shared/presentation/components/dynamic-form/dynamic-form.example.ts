import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { DynamicFormComponent, DynamicFormConfig } from './dynamic-form.component';

@Component({
  selector: 'app-dynamic-form-example',
  standalone: true,
  imports: [DynamicFormComponent, JsonPipe],
  template: `
    <div class="example-container">
      <h1>Ejemplo de Formulario Dinámico</h1>

      <app-dynamic-form
        [config]="formConfig"
        [(formData)]="formData"
        (onSubmitClick)="handleSubmit($event)"
        (onCancel)="handleCancel()"
      />

      @if (submittedData) {
        <div class="result-card">
          <h3>Datos enviados:</h3>
          <pre>{{ submittedData | json }}</pre>
        </div>
      }
    </div>
  `,
  styles: [`
    .example-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    h1 {
      color: var(--bitbucket-text-primary);
      margin-bottom: 1.5rem;
    }

    .result-card {
      margin-top: 2rem;
      padding: 1rem;
      background-color: var(--bitbucket-header-bg);
      border-radius: 8px;
      border: 1px solid var(--bitbucket-border);
    }

    .result-card h3 {
      color: var(--bitbucket-text-primary);
      margin-top: 0;
    }

    pre {
      background-color: var(--bitbucket-bg-hover);
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
    }
  `]
})
export class DynamicFormExampleComponent {
  formConfig: DynamicFormConfig = {
    title: 'Crear Mascota',
    submitLabel: 'Guardar Mascota',
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
          { label: 'Conejo', value: 'rabbit' }
        ],
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
        validation: { required: true, min: 0.1, max: 200 }
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
        key: 'vaccinations',
        label: 'Vacunas al día',
        type: 'checkbox'
      },
      {
        key: 'notes',
        label: 'Notas',
        type: 'textarea',
        placeholder: 'Información adicional sobre la mascota...',
        rows: 4
      }
    ]
  };

  formData: any = {};
  submittedData: any = null;

  handleSubmit(data: any) {
    console.log('Formulario enviado:', data);
    this.submittedData = data;
  }

  handleCancel() {
    console.log('Formulario cancelado');
    this.formData = {};
    this.submittedData = null;
  }
}
