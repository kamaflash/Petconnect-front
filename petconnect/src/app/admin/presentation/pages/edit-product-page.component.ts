import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { MarketplaceService, UpdateProductRequest, ProductResponse } from '../../../marketplace/infrastructure/services/marketplace.service';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-edit-product-page',
  standalone: true,
  imports: [
    TranslocoModule,
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    ToastModule,
    CardModule,
    ProgressBarModule
],
  providers: [MessageService],
  template: `
    <div class="edit-product-page">
      <div class="edit-product-container">
        <header class="page-header page-heading-card">
          <div class="page-heading-copy">
            <h1>{{ this.i18n.translate('editProduct.title') }}</h1>
            <p>{{ this.i18n.translate('editProduct.subtitle') }}</p>
          </div>
        </header>
        <div class="product-form-card">
          @if (loading()) {
            <p-progressBar mode="indeterminate" />
          } @else if (product(); as item) {
            <form (ngSubmit)="onSubmit()" #productForm="ngForm">
              <div class="form-grid">
                <div class="form-field full-width">
                  <label for="name">{{ this.i18n.translate('editProduct.name') }}</label>
                  <input id="name" pInputText [(ngModel)]="formData.name" name="name" [placeholder]="this.i18n.translate('editProduct.namePlaceholder')" required />
                </div>
                <div class="form-field">
                  <label for="category">{{ this.i18n.translate('editProduct.category') }}</label>
                  <p-select [options]="categories" [(ngModel)]="formData.category" name="category" [placeholder]="this.i18n.translate('editProduct.selectCategory')" optionLabel="label" required />
                </div>
                <div class="form-field">
                  <label for="subcategory">{{ this.i18n.translate('editProduct.subcategory') }}</label>
                  <input id="subcategory" pInputText [(ngModel)]="formData.subcategory" name="subcategory" [placeholder]="this.i18n.translate('editProduct.subcategoryPlaceholder')" />
                </div>
                <div class="form-field">
                  <label for="price">{{ this.i18n.translate('editProduct.price') }}</label>
                  <p-inputNumber [(ngModel)]="formData.price" name="price" placeholder="" required />
                </div>
                <div class="form-field">
                  <label for="originalPrice">{{ this.i18n.translate('editProduct.originalPrice') }}</label>
                  <p-inputNumber [(ngModel)]="formData.originalPrice" name="originalPrice" placeholder="" />
                </div>
                <div class="form-field">
                  <label for="stock">{{ this.i18n.translate('editProduct.stock') }}</label>
                  <p-inputNumber [(ngModel)]="formData.stock" name="stock" placeholder="" required />
                </div>
                <div class="form-field">
                  <label for="brand">{{ this.i18n.translate('editProduct.brand') }}</label>
                  <input id="brand" pInputText [(ngModel)]="formData.brand" name="brand" [placeholder]="this.i18n.translate('editProduct.brandPlaceholder')" />
                </div>
                <div class="form-field">
                  <label for="discount">{{ this.i18n.translate('editProduct.discount') }}</label>
                  <p-inputNumber [(ngModel)]="formData.discount" name="discount" placeholder="" />
                </div>
                <div class="form-field full-width">
                  <label for="imageUrl">{{ this.i18n.translate('editProduct.imageUrl') }}</label>
                  <input id="imageUrl" pInputText [(ngModel)]="formData.imageUrl" name="imageUrl" [placeholder]="this.i18n.translate('editProduct.imageUrlPlaceholder')" />
                </div>
                <div class="form-field full-width">
                  <label for="tags">{{ this.i18n.translate('editProduct.tags') }}</label>
                  <input id="tags" pInputText [(ngModel)]="formData.tags" name="tags" [placeholder]="this.i18n.translate('editProduct.tagsPlaceholder')" />
                </div>
                <div class="form-field full-width">
                  <label for="description">{{ this.i18n.translate('editProduct.description') }}</label>
                  <textarea id="description" pInputTextarea [(ngModel)]="formData.description" name="description" [placeholder]="this.i18n.translate('editProduct.descriptionPlaceholder')" rows="4"></textarea>
                </div>
              </div>
              <div class="form-actions">
                <button pButton type="button" class="p-button-secondary p-button-outlined" (click)="goBack()">{{ this.i18n.translate('common.cancel') }}</button>
                <button pButton type="submit" class="p-button-primary">{{ this.i18n.translate('editProduct.submit') }}</button>
              </div>
            </form>
          } @else {
            <p-card>{{ this.i18n.translate('marketplace.loadError') }}</p-card>
          }
        </div>
      </div>
    </div>

    <style>
      .edit-product-page { min-height: 100vh; background: var(--surface-ground); padding: 2rem 0; }
      .edit-product-container { max-width: var(--max-page-width); margin: 0 auto; padding: 0 1rem; }
      .product-form-card { background: var(--surface-card); border-radius: 12px; padding: 2rem; border: 1px solid var(--surface-border); }
      .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
      .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
      .form-field.full-width { grid-column: 1 / -1; }
      .form-field label { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
      .form-field input, .form-field textarea, .form-field p-select, .form-field p-inputnumber { width: 100%; }
      .form-field p-inputnumber .p-inputnumber-input { width: 100%; }
      .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
      @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .form-actions { flex-direction: column; } .form-actions button { width: 100%; } }
    </style>
  `,
})
export class EditProductPageComponent {
  readonly i18n = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly marketplaceService = inject(MarketplaceService);
  private readonly messageService = inject(MessageService);

  loading = signal(false);
  product = signal<ProductResponse | null>(null);

  categories = [
    { label: 'Alimento', value: 'Alimento' },
    { label: 'Juguetes', value: 'Juguetes' },
    { label: 'Accesorios', value: 'Accesorios' },
    { label: 'Salud', value: 'Salud' },
    { label: 'Ropa', value: 'Ropa' },
    { label: 'Higiene', value: 'Higiene' },
  ];

  formData: UpdateProductRequest = {
    name: '',
    price: 0,
    category: '',
    stock: 0,
  };

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    }
  }

  private loadProduct(id: string): void {
    this.loading.set(true);
    this.marketplaceService.getProductById(id).subscribe({
      next: (item) => {
        this.product.set(item);
        this.formData = {
          name: item.name ?? '',
          description: item.description ?? '',
          price: item.price ?? 0,
          originalPrice: item.originalPrice ?? undefined,
          category: item.category ?? '',
          subcategory: item.subcategory ?? undefined,
          imageUrl: item.imageUrl ?? undefined,
          stock: item.stock ?? 0,
          brand: item.brand ?? undefined,
          discount: item.discount ?? undefined,
          tags: item.tags ?? undefined,
          active: item.active,
        };
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.translate('common.error'),
          detail: this.i18n.translate('marketplace.loadError'),
        });
      },
    });
  }

  onSubmit(): void {
    if (!this.formData.name || !this.formData.price || !this.formData.category) {
      this.messageService.add({
        severity: 'error',
        summary: this.i18n.translate('common.error'),
        detail: this.i18n.translate('editProduct.missingFields'),
      });
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.marketplaceService.updateProduct(id, this.formData).subscribe({
      next: (updated) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.translate('admin.productUpdated'),
          detail: this.i18n.translate('admin.productUpdatedDetail', { name: updated.name }),
        });
        void this.router.navigate(['/management']);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.translate('common.error'),
          detail: this.i18n.translate('admin.productUpdateError'),
        });
      },
    });
  }

  goBack(): void {
    void this.router.navigate(['/management']);
  }
}

