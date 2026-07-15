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
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterLink } from '@angular/router';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: 'male' | 'female';
  location: string;
  shelter: string;
  shelterImage: string;
  description: string;
  personality: string[];
  image: string;
  images: string[];
  status: 'available' | 'pending' | 'adopted';
  vaccinated: boolean;
  sterilized: boolean;
  microchipped: boolean;
  arrivalDate: Date;
}

@Component({
  selector: 'app-adoptions-page',
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
    ToastModule,
    RouterLink,
  ],
  providers: [MessageService],
  template: `
    <div class="adoptions-page">
      <!-- Header -->
      <div class="adoptions-header">
        <div class="header-content">
          <div class="header-left">
            <h3>Adopta una Mascota</h3>
            <p>Encuentra a tu nuevo mejor amigo</p>
          </div>
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-value">{{ availablePets().length }}</span>
              <span class="stat-label">Disponibles</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ totalPets() }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
        </div>
      </div>

      <div class="adoptions-container">
        <!-- Filters Sidebar -->
        <aside class="filters-sidebar">
          <div class="filter-section">
            <h3>Búsqueda</h3>
            <div class="search-filter">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                placeholder="Buscar por nombre..."
                [(ngModel)]="searchQuery"
                (ngModelChange)="applyFilters()"
              />
            </div>
          </div>

          <div class="filter-section">
            <h3>Especie</h3>
            <div class="filter-options">
              @for (species of speciesOptions; track species) {
                <div class="filter-option">
                  <p-checkbox
                    [inputId]="species"
                    [value]="species"
                    [(ngModel)]="selectedSpecies"
                    (onChange)="applyFilters()"
                  />
                  <label [for]="species">{{ species }}</label>
                </div>
              }
            </div>
          </div>

          <div class="filter-section">
            <h3>Género</h3>
            <div class="filter-options">
              <div class="filter-option">
                <p-checkbox
                  inputId="male"
                  [value]="'male'"
                  [(ngModel)]="selectedGenders"
                  (onChange)="applyFilters()"
                />
                <label for="male">Macho</label>
              </div>
              <div class="filter-option">
                <p-checkbox
                  inputId="female"
                  [value]="'female'"
                  [(ngModel)]="selectedGenders"
                  (onChange)="applyFilters()"
                />
                <label for="female">Hembra</label>
              </div>
            </div>
          </div>

          <div class="filter-section">
            <h3>Características</h3>
            <div class="filter-options">
              <div class="filter-option">
                <p-checkbox
                  inputId="vaccinated"
                  [(ngModel)]="filters.vaccinated"
                  (onChange)="applyFilters()"
                />
                <label for="vaccinated">Vacunado</label>
              </div>
              <div class="filter-option">
                <p-checkbox
                  inputId="sterilized"
                  [(ngModel)]="filters.sterilized"
                  (onChange)="applyFilters()"
                />
                <label for="sterilized">Esterilizado</label>
              </div>
              <div class="filter-option">
                <p-checkbox
                  inputId="microchipped"
                  [(ngModel)]="filters.microchipped"
                  (onChange)="applyFilters()"
                />
                <label for="microchipped">Microchip</label>
              </div>
            </div>
          </div>

          <button class="clear-filters-btn" (click)="clearFilters()">
            <i class="pi pi-times"></i>
            Limpiar filtros
          </button>
        </aside>

        <!-- Main Content -->
        <main class="pets-main">
          <!-- Results count -->
          <div class="results-header">
            <div class="results-count">
              {{ filteredPets().length }} animal{{ filteredPets().length !== 1 ? 'es' : '' }} encontrado{{ filteredPets().length !== 1 ? 's' : '' }}
            </div>
          </div>

          <!-- Pets Grid -->
          <div class="pets-grid">
            @for (pet of filteredPets(); track pet.id) {
              <div class="pet-card" (click)="openPetDetail(pet)">
                <div class="pet-image-container">
                  <img [src]="pet.image" [alt]="pet.name" />
                  @if (pet.status !== 'available') {
                    <div class="pet-status-overlay">
                      <span class="status-badge" [class]="'status-' + pet.status">
                        {{ getStatusLabel(pet.status) }}
                      </span>
                    </div>
                  }
                </div>
                <div class="pet-info">
                  <div class="pet-header">
                    <h3>{{ pet.name }}</h3>
                    <span class="pet-gender">
                      <i class="pi" [class.pi-mars]="pet.gender === 'male'" [class.pi-venus]="pet.gender === 'female'"></i>
                    </span>
                  </div>
                  <p class="pet-breed">{{ pet.breed }}</p>
                  <p class="pet-age">{{ pet.age }}</p>
                  <div class="pet-tags">
                    @if (pet.vaccinated) {
                      <span class="pet-tag">Vacunado</span>
                    }
                    @if (pet.sterilized) {
                      <span class="pet-tag">Esterilizado</span>
                    }
                    @if (pet.microchipped) {
                      <span class="pet-tag">Microchip</span>
                    }
                  </div>
                  <div class="pet-location">
                    <i class="pi pi-map-marker"></i>
                    <span>{{ pet.location }}</span>
                  </div>
                </div>
              </div>
            }
          </div>

          @if (filteredPets().length === 0) {
            <div class="no-pets">
              <i class="pi pi-pets"></i>
              <p>No se encontraron animales con estos criterios</p>
              <button class="clear-filters-btn" (click)="clearFilters()">
                Limpiar filtros
              </button>
            </div>
          }
        </main>
      </div>

      <!-- Pet Detail Modal -->
      <p-dialog
        [(visible)]="petDetailVisible"
        [modal]="true"
        [style]="{width: '900px'}"
        [draggable]="false"
        [resizable]="false"
      >
        @if (selectedPet(); as pet) {
          <div class="pet-detail">
            <div class="pet-detail-image">
              <img [src]="pet.image" [alt]="pet.name" />
            </div>
            <div class="pet-detail-info">
              <div class="pet-detail-header">
                <div>
                  <h2>{{ pet.name }}</h2>
                  <p class="pet-breed-detail">{{ pet.breed }}</p>
                </div>
                <span class="pet-gender-icon">
                  <i class="pi" [class.pi-mars]="pet.gender === 'male'" [class.pi-venus]="pet.gender === 'female'"></i>
                </span>
              </div>

              <div class="pet-meta">
                <div class="meta-item">
                  <i class="pi pi-calendar"></i>
                  <span>{{ pet.age }}</span>
                </div>
                <div class="meta-item">
                  <i class="pi pi-map-marker"></i>
                  <span>{{ pet.location }}</span>
                </div>
                <div class="meta-item">
                  <i class="pi pi-building"></i>
                  <span>{{ pet.shelter }}</span>
                </div>
              </div>

              <div class="pet-characteristics">
                <h3>Características</h3>
                <div class="characteristics-list">
                  <span class="characteristic-item" [class.active]="pet.vaccinated">
                    <i class="pi pi-check-circle"></i>
                    Vacunado
                  </span>
                  <span class="characteristic-item" [class.active]="pet.sterilized">
                    <i class="pi pi-check-circle"></i>
                    Esterilizado
                  </span>
                  <span class="characteristic-item" [class.active]="pet.microchipped">
                    <i class="pi pi-check-circle"></i>
                    Microchip
                  </span>
                </div>
              </div>

              <div class="pet-description">
                <h3>Sobre {{ pet.name }}</h3>
                <p>{{ pet.description }}</p>
              </div>

              <div class="pet-personality">
                <h3>Personalidad</h3>
                <div class="personality-tags">
                  @for (trait of pet.personality; track trait) {
                    <span class="personality-tag">{{ trait }}</span>
                  }
                </div>
              </div>

              <div class="pet-actions">
                @if (pet.status === 'available') {
                  <button class="adopt-btn" (click)="requestAdoption(pet)">
                    <i class="pi pi-heart"></i>
                    Solicitar Adopción
                  </button>
                } @else if (pet.status === 'pending') {
                  <button class="pending-btn" disabled>
                    <i class="pi pi-clock"></i>
                    Solicitud Pendiente
                  </button>
                } @else {
                  <button class="adopted-btn" disabled>
                    <i class="pi pi-check"></i>
                    Adoptado
                  </button>
                }
              </div>
            </div>
          </div>
        }
      </p-dialog>
    </div>
  `,
  styles: [`
    .adoptions-page {
      min-height: 100vh;
      background: var(--surface-bg);
    }

    /* Header */
    .adoptions-header {
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
    .adoptions-container {
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
    .pets-main {
      min-height: 600px;
    }

    .results-header {
      margin-bottom: 1.5rem;
    }

    .results-count {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Pets Grid */
    .pets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .pet-card {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      overflow: hidden;
      transition: all var(--transition-fast);
      cursor: pointer;
    }

    .pet-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .pet-image-container {
      position: relative;
      width: 100%;
      height: 250px;
      overflow: hidden;
      background: var(--surface-hover);
    }

    .pet-image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--transition-normal);
    }

    .pet-card:hover .pet-image-container img {
      transform: scale(1.05);
    }

    .pet-status-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-badge {
      padding: 0.5rem 1.5rem;
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: 0.875rem;
    }

    .status-pending {
      background: #fbbf24;
      color: white;
    }

    .status-adopted {
      background: #10b981;
      color: white;
    }

    .pet-info {
      padding: 1.25rem;
    }

    .pet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .pet-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .pet-gender {
      font-size: 1.25rem;
      color: var(--primary-color);
    }

    .pet-breed {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .pet-age {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .pet-tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .pet-tag {
      padding: 0.25rem 0.5rem;
      background: var(--primary-color-light);
      color: var(--primary-color);
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 500;
    }

    .pet-location {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-tertiary);
    }

    .pet-location i {
      color: var(--primary-color);
    }

    .no-pets {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--surface-card);
      border-radius: var(--radius-md);
    }

    .no-pets i {
      font-size: 3rem;
      color: var(--text-tertiary);
      margin-bottom: 1rem;
    }

    .no-pets p {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0 0 1rem;
    }

    /* Pet Detail */
    .pet-detail {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .pet-detail-image {
      border-radius: var(--radius-md);
      overflow: hidden;
      height: 100%;
      min-height: 400px;
    }

    .pet-detail-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .pet-detail-info {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .pet-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .pet-detail-header h2 {
      margin: 0;
      font-size: 1.75rem;
    }

    .pet-breed-detail {
      margin: 0.5rem 0 0;
      font-size: 1rem;
      color: var(--text-secondary);
    }

    .pet-gender-icon {
      font-size: 2rem;
      color: var(--primary-color);
    }

    .pet-meta {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .meta-item i {
      color: var(--primary-color);
      width: 1.25rem;
    }

    .pet-characteristics h3,
    .pet-description h3,
    .pet-personality h3 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      font-weight: 600;
    }

    .characteristics-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .characteristic-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-tertiary);
    }

    .characteristic-item.active {
      color: #10b981;
    }

    .characteristic-item i {
      font-size: 1rem;
    }

    .pet-description p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .personality-tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .personality-tag {
      padding: 0.5rem 1rem;
      background: var(--primary-color-light);
      color: var(--primary-color);
      border-radius: var(--radius-full);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .pet-actions {
      margin-top: auto;
    }

    .adopt-btn,
    .pending-btn,
    .adopted-btn {
      width: 100%;
      padding: 1rem;
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

    .adopt-btn {
      background: var(--primary-color);
      color: white;
    }

    .adopt-btn:hover {
      background: var(--primary-color-dark);
      transform: translateY(-2px);
    }

    .pending-btn {
      background: #fbbf24;
      color: white;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .adopted-btn {
      background: #10b981;
      color: white;
      cursor: not-allowed;
      opacity: 0.7;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .adoptions-container {
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

      .pets-grid {
        grid-template-columns: 1fr;
      }

      .pet-detail {
        grid-template-columns: 1fr;
      }

      .pet-detail-image {
        min-height: 250px;
      }
    }
  `]
})
export class AdoptionsPageComponent {
  private messageService = inject(MessageService);

  // Filters
  searchQuery = '';
  speciesOptions = ['Perro', 'Gato', 'Ave', 'Conejo', 'Otro'];
  selectedSpecies: string[] = [];
  selectedGenders: string[] = [];
  filters = {
    vaccinated: false,
    sterilized: false,
    microchipped: false
  };

  // Pet Detail
  petDetailVisible = signal(false);
  selectedPet = signal<Pet | null>(null);

  // Computed
  totalPets = computed(() => this.pets().length);
  availablePets = computed(() => this.pets().filter(p => p.status === 'available'));

  filteredPets = computed(() => {
    let result = [...this.pets()];

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.breed.toLowerCase().includes(query)
      );
    }

    // Species filter
    if (this.selectedSpecies.length > 0) {
      result = result.filter(p => this.selectedSpecies.includes(p.species));
    }

    // Gender filter
    if (this.selectedGenders.length > 0) {
      result = result.filter(p => this.selectedGenders.includes(p.gender));
    }

    // Characteristics filters
    if (this.filters.vaccinated) {
      result = result.filter(p => p.vaccinated);
    }
    if (this.filters.sterilized) {
      result = result.filter(p => p.sterilized);
    }
    if (this.filters.microchipped) {
      result = result.filter(p => p.microchipped);
    }

    return result;
  });

  // Pets data
  pets = signal<Pet[]>([
    {
      id: '1',
      name: 'Toby',
      species: 'Perro',
      breed: 'Labrador Retriever',
      age: '2 años',
      gender: 'male',
      location: 'Madrid, España',
      shelter: 'Refugio Esperanza',
      shelterImage: 'https://i.pravatar.cc/150?img=1',
      description: 'Toby es un perro muy cariñoso y juguetón. Le encanta correr en el parque y jugar con pelotas. Es muy bueno con los niños y otros animales. Está buscando una familia activa que le pueda dar mucho amor y ejercicio.',
      personality: ['Juguetón', 'Cariñoso', 'Energético', 'Sociable'],
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1587300003388-59608b8b3653?w=600&h=400&fit=crop'
      ],
      status: 'available',
      vaccinated: true,
      sterilized: true,
      microchipped: true,
      arrivalDate: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Coco',
      species: 'Gato',
      breed: 'Mestizo',
      age: '1 año',
      gender: 'female',
      location: 'Barcelona, España',
      shelter: 'Protección Animal',
      shelterImage: 'https://i.pravatar.cc/150?img=2',
      description: 'Coco es una gata tranquila y dulce. Le gusta pasar las tardes en el sofá y recibir caricias. Es un poco tímida al principio, pero una vez que confía en ti, es muy cariñosa. Ideal para hogares tranquilos.',
      personality: ['Tranquilo', 'Cariñoso', 'Independiente', 'Tímido'],
      image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=400&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=400&fit=crop'
      ],
      status: 'available',
      vaccinated: true,
      sterilized: true,
      microchipped: false,
      arrivalDate: new Date('2024-02-01')
    },
    {
      id: '3',
      name: 'Rocky',
      species: 'Perro',
      breed: 'Pastor Alemán',
      age: '3 años',
      gender: 'male',
      location: 'Valencia, España',
      shelter: 'Huellas Solidarias',
      shelterImage: 'https://i.pravatar.cc/150?img=3',
      description: 'Rocky es un perro inteligente y leal. Necesita un dueño con experiencia que pueda dedicarle tiempo a su educación y ejercicio. Es muy protector y sería un excelente compañero para una familia con niños mayores.',
      personality: ['Inteligente', 'Leal', 'Protector', 'Activo'],
      image: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600&h=400&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600&h=400&fit=crop'
      ],
      status: 'pending',
      vaccinated: true,
      sterilized: true,
      microchipped: true,
      arrivalDate: new Date('2024-01-20')
    },
    {
      id: '4',
      name: 'Luna',
      species: 'Gato',
      breed: 'Siamés',
      age: '6 meses',
      gender: 'female',
      location: 'Sevilla, España',
      shelter: 'Amigos de los Animales',
      shelterImage: 'https://i.pravatar.cc/150?img=4',
      description: 'Luna es una gatita curiosa y juguetona. Le encanta explorar y jugar con todo lo que se mueve. Es muy social y se lleva bien con otros gatos. Busca una familia que le pueda dar atención y juegos.',
      personality: ['Curioso', 'Juguetón', 'Social', 'Ágil'],
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=400&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=400&fit=crop'
      ],
      status: 'available',
      vaccinated: true,
      sterilized: false,
      microchipped: true,
      arrivalDate: new Date('2024-03-01')
    },
    {
      id: '5',
      name: 'Max',
      species: 'Perro',
      breed: 'Bulldog Francés',
      age: '4 años',
      gender: 'male',
      location: 'Madrid, España',
      shelter: 'Refugio Esperanza',
      shelterImage: 'https://i.pravatar.cc/150?img=5',
      description: 'Max es un perro adorable y tranquilo. Le gusta dormir largas siestas y recibir mimos. Es perfecto para apartamentos y para personas que buscan un compañero relajado. Ya ha sido adoptado pero queremos darle otra oportunidad.',
      personality: ['Tranquilo', 'Cariñoso', 'Divertido', 'Leal'],
      image: 'https://images.unsplash.com/photo-1583511655857-1c1bb0b7dc2e?w=600&h=400&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1583511655857-1c1bb0b7dc2e?w=600&h=400&fit=crop'
      ],
      status: 'adopted',
      vaccinated: true,
      sterilized: true,
      microchipped: true,
      arrivalDate: new Date('2024-01-10')
    },
    {
      id: '6',
      name: 'Mia',
      species: 'Gato',
      breed: 'Persa',
      age: '2 años',
      gender: 'female',
      location: 'Barcelona, España',
      shelter: 'Protección Animal',
      shelterImage: 'https://i.pravatar.cc/150?img=6',
      description: 'Mia es una gata elegante y serena. Requiere cuidados regulares de su pelaje, pero te recompensará con su compañía tranquila. Es ideal para personas que buscan un gato de compañía relajado.',
      personality: ['Sereno', 'Elegante', 'Independiente', 'Cariñoso'],
      image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&h=400&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&h=400&fit=crop'
      ],
      status: 'available',
      vaccinated: true,
      sterilized: true,
      microchipped: true,
      arrivalDate: new Date('2024-02-15')
    }
  ]);

  // Methods
  applyFilters() {
    // Filters are applied automatically via computed property
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedSpecies = [];
    this.selectedGenders = [];
    this.filters = {
      vaccinated: false,
      sterilized: false,
      microchipped: false
    };
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se han restablecido todos los filtros'
    });
  }

  openPetDetail(pet: Pet) {
    this.selectedPet.set(pet);
    this.petDetailVisible.set(true);
  }

  requestAdoption(pet: Pet) {
    this.messageService.add({
      severity: 'success',
      summary: 'Solicitud enviada',
      detail: `Tu solicitud de adopción para ${pet.name} ha sido enviada al refugio`
    });
    this.petDetailVisible.set(false);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'pending':
        return 'Pendiente';
      case 'adopted':
        return 'Adoptado';
      default:
        return status;
    }
  }
}
