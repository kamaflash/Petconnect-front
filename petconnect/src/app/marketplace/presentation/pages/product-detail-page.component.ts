import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressBarModule } from 'primeng/progressbar';
import { RatingModule } from 'primeng/rating';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MarketplaceService, ProductResponse } from '../../infrastructure/services/marketplace.service';
import { ReviewRequest, ReviewResponse, ReviewsService } from '../../infrastructure/services/reviews/reviews.service';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { PageHeadingCardComponent } from '../../../shared/presentation/components/page-heading-card/page-heading-card.component';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    ButtonModule,
    CardModule,
    TagModule,
    InputNumberModule,
    RatingModule,
    ProgressBarModule,
    ToastModule,
    DynamicFormComponent,
    PageHeadingCardComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <main class="p-2 page-container">
      <nav class="flex align-items-center gap-2 mb-3 text-color-secondary" aria-label="Breadcrumb">
        <button pButton type="button" class="p-button-link p-0" (click)="goBack()">Marketplace</button>
        <i class="pi pi-angle-right" aria-hidden="true"></i>
        <span>{{ product()?.name || 'Producto' }}</span>
      </nav>

      <app-page-heading-card
        [title]="product()?.name || ('marketplace.title' | transloco)"
        [subtitle]="'marketplace.subtitle' | transloco"
      >
        <button page-heading-actions pButton type="button" class="p-button-outlined p-button-sm" (click)="goBack()">
          <i class="pi pi-arrow-left mr-2" aria-hidden="true"></i>
          <span>Volver al marketplace</span>
        </button>
      </app-page-heading-card>

      @if (loading()) {
        <p-card aria-label="Cargando producto">
          <p-progressBar mode="indeterminate" />
        </p-card>
      } @else if (product(); as item) {
        <section class="grid">
          <div class="col-12 lg:col-8">
            <p-card class="card-modern">
              @if (mainImage()) {
                <img class="w-full border-round" [src]="mainImage()" [alt]="item.name" />
              } @else {
                <div class="flex justify-content-center align-items-center p-8 surface-ground border-round">
                  <i class="pi pi-image text-5xl text-color-secondary" aria-hidden="true"></i>
                </div>
              }
              @if (thumbnailImages().length > 1) {
                <div class="flex flex-wrap gap-2 mt-3" aria-label="ImÃ¡genes del producto">
                  @for (image of thumbnailImages(); track image; let index = $index) {
                    <button
                      pButton
                      type="button"
                      class="p-button-outlined p-button-sm"
                      [outlined]="activeThumbIndex() !== index"
                      [attr.aria-label]="'Ver imagen ' + (index + 1)"
                      [attr.aria-pressed]="activeThumbIndex() === index"
                      (click)="activeThumbIndex.set(index)"
                    >
                      <img class="w-4rem h-4rem border-round" [src]="image" [alt]="item.name + ' ' + (index + 1)" />
                    </button>
                  }
                </div>
              }
            </p-card>
          </div>

          <div class="col-12 lg:col-4">
            <p-card>
              <div class="flex flex-column gap-3">
                <div>
                  <p-tag [value]="item.category" />
                  <h1 class="mt-2 mb-2">{{ item.name }}</h1>
                  <div class="flex align-items-center flex-wrap gap-2">
                    <p-rating [ngModel]="avgRating()" [readonly]="true" />
                    <span class="text-color-secondary">
                      {{ avgRating() | number: '1.1-1' }} Â· {{ reviews().length }} reseÃ±as
                    </span>
                  </div>
                </div>

                <div class="flex align-items-center gap-2">
                  <span class="text-color-secondary">Marca</span>
                  <strong>{{ item.brand || 'Sin marca especificada' }}</strong>
                </div>

                <div>
                  <span class="block text-color-secondary text-sm mb-1">Disponibilidad</span>
                  @if (item.stock > 0) {
                    <p-tag severity="success" [value]="'En stock (' + item.stock + ' disponibles)'" />
                  } @else {
                    <p-tag severity="danger" value="Agotado" />
                  }
                </div>

                <div class="flex align-items-center flex-wrap gap-2">
                  @if (item.originalPrice && item.originalPrice > item.price) {
                    <span class="text-color-secondary line-through">{{ item.originalPrice | currency: 'EUR' }}</span>
                    @if (item.discount) {
                      <p-tag severity="danger" [value]="'-' + item.discount + '%'" />
                    }
                  }
                  <strong class="text-3xl w-full">{{ item.price | currency: 'EUR' }}</strong>
                </div>

                <div class="flex flex-column gap-2 border-1 surface-border border-round p-3">
                  <div class="flex align-items-center justify-content-between gap-2">
                    <label for="product-quantity">Unidades</label>
                    <p-inputNumber
                      [ngModel]="quantity()"
                      (ngModelChange)="quantity.set($event)"
                      [min]="1"
                      [max]="item.stock"
                      [showButtons]="true"
                      [disabled]="item.stock < 1"
                      inputId="product-quantity"
                    />
                  </div>
                  <button pButton type="button" [disabled]="item.stock < 1" (click)="addToCart()">
                    <i class="pi pi-shopping-cart mr-2" aria-hidden="true"></i>
                    <span>AÃ±adir al carrito</span>
                  </button>
                  <button pButton type="button" severity="warn" [disabled]="item.stock < 1" (click)="buyNow()">
                    <i class="pi pi-bolt mr-2" aria-hidden="true"></i>
                    <span>Comprar ahora</span>
                  </button>
                </div>

                <div class="flex align-items-center justify-content-between flex-wrap gap-2 border-top-1 surface-border pt-3">
                  <div>
                    <span class="block text-color-secondary text-sm">Vendido por</span>
                    <strong>{{ productSellerName() }}</strong>
                  </div>
                  <button pButton type="button" class="p-button-text p-button-sm" (click)="viewSeller()">
                    <span>Ver vendedor</span>
                    <i class="pi pi-angle-right ml-2" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </p-card>
          </div>
        </section>

        <section class="grid">
          <div class="col-12 lg:col-8">
            <p-card header="DescripciÃ³n">
              <p class="m-0 line-height-3">
                {{ item.description || 'El vendedor todavÃ­a no ha aÃ±adido una descripciÃ³n.' }}
              </p>
            </p-card>
          </div>
          <div class="col-12 lg:col-4">
            <p-card header="Especificaciones">
              <div class="flex flex-column">
                <div class="flex justify-content-between gap-3 py-2 border-bottom-1 surface-border">
                  <span class="text-color-secondary">CategorÃ­a</span><strong>{{ item.category }}</strong>
                </div>
                <div class="flex justify-content-between gap-3 py-2 border-bottom-1 surface-border">
                  <span class="text-color-secondary">Marca</span><strong>{{ item.brand || 'â€”' }}</strong>
                </div>
                <div class="flex justify-content-between gap-3 py-2 border-bottom-1 surface-border">
                  <span class="text-color-secondary">SKU</span><strong>{{ item.id }}</strong>
                </div>
                <div class="flex justify-content-between gap-3 py-2">
                  <span class="text-color-secondary">Stock</span><strong>{{ item.stock }}</strong>
                </div>
                @if (item.subcategory) {
                  <div class="flex justify-content-between gap-3 py-2 border-top-1 surface-border">
                    <span class="text-color-secondary">SubcategorÃ­a</span><strong>{{ item.subcategory }}</strong>
                  </div>
                }
              </div>
            </p-card>
          </div>
        </section>

        <section class="mt-3">
          <p-card>
            <ng-template #title>
              <div class="flex align-items-center flex-wrap gap-2">
                <span>ReseÃ±as y valoraciones</span>
                <p-tag severity="secondary" [value]="reviews().length + ' reseÃ±as'" />
              </div>
            </ng-template>
            <div class="grid">
              <div class="col-12 md:col-4">
                <div class="flex flex-column gap-2">
                  <span class="text-5xl font-bold">{{ avgRating() | number: '1.1-1' }}</span>
                  <p-rating [ngModel]="avgRating()" [readonly]="true" />
                  <span class="text-color-secondary">{{ reviews().length }} valoraciones</span>
                </div>
              </div>
              <div class="col-12 md:col-8">
                <div class="flex flex-column gap-2">
                  @for (star of ratingLevels; track star) {
                    <div class="grid align-items-center">
                      <span class="col-3 text-color-secondary">{{ star }} estrellas</span>
                      <div class="col-7"><p-progressBar [value]="barWidth(star)" [showValue]="false" /></div>
                      <span class="col-2 text-color-secondary text-right">{{ countByRating(star) }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
            <div class="border-top-1 surface-border mt-3 pt-3">
              <h3 class="mt-0">Escribe tu reseÃ±a</h3>
              @if (isAuthenticated()) {
                <app-dynamic-form
                  [config]="reviewFormConfig"
                  [(formData)]="reviewFormData"
                  (onSubmitClick)="submitReview($event)"
                />
              } @else {
                <p class="text-color-secondary">Inicia sesiÃ³n para dejar una reseÃ±a de este producto.</p>
              }
            </div>
            <div class="flex flex-column mt-3">
              @if (reviewsLoading()) {
                <p-progressBar mode="indeterminate" />
              } @else if (reviews().length) {
                @for (review of reviews(); track review.id) {
                  <article class="py-3 border-top-1 surface-border">
                    <header class="flex align-items-center flex-wrap gap-2">
                      <strong>{{ review.buyerName }}</strong>
                      <p-rating [ngModel]="review.rating" [readonly]="true" />
                      <time class="text-color-secondary text-sm" [attr.datetime]="review.createdAt">
                        {{ review.createdAt | date: 'mediumDate' }}
                      </time>
                    </header>
                    <p class="mb-0 mt-2 line-height-3">{{ review.comment }}</p>
                  </article>
                }
              } @else {
                <p class="text-color-secondary">TodavÃ­a no hay reseÃ±as. Â¡SÃ© la primera persona en opinar!</p>
              }
            </div>
          </p-card>
        </section>

        <section class="mt-3">
          <p-card header="TambiÃ©n te puede interesar">
            <p class="m-0 text-color-secondary">PrÃ³ximamente encontrarÃ¡s productos relacionados.</p>
          </p-card>
        </section>
      } @else {
        <p-card>
          <p class="m-0 text-color-secondary">No se encontrÃ³ el producto solicitado.</p>
        </p-card>
      }
    </main>
  `,
})
export class ProductDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly marketplaceService = inject(MarketplaceService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly transloco = inject(TranslocoService);

  readonly productId = signal<string | null>(null);
  readonly product = signal<ProductResponse | null>(null);
  readonly loading = signal(true);
  readonly reviews = signal<ReviewResponse[]>([]);
  readonly reviewsLoading = signal(true);
  readonly activeThumbIndex = signal(0);
  readonly quantity = signal(1);
  readonly ratingLevels = [5, 4, 3, 2, 1];
  reviewFormData: Record<string, unknown> = { rating: 5, comment: '' };
  readonly reviewFormConfig: DynamicFormConfig = {
    fields: [
      {
        key: 'rating',
        label: 'ValoraciÃ³n (1-5)',
        type: 'number',
        defaultValue: 5,
        validation: { required: true, min: 1, max: 5 },
      },
      {
        key: 'comment',
        label: 'Tu comentario',
        type: 'textarea',
        placeholder: 'CuÃ©ntanos quÃ© te ha parecido este producto',
        rows: 4,
        validation: { required: true, minLength: 3, maxLength: 1000 },
      },
    ],
    submitLabel: 'Publicar reseÃ±a',
    showCancel: false,
    showSubmit: true,
    columns: 1,
  };

  readonly thumbnailImages = computed(() => {
    const item = this.product();
    if (!item) return [];
    return [...new Set([item.imageUrl, ...item.imageUrls].filter((image): image is string => !!image))];
  });
  readonly mainImage = computed(() => this.thumbnailImages()[this.activeThumbIndex()] ?? null);
  readonly avgRating = computed(() => {
    const items = this.reviews();
    return items.length
      ? items.reduce((sum, review) => sum + review.rating, 0) / items.length
      : this.product()?.rating ?? 0;
  });
  readonly productSellerName = computed(() => {
    const sellerId = this.product()?.sellerId;
    return sellerId ? `Vendedor ${sellerId.slice(0, 8)}` : 'Vendedor PetConnect';
  });
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly userHasReviewed = computed(() => false);

  get i18n(): TranslocoService {
    return this.transloco;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.reviewsLoading.set(false);
      void this.goBack();
      return;
    }
    this.productId.set(id);
    this.loadProduct(id);
    this.loadReviews(id);
  }

  countByRating(star: number): number {
    return this.reviews().filter((review) => review.rating === star).length;
  }

  barWidth(star: number): number {
    const total = this.reviews().length;
    return total ? (this.countByRating(star) / total) * 100 : 0;
  }

  loadProduct(id: string): void {
    this.marketplaceService.getProductById(id).subscribe({
      next: (item) => {
        this.product.set(item);
        this.quantity.set(item.stock > 0 ? 1 : 0);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('No se pudo cargar el producto', error);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el producto. IntÃ©ntalo de nuevo mÃ¡s tarde.',
        });
      },
    });
  }

  loadReviews(productId: string): void {
    this.reviewsService.getReviews(productId).subscribe({
      next: (items) => {
        this.reviews.set(items);
        this.reviewsLoading.set(false);
      },
      error: (error: unknown) => {
        console.error('No se pudieron cargar las reseÃ±as', error);
        this.reviewsLoading.set(false);
      },
    });
  }

  addToCart(): void {
    if (!this.product() || this.quantity() < 1) return;
    void this.router.navigate(['/marketplace'], {
      queryParams: { addToCart: this.productId(), quantity: this.quantity() },
    });
  }

  buyNow(): void {
    if (!this.product() || this.quantity() < 1) return;
    void this.router.navigate(['/marketplace'], {
      queryParams: { buyNow: this.productId(), quantity: this.quantity() },
    });
  }

  viewSeller(): void {
    const sellerId = this.product()?.sellerId;
    if (sellerId) void this.router.navigate(['/profile'], { queryParams: { sellerId } });
  }

  goBack(): Promise<boolean> {
    return this.router.navigate(['/marketplace']);
  }

  submitReview(formData: Record<string, unknown> = this.reviewFormData): void {
    const rating = Number(formData['rating']);
    const comment = String(formData['comment'] ?? '').trim();
    const productId = this.productId();
    if (!productId || !Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Revisa los datos',
        detail: 'Selecciona una valoraciÃ³n entre 1 y 5 y escribe un comentario.',
      });
      return;
    }
    if (!this.isAuthenticated()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Inicia sesiÃ³n',
        detail: 'Necesitas iniciar sesiÃ³n para publicar una reseÃ±a.',
      });
      return;
    }
    const request: ReviewRequest = { rating, comment };
    this.reviewsService.createReview(productId, request).subscribe({
      next: (created) => {
        this.reviews.update((items) => [created, ...items]);
        this.reviewFormData = { rating: 5, comment: '' };
        this.messageService.add({
          severity: 'success',
          summary: 'ReseÃ±a publicada',
          detail: 'Gracias por compartir tu opiniÃ³n.',
        });
      },
      error: (error: unknown) => {
        console.error('No se pudo publicar la reseÃ±a', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo publicar tu reseÃ±a. IntÃ©ntalo de nuevo.',
        });
      },
    });
  }
}

