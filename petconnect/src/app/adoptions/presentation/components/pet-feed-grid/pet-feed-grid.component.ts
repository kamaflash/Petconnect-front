import { Component, signal, computed, inject, OnInit, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

export interface FilterConfig {
  type: 'text' | 'checkbox' | 'select' | 'range';
  key: string;
  label: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface ColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'image' | 'badge' | 'price' | 'date';
  icon?: string;
}

export interface FilterOptions {
  [key: string]: any;
}

@Component({
  selector: 'app-pet-feed-grid',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    FormsModule,
    CheckboxModule,
    TranslocoModule,
  ],
  template: `
    <div class="feed-grid-container">
      <!-- Mobile Filters Toggle -->
      <div class="mobile-filters-header">
        <button class="filters-toggle-btn" (click)="toggleFilters()">
          <i class="pi pi-sliders-h"></i>
          <span>{{ 'feedGrid.filters' | transloco }}</span>
          @if (hasActiveFilters()) {
            <span class="filter-badge">{{ getActiveFilterCount() }}</span>
          }
        </button>
        <div class="results-count-mobile">
          {{ filteredItems().length }} {{ 'feedGrid.results' | transloco }}{{ filteredItems().length !== 1 ? 's' : '' }}
        </div>
      </div>

      <div class="feed-container">
        <!-- Filters Sidebar -->
        <aside class="filters-sidebar" [class.collapsed]="filtersCollapsed()">
          <div class="filter-header">
            <h3>{{ 'feedGrid.filters' | transloco }}</h3>
            <button class="close-filters-btn" (click)="toggleFilters()">
              <i class="pi pi-times"></i>
            </button>
          </div>

          @for (filter of filterConfigs; track filter.key) {
            <div class="filter-section">
              <h3>{{ filter.label }}</h3>

              @if (filter.type === 'text') {
                <div class="search-filter">
                  <i class="pi pi-search"></i>
                  <input
                    type="text"
                    pInputText
                    [placeholder]="filter.placeholder"
                    [(ngModel)]="localFilters[filter.key]"
                    (ngModelChange)="onFilterChange()"
                  />
                </div>
              }

              @if (filter.type === 'checkbox' && filter.options) {
                <div class="filter-options">
                  @for (option of filter.options; track option.value) {
                    <div class="filter-option">
                      <p-checkbox
                        [inputId]="filter.key + '-' + option.value"
                        [value]="option.value"
                        [(ngModel)]="localFilters[filter.key]"
                        (onChange)="onFilterChange()"
                      />
                      <label [for]="filter.key + '-' + option.value">{{ option.label }}</label>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <button class="clear-filters-btn" (click)="clearFilters()">
            <i class="pi pi-times"></i>
            {{ 'feedGrid.clear' | transloco }}
          </button>
        </aside>

        <!-- Main Content -->
        <main class="items-main">
          <!-- Results count -->
          <div class="results-header">
            <div class="results-count">
              {{ filteredItems().length }} {{ itemLabel }} {{ 'feedGrid.found' | transloco }}{{ filteredItems().length !== 1 ? 's' : '' }}
            </div>
          </div>

          <!-- Items Grid -->
          <div class="items-grid">
            @for (item of filteredItems(); track $any(item)[itemKeyField]) {
              <div class="item-card" (click)="onItemClick(item)">
                @for (column of columnConfigs; track column.key) {
                  @if (column.type === 'image') {
                    <div class="item-image-container">
                      <img [src]="$any(item)[column.key]" [alt]="$any(item)[column.key + 'Alt'] || ''" />
                      @if ($any(item)[column.key + 'Overlay']) {
                        <div class="item-status-overlay">
                          <span class="status-badge" [class]="'status-' + $any(item)[column.key + 'Status']">
                            {{ $any(item)[column.key + 'StatusLabel'] }}
                          </span>
                        </div>
                      }
                    </div>
                  }
                }

                <div class="item-content">
                  @for (column of columnConfigs; track column.key) {
                    @if (column.type === 'text' || column.type === 'badge') {
                      <div class="item-field">
                        @if (column.icon) {
                          <i class="pi" [class]="column.icon"></i>
                        }
                        <span>{{ $any(item)[column.key] }}</span>
                      </div>
                    }

                    @if (column.type === 'price') {
                      <div class="item-price">
                        @if ($any(item)[column.key + 'Original']) {
                          <span class="original-price">{{ $any(item)[column.key + 'Original'] | currency:'EUR' }}</span>
                        }
                        <span class="current-price">{{ $any(item)[column.key] | currency:'EUR' }}</span>
                      </div>
                    }

                    @if (column.type === 'date') {
                      <div class="item-date">
                        <div class="date-badge">
                          <span class="date-day">{{ $any(item)[column.key] | date:'dd' }}</span>
                          <span class="date-month">{{ $any(item)[column.key] | date:'MMM' }}</span>
                        </div>
                      </div>
                    }
                  }
                </div>
              </div>
            }
          </div>

          @if (filteredItems().length === 0) {
            <div class="no-items">
              <i class="pi pi-inbox"></i>
              <p>{{ 'feedGrid.noResults' | transloco: { items: itemLabel } }}</p>
              <button class="clear-filters-btn" (click)="clearFilters()">
                {{ 'feedGrid.clear' | transloco }}
              </button>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .feed-grid-container { min-height: 100vh; background: var(--surface-bg); }

    /* Mobile Filters Header */
    .mobile-filters-header {
      display: none;
      padding: 1rem;
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      position: sticky;
      top: 350px;
      z-index: 100;
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
    }

    .filters-toggle-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
      position: relative;
    }

    .filters-toggle-btn:hover {
      background: var(--primary-color-dark);
      transform: translateY(-1px);
    }

    .filter-badge {
      background: white;
      color: var(--primary-color);
      border-radius: var(--radius-full);
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      min-width: 1.25rem;
      text-align: center;
    }

    .results-count-mobile {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Container */
    .feed-container { max-width: var(--max-page-width); margin: 0 auto; padding: 0 2rem 2rem; display: grid; grid-template-columns: 280px 1fr; gap: 2rem; }

    /* Filters Sidebar */
    .filters-sidebar {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      height: fit-content;
      position: sticky;
      top: 1rem;
      max-height: calc(100vh - 2rem);
      overflow-y: auto;
    }

    .filter-header {
      display: none;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .filter-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .close-filters-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
    }

    .close-filters-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .filter-section { margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--surface-border); }
    .filter-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .filter-section h3 { margin: 0 0 1rem; font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
    .search-filter { position: relative; }
    .search-filter i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); }
    .search-filter input { width: 100%; padding: 0.625rem 1rem 0.625rem 2.5rem; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); background: var(--surface-hover); color: var(--text-primary); }
    .filter-options { display: flex; flex-direction: column; gap: 0.75rem; }
    .filter-option { display: flex; align-items: center; gap: 0.5rem; }
    .filter-option label { font-size: 0.875rem; color: var(--text-secondary); cursor: pointer; }
    .clear-filters-btn { width: 100%; padding: 0.75rem; background: none; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast); display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .clear-filters-btn:hover { background: var(--surface-hover); color: var(--text-primary); }

    /* Main Content */
    .items-main { min-height: 600px; }
    .results-header { margin-bottom: 1.5rem; }
    .results-count { font-size: 0.875rem; color: var(--text-secondary); }

    /* Items Grid */
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .item-card { background: var(--surface-card); border-radius: var(--radius-md); overflow: hidden; transition: all var(--transition-fast); cursor: pointer; }
    .item-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .item-image-container { position: relative; width: 100%; height: 250px; overflow: hidden; background: var(--surface-hover); }
    .item-image-container img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--transition-normal); }
    .item-card:hover .item-image-container img { transform: scale(1.05); }
    .item-status-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
    .status-badge { padding: 0.5rem 1.5rem; border-radius: var(--radius-full); font-weight: 600; font-size: 0.875rem; }
    .item-content { padding: 1.25rem; }
    .item-field { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary); }
    .item-field i { color: var(--primary-color); }
    .item-price { display: flex; align-items: center; gap: 0.5rem; margin: 0.5rem 0; }
    .original-price { font-size: 0.875rem; color: var(--text-tertiary); text-decoration: line-through; }
    .current-price { font-size: 1.125rem; font-weight: 700; color: var(--primary-color); }
    .item-date { display: flex; align-items: center; gap: 0.5rem; }
    .date-badge { display: flex; flex-direction: column; align-items: center; background: var(--primary-color-light); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); }
    .date-day { font-weight: 700; font-size: 1.25rem; color: var(--primary-color); }
    .date-month { font-size: 0.7rem; text-transform: uppercase; color: var(--primary-color); font-weight: 600; }
    .no-items { text-align: center; padding: 4rem 2rem; background: var(--surface-card); border-radius: var(--radius-md); }
    .no-items i { font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem; }
    .no-items p { font-size: 1.125rem; color: var(--text-secondary); margin: 0 0 1rem; }

    /* Tablet */
    @media (max-width: 1024px) {
      .feed-container { grid-template-columns: 1fr; }
      .filters-sidebar {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        border-radius: 0;
        max-height: 100vh;
        transform: translateX(-100%);
        transition: transform var(--transition-normal);
      }

      .filters-sidebar:not(.collapsed) {
        transform: translateX(0);
      }

      .filter-header {
        display: flex;
      }

      .mobile-filters-header {
        display: flex;
      }
    }

    /* Mobile */
    @media (max-width: 768px) {
      .feed-container { padding: 0 1rem 2rem; }
      .items-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PetFeedGridComponent<T = any> implements OnInit, OnChanges {
  private router = inject(Router);

  // Generic inputs
  @Input() items: T[] = [];
  @Input() itemLabel = 'elementos';
  @Input() itemKeyField = 'id';
  @Input() filterConfigs: FilterConfig[] = [];
  @Input() columnConfigs: ColumnConfig[] = [];
  @Input() initialFilters: FilterOptions = {};

  // Internal state
  private itemsSignal = signal<T[]>([]);
  localFilters: FilterOptions = {};

  filtersCollapsed = signal(true);

  // Outputs
  @Output() filtersChange = new EventEmitter<FilterOptions>();
  @Output() itemClick = new EventEmitter<T>();

  ngOnInit(): void {
    // Initialize local filters from config
    this.filterConfigs.forEach(config => {
      if (config.type === 'checkbox' && config.options) {
        this.localFilters[config.key] = [];
      } else {
        this.localFilters[config.key] = '';
      }
    });

    // Apply initial filters if provided
    if (Object.keys(this.initialFilters).length > 0) {
      this.localFilters = { ...this.initialFilters };
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.itemsSignal.set(this.items || []);
    }
  }

  // Computed
  filteredItems = computed(() => {
    const currentItems = this.itemsSignal();
    if (!currentItems || currentItems.length === 0) {
      return [];
    }

    let result = [...currentItems];

    // Apply filters
    Object.keys(this.localFilters).forEach(key => {
      const filterValue = this.localFilters[key];

      if (Array.isArray(filterValue) && filterValue.length > 0) {
        // Multi-select filter
        result = result.filter((item: any) => filterValue.includes(item[key]));
      } else if (filterValue && typeof filterValue === 'string') {
        // Text search filter
        const query = filterValue.toLowerCase();
        result = result.filter((item: any) => {
          const value = item[key];
          return value && value.toString().toLowerCase().includes(query);
        });
      }
    });

    return result;
  });

  toggleFilters(): void {
    this.filtersCollapsed.update(value => !value);
  }

  onFilterChange(): void {
    this.filtersChange.emit({ ...this.localFilters });
  }

  hasActiveFilters(): boolean {
    return Object.values(this.localFilters).some(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    });
  }

  getActiveFilterCount(): number {
    let count = 0;
    Object.values(this.localFilters).forEach(value => {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (value) {
        count++;
      }
    });
    return count;
  }

  clearFilters(): void {
    this.filterConfigs.forEach(config => {
      if (config.type === 'checkbox' && config.options) {
        this.localFilters[config.key] = [];
      } else {
        this.localFilters[config.key] = '';
      }
    });
    this.filtersChange.emit({ ...this.localFilters });
  }

  onItemClick(item: T): void {
    this.itemClick.emit(item);
  }
}
