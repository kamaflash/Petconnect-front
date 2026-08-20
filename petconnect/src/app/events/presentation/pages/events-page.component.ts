import { Component, signal, computed, inject, OnInit } from '@angular/core';
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
import { PetFeedGridComponent, FilterConfig, ColumnConfig } from '../../../adoptions/presentation/components/pet-feed-grid/pet-feed-grid.component';

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
    PetFeedGridComponent,
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

      <app-pet-feed-grid
        [items]="events()"
        itemLabel="eventos"
        itemKeyField="id"
        [filterConfigs]="eventFilterConfigs"
        [columnConfigs]="eventColumnConfigs"
        [initialFilters]="eventFilters()"
        (filtersChange)="onFiltersChange($event)"
        (itemClick)="openEventDetail($event)"
      />

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

    /* Mobile */
    @media (max-width: 768px) {
      .event-detail {
        grid-template-columns: 1fr;
      }
      .event-detail-image {
        min-height: 250px;
      }
    }
  `]
})
export class EventsPageComponent implements OnInit {
  private messageService = inject(MessageService);

  // Events data
  events = signal<Event[]>([]);

  // Event Detail
  eventDetailVisible = signal(false);
  selectedEvent = signal<Event | null>(null);

  // Filters
  eventFilters = signal<Record<string, any>>({});

  // Generic component configs
  eventFilterConfigs: FilterConfig[] = [
    {
      type: 'text',
      key: 'searchQuery',
      label: 'Búsqueda',
      placeholder: 'Buscar eventos...'
    },
    {
      type: 'checkbox',
      key: 'eventTypes',
      label: 'Tipo de Evento',
      options: [
        { label: 'Paseo', value: 'walk' },
        { label: 'Feria', value: 'fair' },
        { label: 'Concurso', value: 'contest' },
        { label: 'Quedada', value: 'meetup' },
        { label: 'Taller', value: 'workshop' },
        { label: 'Benéfico', value: 'charity' }
      ]
    },
    {
      type: 'checkbox',
      key: 'freeOnly',
      label: 'Precio',
      options: [
        { label: 'Solo gratuitos', value: 'true' }
      ]
    }
  ];

  eventColumnConfigs: ColumnConfig[] = [
    {
      key: 'image',
      label: 'Imagen',
      type: 'image'
    },
    {
      key: 'title',
      label: 'Título',
      type: 'text'
    },
    {
      key: 'date',
      label: 'Fecha',
      type: 'date'
    },
    {
      key: 'location',
      label: 'Ubicación',
      type: 'text',
      icon: 'pi-map-marker'
    },
    {
      key: 'price',
      label: 'Precio',
      type: 'text'
    }
  ];

  // Computed
  totalEvents = computed(() => this.events().length);
  upcomingEvents = computed(() => {
    const now = new Date();
    return this.events().filter(event => new Date(event.date) > now);
  });

  ngOnInit(): void {
    this.loadEvents();
  }

  onFiltersChange(filters: Record<string, any>): void {
    this.eventFilters.set(filters);
  }

  loadEvents(): void {
    // Mock data - replace with actual service call
    this.events.set([
      {
        id: '1',
        title: 'Paseo de Perros',
        description: 'Paseo grupal por el parque',
        date: new Date('2025-07-25T10:00:00'),
        location: 'Parque Central',
        address: 'Calle Principal 123',
        type: 'walk',
        category: 'Social',
        image: 'https://i.pravatar.cc/300',
        organizer: 'Refugio Esperanza',
        organizerImage: 'https://i.pravatar.cc/150',
        participants: 15,
        maxParticipants: 30,
        price: 0,
        isAttending: false,
        isFree: true
      },
      {
        id: '2',
        title: 'Feria de Adopción',
        description: 'Evento de adopción de mascotas',
        date: new Date('2025-08-01T09:00:00'),
        location: 'Centro Comercial',
        address: 'Av. Libertad 456',
        type: 'fair',
        category: 'Adopción',
        image: 'https://i.pravatar.cc/300',
        organizer: 'Protectora Animales',
        organizerImage: 'https://i.pravatar.cc/150',
        participants: 50,
        maxParticipants: 100,
        price: 0,
        isAttending: true,
        isFree: true
      },
      {
        id: '3',
        title: 'Concurso de Obediencia',
        description: 'Demuestra las habilidades de tu mascota',
        date: new Date('2025-08-15T14:00:00'),
        location: 'Arena Canina',
        address: 'Polígono Deportivo',
        type: 'contest',
        category: 'Competencia',
        image: 'https://i.pravatar.cc/300',
        organizer: 'Club Canino',
        organizerImage: 'https://i.pravatar.cc/150',
        participants: 25,
        maxParticipants: 50,
        price: 10,
        isAttending: false,
        isFree: false
      }
    ]);
  }

  openEventDetail(event: Event): void {
    this.selectedEvent.set(event);
    this.eventDetailVisible.set(true);
  }

  toggleAttendance(event: Event): void {
    this.events.update(events =>
      events.map(e =>
        e.id === event.id ? { ...e, isAttending: !e.isAttending } : e
      )
    );
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
