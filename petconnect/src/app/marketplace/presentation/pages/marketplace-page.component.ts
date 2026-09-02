import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterLink, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ModalComponent } from '../../../shared/presentation/components/modal/modal';
import { PetFeedGridComponent, FilterConfig, ColumnConfig } from '../../../adoptions/presentation/components/pet-feed-grid/pet-feed-grid.component';
import { MarketplaceService, ProductResponse } from '../../infrastructure/services/marketplace.service';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory: string;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  stock: number;
  brand: string;
  tags?: string[];
  discount?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-marketplace-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    DialogModule,
    InputTextModule,
    FormsModule,
    SelectModule,
    SliderModule,
    CheckboxModule,
    RadioButtonModule,
    ToastModule,
    RouterLink,
    ModalComponent,
    PetFeedGridComponent,
    TranslocoModule,
  ],
  providers: [MessageService],
  template: `
    <div class="marketplace-page">
      <!-- Header -->
      <div class="marketplace-header">
        <div class="header-content">
          <div class="header-left">
            <h1>{{ 'marketplace.title' | transloco }}</h1>
            <p>{{ 'marketplace.subtitle' | transloco }}</p>
          </div>
          <div class="header-right">
            <div class="search-bar">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                placeholder="{{ 'marketplace.searchPlaceholder' | transloco }}"
                [(ngModel)]="searchQuery"
              />
            </div>
            <button class="cart-button" (click)="toggleCart()">
              <i class="pi pi-shopping-cart"></i>
              <span>{{ 'marketplace.cart' | transloco }}</span>
              @if (cartItems().length > 0) {
                <span class="cart-badge">{{ cartItems().length }}</span>
              }
            </button>
            @if (isSeller()) {
              <button
                class="create-product-btn"
                (click)="createProduct()"
              >
                <i class="pi pi-plus"></i>
                <span>{{ 'marketplace.createProduct' | transloco }}</span>
              </button>
            }
          </div>
        </div>
      </div>

      <app-pet-feed-grid
        [items]="filteredProducts()"
        [itemLabel]="'marketplace.itemLabel' | transloco"
        itemKeyField="id"
        [filterConfigs]="productFilterConfigs"
        [columnConfigs]="productColumnConfigs"
        [initialFilters]="productFilters()"
        (filtersChange)="onFiltersChange($event)"
        (itemClick)="openProductDetail($event)"
      />

      <!-- Cart Sidebar -->
      <div class="cart-sidebar" [class.open]="cartOpen()">
        <div class="cart-header">
          <h2>{{ 'marketplace.cartTitle' | transloco }}</h2>
          <button class="close-cart-btn" (click)="toggleCart()">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="cart-content">
          @if (cartItems().length === 0) {
            <div class="empty-cart">
              <i class="pi pi-shopping-cart"></i>
              <p>{{ 'marketplace.emptyCart' | transloco }}</p>
            </div>
          } @else {
            <div class="cart-items">
              @for (item of cartItems(); track item.product.id) {
                <div class="cart-item">
                  <img [src]="item.product.image" [alt]="item.product.name" />
                  <div class="cart-item-info">
                    <h4>{{ item.product.name }}</h4>
                    <p class="cart-item-price">{{ item.product.price | currency:'EUR' }}</p>
                    <div class="quantity-controls">
                      <button (click)="updateQuantity(item.product, -1)" [disabled]="item.quantity <= 1">
                        <i class="pi pi-minus"></i>
                      </button>
                      <span>{{ item.quantity }}</span>
                      <button (click)="updateQuantity(item.product, 1)" [disabled]="item.quantity >= item.product.stock">
                        <i class="pi pi-plus"></i>
                      </button>
                    </div>
                  </div>
                  <button class="remove-item-btn" (click)="removeFromCart(item.product)">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              }
            </div>
            <div class="cart-footer">
              <div class="cart-total">
                <span>{{ 'marketplace.total' | transloco }}</span>
                <span class="total-amount">{{ cartTotal() | currency:'EUR' }}</span>
              </div>
              <button class="checkout-btn" (click)="checkout()">
                {{ 'marketplace.checkout' | transloco }}
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Product Detail Modal -->
      <app-modal
        [visible]="productDetailVisible()"
        [showCancel]="false"
        (onHide)="productDetailVisible.set(false)"
      >
        @if (selectedProduct(); as product) {
          <div class="product-detail">
            <div class="product-detail-image">
              <img [src]="product.image" [alt]="product.name" />
            </div>
            <div class="product-detail-info">
              <span class="product-category">{{ product.category }}</span>
              <h2>{{ product.name }}</h2>
              <div class="product-rating">
                <div class="stars">
                  @for (star of [1,2,3,4,5]; track star) {
                    <i class="pi pi-star-fill" [class.filled]="star <= product.rating"></i>
                  }
                </div>
                <span>({{ product.reviews }} {{ 'marketplace.reviews' | transloco }})</span>
              </div>
              <p class="product-description">{{ product.description }}</p>
              <div class="product-price-section">
                @if (product.originalPrice) {
                  <span class="original-price">{{ product.originalPrice | currency:'EUR' }}</span>
                }
                <span class="current-price">{{ product.price | currency:'EUR' }}</span>
                @if (product.discount) {
                  <span class="discount-badge">-{{ product.discount }}%</span>
                }
              </div>
              <div class="product-stock">
                <i class="pi pi-box"></i>
                <span [class.in-stock]="product.stock > 0" [class.out-stock]="product.stock === 0">
                  {{ product.stock > 0 ? ('marketplace.inStock' | transloco: { count: product.stock }) : ('marketplace.outOfStock' | transloco) }}
                </span>
              </div>
              <div class="product-actions">
                <button
                  class="add-to-cart-btn-large"
                  (click)="addToCart(product)"
                  [disabled]="product.stock === 0"
                >
                  <i class="pi pi-shopping-cart"></i>
                  {{ product.stock === 0 ? ('marketplace.outOfStock' | transloco) : ('marketplace.addToCart' | transloco) }}
                </button>
              </div>
            </div>
          </div>
        }
      </app-modal>
    </div>
  `,
  styles: [`
    .marketplace-page {
      min-height: 100vh;
      background: var(--surface-bg);
    }

    /* Header */
    .marketplace-header {
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      padding: 1.5rem 0;
      margin-bottom: 2rem;
    }

    .header-content {
      max-width: var(--max-page-width);
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .header-left p {
      margin: 0.25rem 0 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .header-right {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-bar {
      position: relative;
      width: 300px;
    }

    .search-bar i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
    }

    .search-bar input {
      width: 100%;
      padding: 0.625rem 1rem 0.625rem 2.5rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-full);
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .cart-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--radius-full);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition-fast);
      position: relative;
    }

    .cart-button:hover {
      background: var(--primary-color-dark);
      transform: translateY(-2px);
    }

    .cart-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: var(--red-500);
      color: white;
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      border-radius: 999px;
      font-weight: 600;
    }

    .create-product-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: var(--surface-card);
      color: var(--text-primary);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius_full);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition-fast);
    }

    .create-product-btn:hover {
      background: var(--surface-hover);
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    /* Cart Sidebar */
    .cart-sidebar {
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: var(--surface-card);
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
      transition: right var(--transition-normal);
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }

    .cart-sidebar.open {
      right: 0;
    }

    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .cart-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .close-cart-btn {
      background: none;
      border: none;
      color: var(--text-tertiary);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: var(--radius-full);
      transition: all var(--transition-fast);
    }

    .close-cart-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .cart-content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .empty-cart {
      text-align: center;
      padding: 3rem 1rem;
    }

    .empty-cart i {
      font-size: 3rem;
      color: var(--text-tertiary);
      margin-bottom: 1rem;
    }

    .empty-cart p {
      color: var(--text-secondary);
      margin: 0;
    }

    .cart-items {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .cart-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-hover);
      border-radius: var(--radius-sm);
    }

    .cart-item img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: var(--radius-sm);
    }

    .cart-item-info {
      flex: 1;
    }

    .cart-item-info h4 {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .cart-item-price {
      margin: 0 0 0.5rem;
      font-weight: 600;
      color: var(--primary-color);
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .quantity-controls button {
      width: 24px;
      height: 24px;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .quantity-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quantity-controls span {
      min-width: 24px;
      text-align: center;
      font-weight: 600;
    }

    .remove-item-btn {
      background: none;
      border: none;
      color: var(--text-tertiary);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
    }

    .remove-item-btn:hover {
      background: var(--surface-border);
      color: var(--red-500);
    }

    .cart-footer {
      border-top: 1px solid var(--surface-border);
      padding-top: 1rem;
      margin-top: 1rem;
    }

    .cart-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .total-amount {
      color: var(--primary-color);
      font-size: 1.25rem;
    }

    .checkout-btn {
      width: 100%;
      padding: 1rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      transition: all var(--transition-fast);
    }

    .checkout-btn:hover {
      background: var(--primary-color-dark);
      transform: translateY(-2px);
    }

    /* Product Detail Modal */
    .product-detail {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .product-detail-image {
      border-radius: var(--radius-md);
      overflow: hidden;
      height: 100%;
      min-height: 400px;
    }

    .product-detail-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .product-detail-info {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .product-detail-info h2 {
      margin: 0;
      font-size: 1.75rem;
    }

    .product-rating {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stars {
      display: flex;
      gap: 0.125rem;
    }

    .stars i {
      font-size: 0.875rem;
      color: var(--surface-border);
    }

    .stars i.filled {
      color: #fbbf24;
    }

    .product-rating span {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .product-description {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .product-price-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .original-price {
      font-size: 1rem;
      color: var(--text-tertiary);
      text-decoration: line-through;
    }

    .current-price {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .discount-badge {
      background: var(--red-500);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.875rem;
    }

    .product-stock {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .product-stock i {
      color: var(--primary-color);
    }

    .product-stock .in-stock {
      color: #10b981;
    }

    .product-stock .out-stock {
      color: var(--red-500);
    }

    .product-actions {
      margin-top: auto;
    }

    .add-to-cart-btn-large {
      width: 100%;
      padding: 1rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .add-to-cart-btn-large:hover:not(:disabled) {
      background: var(--primary-color-dark);
      transform: translateY(-2px);
    }

    .add-to-cart-btn-large:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Mobile */
    @media (max-width: 768px) {
      .product-detail {
        grid-template-columns: 1fr;
      }
      .product-detail-image {
        min-height: 250px;
      }
    }
  `]
})
export class MarketplacePageComponent implements OnInit {
  private messageService = inject(MessageService);
  private readonly marketplaceService = inject(MarketplaceService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  // Products data
  products = signal<Product[]>([]);
  cartItems = signal<CartItem[]>([]);
  searchQuery = '';
  cartOpen = signal(false);

  // Product Detail
  productDetailVisible = signal(false);
  selectedProduct = signal<Product | null>(null);

  // Filters
  productFilters = signal<Record<string, any>>({});

  // Generic component configs
  productFilterConfigs: FilterConfig[] = [
    {
      type: 'text',
      key: 'search',
      label: this.transloco.translate('marketplace.search'),
      placeholder: this.transloco.translate('marketplace.searchPlaceholder')
    },
    {
      type: 'checkbox',
      key: 'categories',
      label: this.transloco.translate('marketplace.categories'),
      options: [
        { label: this.transloco.translate('marketplace.food'), value: 'Alimento' },
        { label: this.transloco.translate('marketplace.toys'), value: 'Juguetes' },
        { label: this.transloco.translate('marketplace.accessories'), value: 'Accesorios' },
        { label: this.transloco.translate('marketplace.health'), value: 'Salud' }
      ]
    },
    {
      type: 'checkbox',
      key: 'brands',
      label: this.transloco.translate('marketplace.categoryBrand'),
      options: [
        { label: 'Marca A', value: 'Marca A' },
        { label: 'Marca B', value: 'Marca B' },
        { label: 'Marca C', value: 'Marca C' }
      ]
    },
    {
      type: 'checkbox',
      key: 'inStock',
      label: this.transloco.translate('marketplace.availability'),
      options: [
        { label: this.transloco.translate('marketplace.inStockOnly'), value: 'true' }
      ]
    }
  ];

  productColumnConfigs: ColumnConfig[] = [
    {
      key: 'image',
      label: this.transloco.translate('marketplace.image'),
      type: 'image'
    },
    {
      key: 'name',
      label: this.transloco.translate('marketplace.name'),
      type: 'text'
    },
    {
      key: 'description',
      label: this.transloco.translate('marketplace.description'),
      type: 'text'
    },
    {
      key: 'price',
      label: this.transloco.translate('marketplace.price'),
      type: 'price'
    },
    {
      key: 'stock',
      label: this.transloco.translate('marketplace.stock'),
      type: 'text',
      icon: 'pi-box'
    }
  ];

  // Computed
  filteredProducts = computed(() => {
    const allProducts = this.products();
    const search = this.searchQuery.toLowerCase();

    return allProducts.filter(product => {
      const matchesSearch = !search ||
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search);

      return matchesSearch;
    });
  });

  isSeller = computed(() => this.authService.user()?.profileType?.toLowerCase() === 'seller');

  ngOnInit(): void {
    this.loadProducts();
  }

  createProduct(): void {
    this.router.navigate(['/marketplace/create']);
  }

  onFiltersChange(filters: Record<string, any>): void {
    this.productFilters.set(filters);
  }

  loadProducts(): void {
    this.marketplaceService.getAllProducts().subscribe({
      next: (products: ProductResponse[]) => {
        this.products.set(products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
          category: p.category,
          subcategory: p.subcategory || '',
          image: p.imageUrl || 'https://i.pravatar.cc/300',
          images: p.imageUrls,
          rating: Number(p.rating),
          reviews: p.reviews,
          stock: p.stock,
          brand: p.brand || '',
          tags: p.tags ? p.tags.split(',') : undefined,
          discount: p.discount || undefined
        })));
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.transloco.translate('marketplace.error'),
          detail: this.transloco.translate('marketplace.loadError')
        });
      }
    });
  }

  toggleCart(): void {
    this.cartOpen.update(value => !value);
  }

  openProductDetail(product: Product): void {
    this.selectedProduct.set(product);
    this.productDetailVisible.set(true);
  }

  addToCart(product: Product): void {
    if (product.stock === 0) return;

    this.cartItems.update(items => {
      const existing = items.find(item => item.product.id === product.id);
      if (existing) {
        return items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...items, { product, quantity: 1 }];
    });
  }

  updateQuantity(product: Product, delta: number): void {
    this.cartItems.update(items =>
      items.map(item => {
        if (item.product.id === product.id) {
          const newQuantity = Math.max(1, Math.min(item.quantity + delta, product.stock));
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }

  removeFromCart(product: Product): void {
    this.cartItems.update(items =>
      items.filter(item => item.product.id !== product.id)
    );
  }

  cartTotal = computed(() => {
    return this.cartItems().reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  });

  checkout(): void {
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate('marketplace.purchaseDone'),
      detail: this.transloco.translate('marketplace.purchaseDetail')
    });
    this.cartItems.set([]);
    this.toggleCart();
  }
}
