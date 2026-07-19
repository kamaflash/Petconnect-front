import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableCardComponent, TableCardItem } from '../../../shared/presentation/components/table-card/table-card.component';
import { TabsComponent, Tab } from '../../../shared/presentation/components/tabs/tabs.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';

interface Vet {
  id: string;
  name: string;
  avatar: string;
  clinic: string;
  rating: number;
  reviews: number;
  specialty: string;
  location: string;
  distance: number;
  isFollowing: boolean;
  userId: string;
  availability?: string;
  price?: string;
  verified?: boolean;
}

interface VetTip {
  id: string;
  vet: {
    name: string;
    avatar: string;
    userId: string;
  };
  content: string;
  timestamp: Date;
  likes: number;
  liked?: boolean;
  category?: string;
}

interface Vaccine {
  id: string;
  name: string;
  age: string;
  description: string;
  petType: 'dogs' | 'cats' | 'exotic';
}

interface Appointment {
  id: string;
  vet: {
    name: string;
    avatar: string;
    userId: string;
  };
  petName: string;
  date: Date;
  time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface Specialty {
  id: string;
  name: string;
  icon: string;
  description: string;
  vetsCount: number;
}

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
  rating: number;
}

@Component({
  selector: 'app-vet-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    AvatarModule,
    AvatarGroupModule,
    InputTextModule,
    DialogModule,
    ProgressBarModule,
    FormsModule,
    RouterLink,
    TableCardComponent,
    ToastModule,
    ChipModule,
    BadgeModule,
    TabsComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="vet-page">
      <div class="vet-container">
        <!-- Tabs -->
        <app-tabs
          [tabs]="vetTabs()"
          [activeTab]="activeTab()"
          (tabChange)="onTabChange($event)"
        />

        <!-- Veterinarios - 2 columnas: tabla + especialidades -->
        <div class="vet-layout" *ngIf="activeTab() === 'vets'">
          <div class="vet-main">
            <app-table-card
              [items]="vetTableItems()"
              [filters]="vetFilters"
              [showSearch]="true"
              [activeFilter]="activeVetFilter()"
              [filteredItems]="filteredVetItems()"
              (searchChange)="onVetSearch($event)"
              (filterChange)="onVetFilter($event)"
            >
              <ng-template card-actions let-item>
                <p-button
                  [label]="item.isFollowing ? 'Siguiendo' : 'Seguir'"
                  [icon]="item.isFollowing ? 'pi pi-check' : 'pi pi-user-plus'"
                  [styleClass]="item.isFollowing ? 'p-button-sm p-button-success' : 'p-button-sm'"
                  (onClick)="toggleFollow(getVetById(item.id))"
                />
              </ng-template>
            </app-table-card>
          </div>
          <div class="vet-sidebar">
            <div class="sidebar-card">
              <div class="sidebar-header">
                <span class="material-symbols-rounded">favorite</span>
                <h3>Especialidades</h3>
              </div>
              <div class="specialty-list">
                <div class="specialty-item" *ngFor="let specialty of specialties()">
                  <div class="specialty-icon-small">
                    <span class="material-symbols-rounded">{{ specialty.icon }}</span>
                  </div>
                  <div class="specialty-info-small">
                    <span class="specialty-name">{{ specialty.name }}</span>
                    <span class="specialty-count">{{ specialty.vetsCount }} veterinarios</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vacunas - 2 columnas: tabla vacunas + consejos -->
        <div class="vaccines-layout" *ngIf="activeTab() === 'vaccines'">
            <div class="vaccines-main">
            <div class="vaccines-header">
              <span class="material-symbols-rounded">calendar_month</span>
              <h3>Calendario de Vacunas</h3>
            </div>
            <div class="vaccine-filters">
              <button
                class="vaccine-filter-btn"
                [class.active]="activeVaccineFilter() === 'dogs'"
                (click)="setActiveVaccineFilter('dogs')"
              >
                <span class="material-symbols-rounded">pets</span>
                <span>Perros</span>
              </button>
              <button
                class="vaccine-filter-btn"
                [class.active]="activeVaccineFilter() === 'cats'"
                (click)="setActiveVaccineFilter('cats')"
              >
                <span class="material-symbols-rounded">cat</span>
                <span>Gatos</span>
              </button>
              <button
                class="vaccine-filter-btn"
                [class.active]="activeVaccineFilter() === 'exotic'"
                (click)="setActiveVaccineFilter('exotic')"
              >
                <span class="material-symbols-rounded">auto_awesome</span>
                <span>Exóticos</span>
              </button>
            </div>
            <div class="vaccines-card">
              <div class="vaccines-table">
                <div class="vaccine-table-header">
                  <span>Vacuna</span>
                  <span>Edad</span>
                  <span>Descripción</span>
                </div>
                <div class="vaccine-table-row" *ngFor="let vaccine of filteredVaccines()">
                  <span class="vaccine-table-name">{{ vaccine.name }}</span>
                  <span class="vaccine-table-age">{{ vaccine.age }}</span>
                  <span class="vaccine-table-desc">{{ vaccine.description }}</span>
                </div>
              </div>
            </div>
          </div>
            <div class="vaccines-sidebar">
            <div class="sidebar-card">
              <div class="sidebar-header">
                <span class="material-symbols-rounded">lightbulb</span>
                <h3>Consejos</h3>
              </div>
              <div class="tips-list">
                <div class="tip-item" *ngFor="let tip of vetTips()">
                  <p-avatar [image]="tip.vet.avatar" shape="circle"></p-avatar>
                  <div class="tip-info">
                    <span class="tip-vet">{{ tip.vet.name }}</span>
                    <p class="tip-content">{{ tip.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Citas -->
        <div class="appointments-layout" *ngIf="activeTab() === 'appointments'">
          <div class="appointments-header">
            <h2>Mis Citas</h2>
            <p-button
              label="Nueva Cita"
              styleClass="p-button-primary"
              (onClick)="showAppointmentDialog()"
            >
              <span class="material-symbols-rounded button-icon">add</span>
            </p-button>
          </div>
          <div class="appointments-list">
            <div class="appointment-card" *ngFor="let appointment of appointments()">
              <div class="appointment-date-badge">
                <span class="appointment-day">{{ appointment.date | date:'dd' }}</span>
                <span class="appointment-month">{{ appointment.date | date:'MMM' }}</span>
              </div>
              <div class="appointment-info">
                <div class="appointment-vet">
                  <p-avatar [image]="appointment.vet.avatar" shape="circle"></p-avatar>
                  <span class="appointment-vet-name">{{ appointment.vet.name }}</span>
                </div>
                <p class="appointment-pet">Mascota: {{ appointment.petName }}</p>
                <p class="appointment-time">{{ appointment.time }} • {{ appointment.type }}</p>
              </div>
              <p-tag
                [value]="appointment.status === 'scheduled' ? 'Programada' : appointment.status === 'completed' ? 'Completada' : 'Cancelada'"
                [severity]="appointment.status === 'scheduled' ? 'info' : appointment.status === 'completed' ? 'success' : 'danger'"
              />
              <div class="appointment-actions">
                <p-button
                  styleClass="p-button-sm p-button-text"
                  pTooltip="Editar"
                >
                  <span class="material-symbols-rounded button-icon">edit</span>
                </p-button>
                <p-button
                  styleClass="p-button-sm p-button-text"
                  pTooltip="Cancelar"
                  (onClick)="cancelAppointment(appointment)"
                >
                  <span class="material-symbols-rounded button-icon">close</span>
                </p-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Farmacia -->
        <div class="pharmacy-layout" *ngIf="activeTab() === 'pharmacy'">
          <div class="pharmacy-header">
            <h2>Farmacia Veterinaria</h2>
            <p-button
              label="Ver carrito"
              styleClass="p-button-primary"
              [badge]="cartItems().toString()"
            >
              <span class="material-symbols-rounded button-icon">shopping_cart</span>
            </p-button>
          </div>
          <div class="pharmacy-grid">
            <div class="product-card" *ngFor="let product of products()">
              <div class="product-image">
                <img [src]="product.image" [alt]="product.name" />
              </div>
              <div class="product-info">
                <h3>{{ product.name }}</h3>
                <p-tag [value]="product.category" styleClass="p-tag-info"></p-tag>
                <div class="product-meta">
                  <span class="product-price">{{ product.price | currency:'EUR' }}</span>
                <div class="product-rating">
                  <span class="material-symbols-rounded star-icon" *ngFor="let star of [1,2,3,4,5]">star</span>
                  <span>({{ product.rating }})</span>
                </div>
                </div>
              </div>
              <p-button
                label="Añadir"
                styleClass="p-button-sm p-button-primary"
                (onClick)="addToCart(product)"
              >
                <span class="material-symbols-rounded button-icon">shopping_cart</span>
              </p-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Diálogo de Búsqueda -->
      <p-dialog
        header="Buscar Veterinario"
        [(visible)]="searchDialogVisible"
        [modal]="true"
        [style]="{ width: '450px' }"
      >
        <div class="search-content">
          <div class="p-input-icon-left w-full mb-3">
            <i class="pi pi-search"></i>
            <input
              type="text"
              pInputText
              placeholder="Buscar por nombre o clínica..."
              class="w-full"
              [(ngModel)]="searchQuery"
            />
          </div>
          <div class="search-results">
            <div class="search-item" *ngFor="let vet of searchResults()">
              <p-avatar [image]="vet.avatar" shape="circle"></p-avatar>
              <div class="search-item-info">
                <a [routerLink]="'/profile/' + vet.userId" class="search-item-name">{{ vet.name }}</a>
                <span class="search-item-clinic">{{ vet.clinic }}</span>
              </div>
              <p-button
                icon="pi pi-user-plus"
                styleClass="p-button-sm p-button-text"
              />
            </div>
          </div>
        </div>
      </p-dialog>

      <!-- Diálogo de Nueva Cita -->
      <p-dialog
        header="Programar Nueva Cita"
        [(visible)]="appointmentDialogVisible"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        <div class="appointment-form">
          <div class="form-group">
            <label>Veterinario</label>
            <select [(ngModel)]="selectedVet" class="w-full">
              <option value="">Seleccionar veterinario</option>
              <option *ngFor="let vet of vetOptions" [value]="vet.value">{{ vet.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Mascota</label>
            <select [(ngModel)]="selectedPet" class="w-full">
              <option value="">Seleccionar mascota</option>
              <option *ngFor="let pet of petOptions" [value]="pet.value">{{ pet.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Fecha</label>
            <input type="date" pInputText [(ngModel)]="appointmentDate" class="w-full" />
          </div>
          <div class="form-group">
            <label>Hora</label>
            <input type="time" pInputText [(ngModel)]="appointmentTime" class="w-full" />
          </div>
          <div class="form-group">
            <label>Tipo de consulta</label>
            <select [(ngModel)]="selectedAppointmentType" class="w-full">
              <option value="">Seleccionar tipo</option>
              <option *ngFor="let type of appointmentTypes" [value]="type.value">{{ type.label }}</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <p-button
            label="Cancelar"
            styleClass="p-button-text"
            (onClick)="closeAppointmentDialog()"
          />
          <p-button
            label="Programar"
            icon="pi pi-check"
            styleClass="p-button-primary"
            (onClick)="scheduleAppointment()"
          />
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    .vet-page {
      min-height: 100vh;
      background-color: var(--bitbucket-header-bg);
      transition: background-color 0.3s ease;
    }

    .dark .vet-page {
      background-color: #111827;
    }

    /* Container */
    .vet-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem 2rem;
    }

    /* Vet Layout - 2 columns */
    .vet-layout {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 2rem;
    }

    .vet-main {
      min-width: 0;
    }

    .vet-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Vaccines Layout - 2 columns */
    .vaccines-layout {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 2rem;
    }

    .vaccines-main {
      min-width: 0;
    }

    .vaccines-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Vaccine Filters */
    .vaccine-filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .vaccine-filter-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 1rem;
      background: none;
      border: 1px solid var(--bitbucket-border);
      border-radius: 0.375rem;
      cursor: pointer;
      color: var(--bitbucket-text-secondary);
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .vaccine-filter-btn:hover {
      background-color: var(--bitbucket-bg-hover);
    }

    .vaccine-filter-btn.active {
      background-color: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    /* Sidebar */
    .sidebar-card {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      padding: 1.25rem;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--bitbucket-border);
    }

    .sidebar-header .material-symbols-rounded {
      color: var(--primary-color);
      font-size: 1.25rem;
    }

    .sidebar-header h3 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .specialty-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .specialty-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .specialty-icon-small {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-color-light);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color);
    }

    .specialty-icon-small .material-symbols-rounded {
      font-size: 1.25rem;
    }

    .specialty-info-small {
      flex: 1;
    }

    .specialty-name {
      font-weight: 500;
      font-size: 0.875rem;
      color: var(--bitbucket-text-primary);
    }

    .specialty-count {
      font-size: 0.7rem;
      color: var(--bitbucket-text-secondary);
    }

    .tips-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .tip-item {
      display: flex;
      gap: 0.5rem;
    }

    .tip-info {
      flex: 1;
    }

    .tip-vet {
      font-weight: 600;
      font-size: 0.75rem;
      color: var(--bitbucket-text-primary);
    }

    .tip-content {
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
      margin: 0;
    }

    /* Vaccines Table */
    .vaccines-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .vaccines-header .material-symbols-rounded {
      color: var(--primary-color);
      font-size: 1.5rem;
    }

    .vaccines-header h3 {
      margin: 0;
      font-size: 1.25rem;
    }

    .vaccines-card {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      padding: 1.25rem;
    }

    .vaccines-table {
      display: flex;
      flex-direction: column;
    }

    .vaccine-table-header {
      display: grid;
      grid-template-columns: 1fr 100px 2fr;
      gap: 1rem;
      padding: 0.5rem 0;
      border-bottom: 2px solid var(--bitbucket-border);
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--bitbucket-text-primary);
    }

    .vaccine-table-row {
      display: grid;
      grid-template-columns: 1fr 100px 2fr;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--bitbucket-border);
    }

    .vaccine-table-row:last-child {
      border-bottom: none;
    }

    .vaccine-table-name {
      font-weight: 500;
      color: var(--bitbucket-text-primary);
    }

    .vaccine-table-age {
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
    }

    .vaccine-table-desc {
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
    }

    /* Appointments */
    .appointments-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .appointments-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .appointments-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .appointment-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .appointment-date-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--primary-color-light);
      padding: 0.5rem;
      border-radius: 0.5rem;
      min-width: 50px;
    }

    .appointment-day {
      font-weight: 600;
      font-size: 1.25rem;
    }

    .appointment-month {
      font-size: 0.6rem;
      text-transform: uppercase;
      color: var(--bitbucket-text-secondary);
    }

    .appointment-info {
      flex: 1;
    }

    .appointment-vet {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .appointment-vet-name {
      font-weight: 600;
      color: var(--bitbucket-text-primary);
    }

    .appointment-pet {
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
      margin: 0;
    }

    .appointment-time {
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
    }

    .appointment-actions {
      display: flex;
      gap: 0.25rem;
    }

    /* Pharmacy */
    .pharmacy-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .pharmacy-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pharmacy-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .pharmacy-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1.5rem;
    }

    .product-card {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .product-image img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 0.375rem;
    }

    .product-info h3 {
      margin: 0 0 0.25rem;
      font-size: 0.875rem;
    }

    .product-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .product-price {
      font-weight: 600;
      color: var(--primary-color);
    }

    .product-rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
    }

    .product-rating .star-icon {
      color: #fbbf24;
      font-size: 0.875rem;
    }

    .button-icon {
      font-size: 1rem;
      line-height: 1;
    }

    /* Search Dialog */
    .search-content {
      padding: 0.5rem 0;
    }

    .search-results {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .search-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .search-item-info {
      flex: 1;
    }

    .search-item-name {
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 0;
      text-decoration: none;
    }

    .search-item-clinic {
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
    }

    /* Appointment Form */
    .appointment-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.25rem;
      color: var(--bitbucket-text-primary);
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--bitbucket-border);
      margin-top: 1rem;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .vet-layout,
      .vaccines-layout {
        grid-template-columns: 1fr;
      }

      .pharmacy-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .vet-container {
        padding: 0 0.5rem 1rem;
      }
    }
  `]
})
export class VetPageComponent {
  private messageService = inject(MessageService);

  // Tabs
  activeTab = signal('vets');
  searchDialogVisible = signal(false);
  appointmentDialogVisible = signal(false);
  activeVaccineFilter = signal('dogs');

  // Search
  searchQuery = signal('');
  activeVetFilter = signal('all');

  // Appointment form
  selectedVet: string | null = null;
  selectedPet: string | null = null;
  appointmentDate = '';
  appointmentTime = '';
  selectedAppointmentType: string | null = null;

  // Stats
  totalVets = 127;
  upcomingAppointments = 2;
  totalPets = 3;

  // Vets
  vets = signal<Vet[]>([
    {
      id: '1',
      name: 'Dr. Carlos Martínez',
      avatar: 'https://i.pravatar.cc/150?img=10',
      clinic: 'Veterinaria Central',
      rating: 4.8,
      reviews: 128,
      specialty: 'Médico Veterinario',
      location: 'Madrid, España',
      distance: 2.5,
      isFollowing: true,
      userId: '3',
      availability: 'Lun-Vie 9:00-18:00',
      price: 'Desde 35€',
      verified: true
    },
    {
      id: '2',
      name: 'Dra. Ana López',
      avatar: 'https://i.pravatar.cc/150?img=11',
      clinic: 'Clínica Animalia',
      rating: 4.9,
      reviews: 256,
      specialty: 'Especialista en Animales Exóticos',
      location: 'Barcelona, España',
      distance: 5.2,
      isFollowing: false,
      userId: '2',
      availability: 'Mar-Sáb 10:00-20:00',
      price: 'Desde 45€',
      verified: true
    },
    {
      id: '3',
      name: 'Dr. Luis García',
      avatar: 'https://i.pravatar.cc/150?img=12',
      clinic: 'Hospital Veterinario',
      rating: 4.7,
      reviews: 89,
      specialty: 'Cirugía Veterinaria',
      location: 'Valencia, España',
      distance: 8.1,
      isFollowing: true,
      userId: '3',
      availability: 'Lun-Fri 8:00-17:00',
      price: 'Desde 50€',
      verified: true
    }
  ]);

  // Vet Tips
  vetTips = signal<VetTip[]>([
    {
      id: '1',
      vet: {
        name: 'Dr. Carlos Martínez',
        avatar: 'https://i.pravatar.cc/150?img=10',
        userId: '3'
      },
      content: '¿Sabías que los perros pueden detectar cambios en el azúcar de la sangre? Son excelentes compañeros para personas con diabetes.',
      timestamp: new Date(),
      likes: 42,
      category: 'Curiosidad'
    },
    {
      id: '2',
      vet: {
        name: 'Dra. Ana López',
        avatar: 'https://i.pravatar.cc/150?img=11',
        userId: '2'
      },
      content: 'Los gatos persas necesitan cepillado diario para evitar nudos en su pelaje. ¡No lo olvides!',
      timestamp: new Date(),
      likes: 28,
      category: 'Gatos'
    },
    {
      id: '3',
      vet: {
        name: 'Dr. Luis García',
        avatar: 'https://i.pravatar.cc/150?img=12',
        userId: '3'
      },
      content: 'La desparasitación mensual es clave para prevenir pulgas y garrapatas en perros y gatos.',
      timestamp: new Date(),
      likes: 56,
      category: 'Prevención'
    },
    {
      id: '4',
      vet: {
        name: 'Dra. Elena Ruiz',
        avatar: 'https://i.pravatar.cc/150?img=13',
        userId: '4'
      },
      content: 'Los conejos necesitan vitamina C en su dieta. Asegúrate de incluir vegetales ricos en vitamina C.',
      timestamp: new Date(),
      likes: 18,
      category: 'Exóticos'
    }
  ]);

  // Vaccines - Informative table
  vaccines = signal<Vaccine[]>([
    // Dog vaccines
    { id: 'd1', name: 'Rabia', age: '12-16 semanas', description: 'Vacuna obligatoria para todos los perros', petType: 'dogs' },
    { id: 'd2', name: 'Moquillo', age: '6-8 semanas', description: 'Enfermedad viral fatal, refuerzos cada 3-4 semanas', petType: 'dogs' },
    { id: 'd3', name: 'Parvovirus', age: '6-8 semanas', description: 'Enfermedad intestinal grave, refuerzos combinados', petType: 'dogs' },
    { id: 'd4', name: 'Leptospirosis', age: '12-16 semanas', description: 'Bacterias transmitidas por agua contaminada', petType: 'dogs' },
    { id: 'd5', name: 'Bordetella', age: '6-8 semanas', description: 'Tos de kennel, requerida para guarderías', petType: 'dogs' },
    // Cat vaccines
    { id: 'c1', name: 'Rabia', age: '8-12 semanas', description: 'Vacuna obligatoria para gatos', petType: 'cats' },
    { id: 'c2', name: 'Panleucopenia', age: '6-8 semanas', description: 'Virus felino, refuerzos combinados', petType: 'cats' },
    { id: 'c3', name: 'Calicivirus', age: '8-12 semanas', description: 'Infección respiratoria y ulcerativa', petType: 'cats' },
    { id: 'c4', name: 'Herpesvirus', age: '8-12 semanas', description: 'Conjuntivitis y infecciones respiratorias', petType: 'cats' },
    { id: 'c5', name: 'Leucemia felina', age: '9-12 semanas', description: 'Solo para gatos con riesgo de exposición', petType: 'cats' },
    // Exotic vaccines
    { id: 'e1', name: 'Rabia', age: '12-16 semanas', description: 'Vacuna recomendada para animales exóticos', petType: 'exotic' },
    { id: 'e2', name: 'Clostridiosis', age: '6-8 semanas', description: 'Infección bacteriana en hurones', petType: 'exotic' },
    { id: 'e3', name: 'Tos de las ardillas', age: '8-12 semanas', description: 'Enfermedad respiratoria en roedores', petType: 'exotic' }
  ]);

  // Appointments
  appointments = signal<Appointment[]>([
    {
      id: '1',
      vet: {
        name: 'Dr. Carlos Martínez',
        avatar: 'https://i.pravatar.cc/150?img=10',
        userId: '3'
      },
      petName: 'Max',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      time: '10:30',
      type: 'Revisión general',
      status: 'scheduled'
    },
    {
      id: '2',
      vet: {
        name: 'Dra. Ana López',
        avatar: 'https://i.pravatar.cc/150?img=11',
        userId: '2'
      },
      petName: 'Luna',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      time: '15:00',
      type: 'Vacunación',
      status: 'scheduled'
    }
  ]);

  // Specialties
  specialties = signal<Specialty[]>([
    {
      id: '1',
      name: 'Medicina General',
      icon: 'favorite',
      description: 'Atención médica básica para todas las mascotas',
      vetsCount: 45
    },
    {
      id: '2',
      name: 'Cirugía',
      icon: 'medical_services',
      description: 'Procedimientos quirúrgicos especializados',
      vetsCount: 23
    },
    {
      id: '3',
      name: 'Dentista',
      icon: 'star',
      description: 'Cuidado dental para mascotas',
      vetsCount: 12
    },
    {
      id: '4',
      name: 'Exóticos',
      icon: 'auto_awesome',
      description: 'Especialistas en animales exóticos',
      vetsCount: 18
    },
    {
      id: '5',
      name: 'Emergencias',
      icon: 'bolt',
      description: 'Atención 24/7 para urgencias',
      vetsCount: 8
    },
    {
      id: '6',
      name: 'Nutrición',
      icon: 'nutrition',
      description: 'Asesoría nutricional personalizada',
      vetsCount: 15
    }
  ]);

  // Products
  products = signal<Product[]>([
    {
      id: '1',
      name: 'Alimento Húmedo Premium',
      image: 'https://images.unsplash.com/photo-1589923188900-117868750514?w=300&h=200&fit=crop',
      price: 12.99,
      category: 'Alimento',
      rating: 4.5
    },
    {
      id: '2',
      name: 'Collar Antipulgas',
      image: 'https://images.unsplash.com/photo-1583337173303-7332d01d2119?w=300&h=200&fit=crop',
      price: 19.99,
      category: 'Accesorios',
      rating: 4.2
    },
    {
      id: '3',
      name: 'Suplemento Vitamínico',
      image: 'https://images.unsplash.com/photo-1556912906-5503900e40d5?w=300&h=200&fit=crop',
      price: 24.99,
      category: 'Suplementos',
      rating: 4.7
    },
    {
      id: '4',
      name: 'Juguete Interactivo',
      image: 'https://images.unsplash.com/photo-1525247202454-352009006256?w=300&h=200&fit=crop',
      price: 15.99,
      category: 'Juguetes',
      rating: 4.3
    },
    {
      id: '5',
      name: 'Shampoo Medicado',
      image: 'https://images.unsplash.com/photo-1551601651-2d8bf4e40b1a?w=300&h=200&fit=crop',
      price: 18.50,
      category: 'Higiene',
      rating: 4.1
    },
    {
      id: '6',
      name: 'Desparasitante',
      image: 'https://images.unsplash.com/photo-1471864115232-930a7c6176c2?w=300&h=200&fit=crop',
      price: 22.99,
      category: 'Medicamentos',
      rating: 4.6
    }
  ]);

  // Options
  vetOptions = this.vets().map(v => ({ label: v.name, value: v.id }));
  petOptions = [
    { label: 'Max', value: 'max' },
    { label: 'Luna', value: 'luna' },
    { label: 'Rocky', value: 'rocky' }
  ];
  appointmentTypes = [
    { label: 'Revisión general', value: 'general' },
    { label: 'Vacunación', value: 'vaccination' },
    { label: 'Cirugía', value: 'surgery' },
    { label: 'Emergencia', value: 'emergency' }
  ];

  // Filters
  vetFilters = [
    { label: 'Todos', value: 'all' },
    { label: 'Cercanos', value: 'nearby' },
    { label: 'Favoritos', value: 'favorites' }
  ];

  // Computed
  vetTableItems = computed((): TableCardItem[] => {
    return this.vets().map(vet => ({
      id: vet.id,
      name: vet.name,
      avatar: vet.avatar,
      description: `${vet.specialty} • ${vet.location}`,
      tags: vet.isFollowing ? ['Siguiendo'] : [],
      location: vet.location,
      userId: vet.userId
    }));
  });

  filteredVetItems = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.vetTableItems();
    return this.vetTableItems().filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.location?.toLowerCase().includes(query)
    );
  });

  searchResults = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.vets();
    return this.vets().filter(vet =>
      vet.name.toLowerCase().includes(query) ||
      vet.clinic.toLowerCase().includes(query)
    );
  });

  filteredVaccines = computed(() => {
    return this.vaccines().filter(v => v.petType === this.activeVaccineFilter());
  });

  cartItems = computed(() => this.products().length);

  // Tabs configuration
  vetTabs = computed((): Tab[] => {
    return [
      { id: 'vets', label: 'Veterinarios', icon: 'favorite', iconType: 'material' },
      { id: 'vaccines', label: 'Vacunas', icon: 'calendar_month', iconType: 'material' },
      { id: 'appointments', label: 'Citas', icon: 'event', iconType: 'material' },
      { id: 'pharmacy', label: 'Farmacia', icon: 'shopping_cart', iconType: 'material' },
    ];
  });

  onTabChange(tabId: string) {
    this.setActiveTab(tabId);
  }

  // Methods
  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  setActiveVaccineFilter(filter: string) {
    this.activeVaccineFilter.set(filter);
  }

  showSearchDialog() {
    this.searchDialogVisible.set(true);
  }

  showAppointmentDialog() {
    this.appointmentDialogVisible.set(true);
  }

  closeAppointmentDialog() {
    this.appointmentDialogVisible.set(false);
    this.selectedVet = null;
    this.selectedPet = null;
    this.appointmentDate = '';
    this.appointmentTime = '';
    this.selectedAppointmentType = null;
  }

  onVetSearch(query: string) {
    this.searchQuery.set(query);
  }

  onVetFilter(filter: string) {
    this.activeVetFilter.set(filter);
  }

  getVetById(id: string): Vet | undefined {
    return this.vets().find(vet => vet.id === id);
  }

  toggleFollow(vet: Vet | undefined) {
    if (vet) {
      vet.isFollowing = !vet.isFollowing;
      this.messageService.add({
        severity: 'success',
        summary: vet.isFollowing ? 'Siguiendo' : 'Dejaste de seguir',
        detail: `${vet.isFollowing ? 'Ahora sigues a' : 'Ya no sigues a'} ${vet.name}`
      });
    }
  }

  toggleTipLike(tip: VetTip) {
    tip.likes += 1;
    this.messageService.add({
      severity: 'info',
      summary: 'Me gusta',
      detail: 'Has dado me gusta a este consejo'
    });
  }

  scheduleAppointment() {
    if (!this.selectedVet || !this.selectedPet || !this.appointmentDate || !this.appointmentTime) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Por favor completa todos los campos'
      });
      return;
    }

    const vet = this.getVetById(this.selectedVet);
    const pet = this.petOptions.find(p => p.value === this.selectedPet)?.label;
    const type = this.appointmentTypes.find(t => t.value === this.selectedAppointmentType)?.label;

    const newAppointment: Appointment = {
      id: 'a' + Date.now(),
      vet: {
        name: vet?.name || '',
        avatar: vet?.avatar || '',
        userId: vet?.userId || ''
      },
      petName: pet || '',
      date: new Date(this.appointmentDate),
      time: this.appointmentTime,
      type: type || '',
      status: 'scheduled'
    };

    this.appointments.update(a => [...a, newAppointment]);
    this.upcomingAppointments += 1;
    this.closeAppointmentDialog();

    this.messageService.add({
      severity: 'success',
      summary: 'Cita programada',
      detail: 'Tu cita ha sido programada exitosamente'
    });
  }

  cancelAppointment(appointment: Appointment) {
    appointment.status = 'cancelled';
    this.upcomingAppointments -= 1;
    this.messageService.add({
      severity: 'info',
      summary: 'Cita cancelada',
      detail: 'Has cancelado la cita'
    });
  }

  addToCart(product: Product) {
    this.messageService.add({
      severity: 'success',
      summary: 'Producto añadido',
      detail: `${product.name} ha sido añadido al carrito`
    });
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) return date.toLocaleDateString();
    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'hace un momento';
  }
}
