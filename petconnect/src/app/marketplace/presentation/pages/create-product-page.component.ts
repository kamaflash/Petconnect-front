import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { MarketplaceService, CreateProductRequest } from '../../infrastructure/services/marketplace.service';

@Component({
  selector: 'app-create-product-page',
  standalone: true,
  imports: [TranslocoModule, 
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    ToastModule,
    CardModule
  ],
  providers: [MessageService],
  template: `
    <div class="create-product-page">
      <div class="create-product-container">
        <header class="page-header page-heading-card">
          <div class="page-heading-copy">
            <h1>{{ this.i18n.translate('createProduct.title') }}</h1>
            <p>{{ this.i18n.translate('createProduct.subtitle') }}</p>
          </div>
        </header>

        <div class="product-form-card">
          <form (ngSubmit)="onSubmit()" #productForm="ngForm">
            <div class="form-grid">
              <!-- Nombre -->
              <div class="form-field full-width">
                <label for="name">{{ this.i18n.translate('createProduct.name') }}</label>
                <input
                  id="name"
                  pInputText
                  [(ngModel)]="formData.name"
                  name="name"
                  [placeholder]="this.i18n.translate('createProduct.namePlaceholder')"
                  required
                />
              </div>

              <!-- Categoría -->
              <div class="form-field">
                <label for="category">{{ this.i18n.translate('createProduct.category') }}</label>
                <p-select
                  [options]="categories"
                  [(ngModel)]="formData.category"
                  name="category"
                  [placeholder]="this.i18n.translate('createProduct.selectCategory')"
                  optionLabel="label"
                  required
                />
              </div>

              <!-- Subcategoría -->
              <div class="form-field">
                <label for="subcategory">{{ this.i18n.translate('createProduct.subcategory') }}</label>
                <input
                  id="subcategory"
                  pInputText
                  [(ngModel)]="formData.subcategory"
                  name="subcategory"
                  [placeholder]="this.i18n.translate('createProduct.subcategoryPlaceholder')"
                />
              </div>

              <!-- Precio -->
              <div class="form-field">
                <label for="price">{{ this.i18n.translate('createProduct.price') }}</label>
                <p-inputNumber
                  [(ngModel)]="formData.price"
                  name="price"
                  placeholder="0.00"
                  mode="currency"
                  currency="EUR"
                  required
                />
              </div>

              <!-- Precio original -->
              <div class="form-field">
                <label for="originalPrice">{{ this.i18n.translate('createProduct.originalPrice') }}</label>
                <p-inputNumber
                  [(ngModel)]="formData.originalPrice"
                  name="originalPrice"
                  placeholder="0.00"
                  mode="currency"
                  currency="EUR"
                />
              </div>

              <!-- Stock -->
              <div class="form-field">
                <label for="stock">{{ this.i18n.translate('createProduct.stock') }}</label>
                <p-inputNumber
                  [(ngModel)]="formData.stock"
                  name="stock"
                  placeholder="0"
                  [min]="0"
                  required
                />
              </div>

              <!-- Marca -->
              <div class="form-field">
                <label for="brand">{{ this.i18n.translate('createProduct.brand') }}</label>
                <input
                  id="brand"
                  pInputText
                  [(ngModel)]="formData.brand"
                  name="brand"
                  [placeholder]="this.i18n.translate('createProduct.brandPlaceholder')"
                />
              </div>

              <!-- Descuento -->
              <div class="form-field">
                <label for="discount">{{ this.i18n.translate('createProduct.discount') }}</label>
                <p-inputNumber
                  [(ngModel)]="formData.discount"
                  name="discount"
                  placeholder="0"
                  [min]="0"
                  [max]="100"
                />
              </div>

              <!-- Imagen URL -->
              <div class="form-field full-width">
                <label for="imageUrl">{{ this.i18n.translate('createProduct.imageUrl') }}</label>
                <input
                  id="imageUrl"
                  pInputText
                  [(ngModel)]="formData.imageUrl"
                  name="imageUrl"
                  [placeholder]="this.i18n.translate('createProduct.imageUrlPlaceholder')"
                />
              </div>

              <!-- Tags -->
              <div class="form-field full-width">
                <label for="tags">{{ this.i18n.translate('createProduct.tags') }}</label>
                <input
                  id="tags"
                  pInputText
                  [(ngModel)]="formData.tags"
                  name="tags"
                  [placeholder]="this.i18n.translate('createProduct.tagsPlaceholder')"
                />
              </div>

              <!-- Descripción -->
              <div class="form-field full-width">
                <label for="description">{{ this.i18n.translate('createProduct.description') }}</label>
                <textarea
                  id="description"
                  pTextarea
                  [(ngModel)]="formData.description"
                  name="description"
                  [placeholder]="this.i18n.translate('createProduct.descriptionPlaceholder')"
                  rows="4"
                ></textarea>
              </div>
            </div>

            <div class="form-actions">
              <button
                type="button"
                pButton
                [label]="this.i18n.translate('createProduct.cancel')"
                class="p-button-outlined p-button-secondary"
                (click)="goBack()"
              ></button>
              <button
                type="submit"
                pButton
                [label]="this.i18n.translate('createProduct.submit')"
                class="p-button-primary"
                [disabled]="loading()"
                [loading]="loading()"
              ></button>
            </div>
          </form>
        </div>
      </div>

      <p-toast />
    </div>
  `,
  styles: [`
    .create-product-page {
      min-height: 100vh;
      background: var(--surface-ground);
      padding: 2rem 0;
    }

    .create-product-container {
      max-width: var(--max-page-width);
      margin: 0 auto;
      padding: 0 1rem;
    }

    .product-form-card {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 2rem;
      border: 1px solid var(--surface-border);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .form-field label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .form-field input,
    .form-field textarea,
    .form-field p-select,
    .form-field p-inputnumber {
      width: 100%;
    }

    .form-field p-inputnumber .p-inputnumber-input {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .form-actions button {
        width: 100%;
      }
    }
  `]
})
export class CreateProductPageComponent {
  readonly i18n = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly marketplaceService = inject(MarketplaceService);
  private readonly messageService = inject(MessageService);

  loading = signal(false);

  categories = [
    { label: 'Alimento', value: 'Alimento' },
    { label: 'Juguetes', value: 'Juguetes' },
    { label: 'Accesorios', value: 'Accesorios' },
    { label: 'Salud', value: 'Salud' },
    { label: 'Ropa', value: 'Ropa' },
    { label: 'Higiene', value: 'Higiene' },
  ];

  formData: CreateProductRequest = {
    name: '',
    price: 0,
    category: '',
    stock: 0,
  };

  onSubmit(): void {
    if (!this.formData.name || !this.formData.price || !this.formData.category) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos obligatorios'
      });
      return;
    }

    this.loading.set(true);

    this.marketplaceService.createProduct(this.formData).subscribe({
      next: (product) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Producto creado',
          detail: `El producto "${product.name}" ha sido creado correctamente`
        });
        this.loading.set(false);
        this.router.navigate(['/marketplace']);
      },
      error: (error) => {
        console.error('Error creating product:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el producto'
        });
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/marketplace']);
  }
}
