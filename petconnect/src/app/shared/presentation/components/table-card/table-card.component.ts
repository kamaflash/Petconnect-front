import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';

export interface TableCardItem {
  id: string;
  name: string;
  avatar: string;
  description?: string;
  rating?: number;
  reviews?: number;
  tags?: string[];
  location?: string;
  userId?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-table-card',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    AvatarModule,
    InputTextModule,
    FormsModule,
    RouterLink,
    SkeletonModule,
  ],
  template: `
    <div class="table-card-container">
      <!-- Buscador y filtros -->
      <div class="table-card-header" *ngIf="showSearch()">
        <div class="search-wrapper">
          <div class="relative w-full">
            <i class="pi pi-search search-icon"></i>
            <input
              type="text"
              pInputText
              placeholder="Buscar..."
              class="search-input"
              [ngModelOptions]="{standalone: true}"
              [(ngModel)]="searchValue"
              (ngModelChange)="searchChange.emit($event)"
            />
            <button
              *ngIf="searchValue()"
              type="button"
              class="clear-button"
              (click)="clearSearch()"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>
        <div class="filters-container" *ngIf="filters().length > 0">
          <button
            *ngFor="let filter of filters()"
            class="filter-button"
            [class.active]="activeFilter() === filter.value"
            (click)="filterChange.emit(filter.value)"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

  <!-- Grid de cards -->
      <div class="table-card-grid">
        <!-- Loading Skeletons -->
        @if (loading()) {
          <div class="table-card skeleton-card" *ngFor="let i of [1, 2, 3, 4, 5]">
            <div class="table-card-header-content">
              <p-skeleton shape="circle" size="3rem" />
              <div class="table-card-info">
                <p-skeleton width="10rem" height="1rem" styleClass="mb-2" />
                <p-skeleton width="6rem" height="0.875rem" />
              </div>
            </div>
            <p-skeleton width="100%" height="0.75rem" styleClass="mt-2" />
            <p-skeleton width="80%" height="0.75rem" styleClass="mt-1" />
          </div>
        } @else {
          <!-- Card para añadir (solo en modo editable) -->
          <div class="add-card" *ngIf="editable()" (click)="onAdd.emit()">
            <div class="add-card-content">
              <i class="pi pi-plus add-icon"></i>
              <span class="add-label">Añadir</span>
            </div>
          </div>

          <div class="table-card" *ngFor="let item of filteredItems()">
            <div class="table-card-header-content">
              <p-avatar [image]="item.avatar" shape="circle" size="large"></p-avatar>
              <div class="table-card-info">
                <a *ngIf="item.userId" [routerLink]="'/profile/' + item.userId" class="table-card-name">{{ item.name }}</a>
                <p *ngIf="!item.userId" class="table-card-name">{{ item.name }}</p>
                <p class="table-card-description" *ngIf="item.description">{{ item.description }}</p>
                <p class="table-card-location" *ngIf="item.location">
                  <i class="pi pi-map-marker"></i> {{ item.location }}
                </p>
                <div class="table-card-rating" *ngIf="item.rating !== undefined">
                  <i class="pi pi-star-fill" *ngFor="let star of [1,2,3,4,5]"></i>
                  <span class="rating-value">{{ item.rating }} ({{ item.reviews }})</span>
                </div>
              </div>
            </div>
            <div class="table-card-tags" *ngIf="item.tags">
              <p-tag
                *ngFor="let tag of item.tags"
                [value]="tag"
                styleClass="p-tag-sm"
              />
            </div>
            <div class="table-card-actions">
              <ng-content select="[card-actions]"></ng-content>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .table-card-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .table-card-header {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .search-wrapper {
      position: relative;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--bitbucket-text-secondary);
      z-index: 1;
    }

    .search-input {
      width: 100%;
      padding-left: 2.5rem;
    }

    .clear-button {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--bitbucket-text-secondary);
      cursor: pointer;
      padding: 0.25rem;
    }

    .filters-container {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: flex-start;
    }

    .filter-button {
      padding: 0.375rem 0.75rem;
      background: none;
      border: 1px solid var(--bitbucket-border);
      border-radius: 0.375rem;
      cursor: pointer;
      color: var(--bitbucket-text-secondary);
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .filter-button:hover {
      background-color: var(--bitbucket-bg-hover);
    }

    .filter-button.active {
      background-color: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .table-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .table-card {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .dark .table-card {
      background-color: var(--bitbucket-header-bg);
    }

    /* Add card */
    .add-card {
      background-color: var(--bitbucket-header-bg);
      border: 2px dashed var(--bitbucket-border);
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      min-height: 100px;
    }

    .add-card:hover {
      border-color: var(--primary-color);
      background-color: rgba(148, 199, 72, 0.05);
    }

    .dark .add-card {
      background-color: var(--bitbucket-header-bg);
    }

    .dark .add-card:hover {
      border-color: var(--primary-color);
      background-color: rgba(148, 199, 72, 0.1);
    }

    .add-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .add-icon {
      font-size: 2.5rem;
      color: var(--bitbucket-text-secondary);
      transition: color 0.3s ease;
    }

    .add-card:hover .add-icon {
      color: var(--primary-color);
    }

    .add-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--bitbucket-text-secondary);
      transition: color 0.3s ease;
    }

    .add-card:hover .add-label {
      color: var(--primary-color);
    }

    .table-card-header-content {
      display: flex;
      gap: 0.75rem;
    }

    .table-card-info {
      flex: 1;
    }

    .table-card-name {
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 0;
      font-size: 1rem;
      text-decoration: none;
    }

    .table-card-name:hover {
      text-decoration: underline;
    }

    .table-card-description {
      color: var(--bitbucket-text-secondary);
      font-size: 0.875rem;
      margin: 0.25rem 0 0 0;
    }

    .table-card-location {
      color: var(--bitbucket-text-secondary);
      font-size: 0.75rem;
      margin: 0.25rem 0 0 0;
    }

    .table-card-location i {
      margin-right: 0.25rem;
    }

    .table-card-rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-top: 0.25rem;
    }

    .table-card-rating i {
      color: #f59e0b;
      font-size: 0.75rem;
    }

    .rating-value {
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
    }

    .table-card-tags {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .table-card-actions {
      margin-top: auto;
      padding-top: 0.5rem;
    }

    /* Skeleton card */
    .skeleton-card {
      pointer-events: none;
    }
  `]
})
export class TableCardComponent {
  items = input<TableCardItem[]>([]);
  filters = input<{ label: string; value: string }[]>([]);
  showSearch = input(true);
  activeFilter = input('all');
  filteredItems = input<TableCardItem[]>([]);
  editable = input(false);
  loading = input(false);

  searchChange = output<string>();
  filterChange = output<string>();
  onAdd = output<void>();

  searchValue = signal('');

  clearSearch() {
    this.searchValue.set('');
    this.searchChange.emit('');
  }
}
