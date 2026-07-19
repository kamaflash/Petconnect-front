import { Component, signal, computed, inject } from '@angular/core';
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
import { RouterLink } from '@angular/router';
import { ModalComponent } from '../../../shared/presentation/components/modal/modal';

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

interface FilterOptions {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  inStock: boolean;
  onSale: boolean;
}

type SortOption = 'popularity' | 'price-asc' | 'price-desc' | 'name' | 'rating';

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
  ],
  providers: [MessageService],
  template: `
    <div class="marketplace-page">
      <!-- Header -->
      <div class="marketplace-header">
        <div class="header-content">
          <div class="header-left">
            <h1>Tienda de Mascotas</h1>
            <p>Todo lo que tu mascota necesita</p>
          </div>
          <div class="header-right">
            <div class="search-bar">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                placeholder="Buscar productos..."
                [(ngModel)]="searchQuery"
              />
            </div>
            <button class="cart-button" (click)="toggleCart()">
              <i class="pi pi-shopping-cart"></i>
              <span>Carrito</span>
              @if (cartItems().length > 0) {
                <span class="cart-badge">{{ cartItems().length }}</span>
              }
            </button>
          </div>
        </div>
      </div>

      <div class="marketplace-container">
        <!-- Sidebar Filters -->
        <aside class="filters-sidebar">
          <div class="filter-section">
            <h3>Categorías</h3>
            <div class="filter-options">
              @for (category of categories; track category) {
                <div class="filter-option">
                  <p-checkbox
                    [inputId]="category"
                    [value]="category"
                    [(ngModel)]="selectedCategories"
                    (onChange)="applyFilters()"
                  />
                  <label [for]="category">{{ category }}</label>
                </div>
              }
            </div>
          </div>

          <div class="filter-section">
            <h3>Precio</h3>
            <div class="price-filter">
              <p-slider
                [ngModel]="priceRange"
                [min]="0"
                [max]="200"
                [step]="5"
                (onChange)="onSliderChange()"
              />
              <div class="price-inputs">
                <input
                  type="number"
                  pInputText
                  [value]="priceRange[0]"
                  (input)="onPriceInputChange(0, +$any($event.target).value)"
                  min="0"
                />
                <span>-</span>
                <input
                  type="number"
                  pInputText
                  [value]="priceRange[1]"
                  (input)="onPriceInputChange(1, +$any($event.target).value)"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div class="filter-section">
            <h3>Marca</h3>
            <div class="filter-options">
              @for (brand of brands; track brand) {
                <div class="filter-option">
                  <p-checkbox
                    [inputId]="brand"
                    [value]="brand"
                    [(ngModel)]="selectedBrands"
                    (onChange)="applyFilters()"
                  />
                  <label [for]="brand">{{ brand }}</label>
                </div>
              }
            </div>
          </div>

          <div class="filter-section">
            <h3>Disponibilidad</h3>
            <div class="filter-option">
              <p-checkbox
                inputId="inStock"
                [(ngModel)]="filters.inStock"
                (onChange)="applyFilters()"
              />
              <label for="inStock">Solo en stock</label>
            </div>
            <div class="filter-option">
              <p-checkbox
                inputId="onSale"
                [(ngModel)]="filters.onSale"
                (onChange)="applyFilters()"
              />
              <label for="onSale">En oferta</label>
            </div>
          </div>

          <button class="clear-filters-btn" (click)="clearFilters()">
            <i class="pi pi-times"></i>
            Limpiar filtros
          </button>
        </aside>

        <!-- Main Content -->
        <main class="products-main">
          <!-- Toolbar -->
          <div class="products-toolbar">
            <div class="results-count">
              {{ filteredProducts().length }} productos encontrados
            </div>
            <div class="toolbar-actions">
              <div class="sort-options">
                <label>Ordenar por:</label>
                <p-select
                  [(ngModel)]="sortBy"
                  [options]="sortOptions"
                  optionLabel="label"
                  optionValue="value"
                  (onChange)="applySorting()"
                  styleClass="sort-select"
                />
              </div>
              <div class="view-options">
                <button class="view-btn active">
                  <i class="pi pi-th-large"></i>
                </button>
                <button class="view-btn">
                  <i class="pi pi-list"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Products Grid -->
          <div class="products-grid">
            @for (product of filteredProducts(); track product.id) {
              <div class="product-card">
                @if (product.discount) {
                  <span class="product-discount">-{{ product.discount }}%</span>
                }
                <div class="product-image" (click)="openProductDetail(product)">
                  <img [src]="product.image" [alt]="product.name" />
                  @if (product.stock === 0) {
                    <div class="out-of-stock-overlay">
                      <span>Agotado</span>
                    </div>
                  }
                </div>
                <div class="product-info">
                  <span class="product-category">{{ product.category }}</span>
                  <h3 (click)="openProductDetail(product)">{{ product.name }}</h3>
                  <p class="product-description">{{ product.description }}</p>
                  <div class="product-rating">
                    <div class="stars">
                      @for (star of [1,2,3,4,5]; track star) {
                        <i class="pi pi-star-fill" [class.filled]="star <= product.rating"></i>
                      }
                    </div>
                    <span>({{ product.reviews }})</span>
                  </div>
                  <div class="product-footer">
                    <div class="product-price">
                      @if (product.originalPrice) {
                        <span class="original-price">{{ product.originalPrice | currency:'EUR' }}</span>
                      }
                      <span class="current-price">{{ product.price | currency:'EUR' }}</span>
                    </div>
                    <button
                      class="add-to-cart-btn"
                      (click)="addToCart(product)"
                      [disabled]="product.stock === 0"
                    >
                      <i class="pi pi-shopping-cart"></i>
                      {{ product.stock === 0 ? 'Agotado' : 'Añadir' }}
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>

          @if (filteredProducts().length === 0) {
            <div class="no-products">
              <i class="pi pi-inbox"></i>
              <p>No se encontraron productos</p>
              <button class="clear-filters-btn" (click)="clearFilters()">
                Limpiar filtros
              </button>
            </div>
          }
        </main>
      </div>

      <!-- Cart Sidebar -->
      <div class="cart-sidebar" [class.open]="cartOpen()">
        <div class="cart-header">
          <h2>Carrito de Compras</h2>
          <button class="close-cart-btn" (click)="toggleCart()">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="cart-content">
          @if (cartItems().length === 0) {
            <div class="empty-cart">
              <i class="pi pi-shopping-cart"></i>
              <p>Tu carrito está vacío</p>
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
                <span>Total:</span>
                <span class="total-amount">{{ cartTotal() | currency:'EUR' }}</span>
              </div>
              <button class="checkout-btn" (click)="checkout()">
                Proceder al pago
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
                <span>({{ product.reviews }} reseñas)</span>
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
                  {{ product.stock > 0 ? 'En stock (' + product.stock + ' unidades)' : 'Agotado' }}
                </span>
              </div>
              <div class="product-actions">
                <button
                  class="add-to-cart-btn-large"
                  (click)="addToCart(product)"
                  [disabled]="product.stock === 0"
                >
                  <i class="pi pi-shopping-cart"></i>
                  {{ product.stock === 0 ? 'Agotado' : 'Añadir al carrito' }}
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
      max-width: 1400px;
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

    /* Container */
    .marketplace-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
    }

    /* Filters Sidebar */
    .filters-sidebar {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      height: fit-content;
      position: sticky;
      top: 1rem;
    }

    .filter-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .filter-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .filter-section h3 {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .filter-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .filter-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-option label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .price-filter {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .price-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .price-inputs input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-sm);
      background: var(--surface-hover);
      color: var(--text-primary);
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
    }

    .price-inputs span {
      flex-shrink: 0;
    }

    /* Force slider to fit container */
    :host ::ng-deep .p-slider {
      width: 100% !important;
    }

    :host ::ng-deep .p-slider .p-slider-range {
      background: var(--primary-color) !important;
    }

    :host ::ng-deep .p-slider .p-slider-handle {
      background: var(--primary-color) !important;
    }

    .clear-filters-btn {
      width: 100%;
      padding: 0.75rem;
      background: none;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .clear-filters-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    /* Products Main */
    .products-main {
      min-height: 600px;
    }

    .products-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: var(--surface-card);
      border-radius: var(--radius-md);
    }

    .results-count {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .toolbar-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .sort-options {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sort-options label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .sort-select {
      min-width: 180px;
    }

    .view-options {
      display: flex;
      gap: 0.25rem;
    }

    .view-btn {
      padding: 0.5rem;
      background: none;
      border: 1px solid var(--surface-border);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .view-btn:first-child {
      border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    }

    .view-btn:last-child {
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    }

    .view-btn.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .product-card {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      overflow: hidden;
      transition: all var(--transition-fast);
      cursor: pointer;
      position: relative;
    }

    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .product-discount {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: var(--red-500);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      z-index: 1;
    }

    .product-image {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
      background: var(--surface-hover);
    }

    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--transition-normal);
    }

    .product-card:hover .product-image img {
      transform: scale(1.05);
    }

    .out-of-stock-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1.125rem;
    }

    .product-info {
      padding: 1rem;
    }

    .product-category {
      font-size: 0.75rem;
      color: var(--primary-color);
      font-weight: 500;
      text-transform: uppercase;
    }

    .product-info h3 {
      margin: 0.5rem 0 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
    }

    .product-description {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0 0 0.75rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .product-rating {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
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

    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .product-price {
      display: flex;
      flex-direction: column;
    }

    .original-price {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      text-decoration: line-through;
    }

    .current-price {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .add-to-cart-btn {
      padding: 0.5rem 1rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .add-to-cart-btn:hover:not(:disabled) {
      background: var(--primary-color-dark);
      transform: translateY(-2px);
    }

    .add-to-cart-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .no-products {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--surface-card);
      border-radius: var(--radius-md);
    }

    .no-products i {
      font-size: 3rem;
      color: var(--text-tertiary);
      margin-bottom: 1rem;
    }

    .no-products p {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0 0 1rem;
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
      color: var(--red-500);
      cursor: pointer;
      padding: 0.5rem;
    }

    .cart-footer {
      padding: 1.5rem;
      border-top: 1px solid var(--surface-border);
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
      padding: 0.875rem;
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
    }

    /* Product Detail */
    .product-detail {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .product-detail-image {
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .product-detail-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .product-detail-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .product-detail-info h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .product-price-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .product-price-section .original-price {
      font-size: 1rem;
      color: var(--text-tertiary);
      text-decoration: line-through;
    }

    .product-price-section .current-price {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .discount-badge {
      background: var(--red-500);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 600;
    }

    .product-stock {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .product-stock .in-stock {
      color: #10b981;
    }

    .product-stock .out-stock {
      color: var(--red-500);
    }

    .add-to-cart-btn-large {
      padding: 0.875rem 1.5rem;
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
    }

    .add-to-cart-btn-large:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .marketplace-container {
        grid-template-columns: 1fr;
      }

      .filters-sidebar {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .header-right {
        flex-direction: column;
      }

      .search-bar {
        width: 100%;
      }

      .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 1rem;
      }

      .cart-sidebar {
        width: 100%;
        right: -100%;
      }
    }
  `]
})
export class MarketplacePageComponent {
  private messageService = inject(MessageService);

  // Products
  products = signal<Product[]>([
    {
      id: '1',
      name: 'Cama Ortopédica Premium',
      description: 'Cama ortopédica de memoria viscoelástica para perros grandes y articulaciones sensibles',
      price: 45.99,
      originalPrice: 59.99,
      category: 'Camas',
      subcategory: 'Perros',
      image: 'https://images.unsplash.com/photo-1596492780631-5c5b38d4eb5c?w=400&h=300&fit=crop',
      rating: 4.5,
      reviews: 128,
      stock: 15,
      brand: 'PetComfort',
      discount: 23
    },
    {
      id: '2',
      name: 'Comida Premium Natural',
      description: 'Alimento natural sin cereales para gatos adultos, ingredientes de alta calidad',
      price: 29.99,
      category: 'Alimentación',
      subcategory: 'Gatos',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop',
      rating: 4.8,
      reviews: 256,
      stock: 50,
      brand: 'NaturalPet'
    },
    {
      id: '3',
      name: 'Juguete Interactivo Inteligente',
      description: 'Juguete electrónico que estimula el intelecto de tu perro',
      price: 19.99,
      originalPrice: 24.99,
      category: 'Juguetes',
      subcategory: 'Perros',
      image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&h=300&fit=crop',
      rating: 4.2,
      reviews: 89,
      stock: 30,
      brand: 'PetSmart',
      discount: 20
    },
    {
      id: '4',
      name: 'Correa Retráctil Premium',
      description: 'Correa retráctil de 5 metros con sistema de frenado seguro',
      price: 24.99,
      category: 'Accesorios',
      subcategory: 'Perros',
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop',
      rating: 4.6,
      reviews: 167,
      stock: 25,
      brand: 'PetSafe'
    },
    {
      id: '5',
      name: 'Arena Aglomerante Premium',
      description: 'Arena para gatos de alta absorción con control de olores',
      price: 15.99,
      category: 'Higiene',
      subcategory: 'Gatos',
      image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400&h=300&fit=crop',
      rating: 4.7,
      reviews: 312,
      stock: 100,
      brand: 'CatBest'
    },
    {
      id: '6',
      name: 'Transportín Aprobado',
      description: 'Transportín homologado para viajes en avión y coche',
      price: 89.99,
      originalPrice: 109.99,
      category: 'Transporte',
      subcategory: 'General',
      image: 'https://images.unsplash.com/photo-1589924691195-41432c84c161?w=400&h=300&fit=crop',
      rating: 4.4,
      reviews: 95,
      stock: 8,
      brand: 'PetTravel',
      discount: 18
    },
    {
      id: '7',
      name: 'Rascador de Cartón',
      description: 'Rascador ecológico de cartón reciclado con catnip incluido',
      price: 12.99,
      category: 'Gatos',
      subcategory: 'Gatos',
      image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop',
      rating: 4.3,
      reviews: 203,
      stock: 45,
      brand: 'CatScratch'
    },
    {
      id: '8',
      name: 'Bebedero Automático',
      description: 'Fuente de agua filtrada para mascotas, capacidad 2L',
      price: 34.99,
      category: 'Hidratación',
      subcategory: 'General',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop',
      rating: 4.6,
      reviews: 178,
      stock: 20,
      brand: 'PetHydrate'
    }
  ]);

  // Cart
  cart = signal<CartItem[]>([]);
  cartOpen = signal(false);

  // Filters
  searchQuery = '';
  categories = ['Camas', 'Alimentación', 'Juguetes', 'Accesorios', 'Higiene', 'Transporte', 'Gatos', 'Hidratación'];
  brands = ['PetComfort', 'NaturalPet', 'PetSmart', 'PetSafe', 'CatBest', 'PetTravel', 'CatScratch', 'PetHydrate'];
  selectedCategories: string[] = [];
  selectedBrands: string[] = [];
  priceRange: [number, number] = [0, 200];
  filters: FilterOptions = {
    categories: [],
    brands: [],
    priceRange: [0, 200],
    inStock: false,
    onSale: false
  };

  onSliderChange() {
    // Slider has already updated priceRange, just apply filters
    this.applyFilters();
  }

  onPriceInputChange(index: number, value: number) {
    const newPriceRange: [number, number] = [...this.priceRange];
    newPriceRange[index] = value;
    this.priceRange = newPriceRange;
    this.applyFilters();
  }

  // Sorting
  sortBy: SortOption = 'popularity';
  sortOptions = [
    { label: 'Popularidad', value: 'popularity' },
    { label: 'Precio: Menor a Mayor', value: 'price-asc' },
    { label: 'Precio: Mayor a Menor', value: 'price-desc' },
    { label: 'Nombre A-Z', value: 'name' },
    { label: 'Mejor Valorados', value: 'rating' }
  ];

  // Product Detail
  productDetailVisible = signal(false);
  selectedProduct = signal<Product | null>(null);

  // Computed
  cartItems = computed(() => this.cart());
  cartTotal = computed(() => {
    return this.cart().reduce((total, item) => total + (item.product.price * item.quantity), 0);
  });

  filteredProducts = computed(() => {
    let result = [...this.products()];

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (this.selectedCategories.length > 0) {
      result = result.filter(p => this.selectedCategories.includes(p.category));
    }

    // Brand filter
    if (this.selectedBrands.length > 0) {
      result = result.filter(p => this.selectedBrands.includes(p.brand));
    }

    // Price filter
    result = result.filter(p => p.price >= this.priceRange[0] && p.price <= this.priceRange[1]);

    // In stock filter
    if (this.filters.inStock) {
      result = result.filter(p => p.stock > 0);
    }

    // On sale filter
    if (this.filters.onSale) {
      result = result.filter(p => p.discount && p.discount > 0);
    }

    // Apply sorting
    this.applySortingToArray(result);

    return result;
  });

  // Methods
  toggleCart() {
    this.cartOpen.update(open => !open);
  }

  addToCart(product: Product) {
    const existingItem = this.cart().find(item => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        this.cart.update(items =>
          items.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
        this.messageService.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'Cantidad actualizada en el carrito'
        });
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Límite alcanzado',
          detail: 'No hay más stock disponible'
        });
      }
    } else {
      this.cart.update(items => [...items, { product, quantity: 1 }]);
      this.messageService.add({
        severity: 'success',
        summary: 'Añadido',
        detail: 'Producto añadido al carrito'
      });
    }
  }

  removeFromCart(product: Product) {
    this.cart.update(items => items.filter(item => item.product.id !== product.id));
    this.messageService.add({
      severity: 'info',
      summary: 'Eliminado',
      detail: 'Producto eliminado del carrito'
    });
  }

  updateQuantity(product: Product, delta: number) {
    this.cart.update(items =>
      items.map(item => {
        if (item.product.id === product.id) {
          const newQuantity = item.quantity + delta;
          if (newQuantity > 0 && newQuantity <= product.stock) {
            return { ...item, quantity: newQuantity };
          }
        }
        return item;
      })
    );
  }

  applyFilters() {
    this.filters.categories = this.selectedCategories;
    this.filters.brands = this.selectedBrands;
    // Don't update priceRange here to avoid infinite loop
  }

  applySorting() {
    // Sorting is handled in computed property
  }

  applySortingToArray(products: Product[]) {
    switch (this.sortBy) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'popularity':
      default:
        products.sort((a, b) => b.reviews - a.reviews);
        break;
    }
  }

  clearFilters() {
    this.selectedCategories = [];
    this.selectedBrands = [];
    this.priceRange = [0, 200];
    this.filters = {
      categories: [],
      brands: [],
      priceRange: [0, 200],
      inStock: false,
      onSale: false
    };
    this.searchQuery = '';
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se han restablecido todos los filtros'
    });
  }

  openProductDetail(product: Product) {
    this.selectedProduct.set(product);
    this.productDetailVisible.set(true);
  }

  checkout() {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'El proceso de pago estará disponible próximamente'
    });
  }
}
