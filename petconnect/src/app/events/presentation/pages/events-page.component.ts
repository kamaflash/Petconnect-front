
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterLink } from '@angular/router';
import { ModalComponent } from '../../../shared/presentation/components/modal/modal';

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  location: string;
  address: string;
  type: 'walk' | 'fair' | 'contest' | 'meetup' | 'workshop' | 'charity';
  category: string;
  image: string;
  organizer: string;
  organizerImage: string;
  participants: number;
  maxParticipants?: number;
  price: number;
  isAttending: boolean;
  isFree: boolean;
  requirements?: string[];
  agenda?: { time: string; activity: string }[];
}

@Component({
  selector: 'app-events-page',
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
    CheckboxModule,
    AvatarModule,
    AvatarGroupModule,
    ToastModule,
    RouterLink,
    ModalComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="events-page">
      <!-- Header -->
      <div class="events-header">
        <div class="header-content">
          <div class="header-left">
            <h3>Eventos</h3>
            <p>Descubre actividades para tu mascota</p>
          </div>
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-value">{{ upcomingEvents().length }}</span>
              <span class="stat-label">Próximos</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ totalEvents() }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
        </div>
      </div>

      <div class="events-container">
        <!-- Filters Sidebar -->
        <aside class="filters-sidebar">
          <div class="filter-section">
            <h3>Búsqueda</h3>
            <div class="search-filter">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                placeholder="Buscar eventos..."
                [(ngModel)]="searchQuery"
                (ngModelChange)="applyFilters()"
              />
            </div>
          </div>

          <div class="filter-section">
            <h3>Tipo de Evento</h3>
            <div class="filter-options">
              @for (type of eventTypes; track type) {
                <div class="filter-option">
                  <p-checkbox
                    [inputId]="type.value"
                    [value]="type.value"
                    [(ngModel)]="selectedTypes"
                    (onChange)="applyFilters()"
                  />
                  <label [for]="type.value">{{ type.label }}</label>
                </div>
              }
            </div>
          </div>

          <div class="filter-section">
            <h3>Fecha</h3>
            <div class="filter-options">
              <div class="filter-option">
                <p-checkbox
                  inputId="thisWeek"
                  [(ngModel)]="filters.thisWeek"
                  (onChange)="applyFilters()"
                />
                <label for="thisWeek">Esta semana</label>
              </div>
              <div class="filter-option">
                <p-checkbox
                  inputId="thisMonth"
                  [(ngModel)]="filters.thisMonth"
                  (onChange)="applyFilters()"
                />
                <label for="thisMonth">Este mes</label>
              </div>
            </div>
          </div>

          <div class="filter-section">
            <h3>Precio</h3>
            <div class="filter-options">
              <div class="filter-option">
                <p-checkbox
                  inputId="freeOnly"
                  [(ngModel)]="filters.freeOnly"
                  (onChange)="applyFilters()"
                />
                <label for="freeOnly">Solo gratuitos</label>
              </div>
            </div>
          </div>

          <button class="clear-filters-btn" (click)="clearFilters()">
            <i class="pi pi-times"></i>
            Limpiar filtros
          </button>
        </aside>

        <!-- Main Content -->
        <main class="events-main">
          <!-- Results count -->
          <div class="results-header">
            <div class="results-count">
              {{ filteredEvents().length }} evento{{ filteredEvents().length !== 1 ? 's' : '' }} encontrado{{ filteredEvents().length !== 1 ? 's' : '' }}
            </div>
          </div>

          <!-- Events Grid -->
          <div class="events-grid">
            @for (event of filteredEvents(); track event.id) {
              <div class="event-card" (click)="openEventDetail(event)">
                <div class="event-image-container">
                  <img [src]="event.image" [alt]="event.title" />
                  <div class="event-type-badge">
                    <span class="type-badge" [class]="'type-' + event.type">
                      {{ getTypeLabel(event.type) }}
                    </span>
                  </div>
                  @if (event.isFree) {
                    <div class="free-badge">GRATIS</div>
                  }
                </div>
                <div class="event-content">
                  <div class="event-date-section">
                    <div class="event-date-badge">
                      <span class="event-day">{{ event.date | date:'dd' }}</span>
                      <span class="event-month">{{ event.date | date:'MMM' }}</span>
                    </div>
                    <div class="event-participants">
                      <i class="pi pi-users"></i>
                      <span>{{ event.participants }}{{ event.maxParticipants ? '/' + event.maxParticipants : '' }}</span>
                    </div>
                  </div>
                  <h3>{{ event.title }}</h3>
                  <p class="event-description">{{ event.description }}</p>
                  <div class="event-meta">
                    <div class="meta-item">
                      <i class="pi pi-map-marker"></i>
                      <span>{{ event.location }}</span>
                    </div>
                    <div class="meta-item">
                      <i class="pi pi-user"></i>
                      <span>{{ event.organizer }}</span>
                    </div>
                  </div>
                  <div class="event-footer">
                    <div class="event-price">
                      @if (event.isFree) {
                        <span class="price-free">Gratis</span>
                      } @else {
                        <span class="price-value">{{ event.price | currency:'EUR' }}</span>
                      }
                    </div>
                    <button
                      class="attend-btn"
                      [class.attending]="event.isAttending"
                      (click)="toggleAttendance(event)"
                    >
                      <i class="pi" [class.pi-check]="event.isAttending" [class.pi-plus]="!event.isAttending"></i>
                      {{ event.isAttending ? 'Asistiendo' : 'Asistir' }}
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>

          @if (filteredEvents().length === 0) {
            <div class="no-events">
              <i class="pi pi-calendar-times"></i>
              <p>No se encontraron eventos con estos criterios</p>
              <button class="clear-filters-btn" (click)="clearFilters()">
                Limpiar filtros
              </button>
            </div>
          }
        </main>
      </div>

      <!-- Event Detail Modal -->
      <app-modal
        [visible]="eventDetailVisible()"
        [showCancel]="false"
        (onHide)="eventDetailVisible.set(false)"
      >
        @if (selectedEvent(); as event) {
          <div class="event-detail">
            <div class="event-detail-image">
              <img [src]="event.image" [alt]="event.title" />
              <div class="event-type-overlay">
                <span class="type-badge-large" [class]="'type-' + event.type">
                  {{ getTypeLabel(event.type) }}
                </span>
              </div>
            </div>
            <div class="event-detail-info">
              <div class="event-detail-header">
                <h2>{{ event.title }}</h2>
                <div class="event-price-large">
                  @if (event.isFree) {
                    <span class="price-free-large">Gratis</span>
                  } @else {
                    <span class="price-value-large">{{ event.price | currency:'EUR' }}</span>
                  }
                </div>
              </div>

              <div class="event-meta-detailed">
                <div class="meta-item">
                  <i class="pi pi-calendar"></i>
                  <div class="meta-content">
                    <strong>Fecha</strong>
                    <span>{{ event.date | date:'dd/MM/yyyy' }}</span>
                    @if (event.endDate) {
                      <span> - {{ event.endDate | date:'dd/MM/yyyy' }}</span>
                    }
                  </div>
                </div>
                <div class="meta-item">
                  <i class="pi pi-clock"></i>
                  <div class="meta-content">
                    <strong>Horario</strong>
                    <span>{{ event.date | date:'HH:mm' }}</span>
                  </div>
                </div>
                <div class="meta-item">
                  <i class="pi pi-map-marker"></i>
                  <div class="meta-content">
                    <strong>Ubicación</strong>
                    <span>{{ event.location }}</span>
                    <span class="address">{{ event.address }}</span>
                  </div>
                </div>
                <div class="meta-item">
                  <i class="pi pi-user"></i>
                  <div class="meta-content">
                    <strong>Organizador</strong>
                    <span>{{ event.organizer }}</span>
                  </div>
                </div>
              </div>

              <div class="event-description">
                <h3>Sobre el evento</h3>
                <p>{{ event.description }}</p>
              </div>

              @if (event.agenda && event.agenda.length > 0) {
                <div class="event-agenda">
                  <h3>Agenda</h3>
                  <div class="agenda-list">
                    @for (item of event.agenda; track item.time) {
                      <div class="agenda-item">
                        <span class="agenda-time">{{ item.time }}</span>
                        <span class="agenda-activity">{{ item.activity }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

              @if (event.requirements && event.requirements.length > 0) {
                <div class="event-requirements">
                  <h3>Requisitos</h3>
                  <ul>
                    @for (req of event.requirements; track req) {
                      <li>{{ req }}</li>
                    }
                  </ul>
                </div>
              }

              <div class="event-participants-section">
                <h3>Participantes ({{ event.participants }}{{ event.maxParticipants ? '/' + event.maxParticipants : '' }})</h3>
                <div class="participants-avatars">
                  <p-avatarGroup>
                    <p-avatar *ngFor="let i of [1,2,3,4,5]" [image]="'https://i.pravatar.cc/150?img=' + (10 + i)" shape="circle" size="normal"></p-avatar>
                  </p-avatarGroup>
                </div>
              </div>

              <div class="event-actions">
                <button
                  class="attend-btn-large"
                  [class.attending]="event.isAttending"
                  (click)="toggleAttendance(event)"
                >
                  <i class="pi" [class.pi-check]="event.isAttending" [class.pi-plus]="!event.isAttending"></i>
                  {{ event.isAttending ? 'Cancelar Asistencia' : 'Asistir al Evento' }}
                </button>
              </div>
            </div>
          </div>
        }
      </app-modal>
    </div>
  `,
  styles: [`
    .events-page {
      min-height: 100vh;
      background: var(--surface-bg);
    }

    /* Header */
    .events-header {
      padding: 2rem 0;
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
      font-size: 2rem;
      font-weight: 700;
      color: white;
    }

    .header-left p {
      margin: 0.25rem 0 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 1rem;
    }

    .header-stats {
      display: flex;
      align-items: center;
      gap: 2rem;
      background: rgba(255, 255, 255, 0.15);
      padding: 1rem 2rem;
      border-radius: var(--radius-md);
      backdrop-filter: blur(10px);
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 400;
      color: white;
    }

    .stat-label {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .stat-divider {
      width: 1px;
      height: 3rem;
      background: rgba(255, 255, 255, 0.3);
    }

    /* Container */
    .events-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem 2rem;
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

    .search-filter {
      position: relative;
    }

    .search-filter i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
    }

    .search-filter input {
      width: 100%;
      padding: 0.625rem 1rem 0.625rem 2.5rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-sm);
      background: var(--surface-hover);
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

    /* Main Content */
    .events-main {
      min-height: 600px;
    }

    .results-header {
      margin-bottom: 1.5rem;
    }

    .results-count {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Events Grid */
    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .event-card {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      overflow: hidden;
      transition: all var(--transition-fast);
      cursor: pointer;
    }

    .event-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .event-image-container {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
      background: var(--surface-hover);
    }

    .event-image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--transition-normal);
    }

    .event-card:hover .event-image-container img {
      transform: scale(1.05);
    }

    .event-type-badge {
      position: absolute;
      top: 1rem;
      left: 1rem;
    }

    .type-badge {
      padding: 0.5rem 1rem;
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .type-walk {
      background: #10b981;
      color: white;
    }

    .type-fair {
      background: #3b82f6;
      color: white;
    }

    .type-contest {
      background: #f59e0b;
      color: white;
    }

    .type-meetup {
      background: #8b5cf6;
      color: white;
    }

    .type-workshop {
      background: #ec4899;
      color: white;
    }

    .type-charity {
      background: #ef4444;
      color: white;
    }

    .free-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: var(--red-500);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-full);
      font-weight: 700;
      font-size: 0.875rem;
    }

    .event-content {
      padding: 1.25rem;
    }

    .event-date-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .event-date-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--primary-color-light);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      min-width: 50px;
    }

    .event-day {
      font-weight: 700;
      font-size: 1.25rem;
      color: var(--primary-color);
    }

    .event-month {
      font-size: 0.7rem;
      text-transform: uppercase;
      color: var(--primary-color);
      font-weight: 600;
    }

    .event-participants {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .event-participants i {
      color: var(--primary-color);
    }

    .event-content h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .event-description {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .event-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .meta-item i {
      color: var(--primary-color);
      width: 1rem;
    }

    .event-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid var(--surface-border);
    }

    .event-price {
      font-weight: 600;
    }

    .price-free {
      color: #10b981;
      font-size: 1rem;
    }

    .price-value {
      font-size: 1.125rem;
      color: var(--primary-color);
    }

    .attend-btn {
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

    .attend-btn:hover {
      background: var(--primary-color-dark);
      transform: translateY(-2px);
    }

    .attend-btn.attending {
      background: #10b981;
    }

    .no-events {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--surface-card);
      border-radius: var(--radius-md);
    }

    .no-events i {
      font-size: 3rem;
      color: var(--text-tertiary);
      margin-bottom: 1rem;
    }

    .no-events p {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0 0 1rem;
    }

    /* Event Detail */
    .event-detail {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .event-detail-image {
      position: relative;
      border-radius: var(--radius-md);
      overflow: hidden;
      height: 100%;
      min-height: 400px;
    }

    .event-detail-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .event-type-overlay {
      position: absolute;
      top: 1rem;
      left: 1rem;
    }

    .type-badge-large {
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-full);
      font-weight: 700;
      font-size: 0.875rem;
      text-transform: uppercase;
    }

    .event-detail-info {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .event-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .event-detail-header h2 {
      margin: 0;
      font-size: 1.75rem;
      flex: 1;
    }

    .event-price-large {
      flex-shrink: 0;
    }

    .price-free-large {
      color: #10b981;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .price-value-large {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .event-meta-detailed {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .meta-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      font-size: 0.875rem;
    }

    .meta-item i {
      color: var(--primary-color);
      font-size: 1.25rem;
      margin-top: 0.125rem;
    }

    .meta-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .meta-content strong {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-tertiary);
    }

    .meta-content span {
      color: var(--text-primary);
    }

    .address {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .event-description h3,
    .event-agenda h3,
    .event-requirements h3,
    .event-participants-section h3 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      font-weight: 600;
    }

    .event-description p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .agenda-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .agenda-item {
      display: flex;
      gap: 1rem;
      padding: 0.75rem;
      background: var(--surface-hover);
      border-radius: var(--radius-sm);
    }

    .agenda-time {
      font-weight: 600;
      color: var(--primary-color);
      min-width: 60px;
    }

    .agenda-activity {
      flex: 1;
      font-size: 0.875rem;
      color: var(--text-primary);
    }

    .event-requirements ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .event-requirements li {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .participants-avatars {
      display: flex;
      align-items: center;
    }

    .event-actions {
      margin-top: auto;
    }

    .attend-btn-large {
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

    .attend-btn-large:hover {
      background: var(--primary-color-dark);
      transform: translateY(-2px);
    }

    .attend-btn-large.attending {
      background: #10b981;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .events-container {
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

      .header-stats {
        width: 100%;
        justify-content: center;
      }

      .events-grid {
        grid-template-columns: 1fr;
      }

      .event-detail {
        grid-template-columns: 1fr;
      }

      .event-detail-image {
        min-height: 250px;
      }

      .event-detail-header {
        flex-direction: column;
      }
    }
  `]
})
export class EventsPageComponent {
  private messageService = inject(MessageService);

  // Filters
  searchQuery = '';
  eventTypes = [
    { label: 'Paseo', value: 'walk' },
    { label: 'Feria', value: 'fair' },
    { label: 'Concurso', value: 'contest' },
    { label: 'Quedada', value: 'meetup' },
    { label: 'Taller', value: 'workshop' },
    { label: 'Benéfico', value: 'charity' }
  ];
  selectedTypes: string[] = [];
  filters = {
    thisWeek: false,
    thisMonth: false,
    freeOnly: false
  };

  // Event Detail
  eventDetailVisible = signal(false);
  selectedEvent = signal<Event | null>(null);

  // Computed
  totalEvents = computed(() => this.events().length);
  upcomingEvents = computed(() => {
    const now = new Date();
    return this.events().filter(e => e.date > now);
  });

  filteredEvents = computed(() => {
    let result = [...this.events()];

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.location.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (this.selectedTypes.length > 0) {
      result = result.filter(e => this.selectedTypes.includes(e.type));
    }

    // Date filters
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (this.filters.thisWeek) {
      result = result.filter(e => e.date >= now && e.date <= weekFromNow);
    }
    if (this.filters.thisMonth) {
      result = result.filter(e => e.date >= now && e.date <= monthFromNow);
    }

    // Price filter
    if (this.filters.freeOnly) {
      result = result.filter(e => e.isFree);
    }

    // Sort by date
    result.sort((a, b) => a.date.getTime() - b.date.getTime());

    return result;
  });

  // Events data
  events = signal<Event[]>([
    {
      id: '1',
      title: 'Paseo en el Parque',
      description: 'Paseo semanal con otros perros y sus dueños. Una oportunidad perfecta para socializar y hacer ejercicio al aire libre.',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      location: 'Parque Central',
      address: 'Calle Mayor, 123, Madrid',
      type: 'walk',
      category: 'Social',
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop',
      organizer: 'Madrid Dog Lovers',
      organizerImage: 'https://i.pravatar.cc/150?img=1',
      participants: 24,
      maxParticipants: 30,
      price: 0,
      isAttending: false,
      isFree: true,
      requirements: ['Perro vacunado', 'Correa obligatoria'],
      agenda: [
        { time: '10:00', activity: 'Recepción y registro' },
        { time: '10:30', activity: 'Paseo grupal por el parque' },
        { time: '12:00', activity: 'Juegos y actividades' }
      ]
    },
    {
      id: '2',
      title: 'Feria de Mascotas',
      description: 'Feria anual con productos, servicios y actividades para mascotas. Habrá stands, demostraciones y sorteos.',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: 'Recinto Ferial',
      address: 'Av. de la Feria, s/n, Barcelona',
      type: 'fair',
      category: 'Exposición',
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop',
      organizer: 'Feria Barcelona',
      organizerImage: 'https://i.pravatar.cc/150?img=2',
      participants: 156,
      price: 5,
      isAttending: true,
      isFree: false,
      requirements: ['Entrada general'],
      agenda: [
        { time: '09:00', activity: 'Apertura de puertas' },
        { time: '11:00', activity: 'Demostración de agility' },
        { time: '14:00', activity: 'Sorteos y concursos' }
      ]
    },
    {
      id: '3',
      title: 'Concurso de Belleza',
      description: 'Concurso de belleza canina donde tu mascota puede demostrar su carisma. Premios para las categorías más divertidas.',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      location: 'Centro Comercial Plaza',
      address: 'Calle Comercio, 45, Valencia',
      type: 'contest',
      category: 'Competencia',
      image: 'https://images.unsplash.com/photo-1587300003388-59608b8b3653?w=600&h=400&fit=crop',
      organizer: 'Valencia Pet Show',
      organizerImage: 'https://i.pravatar.cc/150?img=3',
      participants: 45,
      maxParticipants: 50,
      price: 10,
      isAttending: false,
      isFree: false,
      requirements: ['Inscripción previa', 'Mascota vacunada'],
      agenda: [
        { time: '10:00', activity: 'Registro de participantes' },
        { time: '11:00', activity: 'Ronda 1: Categoría pequeña' },
        { time: '12:30', activity: 'Ronda 2: Categoría grande' },
        { time: '14:00', activity: 'Entrega de premios' }
      ]
    },
    {
      id: '4',
      title: 'Quedada de Gatos',
      description: 'Encuentro para amantes de los gatos. Intercambio de experiencias, consejos y actividades felinas.',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      location: 'Café Miau',
      address: 'Calle Gatos, 8, Sevilla',
      type: 'meetup',
      category: 'Social',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=400&fit=crop',
      organizer: 'Cat Lovers Sevilla',
      organizerImage: 'https://i.pravatar.cc/150?img=4',
      participants: 18,
      maxParticipants: 25,
      price: 0,
      isAttending: false,
      isFree: true,
      requirements: []
    },
    {
      id: '5',
      title: 'Taller de Adiestramiento',
      description: 'Aprende técnicas básicas de adiestramiento canino con expertos. Sesión práctica con tu mascota.',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      location: 'Centro Canino',
      address: 'Polígono Industrial, 12, Madrid',
      type: 'workshop',
      category: 'Educación',
      image: 'https://images.unsplash.com/photo-1583511655857-1c1bb0b7dc2e?w=600&h=400&fit=crop',
      organizer: 'Dog Training Pro',
      organizerImage: 'https://i.pravatar.cc/150?img=5',
      participants: 12,
      maxParticipants: 15,
      price: 25,
      isAttending: false,
      isFree: false,
      requirements: ['Perro mayor de 6 meses', 'Collar y correa'],
      agenda: [
        { time: '09:00', activity: 'Teoría básica' },
        { time: '10:30', activity: 'Práctica con mascotas' },
        { time: '12:30', activity: 'Consultas individuales' }
      ]
    },
    {
      id: '6',
      title: 'Carrera Benéfica',
      description: 'Carrera solidaria para recaudar fondos para refugios de animales. Participa con tu mascota y ayuda a quienes lo necesitan.',
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      location: 'Parque del Retiro',
      address: 'Puerta de Alcalá, Madrid',
      type: 'charity',
      category: 'Benéfico',
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop',
      organizer: 'Help Animals Foundation',
      organizerImage: 'https://i.pravatar.cc/150?img=6',
      participants: 89,
      maxParticipants: 200,
      price: 15,
      isAttending: false,
      isFree: false,
      requirements: ['Inscripción previa', 'Buen estado físico'],
      agenda: [
        { time: '08:00', activity: 'Registro y calentamiento' },
        { time: '09:00', activity: 'Carrera 5K' },
        { time: '11:00', activity: 'Entrega de premios y sorteos' }
      ]
    }
  ]);

  // Methods
  applyFilters() {
    // Filters are applied automatically via computed property
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedTypes = [];
    this.filters = {
      thisWeek: false,
      thisMonth: false,
      freeOnly: false
    };
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se han restablecido todos los filtros'
    });
  }

  openEventDetail(event: Event) {
    this.selectedEvent.set(event);
    this.eventDetailVisible.set(true);
  }

  toggleAttendance(event: Event) {
    event.isAttending = !event.isAttending;
    event.participants += event.isAttending ? 1 : -1;

    this.messageService.add({
      severity: 'success',
      summary: event.isAttending ? 'Asistencia confirmada' : 'Asistencia cancelada',
      detail: event.isAttending
        ? `Te has inscrito a ${event.title}`
        : `Has cancelado tu asistencia a ${event.title}`
    });
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'walk':
        return 'Paseo';
      case 'fair':
        return 'Feria';
      case 'contest':
        return 'Concurso';
      case 'meetup':
        return 'Quedada';
      case 'workshop':
        return 'Taller';
      case 'charity':
        return 'Benéfico';
      default:
        return type;
    }
  }
}
