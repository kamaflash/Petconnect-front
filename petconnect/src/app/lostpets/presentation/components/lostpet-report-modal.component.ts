import { Component, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { TranslocoService } from '@jsverse/transloco';
import { ModalComponent } from '../../../shared/presentation/components/modal/modal';
import { DynamicFormComponent, DynamicFormConfig, UploadedFile } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { SPECIES_BREEDS } from '../../../pets/domain/species-breeds.model';
import { GeocodingResult } from '../../../shared/services/geolocation.service';
import { CreateLostPetReport, LostPetsService, LostPetReport } from '../../infrastructure/services/lost-pets.service';
@Component({
  selector: 'app-lostpet-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DialogModule, ModalComponent, DynamicFormComponent],
  template: `
    @if (reportFormConfig()) {
      <app-modal
        [visible]="true"
        [header]="reportHeader"
        size="large"
        [showConfirm]="false"
        [showCancel]="false"
        [hideFooter]="true"
        (onHide)="cancel.emit()"
      >
        <div class="lostpet-report-modal">
          <!-- Ubicación se captura dentro del dynamic-form (campo 'location') -->
          <app-dynamic-form
            [config]="reportFormConfig()!"
            [formData]="formData()"
            (onSubmitClick)="onDynamicFormSubmit($event)"
            (onLocationPicked)="onLocationPicked($event)"
            (cancel)="cancel.emit()"
          />
        </div>
      </app-modal>
    }
  `,
  styles: [`:host{display:block}.lostpet-report-modal{max-width:900px}`],
})
export class LostPetReportModalComponent {
  private readonly lostPetsService = inject(LostPetsService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(TranslocoService);
  readonly editable = input<LostPetReport | null>(null);
  readonly submit = output<{ payload: CreateLostPetReport; files: UploadedFile[] }>();
  readonly cancel = output<void>();
  readonly locationResult = signal<GeocodingResult | null>(null);
  readonly formData = model<Record<string, unknown>>({});
  readonly reportFormConfig = signal<DynamicFormConfig | null>(null);
  private readonly SPECIES = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'HAMSTER', 'GUINEA_PIG', 'TURTLE', 'FISH', 'SNAKE', 'LIZARD', 'HORSE', 'OTHER'];
  ngOnInit(): void {
    const opts = this.SPECIES.map(v => ({ label: this.speciesLabel(v), value: v }));
    this.reportFormConfig.set({
      fields: [
        { key: 'petName', label: this.i18n.translate('common.pet'), type: 'input', validation: { required: true } },
        { key: 'species', label: this.i18n.translate('common.species'), type: 'select', options: opts, validation: { required: true } },
        { key: 'breed', label: this.i18n.translate('common.breed'), type: 'select', dependsOn: 'species' },
        { key: 'color', label: this.i18n.translate('common.color'), type: 'input' },
        { key: 'lostDate', label: this.i18n.translate('lostPets.lostDate'), type: 'date', validation: { required: true } },
        { key: 'location', label: this.i18n.translate('common.location'), type: 'location', validation: { required: true } },
        { key: 'description', label: this.i18n.translate('common.description'), type: 'textarea', rows: 3, validation: { required: true, maxLength: 500 } },
        { key: 'rewardAmount', label: this.i18n.translate('lostPets.reward'), type: 'number', validation: { min: 0 } },
        { key: 'images', label: this.i18n.translate('form.images'), type: 'file', multiple: true, accept: 'image/*', maxFileSize: 5_000_000 },
      ],
      title: this.editable() ? this.i18n.translate('lostPets.editTitle') : this.i18n.translate('lostPets.reportTitle'),
      submitLabel: this.i18n.translate('common.save'),
      showSubmit: true,
      columns: 2,
      showCancel: true,
      resolveOptions: (field, sourceValue) => {
        const key = String(sourceValue).toLowerCase();
        return SPECIES_BREEDS[key] ?? [];
      },
    });
    this.formData.set({
      petName: '',
      species: '',
      breed: '',
      color: '',
      lostDate: new Date().toISOString().slice(0, 10),
      location: null,
      description: '',
      rewardAmount: null,
      images: [] as UploadedFile[],
    });
  }
  get reportHeader(): string {
    return this.editable() ? this.i18n.translate('lostPets.editTitle') : this.i18n.translate('lostPets.reportTitle');
  }
  private speciesLabel(value: string): string {
    const key = `common.${value.toLowerCase()}`;
    const translated = this.i18n.translate(key);
    return translated === key ? value : translated;
  }
  onLocationPicked(result: GeocodingResult): void {
    this.locationResult.set(result);
  }
  private mapFieldsToPayload(values: Record<string, unknown>): CreateLostPetReport {
    const loc = this.locationResult();
    const latitude = loc === null ? null : loc.lat ?? null;
    const longitude = loc === null ? null : loc.lon ?? null;
    return {
      petId: null,
      petName: String(values['petName'] ?? ''),
      species: String(values['species'] ?? ''),
      breed: String(values['breed'] ?? '') || null,
      color: String(values['color'] ?? '') || null,
      description: String(values['description'] ?? '') || null,
      lostDate: this.toIsoDate(values['lostDate']),
      lastSeenArea: loc?.displayName ?? '',
      latitude,
      longitude,
      rewardAmount: values['rewardAmount'] == null ? null : Number(values['rewardAmount']),
      status: 'LOST',
    };
  }
  private toIsoDate(value: unknown): string {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === 'string' && value.length >= 10) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
  }
  private mapFiles(values: Record<string, unknown>): UploadedFile[] {
    const files = values['files'];
    if (files && typeof files === 'object') {
      const map = files as Record<string, unknown>;
      const images = map['images'];
      if (Array.isArray(images)) return images as UploadedFile[];
    }
    return [];
  }
  onDynamicFormSubmit(values: Record<string, unknown>): void {
    const payload = this.mapFieldsToPayload(values);
    const files = this.mapFiles(values);
    const editing = this.editable();
    const request = editing ? this.lostPetsService.update(editing.id, payload) : this.lostPetsService.create(payload);
    request.subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.i18n.translate('common.success'), detail: this.i18n.translate(editing ? 'lostPets.updatedDetail' : 'lostPets.createdDetail') });
        this.submit.emit({ payload, files });
      },
      error: () => {
        this.messages.add({ severity: 'error', summary: this.i18n.translate('lostPets.errorTitle'), detail: this.i18n.translate('lostPets.saveError') });
      },
    });
  }
}
