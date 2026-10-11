import { Component, signal, computed, OnInit, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { SkeletonModule } from 'primeng/skeleton';
import { DynamicFormComponent, DynamicFormConfig } from '../../../../shared/presentation/components/dynamic-form/dynamic-form.component';

export interface FilterConfig {
  type: 'text' | 'checkbox' | 'select' | 'range';
  key: string;
  label: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
  searchFields?: string[];
  matchValue?: (item: unknown, value: string) => boolean;
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
    TranslocoModule,
    SkeletonModule,
    DynamicFormComponent,
  ],
  template: `
    <div class="feed-grid-container">
      <details class="catalog-toolbar">
        <summary class="filters-summary">
          <span class="filters-summary-title">
            <i class="pi pi-sliders-h" aria-hidden="true"></i>
            {{ 'feedGrid.filters' | transloco }}
          </span>
          <span class="filters-summary-meta">
            <span class="results-count">
              {{ filteredItems().length }} {{ itemLabel }} {{ 'feedGrid.found' | transloco }}{{ filteredItems().length !== 1 ? 's' : '' }}
            </span>
            <i class="pi pi-chevron-down accordion-chevron" aria-hidden="true"></i>
          </span>
        </summary>
        <div class="filter-panel">
          <app-dynamic-form
            class="catalog-filters-form"
            [config]="filterFormConfig"
            [formData]="localFilters"
            (formValueChange)="onFilterValuesChange($event)"
          />
          @if (hasActiveFilters()) {
            <button type="button" class="clear-filters-btn" (click)="clearFilters()" [attr.aria-label]="'feedGrid.clear' | transloco">
              <i class="pi pi-times" aria-hidden="true"></i>
              {{ 'feedGrid.clear' | transloco }}
            </button>
          }
        </div>
      </details>

      <main class="items-main" [attr.aria-busy]="loading">
        @if (loading) {
          <div class="items-grid skeleton-grid" aria-hidden="true">
            @for (placeholder of skeletonItems; track placeholder) {
              <article class="item-card skeleton-item">
                <p-skeleton height="250px" />
                <div class="item-content skeleton-item-content">
                  <p-skeleton width="68%" height="1rem" />
                  <p-skeleton width="44%" height=".85rem" />
                  <p-skeleton width="82%" height=".85rem" />
                </div>
              </article>
            }
          </div>
        } @else {
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
        }
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .feed-grid-container { width: 100%; min-width: 0; }
    .catalog-toolbar { margin: 0 auto 1.25rem; padding: 1rem 1.25rem; border-radius: var(--radius-lg); background: var(--surface-card); }
    .filters-summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; color: var(--text-primary); cursor: pointer; list-style: none; }
    .filters-summary::-webkit-details-marker { display: none; }
    .filters-summary-title, .filters-summary-meta { display: inline-flex; align-items: center; gap: .75rem; }
    .filters-summary-title { font-weight: 650; }
    .filters-summary-title > i { color: var(--primary-color); }
    .accordion-chevron { color: var(--text-secondary); transition: transform var(--transition-fast); }
    .catalog-toolbar[open] .accordion-chevron { transform: rotate(180deg); }
    .filter-panel { display: grid; gap: .75rem; padding-top: 1rem; }
    :host ::ng-deep .catalog-filters-form .dynamic-form-container { background: transparent; }
    :host ::ng-deep .catalog-filters-form .dynamic-form { padding: 0; }
    :host ::ng-deep .catalog-filters-form .form-fields { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: .85rem; }
    :host ::ng-deep .catalog-filters-form .field-label { color: var(--text-secondary); font-size: .8rem; font-weight: 650; }
    :host ::ng-deep .catalog-filters-form .form-field { gap: .4rem; }
    .clear-filters-btn { min-height: 2.75rem; padding: .65rem .8rem; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); background: transparent; color: var(--text-secondary); cursor: pointer; white-space: nowrap; }
    .clear-filters-btn:hover { background: var(--surface-hover); color: var(--text-primary); }
    .results-count { color: var(--text-secondary); font-size: .85rem; white-space: nowrap; }
    .items-main { min-height: 300px; }
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
    .skeleton-item { cursor: default; }
    .skeleton-item-content { display: grid; gap: .8rem; }
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

    @media (max-width: 768px) {
      .items-grid { grid-template-columns: 1fr; }
      .catalog-toolbar { padding: 1rem; }
      .filters-summary-meta { gap: .5rem; }
      .results-count { white-space: normal; text-align: right; }
    }
  `]
})
export class PetFeedGridComponent<T = any> implements OnInit, OnChanges {
  // Generic inputs
  @Input() items: T[] = [];
  @Input() itemLabel = 'elementos';
  @Input() itemKeyField = 'id';
  @Input() filterConfigs: FilterConfig[] = [];
  @Input() columnConfigs: ColumnConfig[] = [];
  @Input() initialFilters: FilterOptions = {};
  @Input() loading = false;

  // Internal state
  private itemsSignal = signal<T[]>([]);
  private filtersSignal = signal<FilterOptions>({});
  localFilters: FilterOptions = {};
  filterFormConfig: DynamicFormConfig = { fields: [], showSubmit: false };
  readonly skeletonItems = [1, 2, 3, 4, 5, 6];

  // Outputs
  @Output() filtersChange = new EventEmitter<FilterOptions>();
  @Output() itemClick = new EventEmitter<T>();

  ngOnInit(): void {
    // Initialize local filters from config
    this.filterConfigs.forEach(config => {
      if ((config.type === 'checkbox' || config.type === 'range') && config.options) {
        this.localFilters[config.key] = [];
      } else {
        this.localFilters[config.key] = '';
      }
    });

    // Apply initial filters if provided
    if (Object.keys(this.initialFilters).length > 0) {
      this.localFilters = { ...this.initialFilters };
    }
    this.filtersSignal.set({ ...this.localFilters });
    this.filterFormConfig = this.createFilterFormConfig();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.itemsSignal.set(this.items || []);
    }
    if (changes['filterConfigs'] && !changes['filterConfigs'].firstChange) {
      const nextFilters: FilterOptions = {};
      this.filterConfigs.forEach(config => {
        nextFilters[config.key] = this.localFilters[config.key]
          ?? (config.type === 'checkbox' || config.type === 'range' ? [] : '');
      });
      this.localFilters = nextFilters;
      this.filterFormConfig = this.createFilterFormConfig();
      this.filtersSignal.set({ ...this.localFilters });
    }
  }

  // Computed
  filteredItems = computed(() => {
    const currentItems = this.itemsSignal();
    const currentFilters = this.filtersSignal();
    if (!currentItems || currentItems.length === 0) {
      return [];
    }

    let result = [...currentItems];

    // Apply filters
    Object.keys(currentFilters).forEach(key => {
      const filterValue = currentFilters[key];

      if (Array.isArray(filterValue) && filterValue.length > 0) {
        result = result.filter((item: any) => {
          const config = this.filterConfigs.find(candidate => candidate.key === key);
          return filterValue.some((value: string) => this.matchesFilter(item, config, value));
        });
      } else if (filterValue && typeof filterValue === 'string') {
        const config = this.filterConfigs.find(candidate => candidate.key === key);
        result = result.filter(item => this.matchesFilter(item, config, filterValue));
      }
    });

    return result;
  });

  onFilterValuesChange(values: Record<string, unknown>): void {
    this.localFilters = { ...values };
    this.filtersSignal.set(this.localFilters);
    this.filtersChange.emit({ ...this.localFilters });
  }

  private createFilterFormConfig(): DynamicFormConfig {
    return {
      showSubmit: false,
      fields: this.filterConfigs
        .filter(filter => filter.type !== 'range')
        .map(filter => ({
          key: filter.key,
          label: filter.label,
          type: filter.type === 'text' ? 'input' as const : filter.type === 'checkbox' ? 'multiselect' as const : 'select' as const,
          placeholder: filter.placeholder || filter.label,
          showClear: true,
          defaultValue: filter.type === 'checkbox' ? [] : '',
          options: filter.options,
        })),
    };
  }

  private matchesFilter(item: unknown, config: FilterConfig | undefined, value: string): boolean {
    if (config?.matchValue) {
      return config.matchValue(item, value);
    }
    if (config?.searchFields) {
      const record = item as Record<string, unknown>;
      const query = value.toLocaleLowerCase();
      return config.searchFields.some(field =>
        String(record[field] ?? '').toLocaleLowerCase().includes(query)
      );
    }
    const record = item as Record<string, unknown>;
    return String(record[config?.key ?? ''] ?? '').toLocaleLowerCase() === value.toLocaleLowerCase();
  }

  hasActiveFilters(): boolean {
    return Object.values(this.localFilters).some(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    });
  }

  clearFilters(): void {
    this.filterConfigs.forEach(config => {
      if ((config.type === 'checkbox' || config.type === 'range') && config.options) {
        this.localFilters[config.key] = [];
      } else {
        this.localFilters[config.key] = '';
      }
    });
    this.localFilters = { ...this.localFilters };
    this.filtersSignal.set(this.localFilters);
    this.filtersChange.emit({ ...this.localFilters });
  }

  onItemClick(item: T): void {
    this.itemClick.emit(item);
  }
}
