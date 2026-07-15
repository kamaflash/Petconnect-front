# Dynamic Form Component

Un formulario dinámico reutilizable basado en PrimeNG que permite crear formularios desde cualquier parte de la aplicación instanciando la configuración desde el componente padre.

## Características

- **Tipos de campos soportados**: input, password, number, date, select, textarea, checkbox, radio
- **Validaciones**: required, minLength, maxLength, min, max, email, pattern, customMessage
- **Two-way binding**: Soporte para `model()` de Angular para enlace bidireccional
- **Responsive**: Adaptable a diferentes tamaños de pantalla
- **Temas**: Soporte para modo claro y oscuro

## Instalación

El componente ya está exportado desde `@app/shared`. Solo necesitas importarlo:

```typescript
import { DynamicFormComponent, DynamicFormConfig, DynamicFormField } from '@app/shared';
```

## Uso Básico

### 1. Configuración del formulario

```typescript
import { Component } from '@angular/core';
import { DynamicFormComponent, DynamicFormConfig, DynamicFormField } from '@app/shared';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [DynamicFormComponent],
  template: `
    <app-dynamic-form
      [config]="formConfig"
      [(formData)]="formData"
      (onSubmitClick)="handleSubmit($event)"
      (onCancel)="handleCancel()"
    />
  `
})
export class ExampleComponent {
  formConfig: DynamicFormConfig = {
    title: 'Crear Usuario',
    submitLabel: 'Guardar Usuario',
    showCancel: true,
    fields: [
      {
        key: 'name',
        label: 'Nombre',
        type: 'input',
        placeholder: 'Ingrese su nombre',
        validation: { required: true, minLength: 2, maxLength: 50 }
      },
      {
        key: 'email',
        label: 'Email',
        type: 'input',
        placeholder: 'correo@ejemplo.com',
        validation: { required: true, email: true }
      },
      {
        key: 'age',
        label: 'Edad',
        type: 'number',
        validation: { required: true, min: 18, max: 100 }
      },
      {
        key: 'birthDate',
        label: 'Fecha de Nacimiento',
        type: 'date',
        placeholder: 'Seleccione una fecha',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'gender',
        label: 'Género',
        type: 'radio',
        options: [
          { label: 'Masculino', value: 'male' },
          { label: 'Femenino', value: 'female' },
          { label: 'Otro', value: 'other' }
        ]
      },
      {
        key: 'country',
        label: 'País',
        type: 'select',
        placeholder: 'Seleccione un país',
        options: [
          { label: 'España', value: 'es' },
          { label: 'México', value: 'mx' },
          { label: 'Argentina', value: 'ar' }
        ],
        showClear: true
      },
      {
        key: 'bio',
        label: 'Biografía',
        type: 'textarea',
        placeholder: 'Cuéntanos sobre ti...',
        rows: 4
      },
      {
        key: 'acceptTerms',
        label: 'Acepto los términos y condiciones',
        type: 'checkbox',
        validation: { required: true }
      }
    ]
  };

  formData: any = {};

  handleSubmit(data: any) {
    console.log('Datos del formulario:', data);
    // Aquí puedes enviar los datos a un servicio
  }

  handleCancel() {
    console.log('Formulario cancelado');
  }
}
```

## API

### DynamicFormConfig

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `fields` | `DynamicFormField[]` | Array de campos del formulario (requerido) |
| `title` | `string` | Título del formulario |
| `submitLabel` | `string` | Texto del botón de envío (default: 'Guardar') |
| `cancelLabel` | `string` | Texto del botón de cancelar (default: 'Cancelar') |
| `showCancel` | `boolean` | Mostrar botón de cancelar (default: false) |

### DynamicFormField

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `key` | `string` | Nombre del campo (requerido) |
| `label` | `string` | Etiqueta del campo (requerido) |
| `type` | `FormFieldType` | Tipo de campo (requerido) |
| `placeholder` | `string` | Placeholder del campo |
| `options` | `FormFieldOption[]` | Opciones para select y radio |
| `validation` | `FormFieldValidation` | Reglas de validación |
| `defaultValue` | `any` | Valor por defecto |
| `showClear` | `boolean` | Mostrar botón limpiar (select) |
| `disabled` | `boolean` | Deshabilitar campo |
| `rows` | `number` | Filas para textarea |
| `cols` | `number` | Columnas para textarea |
| `dateFormat` | `string` | Formato de fecha (default: 'dd/mm/yy') |
| `showIcon` | `boolean` | Mostrar icono calendario (date) |
| `mode` | `'single' \| 'multiple' \| 'range'` | Modo de selección de fecha |
| `accept` | `string` | Tipos de archivo aceptados (file, default: 'image/*') |
| `maxFileSize` | `number` | Tamaño máximo en bytes (file, default: 1000000) |
| `multiple` | `boolean` | Permitir múltiples archivos (file, default: true) |

### FormFieldValidation

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `required` | `boolean` | Campo requerido |
| `minLength` | `number` | Longitud mínima |
| `maxLength` | `number` | Longitud máxima |
| `min` | `number` | Valor mínimo (number) |
| `max` | `number` | Valor máximo (number) |
| `email` | `boolean` | Validación de email |
| `pattern` | `string` | Patrón regex |
| `customMessage` | `string` | Mensaje de error personalizado |

### Outputs

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `onSubmitClick` | `any` | Emitido al enviar el formulario con los datos |
| `onCancel` | `void` | Emitido al cancelar el formulario |

### Métodos públicos

| Método | Parámetros | Descripción |
|--------|------------|-------------|
| `resetForm()` | - | Resetea el formulario a valores por defecto |
| `setFormData(data: any)` | `data` | Establece valores en el formulario |
| `getFormValue()` | - | Obtiene los valores actuales del formulario |
| `isValid()` | - | Verifica si el formulario es válido |

## Ejemplo: Formulario de edición

```typescript
export class EditUserComponent {
  userId: string = '123';
  formData: any = {
    name: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    age: 25,
    country: 'es'
  };

  formConfig: DynamicFormConfig = {
    title: 'Editar Usuario',
    submitLabel: 'Actualizar',
    showCancel: true,
    fields: [
      {
        key: 'name',
        label: 'Nombre',
        type: 'input',
        validation: { required: true }
      },
      {
        key: 'email',
        label: 'Email',
        type: 'input',
        validation: { required: true, email: true }
      },
      {
        key: 'age',
        label: 'Edad',
        type: 'number',
        validation: { min: 0, max: 120 }
      },
      {
        key: 'country',
        label: 'País',
        type: 'select',
        options: [
          { label: 'España', value: 'es' },
          { label: 'México', value: 'mx' }
        ]
      }
    ]
  };

  constructor(private userService: UserService) {}

  ngOnInit() {
    // Cargar datos existentes
    this.userService.getUser(this.userId).subscribe(user => {
      this.formData = user;
    });
  }

  handleSubmit(data: any) {
    this.userService.updateUser(this.userId, data).subscribe(() => {
      // Manejar respuesta
    });
  }
}
```

## Ejemplo: Formulario con validación personalizada

```typescript
formConfig: DynamicFormConfig = {
  title: 'Registro',
  fields: [
    {
      key: 'username',
      label: 'Usuario',
      type: 'input',
      placeholder: 'Nombre de usuario',
      validation: {
        required: true,
        minLength: 3,
        maxLength: 20,
        pattern: '^[a-zA-Z0-9_]+$',
        customMessage: 'El usuario solo puede contener letras, números y guiones bajos'
      }
    },
    {
      key: 'phone',
      label: 'Teléfono',
      type: 'input',
      placeholder: '+34 600 000 000',
      validation: {
        pattern: '^\\+?[0-9]{10,15}$',
        customMessage: 'Ingrese un número de teléfono válido'
      }
    }
  ]
};
```

## Notas

- El formulario usa Angular Signals y el nuevo sistema de reactividad
- Los campos son renderizados en un grid responsive (auto-fit, minmax 250px)
- El textarea ocupa todo el ancho del contenedor
- Los errores de validación se muestran automáticamente bajo cada campo
- El botón de envío se deshabilita cuando el formulario es inválido
