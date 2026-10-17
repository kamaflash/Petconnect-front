import { Component, inject, model, output, signal } from '@angular/core';
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
import { CreateLostPetReport, LostPetsService } from '../../infrastructure/services/lost-pets.service';

@Component({
  selector: 'app-lostpet-sighting-modal',
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
        <div class="lostpet-sighting-modal">
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
  styles: [`:host{display:block}.lostpet-sighting-modal{max-width:900px}`],
})
export class LostPetSightingModalComponent {
  private readonly lostPetsService = inject(LostPetsService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(TranslocoService);

  readonly cancel = output<void>();
  readonly submit = output<{ payload: CreateLostPetReport; files: UploadedFile[] }>();

  readonly locationResult = signal<GeocodingResult | null>(null);
  readonly formData = model<Record<string, unknown>>({});
  readonly reportFormConfig = signal<DynamicFormConfig | null>(null);

  private readonly SPECIES = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'HAMSTER', 'GUINEA_PIG', 'TURTLE', 'FISH', 'SNAKE', 'LIZARD', 'HORSE', 'OTHER'];

  ngOnInit(): void {
    const opts = this.SPECIES.map(v => ({ label: this.speciesLabel(v), value: v }));
    this.reportFormConfig.set({
      fields: [
        { key: 'petName', label: this.i18n.translate('common.pet'), type: 'input', placeholder: this.i18n.translate('lostPets.petNamePlaceholder'), validation: { required: true } },
        { key: 'species', label: this.i18n.translate('common.species'), type: 'select', options: opts, validation: { required: true } },
        { key: 'breed', label: this.i18n.translate('common.breed'), type: 'select', dependsOn: 'species' },
        { key: 'color', label: this.i18n.translate('common.color'), type: 'input' },
        { key: 'lostDate', label: this.i18n.translate('lostPets.sightingDate'), type: 'date', validation: { required: true } },
        { key: 'location', label: this.i18n.translate('lostPets.sightingArea'), type: 'location', validation: { required: true } },
        { key: 'description', label: this.i18n.translate('common.description'), type: 'textarea', rows: 3, validation: { required: true, maxLength: 500 } },
        { key: 'rewardAmount', label: this.i18n.translate('lostPets.reward'), type: 'number', validation: { min: 0 } },
        { key: 'images', label: this.i18n.translate('lostPets.photoUrl'), type: 'file', accept: 'image/*', maxFileSize: 5_000_000, multiple: true },
      ],
      title: this.i18n.translate('lostPets.sightingTitle'),
      submitLabel: this.i18n.translate('lostPets.sightingSubmit'),
      showSubmit: true,
      showCancel: true,
      columns: 2,
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
    return this.i18n.translate('lostPets.sightingTitle');
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
      status: 'FOUND',
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
    const request = this.lostPetsService.create(payload);
    request.subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: this.i18n.translate('common.success'), detail: this.i18n.translate('lostPets.sightingCreatedDetail') });
        this.submit.emit({ payload, files });
      },
      error: () => {
        this.messages.add({ severity: 'error', summary: this.i18n.translate('lostPets.errorTitle'), detail: this.i18n.translate('lostPets.saveError') });
      },
    });
  }
}