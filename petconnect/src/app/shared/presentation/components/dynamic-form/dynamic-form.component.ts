import { Component, input, output, signal, model, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, ValidatorFn, AbstractControl, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { FluidModule } from 'primeng/fluid';
import { FileUploadModule, FileSelectEvent, FileUploadEvent } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';

// Tipos de campo soportado
export type FormFieldType = 'input' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'password' | 'file';

// Interfaz para opciones de select y radio
export interface FormFieldOption {
  label: string;
  value: any;
  disabled?: boolean;
}

// Interfaz para validaciones
export interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  email?: boolean;
  pattern?: string;
  customMessage?: string;
}

// Interfaz para archivo subido
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  objectURL: string;
  originalFile?: File;
}

// Interfaz para archivo con progreso
export interface FileWithProgress {
  file: UploadedFile;
  progress: number;
  uploading: boolean;
}

// Interfaz para configuración de campo
export interface DynamicFormField {
  key: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  defaultValue?: any;
  showClear?: boolean;
  disabled?: boolean;
  rows?: number;
  cols?: number;
  dateFormat?: string;
  showIcon?: boolean;
  mode?: 'single' | 'multiple' | 'range';
  accept?: string;
  maxFileSize?: number;
  multiple?: boolean;
  uploadUrl?: string;
}

// Interfaz para configuración del formulario
export interface DynamicFormConfig {
  fields: DynamicFormField[];
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
}

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    DatePickerModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    CheckboxModule,
    RadioButtonModule,
    ButtonModule,
    FluidModule,
    FileUploadModule,
    ProgressBarModule,
    BadgeModule
  ],
  template: `
    <div class="dynamic-form-container">
      @if (config().title) {
        <div class="form-header">
          <h2 class="form-title">{{ config().title }}</h2>
        </div>
      }

      <form [formGroup]="form()" (ngSubmit)="onSubmit()" class="dynamic-form">
        <div class="form-fields">
          @for (field of config().fields; track field.key) {
            <div class="form-field" [class.field-full-width]="field.type === 'textarea' || field.type === 'file'">
              <label [for]="field.key" class="field-label">
                {{ field.label }}
                @if (field.validation?.required) {
                  <span class="required-indicator">*</span>
                }
              </label>

              @switch (field.type) {
                @case ('input') {
                  <input
                    pInputText
                    [id]="field.key"
                    [formControlName]="field.key"
                    [placeholder]="field.placeholder || ''"
                    [disabled]="field.disabled || false"
                    [class.ng-invalid]="isFieldInvalid(field.key)"
                    [class.ng-dirty]="isFieldDirty(field.key)"
                    class="w-full"
                  />
                }
                @case ('password') {
                  <input
                    pInputText
                    [id]="field.key"
                    type="password"
                    [formControlName]="field.key"
                    [placeholder]="field.placeholder || ''"
                    [disabled]="field.disabled || false"
                    [class.ng-invalid]="isFieldInvalid(field.key)"
                    [class.ng-dirty]="isFieldDirty(field.key)"
                    class="w-full"
                  />
                }
                @case ('number') {
                  <p-inputNumber
                    [id]="field.key"
                    [formControlName]="field.key"
                    [placeholder]="field.placeholder || ''"
                    [disabled]="field.disabled || false"
                    [class.ng-invalid]="isFieldInvalid(field.key)"
                    [class.ng-dirty]="isFieldDirty(field.key)"
                    styleClass="w-full"
                    [showButtons]="true"
                    [min]="field.validation?.min"
                    [max]="field.validation?.max"
                  />
                }
                @case ('date') {
                  <p-datepicker
                    [id]="field.key"
                    [formControlName]="field.key"
                    [placeholder]="field.placeholder || ''"
                    [disabled]="field.disabled || false"
                    [showIcon]="field.showIcon ?? true"
                    [dateFormat]="field.dateFormat || 'dd/mm/yy'"
                    [selectionMode]="field.mode || 'single'"
                    styleClass="w-full"
                    [class.ng-invalid]="isFieldInvalid(field.key)"
                    [class.ng-dirty]="isFieldDirty(field.key)"
                  />
                }
                @case ('select') {
                  <p-select
                    [id]="field.key"
                    [formControlName]="field.key"
                    [options]="field.options || []"
                    [placeholder]="field.placeholder || 'Seleccionar'"
                    [disabled]="field.disabled || false"
                    [showClear]="field.showClear ?? true"
                    [class.ng-invalid]="isFieldInvalid(field.key)"
                    [class.ng-dirty]="isFieldDirty(field.key)"
                    styleClass="w-full"
                    appendTo="body"
                  />
                }
                @case ('textarea') {
                  <textarea
                    pTextarea
                    [id]="field.key"
                    [formControlName]="field.key"
                    [placeholder]="field.placeholder || ''"
                    [disabled]="field.disabled || false"
                    [rows]="field.rows || 5"
                    [cols]="field.cols || 30"
                    [class.ng-invalid]="isFieldInvalid(field.key)"
                    [class.ng-dirty]="isFieldDirty(field.key)"
                    class="w-full"
                  ></textarea>
                }
                @case ('checkbox') {
                  <div class="checkbox-wrapper">
                    <p-checkbox
                      [id]="field.key"
                      [formControlName]="field.key"
                      [binary]="true"
                      [disabled]="field.disabled || false"
                      [class.ng-invalid]="isFieldInvalid(field.key)"
                      [class.ng-dirty]="isFieldDirty(field.key)"
                    />
                  </div>
                }
                @case ('radio') {
                  <div class="radio-group">
                    @for (option of field.options; track option.value) {
                      <div class="radio-option">
                        <label [for]="field.key + '-' + option.value" class="radio-label">
                          <p-radioButton
                            [id]="field.key + '-' + option.value"
                            [formControlName]="field.key"
                            [value]="option.value"
                            [disabled]="option.disabled || field.disabled || false"
                          />
                          <span class="radio-text">{{ option.label }}</span>
                        </label>
                      </div>
                    }
                  </div>
                }
                @case ('file') {
                  <p-fileUpload
                    #fileUpload
                    [id]="field.key"
                    [name]="field.key"
                    [accept]="field.accept || 'image/*'"
                    [maxFileSize]="field.maxFileSize || 1000000"
                    [multiple]="field.multiple ?? true"
                    [disabled]="field.disabled || false"
                    (onSelect)="onFileSelect($event, field)"
                    (onRemove)="onFileRemove($event, field)"
                    (onUpload)="onFileUpload($event, field)"
                    (onProgress)="onUploadProgress($event, field)"
                    [showUploadButton]="false"
                    [showCancelButton]="false"
                    mode="advanced"
                    [auto]="false"
                  >
                    <ng-template pTemplate="header" let-files let-chooseCallback="chooseCallback">
                      <div class="file-upload-header">
                        <div class="flex flex-wrap justify-content-between align-items-center flex-1 gap-2">
                          <div class="flex gap-2">
                            <p-button
                              type="button"
                              icon="pi pi-images"
                              [rounded]="true"
                              [outlined]="true"
                              (onClick)="choose($event, chooseCallback)"
                              pTooltip="Seleccionar archivos"
                              tooltipPosition="top"
                            />
                          </div>
                          <p-progressBar
                            [value]="getUploadProgress(field.key)"
                            [showValue]="false"
                            styleClass="md:w-20rem h-1rem w-full md:ml-auto"
                            [class.uploading-progress-bar]="isUploading(field.key)"
                          >
                            <span class="white-space-nowrap">
                              @if (isUploading(field.key)) {
                                Subiendo... {{ getUploadProgress(field.key) }}%
                              } @else {
                                {{ getTotalSize(field.key) }}B / {{ (field.maxFileSize || 1000000) | number }}B
                              }
                            </span>
                          </p-progressBar>
                        </div>
                      </div>
                    </ng-template>
                    <ng-template pTemplate="content" let-files>
                      @if (getFilesWithProgress(field.key)?.length > 0) {
                        <div class="pending-files">
                          <h5 class="pending-files-title pl-3">Imágenes seleccionadas</h5>
                          <div class="flex flex-wrap p-0 sm:p-5 gap-5">
                            @for (fileItem of getFilesWithProgress(field.key); track $index) {
                              <div class="image-card">
                                <div class="image-container">
                                  <img role="presentation" [alt]="fileItem.file.name" [src]="fileItem.file.objectURL" class="image-background" />
                                  <i class="pi pi-times remove-icon" (click)="removeFile(fileItem.file, field)"></i>
                                  <div class="image-info">
                                    <span class="image-name">{{ fileItem.file.name }}</span>
                                    <span class="image-size">{{ formatSize(fileItem.file.size) }}</span>
                                  </div>
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      } @else {
                        <div class="flex align-items-center justify-content-center flex-column">
                          <i class="pi pi-cloud-upload border-2 border-circle p-5 text-8xl text-400 border-400"></i>
                          <p class="mt-4 mb-0">{{ field.placeholder || 'Arrastra imágenes aquí para subir' }}</p>
                        </div>
                      }
                    </ng-template>
                    <ng-template pTemplate="empty">
                      <div></div>
                    </ng-template>
                  </p-fileUpload>
                }
              }

              @if (isFieldInvalid(field.key)) {
                <small class="error-message">
                  {{ getFieldErrorMessage(field) }}
                </small>
              }
            </div>
          }
        </div>

        <div class="form-actions">
          @if (config().showCancel) {
            <p-button
              [label]="config().cancelLabel || 'Cancelar'"
              icon="pi pi-times"
              severity="secondary"
              [text]="true"
              (onClick)="onCancel.emit()"
              type="button"
            />
          }
          <p-button
            [label]="config().submitLabel || 'Guardar'"
            icon="pi pi-check"
            [disabled]="form().invalid"
            type="submit"
          />
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dynamic-form-container {
      width: 100%;
      background-color: var(--bitbucket-header-bg);
      border-radius: 8px;
      overflow: hidden;
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .dark .dynamic-form-container {
      background-color: var(--bitbucket-header-bg);
      border-color: var(--bitbucket-border);
    }

    .form-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--bitbucket-border);
      transition: border-color 0.3s ease;
    }

    .dark .form-header {
      border-bottom-color: var(--bitbucket-border);
    }

    .form-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 0;
    }

    .dynamic-form {
      padding: 1.5rem;
    }

    .form-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.25rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-full-width {
      grid-column: 1 / -1;
    }

    .field-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--bitbucket-text-primary);
    }

    .required-indicator {
      color: var(--primary-color);
      margin-left: 0.25rem;
    }

    .checkbox-wrapper {
      padding: 0.5rem 0;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.25rem 0;
    }

    .radio-option {
      display: flex;
      align-items: center;
    }

    .radio-label {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .radio-text {
      margin-left: 0.5rem;
      color: var(--bitbucket-text-primary);
      font-size: 0.875rem;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--bitbucket-border);
    }

    .dark .form-actions {
      border-top-color: var(--bitbucket-border);
    }

    .file-upload-header {
      padding: 0.5rem 0;
    }

    .pending-files {
      margin-top: 1rem;
    }

    .pending-files-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 1rem 0 0.5rem 0;
    }

    .image-card {
      position: relative;
      width: 150px;
      height: 150px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .image-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .image-container {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .image-background {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .remove-icon {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      color: white;
      font-size: 1rem;
      cursor: pointer;
      background: rgba(0, 0, 0, 0.3);
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .remove-icon:hover {
      color: #ef4444;
      background: rgba(0, 0, 0, 0.5);
    }

    .image-info {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      padding: 1rem 0.5rem 0.5rem;
      color: white;
    }

    .image-name {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .image-size {
      display: block;
      font-size: 0.625rem;
      opacity: 0.9;
    }

    .pending-files h5 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 0.5rem 0;
    }

    :host ::ng-deep .p-fileupload {
      width: 100%;
    }

    :host ::ng-deep .p-fileupload-content {
      padding: 0;
    }

    :host ::ng-deep .p-button {
      transition: all 0.2s ease;
    }

    :host ::ng-deep .p-button.p-disabled {
      opacity: 0.6;
    }

    :host ::ng-deep .uploading-progress-bar {
      background-color: #e0e7ff;
    }

    @media (max-width: 768px) {
      .form-fields {
        grid-template-columns: 1fr;
      }

      .dynamic-form {
        padding: 1rem;
      }

      .form-header {
        padding: 1rem;
      }
    }

    @media (max-width: 480px) {
      .form-actions {
        flex-direction: column-reverse;
      }

      :host ::ng-deep .p-button {
        width: 100%;
      }
    }
  `]
})
export class DynamicFormComponent implements OnInit {
  // Input para la configuración del formulario
  config = input<DynamicFormConfig>({ fields: [] });

  // Model para los datos del formulario (two-way binding)
  formData = model<any>({});

  // Outputs
  onSubmitClick = output<any>();
  onCancel = output<void>();

  // Señal para el formulario reactivo
  form = signal<FormGroup>(new FormGroup({}));

  // Señal para archivos subidos
  uploadedFiles = signal<Record<string, UploadedFile[]>>({});

  // Señal para el progreso de upload por campo
  uploadProgress = signal<Record<string, number>>({});

  // Señal para archivos con progreso individual
  filesWithProgress = signal<Record<string, FileWithProgress[]>>({});

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
  }

  // Método para el botón choose
  choose(event: MouseEvent, chooseCallback: () => void): void {
    chooseCallback();
  }

  // Construye el formulario basado en la configuración
  private buildForm(): void {
    const formControls: { [key: string]: AbstractControl } = {};
    const fields = this.config().fields;

    fields.forEach((field: DynamicFormField) => {
      const validators: ValidatorFn[] = [];

      if (field.validation) {
        if (field.validation.required) {
          validators.push(Validators.required);
        }
        if (field.validation.minLength !== undefined) {
          validators.push(Validators.minLength(field.validation.minLength));
        }
        if (field.validation.maxLength !== undefined) {
          validators.push(Validators.maxLength(field.validation.maxLength));
        }
        if (field.validation.email) {
          validators.push(Validators.email);
        }
        if (field.validation.pattern) {
          validators.push(Validators.pattern(field.validation.pattern));
        }
        if (field.validation.min !== undefined && field.type === 'number') {
          validators.push(Validators.min(field.validation.min));
        }
        if (field.validation.max !== undefined && field.type === 'number') {
          validators.push(Validators.max(field.validation.max));
        }
      }

      // Establecer valor por defecto o valor del modelo
      const defaultValue = this.formData()[field.key] ?? field.defaultValue ?? this.getDefaultValueForType(field.type);

      formControls[field.key] = this.fb.control(defaultValue, validators);
    });

    this.form.set(this.fb.group(formControls));
  }

  // Obtiene el valor por defecto según el tipo de campo
  private getDefaultValueForType(type: FormFieldType): any {
    switch (type) {
      case 'checkbox':
        return false;
      case 'number':
        return null;
      case 'date':
        return null;
      default:
        return '';
    }
  }

  // Maneja el envío del formulario
  onSubmit(): void {
    if (this.form().valid) {
      // Incluir archivos subidos en el evento
      const formValue = {
        ...this.form().value,
        files: this.uploadedFiles()
      };
      this.onSubmitClick.emit(formValue);
    } else {
      this.form().markAllAsTouched();
    }
  }

  // Verifica si un campo es inválido
  isFieldInvalid(key: string): boolean {
    const control = this.form().get(key);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  // Verifica si un campo ha sido modificado
  isFieldDirty(key: string): boolean {
    const control = this.form().get(key);
    return control ? control.dirty : false;
  }

  // Obtiene el mensaje de error para un campo
  getFieldErrorMessage(field: DynamicFormField): string {
    const control = this.form().get(field.key);
    if (!control || !control.errors) return '';

    if (field.validation?.customMessage) {
      return field.validation.customMessage;
    }

    if (control.errors['required']) {
      return `${field.label} es requerido`;
    }
    if (control.errors['minlength']) {
      return `${field.label} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
    }
    if (control.errors['maxlength']) {
      return `${field.label} debe tener máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    }
    if (control.errors['email']) {
      return 'Ingrese un email válido';
    }
    if (control.errors['pattern']) {
      return `${field.label} tiene un formato inválido`;
    }
    if (control.errors['min']) {
      return `${field.label} debe ser mayor o igual a ${control.errors['min'].min}`;
    }
    if (control.errors['max']) {
      return `${field.label} debe ser menor o igual a ${control.errors['max'].max}`;
    }

    return 'Valor inválido';
  }

  // Manejar selección de archivos
  onFileSelect(event: FileSelectEvent, field: DynamicFormField): void {
    const files: File[] = Array.from(event.files);
    const currentFiles = this.uploadedFiles()[field.key] || [];
    const currentFilesWithProgress = this.filesWithProgress()[field.key] || [];

    // Reiniciar progreso del campo para nuevas selecciones
    this.uploadProgress.update(progressMap => ({
      ...progressMap,
      [field.key]: 0
    }));

    files.forEach((file: File) => {
      const objectURL = URL.createObjectURL(file);
      const newFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        objectURL: objectURL,
        originalFile: file
      };

      const updatedFiles = [...currentFiles, newFile];
      this.uploadedFiles.update(files => ({
        ...files,
        [field.key]: updatedFiles
      }));

      // Inicializar progreso del archivo con simulación
      const fileWithProgress: FileWithProgress = {
        file: newFile,
        progress: 0,
        uploading: true
      };

      this.filesWithProgress.update(fwp => ({
        ...fwp,
        [field.key]: [...currentFilesWithProgress, fileWithProgress]
      }));

      // Simular progreso de carga
      this.simulateUploadProgress(field.key, newFile, files.length);
    });

    // Actualizar el formulario con los archivos
    this.form().get(field.key)?.setValue(this.uploadedFiles()[field.key]);
  }

  // Simular progreso de upload (ya que no hay endpoint real)
  private simulateUploadProgress(key: string, file: UploadedFile, totalFiles: number): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5; // Incremento aleatorio entre 5-15%

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }

      // Actualizar progreso total del campo
      this.uploadProgress.update(progressMap => ({
        ...progressMap,
        [key]: progress
      }));

      // Actualizar progreso individual del archivo
      this.filesWithProgress.update(fwp => {
        const updated = [...(fwp[key] || [])];
        const fileIndex = updated.findIndex(f => f.file.name === file.name);
        if (fileIndex !== -1) {
          updated[fileIndex] = {
            ...updated[fileIndex],
            progress: progress,
            uploading: progress < 100
          };
        }
        return {
          ...fwp,
          [key]: updated
        };
      });
    }, 100);
  }

  // Eliminar archivo desde el card
  removeFile(file: any, field: DynamicFormField): void {
    const removedFile = file;
    const currentFiles = this.uploadedFiles()[field.key] || [];
    const currentFilesWithProgress = this.filesWithProgress()[field.key] || [];

    // Remover de uploadedFiles
    const updatedFiles = currentFiles.filter(f => f.name !== removedFile.name);
    this.uploadedFiles.update(files => ({
      ...files,
      [field.key]: updatedFiles
    }));

    // Remover de filesWithProgress
    const updatedFilesWithProgress = currentFilesWithProgress.filter(f => f.file.name !== removedFile.name);
    this.filesWithProgress.update(fwp => ({
      ...fwp,
      [field.key]: updatedFilesWithProgress
    }));

    // Revocar objectURL
    if (removedFile.objectURL) {
      URL.revokeObjectURL(removedFile.objectURL);
    }

    // Actualizar el formulario
    this.form().get(field.key)?.setValue(updatedFiles);
  }

  // Eliminar archivo (evento del fileUpload)
  onFileRemove(event: any, field: DynamicFormField): void {
    const removedFile = event.file;
    const currentFiles = this.uploadedFiles()[field.key] || [];
    const currentFilesWithProgress = this.filesWithProgress()[field.key] || [];

    // Remover de uploadedFiles
    const updatedFiles = currentFiles.filter(f => f.name !== removedFile.name);
    this.uploadedFiles.update(files => ({
      ...files,
      [field.key]: updatedFiles
    }));

    // Remover de filesWithProgress
    const updatedFilesWithProgress = currentFilesWithProgress.filter(f => f.file.name !== removedFile.name);
    this.filesWithProgress.update(fwp => ({
      ...fwp,
      [field.key]: updatedFilesWithProgress
    }));

    // Revocar objectURL
    if (removedFile.objectURL) {
      URL.revokeObjectURL(removedFile.objectURL);
    }

    // Actualizar el formulario
    this.form().get(field.key)?.setValue(updatedFiles);
  }

  // Manejar upload de archivos
  onFileUpload(event: FileUploadEvent, field: DynamicFormField): void {
    // El upload se maneja automáticamente con onProgress
  }

  // Manejar progreso de upload
  onUploadProgress(event: any, field: DynamicFormField): void {
    const progress = event.progress;
    const file = event.file;

    // Actualizar progreso total del campo
    this.uploadProgress.update(progressMap => ({
      ...progressMap,
      [field.key]: progress
    }));

    // Actualizar progreso individual del archivo
    const currentFilesWithProgress = this.filesWithProgress()[field.key] || [];
    const fileIndex = currentFilesWithProgress.findIndex(f => f.file.name === file.name);

    if (fileIndex !== -1) {
      this.filesWithProgress.update(fwp => {
        const updated = [...currentFilesWithProgress];
        updated[fileIndex] = {
          ...updated[fileIndex],
          progress: progress,
          uploading: progress < 100
        };
        return {
          ...fwp,
          [field.key]: updated
        };
      });
    }
  }

  // Formatear tamaño de archivo
  formatSize(size: number): string {
    if (size < 1024) {
      return size + 'B';
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + 'KB';
    } else {
      return (size / (1024 * 1024)).toFixed(2) + 'MB';
    }
  }

  // Obtener tamaño total de archivos
  getTotalSize(key: string): number {
    const files = this.uploadedFiles()[key] || [];
    return files.reduce((total, file) => total + file.size, 0);
  }

  // Obtener progreso de upload
  getUploadProgress(key: string): number {
    return this.uploadProgress()[key] || 0;
  }

  // Verificar si hay upload en progreso
  isUploading(key: string): boolean {
    const progress = this.uploadProgress()[key] || 0;
    return progress > 0 && progress < 100;
  }

  // Obtener archivos con progreso
  getFilesWithProgress(key: string): FileWithProgress[] {
    return this.filesWithProgress()[key] || [];
  }

  // Método para resetear el formulario
  resetForm(): void {
    this.form().reset();
    // Limpiar objectURLs
    Object.values(this.uploadedFiles()).forEach(files => {
      files.forEach(file => {
        if (file.objectURL) {
          URL.revokeObjectURL(file.objectURL);
        }
      });
    });
    this.uploadedFiles.set({});
    this.uploadProgress.set({});
    this.filesWithProgress.set({});
    this.buildForm();
  }

  // Método para establecer valores del formulario
  setFormData(data: any): void {
    this.formData.set(data);
    this.form().patchValue(data);
  }

  // Método para obtener el formulario completo
  getFormValue(): any {
    return this.form().value;
  }

  // Método para verificar si el formulario es válido
  isValid(): boolean {
    return this.form().valid;
  }
}
