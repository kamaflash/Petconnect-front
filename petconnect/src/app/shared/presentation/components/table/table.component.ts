import { Component, input, output, effect, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, signal, computed, model, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

export interface TableColumn {
  field: string;
  header: string;
  type?: 'text' | 'number' | 'date' | 'status' | 'actions' | 'avatar' | 'badge';
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: any) => string;
  statusSeverity?: (value: any) => 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
  statusLabel?: (value: any) => string;
  actionIcon?: string;
  actionTooltip?: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    FormsModule,
    TooltipModule,
    SelectModule,
    TranslocoModule,
  ],
  template: `
    <div class="table-container">
      @if (title()) {
        <div class="table-header">
          <h2 class="table-title">{{ title() }}</h2>
        <div class="table-actions">
          <ng-content select="[table-actions]"></ng-content>
        </div>
        </div>
      }

      <div class="table-wrapper">
        <p-table
          #dt
          [value]="filteredData()"
          [paginator]="paginator()"
          [rows]="rows()"
          [rowsPerPageOptions]="rowsPerPageOptions()"
          [sortMode]="sortMode()"
          [loading]="loading()"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="{{ 'table.showing' | transloco }}"
          styleClass="p-datatable-modern"
        >
          <ng-template pTemplate="header">
            <tr>
              @for (col of columns(); track col.field) {
                <th
                  [pSortableColumn]="col.sortable !== false ? col.field : undefined"
                  [style.width]="col.width || 'auto'"
                  [class.text-center]="col.align === 'center'"
                  [class.text-right]="col.align === 'right'"
                >
                  <div class="flex items-center gap-1">
                    {{ col.header }}
                    @if (col.sortable !== false) {
                      <p-sortIcon [field]="col.field" />
                    }
                  </div>
                </th>
              }
            </tr>
            <tr>
              @for (col of columns(); track col.field) {
                <th>
                  @if (col.filterable !== false) {
                    @if (col.type === 'status') {
                      <p-select
                        [options]="getStatusOptions(col.field)"
                        [ngModelOptions]="{standalone: true}"
                        [(ngModel)]="filterValues[col.field]"
                        (onChange)="onFilterChange()"
                        [placeholder]="('table.all' | transloco)"
                        styleClass="w-full"
                        [showClear]="true"
                        appendTo="body"
                      />
                    } @else {
                      <input
                        pInputText
                        type="text"
                        [ngModelOptions]="{standalone: true}"
                        [(ngModel)]="filterValues[col.field]"
                        (ngModelChange)="onFilterChange()"
                        [placeholder]="('table.search' | transloco) + ' ' + col.header.toLowerCase()"
                        class="w-full"
                      />
                    }
                  }
                </th>
              }
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-rowData>
            <tr>
              @for (col of columns(); track col.field) {
                <td
                  [class.text-center]="col.align === 'center'"
                  [class.text-right]="col.align === 'right'"
                >
                  @if (col.type === 'status') {
                    <p-tag
                      [value]="col.statusLabel ? col.statusLabel(rowData[col.field]) : (col.format ? col.format(rowData[col.field], rowData) : rowData[col.field])"
                      [severity]="col.statusSeverity ? col.statusSeverity(rowData[col.field]) : 'info'"
                      [rounded]="true"
                    />
                  } @else if (col.type === 'actions') {
                    <div class="table-actions-buttons">
                      <p-button
                        icon="pi pi-eye"
                        severity="info"
                        [text]="true"
                        (onClick)="onView.emit(rowData)"
                        pTooltip="{{ 'table.viewProfile' | transloco }}"
                        tooltipPosition="top"
                      />
                      <p-button
                        icon="pi pi-pencil"
                        severity="secondary"
                        [text]="true"
                        (onClick)="onEdit.emit(rowData)"
                        pTooltip="{{ 'table.edit' | transloco }}"
                        tooltipPosition="top"
                      />
                      <p-button
                        icon="pi pi-trash"
                        severity="danger"
                        [text]="true"
                        (onClick)="onDelete.emit(rowData)"
                        pTooltip="{{ 'table.delete' | transloco }}"
                        tooltipPosition="top"
                      />
                      <ng-content select="[row-actions]"></ng-content>
                    </div>
                  } @else if (col.type === 'avatar') {
                    <div class="table-avatar">
                      <span class="avatar-initials">
                        {{ col.format ? col.format(rowData[col.field], rowData) : rowData[col.field] }}
                      </span>
                    </div>
                  } @else if (col.type === 'badge') {
                    <span class="table-badge">
                      {{ col.format ? col.format(rowData[col.field], rowData) : rowData[col.field] }}
                    </span>
                  } @else {
                    <span class="table-cell-text">
                      {{ col.format ? col.format(rowData[col.field], rowData) : rowData[col.field] }}
                    </span>
                  }
                </td>
              }
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td [attr.colspan]="columns().length" class="table-empty">
                <i class="pi pi-inbox"></i>
                <p>{{ 'table.empty' | transloco }}</p>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="loadingbody">
            <tr>
              <td [attr.colspan]="columns().length" class="table-loading">
                <i class="pi pi-spin pi-spinner"></i>
                <p>{{ 'table.loading' | transloco }}</p>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .table-container {
      width: 100%;
      background-color: var(--surface-card);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--surface-border);
      transition: all var(--transition-normal);
    }

    .dark .table-container {
      background-color: var(--surface-card);
      border-color: var(--surface-border);
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .dark .table-header {
      border-bottom-color: var(--surface-border);
    }

    .table-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .table-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .table-wrapper {
      overflow-x: auto;
      padding: 0;
    }

    /* ===== PRIMENG TABLE OVERRIDES - MODERN ===== */
    :host ::ng-deep .p-datatable {
      font-size: 0.875rem;
    }

    :host ::ng-deep .p-datatable.p-datatable-modern {
      border-radius: var(--radius-md);
    }

    :host ::ng-deep .p-datatable .p-datatable-thead > tr:first-child > th {
      background-color: var(--surface-card);
      color: var(--text-secondary);
      font-weight: 600;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--surface-border);
      border-top: none;
      border-left: none;
      border-right: none;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    :host ::ng-deep .p-datatable .p-datatable-thead > tr:nth-child(2) > th {
      background-color: var(--surface-card);
      padding: 0.625rem 1rem;
      border-bottom: 1px solid var(--surface-border);
      border-left: none;
      border-right: none;
    }

    .dark :host ::ng-deep .p-datatable .p-datatable-thead > tr:first-child > th {
      background-color: var(--surface-card);
      color: var(--text-secondary);
      border-bottom-color: var(--surface-border);
    }

    .dark :host ::ng-deep .p-datatable .p-datatable-thead > tr:nth-child(2) > th {
      background-color: var(--surface-card);
      border-bottom-color: var(--surface-border);
    }

    :host ::ng-deep .p-datatable .p-datatable-thead > tr > th .p-sortable-column-icon {
      color: var(--text-tertiary);
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr {
      transition: all var(--transition-fast);
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--surface-border);
      border-left: none;
      border-right: none;
      color: var(--text-primary);
    }

    .dark :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      border-bottom-color: var(--surface-border);
      color: var(--text-primary);
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover {
      background-color: var(--surface-hover);
    }

    .dark :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover {
      background-color: var(--surface-hover);
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:last-child > td {
      border-bottom: none;
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr.p-highlight {
      background-color: var(--primary-color-highlight);
    }

    .dark :host ::ng-deep .p-datatable .p-datatable-tbody > tr.p-highlight {
      background-color: rgba(var(--primary-color-rgb), 0.15);
    }

    /* ===== FILTER INPUTS ===== */
    :host ::ng-deep .p-datatable .p-datatable-thead > tr:nth-child(2) > th input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-sm);
      background-color: var(--surface-card);
      color: var(--text-primary);
      font-size: 0.8125rem;
      transition: all var(--transition-fast);
    }

    :host ::ng-deep .p-datatable .p-datatable-thead > tr:nth-child(2) > th input:hover {
      border-color: var(--primary-color);
    }

    :host ::ng-deep .p-datatable .p-datatable-thead > tr:nth-child(2) > th input:focus {
      outline: none;
      border-color: var(--primary-color) !important;
      box-shadow: 0 0 0 2px var(--primary-color-highlight) !important;
    }

    :host ::ng-deep .p-datatable .p-datatable-thead > tr:nth-child(2) > th .p-select {
      width: 100%;
    }

    :host ::ng-deep .p-datatable .p-datatable-thead > tr:nth-child(2) > th .p-select .p-select-label {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-sm);
      background-color: var(--surface-card);
      color: var(--text-primary);
      font-size: 0.8125rem;
    }

    /* ===== DROPDOWN OVERLAY Z-INDEX ===== */
    :host ::ng-deep .p-select-overlay {
      z-index: 1000 !important;
    }

    :host ::ng-deep .p-dropdown-panel {
      z-index: 1000 !important;
    }

    /* ===== PAGINATOR ===== */
    :host ::ng-deep .p-paginator {
      background-color: transparent;
      border-top: 1px solid var(--surface-border);
      padding: 0.875rem 1rem;
      color: var(--text-secondary);
    }

    .dark :host ::ng-deep .p-paginator {
      border-top-color: var(--surface-border);
      color: var(--text-secondary);
    }

    :host ::ng-deep .p-paginator .p-paginator-pages .p-paginator-page {
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
      min-width: 2.25rem;
      height: 2.25rem;
    }

    :host ::ng-deep .p-paginator .p-paginator-pages .p-paginator-page:hover {
      background-color: var(--surface-hover);
      color: var(--text-primary);
    }

    :host ::ng-deep .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
      background-color: var(--primary-color);
      color: white;
    }

    :host ::ng-deep .p-paginator .p-paginator-first,
    :host ::ng-deep .p-paginator .p-paginator-prev,
    :host ::ng-deep .p-paginator .p-paginator-next,
    :host ::ng-deep .p-paginator .p-paginator-last {
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      min-width: 2.25rem;
      height: 2.25rem;
      transition: all var(--transition-fast);
    }

    :host ::ng-deep .p-paginator .p-paginator-first:hover,
    :host ::ng-deep .p-paginator .p-paginator-prev:hover,
    :host ::ng-deep .p-paginator .p-paginator-next:hover,
    :host ::ng-deep .p-paginator .p-paginator-last:hover {
      background-color: var(--surface-hover);
      color: var(--text-primary);
    }

    :host ::ng-deep .p-paginator .p-dropdown {
      border-color: var(--surface-border);
      background-color: var(--surface-card);
      color: var(--text-primary);
      border-radius: var(--radius-sm);
    }

    .dark :host ::ng-deep .p-paginator .p-dropdown {
      border-color: var(--surface-border);
      background-color: var(--surface-card);
      color: var(--text-primary);
    }

    /* ===== TABLE ACTIONS ===== */
    .table-actions-buttons {
      display: flex;
      gap: 0.25rem;
      align-items: center;
    }

    .table-actions-buttons .p-button {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-sm);
    }

    .table-actions-buttons .p-button .p-button-icon {
      font-size: 0.875rem;
    }

    /* ===== TABLE AVATAR ===== */
    .table-avatar {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar-image {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--surface-border);
    }

    .avatar-initials {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background-color: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .dark .avatar-initials {
      background-color: var(--primary-color);
    }

    /* ===== TABLE BADGE ===== */
    .table-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      background-color: var(--surface-hover);
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 500;
    }

    .dark .table-badge {
      background-color: var(--surface-hover);
      color: var(--text-secondary);
    }

    /* ===== STATUS BADGES ===== */
    :host ::ng-deep .p-tag {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
    }

    /* ===== EMPTY STATE ===== */
    .table-empty {
      text-align: center !important;
      padding: 3rem 1rem !important;
    }

    .table-empty i {
      font-size: 3rem;
      color: var(--surface-border);
      display: block;
      margin-bottom: 0.75rem;
    }

    .table-empty p {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    /* ===== LOADING STATE ===== */
    .table-loading {
      text-align: center !important;
      padding: 3rem 1rem !important;
    }

    .table-loading i {
      font-size: 2rem;
      color: var(--primary-color);
      display: block;
      margin-bottom: 0.75rem;
    }

    .table-loading p {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    /* ===== CELL ALIGNMENT ===== */
    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
    }

    .text-center :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td,
    .text-right :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      text-align: inherit;
    }

    .flex {
      display: flex;
    }

    .items-center {
      align-items: center;
    }

    .gap-1 {
      gap: 0.25rem;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .table-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
      }

      .table-actions {
        width: 100%;
        flex-wrap: wrap;
      }

      :host ::ng-deep .p-datatable .p-datatable-thead > tr > th,
      :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
        padding: 0.625rem 0.75rem;
        font-size: 0.75rem;
      }

      :host ::ng-deep .p-datatable .p-datatable-thead > tr:nth-child(2) > th input {
        padding: 0.375rem 0.5rem;
        font-size: 0.75rem;
      }

      .table-wrapper {
        padding: 0;
      }

      .table-title {
        font-size: 1rem;
      }

      .table-actions-buttons .p-button {
        width: 1.75rem;
        height: 1.75rem;
      }

      .table-actions-buttons .p-button .p-button-icon {
        font-size: 0.75rem;
      }

      :host ::ng-deep .p-paginator {
        padding: 0.5rem;
        flex-wrap: wrap;
        gap: 0.25rem;
      }

      :host ::ng-deep .p-paginator .p-paginator-current {
        width: 100%;
        text-align: center;
        margin-bottom: 0.25rem;
      }
    }

    @media (max-width: 480px) {
      :host ::ng-deep .p-datatable .p-datatable-thead > tr > th,
      :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
        padding: 0.5rem 0.5rem;
        font-size: 0.7rem;
      }

      .table-header {
        padding: 0.75rem;
      }

      .table-title {
        font-size: 0.875rem;
      }

      .avatar-initials {
        width: 1.75rem;
        height: 1.75rem;
        font-size: 0.625rem;
      }

      .table-badge {
        padding: 0.125rem 0.5rem;
        font-size: 0.625rem;
      }
    }
  `]
})
export class TableComponent implements OnInit {
  private readonly transloco = inject(TranslocoService);

  // Inputs
  data = input<any[]>([]);
  columns = input<TableColumn[]>([]);
  title = input<string>('');
  paginator = input<boolean>(true);
  rows = input<number>(10);
  rowsPerPageOptions = input<number[]>([10, 25, 50]);
  sortMode = input<'single' | 'multiple'>('single');
  loading = input<boolean>(false);

  // Outputs
  onEdit = output<any>();
  onDelete = output<any>();
  onView = output<any>();

  // Filtros
  filterValues: { [key: string]: any } = {};
  filteredData = signal<any[]>([]);

  // Status options por campo
  private statusOptionsMap: { [key: string]: any[] } = {};

  constructor(private cdr: ChangeDetectorRef) {}

  // Efecto para inicializar filtros cuando cambian las columnas
  private initFiltersEffect = effect(() => {
    const columns = this.columns();
    if (columns && columns.length > 0) {
      this.initializeFilters(columns);
    }
  });

  // Efecto para actualizar datos filtrados cuando cambian los datos o filtros
  private updateDataEffect = effect(() => {
    const data = this.data();
    const columns = this.columns();
    const filterValues = { ...this.filterValues };

    if (data && data.length > 0 && columns && columns.length > 0) {
      this.applyFilters(data, columns, filterValues);
    } else if (data) {
      this.filteredData.set(data);
    }
  });

  ngOnInit(): void {
    const columns = this.columns();
    if (columns && columns.length > 0) {
      this.initializeFilters(columns);
    }
  }

  private initializeFilters(columns: TableColumn[]): void {
    // Resetear filtros
    this.filterValues = {};

    columns.forEach((col: TableColumn) => {
      if (col.filterable !== false) {
        this.filterValues[col.field] = null;
      }
    });

    // Actualizar opciones de status
    const data = this.data();
    if (data && data.length > 0) {
      this.updateStatusOptions(data, columns);
    }

    // Aplicar filtros iniciales
    this.applyFilters(data || [], columns, this.filterValues);
    this.cdr.detectChanges();
  }

  private updateStatusOptions(data: any[], columns: TableColumn[]): void {
    columns.forEach((col: TableColumn) => {
      if (col.type === 'status' && col.filterable !== false) {
        // Obtener valores únicos del campo
        const uniqueValues = data
          .map(item => item[col.field])
          .filter(val => val !== null && val !== undefined);

        const uniqueSet = [...new Set(uniqueValues)];

        this.statusOptionsMap[col.field] = [
          { label: this.transloco.translate('table.all'), value: null },
          ...uniqueSet.map(val => ({
            label: col.statusLabel ? col.statusLabel(val) : String(val),
            value: val
          }))
        ];
      }
    });
  }

  getStatusOptions(field: string): any[] {
    return this.statusOptionsMap[field] || [
      { label: this.transloco.translate('table.all'), value: null }
    ];
  }

  onFilterChange(): void {
    const data = this.data();
    const columns = this.columns();
    if (data && columns) {
      this.applyFilters(data, columns, this.filterValues);
    }
  }

  private applyFilters(data: any[], columns: TableColumn[], filterValues: { [key: string]: any }): void {
    let filtered = [...data];

    // Aplicar cada filtro
    columns.forEach((col: TableColumn) => {
      if (col.filterable !== false) {
        const filterValue = filterValues[col.field];

        // Solo aplicar si hay un valor de filtro
        if (filterValue && filterValue !== null && filterValue !== '') {
          filtered = filtered.filter(item => {
            const fieldValue = item[col.field];

            // Si no hay valor, no coincide
            if (fieldValue === null || fieldValue === undefined) {
              return false;
            }

            // Convertir a string para comparación
            const stringValue = String(fieldValue).toLowerCase();
            const stringFilter = String(filterValue).toLowerCase();

            return stringValue.includes(stringFilter);
          });
        }
      }
    });

    this.filteredData.set(filtered);
    this.cdr.detectChanges();
  }
}
